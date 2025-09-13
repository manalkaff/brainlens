import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { CheckCircle, Clock, BookOpen, Target } from 'lucide-react';
import { useTopicContext } from '../../context/TopicContext';
export function StartingPointRecommendation({ assessment, onStartLearning, isLoading = false }) {
    const { topic } = useTopicContext();
    if (!topic) {
        return null;
    }
    // Generate learning paths based on assessment
    const generateLearningPaths = () => {
        const basePaths = [
            {
                id: 'fundamentals',
                title: 'Start with Fundamentals',
                description: 'Begin with core concepts and build a solid foundation',
                estimatedTime: '2-3 hours',
                difficulty: 'beginner',
                topics: [
                    'Basic definitions and terminology',
                    'Core principles and concepts',
                    'Historical context and evolution',
                    'Why this topic matters'
                ],
                recommended: assessment.knowledgeLevel <= 2
            },
            {
                id: 'practical',
                title: 'Practical Applications Focus',
                description: 'Jump into real-world examples and use cases',
                estimatedTime: '1-2 hours',
                difficulty: 'intermediate',
                topics: [
                    'Common use cases and applications',
                    'Industry examples and case studies',
                    'Best practices and methodologies',
                    'Tools and technologies'
                ],
                recommended: assessment.knowledgeLevel === 3 && assessment.learningStyles.includes('interactive')
            },
            {
                id: 'comprehensive',
                title: 'Comprehensive Deep Dive',
                description: 'Explore advanced concepts and technical details',
                estimatedTime: '3-4 hours',
                difficulty: 'advanced',
                topics: [
                    'Advanced theoretical concepts',
                    'Technical implementation details',
                    'Research and latest developments',
                    'Expert insights and analysis'
                ],
                recommended: assessment.knowledgeLevel >= 4
            },
            {
                id: 'visual',
                title: 'Visual Learning Path',
                description: 'Learn through diagrams, charts, and visual representations',
                estimatedTime: '2-3 hours',
                difficulty: assessment.knowledgeLevel >= 3 ? 'intermediate' : 'beginner',
                topics: [
                    'Concept diagrams and flowcharts',
                    'Visual models and frameworks',
                    'Infographics and data visualizations',
                    'Interactive demonstrations'
                ],
                recommended: assessment.learningStyles.includes('visual')
            },
            {
                id: 'conversational',
                title: 'Q&A Driven Learning',
                description: 'Learn through guided questions and interactive discussions',
                estimatedTime: '1-2 hours',
                difficulty: 'intermediate',
                topics: [
                    'Common questions and misconceptions',
                    'Interactive Q&A sessions',
                    'Problem-solving scenarios',
                    'Discussion-based exploration'
                ],
                recommended: assessment.learningStyles.includes('conversational')
            }
        ];
        // Sort paths to show recommended ones first
        return basePaths.sort((a, b) => {
            if (a.recommended && !b.recommended)
                return -1;
            if (!a.recommended && b.recommended)
                return 1;
            return 0;
        });
    };
    const learningPaths = generateLearningPaths();
    const recommendedPath = learningPaths.find(path => path.recommended);
    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'beginner':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'intermediate':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'advanced':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };
    const getKnowledgeLevelText = (level) => {
        if (level <= 2)
            return 'Beginner';
        if (level <= 3)
            return 'Intermediate';
        return 'Advanced';
    };
    return (<div className="space-y-6">
      {/* Assessment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2"/>
            Assessment Complete
          </CardTitle>
          <CardDescription>
            Based on your responses, here's what we learned about your learning preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Knowledge Level</div>
              <div className="font-medium">{getKnowledgeLevelText(assessment.knowledgeLevel)}</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Learning Styles</div>
              <div className="font-medium">{assessment.learningStyles.length} selected</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Preferred Pace</div>
              <div className="font-medium capitalize">{assessment.preferences.pacePreference}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Path */}
      {recommendedPath && (<Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 text-primary mr-2"/>
                Recommended for You
              </CardTitle>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Best Match
              </Badge>
            </div>
            <CardDescription>
              This learning path is tailored to your knowledge level and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{recommendedPath.title}</h3>
                <p className="text-muted-foreground">{recommendedPath.description}</p>
              </div>
              
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1"/>
                  {recommendedPath.estimatedTime}
                </div>
                <Badge className={getDifficultyColor(recommendedPath.difficulty)}>
                  {recommendedPath.difficulty}
                </Badge>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <BookOpen className="w-4 h-4 mr-1"/>
                  What you'll learn:
                </h4>
                <ul className="space-y-1">
                  {recommendedPath.topics.map((topic, index) => (<li key={index} className="text-sm text-muted-foreground flex items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 mr-2 flex-shrink-0"/>
                      {topic}
                    </li>))}
                </ul>
              </div>

              <Button onClick={() => onStartLearning(recommendedPath)} disabled={isLoading} className="w-full">
                {isLoading ? 'Starting...' : 'Start This Path'}
              </Button>
            </div>
          </CardContent>
        </Card>)}

      {/* Alternative Paths */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Other Learning Paths</h3>
        <div className="grid gap-4">
          {learningPaths
            .filter(path => !path.recommended)
            .map((path) => (<Card key={path.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{path.title}</h4>
                      <p className="text-sm text-muted-foreground">{path.description}</p>
                    </div>
                    <Badge className={getDifficultyColor(path.difficulty)}>
                      {path.difficulty}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-1"/>
                      {path.estimatedTime}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onStartLearning(path)} disabled={isLoading}>
                      Choose This Path
                    </Button>
                  </div>
                </CardContent>
              </Card>))}
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=StartingPointRecommendation.jsx.map