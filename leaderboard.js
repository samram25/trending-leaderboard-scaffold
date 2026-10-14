
import Redis from "ioredis";
import "dotenv/config";

const redis = new Redis(process.env.REDIS_URL);

/**
 * Increment a post's trending score by 1.
 */
export async function upvote(postId) {
  return redis.zincrby("trending:posts", 1, postId);
}

/**
 * Fetch the top N posts, ranked high to low, with their metadata.
 */
export async function getTop(n) {
  const posts = await redis.zrevrange(
    "trending:posts",
    0,
    n - 1,
    "WITHSCORES"
  );

  const pipeline = redis.pipeline();

  for (let i = 0; i < posts.length; i += 2) {
    const postId = posts[i];
    pipeline.hgetall(`${postId}:meta`);
  }

  const results = await pipeline.exec();
  const topPosts = [];

  for (let i = 0; i < posts.length; i += 2) {
    const postId = posts[i];
    const score = Number(posts[i + 1]);
    const metadata = results[i / 2][1];

    topPosts.push({
      id: postId,
      score,
      ...metadata,
    });
  }

  return topPosts;
}

export { redis };
