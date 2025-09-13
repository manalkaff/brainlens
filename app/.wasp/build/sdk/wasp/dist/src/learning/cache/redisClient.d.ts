declare class RedisCache {
    private client;
    private isConnected;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isReady(): boolean;
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlSeconds?: number): Promise<boolean>;
    del(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    keys(pattern: string): Promise<string[]>;
    flushPattern(pattern: string): Promise<number>;
    increment(key: string, ttlSeconds?: number): Promise<number>;
    setHash(key: string, field: string, value: any, ttlSeconds?: number): Promise<boolean>;
    getHash<T>(key: string, field: string): Promise<T | null>;
    getAllHash<T>(key: string): Promise<Record<string, T> | null>;
}
export declare const redisCache: RedisCache;
export {};
//# sourceMappingURL=redisClient.d.ts.map