/**
 * Client-side input validation utilities for the learning platform
 */

import { 
  LearningPlatformError, 
  createValidationError, 
  createLearningError,
  ErrorType,
  ERROR_CODES
} from '../errors/errorTypes';

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  error?: LearningPlatformError;
  sanitizedValue?: any;
}

// Topic title validation
export function validateTopicTitle(title: string): ValidationResult {
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
  } catch (error) {
    return {
      isValid: false,
      error: createValidationError('title', 'Invalid topic title format')
    };
  }
}

// Chat message validation
export function validateChatMessage(message: string): ValidationResult {
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
  } catch (error) {
    return {
      isValid: false,
      error: createValidationError('message', 'Invalid message format')
    };
  }
}

// Quiz answer validation
export function validateQuizAnswer(answer: string, questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK' | 'CODE_CHALLENGE'): ValidationResult {
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
  } catch (error) {
    return {
      isValid: false,
      error: createValidationError('answer', 'Invalid answer format')
    };
  }
}

// Search query validation
export function validateSearchQuery(query: string): ValidationResult {
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
  } catch (error) {
    return {
      isValid: false,
      error: createValidationError('query', 'Invalid search query format')
    };
  }
}

// Progress update validation
export function validateProgressUpdate(data: {
  timeSpent?: number;
  completed?: boolean;
  bookmarks?: string[];
  preferences?: Record<string, any>;
}): ValidationResult {
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
  } catch (error) {
    return {
      isValid: false,
      error: createValidationError('progressUpdate', 'Invalid progress update format')
    };
  }
}

// File upload validation (for future use)
export function validateFileUpload(file: File, allowedTypes: string[], maxSize: number): ValidationResult {
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
  } catch (error) {
    return {
      isValid: false,
      error: createValidationError('file', 'Invalid file format')
    };
  }
}

// URL validation
export function validateUrl(url: string): ValidationResult {
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
    } catch {
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
  } catch (error) {
    return {
      isValid: false,
      error: createValidationError('url', 'Invalid URL format')
    };
  }
}

// Generic form validation helper
export function validateForm<T extends Record<string, any>>(
  data: T,
  validators: Record<keyof T, (value: any) => ValidationResult>
): { isValid: boolean; errors: Record<keyof T, LearningPlatformError>; sanitizedData: Partial<T> } {
  const errors: Record<keyof T, LearningPlatformError> = {} as any;
  const sanitizedData: Partial<T> = {};
  let isValid = true;

  for (const [field, validator] of Object.entries(validators)) {
    const value = data[field as keyof T];
    const result = validator(value);
    
    if (!result.isValid && result.error) {
      errors[field as keyof T] = result.error;
      isValid = false;
    } else if (result.sanitizedValue !== undefined) {
      sanitizedData[field as keyof T] = result.sanitizedValue;
    }
  }

  return { isValid, errors, sanitizedData };
}