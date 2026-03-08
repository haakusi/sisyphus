/**
 * Policy Manifest Builder
 *
 * Compiles active operational rules from repository guidance docs.
 */
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
export declare function buildPolicyManifest(projectRoot: string): Promise<PolicyManifest>;
//# sourceMappingURL=manifest.d.ts.map