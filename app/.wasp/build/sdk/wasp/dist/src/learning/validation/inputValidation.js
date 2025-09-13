/**
 * Client-side input validation utilities for the learning platform
 */
import { createValidationError } from '../errors/errorTypes';
// Topic title validation
export function validateTopicTitle(title) {
    try {
        if (!title || typeof title !== 'string') {
            return {
                isValid: false,
                error: createValidationError('title', 'Topic title is required')
            };
        }
        const trimmed = title.trim();
        if (trimmed.length === 0) {
            return {
                isValid: false,
                error: createValidationError('title', 'Topic title cannot be empty')
            };
        }
        if (trimmed.length > 200) {
            return {
                isValid: false,
                error: createValidationError('title', 'Topic title is too long (maximum 200 characters)')
            };
        }
        // Check for invalid characters
        const invalidChars = /[<>{}[\]\\\/]/;
        if (invalidChars.test(trimmed)) {
            return {
                isValid: false,
                error: createValidationError('title', 'Topic title contains invalid characters')
            };
        }
        return {
            isValid: true,
            sanitizedValue: trimmed
        };
    }
    catch (error) {
        return {
            isValid: false,
            error: createValidationError('title', 'Invalid topic title format')
        };
    }
}
// Chat message validation
export function validateChatMessage(message) {
    try {
        if (!message || typeof message !== 'string') {
            return {
                isValid: false,
                error: createValidationError('message', 'Message is required')
            };
        }
        const trimmed = message.trim();
        if (trimmed.length === 0) {
            return {
                isValid: false,
                error: createValidationError('message', 'Message cannot be empty')
            };
        }
        if (trimmed.length > 4000) {
            return {
                isValid: false,
                error: createValidationError('message', 'Message is too long (maximum 4000 characters)')
            };
        }
        // Basic HTML/script tag removal
        let sanitized = trimmed.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        sanitized = sanitized.replace(/<[^>]*>/g, '');
        return {
            isValid: true,
            sanitizedValue: sanitized
        };
    }
    catch (error) {
        return {
            isValid: false,
            error: createValidationError('message', 'Invalid message format')
        };
    }
}
// Quiz answer validation
export function validateQuizAnswer(answer, questionType) {
    try {
        if (answer === undefined || answer === null) {
            return {
                isValid: false,
                error: createValidationError('answer', 'Answer is required')
            };
        }
        if (typeof answer !== 'string') {
            return {
                isValid: false,
                error: createValidationError('answer', 'Answer must be text')
            };
        }
        const trimmed = answer.trim();
        if (trimmed.length === 0) {
            return {
                isValid: false,
                error: createValidationError('answer', 'Answer cannot be empty')
            };
        }
        // Validate based on question type
        switch (questionType) {
            case 'TRUE_FALSE':
                if (!['true', 'false', 'yes', 'no'].includes(trimmed.toLowerCase())) {
                    return {
                        isValid: false,
                        error: createValidationError('answer', 'Answer must be true/false or yes/no')
                    };
                }
                break;
            case 'MULTIPLE_CHOICE':
                if (trimmed.length > 500) {
                    return {
                        isValid: false,
                        error: createValidationError('answer', 'Answer is too long (maximum 500 characters)')
                    };
                }
                break;
            case 'FILL_BLANK':
                if (trimmed.length > 200) {
                    return {
                        isValid: false,
                        error: createValidationError('answer', 'Answer is too long (maximum 200 characters)')
                    };
                }
                break;
            case 'CODE_CHALLENGE':
                if (trimmed.length > 2000) {
                    return {
                        isValid: false,
                        error: createValidationError('answer', 'Code answer is too long (maximum 2000 characters)')
                    };
                }
                break;
        }
        // Basic sanitization
        let sanitized = trimmed.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        return {
            isValid: true,
            sanitizedValue: sanitized
        };
    }
    catch (error) {
        return {
            isValid: false,
            error: createValidationError('answer', 'Invalid answer format')
        };
    }
}
// Search query validation
export function validateSearchQuery(query) {
    try {
        if (!query || typeof query !== 'string') {
            return {
                isValid: false,
                error: createValidationError('query', 'Search query is required')
            };
        }
        const trimmed = query.trim();
        if (trimmed.length === 0) {
            return {
                isValid: false,
                error: createValidationError('query', 'Search query cannot be empty')
            };
        }
        if (trimmed.length > 1000) {
            return {
                isValid: false,
                error: createValidationError('query', 'Search query is too long (maximum 1000 characters)')
            };
        }
        // Basic sanitization
        let sanitized = trimmed.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        sanitized = sanitized.replace(/<[^>]*>/g, '');
        return {
            isValid: true,
            sanitizedValue: sanitized
        };
    }
    catch (error) {
        return {
            isValid: false,
            error: createValidationError('query', 'Invalid search query format')
        };
    }
}
// Progress update validation
export function validateProgressUpdate(data) {
    try {
        const { timeSpent, completed, bookmarks, preferences } = data;
        // Validate timeSpent
        if (timeSpent !== undefined) {
            if (typeof timeSpent !== 'number' || timeSpent < 0 || timeSpent > 86400) { // Max 24 hours
                return {
                    isValid: false,
                    error: createValidationError('timeSpent', 'Time spent must be a number between 0 and 86400 seconds')
                };
            }
        }
        // Validate completed
        if (completed !== undefined && typeof completed !== 'boolean') {
            return {
                isValid: false,
                error: createValidationError('completed', 'Completed must be a boolean value')
            };
        }
        // Validate bookmarks
        if (bookmarks !== undefined) {
            if (!Array.isArray(bookmarks)) {
                return {
                    isValid: false,
                    error: createValidationError('bookmarks', 'Bookmarks must be an array')
                };
            }
            if (bookmarks.length > 100) {
                return {
                    isValid: false,
                    error: createValidationError('bookmarks', 'Too many bookmarks (maximum 100)')
                };
            }
            // Validate each bookmark
            for (let i = 0; i < bookmarks.length; i++) {
                const bookmark = bookmarks[i];
                if (typeof bookmark !== 'string' || bookmark.length > 500) {
                    return {
                        isValid: false,
                        error: createValidationError('bookmarks', `Bookmark ${i + 1} is invalid or too long`)
                    };
                }
            }
        }
        // Validate preferences
        if (preferences !== undefined) {
            if (typeof preferences !== 'object' || preferences === null) {
                return {
                    isValid: false,
                    error: createValidationError('preferences', 'Preferences must be an object')
                };
            }
            // Validate specific preference fields
            if (preferences.knowledgeLevel && !['beginner', 'intermediate', 'advanced'].includes(preferences.knowledgeLevel)) {
                return {
                    isValid: false,
                    error: createValidationError('knowledgeLevel', 'Invalid knowledge level')
                };
            }
            if (preferences.learningStyle && !['visual', 'auditory', 'kinesthetic', 'reading'].includes(preferences.learningStyle)) {
                return {
                    isValid: false,
                    error: createValidationError('learningStyle', 'Invalid learning style')
                };
            }
        }
        return {
            isValid: true,
            sanitizedValue: {
                timeSpent,
                completed,
                bookmarks: bookmarks?.map(b => b.trim().substring(0, 500)),
                preferences
            }
        };
    }
    catch (error) {
        return {
            isValid: false,
            error: createValidationError('progressUpdate', 'Invalid progress update format')
        };
    }
}
// File upload validation (for future use)
export function validateFileUpload(file, allowedTypes, maxSize) {
    try {
        if (!file) {
            return {
                isValid: false,
                error: createValidationError('file', 'File is required')
            };
        }
        // Check file type
        if (!allowedTypes.includes(file.type)) {
            return {
                isValid: false,
                error: createValidationError('fileType', `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`)
            };
        }
        // Check file size
        if (file.size > maxSize) {
            const maxSizeMB = Math.round(maxSize / (1024 * 1024));
            return {
                isValid: false,
                error: createValidationError('fileSize', `File is too large. Maximum size: ${maxSizeMB}MB`)
            };
        }
        // Check file name
        if (file.name.length > 255) {
            return {
                isValid: false,
                error: createValidationError('fileName', 'File name is too long (maximum 255 characters)')
            };
        }
        // Check for potentially dangerous file names
        const dangerousPatterns = /[<>:"|?*\\\/]/;
        if (dangerousPatterns.test(file.name)) {
            return {
                isValid: false,
                error: createValidationError('fileName', 'File name contains invalid characters')
            };
        }
        return {
            isValid: true,
            sanitizedValue: file
        };
    }
    catch (error) {
        return {
            isValid: false,
            error: createValidationError('file', 'Invalid file format')
        };
    }
}
// URL validation
export function validateUrl(url) {
    try {
        if (!url || typeof url !== 'string') {
            return {
                isValid: false,
                error: createValidationError('url', 'URL is required')
            };
        }
        const trimmed = url.trim();
        if (trimmed.length === 0) {
            return {
                isValid: false,
                error: createValidationError('url', 'URL cannot be empty')
            };
        }
        if (trimmed.length > 2000) {
            return {
                isValid: false,
                error: createValidationError('url', 'URL is too long (maximum 2000 characters)')
            };
        }
        // Basic URL format validation
        try {
            new URL(trimmed);
        }
        catch {
            return {
                isValid: false,
                error: createValidationError('url', 'Invalid URL format')
            };
        }
        // Check for allowed protocols
        const allowedProtocols = ['http:', 'https:'];
        const urlObj = new URL(trimmed);
        if (!allowedProtocols.includes(urlObj.protocol)) {
            return {
                isValid: false,
                error: createValidationError('url', 'Only HTTP and HTTPS URLs are allowed')
            };
        }
        return {
            isValid: true,
            sanitizedValue: trimmed
        };
    }
    catch (error) {
        return {
            isValid: false,
            error: createValidationError('url', 'Invalid URL format')
        };
    }
}
// Generic form validation helper
export function validateForm(data, validators) {
    const errors = {};
    const sanitizedData = {};
    let isValid = true;
    for (const [field, validator] of Object.entries(validators)) {
        const value = data[field];
        const result = validator(value);
        if (!result.isValid && result.error) {
            errors[field] = result.error;
            isValid = false;
        }
        else if (result.sanitizedValue !== undefined) {
            sanitizedData[field] = result.sanitizedValue;
        }
    }
    return { isValid, errors, sanitizedData };
}
// Validate research input
export function validateResearchInput(input, context) {
    const result = {
        isValid: true,
        sanitizedQuery: '',
        complexity: 'moderate',
        keywords: [],
        estimatedDuration: 30,
        errors: []
    };
    try {
        if (!input || typeof input !== 'string') {
            result.isValid = false;
            result.errors.push('Research input is required');
            return result;
        }
        const sanitized = sanitizeSearchQuery(input);
        if (!sanitized) {
            result.isValid = false;
            result.errors.push('Invalid research input after sanitization');
            return result;
        }
        result.sanitizedQuery = sanitized;
        result.keywords = extractTopicKeywords(sanitized);
        result.complexity = calculateResearchComplexity(sanitized, context);
        result.estimatedDuration = estimateResearchDuration(result.complexity, result.keywords.length);
        return result;
    }
    catch (error) {
        result.isValid = false;
        result.errors.push('Failed to validate research input');
        return result;
    }
}
// Sanitize search query
export function sanitizeSearchQuery(query) {
    if (!query || typeof query !== 'string')
        return '';
    // Remove HTML tags
    let sanitized = query.replace(/<[^>]*>/g, '');
    // Remove special characters that could be problematic
    sanitized = sanitized.replace(/[<>{}[\]\\]/g, '');
    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    // Limit length
    if (sanitized.length > 500) {
        sanitized = sanitized.substring(0, 500);
    }
    return sanitized;
}
// Extract topic keywords
export function extractTopicKeywords(topic) {
    if (!topic)
        return [];
    // Simple keyword extraction (could be enhanced with NLP)
    const words = topic
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2)
        .filter(word => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'under', 'over'].includes(word));
    // Remove duplicates and return top 10
    return [...new Set(words)].slice(0, 10);
}
// Calculate research complexity
export function calculateResearchComplexity(topic, context) {
    if (!topic)
        return 'simple';
    let complexityScore = 0;
    // Length-based complexity
    if (topic.length > 100)
        complexityScore += 1;
    if (topic.length > 200)
        complexityScore += 1;
    // Keyword complexity
    const keywords = extractTopicKeywords(topic);
    if (keywords.length > 5)
        complexityScore += 1;
    if (keywords.length > 10)
        complexityScore += 1;
    // Technical term detection (simple heuristic)
    const technicalTerms = /\b(algorithm|analysis|theory|methodology|implementation|architecture|framework|protocol|optimization|integration|mathematical|statistical|computational|engineering|scientific|quantum|molecular|biochemical|neurological|psychological|philosophical|theoretical|experimental|empirical|systematic|comprehensive|multidisciplinary)\b/i;
    if (technicalTerms.test(topic))
        complexityScore += 2;
    // Context-based adjustments
    if (context?.userLevel === 'beginner')
        complexityScore += 1;
    if (context?.userLevel === 'advanced')
        complexityScore -= 1;
    if (context?.topicDepth && context.topicDepth > 2)
        complexityScore += 1;
    // Determine complexity
    if (complexityScore <= 2)
        return 'simple';
    if (complexityScore <= 4)
        return 'moderate';
    return 'complex';
}
// Estimate research duration
export function estimateResearchDuration(complexity, keywordCount) {
    const baseTime = {
        simple: 15, // 15 seconds
        moderate: 30, // 30 seconds
        complex: 60 // 60 seconds
    };
    let duration = baseTime[complexity];
    // Add time based on keyword count
    duration += Math.min(keywordCount * 3, 30); // Max 30 seconds additional
    // Add buffer time
    duration += 10;
    return duration;
}
//# sourceMappingURL=inputValidation.js.map