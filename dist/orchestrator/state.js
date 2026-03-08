/**
 * State Management for Orchestrator
 *
 * Manages global state across the orchestration system.
 */
// ============================================
// State Management
// ============================================
const initialState = {
    sessionId: null,
    projectRoot: null,
    codebaseAssessment: null,
    activeAgents: new Set(),
    contextUsage: 0,
    lastActivity: new Date(),
    isIdle: true,
};
let state = { ...initialState };
export function getState() {
    return state;
}
export function setState(updates) {
    state = { ...state, ...updates };
}
export function resetState() {
    state = { ...initialState, activeAgents: new Set() };
}
// ============================================
// Session Management
// ============================================
export function initializeSession(sessionId, projectRoot) {
    setState({
        sessionId,
        projectRoot,
        lastActivity: new Date(),
        isIdle: false,
    });
}
export function endSession() {
    setState({
        sessionId: null,
        isIdle: true,
    });
}
// ============================================
// Agent Tracking
// ============================================
export function registerAgent(agentName) {
    state.activeAgents.add(agentName);
}
export function unregisterAgent(agentName) {
    state.activeAgents.delete(agentName);
}
export function getActiveAgents() {
    return Array.from(state.activeAgents);
}
// ============================================
// Codebase Assessment
// ============================================
export function setCodebaseAssessment(assessment) {
    setState({ codebaseAssessment: assessment });
}
export function getCodebaseState() {
    return state.codebaseAssessment?.state ?? null;
}
// ============================================
// Activity Tracking
// ============================================
export function recordActivity() {
    setState({
        lastActivity: new Date(),
        isIdle: false,
    });
}
export function markIdle() {
    setState({ isIdle: true });
}
export function isSessionIdle() {
    return state.isIdle;
}
export function getLastActivityTime() {
    return state.lastActivity;
}
// ============================================
// Context Usage
// ============================================
export function updateContextUsage(usage) {
    setState({ contextUsage: usage });
}
export function getContextUsage() {
    return state.contextUsage;
}
export function isContextNearLimit(threshold = 0.8) {
    return state.contextUsage >= threshold;
}
//# sourceMappingURL=state.js.map