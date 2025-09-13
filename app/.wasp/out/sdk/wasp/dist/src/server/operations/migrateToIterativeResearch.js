import { HttpError } from 'wasp/server';
import { iterativeResearchEngine } from '../../learning/api/iterativeResearch';
/**
 * Migration operation to move topics from old content generation system
 * to new iterative research system
 */
export async function migrateToIterativeResearch(args, context) {
    if (!context.user) {
        throw new HttpError(401, 'Authentication required');
    }
    console.log('🔄 Starting migration to iterative research system...');
    try {
        // Get all topics that have old content but might benefit from new research
        const topicsToMigrate = await context.entities.Topic.findMany({
            include: {
                generatedContent: true,
                vectorDocuments: true
            }
        });
        let migrated = 0;
        let skipped = 0;
        let errors = 0;
        for (const topic of topicsToMigrate) {
            try {
                // Check if topic already has recent iterative research
                const hasRecentResearch = topic.generatedContent.some((content) => {
                    const metadata = content.metadata;
                    return metadata?.researchMetadata &&
                        metadata?.lastResearchUpdate &&
                        new Date(metadata.lastResearchUpdate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
                });
                if (hasRecentResearch) {
                    console.log(`⏭️ Skipping ${topic.title} - already has recent research`);
                    skipped++;
                    continue;
                }
                // Run iterative research for this topic
                console.log(`🚀 Researching ${topic.title}...`);
                const researchResult = await iterativeResearchEngine.researchAndGenerate(topic.title, {
                    maxDepth: 2, // Smaller depth for migration
                    forceRefresh: false,
                    userContext: { level: 'intermediate', interests: [] }
                });
                // Store results to database
                await iterativeResearchEngine.storeToDatabase(researchResult, topic.slug);
                console.log(`✅ Migrated ${topic.title}`);
                migrated++;
                // Add small delay to avoid overwhelming the system
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            catch (error) {
                console.error(`❌ Failed to migrate ${topic.title}:`, error);
                errors++;
            }
        }
        const result = {
            success: true,
            migrated,
            skipped,
            errors,
            total: topicsToMigrate.length,
            message: `Migration completed: ${migrated} migrated, ${skipped} skipped, ${errors} errors`
        };
        console.log('🎉 Migration summary:', result);
        return result;
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        throw new HttpError(500, `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Clean up old content generation artifacts
 */
export async function cleanupOldSystem(args, context) {
    if (!context.user) {
        throw new HttpError(401, 'Authentication required');
    }
    console.log('🧹 Starting cleanup of old content generation system...');
    try {
        // Mark old generated content as legacy
        const oldContent = await context.entities.GeneratedContent.updateMany({
            where: {
                AND: [
                    { contentType: { not: 'exploration' } },
                    { contentType: { not: 'research' } },
                    {
                        OR: [
                            { metadata: { path: ['researchMetadata'], equals: null } },
                            { metadata: { equals: null } }
                        ]
                    }
                ]
            },
            data: {
                metadata: {
                    legacy: true,
                    migratedAt: new Date().toISOString(),
                    note: 'Legacy content from old generation system'
                }
            }
        });
        console.log(`📝 Marked ${oldContent.count} old content entries as legacy`);
        return {
            success: true,
            markedAsLegacy: oldContent.count,
            message: `Cleanup completed: ${oldContent.count} entries marked as legacy`
        };
    }
    catch (error) {
        console.error('❌ Cleanup failed:', error);
        throw new HttpError(500, `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Validate migration completeness
 */
export async function validateMigration(args, context) {
    if (!context.user) {
        throw new HttpError(401, 'Authentication required');
    }
    try {
        const topics = await context.entities.Topic.findMany({
            include: {
                generatedContent: true,
                vectorDocuments: true
            }
        });
        let totalTopics = 0;
        let migratedTopics = 0;
        let needsMigration = 0;
        for (const topic of topics) {
            totalTopics++;
            const hasNewResearch = topic.generatedContent.some((content) => {
                const metadata = content.metadata;
                return metadata?.researchMetadata || metadata?.isUserContent;
            });
            const hasVectorData = topic.vectorDocuments.length > 0;
            if (hasNewResearch || hasVectorData) {
                migratedTopics++;
            }
            else {
                needsMigration++;
            }
        }
        return {
            success: true,
            totalTopics,
            migratedTopics,
            needsMigration,
            migrationRate: totalTopics > 0 ? (migratedTopics / totalTopics * 100).toFixed(1) + '%' : '0%',
            message: `Migration status: ${migratedTopics}/${totalTopics} topics migrated (${needsMigration} still need migration)`
        };
    }
    catch (error) {
        console.error('❌ Validation failed:', error);
        throw new HttpError(500, `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
//# sourceMappingURL=migrateToIterativeResearch.js.map