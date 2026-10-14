// SnapDrama — catalog.json generator (runs on your PC, not in the app)
//
//   node scripts/make-catalog.mjs              → build + check every R2 link
//   node scripts/make-catalog.mjs --no-r2-check → build without checking R2 (faster)
//
// Reads:  your local series folder (same names as R2) + your Bunny Stream library (API)
// Writes: assets/data/catalog.json  (upload this file to the root of your R2 bucket)
//
// Your own edits (titles, descriptions, tags, totalEpisodes, counts, episode titles)
// are KEPT when you run it again — only links, groups and ranks are refreshed.
// Needs Node 18+ (built-in fetch). No packages.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// ───────────────────────── CONFIG (edit here) ─────────────────────────
const SERIES_DIR = "D:\\Expo prject\\snapdrama_files\\series";
const OUTPUT_FILE = path.join("assets", "data", "catalog.json");
const ENV_FILE = ".env.local"; // contains BUNNY_STREAM_API_KEY=...
const INFO_FILE = path.join("scripts", "series-info.json"); // your titles, descriptions, totalEpisodes, tags

const BUNNY_LIBRARY_ID = "777815";
const BUNNY_CDN = "https://vz-fd1254e9-985.b-cdn.net";
const R2_BASE = "https://pub-c7de44ea8bf04b1aba53119c94c35d96.r2.dev";

const COINS_PER_EPISODE = 50;
const DEFAULT_TOTAL_EPISODES = 60;

// For you feed — in this order (trendingRank 1, 2, 3…). Group "most-trending".
const MOST_TRENDING = [
  "chained-to-my-nemesis",
  "dear-stranger-i-love-you",
  "lessons-in-love-and-hate",
  "mrs-ceo-strictly-unprofessional",
  "my-knockout-fake-husband",
  "my-lumberjack-lover-is-a-billionaire",
  "plaything-of-the-mafia-king",
  "risky-love-with-my-boyfriends-dad",
  "sold-to-the-mafia-queen",
  "surrender-to-my-exs-dad",
  "tamed-by-my-dads-best-friend",
  "the-billionaires-private-dancer",
  "the-bookworm-and-the-billionaire",
  "the-janitor-owns-everything",
  "the-quarterbacks-secret-princess",
  "the-sound-of-us",
  "wet-hot-boys",
];
// Every other series → this group (not in the feed)
const OTHER_GROUP = "limited-time-deals";

// Titles that can't be guessed from the folder name (apostrophes, etc.)
const TITLE_OVERRIDES = {
  "mrs-ceo-strictly-unprofessional": "Mrs. CEO: Strictly Unprofessional",
  "risky-love-with-my-boyfriends-dad": "Risky Love with My Boyfriend's Dad",
  "surrender-to-my-exs-dad": "Surrender to My Ex's Dad",
  "tamed-by-my-dads-best-friend": "Tamed by My Dad's Best Friend",
  "the-billionaires-private-dancer": "The Billionaire's Private Dancer",
  "the-quarterbacks-secret-princess": "The Quarterback's Secret Princess",
  "the-dumb-billionaire-heiress-in-love-part-ii":
    "The Dumb Billionaire Heiress in Love: Part II",
  "he-ruined-me-now-i-have-to-save-him": "He Ruined Me, Now I Have to Save Him",
  "dear-stranger-i-love-you": "Dear Stranger, I Love You",
};
// ──────────────────────────────────────────────────────────────────────

const CHECK_R2 = !process.argv.includes("--no-r2-check");
const log = (...a) => console.log(...a);
const warn = (...a) => console.log("  ⚠", ...a);

function readApiKey() {
  if (!fs.existsSync(ENV_FILE)) {
    throw new Error(
      `${ENV_FILE} not found. Create it with one line: BUNNY_STREAM_API_KEY=your-key`,
    );
  }
  const line = fs
    .readFileSync(ENV_FILE, "utf8")
    .split(/\r?\n/)
    .find((l) => l.trim().startsWith("BUNNY_STREAM_API_KEY="));
  const key = line
    ? line
        .split("=")
        .slice(1)
        .join("=")
        .trim()
        .replace(/^["']|["']$/g, "")
    : "";
  if (!key || key.includes("PASTE"))
    throw new Error(`BUNNY_STREAM_API_KEY is empty in ${ENV_FILE}`);
  return key;
}

async function bunny(apiKey, urlPath) {
  const res = await fetch(
    `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}${urlPath}`,
    {
      headers: { AccessKey: apiKey, accept: "application/json" },
    },
  );
  if (res.status === 401)
    throw new Error(
      "Bunny said 401 — wrong API key (use the Stream library API key).",
    );
  if (!res.ok) throw new Error(`Bunny ${urlPath} → HTTP ${res.status}`);
  return res.json();
}

async function bunnyAll(apiKey, what) {
  const items = [];
  for (let page = 1; page < 100; page++) {
    const data = await bunny(apiKey, `/${what}?page=${page}&itemsPerPage=100`);
    items.push(...(data.items ?? []));
    if (!data.items?.length || items.length >= (data.totalItems ?? 0)) break;
  }
  return items;
}

// "ep_01.mp4" / "ep_01" → 1 ; "trailer.mp4" / "trailer" → "trailer"
function keyFromName(name) {
  const base = name
    .toLowerCase()
    .replace(/\.mp4$/, "")
    .trim();
  if (base === "trailer") return "trailer";
  const m = base.match(/^ep[_\-\s]?0*(\d+)$/);
  return m ? Number(m[1]) : null;
}

function titleFromSlug(slug) {
  if (TITLE_OVERRIDES[slug]) return TITLE_OVERRIDES[slug];
  const small = new Set([
    "a",
    "an",
    "and",
    "the",
    "of",
    "to",
    "in",
    "on",
    "for",
    "with",
    "by",
    "at",
    "is",
    "my",
  ]);
  return slug
    .split("-")
    .map((w, i) =>
      i > 0 && small.has(w) && w !== "my"
        ? w
        : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(" ");
}

// Stable "random" numbers per series, so re-runs give the same starting counts
function seeded(slug, salt, min, max) {
  const h = crypto
    .createHash("md5")
    .update(slug + salt)
    .digest();
  return min + (h.readUInt32BE(0) / 0xffffffff) * (max - min);
}

async function headOk(url) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  const t0 = Date.now();
  log("SnapDrama catalog generator");
  log(`  series folder: ${SERIES_DIR}`);

  // 1) Local folder (= R2 layout)
  if (!fs.existsSync(SERIES_DIR))
    throw new Error(`Series folder not found: ${SERIES_DIR}`);
  const slugs = fs
    .readdirSync(SERIES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  log(`  found ${slugs.length} series folders`);

  const local = {};
  for (const slug of slugs) {
    const files = fs.readdirSync(path.join(SERIES_DIR, slug));
    const eps = files
      .map(keyFromName)
      .filter((k) => typeof k === "number")
      .sort((a, b) => a - b);
    local[slug] = {
      eps,
      trailer: files.some((f) => keyFromName(f) === "trailer"),
      cover: files.includes("cover.webp"),
    };
  }

  // 2) Bunny
  const apiKey = readApiKey();
  log("  reading Bunny library…");
  const collections = await bunnyAll(apiKey, "collections");
  const videos = await bunnyAll(apiKey, "videos");
  log(`  Bunny: ${collections.length} collections, ${videos.length} videos`);

  const colName = Object.fromEntries(collections.map((c) => [c.guid, c.name]));
  const bunnyBySlug = {}; // slug → { 1: video, 2: video, trailer: video }
  for (const v of videos) {
    const slug = colName[v.collectionId];
    if (!slug) {
      warn(`Bunny video "${v.title}" is not in a collection — skipped`);
      continue;
    }
    const k = keyFromName(v.title ?? "");
    if (k === null) {
      warn(
        `Bunny video "${v.title}" in ${slug}: name not ep_XX / trailer — skipped`,
      );
      continue;
    }
    (bunnyBySlug[slug] ??= {})[k] = v;
  }
  for (const name of Object.keys(bunnyBySlug)) {
    if (!local[name])
      warn(`Bunny collection "${name}" has no local folder — skipped`);
  }

  const bunnyLinks = (v) =>
    v
      ? {
          hlsUrl: `${BUNNY_CDN}/${v.guid}/playlist.m3u8`,
          thumbUrl: `${BUNNY_CDN}/${v.guid}/${v.thumbnailFileName || "thumbnail.jpg"}`,
        }
      : {};

  // 3) Previous catalog (keep your edits)
  let prev = null;
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      prev = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf8"));
      log(
        `  previous catalog: version ${prev.version}, ${prev.series?.length ?? 0} series (your edits are kept)`,
      );
    } catch {
      warn(`${OUTPUT_FILE} exists but is not valid JSON — starting fresh`);
    }
  }
  const prevById = Object.fromEntries(
    (prev?.series ?? []).map((s) => [s.id, s]),
  );

  // 3b) Your series details (win over the previous catalog and the defaults)
  let info = {};
  if (fs.existsSync(INFO_FILE)) {
    try {
      info = JSON.parse(fs.readFileSync(INFO_FILE, "utf8")).series ?? {};
      log(
        `  series info: ${Object.keys(info).length} series from ${INFO_FILE}`,
      );
      for (const k of Object.keys(info))
        if (!local[k])
          warn(`series-info.json has "${k}" but no folder with that name`);
    } catch (e) {
      throw new Error(`${INFO_FILE} is not valid JSON: ${e.message}`);
    }
  } else {
    warn(`${INFO_FILE} not found — titles come from folder names`);
  }

  // 4) Build
  const report = [];
  const notesMissingInfo = [];
  const r2ToCheck = [];
  const series = slugs.map((slug) => {
    const L = local[slug];
    const B = bunnyBySlug[slug] ?? {};
    const old = prevById[slug] ?? {};
    const inf = info[slug] ?? {};
    if (!info[slug]) notesMissingInfo.push(slug);
    const oldEps = Object.fromEntries(
      (old.episodes ?? []).map((e) => [e.n, e]),
    );
    const rankIdx = MOST_TRENDING.indexOf(slug);
    const r2 = (file) => `${R2_BASE}/series/${slug}/${file}`;

    const notes = [];
    const allNums = [
      ...new Set([
        ...L.eps,
        ...Object.keys(B)
          .filter((k) => k !== "trailer")
          .map(Number),
      ]),
    ].sort((a, b) => a - b);

    const episodes = allNums.map((n) => {
      const file = `ep_${String(n).padStart(2, "0")}.mp4`;
      const v = B[n];
      const onR2 = L.eps.includes(n);
      if (!v) notes.push(`ep ${n} missing on Bunny`);
      if (!onR2) notes.push(`ep ${n} missing in folder/R2`);
      if (v && v.status !== 4)
        notes.push(`ep ${n} Bunny not ready (status ${v.status})`);
      if (onR2) r2ToCheck.push(r2(file));
      const e = oldEps[n] ?? {};
      return {
        n,
        title: e.title ?? `Episode ${n}`,
        duration: v?.length ? Math.round(v.length) : (e.duration ?? 0),
        likeCount:
          e.likeCount ??
          Math.round(
            seeded(slug, `like${n}`, 40000, 260000) * Math.pow(0.9, n - 1),
          ),
        ...bunnyLinks(v),
        ...(onR2 ? { mp4Url: r2(file) } : {}),
      };
    });

    let trailer;
    if (L.trailer || B.trailer) {
      if (!B.trailer) notes.push("trailer missing on Bunny");
      if (!L.trailer) notes.push("trailer missing in folder/R2");
      if (B.trailer && B.trailer.status !== 4)
        notes.push(`trailer Bunny not ready (status ${B.trailer.status})`);
      if (L.trailer) r2ToCheck.push(r2("trailer.mp4"));
      trailer = {
        duration: B.trailer?.length ? Math.round(B.trailer.length) : 0,
        ...bunnyLinks(B.trailer),
        ...(L.trailer ? { mp4Url: r2("trailer.mp4") } : {}),
      };
    }
    if (L.cover) r2ToCheck.push(r2("cover.webp"));
    else notes.push("cover.webp missing");

    const freeFound = episodes.length;
    report.push(
      `${String(rankIdx >= 0 ? `#${rankIdx + 1}` : "  -").padStart(3)}  ${slug}  ` +
        `eps ${L.eps.length} folder / ${allNums.filter((n) => B[n]).length} bunny  ` +
        `trailer ${trailer ? "✓" : "—"}${notes.length ? "   ⚠ " + notes.join(", ") : ""}`,
    );

    const ratingCount =
      old.ratingCount ?? Math.round(seeded(slug, "rc", 2500, 32000));
    return {
      id: slug,
      title: inf.title ?? old.title ?? titleFromSlug(slug),
      cover: r2("cover.webp"),
      tags: inf.tags ?? old.tags ?? [],
      description: inf.description ?? old.description ?? "",
      rating: old.rating ?? Math.round(seeded(slug, "r", 4.4, 4.9) * 10) / 10,
      ratingCount,
      saveCount:
        old.saveCount ?? Math.round(seeded(slug, "save", 20000, 220000)),
      shareCount:
        old.shareCount ?? Math.round(seeded(slug, "share", 3000, 35000)),
      freeEpisodes: old.freeEpisodes ?? freeFound,
      totalEpisodes: Math.max(
        inf.totalEpisodes ?? old.totalEpisodes ?? DEFAULT_TOTAL_EPISODES,
        freeFound,
      ),
      group: rankIdx >= 0 ? "most-trending" : OTHER_GROUP,
      ...(rankIdx >= 0 ? { trending: true, trendingRank: rankIdx + 1 } : {}),
      ...(trailer ? { trailer } : {}),
      episodes,
    };
  });

  if (notesMissingInfo.length)
    warn(`no details in series-info.json for: ${notesMissingInfo.join(", ")}`);
  for (const s of MOST_TRENDING)
    if (!local[s])
      warn(`MOST_TRENDING has "${s}" but no folder with that name`);

  // 5) Check R2 links really answer (HEAD), 8 at a time
  let r2Bad = [];
  if (CHECK_R2) {
    log(`  checking ${r2ToCheck.length} R2 links…`);
    for (let i = 0; i < r2ToCheck.length; i += 8) {
      const batch = r2ToCheck.slice(i, i + 8);
      const ok = await Promise.all(batch.map(headOk));
      batch.forEach((u, j) => !ok[j] && r2Bad.push(u));
      process.stdout.write(
        `\r  checked ${Math.min(i + 8, r2ToCheck.length)}/${r2ToCheck.length}…`,
      );
    }
    process.stdout.write("\n");
  }

  const catalog = {
    version: (prev?.version ?? 0) + 1,
    generatedAt: new Date().toISOString(),
    coinsPerEpisode: prev?.coinsPerEpisode ?? COINS_PER_EPISODE,
    series,
  };
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(catalog, null, 2) + "\n");

  // 6) Report
  log("\nSeries (rank  name  episodes  trailer  problems):");
  report.forEach((l) => log("  " + l));
  const eps = series.reduce((a, s) => a + s.episodes.length, 0);
  const trailers = series.filter((s) => s.trailer).length;
  log(
    `\nTotals: ${series.length} series, ${eps} episodes, ${trailers} trailers, feed ${MOST_TRENDING.length} series`,
  );
  if (CHECK_R2) {
    if (r2Bad.length) {
      log(`R2 check: ${r2Bad.length} link(s) NOT reachable:`);
      r2Bad.forEach((u) => log("  ✗ " + u));
    } else log(`R2 check: all ${r2ToCheck.length} links OK`);
  }
  log(
    `\n✔ wrote ${OUTPUT_FILE} — version ${catalog.version} (${((Date.now() - t0) / 1000).toFixed(1)}s)`,
  );
  log("Next: upload this file to the ROOT of your R2 bucket as catalog.json");
}

main().catch((e) => {
  console.error("\n✗ " + e.message);
  process.exit(1);
});
