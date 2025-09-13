import { redisCache } from '../cache/redisClient';
// Step definitions matching the AI learning agent's 6 steps
export const RESEARCH_STEPS = [
    {
        stepNumber: 0,
        name: 'Understanding Topic',
        description: 'Analyzing and understanding the topic scope and context',
        estimatedDuration: 15,
        progressWeight: 15
    },
    {
        stepNumber: 1,
        name: 'Planning Research',
        description: 'Creating strategic research plan and identifying sources',
        estimatedDuration: 10,
        progressWeight: 10
    },
    {
        stepNumber: 2,
        name: 'Executing Research',
        description: 'Gathering information from multiple search engines and sources',
        estimatedDuration: 30,
        progressWeight: 35
    },
    {
        stepNumber: 3,
        name: 'Analyzing Results',
        description: 'Synthesizing and analyzing gathered research data',
        estimatedDuration: 20,
        progressWeight: 20
    },
    {
        stepNumber: 4,
        name: 'Generating Content',
        description: 'Creating comprehensive learning content from research',
        estimatedDuration: 15,
        progressWeight: 15
    },
    {
        stepNumber: 5,
        name: 'Identifying Subtopics',
        description: 'Extracting related subtopics for deeper exploration',
        estimatedDuration: 5,
        progressWeight: 5
    }
];
export class ProgressTracker {
    PROGRESS_TTL_SECONDS = 24 * 60 * 60; // 24 hours
    KEY_PREFIX = 'research:progress';
    getProgressKey(topicId) {
        return `${this.KEY_PREFIX}:${topicId}`;
    }
    async initializeResearch(topicId, options) {
        const now = new Date().toISOString();
        const initialProgress = {
            topicId,
            topicTitle: options.topicTitle || 'Research Topic',
            status: 'starting',
            phase: 'initialization',
            currentStep: -1,
            totalSteps: RESEARCH_STEPS.length,
            overallProgress: 0,
            message: options.message || 'Initializing research process...',
            startTime: now,
            lastUpdated: now,
            mainTopicCompleted: false,
            steps: RESEARCH_STEPS.map(step => ({
                stepNumber: step.stepNumber,
                name: step.name,
                description: step.description,
                status: 'pending',
                progress: 0
            })),
            completedSteps: [],
            subtopicsProgress: []
        };
        const key = this.getProgressKey(topicId);
        await redisCache.set(key, initialProgress, this.PROGRESS_TTL_SECONDS);
        console.log(`📊 Progress tracker initialized for topic: ${topicId}`);
    }
    async startStep(topicId, stepNumber, customMessage) {
        const progress = await this.getProgress(topicId);
        if (!progress) {
            console.error(`Progress not found for topic: ${topicId}`);
            return;
        }
        const stepInfo = RESEARCH_STEPS.find(s => s.stepNumber === stepNumber);
        if (!stepInfo) {
            console.error(`Step ${stepNumber} not found`);
            return;
        }
        const now = new Date().toISOString();
        // Update the step in the steps array
        const stepIndex = progress.steps.findIndex(s => s.stepNumber === stepNumber);
        if (stepIndex !== -1) {
            progress.steps[stepIndex] = {
                ...progress.steps[stepIndex],
                status: 'in_progress',
                startTime: now,
                progress: 10 // Small initial progress
            };
        }
        // Update overall progress
        progress.currentStep = stepNumber;
        progress.status = 'researching_main';
        progress.phase = 'main_topic';
        progress.message = customMessage || `Step ${stepNumber}: ${stepInfo.name}`;
        progress.lastUpdated = now;
        // Calculate overall progress based on completed steps
        const completedWeight = progress.completedSteps.reduce((sum, step) => {
            const stepDef = RESEARCH_STEPS.find(s => s.stepNumber === step.stepNumber);
            return sum + (stepDef?.progressWeight || 0);
        }, 0);
        const currentStepWeight = stepInfo.progressWeight * 0.1; // 10% of current step
        progress.overallProgress = Math.min(completedWeight + currentStepWeight, 90); // Cap at 90% until complete
        const key = this.getProgressKey(topicId);
        await redisCache.set(key, progress, this.PROGRESS_TTL_SECONDS);
        console.log(`📈 Started step ${stepNumber}: ${stepInfo.name} for topic: ${topicId}`);
    }
    async completeStep(topicId, stepNumber, stepName, result, duration) {
        const progress = await this.getProgress(topicId);
        if (!progress) {
            console.error(`Progress not found for topic: ${topicId}`);
            return;
        }
        const stepInfo = RESEARCH_STEPS.find(s => s.stepNumber === stepNumber);
        if (!stepInfo) {
            console.error(`Step ${stepNumber} not found`);
            return;
        }
        const now = new Date().toISOString();
        // Create completed step info
        const completedStep = {
            stepNumber,
            name: stepName,
            description: stepInfo.description,
            startTime: progress.steps[stepNumber]?.startTime || now,
            endTime: now,
            duration,
            result,
            status: 'completed',
            progress: 100
        };
        // Update the step in the steps array
        const stepIndex = progress.steps.findIndex(s => s.stepNumber === stepNumber);
        if (stepIndex !== -1) {
            progress.steps[stepIndex] = completedStep;
        }
        // Add to completed steps
        const existingIndex = progress.completedSteps.findIndex(s => s.stepNumber === stepNumber);
        if (existingIndex !== -1) {
            progress.completedSteps[existingIndex] = completedStep;
        }
        else {
            progress.completedSteps.push(completedStep);
        }
        // Update overall progress
        const completedWeight = progress.completedSteps.reduce((sum, step) => {
            const stepDef = RESEARCH_STEPS.find(s => s.stepNumber === step.stepNumber);
            return sum + (stepDef?.progressWeight || 0);
        }, 0);
        progress.overallProgress = Math.min(completedWeight, 95); // Cap at 95% until main topic complete
        progress.lastUpdated = now;
        progress.message = `Completed step ${stepNumber}: ${stepName}`;
        const key = this.getProgressKey(topicId);
        await redisCache.set(key, progress, this.PROGRESS_TTL_SECONDS);
        console.log(`✅ Completed step ${stepNumber}: ${stepName} in ${duration}s for topic: ${topicId}`);
    }
    async completeMainTopic(topicId, result) {
        const progress = await this.getProgress(topicId);
        if (!progress) {
            console.error(`Progress not found for topic: ${topicId}`);
            return;
        }
        const now = new Date().toISOString();
        progress.mainTopicCompleted = true;
        progress.mainTopicResult = result;
        progress.status = 'main_completed';
        progress.phase = 'subtopics';
        progress.overallProgress = 100; // Main topic is 100% complete
        progress.message = 'Main topic research completed, processing subtopics...';
        progress.lastUpdated = now;
        const key = this.getProgressKey(topicId);
        await redisCache.set(key, progress, this.PROGRESS_TTL_SECONDS);
        console.log(`🎯 Main topic completed for: ${topicId}`);
    }
    async updatePhase(topicId, phase, message) {
        const progress = await this.getProgress(topicId);
        if (!progress) {
            console.error(`Progress not found for topic: ${topicId}`);
            return;
        }
        const now = new Date().toISOString();
        progress.phase = phase;
        progress.message = message;
        progress.lastUpdated = now;
        if (phase === 'subtopics') {
            progress.status = 'processing_subtopics';
        }
        else if (phase === 'complete') {
            progress.status = 'completed';
            progress.overallProgress = 100;
        }
        const key = this.getProgressKey(topicId);
        await redisCache.set(key, progress, this.PROGRESS_TTL_SECONDS);
        console.log(`🔄 Updated phase to ${phase} for topic: ${topicId}`);
    }
    async updateSubtopicProgress(topicId, subtopicTitle, subtopicProgress) {
        const progress = await this.getProgress(topicId);
        if (!progress) {
            console.error(`Progress not found for topic: ${topicId}`);
            return;
        }
        const now = new Date().toISOString();
        // Find existing subtopic or create new one
        const existingIndex = progress.subtopicsProgress.findIndex(s => s.title === subtopicTitle);
        const updatedSubtopic = {
            title: subtopicTitle,
            status: subtopicProgress.status || 'pending',
            progress: subtopicProgress.progress || 0,
            startTime: subtopicProgress.startTime || (subtopicProgress.status === 'in_progress' ? now : undefined),
            endTime: subtopicProgress.endTime || (subtopicProgress.status === 'completed' ? now : undefined),
            duration: subtopicProgress.duration,
            result: subtopicProgress.result,
            error: subtopicProgress.error,
            topicId: subtopicProgress.topicId // Include database ID
        };
        if (existingIndex !== -1) {
            progress.subtopicsProgress[existingIndex] = updatedSubtopic;
        }
        else {
            progress.subtopicsProgress.push(updatedSubtopic);
        }
        progress.lastUpdated = now;
        // Update message based on subtopic progress
        if (subtopicProgress.status === 'completed') {
            progress.message = `Completed subtopic: ${subtopicTitle}`;
        }
        else if (subtopicProgress.status === 'in_progress') {
            progress.message = `Processing subtopic: ${subtopicTitle}`;
        }
        const key = this.getProgressKey(topicId);
        await redisCache.set(key, progress, this.PROGRESS_TTL_SECONDS);
        console.log(`📝 Updated subtopic progress for ${subtopicTitle}: ${subtopicProgress.status}`);
    }
    async completeResearch(topicId) {
        const progress = await this.getProgress(topicId);
        if (!progress) {
            console.error(`Progress not found for topic: ${topicId}`);
            return;
        }
        const now = new Date().toISOString();
        const startTime = new Date(progress.startTime);
        const totalDuration = (Date.now() - startTime.getTime()) / 1000;
        progress.status = 'completed';
        progress.phase = 'complete';
        progress.overallProgress = 100;
        progress.message = 'Research completed successfully';
        progress.lastUpdated = now;
        progress.totalDuration = totalDuration;
        const key = this.getProgressKey(topicId);
        await redisCache.set(key, progress, this.PROGRESS_TTL_SECONDS);
        console.log(`🏁 Research completed for topic: ${topicId} in ${totalDuration}s`);
    }
    async setError(topicId, error) {
        const progress = await this.getProgress(topicId);
        if (!progress) {
            console.error(`Progress not found for topic: ${topicId}`);
            return;
        }
        const now = new Date().toISOString();
        progress.status = 'failed';
        progress.phase = 'error';
        progress.error = error;
        progress.message = `Research failed: ${error}`;
        progress.lastUpdated = now;
        // Mark current step as failed if there is one
        if (progress.currentStep >= 0 && progress.currentStep < progress.steps.length) {
            progress.steps[progress.currentStep].status = 'failed';
            progress.steps[progress.currentStep].error = error;
        }
        const key = this.getProgressKey(topicId);
        await redisCache.set(key, progress, this.PROGRESS_TTL_SECONDS);
        console.log(`❌ Research failed for topic: ${topicId} - ${error}`);
    }
    async getProgress(topicId) {
        const key = this.getProgressKey(topicId);
        return await redisCache.get(key);
    }
    async setCompleted(topicId, message) {
        const progress = await this.getProgress(topicId);
        if (!progress) {
            // Create a minimal completed progress if it doesn't exist
            const now = new Date().toISOString();
            const completedProgress = {
                topicId,
                topicTitle: 'Cached Content',
                status: 'completed',
                phase: 'complete',
                currentStep: RESEARCH_STEPS.length - 1,
                totalSteps: RESEARCH_STEPS.length,
                overallProgress: 100,
                message,
                startTime: now,
                lastUpdated: now,
                mainTopicCompleted: true,
                steps: RESEARCH_STEPS.map(step => ({
                    stepNumber: step.stepNumber,
                    name: step.name,
                    description: step.description,
                    status: 'completed',
                    progress: 100
                })),
                completedSteps: RESEARCH_STEPS.map(step => ({
                    stepNumber: step.stepNumber,
                    name: step.name,
                    description: step.description,
                    status: 'completed',
                    progress: 100,
                    duration: 0
                })),
                subtopicsProgress: []
            };
            const key = this.getProgressKey(topicId);
            await redisCache.set(key, completedProgress, this.PROGRESS_TTL_SECONDS);
            return;
        }
        const now = new Date().toISOString();
        progress.status = 'completed';
        progress.phase = 'complete';
        progress.overallProgress = 100;
        progress.message = message;
        progress.lastUpdated = now;
        progress.mainTopicCompleted = true;
        const key = this.getProgressKey(topicId);
        await redisCache.set(key, progress, this.PROGRESS_TTL_SECONDS);
        console.log(`✅ Set research as completed for topic: ${topicId}`);
    }
    async cleanupProgress(topicId) {
        const key = this.getProgressKey(topicId);
        await redisCache.del(key);
        console.log(`🧹 Cleaned up progress for topic: ${topicId}`);
    }
    // Utility method to check if Redis is available and fallback gracefully
    async isRedisAvailable() {
        return redisCache.isReady();
    }
    // Get progress with fallback for when Redis is unavailable
    async getProgressWithFallback(topicId) {
        if (!await this.isRedisAvailable()) {
            console.warn('Redis unavailable, returning null progress');
            return null;
        }
        return await this.getProgress(topicId);
    }
}
// Export singleton instance
export const progressTracker = new ProgressTracker();
//# sourceMappingURL=progressTracker.js.map