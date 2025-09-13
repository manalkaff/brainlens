import type { UserTopicProgress } from 'wasp/entities';
type BookmarkInput = {
    topicId: string;
    sectionId: string;
};
type UnbookmarkInput = {
    topicId: string;
    sectionId: string;
};
type GetBookmarksInput = {
    topicId: string;
};
type MarkAsReadInput = {
    topicId: string;
    sectionId: string;
};
export declare function addBookmark({ topicId, sectionId }: BookmarkInput, context: any): Promise<UserTopicProgress>;
export declare function removeBookmark({ topicId, sectionId }: UnbookmarkInput, context: any): Promise<UserTopicProgress | null>;
export declare function getTopicBookmarks({ topicId }: GetBookmarksInput, context: any): Promise<string[]>;
export declare function markSectionAsRead({ topicId, sectionId }: MarkAsReadInput, context: any): Promise<UserTopicProgress>;
export declare function getReadSections({ topicId }: GetBookmarksInput, context: any): Promise<string[]>;
export declare function exportTopicContent({ topicId, format }: {
    topicId: string;
    format: 'pdf' | 'markdown';
}, context: any): Promise<{
    downloadUrl: string;
    filename: string;
}>;
export {};
//# sourceMappingURL=operations.d.ts.map