import React, { useState, useCallback } from 'react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Share2, Copy, Check, AlertCircle, BookOpen } from 'lucide-react';
export function DeepLinkManager({ currentTopic, generateShareableURL, validateDeepLink, onNavigateToDeepLink, className = '' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [testURL, setTestURL] = useState('');
    const [testResult, setTestResult] = useState(null);
    // Generate current URL
    const currentURL = generateShareableURL(currentTopic);
    // Copy URL to clipboard
    const copyToClipboard = useCallback(async (url) => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        catch (error) {
            console.error('Failed to copy URL:', error);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, []);
    // Test a deep link URL
    const testDeepLink = useCallback(() => {
        if (!testURL.trim()) {
            setTestResult({
                isValid: false,
                message: 'Please enter a URL to test'
            });
            return;
        }
        try {
            const url = new URL(testURL);
            const pathParts = url.pathname.split('/').filter(Boolean);
            const subtopicParam = url.searchParams.get('subtopic');
            if (pathParts.length < 2 || pathParts[0] !== 'learn') {
                setTestResult({
                    isValid: false,
                    message: 'Invalid URL format. Expected: /learn/{topic-slug}?subtopic=...'
                });
                return;
            }
            if (!subtopicParam) {
                setTestResult({
                    isValid: true,
                    message: 'Valid main topic URL (no subtopic specified)'
                });
                return;
            }
            const subtopicPath = subtopicParam.split(',').filter(Boolean);
            const result = validateDeepLink(subtopicPath);
            if (result.isValid && result.targetTopic) {
                setTestResult({
                    isValid: true,
                    message: `Valid deep link to: ${result.targetTopic.title}`,
                    topic: result.targetTopic
                });
            }
            else {
                setTestResult({
                    isValid: false,
                    message: result.error || 'Invalid deep link'
                });
            }
        }
        catch (error) {
            setTestResult({
                isValid: false,
                message: 'Invalid URL format'
            });
        }
    }, [testURL, validateDeepLink]);
    // Navigate to tested deep link
    const navigateToTestedLink = useCallback(() => {
        if (!testResult?.isValid || !onNavigateToDeepLink)
            return;
        try {
            const url = new URL(testURL);
            const subtopicParam = url.searchParams.get('subtopic');
            if (subtopicParam) {
                const subtopicPath = subtopicParam.split(',').filter(Boolean);
                onNavigateToDeepLink(subtopicPath);
                setIsOpen(false);
            }
        }
        catch (error) {
            console.error('Failed to navigate to deep link:', error);
        }
    }, [testResult, testURL, onNavigateToDeepLink]);
    return (<Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Share2 className="w-4 h-4 mr-2"/>
          Share
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Topic</DialogTitle>
          <DialogDescription>
            Share a direct link to this topic or test deep links to subtopics.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Topic URL */}
          <div className="space-y-2">
            <Label htmlFor="current-url">Current Topic URL</Label>
            <div className="flex items-center space-x-2">
              <Input id="current-url" value={currentURL} readOnly className="flex-1"/>
              <Button size="sm" onClick={() => copyToClipboard(currentURL)} className="flex-shrink-0">
                {copied ? (<Check className="w-4 h-4"/>) : (<Copy className="w-4 h-4"/>)}
              </Button>
            </div>
            {currentTopic && (<p className="text-sm text-muted-foreground">
                Links to: {currentTopic.title}
              </p>)}
          </div>

          {/* Deep Link Tester */}
          <div className="space-y-3">
            <Label htmlFor="test-url">Test Deep Link</Label>
            <div className="flex items-center space-x-2">
              <Input id="test-url" placeholder="Paste a topic URL to test..." value={testURL} onChange={(e) => setTestURL(e.target.value)} className="flex-1"/>
              <Button size="sm" onClick={testDeepLink} variant="outline">
                Test
              </Button>
            </div>
            
            {testResult && (<Alert className={testResult.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-start space-x-2">
                  {testResult.isValid ? (<Check className="w-4 h-4 text-green-600 mt-0.5"/>) : (<AlertCircle className="w-4 h-4 text-red-600 mt-0.5"/>)}
                  <div className="flex-1">
                    <AlertDescription className={testResult.isValid ? 'text-green-800' : 'text-red-800'}>
                      {testResult.message}
                    </AlertDescription>
                    {testResult.isValid && testResult.topic && onNavigateToDeepLink && (<Button size="sm" variant="outline" onClick={navigateToTestedLink} className="mt-2">
                        <BookOpen className="w-3 h-3 mr-1"/>
                        Go to Topic
                      </Button>)}
                  </div>
                </div>
              </Alert>)}
          </div>

          {/* Usage Instructions */}
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium">Deep Link Format:</p>
            <code className="block p-2 bg-muted rounded text-xs">
              /learn/topic-slug?subtopic=id1,id2,id3
            </code>
            <p>
              The subtopic parameter contains a comma-separated path of topic IDs 
              leading to the specific subtopic you want to link to.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>);
}
// Hook for using deep link manager
export function useDeepLinkManager() {
    const [isValidating, setIsValidating] = useState(false);
    const validateAndNavigate = useCallback(async (url, validateDeepLink, onNavigate) => {
        setIsValidating(true);
        try {
            const urlObj = new URL(url);
            const subtopicParam = urlObj.searchParams.get('subtopic');
            if (subtopicParam) {
                const subtopicPath = subtopicParam.split(',').filter(Boolean);
                const result = validateDeepLink(subtopicPath);
                if (result.isValid) {
                    onNavigate(subtopicPath);
                    return { success: true, message: 'Navigation successful' };
                }
                else {
                    return { success: false, message: result.error || 'Invalid deep link' };
                }
            }
            return { success: false, message: 'No subtopic specified in URL' };
        }
        catch (error) {
            return { success: false, message: 'Invalid URL format' };
        }
        finally {
            setIsValidating(false);
        }
    }, []);
    return {
        isValidating,
        validateAndNavigate
    };
}
//# sourceMappingURL=DeepLinkManager.jsx.map