import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
/**
 * Adaptive Questioning System
 * Generates intelligent questions that adapt based on user responses
 */
export class AdaptiveQuestioningSystem {
    model = openai("gpt-5-mini");
    questionBank = new Map();
    /**
     * Generate initial assessment questions for a topic
     */
    async generateInitialQuestions(topic, options) {
        const prompt = this.buildInitialQuestionsPrompt(topic, options);
        const result = await generateText({
            model: this.model,
            prompt,
            temperature: 0.6,
        });
        const questions = this.parseGeneratedQuestions(result.text, topic.id);
        this.cacheQuestions(topic.id, questions);
        return questions;
    }
    /**
     * Generate adaptive follow-up questions based on previous answers
     */
    async generateAdaptiveFollowUp(session, topic, previousAnswer) {
        const analysisResult = this.analyzeResponsePattern(session);
        if (!analysisResult.needsFollowUp) {
            return null;
        }
        const prompt = this.buildAdaptiveFollowUpPrompt(topic, session, previousAnswer, analysisResult);
        const result = await generateText({
            model: this.model,
            prompt,
            temperature: 0.7,
        });
        const followUpQuestions = this.parseGeneratedQuestions(result.text, topic.id);
        return followUpQuestions[0] || null;
    }
    /**
     * Analyze user responses to determine knowledge level and adjust questioning
     */
    analyzeResponsePattern(session) {
        const answers = session.answers;
        const recentAnswers = answers.slice(-3); // Look at last 3 answers
        let correctCount = 0;
        let totalDifficulty = 0;
        let avgResponseTime = 0;
        const concepts = new Set();
        for (const answer of recentAnswers) {
            // This would normally check against correct answers
            // For now, we'll use heuristics based on response patterns
            const responseMetrics = this.evaluateResponse(answer);
            if (responseMetrics.isCorrect)
                correctCount++;
            totalDifficulty += responseMetrics.perceivedDifficulty;
            avgResponseTime += answer.responseTime;
            concepts.add(responseMetrics.concept);
        }
        const accuracy = correctCount / recentAnswers.length;
        const avgDifficulty = totalDifficulty / recentAnswers.length;
        avgResponseTime = avgResponseTime / recentAnswers.length;
        // Determine inferred level
        let inferredLevel = session.inferredKnowledge.level;
        if (accuracy > 0.8 && avgResponseTime < 30000) {
            // Fast and accurate
            inferredLevel = Math.min(5, inferredLevel + 0.5);
        }
        else if (accuracy < 0.4 || avgResponseTime > 90000) {
            // Struggling
            inferredLevel = Math.max(1, inferredLevel - 0.5);
        }
        // Determine next direction
        let recommendedDirection = "continue";
        let needsFollowUp = false;
        if (accuracy > 0.9 && avgDifficulty < 3) {
            recommendedDirection = "increase_difficulty";
            needsFollowUp = true;
        }
        else if (accuracy < 0.3) {
            recommendedDirection = "decrease_difficulty";
            needsFollowUp = true;
        }
        else if (accuracy >= 0.5 && accuracy <= 0.8) {
            recommendedDirection = "probe_deeper";
            needsFollowUp = true;
        }
        return {
            inferredLevel,
            confidence: this.calculateConfidence(recentAnswers),
            strongAreas: this.identifyStrongAreas(recentAnswers),
            weakAreas: this.identifyWeakAreas(recentAnswers),
            needsFollowUp,
            recommendedDirection,
        };
    }
    /**
     * Create personalized question based on learning style detection
     */
    generateLearningStyleQuestion(topic, currentResponses) {
        // Analyze previous responses to infer preferred question types
        const preferredTypes = this.inferPreferredQuestionTypes(currentResponses);
        const styleDetectionQuestions = {
            visual: {
                id: `style_visual_${Date.now()}`,
                type: "multiple_choice",
                question: `How do you prefer to learn about complex ${topic.title} concepts?`,
                options: [
                    "Through diagrams, charts, and visual representations",
                    "Through detailed written explanations",
                    "Through hands-on practice and experimentation",
                    "Through video tutorials and demonstrations",
                ],
                metadata: {
                    difficulty: "basic",
                    concept: "learning_style",
                    purpose: "style_detection",
                    estimatedTime: 30,
                    adaptiveWeight: 1.0,
                },
            },
            practical: {
                id: `style_practical_${Date.now()}`,
                type: "multiple_choice",
                question: `When learning ${topic.title}, what helps you understand concepts best?`,
                options: [
                    "Working through real examples step by step",
                    "Understanding the theoretical foundations first",
                    "Discussing concepts with others",
                    "Seeing how it applies to different scenarios",
                ],
                metadata: {
                    difficulty: "basic",
                    concept: "learning_approach",
                    purpose: "style_detection",
                    estimatedTime: 35,
                    adaptiveWeight: 0.8,
                },
            },
            pace: {
                id: `style_pace_${Date.now()}`,
                type: "scale",
                question: `What pace works best for your ${topic.title} learning?`,
                options: [
                    "Very slow and thorough",
                    "Moderate pace",
                    "Fast-paced overview",
                ],
                metadata: {
                    difficulty: "basic",
                    concept: "learning_pace",
                    purpose: "style_detection",
                    estimatedTime: 20,
                    adaptiveWeight: 0.6,
                },
            },
        };
        // Select most appropriate style question based on what we don't know yet
        const unknownStyles = ["visual", "practical", "pace"].filter((style) => !currentResponses.find((r) => r.questionId.includes(`style_${style}`)));
        const selectedStyle = unknownStyles[0] || "visual";
        return styleDetectionQuestions[selectedStyle];
    }
    /**
     * Generate scenario-based questions for deeper assessment
     */
    async generateScenarioQuestion(topic, knowledgeLevel) {
        const prompt = `Generate a scenario-based question to assess ${knowledgeLevel > 3 ? "advanced" : "practical"} understanding of ${topic.title}.

Requirements:
- Create a realistic scenario that requires applying ${topic.title} concepts
- Include 4 multiple choice options with varying levels of correctness
- Make it challenging but fair for someone at knowledge level ${knowledgeLevel}/5
- Focus on practical application rather than memorization

Format as JSON:
{
  "scenario": "A detailed realistic scenario description",
  "question": "What should you do in this situation?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "Option X",
  "explanation": "Why this is the correct choice"
}`;
        const result = await generateText({
            model: this.model,
            prompt,
            temperature: 0.8,
        });
        try {
            const parsed = JSON.parse(result.text);
            return {
                id: `scenario_${Date.now()}`,
                type: "multiple_choice",
                question: `${parsed.scenario}\n\n${parsed.question}`,
                options: parsed.options,
                correctAnswer: parsed.correctAnswer,
                metadata: {
                    difficulty: knowledgeLevel > 3 ? "advanced" : "intermediate",
                    concept: "scenario_application",
                    purpose: "knowledge_check",
                    estimatedTime: 120,
                    adaptiveWeight: 1.2,
                },
            };
        }
        catch (error) {
            console.error("Failed to parse scenario question:", error);
            // Return fallback question
            return this.generateFallbackQuestion(topic, knowledgeLevel);
        }
    }
    // Private helper methods
    buildInitialQuestionsPrompt(topic, options) {
        return `You are an expert assessment designer creating adaptive questions about "${topic.title}".

Generate ${options.questionCount} questions with varying difficulty levels and types to assess user knowledge comprehensively.

Question Requirements:
- Mix of multiple choice, true/false, and scale questions
- Start with difficulty level ${options.currentKnowledgeLevel}/5
- Include both conceptual and practical questions
- Each question should help determine the user's actual knowledge level
- Questions should be unambiguous and fair

For each question, provide:
1. Question text
2. Question type (multiple_choice, true_false, scale)
3. Options (if applicable)
4. Correct answer
5. Difficulty level (1-5)
6. Concept being tested
7. Estimated time to answer (seconds)

Format as JSON array of question objects.`;
    }
    buildAdaptiveFollowUpPrompt(topic, session, previousAnswer, analysis) {
        return `Generate an adaptive follow-up question about "${topic.title}" based on the user's previous response.

Previous Answer Analysis:
- User appears to be at knowledge level: ${analysis.inferredLevel}/5
- Strong areas: ${analysis.strongAreas.join(", ")}
- Weak areas: ${analysis.weakAreas.join(", ")}
- Recommended direction: ${analysis.recommendedDirection}

Generate 1 targeted question that will help clarify the user's understanding in their weak areas or probe deeper into their strong areas.

The question should be:
- More ${analysis.recommendedDirection.includes("increase")
            ? "challenging"
            : "accessible"} than previous questions
- Focused on areas where understanding is unclear
- Designed to provide clear signal about their actual knowledge level

Format as JSON question object.`;
    }
    parseGeneratedQuestions(response, topicId) {
        try {
            const parsed = JSON.parse(response);
            const questions = Array.isArray(parsed) ? parsed : [parsed];
            return questions.map((q, index) => ({
                id: `q_${topicId}_${Date.now()}_${index}`,
                type: q.type || "multiple_choice",
                question: q.question || q.text,
                options: q.options,
                correctAnswer: q.correctAnswer || q.correct_answer,
                metadata: {
                    difficulty: q.difficulty || "intermediate",
                    concept: q.concept || "general",
                    purpose: "knowledge_check",
                    estimatedTime: q.estimatedTime || 60,
                    adaptiveWeight: 1.0,
                },
            }));
        }
        catch (error) {
            console.error("Failed to parse generated questions:", error);
            return [
                this.generateFallbackQuestion({ id: topicId, title: "Topic" }, 3),
            ];
        }
    }
    evaluateResponse(answer) {
        // This is a simplified evaluation - in reality would check against correct answers
        const responseTime = answer.responseTime;
        const isQuickResponse = responseTime < 30000; // 30 seconds
        const isSlowResponse = responseTime > 90000; // 90 seconds
        return {
            isCorrect: isQuickResponse && answer.confidence > 0.7,
            perceivedDifficulty: isSlowResponse ? 4 : isQuickResponse ? 2 : 3,
            concept: "general",
            confidence: answer.confidence || 0.5,
        };
    }
    calculateConfidence(answers) {
        if (answers.length === 0)
            return 0.5;
        const avgConfidence = answers.reduce((sum, a) => sum + (a.confidence || 0.5), 0) /
            answers.length;
        const consistencyBonus = this.calculateConsistency(answers) * 0.2;
        return Math.min(1.0, avgConfidence + consistencyBonus);
    }
    calculateConsistency(answers) {
        if (answers.length < 2)
            return 0;
        // Calculate variance in response times and confidence levels
        const responseTimes = answers.map((a) => a.responseTime);
        const confidences = answers.map((a) => a.confidence || 0.5);
        const timeVariance = this.calculateVariance(responseTimes);
        const confidenceVariance = this.calculateVariance(confidences);
        // Lower variance = higher consistency
        return 1 - Math.min(1, (timeVariance + confidenceVariance) / 10000);
    }
    calculateVariance(numbers) {
        const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        const variance = numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length;
        return variance;
    }
    identifyStrongAreas(answers) {
        // Analyze answers to identify concepts where user performs well
        const conceptPerformance = new Map();
        answers.forEach((answer) => {
            const evaluation = this.evaluateResponse(answer);
            const current = conceptPerformance.get(evaluation.concept) || 0;
            conceptPerformance.set(evaluation.concept, current + (evaluation.isCorrect ? 1 : 0));
        });
        return Array.from(conceptPerformance.entries())
            .filter(([_, score]) => score > 0.7)
            .map(([concept]) => concept);
    }
    identifyWeakAreas(answers) {
        // Similar to strongAreas but for areas needing improvement
        const conceptPerformance = new Map();
        answers.forEach((answer) => {
            const evaluation = this.evaluateResponse(answer);
            const current = conceptPerformance.get(evaluation.concept) || 0;
            conceptPerformance.set(evaluation.concept, current + (evaluation.isCorrect ? 1 : 0));
        });
        return Array.from(conceptPerformance.entries())
            .filter(([_, score]) => score < 0.4)
            .map(([concept]) => concept);
    }
    inferPreferredQuestionTypes(responses) {
        // Analyze response patterns to infer preferred question types
        const typePerformance = new Map();
        responses.forEach((response) => {
            const questionType = response.questionType || "multiple_choice";
            const performance = response.responseTime < 60000 && response.confidence > 0.7 ? 1 : 0;
            const current = typePerformance.get(questionType) || 0;
            typePerformance.set(questionType, current + performance);
        });
        return Array.from(typePerformance.entries())
            .sort(([, a], [, b]) => b - a)
            .map(([type]) => type);
    }
    generateFallbackQuestion(topic, level) {
        return {
            id: `fallback_${Date.now()}`,
            type: "multiple_choice",
            question: `What best describes your current understanding of ${topic.title}?`,
            options: [
                "I'm completely new to this topic",
                "I have basic familiarity with key concepts",
                "I understand most concepts and have some experience",
                "I have advanced knowledge and extensive experience",
            ],
            metadata: {
                difficulty: "basic",
                concept: "self_assessment",
                purpose: "knowledge_check",
                estimatedTime: 30,
                adaptiveWeight: 0.8,
            },
        };
    }
    cacheQuestions(topicId, questions) {
        this.questionBank.set(topicId, questions);
    }
}
// Export singleton instance
export const adaptiveQuestioningSystem = new AdaptiveQuestioningSystem();
//# sourceMappingURL=adaptiveQuestioning.js.map