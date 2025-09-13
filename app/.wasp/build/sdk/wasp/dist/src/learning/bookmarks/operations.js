import { HttpError } from 'wasp/server';
// Add a bookmark to a topic section
export async function addBookmark({ topicId, sectionId }, context) {
    if (!context.user) {
        throw new HttpError(401, 'Authentication required');
    }
    const userId = context.user.id;
    // Get existing progress or create new one
    let progress = await context.entities.UserTopicProgress.findUnique({
        where: {
            userId_topicId: {
                userId,
                topicId
            }
        }
    });
    if (!progress) {
        // Create new progress record
        progress = await context.entities.UserTopicProgress.create({
            data: {
                userId,
                topicId,
                completed: false,
                timeSpent: 0,
                preferences: {},
                bookmarks: [sectionId]
            }
        });
    }
    else {
        // Update existing progress
        const currentBookmarks = progress.bookmarks || [];
        if (!currentBookmarks.includes(sectionId)) {
            const updatedBookmarks = [...currentBookmarks, sectionId];
            progress = await context.entities.UserTopicProgress.update({
                where: {
                    userId_topicId: {
                        userId,
                        topicId
                    }
                },
                data: {
                    bookmarks: updatedBookmarks,
                    lastAccessed: new Date()
                }
            });
        }
    }
    return progress;
}
// Remove a bookmark from a topic section
export async function removeBookmark({ topicId, sectionId }, context) {
    if (!context.user) {
        throw new HttpError(401, 'Authentication required');
    }
    const userId = context.user.id;
    const progress = await context.entities.UserTopicProgress.findUnique({
        where: {
            userId_topicId: {
                userId,
                topicId
            }
        }
    });
    if (!progress) {
        return null;
    }
    const currentBookmarks = progress.bookmarks || [];
    const updatedBookmarks = currentBookmarks.filter((id) => id !== sectionId);
    const updatedProgress = await context.entities.UserTopicProgress.update({
        where: {
            userId_topicId: {
                userId,
                topicId
            }
        },
        data: {
            bookmarks: updatedBookmarks,
            lastAccessed: new Date()
        }
    });
    return updatedProgress;
}
// Get all bookmarks for a topic
export async function getTopicBookmarks({ topicId }, context) {
    if (!context.user) {
        throw new HttpError(401, 'Authentication required');
    }
    const userId = context.user.id;
    const progress = await context.entities.UserTopicProgress.findUnique({
        where: {
            userId_topicId: {
                userId,
                topicId
            }
        }
    });
    return progress?.bookmarks || [];
}
// Mark a section as read (using preferences to store read sections)
export async function markSectionAsRead({ topicId, sectionId }, context) {
    if (!context.user) {
        throw new HttpError(401, 'Authentication required');
    }
    const userId = context.user.id;
    // Get existing progress or create new one
    let progress = await context.entities.UserTopicProgress.findUnique({
        where: {
            userId_topicId: {
                userId,
                topicId
            }
        }
    });
    if (!progress) {
        // Create new progress record
        progress = await context.entities.UserTopicProgress.create({
            data: {
                userId,
                topicId,
                completed: false,
                timeSpent: 0,
                preferences: {
                    readSections: [sectionId]
                },
                bookmarks: []
            }
        });
    }
    else {
        // Update existing progress
        const currentPreferences = progress.preferences || {};
        const currentReadSections = currentPreferences.readSections || [];
        if (!currentReadSections.includes(sectionId)) {
            const updatedReadSections = [...currentReadSections, sectionId];
            progress = await context.entities.UserTopicProgress.update({
                where: {
                    userId_topicId: {
                        userId,
                        topicId
                    }
                },
                data: {
                    preferences: {
                        ...currentPreferences,
                        readSections: updatedReadSections
                    },
                    lastAccessed: new Date()
                }
            });
        }
    }
    return progress;
}
// Get read sections for a topic
export async function getReadSections({ topicId }, context) {
    if (!context.user) {
        throw new HttpError(401, 'Authentication required');
    }
    const userId = context.user.id;
    const progress = await context.entities.UserTopicProgress.findUnique({
        where: {
            userId_topicId: {
                userId,
                topicId
            }
        }
    });
    const preferences = progress?.preferences || {};
    return preferences.readSections || [];
}
// Export content functionality
export async function exportTopicContent({ topicId, format }, context) {
    if (!context.user) {
        throw new HttpError(401, 'Authentication required');
    }
    const userId = context.user.id;
    // Get the topic
    const topic = await context.entities.Topic.findUnique({
        where: { id: topicId },
        include: {
            userProgress: {
                where: { userId }
            }
        }
    });
    if (!topic) {
        throw new HttpError(404, 'Topic not found');
    }
    // For now, return a placeholder response
    // In a real implementation, this would generate the actual file
    const filename = `${topic.slug}-content.${format}`;
    const downloadUrl = `/api/learning/export/${topicId}/${format}`;
    return {
        downloadUrl,
        filename
    };
}
//# sourceMappingURL=operations.js.map