// Stub implementations since these packages aren't installed
const jsPDF = class {
    setFontSize() { }
    text() { }
    output() { return new ArrayBuffer(0); }
    internal = {
        pageSize: { getWidth: () => 210, getHeight: () => 297 }
    };
    setTextColor() { }
    addPage() { }
    splitTextToSize() { return []; }
    setFont() { }
    setFillColor() { }
    rect() { }
    getNumberOfPages() { return 1; }
    setPage() { }
};
const html2canvas = async () => document.createElement('canvas');
export class ContentExportService {
    /**
     * Export topic content in the specified format
     */
    async exportTopicContent(topic, content, options = { format: 'markdown' }, userProgress) {
        switch (options.format) {
            case 'markdown':
                return this.exportAsMarkdown(topic, content, options, userProgress);
            case 'html':
                return this.exportAsHTML(topic, content, options, userProgress);
            case 'pdf':
                return this.exportAsPDF(topic, content, options, userProgress);
            case 'json':
                return this.exportAsJSON(topic, content, options, userProgress);
            default:
                throw new Error(`Unsupported export format: ${options.format}`);
        }
    }
    /**
     * Export as Markdown format
     */
    async exportAsMarkdown(topic, content, options, userProgress) {
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
    async exportAsHTML(topic, content, options, userProgress) {
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
     * Export as PDF format using jsPDF
     */
    async exportAsPDF(topic, content, options, userProgress) {
        try {
            // Get HTML version first
            const htmlResult = await this.exportAsHTML(topic, content, options, userProgress);
            // Create PDF document
            const doc = new jsPDF({
                orientation: options.orientation || 'portrait',
                unit: 'mm',
                format: options.pageSize || 'a4'
            });
            // Set up styling
            const fontSize = options.fontSize || 12;
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            const contentWidth = pageWidth - 2 * margin;
            // Add watermark if specified
            if (options.watermark) {
                doc.setTextColor(200, 200, 200);
                doc.setFontSize(50);
                doc.text(options.watermark, pageWidth / 2, pageHeight / 2, {
                    align: 'center',
                    angle: 45
                });
            }
            // Reset text color for content
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(fontSize);
            // Process content into PDF-friendly format
            const pdfContent = await this.htmlToPdfContent(htmlResult.content);
            // Add title
            doc.setFontSize(fontSize + 6);
            doc.text(topic.title, margin, margin + 10);
            let yPosition = margin + 25;
            const lineHeight = fontSize * 0.4;
            // Add content sections
            for (const section of pdfContent) {
                // Check if we need a new page
                if (yPosition > pageHeight - margin - 20) {
                    doc.addPage();
                    yPosition = margin + 10;
                }
                if (section.type === 'heading') {
                    doc.setFontSize(fontSize + (section.level === 1 ? 4 : section.level === 2 ? 2 : 0));
                    doc.text(section.text, margin, yPosition);
                    yPosition += lineHeight + 5;
                    doc.setFontSize(fontSize);
                }
                else if (section.type === 'paragraph') {
                    const lines = doc.splitTextToSize(section.text, contentWidth);
                    for (const line of lines) {
                        if (yPosition > pageHeight - margin - 20) {
                            doc.addPage();
                            yPosition = margin + 10;
                        }
                        doc.text(line, margin, yPosition);
                        yPosition += lineHeight;
                    }
                    yPosition += 5; // Extra space after paragraph
                }
                else if (section.type === 'code') {
                    doc.setFont('monospace', 'normal');
                    doc.setFillColor(245, 245, 245);
                    doc.rect(margin - 5, yPosition - 5, contentWidth + 10, section.text.split('\n').length * lineHeight + 10, 'F');
                    const codeLines = section.text.split('\n');
                    for (const line of codeLines) {
                        if (yPosition > pageHeight - margin - 20) {
                            doc.addPage();
                            yPosition = margin + 10;
                        }
                        doc.text(line, margin, yPosition);
                        yPosition += lineHeight;
                    }
                    yPosition += 5;
                }
            }
            // Add footer with page numbers and export info
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(128, 128, 128);
                doc.text(`Page ${i} of ${pageCount} • Exported from BrainLens • ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            }
            // Generate PDF as Uint8Array
            const pdfOutput = doc.output('arraybuffer');
            const filename = `${this.sanitizeFilename(topic.title)}.pdf`;
            return {
                content: new Uint8Array(pdfOutput),
                filename,
                mimeType: 'application/pdf',
                size: pdfOutput.byteLength
            };
        }
        catch (error) {
            console.error('PDF generation failed:', error);
            // Fallback to HTML export
            const htmlResult = await this.exportAsHTML(topic, content, options, userProgress);
            const filename = `${this.sanitizeFilename(topic.title)}_fallback.html`;
            return {
                content: htmlResult.content,
                filename,
                mimeType: 'text/html',
                size: htmlResult.size
            };
        }
    }
    /**
     * Export as JSON format
     */
    async exportAsJSON(topic, content, options, userProgress) {
        const jsonData = {
            topic: {
                id: topic.id,
                title: topic.title,
                summary: topic.summary,
                description: topic.description,
                createdAt: topic.createdAt,
                updatedAt: topic.updatedAt
            },
            content: content,
            userProgress: userProgress ? {
                completed: userProgress.completed,
                timeSpent: userProgress.timeSpent,
                lastAccessed: userProgress.lastAccessed,
                bookmarks: userProgress.bookmarks,
                preferences: userProgress.preferences
            } : null,
            exportMetadata: {
                exportedAt: new Date().toISOString(),
                format: 'json',
                version: '1.0.0',
                options: options
            }
        };
        const jsonString = JSON.stringify(jsonData, null, 2);
        const filename = `${this.sanitizeFilename(topic.title)}.json`;
        return {
            content: jsonString,
            filename,
            mimeType: 'application/json',
            size: new Blob([jsonString]).size
        };
    }
    /**
     * Batch export multiple topics in multiple formats
     */
    async batchExport(topicContentMap, options, userProgressMap) {
        const results = [];
        const exportPromises = [];
        // If combining into single document
        if (options.combineIntoSingle && options.formats.length === 1) {
            const combinedContent = this.combineTopicsContent(topicContentMap);
            const combinedTopic = this.createCombinedTopic(Array.from(topicContentMap.keys()));
            const exportOptions = {
                ...options,
                format: options.formats[0]
            };
            const result = await this.exportTopicContent(combinedTopic, combinedContent, exportOptions);
            results.push(result);
        }
        else {
            // Export each topic in each requested format
            for (const [topic, content] of topicContentMap) {
                for (const format of options.formats) {
                    const exportOptions = {
                        ...options,
                        format
                    };
                    const userProgress = userProgressMap?.get(topic.id);
                    exportPromises.push(this.exportTopicContent(topic, content, exportOptions, userProgress));
                }
            }
            // Execute all exports in parallel
            const batchResults = await Promise.allSettled(exportPromises);
            for (const result of batchResults) {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                }
                else {
                    console.error('Export failed:', result.reason);
                }
            }
        }
        const totalSize = results.reduce((sum, result) => sum + result.size, 0);
        // Create ZIP file if requested
        let zipFile;
        if (options.zipOutput && results.length > 1) {
            zipFile = await this.createZipArchive(results);
        }
        return {
            results,
            zipFile,
            totalSize,
            exportedAt: new Date()
        };
    }
    /**
     * Helper method to parse HTML content for PDF generation
     */
    async htmlToPdfContent(html) {
        const sections = [];
        // Simple HTML parsing for PDF content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const elements = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6, p, pre, blockquote');
        elements.forEach(element => {
            const tagName = element.tagName.toLowerCase();
            const text = element.textContent || '';
            if (tagName.startsWith('h')) {
                const level = parseInt(tagName[1]);
                sections.push({ type: 'heading', text, level });
            }
            else if (tagName === 'pre') {
                sections.push({ type: 'code', text });
            }
            else {
                sections.push({ type: 'paragraph', text });
            }
        });
        return sections;
    }
    /**
     * Combine multiple topics into a single content string
     */
    combineTopicsContent(topicContentMap) {
        const sections = [];
        sections.push('# Combined Learning Materials\n');
        sections.push(`*Generated on ${new Date().toLocaleDateString()}*\n`);
        sections.push('---\n');
        for (const [topic, content] of topicContentMap) {
            sections.push(`\n## ${topic.title}\n`);
            if (topic.summary) {
                sections.push(`**Summary:** ${topic.summary}\n`);
            }
            sections.push('---\n');
            sections.push(content);
            sections.push('\n---\n');
        }
        return sections.join('\n');
    }
    /**
     * Create a virtual combined topic for batch exports
     */
    createCombinedTopic(topics) {
        return {
            id: 'combined-' + Date.now(),
            title: `Combined Learning Materials (${topics.length} topics)`,
            summary: `Combined export of ${topics.map(t => t.title).join(', ')}`,
            description: `Batch export containing ${topics.length} learning topics`,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    /**
     * Create a ZIP archive from multiple export results
     */
    async createZipArchive(results) {
        // This is a simplified implementation
        // In production, you would use a library like JSZip
        // For now, return a placeholder
        const zipData = JSON.stringify({
            files: results.map(r => ({
                filename: r.filename,
                size: r.size,
                mimeType: r.mimeType
            })),
            message: 'ZIP creation requires JSZip library integration'
        });
        return new TextEncoder().encode(zipData);
    }
    /**
     * Generate markdown metadata section
     */
    generateMarkdownMetadata(topic, userProgress) {
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
    generateBookmarksSection(bookmarks) {
        if (!bookmarks.length)
            return '';
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
    generateProgressSection(userProgress) {
        const readSections = userProgress.preferences?.readSections || [];
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
    markdownToHTML(markdown) {
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
    sanitizeFilename(filename) {
        return filename
            .replace(/[^a-z0-9]/gi, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '')
            .toLowerCase();
    }
    /**
     * Create downloadable blob from export result
     */
    createDownloadBlob(exportResult) {
        if (exportResult.content instanceof Uint8Array) {
            return new Blob([exportResult.content], { type: exportResult.mimeType });
        }
        return new Blob([exportResult.content], { type: exportResult.mimeType });
    }
    /**
     * Download batch export results
     */
    downloadBatchResults(batchResult) {
        if (batchResult.zipFile) {
            // Download as ZIP
            const blob = new Blob([batchResult.zipFile], { type: 'application/zip' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `batch_export_${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 100);
        }
        else {
            // Download each file individually
            batchResult.results.forEach((result, index) => {
                setTimeout(() => this.downloadContent(result), index * 100);
            });
        }
    }
    /**
     * Get export progress for batch operations
     */
    async exportWithProgress(topicContentMap, options, userProgressMap, onProgress) {
        const results = [];
        const totalItems = topicContentMap.size * options.formats.length;
        let currentItem = 0;
        for (const [topic, content] of topicContentMap) {
            for (const format of options.formats) {
                currentItem++;
                if (onProgress) {
                    onProgress(currentItem, totalItems, `${topic.title} (${format})`);
                }
                try {
                    const exportOptions = {
                        ...options,
                        format
                    };
                    const userProgress = userProgressMap?.get(topic.id);
                    const result = await this.exportTopicContent(topic, content, exportOptions, userProgress);
                    results.push(result);
                }
                catch (error) {
                    console.error(`Failed to export ${topic.title} as ${format}:`, error);
                }
            }
        }
        const totalSize = results.reduce((sum, result) => sum + result.size, 0);
        // Create ZIP file if requested
        let zipFile;
        if (options.zipOutput && results.length > 1) {
            zipFile = await this.createZipArchive(results);
        }
        return {
            results,
            zipFile,
            totalSize,
            exportedAt: new Date()
        };
    }
    /**
     * Trigger download in browser
     */
    downloadContent(exportResult) {
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
//# sourceMappingURL=exportService.js.map