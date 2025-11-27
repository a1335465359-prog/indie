import { Site } from '../types';
import { INITIAL_SITES } from '../constants';

// Declare global AV from CDN
declare const AV: any;

const APP_ID = "MTbnlF1EcKYgifi6nWsjLK3v-MdYXbMMI";
const APP_KEY = "iPMUnJbKplRokq3h4SUPdpMT";
const SERVER_URL = "https://mtbnlf1e.api.lncldglobal.com";

export const initCloud = () => {
  if (typeof AV === 'undefined') {
    console.error("LeanCloud SDK not loaded");
    return;
  }
  try {
    AV.init({
      appId: APP_ID,
      appKey: APP_KEY,
      serverURL: SERVER_URL
    });
    console.log("LeanCloud initialized");
  } catch (e) {
    // Prevent re-init error if hot reloading
    console.log("LeanCloud already initialized or error", e);
  }
};

export const fetchSites = async (): Promise<Site[]> => {
  try {
    const query = new AV.Query('Sites');
    query.limit(1000); 
    const results = await query.find();

    if (results.length === 0) {
      console.log("No sites found in cloud, seeding initial data...");
      await seedInitialData();
      return fetchSites();
    }

    return results.map((obj: any) => ({
      objectId: obj.id,
      n: obj.get('name'),
      u: obj.get('url'),
      c: obj.get('category'),
      // Map 'icon' column back to tags array
      t: JSON.parse(obj.get('icon') || '[]'),
      rating: obj.get('rating') || 0,
      pinned: obj.get('pinned') || false
    }));
  } catch (error) {
    console.error("Fetch sites failed:", error);
    // Fallback to initial sites locally if cloud fails, to avoid blank screen
    return INITIAL_SITES;
  }
};

const seedInitialData = async () => {
    const objects = INITIAL_SITES.map(site => {
        const obj = new AV.Object('Sites');
        obj.set('name', site.n);
        obj.set('url', site.u);
        obj.set('category', site.c);
        obj.set('icon', JSON.stringify(site.t)); // Store tags in icon column
        obj.set('rating', site.rating || 0);
        obj.set('pinned', site.pinned || false);
        return obj;
    });
    await AV.Object.saveAll(objects);
};

export const createSite = async (site: Site): Promise<Site> => {
    const obj = new AV.Object('Sites');
    obj.set('name', site.n);
    obj.set('url', site.u);
    obj.set('category', site.c);
    obj.set('icon', JSON.stringify(site.t));
    obj.set('rating', site.rating || 0);
    obj.set('pinned', site.pinned || false);
    
    const saved = await obj.save();
    return { ...site, objectId: saved.id };
};

export const updateSite = async (site: Site): Promise<void> => {
    if (!site.objectId) return;
    try {
        const obj = AV.Object.createWithoutData('Sites', site.objectId);
        obj.set('name', site.n);
        obj.set('url', site.u);
        obj.set('category', site.c);
        obj.set('icon', JSON.stringify(site.t));
        obj.set('rating', site.rating || 0);
        obj.set('pinned', site.pinned || false);
        await obj.save();
    } catch (e) {
        console.error("Failed to update site", e);
    }
};

export const deleteSite = async (siteId: string): Promise<void> => {
    try {
        const obj = AV.Object.createWithoutData('Sites', siteId);
        await obj.destroy();
    } catch (e) {
        console.error("Failed to delete site", e);
    }
};