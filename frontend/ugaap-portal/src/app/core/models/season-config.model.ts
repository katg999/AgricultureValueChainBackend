import { Season } from '../../features/branch/collections/branch.delivery.model';
export { DEFAULT_SEASON_WINDOWS } from '../mock/mock-cooperative';

export interface SeasonWindow {
  type: Season;
  label: string;
  startMonth: number; // 1–12
  endMonth: number;   // 1–12; if endMonth < startMonth the range wraps the year boundary
}

export interface SeasonStatus {
  isOpen: boolean;
  activeType: Season | null;
}

// Index 0 is intentionally blank so MONTH_NAMES[1] === 'January'.
export const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
