import type { Topic, UserTopicProgress } from 'wasp/entities';
export interface ExportOptions {
    format: 'pdf' | 'markdown' | 'html' | 'json';
    includeBookmarks?: boolean;
    includeProgress?: boolean;
    includeMetadata?: boolean;
    sections?: string[];
    templateStyle?: 'modern' | 'classic' | 'minimal';
    pageSize?: 'A4' | 'Letter' | 'Legal';
    orientation?: 'portrait' | 'landscape';
    fontSize?: number;
    includeImages?: boolean;
    watermark?: string;
}
export interface BatchExportOptions extends Omit<ExportOptions, 'format'> {
    formats: ExportOptions['format'][];
    topics: Topic[];
    combineIntoSingle?: boolean;
    zipOutput?: boolean;
}
export interface ExportResult {
    content: string | Uint8Array;
    filename: string;
    mimeType: string;
    size: number;
}
export interface BatchExportResult {
    results: ExportResult[];
    zipFile?: Uint8Array;
    totalSize: number;
    exportedAt: Date;
}
export declare class ContentExportService {
    /**
     * Export topic content in the specified format
     */
    exportTopicContent(topic: Topic, content: string, options?: ExportOptions, userProgress?: UserTopicProgress): Promise<ExportResult>;
    /**
     * Export as Markdown format
     */
    private exportAsMarkdown;
    /**
     * Export as HTML format
     */
    private exportAsHTML;
    /**
     * Export as PDF format using jsPDF
     */
    private exportAsPDF;
    /**
     * Export as JSON format
     */
    private exportAsJSON;
    /**
     * Batch export multiple topics in multiple formats
     */
    batchExport(topicContentMap: Map<Topic, string>, options: BatchExportOptions, userProgressMap?: Map<string, UserTopicProgress>): Promise<BatchExportResult>;
    /**
     * Helper method to parse HTML content for PDF generation
     */
    private htmlToPdfContent;
    /**
     * Combine multiple topics into a single content string
     */
    private combineTopicsContent;
    /**
     * Create a virtual combined topic for batch exports
     */
    private createCombinedTopic;
    /**
     * Create a ZIP archive from multiple export results
     */
    private createZipArchive;
    /**
     * Generate markdown metadata section
     */
    private generateMarkdownMetadata;
    /**
     * Generate bookmarks section
     */
    private generateBookmarksSection;
    /**
     * Generate progress section
     */
    private generateProgressSection;
    /**
     * Simple markdown to HTML conversion
     */
    private markdownToHTML;
    /**
     * Sanitize filename for safe file system usage
     */
    private sanitizeFilename;
    /**
     * Create downloadable blob from export result
     */
    createDownloadBlob(exportResult: ExportResult): Blob;
    /**
     * Download batch export results
     */
    downloadBatchResults(batchResult: BatchExportResult): void;
    /**
     * Get export progress for batch operations
     */
    exportWithProgress(topicContentMap: Map<Topic, string>, options: BatchExportOptions, userProgressMap?: Map<string, UserTopicProgress>, onProgress?: (current: number, total: number, currentItem: string) => void): Promise<BatchExportResult>;
    /**
     * Trigger download in browser
     */
    downloadContent(exportResult: ExportResult): void;
}
export declare const contentExportService: ContentExportService;
//# sourceMappingURL=exportService.d.ts.map