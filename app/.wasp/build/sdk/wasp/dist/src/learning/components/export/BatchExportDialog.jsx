import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Checkbox } from '../../../components/ui/checkbox';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Separator } from '../../../components/ui/separator';
import { Download, FileText, File, FileImage, Package, Settings, Loader2, X, CheckCircle, AlertCircle } from 'lucide-react';
import { contentExportService } from '../../export/exportService';
export function BatchExportDialog({ topics, topicContentMap, onClose }) {
    const [selectedTopics, setSelectedTopics] = useState(new Set(topics.map(t => t.id)));
    const [selectedFormats, setSelectedFormats] = useState(new Set(['markdown']));
    const [combineIntoSingle, setCombineIntoSingle] = useState(false);
    const [zipOutput, setZipOutput] = useState(false);
    const [templateStyle, setTemplateStyle] = useState('modern');
    const [pageSize, setPageSize] = useState('A4');
    const [orientation, setOrientation] = useState('portrait');
    const [includeMetadata, setIncludeMetadata] = useState(true);
    const [includeProgress, setIncludeProgress] = useState(false);
    const [includeBookmarks, setIncludeBookmarks] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(null);
    const [exportResult, setExportResult] = useState(null);
    const [error, setError] = useState(null);
    const formatOptions = [
        { id: 'markdown', name: 'Markdown', icon: FileText, description: 'Structured text format' },
        { id: 'html', name: 'HTML', icon: File, description: 'Web page format' },
        { id: 'pdf', name: 'PDF', icon: FileImage, description: 'Printable document' },
        { id: 'json', name: 'JSON', icon: Package, description: 'Data format' }
    ];
    const handleTopicToggle = (topicId) => {
        const newSelected = new Set(selectedTopics);
        if (newSelected.has(topicId)) {
            newSelected.delete(topicId);
        }
        else {
            newSelected.add(topicId);
        }
        setSelectedTopics(newSelected);
    };
    const handleFormatToggle = (format) => {
        const newFormats = new Set(selectedFormats);
        if (newFormats.has(format)) {
            newFormats.delete(format);
        }
        else {
            newFormats.add(format);
        }
        setSelectedFormats(newFormats);
    };
    const handleExport = async () => {
        if (selectedTopics.size === 0 || selectedFormats.size === 0) {
            setError('Please select at least one topic and one format');
            return;
        }
        try {
            setIsExporting(true);
            setError(null);
            setExportResult(null);
            // Filter topics and content
            const filteredTopics = topics.filter(t => selectedTopics.has(t.id));
            const filteredContentMap = new Map();
            filteredTopics.forEach(topic => {
                const content = topicContentMap.get(topic);
                if (content) {
                    filteredContentMap.set(topic, content);
                }
            });
            const options = {
                formats: Array.from(selectedFormats),
                topics: filteredTopics,
                combineIntoSingle,
                zipOutput,
                templateStyle,
                pageSize,
                orientation,
                includeMetadata,
                includeProgress,
                includeBookmarks
            };
            const result = await contentExportService.exportWithProgress(filteredContentMap, options, undefined, // userProgressMap - could be added later
            (current, total, currentItem) => {
                setExportProgress({ current, total, currentItem });
            });
            setExportResult(result);
            // Auto-download if successful
            if (result.results.length > 0) {
                contentExportService.downloadBatchResults(result);
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Export failed';
            setError(errorMessage);
        }
        finally {
            setIsExporting(false);
            setExportProgress(null);
        }
    };
    const estimatedFileCount = selectedTopics.size * selectedFormats.size;
    const canCombine = selectedFormats.size === 1;
    return (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Download className="w-5 h-5 mr-2"/>
              <CardTitle>Batch Export</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4"/>
            </Button>
          </div>
          <CardDescription>
            Export multiple topics in various formats
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive"/>
              <p className="text-sm text-destructive">{error}</p>
            </div>)}

          {/* Topic Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Select Topics</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedTopics(new Set(topics.map(t => t.id)))}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedTopics(new Set())}>
                  Clear
                </Button>
              </div>
            </div>
            
            <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
              <div className="space-y-2">
                {topics.map(topic => (<div key={topic.id} className="flex items-center space-x-2">
                    <Checkbox id={`topic-${topic.id}`} checked={selectedTopics.has(topic.id)} onCheckedChange={() => handleTopicToggle(topic.id)}/>
                    <Label htmlFor={`topic-${topic.id}`} className="text-sm flex-1 cursor-pointer">
                      <div className="font-medium">{topic.title}</div>
                      {topic.summary && (<div className="text-xs text-muted-foreground truncate">
                          {topic.summary}
                        </div>)}
                    </Label>
                  </div>))}
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {selectedTopics.size} of {topics.length} topics selected
            </div>
          </div>

          <Separator />

          {/* Format Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold">Export Formats</h3>
            <div className="grid grid-cols-2 gap-3">
              {formatOptions.map(format => (<div key={format.id} className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedFormats.has(format.id)
                ? 'border-primary bg-primary/5'
                : 'border-border hover:bg-muted/50'}`} onClick={() => handleFormatToggle(format.id)}>
                  <div className="flex items-center space-x-2">
                    <Checkbox checked={selectedFormats.has(format.id)} onChange={() => { }} // Handled by onClick
        />
                    <format.icon className="w-4 h-4"/>
                    <div>
                      <div className="font-medium text-sm">{format.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {format.description}
                      </div>
                    </div>
                  </div>
                </div>))}
            </div>
          </div>

          <Separator />

          {/* Export Options */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Settings className="w-4 h-4"/>
              Export Options
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="combine" checked={combineIntoSingle} onCheckedChange={(checked) => setCombineIntoSingle(!!checked)} disabled={!canCombine}/>
                  <Label htmlFor="combine" className="text-sm">
                    Combine into single file
                    {!canCombine && (<span className="text-xs text-muted-foreground block">
                        (Only available with single format)
                      </span>)}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="zip" checked={zipOutput} onCheckedChange={(checked) => setZipOutput(!!checked)}/>
                  <Label htmlFor="zip" className="text-sm">Create ZIP archive</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="metadata" checked={includeMetadata} onCheckedChange={(checked) => setIncludeMetadata(!!checked)}/>
                  <Label htmlFor="metadata" className="text-sm">Include metadata</Label>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Page Size (PDF)</Label>
                  <Select value={pageSize} onValueChange={(value) => setPageSize(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="Letter">Letter</SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Orientation</Label>
                  <Select value={orientation} onValueChange={(value) => setOrientation(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Export Preview */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Export Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Topics:</span>{' '}
                <Badge variant="secondary">{selectedTopics.size}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Formats:</span>{' '}
                <Badge variant="secondary">{selectedFormats.size}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Est. Files:</span>{' '}
                <Badge variant="outline">
                  {combineIntoSingle ? 1 : estimatedFileCount}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Output:</span>{' '}
                <Badge variant={zipOutput ? 'default' : 'outline'}>
                  {zipOutput ? 'ZIP Archive' : 'Individual Files'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Progress */}
          {isExporting && exportProgress && (<div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Exporting...</span>
                <span>{exportProgress.current} / {exportProgress.total}</span>
              </div>
              <Progress value={(exportProgress.current / exportProgress.total) * 100} className="h-2"/>
              <div className="text-xs text-muted-foreground">
                Currently processing: {exportProgress.currentItem}
              </div>
            </div>)}

          {/* Results */}
          {exportResult && (<div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600"/>
                <span className="font-medium text-green-800">Export Completed</span>
              </div>
              <div className="text-sm text-green-700 space-y-1">
                <div>Generated {exportResult.results.length} files</div>
                <div>Total size: {Math.round(exportResult.totalSize / 1024)} KB</div>
                <div>Files downloaded automatically</div>
              </div>
            </div>)}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button onClick={onClose} variant="outline" disabled={isExporting}>
              {exportResult ? 'Close' : 'Cancel'}
            </Button>
            <Button onClick={handleExport} disabled={isExporting || selectedTopics.size === 0 || selectedFormats.size === 0} className="min-w-32">
              {isExporting ? (<>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                  Exporting...
                </>) : (<>
                  <Download className="w-4 h-4 mr-2"/>
                  Export {estimatedFileCount} Files
                </>)}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>);
}
//# sourceMappingURL=BatchExportDialog.jsx.map