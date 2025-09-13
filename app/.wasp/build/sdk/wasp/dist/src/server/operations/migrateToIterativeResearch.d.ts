/**
 * Migration operation to move topics from old content generation system
 * to new iterative research system
 */
export declare function migrateToIterativeResearch(args: any, context: any): Promise<{
    success: boolean;
    migrated: number;
    skipped: number;
    errors: number;
    total: any;
    message: string;
}>;
/**
 * Clean up old content generation artifacts
 */
export declare function cleanupOldSystem(args: any, context: any): Promise<{
    success: boolean;
    markedAsLegacy: any;
    message: string;
}>;
/**
 * Validate migration completeness
 */
export declare function validateMigration(args: any, context: any): Promise<{
    success: boolean;
    totalTopics: number;
    migratedTopics: number;
    needsMigration: number;
    migrationRate: string;
    message: string;
}>;
//# sourceMappingURL=migrateToIterativeResearch.d.ts.map