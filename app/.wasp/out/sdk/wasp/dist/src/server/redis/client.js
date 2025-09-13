import Redis from 'ioredis';
let redisClient = null;
let redisConnectionState = 'disconnected';
const REDIS_CONFIG = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0'),
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    family: 4,
    keyPrefix: '',
    commandTimeout: 5000,
    connectTimeout: 10000,
};
function createRedisClient() {
    const client = new Redis(REDIS_CONFIG);
    client.on('connect', () => {
        redisConnectionState = 'connecting';
        console.log('Redis client connecting...');
    });
    client.on('ready', () => {
        redisConnectionState = 'connected';
        console.log('Redis client connected and ready');
    });
    client.on('error', (err) => {
        redisConnectionState = 'error';
        console.error('Redis client error:', err.message);
    });
    client.on('close', () => {
        redisConnectionState = 'disconnected';
        console.log('Redis connection closed');
    });
    client.on('reconnecting', () => {
        redisConnectionState = 'reconnecting';
        console.log('Redis client reconnecting...');
    });
    return client;
}
export function getRedisClient() {
    if (!redisClient) {
        redisClient = createRedisClient();
    }
    return redisClient;
}
export function isRedisConnected() {
    return redisConnectionState === 'connected';
}
export function getRedisConnectionState() {
    return redisConnectionState;
}
export async function connectRedis() {
    try {
        const client = getRedisClient();
        await client.connect();
        return true;
    }
    catch (error) {
        console.error('Failed to connect to Redis:', error);
        return false;
    }
}
export async function disconnectRedis() {
    if (redisClient && redisConnectionState !== 'disconnected') {
        try {
            await redisClient.quit();
            redisClient = null;
        }
        catch (error) {
            console.error('Error disconnecting from Redis:', error);
            if (redisClient) {
                redisClient.disconnect();
                redisClient = null;
            }
        }
    }
}
export async function testRedisConnection() {
    try {
        const client = getRedisClient();
        const result = await client.ping();
        return result === 'PONG';
    }
    catch (error) {
        console.error('Redis ping test failed:', error);
        return false;
    }
}
export async function safeRedisOperation(operation, fallback) {
    try {
        if (!isRedisConnected()) {
            const connected = await connectRedis();
            if (!connected) {
                console.warn('Redis operation skipped: connection failed');
                return fallback ?? null;
            }
        }
        const client = getRedisClient();
        return await operation(client);
    }
    catch (error) {
        console.error('Redis operation failed:', error);
        return fallback ?? null;
    }
}
// Circuit breaker pattern for Redis operations
let circuitBreakerOpen = false;
let circuitBreakerOpenTime = 0;
const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds
export async function safeRedisOperationWithCircuitBreaker(operation, fallback) {
    // Check if circuit breaker should be closed
    if (circuitBreakerOpen && Date.now() - circuitBreakerOpenTime > CIRCUIT_BREAKER_TIMEOUT) {
        circuitBreakerOpen = false;
        console.log('Redis circuit breaker closed - attempting reconnection');
    }
    // If circuit breaker is open, return fallback immediately
    if (circuitBreakerOpen) {
        return fallback ?? null;
    }
    try {
        const result = await safeRedisOperation(operation, fallback);
        return result;
    }
    catch (error) {
        // Open circuit breaker on repeated failures
        circuitBreakerOpen = true;
        circuitBreakerOpenTime = Date.now();
        console.error('Redis circuit breaker opened due to error:', error);
        return fallback ?? null;
    }
}
//# sourceMappingURL=client.js.map