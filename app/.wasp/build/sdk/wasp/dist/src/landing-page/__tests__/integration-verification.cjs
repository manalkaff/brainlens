"use strict";
/**
 * Integration Verification Script
 *
 * This script verifies that all the necessary components and utilities
 * for the landing page topic creation integration are properly implemented.
 */
const fs = require('fs');
const path = require('path');
const requiredFiles = [
    'src/landing-page/LandingPage.tsx',
    'src/landing-page/components/HeroSection.tsx',
    'src/landing-page/components/InputCard.tsx',
    'src/landing-page/utils/pendingTopicHandler.ts',
    'src/landing-page/hooks/usePendingTopicHandler.ts',
    'src/client/App.tsx',
    'main.wasp'
];
const requiredImports = [
    { file: 'src/landing-page/LandingPage.tsx', imports: ['createTopic', 'startTopicResearch', 'storePendingTopic'] },
    { file: 'src/client/App.tsx', imports: ['usePendingTopicHandler'] },
    { file: 'main.wasp', operations: ['createTopic', 'startTopicResearch'] }
];
const requiredFunctions = [
    { file: 'src/landing-page/utils/pendingTopicHandler.ts', functions: ['storePendingTopic', 'getPendingTopic', 'createPendingTopic', 'handlePendingTopicRedirect'] },
    { file: 'src/landing-page/hooks/usePendingTopicHandler.ts', functions: ['usePendingTopicHandler'] }
];
console.log('🔍 Verifying Landing Page Integration...\n');
// Check if all required files exist
console.log('📁 Checking required files:');
let allFilesExist = true;
for (const file of requiredFiles) {
    const exists = fs.existsSync(file);
    console.log(`  ${exists ? '✅' : '❌'} ${file}`);
    if (!exists)
        allFilesExist = false;
}
if (!allFilesExist) {
    console.log('\n❌ Some required files are missing!');
    process.exit(1);
}
// Check imports and content
console.log('\n📦 Checking imports and content:');
let allImportsPresent = true;
for (const { file, imports, operations } of requiredImports) {
    if (!fs.existsSync(file))
        continue;
    const content = fs.readFileSync(file, 'utf8');
    if (imports) {
        for (const importName of imports) {
            const hasImport = content.includes(importName);
            console.log(`  ${hasImport ? '✅' : '❌'} ${file} contains "${importName}"`);
            if (!hasImport)
                allImportsPresent = false;
        }
    }
    if (operations) {
        for (const operation of operations) {
            const hasOperation = content.includes(`action ${operation}`) || content.includes(`query ${operation}`);
            console.log(`  ${hasOperation ? '✅' : '❌'} ${file} defines operation "${operation}"`);
            if (!hasOperation)
                allImportsPresent = false;
        }
    }
}
// Check function definitions
console.log('\n🔧 Checking function definitions:');
let allFunctionsPresent = true;
for (const { file, functions } of requiredFunctions) {
    if (!fs.existsSync(file))
        continue;
    const content = fs.readFileSync(file, 'utf8');
    for (const functionName of functions) {
        const hasFunction = content.includes(`function ${functionName}`) ||
            content.includes(`const ${functionName}`) ||
            content.includes(`export function ${functionName}`) ||
            content.includes(`export const ${functionName}`);
        console.log(`  ${hasFunction ? '✅' : '❌'} ${file} defines "${functionName}"`);
        if (!hasFunction)
            allFunctionsPresent = false;
    }
}
// Check specific integration points
console.log('\n🔗 Checking integration points:');
const integrationChecks = [
    {
        file: 'src/landing-page/LandingPage.tsx',
        check: 'handleTopicSubmit function',
        pattern: /handleTopicSubmit.*async/
    },
    {
        file: 'src/landing-page/components/HeroSection.tsx',
        check: 'onTopicSubmit prop passing',
        pattern: /onSubmit={onTopicSubmit}/
    },
    {
        file: 'src/client/App.tsx',
        check: 'usePendingTopicHandler hook usage',
        pattern: /usePendingTopicHandler\(\)/
    }
];
let allIntegrationsPresent = true;
for (const { file, check, pattern } of integrationChecks) {
    if (!fs.existsSync(file))
        continue;
    const content = fs.readFileSync(file, 'utf8');
    const hasIntegration = pattern.test(content);
    console.log(`  ${hasIntegration ? '✅' : '❌'} ${check} in ${file}`);
    if (!hasIntegration)
        allIntegrationsPresent = false;
}
// Final result
console.log('\n📊 Verification Summary:');
console.log(`  Files: ${allFilesExist ? '✅' : '❌'}`);
console.log(`  Imports: ${allImportsPresent ? '✅' : '❌'}`);
console.log(`  Functions: ${allFunctionsPresent ? '✅' : '❌'}`);
console.log(`  Integrations: ${allIntegrationsPresent ? '✅' : '❌'}`);
const allChecksPass = allFilesExist && allImportsPresent && allFunctionsPresent && allIntegrationsPresent;
console.log(`\n${allChecksPass ? '🎉' : '❌'} Integration ${allChecksPass ? 'VERIFIED' : 'FAILED'}`);
if (allChecksPass) {
    console.log('\n✨ All integration components are properly implemented!');
    console.log('📋 Next steps:');
    console.log('  1. Test manually using the scenarios in manual-integration-test.md');
    console.log('  2. Start the development server: wasp start');
    console.log('  3. Navigate to http://localhost:3000 and test topic creation');
}
else {
    console.log('\n🔧 Please fix the missing components before testing.');
}
process.exit(allChecksPass ? 0 : 1);
//# sourceMappingURL=integration-verification.cjs.map