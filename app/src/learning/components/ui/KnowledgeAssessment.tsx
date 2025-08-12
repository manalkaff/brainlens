import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Progress } from '../../../components/ui/progress';
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';
import { updateTopicProgress } from '../../operations';
import { useTopicContext } from '../../context/TopicContext';

interface KnowledgeLevel {
  id: string;
  label: string;
  description: string;
  value: number; // 1-5 scale
}

interface LearningStyle {
  id: string;
  label: string;
  description: string;
  icon: string;
}

const KNOWLEDGE_LEVELS: KnowledgeLevel[] = [
  {
    id: 'beginner',
    label: 'Complete Beginner',
    description: 'I have no prior knowledge of this topic',
    value: 1
  },
  {
    id: 'novice',
    label: 'Novice',
    description: 'I have heard of this topic but know very little',
    value: 2
  },
  {
    id: 'intermediate',
    label: 'Some Knowledge',
    description: 'I have basic understanding and some experience',
    value: 3
  },
  {
    id: 'advanced',
    label: 'Good Understanding',
    description: 'I have solid knowledge and practical experience',
    value: 4
  },
  {
    id: 'expert',
    label: 'Expert Level',
    description: 'I have deep expertise and extensive experience',
    value: 5
  }
];

const LEARNING_STYLES: LearningStyle[] = [
  {
    id: 'visual',
    label: 'Visual Learner',
    description: 'I learn best with diagrams, charts, and images',
    icon: '👁️'
  },
  {
    id: 'textual',
    label: 'Text-based',
    description: 'I prefer detailed written explanations and articles',
    icon: '📝'
  },
  {
    id: 'interactive',
    label: 'Interactive',
    description: 'I learn through hands-on examples and practice',
    icon: '🎯'
  },
  {
    id: 'video',
    label: 'Video Content',
    description: 'I prefer educational videos and tutorials',
    icon: '🎥'
  },
  {
    id: 'conversational',
    label: 'Conversational',
    description: 'I learn best through Q&A and discussions',
    icon: '💬'
  }
];

interface KnowledgeAssessmentProps {
  onComplete: (preferences: AssessmentResult) => void;
  isLoading?: boolean;
}

export interface AssessmentResult {
  knowledgeLevel: number;
  learningStyles: string[];
  startingPoint: 'basics' | 'intermediate' | 'advanced';
  preferences: {
    difficultyPreference: 'gentle' | 'moderate' | 'challenging';
    contentDepth: 'overview' | 'detailed' | 'comprehensive';
    pacePreference: 'slow' | 'moderate' | 'fast';
  };
}

export function KnowledgeAssessment({ onComplete, isLoading = false }: KnowledgeAssessmentProps) {
  const { topic } = useTopicContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [knowledgeLevel, setKnowledgeLevel] = useState<string>('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [difficultyPreference, setDifficultyPreference] = useState<string>('');
  const [contentDepth, setContentDepth] = useState<string>('');
  const [pacePreference, setPacePreference] = useState<string>('');

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleStyleToggle = (styleId: string) => {
    setSelectedStyles(prev => 
      prev.includes(styleId) 
        ? prev.filter(id => id !== styleId)
        : [...prev, styleId]
    );
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    const knowledgeLevelValue = KNOWLEDGE_LEVELS.find(level => level.id === knowledgeLevel)?.value || 1;
    
    // Determine starting point based on knowledge level
    let startingPoint: 'basics' | 'intermediate' | 'advanced' = 'basics';
    if (knowledgeLevelValue >= 4) {
      startingPoint = 'advanced';
    } else if (knowledgeLevelValue >= 3) {
      startingPoint = 'intermediate';
    }

    const result: AssessmentResult = {
      knowledgeLevel: knowledgeLevelValue,
      learningStyles: selectedStyles,
      startingPoint,
      preferences: {
        difficultyPreference: difficultyPreference as 'gentle' | 'moderate' | 'challenging',
        contentDepth: contentDepth as 'overview' | 'detailed' | 'comprehensive',
        pacePreference: pacePreference as 'slow' | 'moderate' | 'fast'
      }
    };

    onComplete(result);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return knowledgeLevel !== '';
      case 2:
        return selectedStyles.length > 0;
      case 3:
        return difficultyPreference !== '' && contentDepth !== '';
      case 4:
        return pacePreference !== '';
      default:
        return false;
    }
  };

  if (!topic) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
          Knowledge Assessment
        </CardTitle>
        <CardDescription>
          Help us personalize your learning experience for <strong>{topic.title}</strong>
        </CardDescription>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Knowledge Level */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">What's your current knowledge level?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This helps us determine the right starting point and difficulty level for your learning journey.
              </p>
            </div>
            <RadioGroup value={knowledgeLevel} onValueChange={setKnowledgeLevel}>
              {KNOWLEDGE_LEVELS.map((level) => (
                <div key={level.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value={level.id} id={level.id} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={level.id} className="font-medium cursor-pointer">
                      {level.label}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {level.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        {/* Step 2: Learning Styles */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">How do you prefer to learn?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select all learning styles that work best for you. We'll prioritize content in these formats.
              </p>
            </div>
            <div className="grid gap-3">
              {LEARNING_STYLES.map((style) => (
                <div 
                  key={style.id} 
                  className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedStyles.includes(style.id) 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleStyleToggle(style.id)}
                >
                  <Checkbox 
                    checked={selectedStyles.includes(style.id)}
                    onChange={() => handleStyleToggle(style.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{style.icon}</span>
                      <Label className="font-medium cursor-pointer">
                        {style.label}
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {style.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Content Preferences */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Content Preferences</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tell us about your preferred learning approach and content depth.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Difficulty Preference</Label>
                <p className="text-sm text-muted-foreground mb-3">How challenging should the content be?</p>
                <RadioGroup value={difficultyPreference} onValueChange={setDifficultyPreference}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="gentle" id="gentle" />
                    <Label htmlFor="gentle">Gentle introduction - Start with basics and build up slowly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moderate" id="moderate" />
                    <Label htmlFor="moderate">Moderate pace - Balance between basics and advanced concepts</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="challenging" id="challenging" />
                    <Label htmlFor="challenging">Challenging - Jump into complex topics quickly</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-medium">Content Depth</Label>
                <p className="text-sm text-muted-foreground mb-3">How detailed should the explanations be?</p>
                <RadioGroup value={contentDepth} onValueChange={setContentDepth}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="overview" id="overview" />
                    <Label htmlFor="overview">High-level overview - Key concepts and main ideas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="detailed" id="detailed" />
                    <Label htmlFor="detailed">Detailed explanations - Thorough coverage with examples</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="comprehensive" id="comprehensive" />
                    <Label htmlFor="comprehensive">Comprehensive - In-depth analysis with technical details</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Learning Pace */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Learning Pace</h3>
              <p className="text-sm text-muted-foreground mb-4">
                How quickly do you prefer to move through the material?
              </p>
            </div>
            <RadioGroup value={pacePreference} onValueChange={setPacePreference}>
              <div className="flex items-start space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="slow" id="slow" className="mt-1" />
                <div>
                  <Label htmlFor="slow" className="font-medium cursor-pointer">Take it slow</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    I prefer to spend more time on each concept and really understand it before moving on
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="moderate" id="moderate-pace" className="mt-1" />
                <div>
                  <Label htmlFor="moderate-pace" className="font-medium cursor-pointer">Moderate pace</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    I like a balanced approach - not too fast, not too slow
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="fast" id="fast" className="mt-1" />
                <div>
                  <Label htmlFor="fast" className="font-medium cursor-pointer">Fast-paced</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    I can absorb information quickly and prefer to cover more ground
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={currentStep === 1 || isLoading}
          >
            Back
          </Button>
          
          {currentStep < totalSteps ? (
            <Button 
              onClick={handleNext}
              disabled={!canProceed() || isLoading}
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleComplete}
              disabled={!canProceed() || isLoading}
            >
              {isLoading ? 'Saving...' : 'Complete Assessment'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}