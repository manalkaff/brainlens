import Redis from 'ioredis';
class RedisCache {
    client = null;
    isConnected = false;
    async connect() {
        if (this.isConnected && this.client) {
            return;
        }
        try {
            this.client = new Redis({
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
                password: process.env.REDIS_PASSWORD || undefined,
                connectTimeout: 10000,
                lazyConnect: true,
            });
            this.client.on('error', (err) => {
                console.log(process.env.REDIS_HOST || 'localhost');
                console.log(process.env.REDIS_PORT || 6379);
                console.error('Redis Client Error:', err);
                this.isConnected = false;
            });
            this.client.on('connect', () => {
                console.log('Redis Client Connected');
                this.isConnected = true;
            });
            this.client.on('close', () => {
                console.log('Redis Client Disconnected');
                this.isConnected = false;
            });
            await this.client.connect();
            this.isConnected = true;
        }
        catch (error) {
            console.error('Failed to connect to Redis:', error);
            this.client = null;
            this.isConnected = false;
        }
    }
    async disconnect() {
        if (this.client && this.isConnected) {
            this.client.disconnect();
            this.client = null;
            this.isConnected = false;
        }
    }
    isReady() {
        return this.isConnected && this.client !== null;
    }
    async get(key) {
        if (!this.isReady()) {
            return null;
        }
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            console.error(`Redis GET error for key ${key}:`, error);
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        if (!this.isReady()) {
            return false;
        }
        try {
            const serialized = JSON.stringify(value);
            if (ttlSeconds) {
                await this.client.setex(key, ttlSeconds, serialized);
            }
            else {
                await this.client.set(key, serialized);
            }
            return true;
        }
        catch (error) {
            console.error(`Redis SET error for key ${key}:`, error);
            return false;
        }
    }
    async del(key) {
        if (!this.isReady()) {
            return false;
        }
        try {
            await this.client.del(key);
            return true;
        }
        catch (error) {
            console.error(`Redis DEL error for key ${key}:`, error);
            return false;
        }
    }
    async exists(key) {
        if (!this.isReady()) {
            return false;
        }
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            console.error(`Redis EXISTS error for key ${key}:`, error);
            return false;
        }
    }
    async keys(pattern) {
        if (!this.isReady()) {
            return [];
        }
        try {
            return await this.client.keys(pattern);
        }
        catch (error) {
            console.error(`Redis KEYS error for pattern ${pattern}:`, error);
            return [];
        }
    }
    async flushPattern(pattern) {
        if (!this.isReady()) {
            return 0;
        }
        try {
            const keys = await this.keys(pattern);
            if (keys.length === 0) {
                return 0;
            }
            await this.client.del(...keys);
            return keys.length;
        }
        catch (error) {
            console.error(`Redis FLUSH PATTERN error for pattern ${pattern}:`, error);
            return 0;
        }
    }
    async increment(key, ttlSeconds) {
        if (!this.isReady()) {
            return 0;
        }
        try {
            const result = await this.client.incr(key);
            if (ttlSeconds && result === 1) {
                // Only set TTL if this is the first increment
                await this.client.expire(key, ttlSeconds);
            }
            return result;
        }
        catch (error) {
            console.error(`Redis INCR error for key ${key}:`, error);
            return 0;
        }
    }
    async setHash(key, field, value, ttlSeconds) {
        if (!this.isReady()) {
            return false;
        }
        try {
            await this.client.hset(key, field, JSON.stringify(value));
            if (ttlSeconds) {
                await this.client.expire(key, ttlSeconds);
            }
            return true;
        }
        catch (error) {
            console.error(`Redis HSET error for key ${key}, field ${field}:`, error);
            return false;
        }
    }
    async getHash(key, field) {
        if (!this.isReady()) {
            return null;
        }
        try {
            const value = await this.client.hget(key, field);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            console.error(`Redis HGET error for key ${key}, field ${field}:`, error);
            return null;
        }
    }
    async getAllHash(key) {
        if (!this.isReady()) {
            return null;
        }
        try {
            const hash = await this.client.hgetall(key);
            const result = {};
            for (const [field, value] of Object.entries(hash)) {
                result[field] = JSON.parse(value);
            }
            return result;
        }
        catch (error) {
            console.error(`Redis HGETALL error for key ${key}:`, error);
            return null;
        }
    }
}
// Singleton instance
export const redisCache = new RedisCache();
// Initialize connection on module load
redisCache.connect().catch(console.error);
// Graceful shutdown
process.on('SIGINT', async () => {
    await redisCache.disconnect();
});
process.on('SIGTERM', async () => {
    await redisCache.disconnect();
});
//# sourceMappingURL=redisClient.js.map