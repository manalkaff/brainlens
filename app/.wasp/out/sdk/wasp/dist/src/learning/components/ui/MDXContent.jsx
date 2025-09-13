import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { FileText, Hash, Copy, Check, BookmarkCheck, Bookmark, ExternalLink } from 'lucide-react';
export function MDXContent({ content, topicTitle, sources = [], bookmarks, onToggleBookmark, onMarkAsRead, isBookmarked, isRead }) {
    const [tableOfContents, setTableOfContents] = useState([]);
    const [activeSection, setActiveSection] = useState('');
    const [copiedCode, setCopiedCode] = useState('');
    const [contentSearchQuery, setContentSearchQuery] = useState('');
    const contentRef = useRef(null);
    // Filter table of contents based on search query
    const filteredTableOfContents = useMemo(() => {
        if (!contentSearchQuery)
            return tableOfContents;
        const query = contentSearchQuery.toLowerCase();
        return tableOfContents.filter(item => item.title.toLowerCase().includes(query));
    }, [tableOfContents, contentSearchQuery]);
    // Highlight search text in content
    const highlightSearchText = (text, query) => {
        if (!query)
            return text;
        const regex = new RegExp(`(${query})`, 'gi');
        const parts = text.split(regex);
        return (<span>
        {parts.map((part, index) => regex.test(part) ? (<mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
              {part}
            </mark>) : part)}
      </span>);
    };
    // Parse content and extract headings for table of contents
    useEffect(() => {
        if (!content)
            return;
        const headingRegex = /^(#{1,6})\s+(.+)$/gm;
        const headings = [];
        let match;
        while ((match = headingRegex.exec(content)) !== null) {
            const level = match[1].length;
            const title = match[2].trim();
            const id = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            headings.push({
                id,
                title,
                level,
                isBookmarked: isBookmarked(id),
                isRead: isRead(id)
            });
        }
        setTableOfContents(headings);
    }, [content, bookmarks, isBookmarked, isRead]);
    // Handle scroll to update active section
    useEffect(() => {
        const handleScroll = () => {
            if (!contentRef.current)
                return;
            const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
            const scrollPosition = window.scrollY + 100;
            for (let i = headings.length - 1; i >= 0; i--) {
                const heading = headings[i];
                if (heading.offsetTop <= scrollPosition) {
                    setActiveSection(heading.id);
                    break;
                }
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    // Convert markdown to JSX (simplified version)
    const renderMarkdown = (markdown) => {
        // This is a simplified markdown renderer
        // In a real implementation, you'd use a proper MDX processor
        const lines = markdown.split('\n');
        const elements = [];
        let currentElement = '';
        let inCodeBlock = false;
        let codeLanguage = '';
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Code blocks
            if (line.startsWith('```')) {
                if (inCodeBlock) {
                    // End code block
                    elements.push(<CodeBlock key={i} code={currentElement} language={codeLanguage} onCopy={() => copyToClipboard(currentElement)} copied={copiedCode === currentElement}/>);
                    currentElement = '';
                    inCodeBlock = false;
                    codeLanguage = '';
                }
                else {
                    // Start code block
                    inCodeBlock = true;
                    codeLanguage = line.slice(3).trim();
                    currentElement = '';
                }
                continue;
            }
            if (inCodeBlock) {
                currentElement += line + '\n';
                continue;
            }
            // Headings
            if (line.startsWith('#')) {
                const level = line.match(/^#+/)?.[0].length || 1;
                const text = line.replace(/^#+\s*/, '');
                const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                elements.push(<HeadingWithActions key={i} level={level} id={id} text={text} isBookmarked={isBookmarked(id)} isRead={isRead(id)} onToggleBookmark={() => onToggleBookmark(id)} onMarkAsRead={() => onMarkAsRead(id)}/>);
                continue;
            }
            // Paragraphs
            if (line.trim()) {
                elements.push(<p key={i} className="mb-4 text-sm leading-relaxed">
            {renderContentWithSources(line)}
          </p>);
            }
            // Empty lines
            if (!line.trim() && currentElement) {
                elements.push(<br key={i}/>);
            }
        }
        return elements;
    };
    // Function to render content with proper source badges
    const renderContentWithSources = (text) => {
        // Split text by source references
        const sourceRefRegex = /\[Source (\d+)\]/g;
        const parts = text.split(sourceRefRegex);
        const elements = [];
        for (let i = 0; i < parts.length; i++) {
            if (i % 2 === 0) {
                // Regular text
                if (parts[i]) {
                    elements.push(renderInlineElements(parts[i]));
                }
            }
            else {
                // Source reference number
                const sourceNum = parseInt(parts[i]);
                const sourceIndex = sourceNum - 1;
                const source = sources[sourceIndex];
                if (source) {
                    elements.push(<SourceBadge key={`source-${sourceNum}`} source={source} sourceNumber={sourceNum}/>);
                }
            }
        }
        return <>{elements}</>;
    };
    const renderInlineElements = (text) => {
        // Handle inline code
        text = text.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>');
        // Handle bold
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        // Handle italic
        text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        // Handle links
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1 <ExternalLink className="inline w-3 h-3" /></a>');
        return <span dangerouslySetInnerHTML={{ __html: text }}/>;
    };
    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedCode(text);
            setTimeout(() => setCopiedCode(''), 2000);
        }
        catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };
    const exportToPDF = async () => {
        try {
            // Import the export service dynamically
            const { contentExportService } = await import('../../export/exportService');
            // Create a mock topic object for export
            const mockTopic = {
                id: 'current-topic',
                title: topicTitle,
                summary: null,
                description: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const exportResult = await contentExportService.exportTopicContent(mockTopic, content, {
                format: 'pdf',
                includeBookmarks: true,
                includeMetadata: true
            }, undefined // No user progress for now
            );
            contentExportService.downloadContent(exportResult);
        }
        catch (error) {
            console.error('Failed to export PDF:', error);
        }
    };
    const exportToMarkdown = async () => {
        try {
            // Import the export service dynamically
            const { contentExportService } = await import('../../export/exportService');
            // Create a mock topic object for export
            const mockTopic = {
                id: 'current-topic',
                title: topicTitle,
                summary: null,
                description: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const exportResult = await contentExportService.exportTopicContent(mockTopic, content, {
                format: 'markdown',
                includeBookmarks: true,
                includeMetadata: true
            }, undefined // No user progress for now
            );
            contentExportService.downloadContent(exportResult);
        }
        catch (error) {
            console.error('Failed to export Markdown:', error);
            // Fallback to simple download
            const blob = new Blob([content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${topicTitle.toLowerCase().replace(/\s+/g, '-')}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };
    const exportToHTML = async () => {
        try {
            // Import the export service dynamically
            const { contentExportService } = await import('../../export/exportService');
            // Create a mock topic object for export
            const mockTopic = {
                id: 'current-topic',
                title: topicTitle,
                summary: null,
                description: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const exportResult = await contentExportService.exportTopicContent(mockTopic, content, {
                format: 'html',
                includeBookmarks: true,
                includeMetadata: true
            }, undefined // No user progress for now
            );
            contentExportService.downloadContent(exportResult);
        }
        catch (error) {
            console.error('Failed to export HTML:', error);
        }
    };
    return (<div className="w-full">
      {/* Main Content - Full Width */}
      <div className="w-full">
        <div ref={contentRef} className="prose prose-sm max-w-none">
          {content ? renderMarkdown(content) : (<div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50"/>
              <p>No content available yet.</p>
              <p className="text-xs mt-2">Content will be generated based on the research for this topic.</p>
            </div>)}
        </div>
      </div>
    </div>);
}
function HeadingWithActions({ level, id, text, isBookmarked, isRead, onToggleBookmark, onMarkAsRead }) {
    const HeadingTag = `h${level}`;
    const sizeClasses = {
        1: 'text-2xl font-bold',
        2: 'text-xl font-semibold',
        3: 'text-lg font-semibold',
        4: 'text-base font-medium',
        5: 'text-sm font-medium',
        6: 'text-sm font-medium'
    };
    return (<div className="group relative">
      <HeadingTag id={id} className={`
          ${sizeClasses[level]} 
          mb-4 mt-8 scroll-mt-20 flex items-center gap-2
          ${isRead ? 'line-through opacity-60' : ''}
        `}>
        {text}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onToggleBookmark}>
            {isBookmarked ? (<BookmarkCheck className="w-3 h-3 text-yellow-500"/>) : (<Bookmark className="w-3 h-3"/>)}
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#${id}`);
        }}>
            <Hash className="w-3 h-3"/>
          </Button>
        </div>
      </HeadingTag>
    </div>);
}
function CodeBlock({ code, language, onCopy, copied }) {
    return (<div className="relative mb-4">
      <div className="flex items-center justify-between bg-muted px-4 py-2 rounded-t-lg">
        <Badge variant="secondary" className="text-xs">
          {language || 'text'}
        </Badge>
        <Button variant="ghost" size="sm" onClick={onCopy} className="h-6 w-6 p-0">
          {copied ? (<Check className="w-3 h-3 text-green-500"/>) : (<Copy className="w-3 h-3"/>)}
        </Button>
      </div>
      <pre className="bg-muted/50 p-4 rounded-b-lg overflow-x-auto">
        <code className="text-xs font-mono">{code.trim()}</code>
      </pre>
    </div>);
}
function SourceBadge({ source, sourceNumber }) {
    const handleSourceClick = () => {
        if (source.url) {
            window.open(source.url, '_blank', 'noopener,noreferrer');
        }
    };
    return (<Badge variant="secondary" className={`
        inline-flex items-center gap-1 text-[10px] px-2 py-0.5 ml-1
        ${source.url ? 'cursor-pointer hover:bg-primary/10 hover:text-primary' : ''}
      `} onClick={source.url ? handleSourceClick : undefined} title={`${source.source}: ${source.title}${source.url ? ' (Click to visit)' : ''}`}>
      <span>Source {sourceNumber}</span>
      {source.url && <ExternalLink className="w-2 h-2"/>}
    </Badge>);
}
//# sourceMappingURL=MDXContent.jsx.map