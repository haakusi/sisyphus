/**
 * Context Pack Compiler
 *
 * Builds layered context packs (global / sprint / execution) with memory slices.
 */
import { existsSync } from 'fs';
import { promises as fs } from 'fs';
import { basename, join, relative } from 'path';
import { getMemoryStore } from '../memory/index.js';
const DEFAULT_TOKEN_BUDGET = 15000;
const DEFAULT_MAX_LAYER_ENTRIES = 12;
const DEFAULT_MEMORY_LOOKBACK = 10;
const MAX_SCAN_FILES = 400;
const GLOBAL_CONTEXT_FILES = [
    'CLAUDE.md',
    '.claude/CLAUDE.md',
    'AGENTS.md',
    'README.md',
    'AGENT-RULES.md',
    'process/core/AGENT-RULES.md',
    'process/core/framework/context-layering.md',
    'process/core/framework/quality-gates.md',
];
function estimateTokensBySize(size) {
    if (size <= 0)
        return 0;
    return Math.ceil(size / 4);
}
async function statTokenEstimate(fullPath) {
    try {
        const stat = await fs.stat(fullPath);
        return estimateTokensBySize(stat.size);
    }
    catch {
        return 0;
    }
}
function normalizeKeywordQuery(taskDescription) {
    if (!taskDescription)
        return '';
    return taskDescription
        .split(/\s+/)
        .map((word) => word.trim().toLowerCase())
        .filter((word) => word.length >= 3)
        .slice(0, 8)
        .join(' ');
}
async function collectGlobalRefs(projectRoot) {
    const refs = [];
    for (const candidate of GLOBAL_CONTEXT_FILES) {
        const fullPath = join(projectRoot, candidate);
        if (!existsSync(fullPath)) {
            continue;
        }
        refs.push({
            path: candidate,
            reason: 'Global rule/project identity source',
            estimatedTokens: await statTokenEstimate(fullPath),
        });
    }
    return refs;
}
async function walkCandidates(root, projectRoot, collector) {
    if (!existsSync(root)) {
        return;
    }
    const entries = await fs.readdir(root, { withFileTypes: true });
    for (const entry of entries) {
        if (collector.length >= MAX_SCAN_FILES) {
            return;
        }
        if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') {
            continue;
        }
        const fullPath = join(root, entry.name);
        if (entry.isDirectory()) {
            await walkCandidates(fullPath, projectRoot, collector);
            continue;
        }
        if (!entry.isFile()) {
            continue;
        }
        if (!/\.(md|yaml|yml|json|ts|tsx)$/i.test(entry.name)) {
            continue;
        }
        const relPath = relative(projectRoot, fullPath);
        collector.push(relPath);
    }
}
async function collectSprintRefs(projectRoot, maxEntries) {
    const candidatePaths = [];
    await walkCandidates(join(projectRoot, 'docs', 'plan'), projectRoot, candidatePaths);
    await walkCandidates(join(projectRoot, 'specs'), projectRoot, candidatePaths);
    const ranked = [];
    for (const relPath of candidatePaths) {
        const fullPath = join(projectRoot, relPath);
        try {
            const stat = await fs.stat(fullPath);
            const lower = relPath.toLowerCase();
            let score = 0;
            if (lower.includes('sprint'))
                score += 5;
            if (lower.includes('packet'))
                score += 4;
            if (lower.includes('spec'))
                score += 3;
            if (lower.includes('openapi'))
                score += 3;
            if (lower.includes('prd'))
                score += 2;
            if (lower.includes('architecture'))
                score += 2;
            ranked.push({
                path: relPath,
                score,
                mtimeMs: stat.mtimeMs,
                size: stat.size,
            });
        }
        catch {
            // Ignore missing files from race conditions.
        }
    }
    return ranked
        .sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return b.mtimeMs - a.mtimeMs;
    })
        .slice(0, maxEntries)
        .map((item) => ({
        path: item.path,
        reason: 'Sprint-scoped planning or spec artifact',
        estimatedTokens: estimateTokensBySize(item.size),
    }));
}
async function collectExecutionRefs(projectRoot, workingFiles, maxEntries) {
    const refs = [];
    for (const file of workingFiles.slice(0, maxEntries)) {
        const normalized = file.replace(/^\.\//, '');
        const fullPath = join(projectRoot, normalized);
        if (!existsSync(fullPath)) {
            continue;
        }
        refs.push({
            path: normalized,
            reason: 'Current execution target',
            estimatedTokens: await statTokenEstimate(fullPath),
        });
        const siblingReadme = join(fullPath.replace(/[^/]+$/, ''), 'README.md');
        if (existsSync(siblingReadme)) {
            refs.push({
                path: relative(projectRoot, siblingReadme),
                reason: `Local module context for ${basename(normalized)}`,
                estimatedTokens: await statTokenEstimate(siblingReadme),
            });
        }
    }
    return refs.slice(0, maxEntries);
}
async function collectMemorySlice(projectRoot, taskDescription, memoryLookback) {
    const memoryStore = getMemoryStore(projectRoot);
    const query = normalizeKeywordQuery(taskDescription);
    const records = await memoryStore.search({
        query: query || undefined,
        limit: memoryLookback,
    });
    return records;
}
function trimReferencesToBudget(references, budget) {
    const selected = [];
    let used = 0;
    for (const ref of references) {
        if (used + ref.estimatedTokens > budget) {
            continue;
        }
        selected.push(ref);
        used += ref.estimatedTokens;
    }
    return selected;
}
export async function buildContextPack(options) {
    const tokenBudget = options.tokenBudget ?? DEFAULT_TOKEN_BUDGET;
    const maxLayerEntries = options.maxLayerEntries ?? DEFAULT_MAX_LAYER_ENTRIES;
    const memoryLookback = options.memoryLookback ?? DEFAULT_MEMORY_LOOKBACK;
    const workingFiles = options.workingFiles ?? [];
    const globalRefs = await collectGlobalRefs(options.projectRoot);
    const sprintRefs = await collectSprintRefs(options.projectRoot, maxLayerEntries);
    const executionRefs = await collectExecutionRefs(options.projectRoot, workingFiles, maxLayerEntries);
    const memory = await collectMemorySlice(options.projectRoot, options.taskDescription, memoryLookback);
    const globalBudget = Math.floor(tokenBudget * 0.2);
    const sprintBudget = Math.floor(tokenBudget * 0.5);
    const executionBudget = Math.floor(tokenBudget * 0.3);
    return {
        generatedAt: new Date().toISOString(),
        projectRoot: options.projectRoot,
        tokenBudget,
        layers: {
            global: trimReferencesToBudget(globalRefs, globalBudget),
            sprint: trimReferencesToBudget(sprintRefs, sprintBudget),
            execution: trimReferencesToBudget(executionRefs, executionBudget),
        },
        memory,
    };
}
export function formatContextPackMarkdown(pack) {
    const lines = [];
    lines.push('## Context Pack Snapshot');
    lines.push(`Generated: ${pack.generatedAt}`);
    lines.push(`Token budget: ${pack.tokenBudget}`);
    lines.push('');
    const renderLayer = (name, refs) => {
        lines.push(`### ${name}`);
        if (refs.length === 0) {
            lines.push('- (none)');
            lines.push('');
            return;
        }
        for (const ref of refs) {
            lines.push(`- ${ref.path} (${ref.estimatedTokens} tokens): ${ref.reason}`);
        }
        lines.push('');
    };
    renderLayer('Global Layer', pack.layers.global);
    renderLayer('Sprint Layer', pack.layers.sprint);
    renderLayer('Execution Layer', pack.layers.execution);
    lines.push('### Memory Slice');
    if (pack.memory.length === 0) {
        lines.push('- (none)');
    }
    else {
        for (const memory of pack.memory) {
            const preview = memory.content.length > 160
                ? `${memory.content.slice(0, 157)}...`
                : memory.content;
            lines.push(`- [${memory.kind}] ${preview}`);
        }
    }
    return lines.join('\n');
}
//# sourceMappingURL=context-pack.js.map