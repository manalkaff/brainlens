#!/usr/bin/env node

// Simple test to verify the enhanced AI Learning Agent structure
// Tests the new community-focused research planning and content generation

import { ResearchPlanSchema } from './app/src/learning/api/aiLearningAgent/types.js';

console.log('🔍 Testing Enhanced AI Learning Agent...');

// Test 1: Verify ResearchPlanSchema accepts the new minimum requirements
try {
  const testPlan = {
    researchQueries: [
      // 5 general queries
      { query: "test general 1", engine: "general", reasoning: "test" },
      { query: "test general 2", engine: "general", reasoning: "test" },
      { query: "test general 3", engine: "general", reasoning: "test" },
      { query: "test general 4", engine: "general", reasoning: "test" },
      { query: "test general 5", engine: "general", reasoning: "test" },
      
      // 5 community queries
      { query: "test community 1", engine: "community", reasoning: "test" },
      { query: "test community 2", engine: "community", reasoning: "test" },
      { query: "test community 3", engine: "community", reasoning: "test" },
      { query: "test community 4", engine: "community", reasoning: "test" },
      { query: "test community 5", engine: "community", reasoning: "test" },
      
      // 5 video queries  
      { query: "test video 1", engine: "video", reasoning: "test" },
      { query: "test video 2", engine: "video", reasoning: "test" },
      { query: "test video 3", engine: "video", reasoning: "test" },
      { query: "test video 4", engine: "video", reasoning: "test" },
      { query: "test video 5", engine: "video", reasoning: "test" }
    ],
    researchStrategy: "Test strategy",
    expectedOutcomes: ["Test outcome 1", "Test outcome 2"],
    engineDistribution: {
      general: 5,
      academic: 0,
      video: 5,
      community: 5,
      computational: 0
    }
  };

  const result = ResearchPlanSchema.parse(testPlan);
  console.log('✅ Test 1 PASSED: ResearchPlanSchema accepts new minimum requirements');
  
} catch (error) {
  console.log('❌ Test 1 FAILED:', error.message);
}

// Test 2: Verify ResearchPlanSchema rejects plans with insufficient queries
try {
  const invalidPlan = {
    researchQueries: [
      { query: "test general 1", engine: "general", reasoning: "test" },
      { query: "test community 1", engine: "community", reasoning: "test" }
    ],
    researchStrategy: "Test strategy",
    expectedOutcomes: ["Test outcome"],
    engineDistribution: {
      general: 1,
      academic: 0,
      video: 0,
      community: 1,
      computational: 0
    }
  };

  const result = ResearchPlanSchema.parse(invalidPlan);
  console.log('❌ Test 2 FAILED: Should have rejected plan with insufficient queries');
  
} catch (error) {
  console.log('✅ Test 2 PASSED: ResearchPlanSchema properly rejects insufficient queries');
}

console.log('🎉 Enhanced AI Learning Agent validation complete!');