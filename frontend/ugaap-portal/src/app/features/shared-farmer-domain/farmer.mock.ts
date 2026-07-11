// Re-export shim — all farmer mock data now lives in core/mock/mock-farmer.ts.
// This file stays so existing imports continue to work without changes.
export {
  MOCK_COOPERATIVES,
  MOCK_FARMER_LIST,
  buildMockFarmerProfile,
} from '../../core/mock/mock-farmer';
