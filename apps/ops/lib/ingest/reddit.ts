import type { NormalizedSignal, RedditSourceConfig } from "./types";

// Reddit requires a distinctive User-Agent or requests get rate-limited/
// blocked much more aggressively.
const USER_AGENT = "web:klaargesukkel-eyespy:1.0 (by /u/klaargesukkel)";

type RedditPost = {
  title?: string;
  selftext?: string;
  permalink?: string;
  created_utc?: number;
};

type RedditSearchResponse = {
  data?: { children?: { data?: RedditPost }[] };
};

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET not set");
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Reddit token request failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: data.access_token,
    // Refresh a minute early to be safe.
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}

async function searchSubreddit(
  subreddit: string,
  query: string,
  token: string
): Promise<NormalizedSignal[]> {
  const url = `https://oauth.reddit.com/r/${encodeURIComponent(subreddit)}/search?q=${encodeURIComponent(
    query
  )}&restrict_sr=1&sort=new&limit=25`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`Reddit search failed for r/${subreddit}: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as RedditSearchResponse;
  return (data.data?.children ?? []).map(({ data: post }) => {
    const selftext = (post?.selftext ?? "").slice(0, 500);
    return {
      rawText: [post?.title, selftext].filter(Boolean).join(" — ") || "(no text)",
      url: post?.permalink ? `https://www.reddit.com${post.permalink}` : null,
      timestamp: post?.created_utc ? new Date(post.created_utc * 1000) : new Date(),
    };
  });
}

export async function pullReddit(config: RedditSourceConfig): Promise<NormalizedSignal[]> {
  const token = await getAccessToken();
  const perSubreddit = await Promise.all(
    config.subreddits.map((subreddit) => searchSubreddit(subreddit, config.query, token))
  );
  return perSubreddit.flat();
}
