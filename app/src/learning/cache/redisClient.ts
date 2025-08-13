import { createClient, RedisClientType } from 'redis';

class RedisCache {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 5000,
        },
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      this.isConnected = true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.client = null;
      this.isConnected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.client = null;
      this.isConnected = false;
    }
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isReady()) {
      return null;
    }

    try {
      const value = await this.client!.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client!.setEx(key, ttlSeconds, serialized);
      } else {
        await this.client!.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      await this.client!.del(key);
      return true;
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.isReady()) {
      return [];
    }

    try {
      return await this.client!.keys(pattern);
    } catch (error) {
      console.error(`Redis KEYS error for pattern ${pattern}:`, error);
      return [];
    }
  }

  async flushPattern(pattern: string): Promise<number> {
    if (!this.isReady()) {
      return 0;
    }

    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      
      await this.client!.del(keys);
      return keys.length;
    } catch (error) {
      console.error(`Redis FLUSH PATTERN error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    if (!this.isReady()) {
      return 0;
    }

    try {
      const result = await this.client!.incr(key);
      if (ttlSeconds && result === 1) {
        // Only set TTL if this is the first increment
        await this.client!.expire(key, ttlSeconds);
      }
      return result;
    } catch (error) {
      console.error(`Redis INCR error for key ${key}:`, error);
      return 0;
    }
  }

  async setHash(key: string, field: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      await this.client!.hSet(key, field, JSON.stringify(value));
      if (ttlSeconds) {
        await this.client!.expire(key, ttlSeconds);
      }
      return true;
    } catch (error) {
      console.error(`Redis HSET error for key ${key}, field ${field}:`, error);
      return false;
    }
  }

  async getHash<T>(key: string, field: string): Promise<T | null> {
    if (!this.isReady()) {
      return null;
    }

    try {
      const value = await this.client!.hGet(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Redis HGET error for key ${key}, field ${field}:`, error);
      return null;
    }
  }

  async getAllHash<T>(key: string): Promise<Record<string, T> | null> {
    if (!this.isReady()) {
      return null;
    }

    try {
      const hash = await this.client!.hGetAll(key);
      const result: Record<string, T> = {};
      
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }
      
      return result;
    } catch (error) {
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