/**
 * Ralph Loop - Continuous Execution Mode
 *
 * Inspired by oh-my-opencode's Ralph Loop pattern.
 * Automatically continues work until task completion.
 */
const DEFAULT_CONFIG = {
    enabled: true,
    maxIterations: 50,
    iterationDelayMs: 1000,
    autoStopOnComplete: true,
    preserveContext: true,
};
class RalphLoopManager {
    static instance;
    config = DEFAULT_CONFIG;
    state = null;
    stopRequested = false;
    constructor() { }
    static getInstance() {
        if (!RalphLoopManager.instance) {
            RalphLoopManager.instance = new RalphLoopManager();
        }
        return RalphLoopManager.instance;
    }
    configure(config) {
        this.config = { ...this.config, ...config };
    }
    // Start a new Ralph Loop
    start(taskDescription, completionCriteria = []) {
        if (this.state?.active) {
            return false; // Already running
        }
        this.state = {
            active: true,
            currentIteration: 0,
            startTime: Date.now(),
            taskDescription,
            completionCriteria,
            lastCheckpoint: '',
        };
        this.stopRequested = false;
        return true;
    }
    // Stop the Ralph Loop
    stop() {
        this.stopRequested = true;
        if (this.state) {
            this.state.active = false;
        }
    }
    // Check if should continue
    shouldContinue() {
        if (!this.state?.active || this.stopRequested) {
            return false;
        }
        if (this.state.currentIteration >= this.config.maxIterations) {
            this.state.active = false;
            return false;
        }
        return true;
    }
    // Record an iteration
    recordIteration(checkpoint = '') {
        if (this.state) {
            this.state.currentIteration++;
            this.state.lastCheckpoint = checkpoint;
        }
    }
    // Mark as complete
    markComplete() {
        if (this.state && this.config.autoStopOnComplete) {
            this.state.active = false;
        }
    }
    // Get current state
    getState() {
        return this.state;
    }
    // Get status message
    getStatusMessage() {
        if (!this.state) {
            return 'Ralph Loop: Not active';
        }
        const elapsed = Math.round((Date.now() - this.state.startTime) / 1000);
        if (!this.state.active) {
            return `Ralph Loop: Completed after ${this.state.currentIteration} iterations (${elapsed}s)`;
        }
        return `Ralph Loop: Iteration ${this.state.currentIteration}/${this.config.maxIterations} (${elapsed}s elapsed)`;
    }
    // Generate continuation prompt
    getContinuationPrompt() {
        if (!this.state)
            return '';
        const parts = [
            `Continue working on: ${this.state.taskDescription}`,
            ``,
            `Current iteration: ${this.state.currentIteration + 1}/${this.config.maxIterations}`,
        ];
        if (this.state.lastCheckpoint) {
            parts.push(`Last checkpoint: ${this.state.lastCheckpoint}`);
        }
        if (this.state.completionCriteria.length > 0) {
            parts.push(``);
            parts.push(`Completion criteria:`);
            this.state.completionCriteria.forEach((c, i) => {
                parts.push(`  ${i + 1}. ${c}`);
            });
        }
        parts.push(``);
        parts.push(`Instructions:`);
        parts.push(`- Check TaskList for pending work`);
        parts.push(`- Continue from where you left off`);
        parts.push(`- If all tasks are complete, respond with "RALPH_COMPLETE"`);
        return parts.join('\n');
    }
    // Check if response indicates completion
    isCompletionResponse(response) {
        const completionIndicators = [
            'RALPH_COMPLETE',
            'All tasks completed',
            'No pending tasks',
            'Work complete',
        ];
        const lowerResponse = response.toLowerCase();
        return completionIndicators.some(indicator => lowerResponse.includes(indicator.toLowerCase()));
    }
}
// Export singleton
export const ralphLoop = RalphLoopManager.getInstance();
// Hook integration
export function createRalphLoopHook() {
    return {
        name: 'ralph-loop',
        onMessage: async (message) => {
            // Check for loop commands
            if (message.startsWith('/loop ')) {
                const task = message.substring(6).trim();
                if (ralphLoop.start(task)) {
                    return {
                        modified: true,
                        message: ralphLoop.getContinuationPrompt(),
                    };
                }
            }
            if (message === '/stop-loop' || message === '/cancel-ralph') {
                ralphLoop.stop();
                return {
                    modified: true,
                    message: 'Ralph Loop stopped.',
                };
            }
            if (message === '/loop-status') {
                return {
                    modified: true,
                    message: ralphLoop.getStatusMessage(),
                };
            }
            return { modified: false };
        },
        onResponse: async (response) => {
            if (!ralphLoop.shouldContinue()) {
                return { continue: false };
            }
            // Check if work is complete
            if (ralphLoop.isCompletionResponse(response)) {
                ralphLoop.markComplete();
                return { continue: false };
            }
            // Record iteration and continue
            ralphLoop.recordIteration();
            return {
                continue: true,
                nextPrompt: ralphLoop.getContinuationPrompt(),
            };
        },
        onSessionEnd: () => {
            ralphLoop.stop();
        },
    };
}
// Types are already exported at their declaration points
//# sourceMappingURL=ralph-loop.js.map