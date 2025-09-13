import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { X, BookOpen, ArrowRight, Brain, Clock, AlertCircle } from 'lucide-react';
import { useTopicContext } from '../../context/TopicContext';
import { useAuth } from 'wasp/client/auth';
import { conceptExplainer } from '../../content/conceptExplainer';
import { conceptNetworkManager } from '../../content/conceptNetwork';
export function ConceptExpansion({ concept, topicTitle, onClose, onNavigateToSubtopic, surroundingContent, userAssessment }) {
    const { topic } = useTopicContext();
    const { data: user } = useAuth();
    const [state, setState] = useState({
        explanation: null,
        relatedConcepts: [],
        recommendations: [],
        prerequisites: null,
        isLoading: true,
        error: null,
        activeTab: 'explanation'
    });
    // Fetch comprehensive concept data
    useEffect(() => {
        const fetchConceptData = async () => {
            if (!topic)
                return;
            setState(prev => ({ ...prev, isLoading: true, error: null }));
            try {
                // Create user assessment for explanation generation
                const assessment = userAssessment || {
                    knowledgeLevel: 3,
                    learningStyles: ['textual'],
                    startingPoint: 'intermediate',
                    preferences: {
                        difficultyPreference: 'moderate',
                        contentDepth: 'detailed',
                        pacePreference: 'moderate'
                    }
                };
                // Generate comprehensive explanation
                const explanation = surroundingContent
                    ? await conceptExplainer.explainConceptInContext(concept, surroundingContent, topic, assessment)
                    : await conceptExplainer.explainConcept(concept, topic, assessment);
                // Get related concepts
                const relatedConcepts = await conceptExplainer.getRelatedConcepts(concept, topic);
                // Check prerequisites
                const userKnowledge = ['basic concepts', 'fundamental principles']; // Would come from user progress
                const prerequisites = await conceptExplainer.checkPrerequisites(concept, topic, userKnowledge);
                // Get concept network recommendations if available
                let recommendations = [];
                try {
                    const conceptMap = await conceptNetworkManager.initializeNetwork(topic);
                    const recommendationContext = {
                        currentConcept: concept,
                        userMastery: { [concept]: 0.5 }, // Would come from actual progress
                        learningGoals: ['understand concepts', 'practical application'],
                        timeAvailable: 60,
                        preferredDifficulty: 'same'
                    };
                    const nextConcepts = conceptNetworkManager.findNextConcepts(topic.id, recommendationContext, 3);
                    recommendations = nextConcepts.recommendations;
                }
                catch (error) {
                    console.log('Concept network not available, using basic recommendations');
                }
                setState(prev => ({
                    ...prev,
                    explanation,
                    relatedConcepts,
                    recommendations,
                    prerequisites,
                    isLoading: false
                }));
            }
            catch (error) {
                console.error('Failed to fetch concept data:', error);
                setState(prev => ({
                    ...prev,
                    error: 'Failed to load concept explanation',
                    isLoading: false
                }));
            }
        };
        fetchConceptData();
    }, [concept, topicTitle, topic, surroundingContent, userAssessment]);
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
    const handleTabChange = (tab) => {
        setState(prev => ({ ...prev, activeTab: tab }));
    };
    const handleRelatedConceptClick = (relatedConcept) => {
        // This would expand another concept or navigate
        console.log('Expand related concept:', relatedConcept);
        // For now, we could trigger a new concept expansion
        onNavigateToSubtopic?.(relatedConcept);
    };
    if (state.isLoading) {
        return (<Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Brain className="w-5 h-5 text-primary mr-2 animate-pulse"/>
              Analyzing concept: {concept}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4"/>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"/>
              <div className="h-4 bg-muted rounded w-1/2"/>
              <div className="h-20 bg-muted rounded"/>
              <div className="flex space-x-2">
                <div className="h-8 bg-muted rounded w-16"/>
                <div className="h-8 bg-muted rounded w-20"/>
                <div className="h-8 bg-muted rounded w-18"/>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>);
    }
    if (state.error) {
        return (<Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-red-800">
              <AlertCircle className="w-5 h-5 mr-2"/>
              Failed to load concept
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4"/>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>);
    }
    if (!state.explanation) {
        return null;
    }
    return (<Card className="border-primary/20 bg-primary/5 max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Brain className="w-5 h-5 text-primary mr-2"/>
              {concept}
            </CardTitle>
            <CardDescription className="flex items-center space-x-2 mt-1">
              <span>AI-powered explanation</span>
              <Badge className={getDifficultyColor(state.explanation.difficulty)}>
                {state.explanation.difficulty}
              </Badge>
              {state.explanation.estimatedReadTime && (<Badge variant="outline" className="flex items-center">
                  <Clock className="w-3 h-3 mr-1"/>
                  {state.explanation.estimatedReadTime} min read
                </Badge>)}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4"/>
          </Button>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-4">
          <Button variant={state.activeTab === 'explanation' ? 'default' : 'ghost'} size="sm" onClick={() => handleTabChange('explanation')}>
            Explanation
          </Button>
          <Button variant={state.activeTab === 'examples' ? 'default' : 'ghost'} size="sm" onClick={() => handleTabChange('examples')}>
            Examples
          </Button>
          <Button variant={state.activeTab === 'related' ? 'default' : 'ghost'} size="sm" onClick={() => handleTabChange('related')}>
            Related ({state.relatedConcepts.length})
          </Button>
          {state.prerequisites && state.prerequisites.prerequisites.length > 0 && (<Button variant={state.activeTab === 'prerequisites' ? 'default' : 'ghost'} size="sm" onClick={() => handleTabChange('prerequisites')} className={!state.prerequisites?.readyToLearn ? 'text-amber-600' : ''}>
              Prerequisites
              {!state.prerequisites?.readyToLearn && (<AlertCircle className="w-3 h-3 ml-1"/>)}
            </Button>)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Explanation Tab */}
        {state.activeTab === 'explanation' && (<div className="space-y-4">
            {/* Definition */}
            <div>
              <h4 className="font-medium mb-2">Definition</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {state.explanation.definition}
              </p>
            </div>

            {/* Simple Explanation */}
            <div>
              <h4 className="font-medium mb-2">Simple Explanation</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {state.explanation.simpleExplanation}
              </p>
            </div>

            {/* Detailed Explanation */}
            {state.explanation.detailedExplanation !== state.explanation.simpleExplanation && (<div>
                <h4 className="font-medium mb-2">Detailed Explanation</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {state.explanation.detailedExplanation}
                </p>
              </div>)}

            {/* Visual Descriptions */}
            {state.explanation.visualDescriptions.length > 0 && (<div>
                <h4 className="font-medium mb-2">Visual Understanding</h4>
                <ul className="space-y-2">
                  {state.explanation.visualDescriptions.map((description, index) => (<li key={index} className="text-sm text-muted-foreground flex items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-2 flex-shrink-0"/>
                      {description}
                    </li>))}
                </ul>
              </div>)}

            {/* Common Misconceptions */}
            {state.explanation.commonMisconceptions.length > 0 && (<Alert>
                <AlertCircle className="h-4 w-4"/>
                <AlertDescription>
                  <div className="font-medium mb-1">Common Misconceptions:</div>
                  <ul className="space-y-1">
                    {state.explanation.commonMisconceptions.map((misconception, index) => (<li key={index} className="text-sm">• {misconception}</li>))}
                  </ul>
                </AlertDescription>
              </Alert>)}
          </div>)}

        {/* Examples Tab */}
        {state.activeTab === 'examples' && (<div className="space-y-4">
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <BookOpen className="w-4 h-4 mr-2"/>
                Examples and Applications
              </h4>
              <div className="space-y-4">
                {/* Examples */}
                {state.explanation.examples.length > 0 && (<div>
                    <h5 className="text-sm font-medium mb-2">Examples:</h5>
                    <ul className="space-y-2">
                      {state.explanation.examples.map((example, index) => (<li key={index} className="text-sm text-muted-foreground flex items-start">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 mr-2 flex-shrink-0"/>
                          {example}
                        </li>))}
                    </ul>
                  </div>)}

                {/* Analogies */}
                {state.explanation.analogies.length > 0 && (<div>
                    <h5 className="text-sm font-medium mb-2">Analogies:</h5>
                    <ul className="space-y-2">
                      {state.explanation.analogies.map((analogy, index) => (<li key={index} className="text-sm text-muted-foreground flex items-start">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 mr-2 flex-shrink-0"/>
                          {analogy}
                        </li>))}
                    </ul>
                  </div>)}

                {/* Applications */}
                {state.explanation.applications.length > 0 && (<div>
                    <h5 className="text-sm font-medium mb-2">Real-world Applications:</h5>
                    <ul className="space-y-2">
                      {state.explanation.applications.map((application, index) => (<li key={index} className="text-sm text-muted-foreground flex items-start">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 mr-2 flex-shrink-0"/>
                          {application}
                        </li>))}
                    </ul>
                  </div>)}
              </div>
            </div>
          </div>)}

        {/* Related Concepts Tab */}
        {state.activeTab === 'related' && (<div className="space-y-4">
            <h4 className="font-medium mb-3">Related Concepts</h4>
            <div className="space-y-3">
              {state.relatedConcepts.length > 0 ? (state.relatedConcepts.map((relatedConcept, index) => (<Card key={index} className="p-3 cursor-pointer hover:bg-muted/50" onClick={() => handleRelatedConceptClick(relatedConcept.name)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{relatedConcept.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {relatedConcept.description}
                        </div>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {relatedConcept.relationship.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground"/>
                    </div>
                  </Card>))) : (<p className="text-sm text-muted-foreground">No related concepts found.</p>)}
            </div>

            {/* Recommendations from concept network */}
            {state.recommendations.length > 0 && (<div>
                <h5 className="text-sm font-medium mb-2">Recommended Next Steps:</h5>
                <div className="space-y-2">
                  {state.recommendations.map((rec, index) => (<Button key={index} variant="ghost" size="sm" className="w-full justify-between text-left h-auto p-3" onClick={() => handleRelatedConceptClick(rec.name)}>
                      <div>
                        <div className="font-medium text-sm">{rec.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Based on your learning progress
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4"/>
                    </Button>))}
                </div>
              </div>)}
          </div>)}

        {/* Prerequisites Tab */}
        {state.activeTab === 'prerequisites' && state.prerequisites && (<div className="space-y-4">
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                Prerequisites
                {!state.prerequisites.readyToLearn && (<AlertCircle className="w-4 h-4 ml-2 text-amber-500"/>)}
              </h4>
              
              {state.prerequisites.readyToLearn ? (<Alert className="border-green-200 bg-green-50">
                  <AlertDescription>
                    ✅ You have the necessary background to understand this concept!
                  </AlertDescription>
                </Alert>) : (<Alert className="border-amber-200 bg-amber-50">
                  <AlertDescription>
                    <div className="font-medium mb-2">Missing Prerequisites:</div>
                    <ul className="space-y-1">
                      {state.prerequisites.missing.map((missing, index) => (<li key={index} className="text-sm">• {missing}</li>))}
                    </ul>
                  </AlertDescription>
                </Alert>)}
              
              {state.prerequisites.prerequisites.length > 0 && (<div>
                  <h5 className="text-sm font-medium mb-2">All Prerequisites:</h5>
                  <ul className="space-y-1">
                    {state.prerequisites.prerequisites.map((prereq, index) => (<li key={index} className="text-sm text-muted-foreground flex items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-2 flex-shrink-0"/>
                        {prereq}
                      </li>))}
                  </ul>
                </div>)}
              
              {state.prerequisites.recommendations.length > 0 && (<div>
                  <h5 className="text-sm font-medium mb-2">Recommendations:</h5>
                  <ul className="space-y-1">
                    {state.prerequisites.recommendations.map((rec, index) => (<li key={index} className="text-sm text-muted-foreground flex items-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 mr-2 flex-shrink-0"/>
                        {rec}
                      </li>))}
                  </ul>
                </div>)}
            </div>
          </div>)}

        {/* Actions */}
        <div className="flex space-x-2 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button size="sm" onClick={() => onNavigateToSubtopic?.(concept)}>
            Learn More About This
          </Button>
          {state.activeTab === 'related' && state.relatedConcepts.length > 0 && (<Button variant="outline" size="sm" onClick={() => handleRelatedConceptClick(state.relatedConcepts[0].name)}>
              Explore Related
            </Button>)}
        </div>
      </CardContent>
    </Card>);
}
//# sourceMappingURL=ConceptExpansion.jsx.map