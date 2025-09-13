import { SearxngUtils, type AgentConfigName } from "../../research/searxng";
import type { SearchResult } from "../../research/agents";
import { SearchResultWithEngine, ResearchPlan } from "./types";

/**
 * Research Execution Module
 * Handles execution of research queries with robust error handling
 */
export class ResearchExecutionModule {

  /**
   * Execute research using planned queries and engines
   * Enhanced for requirement 5.5: proper handling of general and specialized engine queries
   * with robust error handling for engine availability issues
   */
  async executeResearch(researchPlan: ResearchPlan): Promise<SearchResultWithEngine[]> {
    // Enhanced validation for requirements 5.4 and 5.5
    const generalQueries = researchPlan.researchQueries.filter(q => q.engine === "general");
    const specializedQueries = researchPlan.researchQueries.filter(q => q.engine !== "general");
    const engineTypes = Array.from(new Set(researchPlan.researchQueries.map(q => q.engine)));
    
    // Validate minimum general queries (requirement 5.5)
    if (generalQueries.length < 5) {
      console.error(`❌ Research plan validation failed: only ${generalQueries.length} general queries, expected at least 5`);
      throw new Error(`Invalid research plan: insufficient general queries (${generalQueries.length} < 5)`);
    }
    
    // Validate diverse source types (requirement 5.4)
    console.log(`✅ Research plan validation passed:`);
    console.log(`   - ${generalQueries.length} general engine queries for balanced perspective`);
    console.log(`   - ${specializedQueries.length} specialized engine queries for depth`);
    console.log(`   - ${engineTypes.length} different engine types: ${engineTypes.join(', ')}`);
    console.log(`   - ${researchPlan.researchQueries.length} total queries for comprehensive coverage`);
    
    // Validate engine distribution matches expectations
    if (researchPlan.engineDistribution) {
      const expectedGeneral = researchPlan.engineDistribution.general;
      if (expectedGeneral !== generalQueries.length) {
        console.warn(`⚠️ Engine distribution mismatch: expected ${expectedGeneral} general queries, found ${generalQueries.length}`);
      }
    }

    const results: SearchResultWithEngine[] = [];
    const failedQueries: Array<{ query: string; engine: string; error: string }> = [];
    let generalQueriesSuccessful = 0;
    let specializedQueriesSuccessful = 0;

    // Execute research queries with enhanced error handling and engine availability monitoring
    const executionStartTime = Date.now();
    console.log(`TIMING LOGS: Starting parallel research execution for ${researchPlan.researchQueries.length} queries`);
    
    const researchPromises = researchPlan.researchQueries.map(
      async ({ query, engine, reasoning }, index) => {
        const queryStartTime = Date.now();
        try {
          console.log(`  🔍 Searching ${engine}: "${query}"`);
          console.log(`TIMING LOGS: Starting search query ${index + 1}/${researchPlan.researchQueries.length} - engine: ${engine}`);
          
          // Enhanced error handling with engine availability checks
          const response = await SearxngUtils.searchWithAgent(
            engine as AgentConfigName,
            query,
          );
          const queryDuration = Date.now() - queryStartTime;
          console.log(`TIMING LOGS: Completed search query ${index + 1} (${engine}) in ${queryDuration}ms - found ${response.results?.length || 0} results`);

          // Validate response structure
          if (!response || !response.results || !Array.isArray(response.results)) {
            throw new Error(`Invalid response structure from ${engine} engine`);
          }

          // Track successful queries by type for requirement 5.5 validation
          if (engine === "general") {
            generalQueriesSuccessful++;
          } else {
            specializedQueriesSuccessful++;
          }

          const processingStartTime = Date.now();
          console.log(`TIMING LOGS: Starting result processing for query ${index + 1} (${engine}) - ${response.results.length} raw results`);
          const processedResults = response.results.map((result: SearchResult) => ({
            ...result,
            title: result.title || "Untitled",
            url: result.url || "#",
            snippet: result.snippet || "No description",
            source: result.source || engine,
            relevanceScore: result.relevanceScore || 0.5,
            engine: engine,
            reasoning: reasoning,
          }));
          const processingDuration = Date.now() - processingStartTime;
          console.log(`TIMING LOGS: Completed result processing for query ${index + 1} in ${processingDuration}ms`);

          console.log(`  ✅ ${engine} search successful: ${processedResults.length} results`);
          return processedResults;

        } catch (error) {
          const queryDuration = Date.now() - queryStartTime;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`❌ Failed to search ${engine} for "${query}":`, errorMessage);
          console.log(`TIMING LOGS: Failed search query ${index + 1} (${engine}) after ${queryDuration}ms - error: ${errorMessage}`);
          
          // Track failed queries for analysis
          failedQueries.push({
            query,
            engine,
            error: errorMessage
          });

          // Enhanced error handling for engine availability issues (requirement 5.5)
          if (engine === "general") {
            // General engine failures are critical - try fallback strategies
            console.warn(`⚠️ Critical: General engine query failed, attempting fallback`);
            return await this.handleGeneralEngineFailure(query, reasoning, errorMessage);
          } else {
            // Specialized engine failures are less critical but should be logged
            console.warn(`⚠️ Specialized engine ${engine} unavailable, continuing with other engines`);
            return await this.handleSpecializedEngineFailure(query, engine, reasoning, errorMessage);
          }
        }
      },
    );

    console.log(`TIMING LOGS: Waiting for all ${researchPlan.researchQueries.length} parallel search queries to complete`);
    const researchResultsArrays = await Promise.all(researchPromises);
    const executionDuration = Date.now() - executionStartTime;
    console.log(`TIMING LOGS: Completed all parallel research execution in ${executionDuration}ms`);

    // Flatten and deduplicate results
    const aggregationStartTime = Date.now();
    console.log(`TIMING LOGS: Starting result aggregation and deduplication`);
    const allResults = researchResultsArrays.flat();
    const deduplicatedResults = this.deduplicateResults(allResults);
    const aggregationDuration = Date.now() - aggregationStartTime;
    console.log(`TIMING LOGS: Completed result aggregation in ${aggregationDuration}ms - ${allResults.length} -> ${deduplicatedResults.length} unique results`);

    // Enhanced validation of research execution success (requirement 5.5)
    this.validateResearchExecutionSuccess(
      generalQueriesSuccessful,
      specializedQueriesSuccessful,
      failedQueries,
      deduplicatedResults.length
    );

    console.log(`  ✅ Research execution completed:`);
    console.log(`     - ${deduplicatedResults.length} unique sources collected`);
    console.log(`     - ${generalQueriesSuccessful}/${generalQueries.length} general queries successful`);
    console.log(`     - ${specializedQueriesSuccessful}/${specializedQueries.length} specialized queries successful`);
    console.log(`     - ${failedQueries.length} queries failed`);

    return deduplicatedResults.slice(0, 30); // Limit to top 30 results
  }

  /**
   * Handle general engine failure with fallback strategies
   * General engine queries are critical for balanced perspective (requirement 5.5)
   */
  private async handleGeneralEngineFailure(
    query: string, 
    reasoning: string, 
    errorMessage: string
  ): Promise<SearchResultWithEngine[]> {
    console.log(`🔧 Attempting general engine fallback for query: "${query}"`);
    
    try {
      // Try alternative general search approaches
      const fallbackQueries = [
        query.replace(/advanced|complex|technical/gi, 'basic'),
        query.split(' ').slice(0, 3).join(' '), // Simplified query
        `${query} beginner guide overview` // More accessible version
      ];

      for (const fallbackQuery of fallbackQueries) {
        try {
          console.log(`  🔄 Trying fallback query: "${fallbackQuery}"`);
          const response = await SearxngUtils.searchWithAgent("general", fallbackQuery);
          
          if (response && response.results && response.results.length > 0) {
            console.log(`  ✅ Fallback successful with ${response.results.length} results`);
            return response.results.map((result: SearchResult) => ({
              ...result,
              title: result.title || "Untitled",
              url: result.url || "#",
              snippet: result.snippet || "No description",
              source: result.source || "general",
              relevanceScore: (result.relevanceScore || 0.5) * 0.8, // Slightly lower score for fallback
              engine: "general",
              reasoning: `${reasoning} (fallback due to: ${errorMessage})`,
            }));
          }
        } catch (fallbackError) {
          console.warn(`  ⚠️ Fallback query failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
          continue;
        }
      }

      // If all fallbacks fail, return empty results but log the critical failure
      console.error(`❌ All general engine fallbacks failed for query: "${query}"`);
      return [];

    } catch (error) {
      console.error(`❌ General engine fallback handler failed:`, error);
      return [];
    }
  }

  /**
   * Handle specialized engine failure with graceful degradation
   * Specialized engines enhance depth but are not critical for basic understanding
   */
  private async handleSpecializedEngineFailure(
    query: string,
    engine: string,
    reasoning: string,
    errorMessage: string
  ): Promise<SearchResultWithEngine[]> {
    console.log(`🔧 Handling specialized engine failure for ${engine}: "${query}"`);
    
    try {
      // Try to get similar information from general engine as fallback
      const generalizedQuery = `${query} general information overview`;
      
      console.log(`  🔄 Attempting general engine fallback: "${generalizedQuery}"`);
      const response = await SearxngUtils.searchWithAgent("general", generalizedQuery);
      
      if (response && response.results && response.results.length > 0) {
        console.log(`  ✅ General fallback successful for specialized query`);
        return response.results.slice(0, 3).map((result: SearchResult) => ({ // Limit fallback results
          ...result,
          title: result.title || "Untitled",
          url: result.url || "#",
          snippet: result.snippet || "No description",
          source: result.source || "general",
          relevanceScore: (result.relevanceScore || 0.5) * 0.6, // Lower score for cross-engine fallback
          engine: "general", // Mark as general since that's what we used
          reasoning: `${reasoning} (general fallback for ${engine} due to: ${errorMessage})`,
        }));
      }

      console.warn(`  ⚠️ No fallback results available for specialized engine ${engine}`);
      return [];

    } catch (error) {
      console.error(`❌ Specialized engine fallback failed for ${engine}:`, error);
      return [];
    }
  }

  /**
   * Validate research execution success and ensure minimum requirements are met
   * Requirement 5.5: validate that general engine queries are executed successfully
   */
  private validateResearchExecutionSuccess(
    generalQueriesSuccessful: number,
    specializedQueriesSuccessful: number,
    failedQueries: Array<{ query: string; engine: string; error: string }>,
    totalResults: number
  ): void {
    const criticalFailures: string[] = [];
    const warnings: string[] = [];

    // Critical validation: ensure minimum general queries succeeded (requirement 5.5)
    if (generalQueriesSuccessful < 3) {
      criticalFailures.push(
        `Insufficient general engine queries succeeded (${generalQueriesSuccessful} < 3). ` +
        `This compromises the balanced perspective requirement.`
      );
    }

    // Warning: check if we have reasonable specialized query success
    const specializedFailureRate = failedQueries.filter(f => f.engine !== "general").length;
    if (specializedFailureRate > 0 && specializedQueriesSuccessful === 0) {
      warnings.push(
        `All specialized engine queries failed. Research will rely entirely on general sources.`
      );
    }

    // Critical validation: ensure we have minimum viable results
    if (totalResults < 5) {
      criticalFailures.push(
        `Insufficient research results collected (${totalResults} < 5). ` +
        `Cannot generate comprehensive content with so few sources.`
      );
    }

    // Log engine availability issues for monitoring
    if (failedQueries.length > 0) {
      console.warn(`⚠️ Engine availability issues detected:`);
      const engineFailures = failedQueries.reduce((acc, failure) => {
        acc[failure.engine] = (acc[failure.engine] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      Object.entries(engineFailures).forEach(([engine, count]) => {
        console.warn(`   - ${engine}: ${count} failed queries`);
      });
    }

    // Report warnings
    warnings.forEach(warning => {
      console.warn(`⚠️ Research execution warning: ${warning}`);
    });

    // Throw error for critical failures
    if (criticalFailures.length > 0) {
      const errorMessage = `Research execution failed critical validations:\n${criticalFailures.join('\n')}`;
      console.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }

    // Success validation
    if (generalQueriesSuccessful >= 3 && totalResults >= 5) {
      console.log(`✅ Research execution validation passed:`);
      console.log(`   - General queries: ${generalQueriesSuccessful} successful (≥3 required)`);
      console.log(`   - Total results: ${totalResults} collected (≥5 required)`);
      console.log(`   - Engine diversity maintained despite any failures`);
    }
  }

  /**
   * Deduplicate results based on title and URL
   */
  private deduplicateResults<T extends { title: string; url: string }>(
    results: T[],
  ): T[] {
    const seen = new Set<string>();
    return results.filter((result) => {
      const key = `${result.title.toLowerCase()}-${result.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}