/**
 * Advanced Progress Tracking System
 * Provides comprehensive analytics and insights for learning progress
 */
class AdvancedProgressTracker {
    progressHistory = new Map();
    milestones = new Map();
    achievements = new Map();
    insights = new Map();
    /**
     * Calculate comprehensive progress metrics
     */
    calculateDetailedMetrics(userId, topicId, userProgress, sessionData, assessmentData) {
        const overall = this.calculateOverallProgress(userProgress, sessionData);
        const conceptual = this.calculateConceptualProgress(userProgress, assessmentData);
        const behavioral = this.analyzeBehavioralPatterns(sessionData, assessmentData);
        const temporal = this.analyzeTemporalPatterns(sessionData);
        const performance = this.analyzePerformanceMetrics(assessmentData);
        const engagement = this.calculateEngagementMetrics(sessionData, userProgress);
        const learning = this.assessLearningEffectiveness(userProgress, sessionData, assessmentData);
        const metrics = {
            overall,
            conceptual,
            behavioral,
            temporal,
            performance,
            engagement,
            learning
        };
        // Store historical data
        this.updateProgressHistory(userId + '_' + topicId, metrics);
        return metrics;
    }
    /**
     * Generate personalized learning insights
     */
    generateLearningInsights(metrics, historicalData) {
        const insights = [];
        // Analyze strengths
        const strengths = this.identifyStrengths(metrics);
        if (strengths.length > 0) {
            insights.push({
                type: 'strength',
                title: 'Learning Strengths Identified',
                description: `You excel in: ${strengths.slice(0, 3).join(', ')}`,
                actionable: true,
                priority: 'medium',
                recommendations: [
                    'Leverage these strengths in challenging areas',
                    'Consider helping others in these areas',
                    'Use these skills for advanced topics'
                ],
                data: { strengths },
                generatedAt: new Date()
            });
        }
        // Identify improvement areas
        const improvementAreas = this.identifyImprovementAreas(metrics);
        if (improvementAreas.length > 0) {
            insights.push({
                type: 'improvement',
                title: 'Areas for Development',
                description: `Focus on improving: ${improvementAreas[0]}`,
                actionable: true,
                priority: 'high',
                recommendations: this.generateImprovementRecommendations(improvementAreas[0]),
                data: { improvementAreas },
                generatedAt: new Date()
            });
        }
        // Learning pattern analysis
        const patterns = this.identifyLearningPatterns(metrics, historicalData);
        if (patterns.length > 0) {
            insights.push({
                type: 'pattern',
                title: 'Learning Pattern Detected',
                description: patterns[0].description,
                actionable: patterns[0].actionable,
                priority: 'medium',
                recommendations: patterns[0].recommendations,
                data: patterns[0].data,
                generatedAt: new Date()
            });
        }
        // Performance trend warnings
        if (metrics.performance.assessmentScores.trend === 'declining') {
            insights.push({
                type: 'warning',
                title: 'Performance Decline Detected',
                description: 'Your recent assessment scores are trending downward',
                actionable: true,
                priority: 'high',
                recommendations: [
                    'Review recent material more thoroughly',
                    'Take more frequent breaks',
                    'Consider adjusting study schedule',
                    'Seek help with challenging concepts'
                ],
                data: { trend: metrics.performance.assessmentScores.trend },
                generatedAt: new Date()
            });
        }
        // Engagement warnings
        if (metrics.engagement.motivationLevel < 0.4) {
            insights.push({
                type: 'warning',
                title: 'Low Motivation Detected',
                description: 'Your engagement levels have been declining',
                actionable: true,
                priority: 'high',
                recommendations: [
                    'Try a different learning approach',
                    'Set smaller, achievable goals',
                    'Take a short break to recharge',
                    'Connect with other learners'
                ],
                data: { motivationLevel: metrics.engagement.motivationLevel },
                generatedAt: new Date()
            });
        }
        // Burnout risk
        if (metrics.temporal.burnoutRisk > 0.7) {
            insights.push({
                type: 'warning',
                title: 'Burnout Risk Detected',
                description: 'You may be at risk of learning fatigue',
                actionable: true,
                priority: 'high',
                recommendations: [
                    'Reduce study intensity temporarily',
                    'Increase break frequency',
                    'Vary learning activities',
                    'Focus on review rather than new material'
                ],
                data: { burnoutRisk: metrics.temporal.burnoutRisk },
                generatedAt: new Date()
            });
        }
        return insights;
    }
    /**
     * Track and evaluate achievements
     */
    updateAchievements(userId, metrics, sessionData) {
        const userKey = userId;
        let achievements = this.achievements.get(userKey) || [];
        const newAchievements = [];
        // Define achievement templates
        const achievementTemplates = this.getAchievementTemplates();
        for (const template of achievementTemplates) {
            const existing = achievements.find(a => a.id === template.id);
            if (!existing || existing.progress < 1.0) {
                const progress = this.calculateAchievementProgress(template, metrics, sessionData);
                if (!existing && progress > 0) {
                    // Create new achievement tracking
                    const newAchievement = {
                        ...template,
                        progress,
                        unlockedAt: progress >= 1.0 ? new Date() : undefined
                    };
                    achievements.push(newAchievement);
                    if (progress >= 1.0) {
                        newAchievements.push(newAchievement);
                    }
                }
                else if (existing && progress > existing.progress) {
                    // Update existing achievement
                    existing.progress = progress;
                    if (progress >= 1.0 && !existing.unlockedAt) {
                        existing.unlockedAt = new Date();
                        newAchievements.push(existing);
                    }
                }
            }
        }
        this.achievements.set(userKey, achievements);
        return newAchievements;
    }
    /**
     * Generate personalized recommendations
     */
    generatePersonalizedRecommendations(metrics, insights) {
        const immediate = [];
        const shortTerm = [];
        const longTerm = [];
        // Immediate recommendations based on current state
        if (metrics.engagement.motivationLevel < 0.5) {
            immediate.push('Take a 10-minute break to recharge');
            immediate.push('Switch to a more interactive learning format');
        }
        if (metrics.overall.currentStreak === 0) {
            immediate.push('Complete a short 15-minute session to restart your streak');
        }
        if (metrics.conceptual.knowledgeGaps.length > 0) {
            immediate.push(`Review ${metrics.conceptual.knowledgeGaps[0]} before continuing`);
        }
        // Short-term recommendations (next few sessions)
        if (metrics.performance.assessmentScores.current < 0.7) {
            shortTerm.push('Focus on practice exercises rather than new material');
            shortTerm.push('Schedule review sessions for recently learned concepts');
        }
        if (metrics.behavioral.studyPatterns.consistencyScore < 0.6) {
            shortTerm.push('Establish a regular study schedule');
            shortTerm.push('Set daily learning reminders');
        }
        // Long-term recommendations (next weeks/months)
        if (metrics.learning.transferLearning < 0.6) {
            longTerm.push('Practice applying concepts to real-world scenarios');
            longTerm.push('Work on interdisciplinary connections');
        }
        if (metrics.conceptual.depthOfUnderstanding < 0.7) {
            longTerm.push('Gradually increase the complexity of study materials');
            longTerm.push('Engage with advanced topics in your strong areas');
        }
        return { immediate, shortTerm, longTerm };
    }
    // Private helper methods
    calculateOverallProgress(userProgress, sessionData) {
        const totalTime = sessionData.reduce((sum, session) => sum + (session.duration || 0), 0);
        const currentStreak = this.calculateCurrentStreak(sessionData);
        const longestStreak = this.calculateLongestStreak(sessionData);
        return {
            completion: userProgress.completed ? 1 : 0,
            sectionsCompleted: this.countCompletedSections(userProgress),
            totalSections: 10, // Would be calculated from topic structure
            timeSpent: totalTime,
            estimatedTimeRemaining: this.estimateRemainingTime(userProgress, totalTime),
            currentStreak,
            longestStreak,
            lastActivity: userProgress.lastAccessed,
            startDate: new Date(), // userProgress.createdAt not available
            projectedCompletionDate: this.projectCompletionDate(userProgress, sessionData)
        };
    }
    calculateConceptualProgress(userProgress, assessmentData) {
        const preferences = userProgress.preferences || {};
        const conceptProgress = preferences.conceptProgress || {};
        const totalConcepts = Object.keys(conceptProgress).length || 10;
        const masteryDistribution = conceptProgress;
        const conceptsMastered = Object.values(masteryDistribution).filter((m) => m >= 0.8).length;
        const knowledgeGaps = Object.entries(masteryDistribution)
            .filter(([_, mastery]) => mastery < 0.5)
            .map(([concept, _]) => concept);
        const strengths = Object.entries(masteryDistribution)
            .filter(([_, mastery]) => mastery >= 0.8)
            .map(([concept, _]) => concept);
        return {
            conceptsMastered,
            totalConcepts,
            masteryDistribution,
            knowledgeGaps,
            strengths,
            prerequisites: {
                met: strengths, // Simplified
                missing: knowledgeGaps
            },
            depthOfUnderstanding: this.calculateDepthScore(masteryDistribution),
            breadthOfKnowledge: conceptsMastered / totalConcepts
        };
    }
    analyzeBehavioralPatterns(sessionData, assessmentData) {
        const totalSessions = sessionData.length;
        const totalTime = sessionData.reduce((sum, s) => sum + (s.duration || 0), 0);
        const averageSessionLength = totalSessions > 0 ? totalTime / totalSessions : 0;
        // Analyze study times
        const studyTimes = sessionData.map(s => new Date(s.startTime).getHours());
        const preferredStudyTimes = this.findPreferredTimes(studyTimes);
        // Calculate consistency
        const consistencyScore = this.calculateConsistencyScore(sessionData);
        return {
            studyPatterns: {
                averageSessionLength,
                preferredStudyTimes,
                sessionFrequency: this.calculateWeeklyFrequency(sessionData),
                consistencyScore
            },
            interactionPatterns: {
                conceptExpansions: this.countInteractions(sessionData, 'concept_expansion'),
                questionsAsked: this.countInteractions(sessionData, 'question'),
                resourcesAccessed: this.countInteractions(sessionData, 'resource_access'),
                reviewSessions: this.countInteractions(sessionData, 'review')
            },
            learningStyle: {
                detected: this.detectLearningStyles(sessionData),
                effectiveness: this.calculateStyleEffectiveness(sessionData, assessmentData),
                preferences: this.inferStylePreferences(sessionData)
            }
        };
    }
    analyzeTemporalPatterns(sessionData) {
        const dailyProgress = this.calculateDailyProgress(sessionData);
        const weeklyTrends = this.calculateWeeklyTrends(sessionData);
        const optimalTimes = this.identifyOptimalLearningTimes(sessionData);
        const burnoutRisk = this.assessBurnoutRisk(sessionData);
        return {
            dailyProgress,
            weeklyTrends,
            monthlyGoals: {
                target: 20, // hours per month
                achieved: this.calculateMonthlyHours(sessionData),
                trend: this.calculateMonthlyTrend(sessionData)
            },
            optimalLearningTimes: optimalTimes,
            burnoutRisk
        };
    }
    analyzePerformanceMetrics(assessmentData) {
        const scores = assessmentData.map(a => a.score || 0);
        const recentScores = scores.slice(-5); // Last 5 assessments
        const current = recentScores.length > 0
            ? recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length
            : 0;
        const trend = this.calculateTrend(recentScores);
        return {
            assessmentScores: {
                current,
                highest: Math.max(...scores, 0),
                lowest: Math.min(...scores, 1),
                trend,
                history: assessmentData.map(a => ({
                    date: new Date(a.completedAt || Date.now()),
                    score: a.score || 0,
                    topic: a.topic || 'General'
                }))
            },
            skillProgression: {
                conceptual: current * 0.9, // Simplified calculation
                practical: current * 0.8,
                analytical: current * 0.7,
                synthesis: current * 0.6
            },
            difficultyAdaptation: {
                currentLevel: this.inferCurrentDifficultyLevel(recentScores),
                adaptationHistory: this.trackDifficultyAdaptations(assessmentData)
            }
        };
    }
    calculateEngagementMetrics(sessionData, userProgress) {
        const completionRate = sessionData.filter(s => s.completed).length / Math.max(sessionData.length, 1);
        const voluntaryExtensions = sessionData.filter(s => s.extended).length;
        const helpRequests = sessionData.reduce((sum, s) => sum + (s.helpRequests || 0), 0);
        const motivationLevel = this.calculateMotivationLevel(sessionData, userProgress);
        const engagementTrend = this.calculateEngagementTrend(sessionData);
        return {
            motivationLevel,
            engagementTrend,
            sessionCompletionRate: completionRate,
            voluntaryExtensions,
            helpSeekingBehavior: helpRequests,
            exploratoryBehavior: this.countInteractions(sessionData, 'exploration'),
            socialInteraction: this.countInteractions(sessionData, 'social')
        };
    }
    assessLearningEffectiveness(userProgress, sessionData, assessmentData) {
        const totalTime = sessionData.reduce((sum, s) => sum + (s.duration || 0), 0);
        const averageScore = assessmentData.reduce((sum, a) => sum + (a.score || 0), 0) / Math.max(assessmentData.length, 1);
        const efficiency = totalTime > 0 ? averageScore / (totalTime / 60) : 0; // Score per hour
        return {
            retentionRate: this.calculateRetentionRate(assessmentData),
            transferLearning: this.assessTransferLearning(assessmentData),
            metacognition: this.assessMetacognition(sessionData),
            adaptability: this.assessAdaptability(sessionData),
            efficiency: Math.min(1, efficiency),
            curiosity: this.assessCuriosity(sessionData)
        };
    }
    // Additional helper methods would go here...
    // Due to length constraints, I'll provide key methods
    calculateCurrentStreak(sessionData) {
        // Calculate consecutive days of activity
        const sortedSessions = sessionData
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        let streak = 0;
        let currentDate = new Date();
        for (const session of sortedSessions) {
            const sessionDate = new Date(session.date);
            const daysDiff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff === streak) {
                streak++;
                currentDate = sessionDate;
            }
            else {
                break;
            }
        }
        return streak;
    }
    updateProgressHistory(key, metrics) {
        let history = this.progressHistory.get(key) || [];
        history.push(metrics);
        // Keep only last 30 data points
        if (history.length > 30) {
            history = history.slice(-30);
        }
        this.progressHistory.set(key, history);
    }
    getAchievementTemplates() {
        return [
            {
                id: 'first_session',
                title: 'Getting Started',
                description: 'Complete your first learning session',
                iconName: 'play',
                tier: 'bronze',
                category: 'milestone',
                requirements: ['Complete 1 learning session'],
                progress: 0,
                rarity: 0.9
            },
            {
                id: 'week_streak',
                title: 'Consistent Learner',
                description: 'Learn for 7 consecutive days',
                iconName: 'calendar',
                tier: 'silver',
                category: 'consistency',
                requirements: ['Maintain 7-day learning streak'],
                progress: 0,
                rarity: 0.4
            },
            {
                id: 'concept_master',
                title: 'Concept Master',
                description: 'Achieve 90%+ mastery in 10 concepts',
                iconName: 'brain',
                tier: 'gold',
                category: 'mastery',
                requirements: ['Master 10 concepts with 90%+ score'],
                progress: 0,
                rarity: 0.2
            }
        ];
    }
    calculateAchievementProgress(template, metrics, sessionData) {
        switch (template.id) {
            case 'first_session':
                return sessionData.length > 0 ? 1.0 : 0.0;
            case 'week_streak':
                return Math.min(1.0, metrics.overall.currentStreak / 7);
            case 'concept_master':
                return Math.min(1.0, metrics.conceptual.conceptsMastered / 10);
            default:
                return 0;
        }
    }
    // Simplified implementations for other helper methods
    identifyStrengths(metrics) {
        const strengths = [];
        if (metrics.performance.assessmentScores.current > 0.8)
            strengths.push('Assessment Performance');
        if (metrics.engagement.motivationLevel > 0.8)
            strengths.push('High Engagement');
        if (metrics.overall.currentStreak > 7)
            strengths.push('Consistency');
        return strengths;
    }
    identifyImprovementAreas(metrics) {
        const areas = [];
        if (metrics.performance.assessmentScores.current < 0.6)
            areas.push('Assessment Performance');
        if (metrics.engagement.motivationLevel < 0.5)
            areas.push('Engagement');
        if (metrics.behavioral.studyPatterns.consistencyScore < 0.5)
            areas.push('Study Consistency');
        return areas;
    }
    generateImprovementRecommendations(area) {
        const recommendations = {
            'Assessment Performance': [
                'Review concepts more thoroughly',
                'Practice with additional exercises',
                'Seek help with challenging topics'
            ],
            'Engagement': [
                'Try different learning formats',
                'Set achievable goals',
                'Connect with other learners'
            ],
            'Study Consistency': [
                'Establish regular study times',
                'Use learning reminders',
                'Start with shorter sessions'
            ]
        };
        return recommendations[area] || ['Focus on regular practice'];
    }
    identifyLearningPatterns(metrics, historicalData) {
        const patterns = [];
        // Performance improvement pattern
        if (historicalData.length >= 3) {
            const recentTrend = historicalData.slice(-3).map(h => h.performance.assessmentScores.current);
            if (recentTrend.every((score, i, arr) => i === 0 || score >= arr[i - 1])) {
                patterns.push({
                    description: 'Your performance is consistently improving over time',
                    actionable: true,
                    recommendations: ['Keep up the excellent work', 'Consider increasing difficulty gradually'],
                    data: { trend: recentTrend }
                });
            }
        }
        return patterns;
    }
    // Placeholder implementations for remaining methods
    countCompletedSections(userProgress) { return 0; }
    estimateRemainingTime(userProgress, totalTime) { return 0; }
    projectCompletionDate(userProgress, sessionData) { return undefined; }
    calculateDepthScore(masteryDistribution) { return 0; }
    findPreferredTimes(studyTimes) { return []; }
    calculateConsistencyScore(sessionData) { return 0; }
    calculateWeeklyFrequency(sessionData) { return 0; }
    countInteractions(sessionData, type) { return 0; }
    detectLearningStyles(sessionData) { return []; }
    calculateStyleEffectiveness(sessionData, assessmentData) { return {}; }
    inferStylePreferences(sessionData) { return {}; }
    calculateDailyProgress(sessionData) { return {}; }
    calculateWeeklyTrends(sessionData) { return []; }
    identifyOptimalLearningTimes(sessionData) { return []; }
    assessBurnoutRisk(sessionData) { return 0; }
    calculateMonthlyHours(sessionData) { return 0; }
    calculateMonthlyTrend(sessionData) { return 'stable'; }
    calculateTrend(scores) { return 'stable'; }
    inferCurrentDifficultyLevel(scores) { return 3; }
    trackDifficultyAdaptations(assessmentData) { return []; }
    calculateMotivationLevel(sessionData, userProgress) { return 0.5; }
    calculateEngagementTrend(sessionData) { return 'stable'; }
    calculateRetentionRate(assessmentData) { return 0; }
    assessTransferLearning(assessmentData) { return 0; }
    assessMetacognition(sessionData) { return 0; }
    assessAdaptability(sessionData) { return 0; }
    assessCuriosity(sessionData) { return 0; }
    calculateLongestStreak(sessionData) { return 0; }
}
// Export both class and singleton instance
export { AdvancedProgressTracker };
export const advancedProgressTracker = new AdvancedProgressTracker();
export default AdvancedProgressTracker;
//# sourceMappingURL=progressTracker.js.map