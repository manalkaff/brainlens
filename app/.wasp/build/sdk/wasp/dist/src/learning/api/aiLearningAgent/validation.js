/**
 * Validation Module
 * Handles content validation, accessibility checks, and structure validation
 */
export class ValidationModule {
    /**
     * Enhanced content validation for accessibility and structure
     * Requirements 3.5, 4.4, 4.5: Validate accessibility, structure, logical flow, and clear takeaways
     */
    validateContentAccessibility(content) {
        const validationStartTime = Date.now();
        console.log(`TIMING LOGS: Starting comprehensive content validation`);
        const issues = [];
        const suggestions = [];
        // Validate content accessibility (Requirement 3.5)
        const accessibilityStartTime = Date.now();
        console.log(`TIMING LOGS: Starting language accessibility validation`);
        this.validateLanguageAccessibility(content, issues, suggestions);
        const accessibilityDuration = Date.now() - accessibilityStartTime;
        console.log(`TIMING LOGS: Completed language accessibility validation in ${accessibilityDuration}ms`);
        // Validate content structure (Requirement 4.4)
        const structureStartTime = Date.now();
        console.log(`TIMING LOGS: Starting content structure validation`);
        this.validateContentStructure(content, issues, suggestions);
        const structureDuration = Date.now() - structureStartTime;
        console.log(`TIMING LOGS: Completed content structure validation in ${structureDuration}ms`);
        // Validate logical flow (Requirement 4.5)
        const flowStartTime = Date.now();
        console.log(`TIMING LOGS: Starting logical flow validation`);
        this.validateLogicalFlow(content, issues, suggestions);
        const flowDuration = Date.now() - flowStartTime;
        console.log(`TIMING LOGS: Completed logical flow validation in ${flowDuration}ms`);
        // Validate clear takeaways (Requirement 4.5)
        const takeawaysStartTime = Date.now();
        console.log(`TIMING LOGS: Starting clear takeaways validation`);
        this.validateClearTakeaways(content, issues, suggestions);
        const takeawaysDuration = Date.now() - takeawaysStartTime;
        console.log(`TIMING LOGS: Completed clear takeaways validation in ${takeawaysDuration}ms`);
        const isValid = issues.length === 0;
        const totalValidationDuration = Date.now() - validationStartTime;
        console.log(`TIMING LOGS: Completed comprehensive content validation in ${totalValidationDuration}ms - found ${issues.length} issues`);
        if (!isValid) {
            console.warn(`⚠️ Content validation found ${issues.length} issues:`, issues);
        }
        else {
            console.log("✅ Content accessibility and structure validation passed");
        }
        return { isValid, issues, suggestions };
    }
    /**
     * Validate language accessibility
     * Requirement 3.5: Content maintains accessibility
     */
    validateLanguageAccessibility(content, issues, suggestions) {
        // Check for overly complex sentences
        const allText = content.sections.map(s => s.content).join(' ');
        const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const longSentences = sentences.filter(sentence => sentence.split(' ').length > 25);
        if (longSentences.length > sentences.length * 0.2) {
            issues.push("Content contains too many complex sentences (>25 words)");
            suggestions.push("Break down complex sentences into shorter, clearer statements");
        }
        // Check for technical jargon without explanation
        const technicalTerms = this.identifyTechnicalTerms(allText);
        const unexplainedTerms = technicalTerms.filter(term => !this.hasExplanation(term, allText));
        if (unexplainedTerms.length > 0) {
            issues.push(`Technical terms used without explanation: ${unexplainedTerms.slice(0, 3).join(', ')}`);
            suggestions.push("Provide simple explanations for technical terms when first introduced");
        }
        // Check for practical examples
        const hasExamples = content.sections.some(section => section.content.toLowerCase().includes('example') ||
            section.content.toLowerCase().includes('for instance') ||
            section.content.toLowerCase().includes('such as'));
        if (!hasExamples) {
            issues.push("Content lacks practical examples for accessibility");
            suggestions.push("Add real-world examples to illustrate abstract concepts");
        }
    }
    /**
     * Validate content structure for progressive learning
     * Requirement 4.4: Content maintains logical structure
     */
    validateContentStructure(content, issues, suggestions) {
        // Validate section count
        if (content.sections.length < 3) {
            issues.push("Content has too few sections for proper learning progression");
            suggestions.push("Include at least 3 sections: foundation, building, and application");
        }
        if (content.sections.length > 6) {
            issues.push("Content has too many sections, may overwhelm learners");
            suggestions.push("Consolidate content into 3-6 focused sections");
        }
        // Validate section balance
        const sectionLengths = content.sections.map(s => s.content.length);
        const avgLength = sectionLengths.reduce((sum, len) => sum + len, 0) / sectionLengths.length;
        const imbalancedSections = sectionLengths.filter(len => len < avgLength * 0.3 || len > avgLength * 3);
        if (imbalancedSections.length > 0) {
            issues.push("Sections are significantly imbalanced in length");
            suggestions.push("Ensure sections are roughly balanced to maintain learning flow");
        }
        // Validate learning objectives
        const sectionsWithObjectives = content.sections.filter(s => s.learningObjective);
        if (sectionsWithObjectives.length < content.sections.length * 0.5) {
            issues.push("Many sections lack clear learning objectives");
            suggestions.push("Add learning objectives to help learners understand section goals");
        }
    }
    /**
     * Validate logical flow between sections
     * Requirement 4.5: Content maintains logical flow
     */
    validateLogicalFlow(content, issues, suggestions) {
        // Check for transitional language between sections
        const hasTransitions = content.sections.slice(1).some((section, index) => {
            const sectionStart = section.content.substring(0, 200).toLowerCase();
            const transitionWords = [
                'building on', 'now that', 'with this understanding', 'next',
                'following', 'after', 'once you understand', 'having covered'
            ];
            return transitionWords.some(word => sectionStart.includes(word));
        });
        if (!hasTransitions) {
            issues.push("Sections lack transitional language for smooth flow");
            suggestions.push("Add connecting phrases to link sections and show progression");
        }
        // Validate complexity progression
        const complexities = content.sections.map(s => s.complexity).filter(Boolean);
        if (complexities.length > 0 && !this.validateComplexityProgression(complexities)) {
            issues.push("Section complexity does not follow logical progression");
            suggestions.push("Ensure sections progress from foundation to building to application");
        }
        // Check for concept building
        const conceptWords = this.extractKeyConceptWords(content.sections[0]?.content || '');
        const laterSectionsReferenceEarlyConcepts = content.sections.slice(1).some(section => conceptWords.some(concept => section.content.toLowerCase().includes(concept.toLowerCase())));
        if (conceptWords.length > 0 && !laterSectionsReferenceEarlyConcepts) {
            issues.push("Later sections don't build upon concepts from earlier sections");
            suggestions.push("Reference and build upon concepts introduced in earlier sections");
        }
    }
    /**
     * Validate clear takeaways and actionable content
     * Requirement 4.5: Content provides clear takeaways
     */
    validateClearTakeaways(content, issues, suggestions) {
        // Validate key takeaways quality
        if (content.keyTakeaways.length < 3) {
            issues.push("Too few key takeaways for comprehensive understanding");
            suggestions.push("Include 3-7 key takeaways that summarize main learning points");
        }
        // Check takeaway clarity and actionability
        const vagueTakeaways = content.keyTakeaways.filter(takeaway => {
            const vagueWords = ['important', 'useful', 'good', 'bad', 'interesting', 'complex'];
            return vagueWords.some(word => takeaway.toLowerCase().includes(word)) &&
                !this.hasSpecificDetails(takeaway);
        });
        if (vagueTakeaways.length > content.keyTakeaways.length * 0.3) {
            issues.push("Key takeaways are too vague or generic");
            suggestions.push("Make takeaways specific and actionable with concrete details");
        }
        // Validate next steps actionability
        if (content.nextSteps.length < 2) {
            issues.push("Too few next steps for continued learning");
            suggestions.push("Include 2-5 specific, actionable next steps");
        }
        const nonActionableSteps = content.nextSteps.filter(step => {
            const actionWords = ['try', 'practice', 'explore', 'build', 'create', 'implement', 'learn', 'study'];
            return !actionWords.some(word => step.toLowerCase().includes(word));
        });
        if (nonActionableSteps.length > content.nextSteps.length * 0.5) {
            issues.push("Next steps are not sufficiently actionable");
            suggestions.push("Use action verbs and specific activities in next steps");
        }
    }
    /**
     * Validate that complexity progresses logically through sections
     * Requirement 3.4: Each section builds upon previous knowledge clearly
     */
    validateComplexityProgression(complexities) {
        const complexityOrder = { "foundation": 1, "building": 2, "application": 3 };
        let previousLevel = 0;
        let hasProgression = true;
        for (const complexity of complexities) {
            if (!complexity)
                continue;
            const currentLevel = complexityOrder[complexity] || 2;
            // Allow same level or progression, but not regression
            if (currentLevel < previousLevel - 1) {
                hasProgression = false;
                break;
            }
            previousLevel = Math.max(previousLevel, currentLevel);
        }
        return hasProgression;
    }
    /**
     * Apply basic fixes to content based on validation suggestions
     */
    applyBasicContentFixes(content, suggestions) {
        // Add learning objectives if missing
        content.sections.forEach((section, index) => {
            if (!section.learningObjective) {
                section.learningObjective = `Understand ${section.title.toLowerCase()}`;
            }
        });
        // Ensure minimum takeaways
        while (content.keyTakeaways.length < 3) {
            content.keyTakeaways.push(`Important aspect of ${content.title} for continued learning`);
        }
        // Ensure minimum next steps
        while (content.nextSteps.length < 2) {
            content.nextSteps.push(`Continue exploring ${content.title} through additional resources`);
        }
        console.log("🔧 Applied basic content fixes based on validation suggestions");
    }
    /**
     * Helper methods for content validation
     */
    identifyTechnicalTerms(text) {
        // Simple heuristic: words that are capitalized, contain technical suffixes, or are domain-specific
        const technicalPatterns = [
            /\b[A-Z][a-z]*(?:[A-Z][a-z]*)+\b/g, // CamelCase words
            /\b\w+(?:tion|sion|ment|ness|ity|ism|ology|graphy)\b/g, // Technical suffixes
            /\b(?:API|SDK|HTTP|JSON|XML|SQL|AI|ML|IoT|VR|AR)\b/g // Common technical acronyms
        ];
        const terms = new Set();
        technicalPatterns.forEach(pattern => {
            const matches = text.match(pattern) || [];
            matches.forEach(match => terms.add(match));
        });
        return Array.from(terms).slice(0, 10); // Limit to 10 terms for performance
    }
    hasExplanation(term, text) {
        const explanationPatterns = [
            new RegExp(`${term}\\s+(?:is|means|refers to|stands for)`, 'i'),
            new RegExp(`(?:is|means|refers to|stands for)\\s+${term}`, 'i'),
            new RegExp(`${term}\\s*\\([^)]+\\)`, 'i'), // Term with parenthetical explanation
            new RegExp(`${term}\\s*[-–—]\\s*[a-z]`, 'i') // Term with dash explanation
        ];
        return explanationPatterns.some(pattern => pattern.test(text));
    }
    hasSpecificDetails(text) {
        // Check for specific numbers, examples, or concrete details
        const specificPatterns = [
            /\d+/g, // Numbers
            /\b(?:example|instance|such as|like|including)\b/i, // Example indicators
            /\b(?:specifically|particularly|exactly|precisely)\b/i // Specificity indicators
        ];
        return specificPatterns.some(pattern => pattern.test(text));
    }
    extractKeyConceptWords(text) {
        // Extract important nouns and concepts from the first section
        const words = text.toLowerCase()
            .split(/\W+/)
            .filter(word => word.length > 4)
            .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'will', 'been', 'were'].includes(word));
        // Simple frequency analysis
        const frequency = {};
        words.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });
        return Object.entries(frequency)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([word]) => word);
    }
}
//# sourceMappingURL=validation.js.map