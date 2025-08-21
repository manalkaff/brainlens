import type { Topic, UserTopicProgress } from 'wasp/entities';

export interface ExportOptions {
  format: 'pdf' | 'markdown' | 'html';
  includeBookmarks?: boolean;
  includeProgress?: boolean;
  includeMetadata?: boolean;
  sections?: string[]; // Specific sections to export
}

export interface ExportResult {
  content: string;
  filename: string;
  mimeType: string;
  size: number;
}

export class ContentExportService {
  /**
   * Export topic content in the specified format
   */
  async exportTopicContent(
    topic: Topic,
    content: string,
    options: ExportOptions = { format: 'markdown' },
    userProgress?: UserTopicProgress
  ): Promise<ExportResult> {
    switch (options.format) {
      case 'markdown':
        return this.exportAsMarkdown(topic, content, options, userProgress);
      case 'html':
        return this.exportAsHTML(topic, content, options, userProgress);
      case 'pdf':
        return this.exportAsPDF(topic, content, options, userProgress);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export as Markdown format
   */
  private async exportAsMarkdown(
    topic: Topic,
    content: string,
    options: ExportOptions,
    userProgress?: UserTopicProgress
  ): Promise<ExportResult> {
    let exportContent = '';

    // Add metadata header
    if (options.includeMetadata) {
      exportContent += this.generateMarkdownMetadata(topic, userProgress);
    }

    // Add main content
    exportContent += content;

    // Add bookmarks section
    if (options.includeBookmarks && userProgress?.bookmarks?.length) {
      exportContent += this.generateBookmarksSection(userProgress.bookmarks);
    }

    // Add progress information
    if (options.includeProgress && userProgress) {
      exportContent += this.generateProgressSection(userProgress);
    }

    const filename = `${this.sanitizeFilename(topic.title)}.md`;
    
    return {
      content: exportContent,
      filename,
      mimeType: 'text/markdown',
      size: new Blob([exportContent]).size
    };
  }

  /**
   * Export as HTML format
   */
  private async exportAsHTML(
    topic: Topic,
    content: string,
    options: ExportOptions,
    userProgress?: UserTopicProgress
  ): Promise<ExportResult> {
    const markdownResult = await this.exportAsMarkdown(topic, content, options, userProgress);
    
    // Convert markdown to HTML (simplified conversion)
    const htmlContent = this.markdownToHTML(markdownResult.content);
    
    const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${topic.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
        }
        h1, h2, h3, h4, h5, h6 {
            color: #2563eb;
            margin-top: 2rem;
            margin-bottom: 1rem;
        }
        code {
            background-color: #f3f4f6;
            padding: 0.2rem 0.4rem;
            border-radius: 0.25rem;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        pre {
            background-color: #f9fafb;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
        }
        blockquote {
            border-left: 4px solid #e5e7eb;
            padding-left: 1rem;
            margin-left: 0;
            font-style: italic;
        }
        .metadata {
            background-color: #f0f9ff;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 2rem;
        }
        .bookmarks {
            background-color: #fefce8;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-top: 2rem;
        }
        .progress {
            background-color: #f0fdf4;
            padding: 1rem;
            border-radius: 0.5rem;
            margin-top: 2rem;
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

    const filename = `${this.sanitizeFilename(topic.title)}.html`;
    
    return {
      content: fullHTML,
      filename,
      mimeType: 'text/html',
      size: new Blob([fullHTML]).size
    };
  }

  /**
   * Export as PDF format (placeholder - would need PDF generation library)
   */
  private async exportAsPDF(
    topic: Topic,
    content: string,
    options: ExportOptions,
    userProgress?: UserTopicProgress
  ): Promise<ExportResult> {
    // This is a placeholder implementation
    // In a real application, you would use a library like puppeteer or jsPDF
    const htmlResult = await this.exportAsHTML(topic, content, options, userProgress);
    
    const filename = `${this.sanitizeFilename(topic.title)}.pdf`;
    
    // For now, return HTML content with PDF mime type
    // In production, this would generate actual PDF
    return {
      content: htmlResult.content,
      filename,
      mimeType: 'application/pdf',
      size: htmlResult.size
    };
  }

  /**
   * Generate markdown metadata section
   */
  private generateMarkdownMetadata(topic: Topic, userProgress?: UserTopicProgress): string {
    const metadata = [
      `# ${topic.title}`,
      '',
      '---',
      '',
      `**Topic:** ${topic.title}`,
      topic.summary ? `**Summary:** ${topic.summary}` : '',
      topic.description ? `**Description:** ${topic.description}` : '',
      `**Created:** ${new Date(topic.createdAt).toLocaleDateString()}`,
      `**Last Updated:** ${new Date(topic.updatedAt).toLocaleDateString()}`,
      userProgress ? `**Last Accessed:** ${new Date(userProgress.lastAccessed).toLocaleDateString()}` : '',
      userProgress ? `**Time Spent:** ${Math.round(userProgress.timeSpent / 60)} minutes` : '',
      userProgress ? `**Completed:** ${userProgress.completed ? 'Yes' : 'No'}` : '',
      '',
      '---',
      ''
    ].filter(line => line !== '').join('\n');

    return metadata;
  }

  /**
   * Generate bookmarks section
   */
  private generateBookmarksSection(bookmarks: string[]): string {
    if (!bookmarks.length) return '';

    return [
      '',
      '## 📖 Bookmarked Sections',
      '',
      ...bookmarks.map(bookmark => `- ${bookmark}`),
      ''
    ].join('\n');
  }

  /**
   * Generate progress section
   */
  private generateProgressSection(userProgress: UserTopicProgress): string {
    const readSections = (userProgress.preferences as any)?.readSections || [];
    
    return [
      '',
      '## 📊 Learning Progress',
      '',
      `**Time Spent:** ${Math.round(userProgress.timeSpent / 60)} minutes`,
      `**Completion Status:** ${userProgress.completed ? 'Completed' : 'In Progress'}`,
      `**Bookmarks:** ${userProgress.bookmarks?.length || 0}`,
      `**Sections Read:** ${readSections.length}`,
      `**Last Accessed:** ${new Date(userProgress.lastAccessed).toLocaleDateString()}`,
      ''
    ].join('\n');
  }

  /**
   * Simple markdown to HTML conversion
   */
  private markdownToHTML(markdown: string): string {
    return markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]*)`/gim, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]*)\]\(([^\)]*)\)/gim, '<a href="$2">$1</a>')
      // Line breaks
      .replace(/\n/gim, '<br>')
      // Horizontal rules
      .replace(/^---$/gim, '<hr>');
  }

  /**
   * Sanitize filename for safe file system usage
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase();
  }

  /**
   * Create downloadable blob from export result
   */
  createDownloadBlob(exportResult: ExportResult): Blob {
    return new Blob([exportResult.content], { type: exportResult.mimeType });
  }

  /**
   * Trigger download in browser
   */
  downloadContent(exportResult: ExportResult): void {
    const blob = this.createDownloadBlob(exportResult);
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = exportResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}

// Export singleton instance
export const contentExportService = new ContentExportService();