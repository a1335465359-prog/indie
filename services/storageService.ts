import { Site } from '../types';
import { INITIAL_SITES } from '../constants';

const STORAGE_KEY = 'indie_nav_sites';

export const getSites = (): Site[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Initialize if empty
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SITES));
    return INITIAL_SITES;
  } catch (e) {
    console.error("Failed to load sites from local storage", e);
    return INITIAL_SITES;
  }
};

export const saveSites = (sites: Site[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
  } catch (e) {
    console.error("Failed to save sites to local storage", e);
  }
};
