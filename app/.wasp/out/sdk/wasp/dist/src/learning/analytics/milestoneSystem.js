/**
 * Milestone and Achievement System
 * Handles gamification, celebrations, and motivation
 */
export class MilestoneSystem {
    milestoneTemplates = [];
    achievementCategories = [];
    rewardTemplates = [];
    customMilestones = new Map();
    userStreaks = new Map();
    userExperience = new Map();
    constructor() {
        this.initializeDefaultMilestones();
        this.initializeAchievementCategories();
        this.initializeRewardTemplates();
    }
    /**
     * Check for new milestones and achievements
     */
    checkForMilestones(userId, topicId, metrics, previousMetrics) {
        const newMilestones = [];
        const newAchievements = [];
        const celebrations = [];
        let totalXpGained = 0;
        // Check progress milestones
        const progressMilestones = this.checkProgressMilestones(metrics, previousMetrics);
        newMilestones.push(...progressMilestones);
        // Check streak milestones
        const streakMilestones = this.checkStreakMilestones(userId, metrics);
        newMilestones.push(...streakMilestones);
        // Check performance milestones
        const performanceMilestones = this.checkPerformanceMilestones(metrics, previousMetrics);
        newMilestones.push(...performanceMilestones);
        // Check learning behavior milestones
        const behaviorMilestones = this.checkBehaviorMilestones(metrics);
        newMilestones.push(...behaviorMilestones);
        // Generate celebrations for new milestones
        for (const milestone of newMilestones) {
            const celebration = this.createCelebration(milestone, metrics);
            celebrations.push(celebration);
            totalXpGained += this.calculateMilestoneXP(milestone);
        }
        // Update user experience
        this.updateUserExperience(userId, totalXpGained, newMilestones, newAchievements);
        // Check for level-up celebrations
        const levelUpCelebration = this.checkForLevelUp(userId, totalXpGained);
        if (levelUpCelebration) {
            celebrations.push(levelUpCelebration);
        }
        return {
            newMilestones,
            newAchievements,
            celebrations,
            xpGained: totalXpGained
        };
    }
    /**
     * Create personalized milestones based on user behavior
     */
    createPersonalizedMilestones(userId, metrics, insights) {
        const personalizedMilestones = [];
        // Create milestones based on learning patterns
        if (metrics.behavioral.studyPatterns.consistencyScore < 0.5) {
            personalizedMilestones.push({
                id: `consistency_${userId}_${Date.now()}`,
                name: 'Building Consistency',
                description: 'Study for 5 consecutive days',
                achievedAt: new Date(),
                criteria: ['Complete learning sessions on 5 consecutive days'],
                rewards: ['Consistency Badge', '50 XP'],
                difficulty: 'medium',
                category: 'consistency'
            });
        }
        // Create milestones for identified strengths
        const strengths = insights.filter(i => i.type === 'strength');
        if (strengths.length > 0) {
            personalizedMilestones.push({
                id: `strength_${userId}_${Date.now()}`,
                name: 'Leveraging Strengths',
                description: `Use your ${strengths[0].data.strengths[0]} skills to help others`,
                achievedAt: new Date(),
                criteria: ['Apply your strengths in challenging areas'],
                rewards: ['Mentor Badge', '100 XP'],
                difficulty: 'hard',
                category: 'achievement'
            });
        }
        // Create milestones for improvement areas
        const improvementAreas = insights.filter(i => i.type === 'improvement');
        if (improvementAreas.length > 0) {
            personalizedMilestones.push({
                id: `improvement_${userId}_${Date.now()}`,
                name: 'Focused Improvement',
                description: 'Show measurable progress in your development area',
                achievedAt: new Date(),
                criteria: ['Improve performance in identified weak areas'],
                rewards: ['Growth Badge', '75 XP'],
                difficulty: 'medium',
                category: 'achievement'
            });
        }
        // Store personalized milestones
        this.customMilestones.set(userId, personalizedMilestones);
        return personalizedMilestones;
    }
    /**
     * Update streak data and check for streak milestones
     */
    updateStreakData(userId, sessionCompleted, sessionDate) {
        let streakData = this.userStreaks.get(userId);
        if (!streakData) {
            streakData = {
                current: 0,
                longest: 0,
                streakType: 'daily',
                startDate: sessionDate,
                milestones: [3, 7, 14, 30, 60, 100, 365],
                freezes: 3,
                multiplier: 1.0
            };
        }
        if (sessionCompleted) {
            const yesterday = new Date(sessionDate);
            yesterday.setDate(yesterday.getDate() - 1);
            // Check if this continues a streak
            const lastSessionDate = this.getLastSessionDate(userId);
            if (lastSessionDate && this.isSameDay(lastSessionDate, yesterday)) {
                streakData.current += 1;
            }
            else if (!lastSessionDate || !this.isSameDay(lastSessionDate, sessionDate)) {
                // New streak starting
                streakData.current = 1;
                streakData.startDate = sessionDate;
            }
            // Update longest streak
            if (streakData.current > streakData.longest) {
                streakData.longest = streakData.current;
            }
            // Update multiplier based on streak
            streakData.multiplier = Math.min(3.0, 1.0 + (streakData.current / 30));
        }
        this.userStreaks.set(userId, streakData);
        return streakData;
    }
    /**
     * Generate celebration content
     */
    createCelebration(milestone, metrics) {
        const rewards = this.generateRewards(milestone);
        const shareableContent = this.createShareableContent(milestone, metrics);
        // Determine celebration type based on milestone importance
        let celebrationType = 'popup';
        if (milestone.difficulty === 'epic') {
            celebrationType = 'animation';
        }
        else if (milestone.difficulty === 'hard') {
            celebrationType = 'banner';
        }
        return {
            milestone,
            celebrationType,
            rewards,
            shareableContent,
            nextMilestone: this.suggestNextMilestone(milestone, metrics)
        };
    }
    /**
     * Calculate XP rewards based on various factors
     */
    calculateXPReward(action, difficulty, performance, streakMultiplier = 1) {
        const baseXP = {
            'complete_session': 10,
            'complete_assessment': 15,
            'master_concept': 25,
            'help_others': 30,
            'streak_milestone': 50,
            'perfect_score': 100,
            'level_up': 200
        };
        const base = baseXP[action] || 10;
        const difficultyBonus = base * (difficulty / 5); // difficulty 1-5
        const performanceBonus = base * (performance - 0.5) * 0.5; // performance 0-1
        return Math.round((base + difficultyBonus + performanceBonus) * streakMultiplier);
    }
    /**
     * Get user's current level and progress
     */
    getUserLevel(userId) {
        let experience = this.userExperience.get(userId);
        if (!experience) {
            experience = {
                currentXP: 0,
                currentLevel: 1,
                xpToNextLevel: 100,
                totalXP: 0,
                xpSources: {},
                levelBenefits: this.getLevelBenefits(),
                prestigeLevel: 0
            };
            this.userExperience.set(userId, experience);
        }
        return experience;
    }
    /**
     * Get available rewards for redemption
     */
    getAvailableRewards(userId, userLevel) {
        return this.rewardTemplates.filter(reward => {
            // Filter rewards based on user level and other criteria
            return this.canClaimReward(reward, userId, userLevel);
        });
    }
    /**
     * Generate motivational messages
     */
    generateMotivationalMessage(metrics, recentAchievements) {
        // High performance - celebration
        if (metrics.performance.assessmentScores.current > 0.9) {
            return {
                message: "Outstanding performance! You're mastering these concepts brilliantly! 🌟",
                type: 'celebration'
            };
        }
        // Recent achievements - celebration
        if (recentAchievements.length > 0) {
            return {
                message: `Congratulations on earning the "${recentAchievements[0].title}" achievement!`,
                type: 'celebration'
            };
        }
        // Low engagement - encouragement
        if (metrics.engagement.motivationLevel < 0.4) {
            return {
                message: "Every expert was once a beginner. Keep going - you're building something amazing! 💪",
                type: 'encouragement',
                action: 'Take a short break and come back refreshed'
            };
        }
        // Good streak - challenge
        if (metrics.overall.currentStreak > 7) {
            return {
                message: `Amazing ${metrics.overall.currentStreak}-day streak! Ready for your next challenge?`,
                type: 'challenge',
                action: 'Try a more advanced topic'
            };
        }
        // Default encouragement
        return {
            message: "You're making great progress! Keep up the excellent work!",
            type: 'encouragement'
        };
    }
    // Private helper methods
    initializeDefaultMilestones() {
        this.milestoneTemplates = [
            {
                id: 'first_session',
                name: 'First Steps',
                description: 'Complete your first learning session',
                achievedAt: new Date(),
                criteria: ['Complete one learning session'],
                rewards: ['Welcome Badge', '10 XP'],
                difficulty: 'easy',
                category: 'time'
            },
            {
                id: 'week_streak',
                name: 'Weekly Warrior',
                description: 'Study for 7 consecutive days',
                achievedAt: new Date(),
                criteria: ['Maintain 7-day learning streak'],
                rewards: ['Consistency Badge', '100 XP', 'Streak Freeze Token'],
                difficulty: 'medium',
                category: 'consistency'
            },
            {
                id: 'concept_master',
                name: 'Concept Conqueror',
                description: 'Master 10 concepts with 90%+ accuracy',
                achievedAt: new Date(),
                criteria: ['Achieve 90%+ mastery in 10 different concepts'],
                rewards: ['Mastery Badge', '250 XP', 'Advanced Content Unlock'],
                difficulty: 'hard',
                category: 'mastery'
            },
            {
                id: 'speed_learner',
                name: 'Lightning Learner',
                description: 'Complete a learning session in record time while maintaining high accuracy',
                achievedAt: new Date(),
                criteria: ['Complete session 50% faster than average with 85%+ accuracy'],
                rewards: ['Speed Badge', '150 XP'],
                difficulty: 'medium',
                category: 'achievement'
            },
            {
                id: 'perfectionist',
                name: 'Perfectionist',
                description: 'Score 100% on 5 consecutive assessments',
                achievedAt: new Date(),
                criteria: ['Achieve perfect scores on 5 consecutive assessments'],
                rewards: ['Perfect Badge', '300 XP', 'Elite Status'],
                difficulty: 'epic',
                category: 'achievement'
            }
        ];
    }
    initializeAchievementCategories() {
        this.achievementCategories = [
            {
                id: 'getting_started',
                name: 'Getting Started',
                description: 'Your first steps in learning',
                icon: 'play',
                color: '#10B981',
                achievements: []
            },
            {
                id: 'consistency',
                name: 'Consistency',
                description: 'Regular learning achievements',
                icon: 'calendar',
                color: '#3B82F6',
                achievements: []
            },
            {
                id: 'mastery',
                name: 'Mastery',
                description: 'Deep understanding achievements',
                icon: 'brain',
                color: '#8B5CF6',
                achievements: []
            },
            {
                id: 'exploration',
                name: 'Exploration',
                description: 'Curiosity and discovery',
                icon: 'compass',
                color: '#F59E0B',
                achievements: []
            },
            {
                id: 'social',
                name: 'Community',
                description: 'Social learning achievements',
                icon: 'users',
                color: '#EF4444',
                achievements: []
            }
        ];
    }
    initializeRewardTemplates() {
        this.rewardTemplates = [
            {
                id: 'welcome_badge',
                type: 'badge',
                title: 'Welcome Badge',
                description: 'Your first achievement!',
                value: 'Bronze',
                rarity: 'common',
                icon: 'star',
                color: '#CD7F32'
            },
            {
                id: 'streak_freeze',
                type: 'feature',
                title: 'Streak Freeze',
                description: 'Protect your streak for one missed day',
                value: 1,
                rarity: 'uncommon',
                icon: 'shield',
                color: '#3B82F6'
            },
            {
                id: 'advanced_content',
                type: 'unlock',
                title: 'Advanced Content Access',
                description: 'Unlock advanced learning materials',
                value: 'Advanced Tier',
                rarity: 'rare',
                icon: 'lock-open',
                color: '#8B5CF6'
            },
            {
                id: 'custom_avatar',
                type: 'cosmetic',
                title: 'Custom Avatar',
                description: 'Personalize your learning profile',
                value: 'Customization',
                rarity: 'epic',
                icon: 'user',
                color: '#F59E0B'
            }
        ];
    }
    checkProgressMilestones(metrics, previousMetrics) {
        const milestones = [];
        // Check for completion milestones
        const completionThresholds = [0.25, 0.5, 0.75, 1.0];
        for (const threshold of completionThresholds) {
            if (metrics.overall.completion >= threshold &&
                (!previousMetrics || previousMetrics.overall.completion < threshold)) {
                milestones.push({
                    id: `completion_${Math.round(threshold * 100)}`,
                    name: `${Math.round(threshold * 100)}% Complete`,
                    description: `Completed ${Math.round(threshold * 100)}% of the learning material`,
                    achievedAt: new Date(),
                    criteria: [`Reach ${Math.round(threshold * 100)}% completion`],
                    rewards: [`${threshold === 1 ? 'Completion' : 'Progress'} Badge`, `${threshold * 200} XP`],
                    difficulty: threshold === 1 ? 'hard' : 'medium',
                    category: 'mastery'
                });
            }
        }
        return milestones;
    }
    checkStreakMilestones(userId, metrics) {
        const milestones = [];
        const streak = metrics.overall.currentStreak;
        const streakMilestones = [3, 7, 14, 30, 60, 100];
        for (const target of streakMilestones) {
            if (streak === target) {
                milestones.push({
                    id: `streak_${target}`,
                    name: `${target}-Day Streak`,
                    description: `Maintained learning for ${target} consecutive days`,
                    achievedAt: new Date(),
                    criteria: [`Study for ${target} consecutive days`],
                    rewards: [`${target}-Day Badge`, `${target * 5} XP`, 'Streak Multiplier Boost'],
                    difficulty: target >= 30 ? 'hard' : target >= 7 ? 'medium' : 'easy',
                    category: 'consistency'
                });
            }
        }
        return milestones;
    }
    checkPerformanceMilestones(metrics, previousMetrics) {
        const milestones = [];
        // Check for performance improvements
        if (previousMetrics) {
            const currentScore = metrics.performance.assessmentScores.current;
            const previousScore = previousMetrics.performance.assessmentScores.current;
            if (currentScore > previousScore + 0.1) { // 10% improvement
                milestones.push({
                    id: 'performance_improvement',
                    name: 'Getting Better',
                    description: 'Significantly improved your assessment performance',
                    achievedAt: new Date(),
                    criteria: ['Improve assessment scores by 10% or more'],
                    rewards: ['Improvement Badge', '75 XP'],
                    difficulty: 'medium',
                    category: 'achievement'
                });
            }
        }
        // Check for high performance
        if (metrics.performance.assessmentScores.current >= 0.95) {
            milestones.push({
                id: 'high_achiever',
                name: 'High Achiever',
                description: 'Maintained excellent performance across assessments',
                achievedAt: new Date(),
                criteria: ['Achieve 95%+ average assessment score'],
                rewards: ['Excellence Badge', '200 XP', 'Elite Recognition'],
                difficulty: 'hard',
                category: 'achievement'
            });
        }
        return milestones;
    }
    checkBehaviorMilestones(metrics) {
        const milestones = [];
        // Check for engagement milestones
        if (metrics.engagement.exploratoryBehavior > 10) {
            milestones.push({
                id: 'curious_learner',
                name: 'Curious Mind',
                description: 'Explored many additional concepts and resources',
                achievedAt: new Date(),
                criteria: ['Engage in extensive exploratory learning'],
                rewards: ['Explorer Badge', '100 XP', 'Discovery Bonus'],
                difficulty: 'medium',
                category: 'exploration'
            });
        }
        // Check for help-seeking behavior
        if (metrics.engagement.helpSeekingBehavior > 0 &&
            metrics.performance.assessmentScores.trend === 'improving') {
            milestones.push({
                id: 'smart_learner',
                name: 'Smart Learner',
                description: 'Sought help when needed and improved performance',
                achievedAt: new Date(),
                criteria: ['Seek help effectively and show improvement'],
                rewards: ['Wisdom Badge', '150 XP'],
                difficulty: 'medium',
                category: 'achievement'
            });
        }
        return milestones;
    }
    generateRewards(milestone) {
        return milestone.rewards.map((rewardName, index) => {
            const baseReward = this.rewardTemplates.find(r => r.title.toLowerCase().includes(rewardName.toLowerCase())) || this.rewardTemplates[0];
            return {
                ...baseReward,
                id: `${milestone.id}_reward_${index}`,
                title: rewardName,
                claimedAt: new Date()
            };
        });
    }
    createShareableContent(milestone, metrics) {
        return {
            title: `Achievement Unlocked: ${milestone.name}!`,
            description: milestone.description,
            stats: {
                'Study Streak': metrics.overall.currentStreak,
                'Concepts Mastered': metrics.conceptual.conceptsMastered,
                'Average Score': Math.round(metrics.performance.assessmentScores.current * 100) + '%'
            },
            hashtags: ['#Learning', '#Achievement', '#Growth', '#BrainLens']
        };
    }
    suggestNextMilestone(currentMilestone, metrics) {
        // Suggest logical next milestone based on current achievement
        if (currentMilestone.category === 'consistency' && metrics.overall.currentStreak < 14) {
            return this.milestoneTemplates.find(m => m.id === 'streak_14');
        }
        if (currentMilestone.category === 'mastery' && metrics.conceptual.conceptsMastered < 20) {
            return {
                id: 'concept_expert',
                name: 'Concept Expert',
                description: 'Master 20 concepts with 90%+ accuracy',
                achievedAt: new Date(),
                criteria: ['Achieve 90%+ mastery in 20 different concepts'],
                rewards: ['Expert Badge', '500 XP'],
                difficulty: 'hard',
                category: 'mastery'
            };
        }
        return undefined;
    }
    updateUserExperience(userId, xpGained, milestones, achievements) {
        const experience = this.getUserLevel(userId);
        experience.totalXP += xpGained;
        experience.currentXP += xpGained;
        // Check for level up
        while (experience.currentXP >= experience.xpToNextLevel) {
            experience.currentXP -= experience.xpToNextLevel;
            experience.currentLevel += 1;
            experience.xpToNextLevel = this.calculateXPRequirement(experience.currentLevel);
        }
        this.userExperience.set(userId, experience);
    }
    checkForLevelUp(userId, xpGained) {
        const experience = this.getUserLevel(userId);
        // This is a simplified check - in practice, you'd track before/after states
        if (xpGained > 0 && experience.currentLevel > 1) {
            const levelUpMilestone = {
                id: `level_${experience.currentLevel}`,
                name: `Level ${experience.currentLevel}!`,
                description: `Reached learning level ${experience.currentLevel}`,
                achievedAt: new Date(),
                criteria: [`Accumulate enough XP to reach level ${experience.currentLevel}`],
                rewards: [`Level ${experience.currentLevel} Badge`, '200 XP'],
                difficulty: 'medium',
                category: 'achievement'
            };
            return {
                milestone: levelUpMilestone,
                celebrationType: 'animation',
                rewards: this.generateRewards(levelUpMilestone)
            };
        }
        return null;
    }
    calculateMilestoneXP(milestone) {
        const baseXP = {
            'easy': 25,
            'medium': 50,
            'hard': 100,
            'epic': 250
        };
        return baseXP[milestone.difficulty];
    }
    calculateXPRequirement(level) {
        // Exponential XP requirements
        return Math.floor(100 * Math.pow(1.15, level - 1));
    }
    getLevelBenefits() {
        return {
            1: ['Basic learning features'],
            5: ['Advanced analytics', 'Custom themes'],
            10: ['Mentor status', 'Help others feature'],
            20: ['Expert recognition', 'Content creation tools'],
            50: ['Legend status', 'All premium features']
        };
    }
    canClaimReward(reward, userId, userLevel) {
        // Implement reward claiming logic
        return userLevel >= 1; // Simplified
    }
    getLastSessionDate(userId) {
        // This would typically query the database for the user's last session
        // For now, return null as placeholder
        return null;
    }
    isSameDay(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }
}
// Export singleton instance
export const milestoneSystem = new MilestoneSystem();
//# sourceMappingURL=milestoneSystem.js.map