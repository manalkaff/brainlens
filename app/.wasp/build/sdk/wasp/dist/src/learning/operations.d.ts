import type { CreateTopic, GetTopic, GetTopicTree, UpdateTopicProgress, GetUserProgressStats, GetTopicProgressSummary, GetSubtopicContent } from 'wasp/server/operations';
import type { Topic, UserTopicProgress } from 'wasp/entities';
type CreateTopicInput = {
    title: string;
    summary?: string;
    description?: string;
    parentId?: string;
};
export declare const createTopic: CreateTopic<CreateTopicInput, Topic>;
type GetTopicInput = {
    slug: string;
};
type GetTopicOutput = Topic & {
    userProgress?: UserTopicProgress;
    children: Topic[];
    parent?: Topic | null;
};
export declare const getTopic: GetTopic<GetTopicInput, GetTopicOutput>;
type GetTopicTreeItem = Topic & {
    children: GetTopicTreeItem[];
    userProgress?: UserTopicProgress;
};
type GetTopicTreeOutput = GetTopicTreeItem[];
export declare const getTopicTree: GetTopicTree<void, GetTopicTreeOutput>;
type UpdateTopicProgressInput = {
    topicId: string;
    completed?: boolean;
    timeSpent?: number;
    preferences?: Record<string, any>;
    bookmarks?: string[];
};
export declare const updateTopicProgress: UpdateTopicProgress<UpdateTopicProgressInput, UserTopicProgress>;
type UserProgressStats = {
    totalTopics: number;
    completedTopics: number;
    totalTimeSpent: number;
    completionPercentage: number;
    recentActivity: (UserTopicProgress & {
        topic: {
            id: string;
            title: string;
            slug: string;
            depth: number;
        };
    })[];
    topicsInProgress: number;
};
export declare const getUserProgressStats: GetUserProgressStats<void, UserProgressStats>;
type TopicProgressSummaryInput = {
    topicId: string;
};
type TopicProgressSummary = {
    topic: Topic;
    userProgress?: UserTopicProgress;
    childrenProgress: {
        total: number;
        completed: number;
        inProgress: number;
        notStarted: number;
        completionPercentage: number;
    };
    hierarchyProgress: {
        totalTimeSpent: number;
        totalBookmarks: number;
        deepestCompletedLevel: number;
    };
};
export declare const getTopicProgressSummary: GetTopicProgressSummary<TopicProgressSummaryInput, TopicProgressSummary>;
export declare const getSubtopicContentQuery: GetSubtopicContent;
export {};
//# sourceMappingURL=operations.d.ts.map