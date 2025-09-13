import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
/**
 * Learning Path Generator
 * Creates detailed, personalized learning paths based on assessment results
 */
export class LearningPathGenerator {
    model = openai("gpt-5-mini");
    pathTemplates = new Map();
    /**
     * Generate a complete personalized learning path
     */
    async generateDetailedPath(topic, assessment, options = {
        includeContent: true,
        maxSections: 8,
        focusAreas: [],
        emphasize: "balanced",
        includeAssessments: true,
    }) {
        // Generate base path structure
        const basePath = await this.generatePathStructure(topic, assessment, options);
        // Generate detailed sections
        const sections = await this.generatePathSections(topic, assessment, basePath, options);
        // Generate learning resources
        const resources = await this.generateLearningResources(topic, assessment, sections);
        // Generate milestones
        const milestones = this.generateMilestones(sections);
        // Generate adaptation rules
        const adaptationRules = this.generateAdaptationRules(assessment);
        return {
            ...basePath,
            sections,
            resources,
            milestones,
            adaptationRules,
            prerequisites: this.extractPrerequisites(topic, assessment),
            learningObjectives: this.generateLearningObjectives(topic, assessment, sections),
            assessmentCriteria: this.generateAssessmentCriteria(sections),
        };
    }
    /**
     * Generate multiple path alternatives for user to choose from
     */
    async generatePathAlternatives(topic, assessment) {
        const alternatives = [
            {
                includeContent: true,
                maxSections: 6,
                focusAreas: [],
                emphasize: "theory",
                includeAssessments: true,
            },
            {
                includeContent: true,
                maxSections: 8,
                focusAreas: [],
                emphasize: "practice",
                includeAssessments: true,
            },
            {
                includeContent: true,
                maxSections: 10,
                focusAreas: [],
                emphasize: "balanced",
                includeAssessments: true,
                timeConstraint: 15, // 15 hour comprehensive path
            },
        ];
        const paths = await Promise.all(alternatives.map((options) => this.generateDetailedPath(topic, assessment, options)));
        // Set appropriate titles and adjust recommendations
        paths[0].title = "Theory-Focused Path";
        paths[0].description =
            "Deep dive into theoretical foundations and concepts";
        paths[0].recommended = assessment.learningStyles.includes("textual");
        paths[1].title = "Hands-On Practice Path";
        paths[1].description =
            "Learn by doing with practical exercises and applications";
        paths[1].recommended = assessment.learningStyles.includes("interactive");
        paths[2].title = "Comprehensive Mastery Path";
        paths[2].description =
            "Balanced approach covering theory, practice, and advanced topics";
        paths[2].recommended =
            assessment.preferences.contentDepth === "comprehensive";
        return paths;
    }
    /**
     * Customize path based on specific learning goals
     */
    async customizePath(basePath, customizationOptions) {
        const customizedPath = { ...basePath };
        // Adjust sections based on time availability
        if (customizationOptions.timeAvailable) {
            customizedPath.sections = this.adjustSectionsForTime(basePath.sections, customizationOptions.timeAvailable);
        }
        // Skip basic sections if requested
        if (customizationOptions.skipBasics) {
            customizedPath.sections = customizedPath.sections.filter((section) => section.difficulty !== "beginner");
        }
        // Emphasize specific areas
        if (customizationOptions.emphasizeAreas?.length) {
            customizedPath.sections = this.emphasizeAreas(customizedPath.sections, customizationOptions.emphasizeAreas);
        }
        // Adjust for deadline
        if (customizationOptions.learningDeadline) {
            customizedPath.sections = this.adjustSectionsForDeadline(customizedPath.sections, customizationOptions.learningDeadline);
        }
        return customizedPath;
    }
    // Private helper methods
    async generatePathStructure(topic, assessment, options) {
        const prompt = `Create a structured learning path for "${topic.title}" based on the following user assessment:

Assessment Results:
- Knowledge Level: ${assessment.knowledgeLevel}/5
- Learning Styles: ${assessment.learningStyles.join(", ")}
- Preferred Difficulty: ${assessment.preferences.difficultyPreference}
- Content Depth: ${assessment.preferences.contentDepth}
- Pace Preference: ${assessment.preferences.pacePreference}

Path Requirements:
- Maximum ${options.maxSections} main sections
- Emphasis on: ${options.emphasize}
- Time constraint: ${options.timeConstraint || "flexible"} hours
${options.focusAreas.length
            ? `- Focus on: ${options.focusAreas.join(", ")}`
            : ""}

Generate a path structure with:
1. Path title and description
2. Estimated total time
3. Difficulty level
4. Main topic areas to cover (in sequence)

Format as JSON:
{
  "title": "Path title",
  "description": "Path description",
  "estimatedTime": "X hours",
  "difficulty": "beginner|intermediate|advanced",
  "topics": ["Topic 1", "Topic 2", ...]
}`;
        const result = await generateText({
            model: this.model,
            prompt,
            temperature: 0.6,
        });
        try {
            const parsed = JSON.parse(result.text);
            return {
                id: `path_${Date.now()}`,
                title: parsed.title,
                description: parsed.description,
                estimatedTime: parsed.estimatedTime,
                difficulty: parsed.difficulty,
                topics: parsed.topics,
                recommended: true,
            };
        }
        catch (error) {
            console.error("Failed to parse path structure:", error);
            return this.generateFallbackPath(topic, assessment);
        }
    }
    async generatePathSections(topic, assessment, basePath, options) {
        const sections = [];
        for (let i = 0; i < basePath.topics.length; i++) {
            const sectionTopic = basePath.topics[i];
            const section = await this.generateSection(topic, sectionTopic, assessment, i, basePath.topics.length, options);
            sections.push(section);
        }
        return sections;
    }
    async generateSection(mainTopic, sectionTopic, assessment, index, totalSections, options) {
        // Determine section difficulty based on position and user level
        let difficulty = "intermediate";
        const progressRatio = index / (totalSections - 1);
        if (assessment.knowledgeLevel <= 2) {
            difficulty = progressRatio < 0.7 ? "beginner" : "intermediate";
        }
        else if (assessment.knowledgeLevel >= 4) {
            difficulty = progressRatio > 0.3 ? "advanced" : "intermediate";
        }
        const estimatedTime = this.calculateSectionTime(index, totalSections, assessment.preferences.pacePreference, difficulty);
        // Generate interactive elements
        const interactiveElements = this.generateInteractiveElements(sectionTopic, assessment, difficulty);
        // Generate assessment questions if requested
        const assessmentQuestions = options.includeAssessments
            ? await this.generateSectionAssessment(sectionTopic, difficulty)
            : [];
        return {
            id: `section_${index + 1}`,
            title: sectionTopic,
            description: `Comprehensive coverage of ${sectionTopic} in the context of ${mainTopic.title}`,
            estimatedTime,
            difficulty,
            prerequisites: index > 0 ? [`section_${index}`] : [],
            learningObjectives: this.generateSectionObjectives(sectionTopic, difficulty),
            interactiveElements,
            assessmentQuestions,
            completionCriteria: {
                minimumTimeSpent: Math.floor(estimatedTime * 0.6), // 60% of estimated time
                requiredInteractions: interactiveElements
                    .slice(0, 2)
                    .map((e) => e.title),
                assessmentThreshold: 0.7,
                practicalRequirements: interactiveElements
                    .filter((e) => e.type === "practical")
                    .map((e) => e.title),
            },
            adaptationTriggers: [
                "low_engagement",
                "fast_completion",
                "assessment_failure",
                "repeated_attempts",
            ],
        };
    }
    async generateLearningResources(topic, assessment, sections) {
        const resources = [];
        const learningStyles = assessment.learningStyles;
        // Generate resources for each learning style preference
        if (learningStyles.includes("visual")) {
            resources.push({
                type: "interactive",
                title: `${topic.title} Interactive Diagrams`,
                description: "Visual diagrams and flowcharts explaining key concepts",
                difficulty: "intermediate",
                learningStyles: ["visual"],
                priority: "recommended",
            });
        }
        if (learningStyles.includes("video")) {
            resources.push({
                type: "video",
                title: `${topic.title} Video Tutorial Series`,
                description: "Comprehensive video explanations with examples",
                estimatedTime: 180, // 3 hours
                difficulty: assessment.knowledgeLevel >= 4 ? "advanced" : "intermediate",
                learningStyles: ["video", "visual"],
                priority: "recommended",
            });
        }
        if (learningStyles.includes("textual")) {
            resources.push({
                type: "article",
                title: `Complete ${topic.title} Guide`,
                description: "In-depth written guide with detailed explanations",
                difficulty: assessment.preferences.contentDepth === "comprehensive"
                    ? "advanced"
                    : "intermediate",
                learningStyles: ["textual"],
                priority: "required",
            });
        }
        // Add community resources
        resources.push({
            type: "community",
            title: `${topic.title} Learning Community`,
            description: "Connect with other learners and get help",
            difficulty: "beginner",
            learningStyles: ["conversational"],
            priority: "optional",
        });
        // Add tool resources for advanced learners
        if (assessment.knowledgeLevel >= 3) {
            resources.push({
                type: "tool",
                title: `${topic.title} Practice Tools`,
                description: "Hands-on tools and environments for practice",
                difficulty: "advanced",
                learningStyles: ["interactive"],
                priority: "recommended",
            });
        }
        return resources;
    }
    generateMilestones(sections) {
        const milestones = [];
        const totalSections = sections.length;
        // Generate milestones at 25%, 50%, 75%, and 100%
        const milestonePositions = [25, 50, 75, 100];
        const milestoneNames = [
            "Foundation",
            "Proficiency",
            "Expertise",
            "Mastery",
        ];
        milestonePositions.forEach((position, index) => {
            const sectionIndex = Math.floor((position / 100) * totalSections) - 1;
            const sectionRequirements = sections
                .slice(0, sectionIndex + 1)
                .map((s) => s.id);
            milestones.push({
                id: `milestone_${position}`,
                title: `${milestoneNames[index]} Milestone`,
                description: `You've completed ${position}% of your learning journey!`,
                position,
                requirements: sectionRequirements,
                rewards: this.generateMilestoneRewards(position),
                assessmentType: position === 100 ? "practical_application" : "quiz",
            });
        });
        return milestones;
    }
    generateAdaptationRules(assessment) {
        const rules = [];
        // Rule for fast learners
        rules.push({
            trigger: "fast_completion_with_high_accuracy",
            action: "increase_difficulty",
            parameters: { difficulty_boost: 1, add_advanced_concepts: true },
            description: "Increase difficulty when user demonstrates mastery",
        });
        // Rule for struggling learners
        rules.push({
            trigger: "repeated_assessment_failures",
            action: "add_practice",
            parameters: { practice_exercises: 3, review_previous: true },
            description: "Add extra practice when user struggles with assessments",
        });
        // Rule for visual learners
        if (assessment.learningStyles.includes("visual")) {
            rules.push({
                trigger: "low_engagement_with_text",
                action: "add_resources",
                parameters: {
                    resource_types: ["visual", "interactive"],
                    priority: "high",
                },
                description: "Add visual resources when text-based learning shows low engagement",
            });
        }
        // Rule for impatient learners
        if (assessment.preferences.pacePreference === "fast") {
            rules.push({
                trigger: "long_time_on_section",
                action: "skip_section",
                parameters: {
                    threshold_minutes: 45,
                    skip_if_mastery: true,
                    provide_summary: true,
                },
                description: "Allow fast-paced learners to skip sections they already understand",
            });
        }
        return rules;
    }
    generateInteractiveElements(sectionTopic, assessment, difficulty) {
        const elements = [];
        // Add example element
        elements.push({
            type: "example",
            title: `${sectionTopic} Example`,
            description: `Real-world example demonstrating ${sectionTopic}`,
            instructions: "Review this example and identify key concepts",
            estimatedTime: 15,
            difficultyLevel: difficulty === "beginner" ? 2 : difficulty === "intermediate" ? 3 : 4,
            learningStyle: ["visual", "textual"],
        });
        // Add interactive element for interactive learners
        if (assessment.learningStyles.includes("interactive")) {
            elements.push({
                type: "exercise",
                title: `${sectionTopic} Practice Exercise`,
                description: `Hands-on exercise to practice ${sectionTopic}`,
                instructions: "Complete the exercise step by step",
                estimatedTime: 25,
                difficultyLevel: difficulty === "beginner" ? 2 : difficulty === "intermediate" ? 3 : 4,
                learningStyle: ["interactive"],
            });
        }
        // Add reflection element
        elements.push({
            type: "reflection",
            title: `${sectionTopic} Reflection`,
            description: `Think about how ${sectionTopic} applies to your goals`,
            instructions: "Consider how this concept relates to your learning objectives",
            estimatedTime: 10,
            difficultyLevel: 2,
            learningStyle: ["conversational", "textual"],
        });
        return elements;
    }
    async generateSectionAssessment(sectionTopic, difficulty) {
        // For now, generate template questions - in full implementation would use AI
        const questions = [
            {
                id: `q_${Date.now()}_1`,
                type: "multiple_choice",
                question: `What is the key principle behind ${sectionTopic}?`,
                options: [
                    "Option A - Basic understanding",
                    "Option B - Intermediate concept",
                    "Option C - Advanced application",
                    "Option D - Complex integration",
                ],
                correctAnswer: difficulty === "beginner"
                    ? "Option A"
                    : difficulty === "intermediate"
                        ? "Option B"
                        : "Option C",
                explanation: "This tests understanding of core principles",
                difficulty: difficulty === "beginner"
                    ? "easy"
                    : difficulty === "intermediate"
                        ? "medium"
                        : "hard",
                concept: sectionTopic.toLowerCase().replace(/\s+/g, "_"),
            },
        ];
        return questions;
    }
    generateSectionObjectives(sectionTopic, difficulty) {
        const difficultyMappings = {
            beginner: [
                `Understand basic concepts of ${sectionTopic}`,
                `Identify key components and terminology`,
                `Recognize common applications`,
            ],
            intermediate: [
                `Apply ${sectionTopic} principles in practice`,
                `Analyze different approaches and methods`,
                `Compare and contrast various implementations`,
            ],
            advanced: [
                `Synthesize complex ${sectionTopic} concepts`,
                `Design innovative solutions using ${sectionTopic}`,
                `Evaluate and optimize ${sectionTopic} applications`,
            ],
        };
        return difficultyMappings[difficulty];
    }
    generateMilestoneRewards(position) {
        const rewardMappings = {
            25: ["Access to bonus materials", "Community recognition badge"],
            50: ["Advanced practice exercises", "Peer learning opportunities"],
            75: ["Expert-level challenges", "Mentorship opportunities"],
            100: [
                "Completion certificate",
                "Advanced topics unlock",
                "Alumni network access",
            ],
        };
        return (rewardMappings[position] || [
            "Progress recognition",
        ]);
    }
    extractPrerequisites(topic, assessment) {
        // Generate prerequisites based on topic and assessment
        if (assessment.knowledgeLevel <= 2) {
            return ["Basic computer literacy", "Problem-solving fundamentals"];
        }
        else if (assessment.knowledgeLevel <= 3) {
            return [
                `Basic understanding of ${topic.title}`,
                "Some practical experience",
            ];
        }
        else {
            return [
                `Solid foundation in ${topic.title}`,
                "Advanced conceptual understanding",
            ];
        }
    }
    generateLearningObjectives(topic, assessment, sections) {
        const objectives = [];
        objectives.push(`Master the fundamentals of ${topic.title}`);
        objectives.push(`Apply ${topic.title} concepts in real-world scenarios`);
        if (assessment.knowledgeLevel >= 3) {
            objectives.push(`Analyze complex ${topic.title} implementations`);
        }
        if (assessment.knowledgeLevel >= 4) {
            objectives.push(`Design and evaluate advanced ${topic.title} solutions`);
        }
        return objectives;
    }
    generateAssessmentCriteria(sections) {
        const criteria = [];
        criteria.push("Complete all required sections with minimum 70% accuracy");
        criteria.push("Demonstrate understanding through practical applications");
        criteria.push("Pass section assessments with satisfactory scores");
        const practicalSections = sections.filter((s) => s.interactiveElements.some((e) => e.type === "practical"));
        if (practicalSections.length > 0) {
            criteria.push("Successfully complete all practical exercises");
        }
        return criteria;
    }
    calculateSectionTime(index, totalSections, pace, difficulty) {
        let baseTime = 45; // 45 minutes base
        // Adjust for difficulty
        const difficultyMultiplier = difficulty === "beginner" ? 1.2 : difficulty === "advanced" ? 1.5 : 1;
        // Adjust for pace preference
        const paceMultiplier = pace === "slow" ? 1.4 : pace === "fast" ? 0.8 : 1;
        // Adjust for position (later sections might be more complex)
        const positionMultiplier = 1 + (index / totalSections) * 0.3;
        return Math.round(baseTime * difficultyMultiplier * paceMultiplier * positionMultiplier);
    }
    generateFallbackPath(topic, assessment) {
        return {
            id: `fallback_${Date.now()}`,
            title: `Learn ${topic.title}`,
            description: "A structured approach to mastering the fundamentals",
            estimatedTime: "8-10 hours",
            difficulty: assessment.knowledgeLevel >= 4
                ? "advanced"
                : assessment.knowledgeLevel >= 3
                    ? "intermediate"
                    : "beginner",
            topics: [
                `Introduction to ${topic.title}`,
                "Core Concepts",
                "Practical Applications",
                "Advanced Topics",
                "Real-world Examples",
            ],
            recommended: true,
        };
    }
    adjustSectionsForTime(sections, hoursPerWeek) {
        // Adjust section content and pacing based on available time
        const totalMinutes = hoursPerWeek * 60;
        const avgSectionTime = totalMinutes / sections.length;
        return sections.map((section) => ({
            ...section,
            estimatedTime: Math.min(section.estimatedTime, avgSectionTime),
            interactiveElements: section.estimatedTime > avgSectionTime
                ? section.interactiveElements.slice(0, 2) // Reduce interactive elements if pressed for time
                : section.interactiveElements,
        }));
    }
    emphasizeAreas(sections, emphasizeAreas) {
        return sections.map((section) => {
            const shouldEmphasize = emphasizeAreas.some((area) => section.title.toLowerCase().includes(area.toLowerCase()));
            if (shouldEmphasize) {
                return {
                    ...section,
                    estimatedTime: Math.round(section.estimatedTime * 1.3),
                    interactiveElements: [
                        ...section.interactiveElements,
                        {
                            type: "practical",
                            title: `Advanced ${section.title} Practice`,
                            description: `Extended practice with ${section.title}`,
                            instructions: "Work through additional practice scenarios",
                            estimatedTime: 30,
                            difficultyLevel: 4,
                            learningStyle: ["interactive"],
                        },
                    ],
                };
            }
            return section;
        });
    }
    adjustSectionsForDeadline(sections, deadline) {
        const now = new Date();
        const timeAvailable = deadline.getTime() - now.getTime();
        const daysAvailable = Math.floor(timeAvailable / (1000 * 60 * 60 * 24));
        if (daysAvailable < 7) {
            // Urgent timeline - compress content
            return sections.map((section) => ({
                ...section,
                estimatedTime: Math.round(section.estimatedTime * 0.7),
                interactiveElements: section.interactiveElements.filter((e) => e.type !== "reflection"),
            }));
        }
        return sections;
    }
}
// Export singleton instance
export const learningPathGenerator = new LearningPathGenerator();
//# sourceMappingURL=pathGenerator.js.map