import React, { useState } from 'react';
import { InputCard } from '../InputCard';
// Manual test component to verify enhanced validation and error handling
export const InputCardManualTest = () => {
    const [testScenario, setTestScenario] = useState('success');
    const handleSubmit = async (topic) => {
        console.log('Submitting topic:', topic);
        // Simulate different scenarios based on test selection
        switch (testScenario) {
            case 'network-error':
                const networkError = new Error('Network connection failed');
                networkError.name = 'NetworkError';
                throw networkError;
            case 'server-error':
                const serverError = new Error('Internal server error');
                serverError.status = 500;
                throw serverError;
            case 'validation-error':
                const validationError = new Error('Invalid topic format');
                validationError.status = 400;
                throw validationError;
            case 'timeout':
                await new Promise((_, reject) => {
                    setTimeout(() => {
                        const timeoutError = new Error('Request timeout');
                        timeoutError.name = 'TimeoutError';
                        reject(timeoutError);
                    }, 2000);
                });
                break;
            case 'slow-success':
                await new Promise(resolve => setTimeout(resolve, 3000));
                console.log('Topic created successfully after delay!');
                break;
            case 'success':
            default:
                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log('Topic created successfully!');
                break;
        }
    };
    return (<div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">InputCard Enhanced Validation Test</h1>
      
      {/* Test Scenario Selector */}
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Test Scenario:</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'success', label: 'Success' },
            { value: 'slow-success', label: 'Slow Success (3s)' },
            { value: 'network-error', label: 'Network Error' },
            { value: 'server-error', label: 'Server Error (500)' },
            { value: 'validation-error', label: 'Validation Error (400)' },
            { value: 'timeout', label: 'Timeout Error' }
        ].map(scenario => (<button key={scenario.value} onClick={() => setTestScenario(scenario.value)} className={`px-3 py-2 rounded text-sm font-medium transition-colors ${testScenario === scenario.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border'}`}>
              {scenario.label}
            </button>))}
        </div>
      </div>

      {/* Features to Test */}
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Features to Test:</h2>
        <ul className="space-y-2 text-sm">
          <li>✅ <strong>Input Validation:</strong> Try empty input, very short input (&lt;3 chars), very long input (&gt;500 chars)</li>
          <li>✅ <strong>Character Count:</strong> Watch the character counter change as you type</li>
          <li>✅ <strong>Validation Warnings:</strong> Type short inputs to see helpful suggestions</li>
          <li>✅ <strong>Error Handling:</strong> Select different error scenarios above and submit</li>
          <li>✅ <strong>Retry Functionality:</strong> For retryable errors, click "Try again" button</li>
          <li>✅ <strong>Loading States:</strong> Watch loading spinner and status messages during submission</li>
          <li>✅ <strong>Success State:</strong> See success message and input clearing after successful submission</li>
          <li>✅ <strong>Keyboard Shortcuts:</strong> Use Cmd+Enter (Mac) or Ctrl+Enter (PC) to submit</li>
          <li>✅ <strong>Accessibility:</strong> Tab through elements, use screen reader if available</li>
        </ul>
      </div>

      {/* InputCard Component */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-2xl">
        <InputCard onSubmit={handleSubmit} showCharacterCount={true} showValidationHints={true} maxRetries={2}/>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Testing Instructions:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Select a test scenario above</li>
          <li>Type some text in the input field</li>
          <li>Try different input lengths to see validation feedback</li>
          <li>Submit using the button or Cmd/Ctrl+Enter</li>
          <li>Observe the loading states and error handling</li>
          <li>For retryable errors, test the retry functionality</li>
          <li>Check browser console for submission logs</li>
        </ol>
      </div>
    </div>);
};
export default InputCardManualTest;
//# sourceMappingURL=InputCardManualTest.jsx.map