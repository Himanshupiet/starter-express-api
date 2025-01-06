const {createClient} = require('redis');


let redisClient;

const connectRedis = async () => {
    if (!redisClient) {
         redisClient = createClient({
            username: 'default',
            password: process.env.REDIS_DB_PASSWORD,
            socket: {
                host: process.env.REDIS_DB_CLOUD_HOST,
                port: process.env.REDIS_DB_PORT 
            }
        });
        redisClient.on('error', (err) => {
            console.error('Redis connection error:', err);
        });

        try {
            await redisClient.connect();
            console.log('Connected to Redis');
        } catch (err) {
            console.error('Failed to connect to Redis:', err);
            redisClient = null; // Set to null if connection fails
        }
    }
    return redisClient;
};

const getRedisClient = () => {
    if (!redisClient) {
        console.warn('Redis client is not initialized. Redis operations will be skipped.');
        return null;

    }
    console.warn('Redis client is available. Redis operations will be executed.');
    return redisClient;
};

module.exports = { connectRedis, getRedisClient };
