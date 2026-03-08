/**
 * Policy Manifest Builder
 *
 * Compiles active operational rules from repository guidance docs.
 */

import { existsSync } from 'fs';
import { promises as fs } from 'fs';
import { join, relative } from 'path';

export interface PolicyRule {
  id: string;
  text: string;
  severity: 'must' | 'should';
  source: string;
}

export interface PolicyManifest {
  generatedAt: string;
  projectRoot: string;
  sources: string[];
  rules: PolicyRule[];
  qualityGates: string[];
}

const RULE_CANDIDATE_PATTERN = /^\s*(?:[-*]|\d+\.)\s+(.+?)\s*$/;
const QUALITY_GATE_PATTERN = /(coverage|lint|type\s*check|openapi|compliance|quality\s*gate|test\s*pass)/i;

const DEFAULT_POLICY_SOURCES = [
  'AGENTS.md',
  'CLAUDE.md',
  '.claude/CLAUDE.md',
  '.claude/rules.md',
  'AGENT-RULES.md',
  'docs/plan/ai-native-backend-development-process.md',
  'docs/plan/ai-native-frontend-development-process.md',
  'framework/quality-gates.md',
  'process/core/AGENT-RULES.md',
  'process/core/framework/quality-gates.md',
];

function sanitizeRule(raw: string): string {
  return raw
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function classifySeverity(text: string): 'must' | 'should' {
  const normalized = text.toLowerCase();
  if (
    normalized.includes('must') ||
    normalized.includes('never') ||
    normalized.includes('required') ||
    normalized.includes('do not') ||
    normalized.includes('no ') ||
    normalized.includes('hard constraint')
  ) {
    return 'must';
  }

  return 'should';
}

function createRuleId(source: string, index: number): string {
  return `${source.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}-${index + 1}`;
}

async function readPolicySources(projectRoot: string): Promise<Array<{ source: string; content: string }>> {
  const loaded: Array<{ source: string; content: string }> = [];

  for (const source of DEFAULT_POLICY_SOURCES) {
    const fullPath = join(projectRoot, source);
    if (!existsSync(fullPath)) {
      continue;
    }

    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      loaded.push({
        source: relative(projectRoot, fullPath),
        content,
      });
    } catch {
      // Skip unreadable files.
    }
  }

  return loaded;
}

function extractRulesFromDocument(source: string, content: string): PolicyRule[] {
  const rules: PolicyRule[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(RULE_CANDIDATE_PATTERN);
    if (!match) {
      continue;
    }

    const text = sanitizeRule(match[1]);

    if (text.length < 8) {
      continue;
    }

    if (text.startsWith('|') && text.endsWith('|')) {
      continue;
    }

    rules.push({
      id: createRuleId(source, rules.length),
      text,
      severity: classifySeverity(text),
      source,
    });
  }

  return rules;
}

function extractQualityGates(content: string): string[] {
  const gates: string[] = [];

  for (const line of content.split('\n')) {
    if (!QUALITY_GATE_PATTERN.test(line)) {
      continue;
    }

    const cleaned = sanitizeRule(line.replace(/^\s*(?:[-*]|\d+\.)\s*/, ''));
    if (cleaned.length > 0) {
      gates.push(cleaned);
    }
  }

  return gates;
}

export async function buildPolicyManifest(projectRoot: string): Promise<PolicyManifest> {
  const docs = await readPolicySources(projectRoot);

  const rules: PolicyRule[] = [];
  const qualityGates = new Set<string>();

  for (const doc of docs) {
    const extractedRules = extractRulesFromDocument(doc.source, doc.content);
    for (const rule of extractedRules) {
      rules.push(rule);
    }

    const extractedGates = extractQualityGates(doc.content);
    for (const gate of extractedGates) {
      qualityGates.add(gate);
    }
  }

  const uniqueRules = new Map<string, PolicyRule>();
  for (const rule of rules) {
    const key = `${rule.text.toLowerCase()}|${rule.severity}`;
    if (!uniqueRules.has(key)) {
      uniqueRules.set(key, {
        ...rule,
        id: createRuleId(rule.source, uniqueRules.size),
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    projectRoot,
    sources: docs.map((doc) => doc.source),
    rules: Array.from(uniqueRules.values()),
    qualityGates: Array.from(qualityGates),
  };
}
