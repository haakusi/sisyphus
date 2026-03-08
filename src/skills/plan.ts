/**
 * Plan Skill - Prometheus Interview Mode
 *
 * Inspired by oh-my-opencode's Prometheus mode.
 * Provides structured planning through interview-based requirements gathering.
 */

export interface PlanConfig {
  maxQuestions: number;
  requireExplicitApproval: boolean;
  generateAcceptanceCriteria: boolean;
  estimateComplexity: boolean;
}

export interface PlanPhase {
  name: 'interview' | 'analysis' | 'planning' | 'approval' | 'execution';
  status: 'pending' | 'active' | 'completed';
  data?: unknown;
}

export interface PlanSession {
  id: string;
  taskDescription: string;
  phases: PlanPhase[];
  questions: string[];
  answers: Record<string, string>;
  plan?: GeneratedPlan;
  approved: boolean;
  startTime: number;
}

export interface GeneratedPlan {
  title: string;
  summary: string;
  scope: {
    included: string[];
    excluded: string[];
  };
  tasks: PlanTask[];
  acceptanceCriteria: string[];
  risks: string[];
  estimatedComplexity: 'low' | 'medium' | 'high' | 'very-high';
}

export interface PlanTask {
  id: string;
  title: string;
  description: string;
  dependencies: string[];
  model: 'haiku' | 'sonnet' | 'opus';
  parallel: boolean;
}

const DEFAULT_CONFIG: PlanConfig = {
  maxQuestions: 5,
  requireExplicitApproval: true,
  generateAcceptanceCriteria: true,
  estimateComplexity: true,
};

// Interview questions by task type
const INTERVIEW_TEMPLATES = {
  feature: [
    'What is the main goal of this feature?',
    'Who are the primary users of this feature?',
    'Are there any existing patterns in the codebase we should follow?',
    'What are the acceptance criteria for this feature?',
    'Are there any constraints or limitations to consider?',
  ],
  refactor: [
    'What specific problems are we trying to solve?',
    'What is the current pain point with the existing code?',
    'Should we maintain backward compatibility?',
    'What is the scope of the refactoring?',
    'Are there tests we need to preserve or update?',
  ],
  bugfix: [
    'Can you describe the bug in detail?',
    'What is the expected behavior?',
    'When did this bug first appear?',
    'Are there any related issues or symptoms?',
    'How critical is this bug?',
  ],
  migration: [
    'What are we migrating from and to?',
    'What is the timeline for this migration?',
    'Can we do this incrementally or all at once?',
    'What rollback plan do we need?',
    'Are there data transformation requirements?',
  ],
  general: [
    'What is the main objective?',
    'What are the key requirements?',
    'Are there any constraints or limitations?',
    'What does success look like?',
    'What are the priorities if we need to make trade-offs?',
  ],
};

export class PlanSkillManager {
  private static instance: PlanSkillManager;
  private config: PlanConfig = DEFAULT_CONFIG;
  private currentSession: PlanSession | null = null;

  private constructor() {}

  static getInstance(): PlanSkillManager {
    if (!PlanSkillManager.instance) {
      PlanSkillManager.instance = new PlanSkillManager();
    }
    return PlanSkillManager.instance;
  }

  configure(config: Partial<PlanConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Start planning session
  startSession(taskDescription: string): PlanSession {
    const taskType = this.detectTaskType(taskDescription);
    const questions = INTERVIEW_TEMPLATES[taskType] || INTERVIEW_TEMPLATES.general;

    this.currentSession = {
      id: `plan-${Date.now()}`,
      taskDescription,
      phases: [
        { name: 'interview', status: 'active' },
        { name: 'analysis', status: 'pending' },
        { name: 'planning', status: 'pending' },
        { name: 'approval', status: 'pending' },
        { name: 'execution', status: 'pending' },
      ],
      questions: questions.slice(0, this.config.maxQuestions),
      answers: {},
      approved: false,
      startTime: Date.now(),
    };

    return this.currentSession;
  }

  // Get current session
  getSession(): PlanSession | null {
    return this.currentSession;
  }

  // Record answer
  recordAnswer(questionIndex: number, answer: string): void {
    if (this.currentSession && this.currentSession.questions[questionIndex]) {
      this.currentSession.answers[this.currentSession.questions[questionIndex]] = answer;
    }
  }

  // Generate interview prompt
  getInterviewPrompt(): string {
    if (!this.currentSession) return '';

    const session = this.currentSession;
    const unanswered = session.questions.filter(q => !session.answers[q]);

    if (unanswered.length === 0) {
      return this.getAnalysisPrompt();
    }

    const nextQuestion = unanswered[0];
    const questionNum = session.questions.indexOf(nextQuestion) + 1;

    return `
## Planning Interview (Question ${questionNum}/${session.questions.length})

**Task:** ${session.taskDescription}

**Question:** ${nextQuestion}

Please provide a detailed answer to help me understand the requirements better.
If you want to skip this question, say "skip".
If you want to proceed to planning, say "proceed".
`.trim();
  }

  // Generate analysis prompt
  getAnalysisPrompt(): string {
    if (!this.currentSession) return '';

    const session = this.currentSession;

    // Move to analysis phase
    this.updatePhase('interview', 'completed');
    this.updatePhase('analysis', 'active');

    const answersText = Object.entries(session.answers)
      .map(([q, a]) => `Q: ${q}\nA: ${a}`)
      .join('\n\n');

    return `
## Analysis Phase

Based on the interview, analyze the requirements:

**Original Task:** ${session.taskDescription}

**Interview Results:**
${answersText || 'No additional details provided.'}

**Analysis Instructions:**
1. Identify all affected files and components
2. List dependencies and potential conflicts
3. Assess complexity and risks
4. Suggest approach (incremental vs big-bang)

Provide your analysis, then I'll generate the execution plan.
`.trim();
  }

  // Generate execution plan
  generatePlan(analysisResult: string): GeneratedPlan {
    if (!this.currentSession) {
      throw new Error('No active planning session');
    }

    // Move to planning phase
    this.updatePhase('analysis', 'completed');
    this.updatePhase('planning', 'active');

    const session = this.currentSession;

    // Generate plan based on analysis
    const plan: GeneratedPlan = {
      title: this.extractTitle(session.taskDescription),
      summary: `Implementation plan for: ${session.taskDescription}`,
      scope: {
        included: this.extractScope(analysisResult, 'included'),
        excluded: this.extractScope(analysisResult, 'excluded'),
      },
      tasks: this.generateTasks(session.taskDescription, analysisResult),
      acceptanceCriteria: this.generateAcceptanceCriteria(session),
      risks: this.extractRisks(analysisResult),
      estimatedComplexity: this.estimateComplexity(analysisResult),
    };

    session.plan = plan;
    this.updatePhase('planning', 'completed');
    this.updatePhase('approval', 'active');

    return plan;
  }

  // Get plan approval prompt
  getApprovalPrompt(): string {
    if (!this.currentSession?.plan) return '';

    const plan = this.currentSession.plan;

    const tasksText = plan.tasks
      .map((t, i) => `${i + 1}. [${t.model}] ${t.title}${t.parallel ? ' (parallel)' : ''}`)
      .join('\n');

    const criteriaText = plan.acceptanceCriteria
      .map((c, i) => `${i + 1}. ${c}`)
      .join('\n');

    return `
## Plan Review

**${plan.title}**

${plan.summary}

### Scope
**Included:**
${plan.scope.included.map(s => `- ${s}`).join('\n')}

**Excluded:**
${plan.scope.excluded.map(s => `- ${s}`).join('\n') || '- None specified'}

### Tasks (${plan.tasks.length} total)
${tasksText}

### Acceptance Criteria
${criteriaText}

### Risks
${plan.risks.map(r => `- ${r}`).join('\n') || '- None identified'}

### Complexity: ${plan.estimatedComplexity.toUpperCase()}

---

**Do you approve this plan?**
- Say "approve" to proceed with execution
- Say "modify" followed by changes to adjust
- Say "cancel" to abort
`.trim();
  }

  // Approve plan
  approvePlan(): void {
    if (this.currentSession) {
      this.currentSession.approved = true;
      this.updatePhase('approval', 'completed');
      this.updatePhase('execution', 'active');
    }
  }

  // Get execution instructions
  getExecutionInstructions(): string {
    if (!this.currentSession?.plan || !this.currentSession.approved) {
      return 'Plan not approved yet.';
    }

    const plan = this.currentSession.plan;
    const taskInstructions = plan.tasks.map(t => {
      const modelHint = t.model === 'haiku' ? '(use Explore agent)' :
                       t.model === 'opus' ? '(use Plan agent)' :
                       '(use general-purpose agent)';

      return `
### Task: ${t.title}
${t.description}
**Model:** ${t.model} ${modelHint}
**Dependencies:** ${t.dependencies.join(', ') || 'None'}
**Parallel:** ${t.parallel ? 'Yes' : 'No'}
`;
    }).join('\n');

    return `
## Execution Phase

Execute the following plan using TaskCreate for each task:

${taskInstructions}

### Acceptance Criteria
${plan.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

### Instructions
1. Create tasks using TaskCreate
2. Execute parallel tasks together
3. Verify each acceptance criterion
4. Report completion when done
`.trim();
  }

  // Cancel session
  cancelSession(): void {
    this.currentSession = null;
  }

  // Helper methods
  private detectTaskType(description: string): keyof typeof INTERVIEW_TEMPLATES {
    const lower = description.toLowerCase();
    if (lower.includes('feature') || lower.includes('add') || lower.includes('implement')) {
      return 'feature';
    }
    if (lower.includes('refactor') || lower.includes('clean') || lower.includes('reorganize')) {
      return 'refactor';
    }
    if (lower.includes('bug') || lower.includes('fix') || lower.includes('error')) {
      return 'bugfix';
    }
    if (lower.includes('migrate') || lower.includes('upgrade') || lower.includes('convert')) {
      return 'migration';
    }
    return 'general';
  }

  private updatePhase(name: PlanPhase['name'], status: PlanPhase['status']): void {
    if (this.currentSession) {
      const phase = this.currentSession.phases.find(p => p.name === name);
      if (phase) {
        phase.status = status;
      }
    }
  }

  private extractTitle(description: string): string {
    // Simple extraction - first 50 chars or first sentence
    const firstSentence = description.split(/[.!?]/)[0];
    return firstSentence.length > 50 ? firstSentence.substring(0, 50) + '...' : firstSentence;
  }

  private extractScope(analysis: string, type: 'included' | 'excluded'): string[] {
    // Placeholder - in real implementation, parse analysis
    if (type === 'included') {
      return ['Core functionality as described', 'Related tests', 'Documentation updates'];
    }
    return ['Unrelated features', 'Performance optimizations'];
  }

  private generateTasks(description: string, analysis: string): PlanTask[] {
    // Generate tasks based on description
    const tasks: PlanTask[] = [
      {
        id: 'task-1',
        title: 'Explore codebase for related files',
        description: 'Find all files related to the task',
        dependencies: [],
        model: 'haiku',
        parallel: true,
      },
      {
        id: 'task-2',
        title: 'Analyze current implementation',
        description: 'Understand existing patterns and dependencies',
        dependencies: ['task-1'],
        model: 'sonnet',
        parallel: false,
      },
      {
        id: 'task-3',
        title: 'Implement changes',
        description: description,
        dependencies: ['task-2'],
        model: 'opus',
        parallel: false,
      },
      {
        id: 'task-4',
        title: 'Update tests',
        description: 'Create or update relevant tests',
        dependencies: ['task-3'],
        model: 'sonnet',
        parallel: true,
      },
      {
        id: 'task-5',
        title: 'Update documentation',
        description: 'Update relevant documentation',
        dependencies: ['task-3'],
        model: 'sonnet',
        parallel: true,
      },
    ];

    return tasks;
  }

  private generateAcceptanceCriteria(session: PlanSession): string[] {
    const criteria = [
      'All tests pass',
      'No new lint errors',
      'Code follows existing patterns',
    ];

    // Add from interview answers
    const acceptanceAnswer = session.answers['What are the acceptance criteria for this feature?'] ||
                            session.answers['What does success look like?'];

    if (acceptanceAnswer) {
      criteria.unshift(acceptanceAnswer);
    }

    return criteria;
  }

  private extractRisks(analysis: string): string[] {
    // Placeholder - extract from analysis
    return [
      'May require changes to related components',
      'Test coverage may need expansion',
    ];
  }

  private estimateComplexity(analysis: string): GeneratedPlan['estimatedComplexity'] {
    const lower = analysis.toLowerCase();
    if (lower.includes('complex') || lower.includes('difficult') || lower.includes('extensive')) {
      return 'high';
    }
    if (lower.includes('simple') || lower.includes('straightforward')) {
      return 'low';
    }
    return 'medium';
  }
}

// Export singleton
export const planSkill = PlanSkillManager.getInstance();

// Skill definition
export const planSkillDefinition = {
  name: 'plan',
  aliases: ['prometheus', 'interview'],
  description: 'Enter structured planning mode with interview-based requirements gathering',
  triggers: ['plan', '/plan', 'let me plan', 'interview mode'],

  async execute(context: { message: string; args?: string }) {
    const task = context.args || context.message.replace(/^\/plan\s*/, '').trim();

    if (!task) {
      return {
        response: 'Please provide a task description: /plan <task description>',
      };
    }

    const session = planSkill.startSession(task);

    return {
      response: planSkill.getInterviewPrompt(),
      metadata: {
        planSessionId: session.id,
        phase: 'interview',
      },
    };
  },
};

// Types are already exported at their declaration points
