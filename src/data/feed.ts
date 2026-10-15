import type { PlayerItem } from "../components/player/EpisodePage";
import { hasVideo } from "../video/source";
import { getTrending } from "./catalog";
import type { Catalog, Series } from "./types";

export type FeedItem = {
  key: string;
  series: Series;
  rank: number;
  item: Exclude<PlayerItem, { kind: "locked" }>;
};

/**
 * Brief §8 "Vertical feed": only trending series, by trendingRank.
 * One video per series: the trailer if it has one, otherwise episode 1.
 */
export function getFeedItems(catalog: Catalog): FeedItem[] {
  const out: FeedItem[] = [];
  let trailers = 0;
  let ep1 = 0;
  getTrending(catalog).forEach((series, i) => {
    const rank = series.trendingRank ?? i + 1;
    if (series.trailer && hasVideo(series.trailer)) {
      trailers++;
      out.push({
        key: `${series.id}:trailer`,
        series,
        rank,
        item: {
          key: "trailer",
          kind: "trailer",
          n: 0,
          video: series.trailer,
          likeCount: series.saveCount,
          title: "Trailer",
        },
      });
      return;
    }
    const e = series.episodes.find((x) => x.n === 1 && hasVideo(x));
    if (e) {
      ep1++;
      out.push({
        key: `${series.id}:ep1`,
        series,
        rank,
        item: {
          key: "ep1",
          kind: "episode",
          n: 1,
          video: e,
          likeCount: e.likeCount,
          title: e.title,
        },
      });
    } else if (__DEV__) {
      console.log(`[feed] ${series.id} skipped — no trailer and no EP 1 video`);
    }
  });
  if (__DEV__)
    console.log(
      `[feed] ${out.length} items — ${trailers} trailers, ${ep1} ep1`,
    );
  return out;
}
