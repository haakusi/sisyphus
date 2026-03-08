/**
 * Artifact Drift Checker
 *
 * Detects version-pin drift between canonical sources and derived artifacts.
 */
import { existsSync } from 'fs';
import { promises as fs } from 'fs';
import { join, relative } from 'path';
const VERSION_KEY_PATTERN = /(openapi_version|architecture_version|prd_version|doc_version)\s*:\s*['"]?([^\n'"#]+)['"]?/gi;
async function readIfExists(path) {
    if (!existsSync(path)) {
        return null;
    }
    try {
        return await fs.readFile(path, 'utf-8');
    }
    catch {
        return null;
    }
}
function extractFirst(pattern, content) {
    if (!content) {
        return null;
    }
    const match = content.match(pattern);
    if (!match || match.length < 2) {
        return null;
    }
    return match[1].trim();
}
async function detectCanonicalVersions(projectRoot) {
    const openapiCandidates = [
        join(projectRoot, 'specs', 'api', 'openapi.yaml'),
        join(projectRoot, 'openapi.yaml'),
    ];
    const architectureCandidates = [
        join(projectRoot, 'docs', 'architecture', 'ta-mvp-architecture.md'),
        join(projectRoot, 'docs', 'architecture', 'ta-system-architecture.md'),
        join(projectRoot, 'architecture', 'README.md'),
    ];
    const prdCandidates = [
        join(projectRoot, 'specs', 'prd', 'DOCUMENT-INDEX.md'),
        join(projectRoot, 'specs', 'prd', 'README.md'),
    ];
    let openapiVersion = null;
    for (const candidate of openapiCandidates) {
        const content = await readIfExists(candidate);
        openapiVersion = extractFirst(/^\s*version\s*:\s*['"]?([^\s'"\n]+)/m, content);
        if (openapiVersion)
            break;
    }
    let architectureVersion = null;
    for (const candidate of architectureCandidates) {
        const content = await readIfExists(candidate);
        architectureVersion =
            extractFirst(/\*\*Version\*\*\s*\|\s*([^\|\n]+)/m, content) ||
                extractFirst(/\bVersion\s*:\s*([0-9A-Za-z._-]+)/m, content);
        if (architectureVersion)
            break;
    }
    let prdVersion = null;
    for (const candidate of prdCandidates) {
        const content = await readIfExists(candidate);
        prdVersion =
            extractFirst(/\bPRD\s*Version\s*:\s*([0-9A-Za-z._-]+)/im, content) ||
                extractFirst(/\bversion\s*:\s*([0-9A-Za-z._-]+)/im, content) ||
                extractFirst(/\bprd_version\s*:\s*([0-9A-Za-z._-]+)/im, content);
        if (prdVersion)
            break;
    }
    return {
        openapiVersion,
        architectureVersion,
        prdVersion,
    };
}
async function walkFiles(root, relativeRoot, files) {
    const entries = await fs.readdir(root, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') {
            continue;
        }
        const full = join(root, entry.name);
        if (entry.isDirectory()) {
            await walkFiles(full, relativeRoot, files);
            continue;
        }
        if (!entry.isFile()) {
            continue;
        }
        if (!/\.(md|yaml|yml)$/i.test(entry.name)) {
            continue;
        }
        files.push(relative(relativeRoot, full));
    }
}
async function collectPinnedArtifacts(projectRoot) {
    const searchRoots = [
        join(projectRoot, 'docs'),
        join(projectRoot, 'specs'),
    ];
    const files = [];
    for (const root of searchRoots) {
        if (!existsSync(root)) {
            continue;
        }
        await walkFiles(root, projectRoot, files);
    }
    const artifacts = [];
    for (const relPath of files) {
        const fullPath = join(projectRoot, relPath);
        const content = await readIfExists(fullPath);
        if (!content) {
            continue;
        }
        let openapiVersion = null;
        let architectureVersion = null;
        let prdVersion = null;
        let docVersion = null;
        for (const match of content.matchAll(VERSION_KEY_PATTERN)) {
            const key = (match[1] || '').trim().toLowerCase();
            const value = (match[2] || '').trim();
            if (!value)
                continue;
            if (key === 'openapi_version')
                openapiVersion = value;
            if (key === 'architecture_version')
                architectureVersion = value;
            if (key === 'prd_version')
                prdVersion = value;
            if (key === 'doc_version')
                docVersion = value;
        }
        if (!openapiVersion && !architectureVersion && !prdVersion && !docVersion) {
            continue;
        }
        artifacts.push({
            filePath: relPath,
            openapiVersion,
            architectureVersion,
            prdVersion,
            docVersion,
        });
    }
    return artifacts;
}
function buildIssues(canonical, artifacts) {
    const issues = [];
    for (const artifact of artifacts) {
        if (artifact.openapiVersion &&
            canonical.openapiVersion &&
            artifact.openapiVersion !== canonical.openapiVersion) {
            issues.push({
                filePath: artifact.filePath,
                field: 'openapi_version',
                pinnedVersion: artifact.openapiVersion,
                canonicalVersion: canonical.openapiVersion,
                severity: 'high',
                message: `Pinned openapi_version (${artifact.openapiVersion}) differs from canonical (${canonical.openapiVersion}).`,
            });
        }
        if (artifact.architectureVersion &&
            canonical.architectureVersion &&
            artifact.architectureVersion !== canonical.architectureVersion) {
            issues.push({
                filePath: artifact.filePath,
                field: 'architecture_version',
                pinnedVersion: artifact.architectureVersion,
                canonicalVersion: canonical.architectureVersion,
                severity: 'high',
                message: `Pinned architecture_version (${artifact.architectureVersion}) differs from canonical (${canonical.architectureVersion}).`,
            });
        }
        if (artifact.prdVersion && canonical.prdVersion && artifact.prdVersion !== canonical.prdVersion) {
            issues.push({
                filePath: artifact.filePath,
                field: 'prd_version',
                pinnedVersion: artifact.prdVersion,
                canonicalVersion: canonical.prdVersion,
                severity: 'medium',
                message: `Pinned prd_version (${artifact.prdVersion}) differs from canonical (${canonical.prdVersion}).`,
            });
        }
    }
    return issues;
}
export async function analyzeArtifactDrift(projectRoot) {
    const canonical = await detectCanonicalVersions(projectRoot);
    const artifacts = await collectPinnedArtifacts(projectRoot);
    const issues = buildIssues(canonical, artifacts);
    return {
        generatedAt: new Date().toISOString(),
        projectRoot,
        canonical,
        scannedFiles: artifacts.length,
        pinnedArtifacts: artifacts.length,
        issues,
    };
}
//# sourceMappingURL=drift-check.js.map