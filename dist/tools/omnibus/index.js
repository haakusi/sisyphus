/**
 * Omnibus Tools
 *
 * Cross-cutting tools for memory, policy, context packs, and artifact drift checks.
 */
import { cwd } from 'process';
import { analyzeArtifactDrift } from '../../artifacts/index.js';
import { buildContextPack, formatContextPackMarkdown } from '../../context/context-pack.js';
import { getMemoryStore } from '../../memory/index.js';
import { buildPolicyManifest } from '../../policy/index.js';
function getProjectRoot(args) {
    return args?.projectRoot || cwd();
}
export async function memoryAppend(args) {
    try {
        if (!args || !args.kind || !args.content) {
            return {
                success: false,
                error: 'Missing required fields: kind, content',
            };
        }
        const projectRoot = getProjectRoot(args);
        const store = getMemoryStore(projectRoot);
        const record = await store.append({
            kind: args.kind,
            content: args.content,
            scope: args.scope,
            tags: args.tags,
            confidence: args.confidence,
            sourceRef: args.sourceRef,
            sessionId: args.sessionId,
            metadata: args.metadata,
        });
        if (!record) {
            return {
                success: false,
                error: 'Memory store is disabled.',
            };
        }
        return {
            success: true,
            formatted: `Stored memory record ${record.id} (${record.kind}/${record.scope}).`,
            data: record,
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
export async function memorySearch(args = {}) {
    try {
        const projectRoot = getProjectRoot(args);
        const store = getMemoryStore(projectRoot);
        const results = await store.search({
            query: args.query,
            limit: args.limit,
            kinds: args.kinds,
            scopes: args.scopes,
            minConfidence: args.minConfidence,
        });
        const lines = results.map((record, idx) => `${idx + 1}. [${record.kind}/${record.scope}] ${record.content.slice(0, 120)}`);
        return {
            success: true,
            formatted: lines.length > 0 ? lines.join('\n') : 'No memory records found.',
            data: results,
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
export async function memoryCompact(args = {}) {
    try {
        const projectRoot = getProjectRoot(args);
        const store = getMemoryStore(projectRoot);
        let summary = args.summary || '';
        if (!summary && args.includeContextPack !== false) {
            const pack = await buildContextPack({
                projectRoot,
                taskDescription: args.taskDescription,
            });
            summary = formatContextPackMarkdown(pack);
        }
        if (!summary) {
            return {
                success: false,
                error: 'No summary provided for compaction.',
            };
        }
        const record = await store.compact(summary, {
            scope: args.scope || 'session',
            tags: args.tags,
            sessionId: args.sessionId,
            sourceRef: args.sourceRef,
            metadata: {
                taskDescription: args.taskDescription || '',
            },
        });
        if (!record) {
            return {
                success: false,
                error: 'Memory store is disabled.',
            };
        }
        return {
            success: true,
            formatted: `Stored compaction snapshot ${record.id}.`,
            data: record,
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
export async function artifactDriftStatus(args = {}) {
    try {
        const projectRoot = getProjectRoot(args);
        const report = await analyzeArtifactDrift(projectRoot);
        const high = report.issues.filter((issue) => issue.severity === 'high').length;
        const medium = report.issues.filter((issue) => issue.severity === 'medium').length;
        return {
            success: true,
            formatted: `Artifact drift report\n` +
                `- Pinned artifacts: ${report.pinnedArtifacts}\n` +
                `- Issues: ${report.issues.length} (high: ${high}, medium: ${medium})`,
            data: report,
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
export async function policyActiveRules(args = {}) {
    try {
        const projectRoot = getProjectRoot(args);
        const manifest = await buildPolicyManifest(projectRoot);
        const limit = Math.max(1, args.limit || 20);
        const mustRules = manifest.rules.filter((rule) => rule.severity === 'must').slice(0, limit);
        const lines = mustRules.map((rule, idx) => `${idx + 1}. ${rule.text} (${rule.source})`);
        return {
            success: true,
            formatted: lines.length > 0
                ? lines.join('\n')
                : 'No MUST-level rules discovered from policy sources.',
            data: manifest,
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
export async function buildContextPackTool(args = {}) {
    try {
        const projectRoot = getProjectRoot(args);
        const pack = await buildContextPack({
            projectRoot,
            taskDescription: args.taskDescription,
            workingFiles: args.workingFiles,
            tokenBudget: args.tokenBudget,
            maxLayerEntries: args.maxLayerEntries,
            memoryLookback: args.memoryLookback,
        });
        return {
            success: true,
            formatted: formatContextPackMarkdown(pack),
            data: pack,
        };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
//# sourceMappingURL=index.js.map