import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { X, ExternalLink, BookOpen, Lightbulb, ArrowRight } from 'lucide-react';

interface ConceptExpansionProps {
  concept: string;
  topicTitle: string;
  onClose: () => void;
  onNavigateToSubtopic?: (subtopic: string) => void;
}

interface ConceptData {
  definition: string;
  explanation: string;
  examples: string[];
  relatedConcepts: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  subtopics: string[];
  isLoading: boolean;
}

export function ConceptExpansion({ 
  concept, 
  topicTitle, 
  onClose, 
  onNavigateToSubtopic 
}: ConceptExpansionProps) {
  const [conceptData, setConceptData] = useState<ConceptData>({
    definition: '',
    explanation: '',
    examples: [],
    relatedConcepts: [],
    difficulty: 'beginner',
    subtopics: [],
    isLoading: true
  });

  // Simulate fetching concept data
  useEffect(() => {
    const fetchConceptData = async () => {
      setConceptData(prev => ({ ...prev, isLoading: true }));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data based on concept
      const mockData: ConceptData = {
        definition: `${concept} is a fundamental concept in ${topicTitle} that refers to...`,
        explanation: `Understanding ${concept} is crucial because it forms the foundation for many other concepts in ${topicTitle}. This concept helps explain how different elements interact and influence each other within the broader context.`,
        examples: [
          `Example 1: How ${concept} applies in real-world scenario A`,
          `Example 2: Practical application of ${concept} in context B`,
          `Example 3: Common use case where ${concept} is essential`
        ],
        relatedConcepts: [
          'Related Concept 1',
          'Related Concept 2',
          'Related Concept 3',
          'Advanced Topic'
        ],
        difficulty: concept.includes('advanced') || concept.includes('complex') ? 'advanced' : 
                   concept.includes('intermediate') || concept.includes('detailed') ? 'intermediate' : 'beginner',
        subtopics: [
          `Deep dive into ${concept}`,
          `${concept} best practices`,
          `Advanced ${concept} techniques`,
          `${concept} case studies`
        ],
        isLoading: false
      };
      
      setConceptData(mockData);
    };

    fetchConceptData();
  }, [concept, topicTitle]);

  const getDifficultyColor = (difficulty: string) => {
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

  if (conceptData.isLoading) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Lightbulb className="w-5 h-5 text-primary mr-2" />
              Loading concept: {concept}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-20 bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Lightbulb className="w-5 h-5 text-primary mr-2" />
              {concept}
            </CardTitle>
            <CardDescription className="flex items-center space-x-2 mt-1">
              <span>Contextual explanation</span>
              <Badge className={getDifficultyColor(conceptData.difficulty)}>
                {conceptData.difficulty}
              </Badge>
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Definition */}
        <div>
          <h4 className="font-medium mb-2">Definition</h4>
          <p className="text-sm text-muted-foreground">{conceptData.definition}</p>
        </div>

        {/* Detailed Explanation */}
        <div>
          <h4 className="font-medium mb-2">Explanation</h4>
          <p className="text-sm text-muted-foreground">{conceptData.explanation}</p>
        </div>

        {/* Examples */}
        <div>
          <h4 className="font-medium mb-2 flex items-center">
            <BookOpen className="w-4 h-4 mr-1" />
            Examples
          </h4>
          <ul className="space-y-2">
            {conceptData.examples.map((example, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 mr-2 flex-shrink-0" />
                {example}
              </li>
            ))}
          </ul>
        </div>

        {/* Related Concepts */}
        <div>
          <h4 className="font-medium mb-2">Related Concepts</h4>
          <div className="flex flex-wrap gap-2">
            {conceptData.relatedConcepts.map((relatedConcept) => (
              <Button
                key={relatedConcept}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  // This would trigger expansion of the related concept
                  console.log('Expand related concept:', relatedConcept);
                }}
              >
                {relatedConcept}
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            ))}
          </div>
        </div>

        {/* Subtopics for Deep Dive */}
        {conceptData.subtopics.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Explore Further</h4>
            <div className="space-y-2">
              {conceptData.subtopics.map((subtopic) => (
                <Button
                  key={subtopic}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-left h-auto p-3"
                  onClick={() => onNavigateToSubtopic?.(subtopic)}
                >
                  <div>
                    <div className="font-medium text-sm">{subtopic}</div>
                    <div className="text-xs text-muted-foreground">
                      Detailed exploration of this concept
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button size="sm" onClick={() => onNavigateToSubtopic?.(concept)}>
            Learn More About This
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}