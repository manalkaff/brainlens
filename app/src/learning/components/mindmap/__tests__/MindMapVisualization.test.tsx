import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock React Flow completely
vi.mock('@xyflow/react', () => ({
  ReactFlow: ({ children, nodes, edges }: any) => (
    <div data-testid="react-flow">
      <div data-testid="nodes-count">{nodes?.length || 0}</div>
      <div data-testid="edges-count">{edges?.length || 0}</div>
      {children}
    </div>
  ),
  ReactFlowProvider: ({ children }: any) => <div data-testid="react-flow-provider">{children}</div>,
  Controls: () => <div data-testid="controls">Controls</div>,
  MiniMap: () => <div data-testid="minimap">MiniMap</div>,
  Background: () => <div data-testid="background">Background</div>,
  Panel: ({ children }: any) => <div data-testid="panel">{children}</div>,
  useReactFlow: () => ({
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    fitView: vi.fn(),
    setViewport: vi.fn(),
    fitBounds: vi.fn(),
  }),
  useNodesState: (initial: any) => [initial, vi.fn(), vi.fn()],
  useEdgesState: (initial: any) => [initial, vi.fn(), vi.fn()],
  Position: {
    Left: 'left',
    Right: 'right',
  },
  MarkerType: {
    ArrowClosed: 'arrowclosed',
  },
  BackgroundVariant: {
    Dots: 'dots',
  },
}));

// Mock UI components
vi.mock('../../../components/ui/input', () => ({
  Input: ({ placeholder, value, onChange, ...props }: any) => (
    <input 
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      data-testid="search-input"
      {...props}
    />
  ),
}));

vi.mock('../../../components/ui/button', () => ({
  Button: ({ children, onClick, title, ...props }: any) => (
    <button onClick={onClick} title={title} data-testid="button" {...props}>
      {children}
    </button>
  ),
}));

vi.mock('../../../components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => (
    <span data-testid="badge" {...props}>{children}</span>
  ),
}));

vi.mock('../../../components/ui/card', () => ({
  Card: ({ children, ...props }: any) => (
    <div data-testid="card" {...props}>{children}</div>
  ),
}));

// Mock the TopicNode component
vi.mock('../TopicNode', () => ({
  TopicNode: ({ data }: any) => (
    <div data-testid="topic-node">
      {data.topic.title}
    </div>
  ),
}));

// Import after mocks
import { MindMapVisualization } from '../MindMapVisualization';
import { TopicTreeItem } from '../../ui/TopicTree';

const mockTopics: TopicTreeItem[] = [
  {
    id: '1',
    slug: 'machine-learning',
    title: 'Machine Learning',
    summary: 'Introduction to ML concepts',
    description: 'A comprehensive overview of machine learning',
    depth: 0,
    parentId: null,
    status: 'COMPLETED',
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    children: [
      {
        id: '2',
        slug: 'supervised-learning',
        title: 'Supervised Learning',
        summary: 'Learning with labeled data',
        description: 'Algorithms that learn from labeled examples',
        depth: 1,
        parentId: '1',
        status: 'COMPLETED',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        children: [],
        userProgress: {
          id: 'progress-2',
          userId: 'user-1',
          topicId: '2',
          completed: true,
          timeSpent: 1800,
          lastAccessed: new Date(),
          preferences: {},
          bookmarks: ['bookmark-1'],
        },
      },
    ],
    userProgress: {
      id: 'progress-1',
      userId: 'user-1',
      topicId: '1',
      completed: false,
      timeSpent: 3600,
      lastAccessed: new Date(),
      preferences: {},
      bookmarks: [],
    },
  },
];

describe('MindMapVisualization', () => {
  const defaultProps = {
    topics: mockTopics,
    selectedTopicId: '1',
    onTopicSelect: vi.fn(),
    layout: 'hierarchical' as const,
    onLayoutChange: vi.fn(),
    searchQuery: '',
    onSearchChange: vi.fn(),
    onExport: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the mind map visualization', () => {
    render(<MindMapVisualization {...defaultProps} />);
    
    expect(screen.getByTestId('react-flow-provider')).toBeInTheDocument();
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('displays search input', () => {
    render(<MindMapVisualization {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Search in mind map...')).toBeInTheDocument();
  });

  it('shows layout buttons', () => {
    render(<MindMapVisualization {...defaultProps} />);
    
    expect(screen.getByText('Tree')).toBeInTheDocument();
    expect(screen.getByText('Radial')).toBeInTheDocument();
    expect(screen.getByText('Force')).toBeInTheDocument();
  });

  it('handles search input changes', () => {
    render(<MindMapVisualization {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search in mind map...');
    fireEvent.change(searchInput, { target: { value: 'machine' } });
    
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('machine');
  });

  it('handles layout changes', () => {
    render(<MindMapVisualization {...defaultProps} />);
    
    const radialButton = screen.getByText('Radial');
    fireEvent.click(radialButton);
    
    expect(defaultProps.onLayoutChange).toHaveBeenCalledWith('radial');
  });

  it('shows export buttons', () => {
    render(<MindMapVisualization {...defaultProps} />);
    
    expect(screen.getByText('PNG')).toBeInTheDocument();
    expect(screen.getByText('SVG')).toBeInTheDocument();
  });

  it('shows empty state when no topics', () => {
    render(<MindMapVisualization {...defaultProps} topics={[]} />);
    
    expect(screen.getByText('No Topics to Visualize')).toBeInTheDocument();
  });

  it('displays statistics badges', () => {
    render(<MindMapVisualization {...defaultProps} />);
    
    // Should show some statistics
    const badges = screen.getAllByTestId('badge');
    expect(badges.length).toBeGreaterThan(0);
  });
});