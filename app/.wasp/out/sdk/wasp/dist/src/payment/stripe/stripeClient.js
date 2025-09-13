import Stripe from 'stripe';
// Get Stripe API key with fallback for development/testing
function getStripeApiKey() {
    const apiKey = process.env.STRIPE_API_KEY;
    // If no API key provided, use dummy key to prevent initialization errors
    if (!apiKey || apiKey.includes('dummy')) {
        console.warn('⚠️  Using dummy Stripe API key - Payment functionality disabled');
        return 'sk_test_dummy_key_for_development_only_123456789012345678901234567890123456789012345678901234567890';
    }
    return apiKey;
}
export const stripe = new Stripe(getStripeApiKey(), {
    // NOTE:
    // API version below should ideally match the API version in your Stripe dashboard.
    // If that is not the case, you will most likely want to (up/down)grade the `stripe`
    // npm package to the API version that matches your Stripe dashboard's one.
    // For more details and alternative setups check
    // https://docs.stripe.com/api/versioning .
    apiVersion: '2025-04-30.basil',
});
// Helper function to check if Stripe is properly configured
export const isStripeConfigured = () => {
    const apiKey = process.env.STRIPE_API_KEY;
    return !!(apiKey && !apiKey.includes('dummy') && (apiKey.startsWith('sk_live_') || apiKey.startsWith('sk_test_')));
};
// Log Stripe configuration status
if (!isStripeConfigured()) {
    console.log('💳 Stripe payment functionality is disabled (using dummy configuration)');
}
else {
    console.log('💳 Stripe payment functionality is enabled');
}
//# sourceMappingURL=stripeClient.js.map