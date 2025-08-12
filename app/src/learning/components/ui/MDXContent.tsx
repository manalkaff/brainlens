import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import { 
  BookOpen, 
  Bookmark, 
  BookmarkCheck, 
  Download, 
  FileText, 
  Hash,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';

interface MDXContentProps {
  content: string;
  topicTitle: string;
  bookmarks: string[];
  onToggleBookmark: (sectionId: string) => void;
  onMarkAsRead: (sectionId: string) => void;
  isBookmarked: (sectionId: string) => boolean;
  isRead: (sectionId: string) => boolean;
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
  bookmarks,
  onToggleBookmark,
  onMarkAsRead,
  isBookmarked,
  isRead
}: MDXContentProps) {
  const [tableOfContents, setTableOfContents] = useState<TableOfContentsItem[]>([]);
  const [activeSection, setActiveSection] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);

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
            {renderInlineElements(line)}
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

  const exportToPDF = () => {
    // This would integrate with a PDF generation library
    console.log('Exporting to PDF...');
    // Implementation would go here
  };

  const exportToMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topicTitle.toLowerCase().replace(/\s+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Table of Contents */}
      <div className="lg:col-span-1">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Contents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tableOfContents.map((item) => (
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
                  <span className="truncate">{item.title}</span>
                  <div className="flex items-center gap-1 ml-2">
                    {item.isBookmarked && (
                      <Bookmark className="w-3 h-3 text-yellow-500" />
                    )}
                  </div>
                </div>
              </a>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {topicTitle}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToPDF}
                  className="text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToMarkdown}
                  className="text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  MD
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={contentRef} className="prose prose-sm max-w-none">
              {content ? renderMarkdown(content) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No content available yet.</p>
                  <p className="text-xs mt-2">Content will be generated based on the research for this topic.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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