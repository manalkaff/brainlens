import { progressTracker } from './progressTracker';
export const getSubtopicContentHandler = async (req, res, context) => {
    try {
        console.log('🔍 SUBTOPIC CONTENT API CALL:', {
            mainTopicId: req.body.mainTopicId,
            subtopicId: req.body.subtopicId,
            options: req.body.options,
            timestamp: new Date().toISOString()
        });
        if (!context.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const { mainTopicId, subtopicId: rawSubtopicId, options } = req.body;
        // Validate required parameters
        if (!mainTopicId) {
            return res.status(400).json({ error: 'Main topic ID is required' });
        }
        if (!rawSubtopicId) {
            return res.status(400).json({ error: 'Subtopic ID is required' });
        }
        // Parse subtopicId - handle both formats: "mainTopicId,subtopicId" and plain "subtopicId"
        let subtopicId;
        if (rawSubtopicId.includes(',')) {
            const parts = rawSubtopicId.split(',');
            if (parts.length !== 2) {
                return res.status(400).json({ error: 'Invalid subtopic ID format' });
            }
            const [receivedMainTopicId, actualSubtopicId] = parts;
            // Verify the main topic ID matches
            if (receivedMainTopicId !== mainTopicId) {
                return res.status(400).json({
                    error: 'Subtopic ID format mismatch with main topic ID'
                });
            }
            subtopicId = actualSubtopicId;
        }
        else {
            subtopicId = rawSubtopicId;
        }
        // Validate the parsed subtopic ID is not empty
        if (!subtopicId.trim()) {
            return res.status(400).json({ error: 'Invalid subtopic ID' });
        }
        console.log(`FINDING SUBTOPIC: ${subtopicId} WITH MainTopic: ${mainTopicId}`);
        // Find subtopic by ID and verify it belongs to main topic
        const subtopic = await context.entities.Topic.findFirst({
            where: {
                id: subtopicId,
                parentId: mainTopicId
            }
        });
        if (!subtopic) {
            return res.status(404).json({
                success: false,
                error: 'Subtopic not found',
                message: 'The requested subtopic does not exist or does not belong to the specified main topic'
            });
        }
        console.log(`🔍 Found subtopic: ${subtopic.title} (ID: ${subtopicId})`);
        // Look for existing content for this subtopic
        const existingContent = await context.entities.GeneratedContent.findFirst({
            where: {
                topicId: subtopicId,
                userLevel: options?.userLevel || 'intermediate',
                learningStyle: options?.learningStyle || 'textual'
            },
            orderBy: { createdAt: 'desc' }
        });
        // If content exists, return it immediately
        if (existingContent) {
            console.log('✅ Found existing subtopic content in database');
            return res.json({
                success: true,
                content: existingContent.content,
                metadata: {
                    ...existingContent.metadata,
                    fromDatabase: true,
                    contentAge: Math.floor((Date.now() - existingContent.createdAt.getTime()) / (1000 * 60 * 60 * 24))
                },
                sources: existingContent.sources || [],
                topicId: subtopicId,
                parentTopicId: mainTopicId,
                subtopicTitle: subtopic.title,
                fromDatabase: true
            });
        }
        console.log('🔍 No existing content found, checking if subtopics are generating...');
        // Check if main topic has subtopics currently generating
        const progress = await progressTracker.getProgress(mainTopicId);
        if (progress) {
            console.log('📊 Found progress data:', {
                status: progress.status,
                phase: progress.phase,
                subtopicsCount: progress.subtopicsProgress?.length || 0
            });
            // Look for this specific subtopic in progress
            const subtopicProgress = progress.subtopicsProgress?.find(sp => sp.title === subtopic.title || sp.topicId === subtopicId);
            if (subtopicProgress) {
                console.log(`🔄 Found subtopic progress:`, subtopicProgress);
                // If subtopic is currently generating
                if (subtopicProgress.status === 'in_progress') {
                    return res.json({
                        success: false,
                        generating: true,
                        progress: {
                            status: subtopicProgress.status,
                            progress: subtopicProgress.progress || 0,
                            message: `Researching subtopic "${subtopic.title}"...`
                        },
                        message: `Subtopic "${subtopic.title}" is currently being generated`,
                        subtopicTitle: subtopic.title,
                        parentTopicId: mainTopicId
                    });
                }
                // If subtopic completed but content not found (edge case)
                if (subtopicProgress.status === 'completed') {
                    console.warn(`⚠️ Subtopic marked as completed in progress but no content found in database`);
                }
            }
            // Check if subtopics are still being processed in general
            const hasSubtopicsInProgress = progress.subtopicsProgress?.some(sp => sp.status === 'in_progress');
            if (hasSubtopicsInProgress || progress.phase === 'subtopics') {
                // Check if this specific subtopic is planned to be generated
                const isSubtopicPlanned = progress.subtopicsProgress?.some(sp => sp.title === subtopic.title && sp.status === 'pending');
                if (isSubtopicPlanned) {
                    return res.json({
                        success: false,
                        generating: true,
                        progress: {
                            status: 'pending',
                            progress: 0,
                            message: `Subtopic "${subtopic.title}" is queued for generation...`
                        },
                        message: `Subtopic "${subtopic.title}" will be generated soon`,
                        subtopicTitle: subtopic.title,
                        parentTopicId: mainTopicId
                    });
                }
            }
        }
        // No content found and not generating
        console.log('❌ No content found and subtopics are not currently generating');
        return res.status(404).json({
            success: false,
            error: 'Content not found',
            generating: false,
            message: `No content found for subtopic "${subtopic.title}". The subtopic may not have been generated yet.`,
            subtopicTitle: subtopic.title,
            parentTopicId: mainTopicId,
            suggestion: 'Try generating the main topic content first, which will trigger subtopic generation in the background.'
        });
    }
    catch (error) {
        console.error('=== SUBTOPIC CONTENT API ERROR ===');
        console.error('Error details:', error);
        console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('Request body:', req.body);
        console.error('=====================================');
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve subtopic content',
            details: errorMessage,
            message: 'An error occurred while trying to retrieve the subtopic content. Please try again.'
        });
    }
};
//# sourceMappingURL=getSubtopicContent.js.map