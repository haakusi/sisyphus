/**
 * Ultrawork Skill
 *
 * The magic keyword that activates all Sisyphus features automatically.
 * When users include "ultrawork" or "ulw" in their prompts, this skill
 * enables parallel agent execution, TODO enforcement, and all available tools.
 */
import { getConfig } from '../config/index.js';
// ============================================
// Feature Detection
// ============================================
function detectRequestedFeatures(message) {
    const features = {};
    // Check for specific feature requests
    if (/parallel|concurrent/i.test(message)) {
        features.parallelAgents = true;
    }
    if (/todo|task/i.test(message)) {
        features.todoEnforcer = true;
    }
    if (/lsp|goto|reference/i.test(message)) {
        features.lspTools = true;
    }
    if (/ast|structure|pattern/i.test(message)) {
        features.astGrep = true;
    }
    if (/deep|thorough|comprehensive/i.test(message)) {
        features.deepExploration = true;
    }
    // Multi-model delegation: enabled by default in ultrawork mode
    // Can be triggered by keywords like "delegate", "multi-model", "gemini", "gpt", "codex"
    if (/delegate|multi.?model|gemini|gpt|codex|외부|위임/i.test(message)) {
        features.multiModelDelegation = true;
    }
    return features;
}
// ============================================
// Ultrawork Skill Implementation
// ============================================
export const ultraworkSkill = {
    name: 'ultrawork',
    aliases: ['ulw', 'ultra'],
    description: 'Activate all Sisyphus features for maximum productivity',
    triggers: ['ultrawork', 'ulw', 'ultra mode', 'full power'],
    async execute(context) {
        const config = getConfig();
        // Determine which features to enable
        const requestedFeatures = detectRequestedFeatures(context.message);
        const features = {
            parallelAgents: requestedFeatures.parallelAgents ?? config.skills.ultrawork.autoParallelAgents,
            todoEnforcer: requestedFeatures.todoEnforcer ?? config.skills.ultrawork.autoTodoEnforcer,
            lspTools: requestedFeatures.lspTools ?? true,
            astGrep: requestedFeatures.astGrep ?? true,
            contextMonitor: true,
            deepExploration: requestedFeatures.deepExploration ?? false,
            multiModelDelegation: requestedFeatures.multiModelDelegation ?? true, // Enabled by default
        };
        // Build the enhanced prompt
        const enhancedInstructions = buildUltraworkInstructions(features, context);
        return {
            success: true,
            output: enhancedInstructions,
            metadata: {
                features,
                originalMessage: context.message,
            },
        };
    },
};
// ============================================
// Instruction Builder
// ============================================
function buildUltraworkInstructions(features, context) {
    const sections = [];
    // Header
    sections.push(`# ULTRAWORK Mode Activated

You are now operating in ULTRAWORK mode with enhanced capabilities.`);
    // Parallel Agents
    if (features.parallelAgents) {
        sections.push(`## Parallel Agent Execution

Execute multiple agents simultaneously for independent tasks:
- Use Explore agent for codebase navigation
- Use Librarian agent for documentation research
- Use Oracle agent for strategic decisions (use sparingly)

Launch agents in parallel when tasks don't depend on each other.`);
    }
    // TODO Enforcer
    if (features.todoEnforcer) {
        sections.push(`## TODO Management

1. Create comprehensive todo list using TaskCreate for multi-step tasks
2. Mark tasks in_progress before starting work
3. Mark tasks completed after verification
4. System will auto-resume if you stop with incomplete tasks`);
    }
    // LSP Tools
    if (features.lspTools) {
        sections.push(`## LSP Tools Available

- lsp_goto_definition: Jump to symbol definitions
- lsp_find_references: Find all usages of a symbol
- lsp_symbols: Browse document/workspace symbols
- lsp_diagnostics: Get errors/warnings before build
- lsp_rename: Rename symbols across workspace`);
    }
    // AST-grep
    if (features.astGrep) {
        sections.push(`## AST-Grep Tools Available

- ast_search: Find code patterns structurally
- ast_replace: Safe structural replacements

Use for pattern-based code modifications and analysis.`);
    }
    // Deep Exploration
    if (features.deepExploration) {
        sections.push(`## Deep Exploration Mode

Perform thorough analysis:
1. Explore all related files and dependencies
2. Search for similar patterns in codebase
3. Check for potential side effects
4. Validate against existing tests`);
    }
    // Context Monitor
    if (features.contextMonitor) {
        sections.push(`## Context Management

Monitor context usage and optimize:
- Essential information will be preserved during compaction
- Long outputs will be summarized
- Progress is tracked across turns`);
    }
    // Multi-Model Delegation
    if (features.multiModelDelegation) {
        sections.push(`## Multi-Model Delegation (MCP Tools)

You have access to external AI models via MCP tools. Use them strategically:

### When to Delegate

| Task Type | Delegate To | MCP Tool |
|-----------|-------------|----------|
| Frontend/UI code | Gemini | \`ask_gemini\` |
| Strategic decisions | GPT-4 | \`ask_gpt\` |
| Code generation | Codex | \`ask_codex\` |
| Code refactoring | Codex | \`refactor_code\` |
| Bug fixing | Codex | \`debug_code\` |
| Code explanation | Codex | \`explain_code\` |
| Compare approaches | Multiple | \`compare_models\` |

### Delegation Guidelines

1. **Frontend/UI Work** → Use \`ask_gemini\` for React, Vue, CSS, design patterns
2. **Architecture Decisions** → Use \`ask_gpt\` for strategic analysis
3. **Code Tasks** → Use \`ask_codex\`, \`refactor_code\`, \`debug_code\`
4. **Uncertain? Compare** → Use \`compare_models\` to get multiple perspectives

### Example Usage

\`\`\`
// Get frontend code from Gemini
ask_gemini({ prompt: "Create a React modal component with animations" })

// Get strategic advice from GPT
ask_gpt({ prompt: "Should we use microservices or monolith for this project?" })

// Generate code with Codex
ask_codex({ prompt: "Implement binary search in Python", language: "python" })
\`\`\`

**Note**: You (Claude) remain the orchestrator. Delegate specific tasks, integrate results.`);
    }
    // Task Instructions
    sections.push(`## Your Task

Process the following request with all enabled features:

${cleanMessage(context.message)}

---

Begin work immediately. Create todo list if task has multiple steps.`);
    return sections.join('\n\n');
}
/**
 * Remove ultrawork triggers from the message
 */
function cleanMessage(message) {
    return message
        .replace(/\bultrawork\b/gi, '')
        .replace(/\bulw\b/gi, '')
        .replace(/\bultra\s*mode\b/gi, '')
        .replace(/\bfull\s*power\b/gi, '')
        .trim();
}
// ============================================
// Skill Detection Helper
// ============================================
export function isUltraworkRequest(message) {
    const lowerMessage = message.toLowerCase();
    return ultraworkSkill.triggers.some((trigger) => lowerMessage.includes(trigger.toLowerCase()));
}
// ============================================
// Quick Activation Helper
// ============================================
export function activateUltrawork(message, context = {}) {
    const fullContext = {
        message,
        intent: context.intent ?? {
            type: 'general',
            action: 'process',
            entities: [],
            confidence: 0.5,
            rawMessage: message,
        },
        codebaseState: context.codebaseState ?? 'mixed',
        availableTools: context.availableTools ?? [],
    };
    return ultraworkSkill.execute(fullContext);
}
//# sourceMappingURL=ultrawork.js.map