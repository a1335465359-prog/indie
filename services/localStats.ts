
import { Site } from '../types';

const STATS_KEY = 'indie_nav_click_stats';
const PINNED_KEY = 'indie_nav_pinned_sites';

interface ClickStats {
  count: number;
  lastClick: number; // timestamp
}

type ClickMap = Record<string, ClickStats>;

// --- Helpers ---

const loadClickMap = (): ClickMap => {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Failed to load click stats", e);
    return {};
  }
};

const saveClickMap = (map: ClickMap) => {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(map));
  } catch (e) {
    console.error("Failed to save click stats", e);
  }
};

export const loadPinned = (): string[] => {
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const savePinned = (list: string[]) => {
  try {
    localStorage.setItem(PINNED_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save pinned list", e);
  }
};

// --- Core Logic ---

// 1. Record Click
export const recordClick = (siteIdOrUrl: string) => {
  const map = loadClickMap();
  const now = Date.now();
  const current = map[siteIdOrUrl] || { count: 0, lastClick: 0 };
  
  map[siteIdOrUrl] = {
    count: current.count + 1,
    lastClick: now
  };
  saveClickMap(map);
};

// 2. Compute Score
// score = clickCount * 0.7 + recentBoost * 0.3
// recentBoost = 1 if lastClick < 24h, else 0
const computeScore = (stats: ClickStats | undefined): number => {
  if (!stats) return 0;
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const isRecent = (Date.now() - stats.lastClick) < ONE_DAY;
  const recentBoost = isRecent ? 1 : 0;
  return (stats.count * 0.7) + (recentBoost * 0.3);
};

// 3. Toggle Pinned
export const toggleLocalPin = (siteId: string): string[] => {
  const list = loadPinned();
  const index = list.indexOf(siteId);
  if (index > -1) {
    list.splice(index, 1);
  } else {
    // Add to start or end? Usually pinning adds to top visually, but let's append to list
    list.push(siteId); 
  }
  savePinned(list);
  return list;
};

// 4. Reorder Pinned (Drag & Drop)
export const reorderPinned = (startIndex: number, endIndex: number): string[] => {
  const list = loadPinned();
  if (startIndex < 0 || startIndex >= list.length || endIndex < 0 || endIndex >= list.length) {
    return list;
  }
  const [removed] = list.splice(startIndex, 1);
  list.splice(endIndex, 0, removed);
  savePinned(list);
  return list;
};

// 5. Get Favorites (Pinned + Scored)
export const getFavorites = (allSites: Site[]) => {
  const pinnedIds = loadPinned();
  const statsMap = loadClickMap();

  // A. Pinned Sites
  const pinnedSites: Site[] = [];
  pinnedIds.forEach(id => {
    // Try matching by objectId first, then url
    const site = allSites.find(s => (s.objectId || s.u) === id);
    if (site) pinnedSites.push(site);
  });

  // B. Non-Pinned Sites (Candidates for Frequent)
  const nonPinnedCandidates = allSites.filter(s => {
    const id = s.objectId || s.u;
    return !pinnedIds.includes(id);
  });

  // C. Calculate Scores
  const scoredSites = nonPinnedCandidates.map(site => {
    const id = site.objectId || site.u;
    const stats = statsMap[id];
    const score = computeScore(stats);
    return { site, score };
  });

  // D. Sort by Score Descending
  // We filter out sites with 0 score to keep the list relevant, 
  // or we can keep them if we want to fill the 20 slots no matter what.
  // The prompt implies we sort by score.
  scoredSites.sort((a, b) => b.score - a.score);

  const sortedNonPinned = scoredSites
    .filter(item => item.score > 0) // Only show sites with history?
    .map(item => item.site);

  // E. Combine and Limit
  // Logic: favorites = [...pinnedSites, ...sortedNonPinned].slice(0, 20)
  // But we need to return them split for UI rendering (pinned vs others)
  
  const totalLimit = 20;
  const remainingSlots = Math.max(0, totalLimit - pinnedSites.length);
  const frequentSites = sortedNonPinned.slice(0, remainingSlots);

  return {
    pinned: pinnedSites,
    frequent: frequentSites
  };
};

export const isLocallyPinned = (siteId: string): boolean => {
  const list = loadPinned();
  return list.includes(siteId);
};
