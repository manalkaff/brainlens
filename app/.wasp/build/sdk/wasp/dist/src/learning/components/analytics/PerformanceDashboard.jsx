import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Activity, BarChart3, Clock, Download, Gauge, HardDrive, Monitor, Network, RefreshCw, TrendingUp, TrendingDown, Zap, AlertTriangle, CheckCircle, Info, Trash2 } from 'lucide-react';
import { performanceMonitor } from '../../analytics/performanceMonitor';
export function PerformanceDashboard({ className = '' }) {
    const [summary, setSummary] = useState(performanceMonitor.getPerformanceSummary());
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [selectedView, setSelectedView] = useState('overview');
    useEffect(() => {
        const interval = autoRefresh ? setInterval(() => {
            refreshData();
        }, 5000) : null;
        return () => {
            if (interval)
                clearInterval(interval);
        };
    }, [autoRefresh]);
    const refreshData = async () => {
        setIsLoading(true);
        // Simulate small delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 100));
        const newSummary = performanceMonitor.getPerformanceSummary();
        setSummary(newSummary);
        setLastUpdated(new Date());
        setIsLoading(false);
    };
    const exportMetrics = () => {
        const data = performanceMonitor.exportMetrics();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `brainlens-performance-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    const clearMetrics = () => {
        performanceMonitor.clearMetrics();
        refreshData();
    };
    // Calculate metric cards based on current data
    const metricCards = useMemo(() => {
        const cards = [];
        // Navigation metrics
        if (summary.navigation) {
            const pageLoadTime = summary.navigation.pageLoad;
            cards.push({
                title: 'Page Load Time',
                value: pageLoadTime.toFixed(0),
                unit: 'ms',
                status: pageLoadTime < 2000 ? 'good' : pageLoadTime < 4000 ? 'warning' : 'error',
                description: 'Time to fully load the page',
                trend: 'stable'
            });
            const fcp = summary.navigation.firstContentfulPaint;
            cards.push({
                title: 'First Contentful Paint',
                value: fcp.toFixed(0),
                unit: 'ms',
                status: fcp < 1500 ? 'good' : fcp < 2500 ? 'warning' : 'error',
                description: 'Time to first meaningful paint',
                trend: 'stable'
            });
            if (summary.navigation.largestContentfulPaint) {
                const lcp = summary.navigation.largestContentfulPaint;
                cards.push({
                    title: 'Largest Contentful Paint',
                    value: lcp.toFixed(0),
                    unit: 'ms',
                    status: lcp < 2500 ? 'good' : lcp < 4000 ? 'warning' : 'error',
                    description: 'Time to render largest content element',
                    trend: 'stable'
                });
            }
            if (summary.navigation.cumulativeLayoutShift !== undefined) {
                const cls = summary.navigation.cumulativeLayoutShift;
                cards.push({
                    title: 'Cumulative Layout Shift',
                    value: cls.toFixed(3),
                    unit: '',
                    status: cls < 0.1 ? 'good' : cls < 0.25 ? 'warning' : 'error',
                    description: 'Visual stability score',
                    trend: 'stable'
                });
            }
        }
        // Memory metrics
        if (summary.memory) {
            cards.push({
                title: 'Memory Usage',
                value: (summary.memory.usedJSHeapSize / 1048576).toFixed(1),
                unit: 'MB',
                status: summary.memory.memoryUsagePercentage < 70 ? 'good' :
                    summary.memory.memoryUsagePercentage < 85 ? 'warning' : 'error',
                description: 'JavaScript heap memory usage',
                trend: 'up'
            });
            cards.push({
                title: 'Memory Usage %',
                value: summary.memory.memoryUsagePercentage.toFixed(1),
                unit: '%',
                status: summary.memory.memoryUsagePercentage < 70 ? 'good' :
                    summary.memory.memoryUsagePercentage < 85 ? 'warning' : 'error',
                description: 'Percentage of available memory used',
                trend: 'up'
            });
        }
        // Resource metrics
        cards.push({
            title: 'Total Resources',
            value: summary.resources.totalRequests,
            unit: 'requests',
            status: summary.resources.totalRequests < 50 ? 'good' :
                summary.resources.totalRequests < 100 ? 'warning' : 'error',
            description: 'Number of network requests made',
            trend: 'stable'
        });
        cards.push({
            title: 'Average Response Time',
            value: summary.resources.averageResponseTime.toFixed(0),
            unit: 'ms',
            status: summary.resources.averageResponseTime < 200 ? 'good' :
                summary.resources.averageResponseTime < 500 ? 'warning' : 'error',
            description: 'Average network response time',
            trend: 'stable'
        });
        // Custom metrics
        if (summary.custom.topicLoadTime.length > 0) {
            const avgTopicLoad = summary.custom.topicLoadTime.reduce((a, b) => a + b, 0) / summary.custom.topicLoadTime.length;
            cards.push({
                title: 'Avg Topic Load',
                value: avgTopicLoad.toFixed(0),
                unit: 'ms',
                status: avgTopicLoad < 1000 ? 'good' : avgTopicLoad < 2000 ? 'warning' : 'error',
                description: 'Average time to load topic content',
                trend: 'stable'
            });
        }
        if (summary.custom.chatResponseTime.length > 0) {
            const avgChatResponse = summary.custom.chatResponseTime.reduce((a, b) => a + b, 0) / summary.custom.chatResponseTime.length;
            cards.push({
                title: 'Avg Chat Response',
                value: avgChatResponse.toFixed(0),
                unit: 'ms',
                status: avgChatResponse < 2000 ? 'good' : avgChatResponse < 5000 ? 'warning' : 'error',
                description: 'Average AI chat response time',
                trend: 'stable'
            });
        }
        return cards;
    }, [summary]);
    const getStatusColor = (status) => {
        switch (status) {
            case 'good': return 'text-green-600 bg-green-50 border-green-200';
            case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'error': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'good': return <CheckCircle className="w-4 h-4"/>;
            case 'warning': return <AlertTriangle className="w-4 h-4"/>;
            case 'error': return <AlertTriangle className="w-4 h-4"/>;
            default: return <Info className="w-4 h-4"/>;
        }
    };
    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'up': return <TrendingUp className="w-3 h-3"/>;
            case 'down': return <TrendingDown className="w-3 h-3"/>;
            default: return null;
        }
    };
    const renderOverview = () => (<div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.slice(0, 8).map((metric, index) => (<Card key={index} className={`border ${getStatusColor(metric.status)}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">{metric.title}</h4>
                <div className="flex items-center gap-1">
                  {getStatusIcon(metric.status)}
                  {getTrendIcon(metric.trend)}
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{metric.value}</span>
                {metric.unit && (<span className="text-sm text-muted-foreground">{metric.unit}</span>)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metric.description}
              </p>
            </CardContent>
          </Card>))}
      </div>

      {/* Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5"/>
            Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Core Web Vitals</span>
                  <span className="font-medium">85/100</span>
                </div>
                <Progress value={85} className="h-2"/>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Resource Efficiency</span>
                  <span className="font-medium">72/100</span>
                </div>
                <Progress value={72} className="h-2"/>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Custom Metrics</span>
                  <span className="font-medium">91/100</span>
                </div>
                <Progress value={91} className="h-2"/>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">83</div>
              <p className="text-sm text-muted-foreground">Overall Performance Score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600"/>
              </div>
              <div>
                <p className="text-sm font-medium">Total Metrics</p>
                <p className="text-2xl font-bold">{summary.totalMetrics}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-5 h-5 text-green-600"/>
              </div>
              <div>
                <p className="text-sm font-medium">Monitoring Since</p>
                <p className="text-sm font-semibold">
                  {summary.timeRange ? new Date(summary.timeRange.start).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="w-5 h-5 text-purple-600"/>
              </div>
              <div>
                <p className="text-sm font-medium">Auto Refresh</p>
                <Badge variant={autoRefresh ? 'default' : 'secondary'}>
                  {autoRefresh ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);
    const renderDetailedView = () => {
        switch (selectedView) {
            case 'navigation':
                return summary.navigation ? (<div className="space-y-4">
            <h3 className="text-lg font-semibold">Navigation Timing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Page Load</h4>
                  <div className="text-2xl font-bold">{summary.navigation.pageLoad.toFixed(0)}ms</div>
                  <Progress value={Math.min((summary.navigation.pageLoad / 5000) * 100, 100)} className="mt-2"/>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">DOM Content Loaded</h4>
                  <div className="text-2xl font-bold">{summary.navigation.domContentLoaded.toFixed(0)}ms</div>
                  <Progress value={Math.min((summary.navigation.domContentLoaded / 3000) * 100, 100)} className="mt-2"/>
                </CardContent>
              </Card>
            </div>
          </div>) : <div>No navigation data available</div>;
            case 'memory':
                return summary.memory ? (<div className="space-y-4">
            <h3 className="text-lg font-semibold">Memory Usage</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Used Memory</h4>
                  <div className="text-2xl font-bold">
                    {(summary.memory.usedJSHeapSize / 1048576).toFixed(1)}MB
                  </div>
                  <Progress value={summary.memory.memoryUsagePercentage} className="mt-2"/>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Total Memory</h4>
                  <div className="text-2xl font-bold">
                    {(summary.memory.totalJSHeapSize / 1048576).toFixed(1)}MB
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Memory Limit</h4>
                  <div className="text-2xl font-bold">
                    {(summary.memory.jsHeapSizeLimit / 1048576).toFixed(0)}MB
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>) : <div>Memory API not available</div>;
            case 'resources':
                return (<div className="space-y-4">
            <h3 className="text-lg font-semibold">Resource Loading</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Total Requests</h4>
                  <div className="text-2xl font-bold">{summary.resources.totalRequests}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Total Size</h4>
                  <div className="text-2xl font-bold">
                    {(summary.resources.totalSize / 1024).toFixed(0)}KB
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Avg Response</h4>
                  <div className="text-2xl font-bold">
                    {summary.resources.averageResponseTime.toFixed(0)}ms
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Slowest Resource</h4>
                  <div className="text-lg font-bold">
                    {summary.resources.slowestResource.duration.toFixed(0)}ms
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {summary.resources.slowestResource.name.split('/').pop()}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>);
            case 'custom':
                return (<div className="space-y-4">
            <h3 className="text-lg font-semibold">Application Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.custom.topicLoadTime.length > 0 && (<Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Topic Load Times</h4>
                    <div className="text-2xl font-bold">
                      {(summary.custom.topicLoadTime.reduce((a, b) => a + b, 0) / summary.custom.topicLoadTime.length).toFixed(0)}ms
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {summary.custom.topicLoadTime.length} samples
                    </p>
                  </CardContent>
                </Card>)}
              
              {summary.custom.chatResponseTime.length > 0 && (<Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Chat Response Times</h4>
                    <div className="text-2xl font-bold">
                      {(summary.custom.chatResponseTime.reduce((a, b) => a + b, 0) / summary.custom.chatResponseTime.length).toFixed(0)}ms
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {summary.custom.chatResponseTime.length} samples
                    </p>
                  </CardContent>
                </Card>)}
              
              {summary.custom.mindMapRenderTime.length > 0 && (<Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">MindMap Render Times</h4>
                    <div className="text-2xl font-bold">
                      {(summary.custom.mindMapRenderTime.reduce((a, b) => a + b, 0) / summary.custom.mindMapRenderTime.length).toFixed(0)}ms
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {summary.custom.mindMapRenderTime.length} samples
                    </p>
                  </CardContent>
                </Card>)}
            </div>
          </div>);
            default:
                return renderOverview();
        }
    };
    return (<div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time application performance monitoring and analytics
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            <Zap className={`w-4 h-4 mr-1 ${autoRefresh ? 'text-green-600' : 'text-gray-400'}`}/>
            Auto Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`}/>
            Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={exportMetrics}>
            <Download className="w-4 h-4 mr-1"/>
            Export
          </Button>
          
          <Button variant="outline" size="sm" onClick={clearMetrics}>
            <Trash2 className="w-4 h-4 mr-1"/>
            Clear
          </Button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b">
        {[
            { key: 'overview', label: 'Overview', icon: Monitor },
            { key: 'navigation', label: 'Navigation', icon: Clock },
            { key: 'resources', label: 'Resources', icon: Network },
            { key: 'memory', label: 'Memory', icon: HardDrive },
            { key: 'custom', label: 'Custom', icon: Activity }
        ].map(({ key, label, icon: Icon }) => (<Button key={key} variant={selectedView === key ? 'default' : 'ghost'} size="sm" onClick={() => setSelectedView(key)}>
            <Icon className="w-4 h-4 mr-1"/>
            {label}
          </Button>))}
      </div>

      {/* Last Updated */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
        {isLoading && (<div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin"/>
            <span>Updating...</span>
          </div>)}
      </div>

      {/* Content */}
      {renderDetailedView()}
    </div>);
}
export default PerformanceDashboard;
//# sourceMappingURL=PerformanceDashboard.jsx.map