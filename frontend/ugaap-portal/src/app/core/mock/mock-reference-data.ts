// core/mock/mock-reference-data.ts
//
// Async fetch functions for static reference / lookup data.
// Each simulates a 300 ms network round-trip so components behave identically
// whether running against mock or a real API.
// Replace the body of any function with a real http call when the endpoint is ready.

const delay = <T>(data: T): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(data), 300));

export const fetchDistricts = (): Promise<string[]> =>
  delay([
    'Hoima', 'Masindi', 'Gulu', 'Lira', 'Mbale', 'Kampala',
    'Jinja', 'Mbarara', 'Arua', 'Soroti', 'Tororo', 'Kasese',
    'Kabale', 'Fort Portal', 'Masaka',
  ]);

export const fetchCommodities = (): Promise<string[]> =>
  delay(['Robusta Coffee', 'Arabica Coffee', 'Maize', 'Rice', 'Sunflower', 'Soya Beans', 'Simsim', 'Millet']);

export const fetchGenderOptions = (): Promise<string[]> =>
  delay(['Female', 'Male', 'Other', 'Prefer not to say']);

export const fetchBankOptions = (): Promise<string[]> =>
  delay([
    'Stanbic Bank', 'Centenary Bank', 'DFCU Bank', 'Bank of Africa',
    'Equity Bank', 'Absa Bank', 'Post Bank', 'Finance Trust Bank', 'Other',
  ]);

export const fetchRegions = (): Promise<string[]> =>
  delay(['Central Region', 'Eastern Region', 'Northern Region', 'Western Region']);

export const fetchIrrigationTypes = (): Promise<string[]> =>
  delay(['Rain-fed', 'Irrigation', 'Both']);

export const fetchLandOwnership = (): Promise<string[]> =>
  delay(['Owned', 'Leased', 'Communal', 'Family Land']);

export const fetchStockCategories = (): Promise<string[]> =>
  delay(['FERTILIZER', 'SEEDS', 'EQUIPMENT', 'PACKAGING', 'TOOLS']);

export const fetchStockUnits = (): Promise<string[]> =>
  delay(['Bags', 'Kgs', 'Units', 'Sacks', 'Pieces']);

export const fetchRoleFilterOptions = (): Promise<string[]> =>
  delay(['All Roles', 'PLATFORM ADMIN', 'COOPERATIVE ADMIN', 'LOGISTICS MANAGER', 'ACCOUNTANT']);

export const fetchCooperativeRoleFilterOptions = (): Promise<string[]> =>
  delay(['All Roles', 'MANAGER', 'COOPERATIVE ADMIN', 'LOGISTICS MANAGER', 'ACCOUNTANT']);

export const fetchCooperationOptions = (): Promise<string[]> =>
  delay(['All Cooperations', 'UGAAP Central', 'Kasese Coffee Coop', 'Mubende Warehouse Central']);
