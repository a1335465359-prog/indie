
import { Site } from '../types';

const CLICK_KEY = 'indie_nav_click_counts';

type ClickMap = Record<string, number>;

// Helper: Load map from local storage
const loadClickMap = (): ClickMap => {
  try {
    const raw = localStorage.getItem(CLICK_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Failed to load click stats", e);
    return {};
  }
};

// Helper: Save map to local storage
const saveClickMap = (map: ClickMap) => {
  try {
    localStorage.setItem(CLICK_KEY, JSON.stringify(map));
  } catch (e) {
    console.error("Failed to save click stats", e);
  }
};

// Record a click for a specific site
export const recordClick = (siteIdOrUrl: string) => {
  const map = loadClickMap();
  map[siteIdOrUrl] = (map[siteIdOrUrl] ?? 0) + 1;
  saveClickMap(map);
};

// Get top N sites based on click counts
export const getTopSites = (allSites: Site[], limit = 20): Site[] => {
  const map = loadClickMap();

  // Create a shallow copy to sort
  // We attach a temporary score to sort efficiently
  const sitesWithScore = allSites.map(site => {
    // Prefer objectId if available (Cloud), fallback to URL (Local/Legacy)
    const key = site.objectId || site.u;
    const score = map[key] || 0;
    return { site, score };
  });

  // Filter out sites with 0 clicks
  const activeSites = sitesWithScore.filter(s => s.score > 0);

  // Sort descending by score
  activeSites.sort((a, b) => b.score - a.score);

  // Return the top N sites
  return activeSites.slice(0, limit).map(s => s.site);
};
