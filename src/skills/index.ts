/**
 * Skills Module Exports
 */

export * from './ultrawork.js';

// Re-export all built-in skills
import { ultraworkSkill } from './ultrawork.js';

export const builtinSkills = [
  ultraworkSkill,
];

// Additional skill exports (these have different structures and are used separately)
export { PlanSkillManager } from './plan.js';
export { QuickSkillManager } from './quick.js';
export { statsSkillDefinition } from './stats.js';
