/**
 * Text similarity and distance calculation utilities
 * Used for deduplication and content analysis
 */
/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of single-character edits required to transform one string into another
 */
export declare function levenshteinDistance(str1: string, str2: string): number;
/**
 * Calculate Jaccard similarity between two strings
 * Returns similarity as a value between 0 and 1
 */
export declare function jaccardSimilarity(str1: string, str2: string): number;
/**
 * Calculate cosine similarity between two strings using TF-IDF vectors
 * More sophisticated similarity measure for longer texts
 */
export declare function cosineSimilarity(str1: string, str2: string): number;
/**
 * Calculate semantic similarity using n-gram analysis
 * Good for catching similar content with different word order
 */
export declare function nGramSimilarity(str1: string, str2: string, n?: number): number;
/**
 * Calculate fuzzy string similarity using multiple algorithms
 * Returns a confidence score between 0 and 1
 */
export declare function fuzzyStringSimilarity(str1: string, str2: string): number;
/**
 * Calculate URL similarity considering domain, path, and parameters
 */
export declare function urlSimilarity(url1: string, url2: string): number;
/**
 * Detect near-duplicate content using multiple heuristics
 */
export declare function detectNearDuplicates(content1: string, content2: string, threshold?: number): {
    isDuplicate: boolean;
    confidence: number;
    reasons: string[];
};
//# sourceMappingURL=similarity.d.ts.map