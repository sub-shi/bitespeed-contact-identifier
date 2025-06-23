import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('REDIS_URL is not defined in environment variables');
}

const redisClient = createClient({
  url: redisUrl,
  socket: {
    // These options are necessary only if you hit TLS certificate errors
    tls: true,
    rejectUnauthorized: false,
  } as any // type-cast to avoid host warning
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
  try {
    await redisClient.connect();
    console.log('Connected to Redis');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
})();

export default redisClient;
