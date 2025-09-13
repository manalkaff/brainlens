/**
 * Text similarity and distance calculation utilities
 * Used for deduplication and content analysis
 */

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of single-character edits required to transform one string into another
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  const len1 = str1.length;
  const len2 = str2.length;

  // Create matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [];
    matrix[i][0] = i;
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate Jaccard similarity between two strings
 * Returns similarity as a value between 0 and 1
 */
export function jaccardSimilarity(str1: string, str2: string): number {
  // Convert strings to sets of words
  const set1 = new Set(str1.toLowerCase().split(/\s+/).filter(word => word.length > 0));
  const set2 = new Set(str2.toLowerCase().split(/\s+/).filter(word => word.length > 0));

  // Calculate intersection and union
  const intersection = new Set([...set1].filter(word => set2.has(word)));
  const union = new Set([...set1, ...set2]);

  // Avoid division by zero
  if (union.size === 0) return 0;

  return intersection.size / union.size;
}

/**
 * Calculate cosine similarity between two strings using TF-IDF vectors
 * More sophisticated similarity measure for longer texts
 */
export function cosineSimilarity(str1: string, str2: string): number {
  const words1 = tokenize(str1);
  const words2 = tokenize(str2);
  
  // Create vocabulary (all unique words)
  const vocabulary = new Set([...words1, ...words2]);
  
  // Calculate TF-IDF vectors
  const vector1 = calculateTFIDF(words1, vocabulary);
  const vector2 = calculateTFIDF(words2, vocabulary);
  
  // Calculate cosine similarity
  const dotProduct = dotProductVector(vector1, vector2);
  const magnitude1 = vectorMagnitude(vector1);
  const magnitude2 = vectorMagnitude(vector2);
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  
  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Calculate semantic similarity using n-gram analysis
 * Good for catching similar content with different word order
 */
export function nGramSimilarity(str1: string, str2: string, n: number = 2): number {
  const ngrams1 = generateNGrams(str1, n);
  const ngrams2 = generateNGrams(str2, n);
  
  const set1 = new Set(ngrams1);
  const set2 = new Set(ngrams2);
  
  const intersection = new Set([...set1].filter(ngram => set2.has(ngram)));
  const union = new Set([...set1, ...set2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Calculate fuzzy string similarity using multiple algorithms
 * Returns a confidence score between 0 and 1
 */
export function fuzzyStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0;
  
  // Normalize strings
  const norm1 = normalizeString(str1);
  const norm2 = normalizeString(str2);
  
  // Calculate multiple similarity measures
  const jaccardSim = jaccardSimilarity(norm1, norm2);
  const cosineSim = cosineSimilarity(norm1, norm2);
  const bigramSim = nGramSimilarity(norm1, norm2, 2);
  const trigramSim = nGramSimilarity(norm1, norm2, 3);
  
  // Levenshtein similarity (normalized)
  const levDistance = levenshteinDistance(norm1, norm2);
  const maxLen = Math.max(norm1.length, norm2.length);
  const levSim = maxLen === 0 ? 1 : 1 - (levDistance / maxLen);
  
  // Weighted combination
  const weights = {
    jaccard: 0.25,
    cosine: 0.25,
    bigram: 0.2,
    trigram: 0.15,
    levenshtein: 0.15
  };
  
  return (
    jaccardSim * weights.jaccard +
    cosineSim * weights.cosine +
    bigramSim * weights.bigram +
    trigramSim * weights.trigram +
    levSim * weights.levenshtein
  );
}

/**
 * Calculate URL similarity considering domain, path, and parameters
 */
export function urlSimilarity(url1: string, url2: string): number {
  if (url1 === url2) return 1.0;
  
  try {
    const parsed1 = new URL(url1);
    const parsed2 = new URL(url2);
    
    let similarity = 0;
    
    // Domain similarity (most important)
    if (parsed1.hostname === parsed2.hostname) {
      similarity += 0.5;
    } else if (parsed1.hostname.split('.').slice(-2).join('.') === 
               parsed2.hostname.split('.').slice(-2).join('.')) {
      similarity += 0.3; // Same root domain
    }
    
    // Path similarity
    const pathSim = fuzzyStringSimilarity(parsed1.pathname, parsed2.pathname);
    similarity += pathSim * 0.3;
    
    // Query parameter similarity
    const params1 = Array.from(parsed1.searchParams.keys()).sort();
    const params2 = Array.from(parsed2.searchParams.keys()).sort();
    const paramSim = jaccardSimilarity(params1.join(' '), params2.join(' '));
    similarity += paramSim * 0.2;
    
    return Math.min(similarity, 1.0);
    
  } catch {
    // Fallback to string similarity if URLs are malformed
    return fuzzyStringSimilarity(url1, url2) * 0.5;
  }
}

/**
 * Detect near-duplicate content using multiple heuristics
 */
export function detectNearDuplicates(
  content1: string,
  content2: string,
  threshold: number = 0.8
): {
  isDuplicate: boolean;
  confidence: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let totalScore = 0;
  let maxScore = 0;
  
  // Exact match
  if (content1 === content2) {
    return {
      isDuplicate: true,
      confidence: 1.0,
      reasons: ['Exact content match']
    };
  }
  
  // Length similarity
  const len1 = content1.length;
  const len2 = content2.length;
  const lengthRatio = Math.min(len1, len2) / Math.max(len1, len2);
  
  if (lengthRatio > 0.9) {
    totalScore += 0.2;
    reasons.push('Similar length');
  }
  maxScore += 0.2;
  
  // Fuzzy similarity
  const fuzzySim = fuzzyStringSimilarity(content1, content2);
  totalScore += fuzzySim * 0.4;
  maxScore += 0.4;
  
  if (fuzzySim > 0.9) {
    reasons.push('High fuzzy similarity');
  }
  
  // N-gram overlap
  const bigramSim = nGramSimilarity(content1, content2, 2);
  const trigramSim = nGramSimilarity(content1, content2, 3);
  
  totalScore += bigramSim * 0.2;
  totalScore += trigramSim * 0.2;
  maxScore += 0.4;
  
  if (bigramSim > 0.8 || trigramSim > 0.7) {
    reasons.push('High n-gram overlap');
  }
  
  const confidence = maxScore > 0 ? totalScore / maxScore : 0;
  
  return {
    isDuplicate: confidence >= threshold,
    confidence,
    reasons
  };
}

// Helper functions

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0);
}

function normalizeString(str: string): string {
  return str.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateNGrams(text: string, n: number): string[] {
  const words = tokenize(text);
  const ngrams: string[] = [];
  
  for (let i = 0; i <= words.length - n; i++) {
    const ngram = words.slice(i, i + n).join(' ');
    ngrams.push(ngram);
  }
  
  return ngrams;
}

function calculateTFIDF(words: string[], vocabulary: Set<string>): Map<string, number> {
  const tf = new Map<string, number>();
  const vector = new Map<string, number>();
  
  // Calculate term frequency
  words.forEach(word => {
    tf.set(word, (tf.get(word) || 0) + 1);
  });
  
  // Calculate TF-IDF for each term in vocabulary
  vocabulary.forEach(term => {
    const termFreq = tf.get(term) || 0;
    const tfScore = termFreq / words.length;
    
    // Simple IDF approximation (in a real system, this would use corpus statistics)
    const idf = Math.log(2 / (1 + (termFreq > 0 ? 1 : 0)));
    
    vector.set(term, tfScore * idf);
  });
  
  return vector;
}

function dotProductVector(vector1: Map<string, number>, vector2: Map<string, number>): number {
  let dotProduct = 0;
  
  vector1.forEach((value1, term) => {
    const value2 = vector2.get(term) || 0;
    dotProduct += value1 * value2;
  });
  
  return dotProduct;
}

function vectorMagnitude(vector: Map<string, number>): number {
  let magnitude = 0;
  
  vector.forEach(value => {
    magnitude += value * value;
  });
  
  return Math.sqrt(magnitude);
}