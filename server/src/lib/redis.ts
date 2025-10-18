import IORedis from "ioredis";

const { REDIS_HOST, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD, REDIS_TLS } =
  process.env;

if (!REDIS_HOST || !REDIS_PORT || !REDIS_PASSWORD) {
  throw new Error("Missing Redis environment variables");
}

export const redis = new IORedis({
  port: Number(REDIS_PORT),
  host: REDIS_HOST,
  username: REDIS_USERNAME || "default",
  password: REDIS_PASSWORD,
  db: 0,
  // ❌ remove TLS if not supported
  tls: REDIS_TLS === "true" ? {} : undefined,
});

redis.on("connect", () => console.log("✅ Connected to Redis"));
redis.on("error", (err) => console.error("❌ Redis error:", err));

export const redisConnection = {
  host: REDIS_HOST,
  port: Number(REDIS_PORT),
  username: REDIS_USERNAME || "default",
  password: REDIS_PASSWORD,
  // ❌ remove TLS
  tls: REDIS_TLS === "true" ? {} : undefined,
};
