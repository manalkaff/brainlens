import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Separator } from '../../../components/ui/separator';
import { Input } from '../../../components/ui/input';
import { 
  BookOpen, 
  Bookmark, 
  BookmarkCheck, 
  Download, 
  FileText, 
  Hash,
  Copy,
  Check,
  ExternalLink,
  Search
} from 'lucide-react';

interface SourceAttribution {
  id: string;
  title: string;
  url?: string;
  source: string;
  contentType: string;
  relevanceScore?: number;
}

interface MDXContentProps {
  content: string;
  topicTitle: string;
  sources?: SourceAttribution[];
  bookmarks: string[];
  onToggleBookmark: (sectionId: string) => void;
  onMarkAsRead: (sectionId: string) => void;
  isBookmarked: (sectionId: string) => boolean;
  isRead: (sectionId: string) => boolean;
  isSubtopic?: boolean;
  onBackToMain?: () => void;
}

interface TableOfContentsItem {
  id: string;
  title: string;
  level: number;
  isBookmarked: boolean;
  isRead: boolean;
}

export function MDXContent({
  content,
  topicTitle,
  sources = [],
  bookmarks,
  onToggleBookmark,
  onMarkAsRead,
  isBookmarked,
  isRead
}: MDXContentProps) {
  const [tableOfContents, setTableOfContents] = useState<TableOfContentsItem[]>([]);
  const [activeSection, setActiveSection] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string>('');
  const [contentSearchQuery, setContentSearchQuery] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);

  // Filter table of contents based on search query
  const filteredTableOfContents = useMemo(() => {
    if (!contentSearchQuery) return tableOfContents;
    
    const query = contentSearchQuery.toLowerCase();
    return tableOfContents.filter(item =>
      item.title.toLowerCase().includes(query)
    );
  }, [tableOfContents, contentSearchQuery]);

  // Highlight search text in content
  const highlightSearchText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <span>
        {parts.map((part, index) => 
          regex.test(part) ? (
            <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
              {part}
            </mark>
          ) : part
        )}
      </span>
    );
  };

  // Parse content and extract headings for table of contents
  useEffect(() => {
    if (!content) return;

    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings: TableOfContentsItem[] = [];
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
      if (!contentRef.current) return;

      const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const scrollPosition = window.scrollY + 100;

      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = headings[i] as HTMLElement;
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
  const renderMarkdown = (markdown: string) => {
    // This is a simplified markdown renderer
    // In a real implementation, you'd use a proper MDX processor
    const lines = markdown.split('\n');
    const elements: React.ReactNode[] = [];
    let currentElement = '';
    let inCodeBlock = false;
    let codeLanguage = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End code block
          elements.push(
            <CodeBlock
              key={i}
              code={currentElement}
              language={codeLanguage}
              onCopy={() => copyToClipboard(currentElement)}
              copied={copiedCode === currentElement}
            />
          );
          currentElement = '';
          inCodeBlock = false;
          codeLanguage = '';
        } else {
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
        
        elements.push(
          <HeadingWithActions
            key={i}
            level={level}
            id={id}
            text={text}
            isBookmarked={isBookmarked(id)}
            isRead={isRead(id)}
            onToggleBookmark={() => onToggleBookmark(id)}
            onMarkAsRead={() => onMarkAsRead(id)}
          />
        );
        continue;
      }

      // Paragraphs
      if (line.trim()) {
        elements.push(
          <p key={i} className="mb-4 text-sm leading-relaxed">
            {renderContentWithSources(line)}
          </p>
        );
      }

      // Empty lines
      if (!line.trim() && currentElement) {
        elements.push(<br key={i} />);
      }
    }

    return elements;
  };

  // Function to render content with proper source badges
  const renderContentWithSources = (text: string) => {
    // Split text by source references
    const sourceRefRegex = /\[Source (\d+)\]/g;
    const parts = text.split(sourceRefRegex);
    const elements: React.ReactNode[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // Regular text
        if (parts[i]) {
          elements.push(renderInlineElements(parts[i]));
        }
      } else {
        // Source reference number
        const sourceNum = parseInt(parts[i]);
        const sourceIndex = sourceNum - 1;
        const source = sources[sourceIndex];
        
        if (source) {
          elements.push(
            <SourceBadge
              key={`source-${sourceNum}`}
              source={source}
              sourceNumber={sourceNum}
            />
          );
        }
      }
    }
    
    return <>{elements}</>;
  };

  const renderInlineElements = (text: string) => {
    // Handle inline code
    text = text.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>');
    
    // Handle bold
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Handle italic
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Handle links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1 <ExternalLink className="inline w-3 h-3" /></a>');

    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch (err) {
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
      } as any;

      const exportResult = await contentExportService.exportTopicContent(
        mockTopic,
        content,
        { 
          format: 'pdf',
          includeBookmarks: true,
          includeMetadata: true
        },
        undefined // No user progress for now
      );

      contentExportService.downloadContent(exportResult);
    } catch (error) {
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
      } as any;

      const exportResult = await contentExportService.exportTopicContent(
        mockTopic,
        content,
        { 
          format: 'markdown',
          includeBookmarks: true,
          includeMetadata: true
        },
        undefined // No user progress for now
      );

      contentExportService.downloadContent(exportResult);
    } catch (error) {
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
      } as any;

      const exportResult = await contentExportService.exportTopicContent(
        mockTopic,
        content,
        { 
          format: 'html',
          includeBookmarks: true,
          includeMetadata: true
        },
        undefined // No user progress for now
      );

      contentExportService.downloadContent(exportResult);
    } catch (error) {
      console.error('Failed to export HTML:', error);
    }
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Table of Contents - Fixed Sidebar */}
      <div className="w-64 flex-shrink-0">
        <div className="sticky top-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Contents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Content Search */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input
                  placeholder="Search content..."
                  value={contentSearchQuery}
                  onChange={(e) => setContentSearchQuery(e.target.value)}
                  className="pl-7 text-xs h-7"
                />
              </div>

              {/* Table of Contents */}
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {filteredTableOfContents.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`
                      block text-xs p-2 rounded transition-colors
                      ${activeSection === item.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                      ${item.isRead ? 'line-through opacity-60' : ''}
                    `}
                    style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
                    onClick={() => onMarkAsRead(item.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">
                        {contentSearchQuery ? highlightSearchText(item.title, contentSearchQuery) : item.title}
                      </span>
                      <div className="flex items-center gap-1 ml-2">
                        {item.isBookmarked && (
                          <Bookmark className="w-3 h-3 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  </a>
                ))}
                
                {contentSearchQuery && filteredTableOfContents.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <Search className="w-4 h-4 mx-auto mb-1 opacity-50" />
                    <p className="text-xs">No sections found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sources List */}
          {sources.length > 0 && (
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Sources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sources.map((source, index) => (
                  <div key={source.id} className="text-xs p-2 bg-muted/30 rounded border">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                        {index + 1}
                      </Badge>
                      <span className="font-medium truncate">{source.title}</span>
                    </div>
                    <div className="text-muted-foreground mt-1">
                      {source.source}
                    </div>
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-[10px] flex items-center gap-1 mt-1"
                      >
                        Visit source <ExternalLink className="w-2 h-2" />
                      </a>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Export Actions */}
          <Card className="mt-4">
            <CardContent className="p-3">
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToPDF}
                  className="text-xs w-full"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToMarkdown}
                  className="text-xs w-full"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export Markdown
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToHTML}
                  className="text-xs w-full"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export HTML
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div ref={contentRef} className="prose prose-sm max-w-none">
          {content ? renderMarkdown(content) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No content available yet.</p>
              <p className="text-xs mt-2">Content will be generated based on the research for this topic.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface HeadingWithActionsProps {
  level: number;
  id: string;
  text: string;
  isBookmarked: boolean;
  isRead: boolean;
  onToggleBookmark: () => void;
  onMarkAsRead: () => void;
}

function HeadingWithActions({
  level,
  id,
  text,
  isBookmarked,
  isRead,
  onToggleBookmark,
  onMarkAsRead
}: HeadingWithActionsProps) {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  const sizeClasses = {
    1: 'text-2xl font-bold',
    2: 'text-xl font-semibold',
    3: 'text-lg font-semibold',
    4: 'text-base font-medium',
    5: 'text-sm font-medium',
    6: 'text-sm font-medium'
  };

  return (
    <div className="group relative">
      <HeadingTag
        id={id}
        className={`
          ${sizeClasses[level as keyof typeof sizeClasses]} 
          mb-4 mt-8 scroll-mt-20 flex items-center gap-2
          ${isRead ? 'line-through opacity-60' : ''}
        `}
      >
        {text}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onToggleBookmark}
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-3 h-3 text-yellow-500" />
            ) : (
              <Bookmark className="w-3 h-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#${id}`);
            }}
          >
            <Hash className="w-3 h-3" />
          </Button>
        </div>
      </HeadingTag>
    </div>
  );
}

interface CodeBlockProps {
  code: string;
  language: string;
  onCopy: () => void;
  copied: boolean;
}

function CodeBlock({ code, language, onCopy, copied }: CodeBlockProps) {
  return (
    <div className="relative mb-4">
      <div className="flex items-center justify-between bg-muted px-4 py-2 rounded-t-lg">
        <Badge variant="secondary" className="text-xs">
          {language || 'text'}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopy}
          className="h-6 w-6 p-0"
        >
          {copied ? (
            <Check className="w-3 h-3 text-green-500" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </Button>
      </div>
      <pre className="bg-muted/50 p-4 rounded-b-lg overflow-x-auto">
        <code className="text-xs font-mono">{code.trim()}</code>
      </pre>
    </div>
  );
}

// Source Badge Component
interface SourceBadgeProps {
  source: SourceAttribution;
  sourceNumber: number;
}

function SourceBadge({ source, sourceNumber }: SourceBadgeProps) {
  const handleSourceClick = () => {
    if (source.url) {
      window.open(source.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Badge 
      variant="secondary" 
      className={`
        inline-flex items-center gap-1 text-[10px] px-2 py-0.5 ml-1
        ${source.url ? 'cursor-pointer hover:bg-primary/10 hover:text-primary' : ''}
      `}
      onClick={source.url ? handleSourceClick : undefined}
      title={`${source.source}: ${source.title}${source.url ? ' (Click to visit)' : ''}`}
    >
      <span>Source {sourceNumber}</span>
      {source.url && <ExternalLink className="w-2 h-2" />}
    </Badge>
  );
}