import Redis from 'ioredis';
export declare function getRedisClient(): Redis;
export declare function isRedisConnected(): boolean;
export declare function getRedisConnectionState(): string;
export declare function connectRedis(): Promise<boolean>;
export declare function disconnectRedis(): Promise<void>;
export declare function testRedisConnection(): Promise<boolean>;
export declare function safeRedisOperation<T>(operation: (client: Redis) => Promise<T>, fallback?: T): Promise<T | null>;
export declare function safeRedisOperationWithCircuitBreaker<T>(operation: (client: Redis) => Promise<T>, fallback?: T): Promise<T | null>;
//# sourceMappingURL=client.d.ts.map