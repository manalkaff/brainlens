import type { DetailedProgressMetrics, Achievement, ProgressMilestone, LearningInsight } from './progressTracker';
export interface MilestoneCelebration {
    milestone: ProgressMilestone;
    celebrationType: 'popup' | 'banner' | 'animation' | 'sound';
    rewards: Reward[];
    shareableContent?: ShareableContent;
    nextMilestone?: ProgressMilestone;
}
export interface Reward {
    id: string;
    type: 'badge' | 'points' | 'unlock' | 'cosmetic' | 'feature' | 'content';
    title: string;
    description: string;
    value: number | string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    icon?: string;
    color?: string;
    claimedAt?: Date;
}
export interface ShareableContent {
    title: string;
    description: string;
    imageUrl?: string;
    stats: Record<string, string | number>;
    hashtags: string[];
}
export interface AchievementCategory {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    achievements: Achievement[];
}
export interface StreakData {
    current: number;
    longest: number;
    streakType: 'daily' | 'weekly' | 'session';
    startDate: Date;
    milestones: number[];
    freezes: number;
    multiplier: number;
}
export interface ExperienceSystem {
    currentXP: number;
    currentLevel: number;
    xpToNextLevel: number;
    totalXP: number;
    xpSources: Record<string, number>;
    levelBenefits: Record<number, string[]>;
    prestigeLevel?: number;
}
/**
 * Milestone and Achievement System
 * Handles gamification, celebrations, and motivation
 */
export declare class MilestoneSystem {
    private milestoneTemplates;
    private achievementCategories;
    private rewardTemplates;
    private customMilestones;
    private userStreaks;
    private userExperience;
    constructor();
    /**
     * Check for new milestones and achievements
     */
    checkForMilestones(userId: string, topicId: string, metrics: DetailedProgressMetrics, previousMetrics?: DetailedProgressMetrics): {
        newMilestones: ProgressMilestone[];
        newAchievements: Achievement[];
        celebrations: MilestoneCelebration[];
        xpGained: number;
    };
    /**
     * Create personalized milestones based on user behavior
     */
    createPersonalizedMilestones(userId: string, metrics: DetailedProgressMetrics, insights: LearningInsight[]): ProgressMilestone[];
    /**
     * Update streak data and check for streak milestones
     */
    updateStreakData(userId: string, sessionCompleted: boolean, sessionDate: Date): StreakData;
    /**
     * Generate celebration content
     */
    createCelebration(milestone: ProgressMilestone, metrics: DetailedProgressMetrics): MilestoneCelebration;
    /**
     * Calculate XP rewards based on various factors
     */
    calculateXPReward(action: string, difficulty: number, performance: number, streakMultiplier?: number): number;
    /**
     * Get user's current level and progress
     */
    getUserLevel(userId: string): ExperienceSystem;
    /**
     * Get available rewards for redemption
     */
    getAvailableRewards(userId: string, userLevel: number): Reward[];
    /**
     * Generate motivational messages
     */
    generateMotivationalMessage(metrics: DetailedProgressMetrics, recentAchievements: Achievement[]): {
        message: string;
        type: 'encouragement' | 'celebration' | 'challenge' | 'reminder';
        action?: string;
    };
    private initializeDefaultMilestones;
    private initializeAchievementCategories;
    private initializeRewardTemplates;
    private checkProgressMilestones;
    private checkStreakMilestones;
    private checkPerformanceMilestones;
    private checkBehaviorMilestones;
    private generateRewards;
    private createShareableContent;
    private suggestNextMilestone;
    private updateUserExperience;
    private checkForLevelUp;
    private calculateMilestoneXP;
    private calculateXPRequirement;
    private getLevelBenefits;
    private canClaimReward;
    private getLastSessionDate;
    private isSameDay;
}
export declare const milestoneSystem: MilestoneSystem;
//# sourceMappingURL=milestoneSystem.d.ts.map