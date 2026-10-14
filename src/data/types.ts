// Shapes of catalog.json (written by scripts/make-catalog.mjs)

export type VideoSource = {
  duration: number; // seconds
  hlsUrl?: string; // Bunny (main)
  mp4Url?: string; // R2 (fallback)
  thumbUrl?: string;
};

export type Episode = VideoSource & {
  n: number;
  title: string;
  likeCount: number;
};

export type Series = {
  id: string; // = folder name, e.g. "rosy-psycho"
  title: string;
  cover: string;
  tags: string[];
  description: string;
  rating: number;
  ratingCount: number;
  saveCount: number;
  shareCount: number;
  freeEpisodes: number; // episodes 1..freeEpisodes are free (0 = trailer only)
  totalEpisodes: number;
  group: string; // "most-trending" | "limited-time-deals" | …
  trending?: boolean;
  trendingRank?: number;
  trailer?: VideoSource;
  episodes: Episode[]; // only the free ones (with videos)
};

export type Catalog = {
  version: number;
  generatedAt?: string;
  coinsPerEpisode: number;
  series: Series[];
};
