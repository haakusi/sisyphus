/**
 * State Management for Orchestrator
 *
 * Manages global state across the orchestration system.
 */

import type { CodebaseState, CodebaseAssessment } from '../agents/types.js';

// ============================================
// Types
// ============================================

export interface OrchestratorState {
  sessionId: string | null;
  projectRoot: string | null;
  codebaseAssessment: CodebaseAssessment | null;
  activeAgents: Set<string>;
  contextUsage: number;
  lastActivity: Date;
  isIdle: boolean;
}

// ============================================
// State Management
// ============================================

const initialState: OrchestratorState = {
  sessionId: null,
  projectRoot: null,
  codebaseAssessment: null,
  activeAgents: new Set(),
  contextUsage: 0,
  lastActivity: new Date(),
  isIdle: true,
};

let state: OrchestratorState = { ...initialState };

export function getState(): Readonly<OrchestratorState> {
  return state;
}

export function setState(updates: Partial<OrchestratorState>): void {
  state = { ...state, ...updates };
}

export function resetState(): void {
  state = { ...initialState, activeAgents: new Set() };
}

// ============================================
// Session Management
// ============================================

export function initializeSession(sessionId: string, projectRoot: string): void {
  setState({
    sessionId,
    projectRoot,
    lastActivity: new Date(),
    isIdle: false,
  });
}

export function endSession(): void {
  setState({
    sessionId: null,
    isIdle: true,
  });
}

// ============================================
// Agent Tracking
// ============================================

export function registerAgent(agentName: string): void {
  state.activeAgents.add(agentName);
}

export function unregisterAgent(agentName: string): void {
  state.activeAgents.delete(agentName);
}

export function getActiveAgents(): string[] {
  return Array.from(state.activeAgents);
}

// ============================================
// Codebase Assessment
// ============================================

export function setCodebaseAssessment(assessment: CodebaseAssessment): void {
  setState({ codebaseAssessment: assessment });
}

export function getCodebaseState(): CodebaseState | null {
  return state.codebaseAssessment?.state ?? null;
}

// ============================================
// Activity Tracking
// ============================================

export function recordActivity(): void {
  setState({
    lastActivity: new Date(),
    isIdle: false,
  });
}

export function markIdle(): void {
  setState({ isIdle: true });
}

export function isSessionIdle(): boolean {
  return state.isIdle;
}

export function getLastActivityTime(): Date {
  return state.lastActivity;
}

// ============================================
// Context Usage
// ============================================

export function updateContextUsage(usage: number): void {
  setState({ contextUsage: usage });
}

export function getContextUsage(): number {
  return state.contextUsage;
}

export function isContextNearLimit(threshold: number = 0.8): boolean {
  return state.contextUsage >= threshold;
}
