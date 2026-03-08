/**
 * Artifact Drift Checker
 *
 * Detects version-pin drift between canonical sources and derived artifacts.
 */
export interface CanonicalVersions {
    openapiVersion: string | null;
    architectureVersion: string | null;
    prdVersion: string | null;
}
export interface ArtifactVersionPin {
    filePath: string;
    openapiVersion: string | null;
    architectureVersion: string | null;
    prdVersion: string | null;
    docVersion: string | null;
}
export interface DriftIssue {
    filePath: string;
    field: 'openapi_version' | 'architecture_version' | 'prd_version';
    pinnedVersion: string;
    canonicalVersion: string;
    severity: 'high' | 'medium';
    message: string;
}
export interface DriftReport {
    generatedAt: string;
    projectRoot: string;
    canonical: CanonicalVersions;
    scannedFiles: number;
    pinnedArtifacts: number;
    issues: DriftIssue[];
}
export declare function analyzeArtifactDrift(projectRoot: string): Promise<DriftReport>;
//# sourceMappingURL=drift-check.d.ts.map