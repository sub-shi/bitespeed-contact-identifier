import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL, // Example: "redis://default:password@localhost:6379"
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
  await redisClient.connect();
})();

export default redisClient;
