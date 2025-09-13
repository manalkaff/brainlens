import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Textarea } from '../../../components/ui/textarea';
import { Play, Square, Copy, Download, X, Code, Terminal, FileText, Lightbulb, RefreshCw } from 'lucide-react';
const SUPPORTED_LANGUAGES = {
    javascript: {
        name: 'JavaScript',
        extension: '.js',
        icon: '🟨',
        runner: 'node'
    },
    python: {
        name: 'Python',
        extension: '.py',
        icon: '🐍',
        runner: 'python3'
    },
    typescript: {
        name: 'TypeScript',
        extension: '.ts',
        icon: '🔷',
        runner: 'ts-node'
    },
    html: {
        name: 'HTML/CSS/JS',
        extension: '.html',
        icon: '🌐',
        runner: 'browser'
    }
};
export function CodeSandbox({ initialCode, onClose, topicContext, language = 'javascript' }) {
    const [code, setCode] = useState(initialCode);
    const [output, setOutput] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState(language);
    const [activeTab, setActiveTab] = useState('editor');
    const textareaRef = useRef(null);
    const iframeRef = useRef(null);
    // Auto-detect language from code if possible
    useEffect(() => {
        if (code.includes('function ') || code.includes('const ') || code.includes('let ')) {
            setSelectedLanguage('javascript');
        }
        else if (code.includes('def ') || code.includes('import ') || code.includes('print(')) {
            setSelectedLanguage('python');
        }
        else if (code.includes('<html>') || code.includes('<div>') || code.includes('<!DOCTYPE')) {
            setSelectedLanguage('html');
        }
    }, [code]);
    const executeCode = async () => {
        if (!code.trim())
            return;
        setIsRunning(true);
        const startTime = Date.now();
        try {
            if (selectedLanguage === 'javascript') {
                await executeJavaScript();
            }
            else if (selectedLanguage === 'python') {
                await executePython();
            }
            else if (selectedLanguage === 'html') {
                await executeHTML();
            }
            else if (selectedLanguage === 'typescript') {
                await executeTypeScript();
            }
        }
        catch (error) {
            setOutput({
                output: '',
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                executionTime: Date.now() - startTime
            });
        }
        finally {
            setIsRunning(false);
        }
    };
    const executeJavaScript = async () => {
        const startTime = Date.now();
        try {
            // Create a sandboxed execution environment
            const originalConsoleLog = console.log;
            const logs = [];
            // Override console.log to capture output
            console.log = (...args) => {
                logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '));
            };
            // Execute code in try-catch to handle runtime errors
            const result = new Function(code)();
            // Restore console.log
            console.log = originalConsoleLog;
            const executionTime = Date.now() - startTime;
            setOutput({
                output: logs.length > 0 ? logs.join('\n') : (result !== undefined ? String(result) : 'Code executed successfully (no output)'),
                executionTime
            });
        }
        catch (error) {
            setOutput({
                output: '',
                error: error instanceof Error ? error.message : 'JavaScript execution error',
                executionTime: Date.now() - startTime
            });
        }
    };
    const executePython = async () => {
        const startTime = Date.now();
        // For demonstration purposes, we'll simulate Python execution
        // In a real implementation, you'd use a service like Pyodide or a backend API
        setOutput({
            output: `Python execution simulation for:\n${code}\n\n[Note: Full Python execution requires server-side processing or Pyodide integration]`,
            executionTime: Date.now() - startTime
        });
    };
    const executeTypeScript = async () => {
        const startTime = Date.now();
        // For demonstration, treat as JavaScript
        // In practice, you'd compile TypeScript first
        try {
            await executeJavaScript();
        }
        catch (error) {
            setOutput({
                output: '',
                error: 'TypeScript compilation/execution error (treating as JavaScript)',
                executionTime: Date.now() - startTime
            });
        }
    };
    const executeHTML = async () => {
        const startTime = Date.now();
        if (iframeRef.current) {
            // Create a blob URL for the HTML content
            const blob = new Blob([code], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            iframeRef.current.src = url;
            setOutput({
                output: 'HTML rendered in preview pane',
                executionTime: Date.now() - startTime
            });
            // Clean up blob URL after a delay
            setTimeout(() => URL.revokeObjectURL(url), 5000);
        }
    };
    const copyCode = () => {
        navigator.clipboard.writeText(code);
    };
    const downloadCode = () => {
        const lang = SUPPORTED_LANGUAGES[selectedLanguage];
        const filename = `code_${Date.now()}${lang.extension}`;
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    const generateExample = () => {
        const examples = {
            javascript: `// ${topicContext} Example
console.log("Hello, ${topicContext}!");

// Simple function demonstration
function demonstrate${topicContext.replace(/\\s+/g, '')}() {
  const message = "This is a ${topicContext} example";
  return message;
}

console.log(demonstrate${topicContext.replace(/\\s+/g, '')}());`,
            python: `# ${topicContext} Example
print(f"Hello, ${topicContext}!")

# Simple function demonstration
def demonstrate_${topicContext.toLowerCase().replace(/\\s+/g, '_')}():
    message = f"This is a ${topicContext} example"
    return message

print(demonstrate_${topicContext.toLowerCase().replace(/\\s+/g, '_')}())`,
            html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${topicContext} Example</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .highlight { color: #007acc; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Welcome to <span class="highlight">${topicContext}</span></h1>
    <p>This is an interactive example demonstrating ${topicContext}.</p>
    
    <script>
        console.log("${topicContext} example loaded!");
        document.addEventListener('DOMContentLoaded', function() {
            alert('Hello from ${topicContext}!');
        });
    </script>
</body>
</html>`,
            typescript: `// ${topicContext} TypeScript Example
interface ${topicContext.replace(/\\s+/g, '')}Config {
  name: string;
  version: number;
  enabled: boolean;
}

const config: ${topicContext.replace(/\\s+/g, '')}Config = {
  name: "${topicContext}",
  version: 1.0,
  enabled: true
};

function demonstrate(config: ${topicContext.replace(/\\s+/g, '')}Config): string {
  return \`Demonstrating \${config.name} v\${config.version}\`;
}

console.log(demonstrate(config));`
        };
        setCode(examples[selectedLanguage] || examples.javascript);
    };
    const clearCode = () => {
        setCode('');
        setOutput(null);
    };
    const langInfo = SUPPORTED_LANGUAGES[selectedLanguage];
    return (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl h-[90vh] flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5"/>
              Code Sandbox - {topicContext}
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Language Selector */}
              <div className="flex border rounded-lg">
                {Object.entries(SUPPORTED_LANGUAGES).map(([key, lang]) => (<Button key={key} variant={selectedLanguage === key ? 'default' : 'ghost'} size="sm" onClick={() => setSelectedLanguage(key)} className="px-3 py-1 text-xs rounded-none first:rounded-l-lg last:rounded-r-lg">
                    <span className="mr-1">{lang.icon}</span>
                    {lang.name}
                  </Button>))}
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4"/>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="editor" className="flex items-center gap-2">
                  <Code className="w-4 h-4"/>
                  Editor
                </TabsTrigger>
                <TabsTrigger value="output" className="flex items-center gap-2">
                  <Terminal className="w-4 h-4"/>
                  Output
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2" disabled={selectedLanguage !== 'html'}>
                  <FileText className="w-4 h-4"/>
                  Preview
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="editor" className="flex-1 p-4">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {langInfo.icon} {langInfo.name}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {code.split('\\n').length} lines
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={generateExample} className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4"/>
                      Example
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearCode} className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4"/>
                      Clear
                    </Button>
                    <Button variant="outline" size="sm" onClick={copyCode} className="flex items-center gap-2">
                      <Copy className="w-4 h-4"/>
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadCode} className="flex items-center gap-2">
                      <Download className="w-4 h-4"/>
                      Download
                    </Button>
                    <Button onClick={executeCode} disabled={isRunning || !code.trim()} className="flex items-center gap-2">
                      {isRunning ? (<Square className="w-4 h-4"/>) : (<Play className="w-4 h-4"/>)}
                      {isRunning ? 'Running...' : 'Run'}
                    </Button>
                  </div>
                </div>

                <Textarea ref={textareaRef} value={code} onChange={(e) => setCode(e.target.value)} placeholder={`Enter your ${langInfo.name} code here...`} className="flex-1 font-mono text-sm min-h-0 resize-none" style={{ height: 'calc(100% - 60px)' }}/>
              </div>
            </TabsContent>

            <TabsContent value="output" className="flex-1 p-4">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium">Execution Output</h3>
                  {output && (<Badge variant="outline" className="text-xs">
                      Executed in {output.executionTime}ms
                    </Badge>)}
                </div>

                <div className="flex-1 border rounded-lg p-4 bg-slate-50 font-mono text-sm overflow-auto">
                  {!output && (<div className="text-muted-foreground">
                      Click "Run" to execute your code and see the output here.
                    </div>)}
                  
                  {output && (<div>
                      {output.error && (<div className="text-red-600 mb-2">
                          <strong>Error:</strong> {output.error}
                        </div>)}
                      {output.output && (<div className="whitespace-pre-wrap">
                          {output.output}
                        </div>)}
                    </div>)}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 p-4">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium">HTML Preview</h3>
                  <Badge variant="outline" className="text-xs">
                    Live Preview
                  </Badge>
                </div>

                <iframe ref={iframeRef} className="flex-1 border rounded-lg bg-white" title="Code Preview" sandbox="allow-scripts allow-same-origin"/>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>);
}
//# sourceMappingURL=CodeSandbox.jsx.map