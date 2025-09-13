import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Checkbox } from '../../../components/ui/checkbox';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Separator } from '../../../components/ui/separator';
import { Slider } from '../../../components/ui/slider';
import { Download, FileText, File, FileImage, Package, Settings, Palette, FileType, Loader2, X, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import { contentExportService } from '../../export/exportService';
export function EnhancedExportDialog({ topic, content, onClose }) {
    const [selectedFormat, setSelectedFormat] = useState('markdown');
    const [templateStyle, setTemplateStyle] = useState('modern');
    const [pageSize, setPageSize] = useState('A4');
    const [orientation, setOrientation] = useState('portrait');
    const [fontSize, setFontSize] = useState([12]);
    const [includeMetadata, setIncludeMetadata] = useState(true);
    const [includeProgress, setIncludeProgress] = useState(false);
    const [includeBookmarks, setIncludeBookmarks] = useState(false);
    const [includeImages, setIncludeImages] = useState(true);
    const [watermark, setWatermark] = useState('');
    const [customFilename, setCustomFilename] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [exportResult, setExportResult] = useState(null);
    const [previewContent, setPreviewContent] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [error, setError] = useState(null);
    const formatOptions = [
        {
            id: 'markdown',
            name: 'Markdown',
            icon: FileText,
            description: 'Structured text format with formatting',
            features: ['Lightweight', 'Git-friendly', 'Cross-platform'],
            mimeType: 'text/markdown'
        },
        {
            id: 'html',
            name: 'HTML',
            icon: File,
            description: 'Web page format with styling',
            features: ['Rich formatting', 'Embedded styles', 'Interactive'],
            mimeType: 'text/html'
        },
        {
            id: 'pdf',
            name: 'PDF',
            icon: FileImage,
            description: 'Professional document format',
            features: ['Print-ready', 'Fixed layout', 'Universal'],
            mimeType: 'application/pdf'
        },
        {
            id: 'json',
            name: 'JSON',
            icon: Package,
            description: 'Structured data format',
            features: ['Machine-readable', 'API-friendly', 'Structured'],
            mimeType: 'application/json'
        }
    ];
    const templateStyles = [
        { id: 'modern', name: 'Modern', description: 'Clean, minimal design with contemporary styling' },
        { id: 'classic', name: 'Classic', description: 'Traditional academic document style' },
        { id: 'minimal', name: 'Minimal', description: 'Ultra-clean design with minimal decoration' }
    ];
    const currentFormat = formatOptions.find(f => f.id === selectedFormat);
    const handlePreview = async () => {
        try {
            setShowPreview(true);
            const options = {
                format: selectedFormat,
                templateStyle,
                pageSize,
                orientation,
                fontSize: fontSize[0],
                includeMetadata,
                includeProgress,
                includeBookmarks,
                includeImages,
                watermark: watermark || undefined
            };
            const result = await contentExportService.exportTopicContent(topic, content, options);
            if (selectedFormat === 'html') {
                setPreviewContent(result.content);
            }
            else if (selectedFormat === 'markdown') {
                setPreviewContent(result.content);
            }
            else {
                setPreviewContent(`Preview not available for ${selectedFormat.toUpperCase()} format`);
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Preview generation failed';
            setError(errorMessage);
        }
    };
    const handleExport = async () => {
        try {
            setIsExporting(true);
            setError(null);
            const options = {
                format: selectedFormat,
                templateStyle,
                pageSize,
                orientation,
                fontSize: fontSize[0],
                includeMetadata,
                includeProgress,
                includeBookmarks,
                includeImages,
                watermark: watermark || undefined
            };
            const result = await contentExportService.exportTopicContent(topic, content, options);
            // Override filename if custom one provided
            if (customFilename.trim()) {
                const extension = result.filename.split('.').pop();
                result.filename = `${customFilename.trim()}.${extension}`;
            }
            setExportResult(result);
            // Auto-download
            contentExportService.downloadContent(result);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Export failed';
            setError(errorMessage);
        }
        finally {
            setIsExporting(false);
        }
    };
    const estimatedSize = Math.round(content.length * 1.2 / 1024); // Rough estimate in KB
    return (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-6xl h-[90vh] flex gap-4">
        {/* Main Export Panel */}
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Download className="w-5 h-5 mr-2"/>
                <div>
                  <CardTitle>Enhanced Export</CardTitle>
                  <CardDescription>{topic.title}</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4"/>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto space-y-6">
            {error && (<div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive"/>
                <p className="text-sm text-destructive">{error}</p>
              </div>)}

            {/* Format Selection */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileType className="w-4 h-4"/>
                Export Format
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {formatOptions.map(format => (<div key={format.id} className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedFormat === format.id
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border hover:bg-muted/50'}`} onClick={() => setSelectedFormat(format.id)}>
                    <div className="flex items-start gap-3">
                      <format.icon className="w-5 h-5 mt-0.5"/>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{format.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {format.mimeType}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {format.description}
                        </p>
                        <div className="flex gap-1">
                          {format.features.map(feature => (<Badge key={feature} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>))}
                        </div>
                      </div>
                    </div>
                  </div>))}
              </div>
            </div>

            <Separator />

            {/* Style Options */}
            {(selectedFormat === 'html' || selectedFormat === 'pdf') && (<>
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Palette className="w-4 h-4"/>
                    Style & Layout
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label className="text-sm font-medium">Template Style</Label>
                      <Select value={templateStyle} onValueChange={(value) => setTemplateStyle(value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {templateStyles.map(style => (<SelectItem key={style.id} value={style.id}>
                              <div>
                                <div className="font-medium">{style.name}</div>
                                <div className="text-xs text-muted-foreground">{style.description}</div>
                              </div>
                            </SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedFormat === 'pdf' && (<div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm font-medium">Page Size</Label>
                          <Select value={pageSize} onValueChange={(value) => setPageSize(value)}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                              <SelectItem value="Letter">Letter (8.5 × 11 in)</SelectItem>
                              <SelectItem value="Legal">Legal (8.5 × 14 in)</SelectItem>
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
                      </div>)}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Font Size</Label>
                        <span className="text-sm text-muted-foreground">{fontSize[0]}pt</span>
                      </div>
                      <Slider value={fontSize} onValueChange={setFontSize} max={18} min={8} step={1} className="w-full"/>
                    </div>

                    {selectedFormat === 'pdf' && (<div>
                        <Label htmlFor="watermark" className="text-sm font-medium">
                          Watermark (optional)
                        </Label>
                        <Input id="watermark" value={watermark} onChange={(e) => setWatermark(e.target.value)} placeholder="Enter watermark text..." className="mt-1"/>
                      </div>)}
                  </div>
                </div>
                <Separator />
              </>)}

            {/* Content Options */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Settings className="w-4 h-4"/>
                Content Options
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="metadata" checked={includeMetadata} onCheckedChange={(checked) => setIncludeMetadata(!!checked)}/>
                  <Label htmlFor="metadata" className="text-sm">
                    Include metadata (title, dates, summary)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="progress" checked={includeProgress} onCheckedChange={(checked) => setIncludeProgress(!!checked)}/>
                  <Label htmlFor="progress" className="text-sm">
                    Include learning progress
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="bookmarks" checked={includeBookmarks} onCheckedChange={(checked) => setIncludeBookmarks(!!checked)}/>
                  <Label htmlFor="bookmarks" className="text-sm">
                    Include bookmarked sections
                  </Label>
                </div>

                {(selectedFormat === 'html' || selectedFormat === 'pdf') && (<div className="flex items-center space-x-2">
                    <Checkbox id="images" checked={includeImages} onCheckedChange={(checked) => setIncludeImages(!!checked)}/>
                    <Label htmlFor="images" className="text-sm">
                      Include images and media
                    </Label>
                  </div>)}
              </div>
            </div>

            <Separator />

            {/* File Options */}
            <div className="space-y-3">
              <h3 className="font-semibold">File Options</h3>
              <div>
                <Label htmlFor="filename" className="text-sm font-medium">
                  Custom filename (optional)
                </Label>
                <Input id="filename" value={customFilename} onChange={(e) => setCustomFilename(e.target.value)} placeholder={`Default: ${topic.title.toLowerCase().replace(/\s+/g, '_')}`} className="mt-1"/>
              </div>
            </div>

            {/* Export Summary */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Export Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Format:</span>{' '}
                  <Badge variant="secondary">{currentFormat.name}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Est. Size:</span>{' '}
                  <Badge variant="outline">{estimatedSize} KB</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Style:</span>{' '}
                  <Badge variant="outline">{templateStyle}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Options:</span>{' '}
                  <Badge variant="outline">
                    {[includeMetadata && 'Meta', includeProgress && 'Progress', includeBookmarks && 'Bookmarks']
            .filter(Boolean).length} enabled
                  </Badge>
                </div>
              </div>
            </div>

            {/* Results */}
            {exportResult && (<div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600"/>
                  <span className="font-medium text-green-800">Export Completed</span>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <div>File: {exportResult.filename}</div>
                  <div>Size: {Math.round(exportResult.size / 1024)} KB</div>
                  <div>Downloaded automatically</div>
                </div>
              </div>)}

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t">
              <Button onClick={handlePreview} variant="outline" disabled={isExporting || (selectedFormat !== 'html' && selectedFormat !== 'markdown')} className="flex items-center gap-2">
                <Eye className="w-4 h-4"/>
                Preview
              </Button>
              
              <div className="flex gap-2">
                <Button onClick={onClose} variant="outline" disabled={isExporting}>
                  Cancel
                </Button>
                <Button onClick={handleExport} disabled={isExporting} className="min-w-32">
                  {isExporting ? (<>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                      Exporting...
                    </>) : (<>
                      <Download className="w-4 h-4 mr-2"/>
                      Export
                    </>)}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Panel */}
        {showPreview && previewContent && (<Card className="w-96 flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Preview</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                  <X className="w-4 h-4"/>
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto">
              {selectedFormat === 'html' ? (<div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: previewContent }}/>) : (<pre className="text-xs whitespace-pre-wrap break-words">
                  {previewContent}
                </pre>)}
            </CardContent>
          </Card>)}
      </div>
    </div>);
}
//# sourceMappingURL=EnhancedExportDialog.jsx.map