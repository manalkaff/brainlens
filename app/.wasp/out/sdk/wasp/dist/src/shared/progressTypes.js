// Step definitions for the 6-step research process
export const RESEARCH_STEPS = [
    {
        number: 0,
        name: 'Understanding Topic',
        description: 'Analyzing and understanding the research topic'
    },
    {
        number: 1,
        name: 'Planning Research',
        description: 'Creating a comprehensive research plan'
    },
    {
        number: 2,
        name: 'Executing Research',
        description: 'Gathering information from multiple sources'
    },
    {
        number: 3,
        name: 'Processing Information',
        description: 'Analyzing and processing collected data'
    },
    {
        number: 4,
        name: 'Generating Content',
        description: 'Creating structured learning content'
    },
    {
        number: 5,
        name: 'Finalizing Topic',
        description: 'Completing main topic research and content'
    }
];
// Helper functions for working with progress data
export function createInitialProgress(topicId) {
    return {
        topicId,
        status: 'idle',
        progress: 0,
        message: 'Research initialized',
        lastUpdated: new Date()
    };
}
export function createStepStartProgress(topicId, stepNumber, message) {
    const step = RESEARCH_STEPS[stepNumber];
    return {
        topicId,
        status: 'researching_main',
        currentStep: stepNumber,
        stepName: step.name,
        stepDescription: step.description,
        stepStartTime: new Date(),
        progress: Math.round((stepNumber / RESEARCH_STEPS.length) * 100),
        message: message || `Starting ${step.name}`,
        lastUpdated: new Date()
    };
}
export function createStepCompleteProgress(topicId, stepNumber, result, duration, message) {
    const step = RESEARCH_STEPS[stepNumber];
    return {
        topicId,
        status: 'researching_main',
        currentStep: stepNumber,
        stepName: step.name,
        stepDescription: step.description,
        stepEndTime: new Date(),
        stepResult: result,
        progress: Math.round(((stepNumber + 1) / RESEARCH_STEPS.length) * 100),
        message: message || `Completed ${step.name} in ${duration}s`,
        lastUpdated: new Date()
    };
}
export function createMainTopicCompleteProgress(topicId, result, message) {
    return {
        topicId,
        status: 'researching_subtopics',
        progress: 100,
        mainTopicResult: result,
        message: message || 'Main topic research completed, processing subtopics',
        lastUpdated: new Date()
    };
}
export function createSubtopicProgress(subtopicId, title, status, progress, error) {
    return {
        subtopicId,
        title,
        status,
        progress,
        startTime: status === 'in_progress' ? new Date() : undefined,
        endTime: status === 'completed' || status === 'error' ? new Date() : undefined,
        error
    };
}
export function createErrorProgress(topicId, error, currentStep) {
    return {
        topicId,
        status: 'error',
        currentStep,
        progress: 0,
        message: `Research failed: ${error}`,
        error,
        lastUpdated: new Date()
    };
}
export function createCompleteProgress(topicId, mainTopicResult, message) {
    return {
        topicId,
        status: 'completed',
        progress: 100,
        mainTopicResult,
        message: message || 'All research completed successfully',
        lastUpdated: new Date()
    };
}
// Utility function to calculate overall progress including subtopics
export function calculateOverallProgress(mainTopicProgress, subtopicsProgress) {
    // Main topic is 70% of overall progress, subtopics are 30%
    const mainWeight = 0.7;
    const subtopicWeight = 0.3;
    const mainContribution = mainTopicProgress * mainWeight;
    let subtopicContribution = 0;
    if (subtopicsProgress.length > 0) {
        const avgSubtopicProgress = subtopicsProgress.reduce((sum, sub) => sum + sub.progress, 0) / subtopicsProgress.length;
        subtopicContribution = avgSubtopicProgress * subtopicWeight;
    }
    return Math.round(mainContribution + subtopicContribution);
}
// Type guards
export function isResearchInProgress(status) {
    return status === 'researching_main' || status === 'researching_subtopics';
}
export function isResearchComplete(status) {
    return status === 'completed';
}
export function isResearchError(status) {
    return status === 'error';
}
export function isMainTopicComplete(progress) {
    return progress.mainTopicCompleted || progress.status === 'researching_subtopics' || progress.status === 'completed';
}
// Redis key helpers
export function getProgressKey(topicId) {
    return `research:progress:${topicId}`;
}
export function getProgressLockKey(topicId) {
    return `research:progress:lock:${topicId}`;
}
export function getProgressExpirationKey(topicId) {
    return `research:progress:expire:${topicId}`;
}
//# sourceMappingURL=progressTypes.js.map