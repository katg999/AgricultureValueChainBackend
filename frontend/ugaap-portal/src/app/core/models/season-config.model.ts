import { Season } from '../../features/branch/collections/branch.delivery.model';

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

export const DEFAULT_SEASON_WINDOWS: SeasonWindow[] = [
  { type: 'Wet Season', label: 'Wet Season', startMonth: 3, endMonth: 8 },   // Mar–Aug
  { type: 'Dry Season', label: 'Dry Season', startMonth: 9, endMonth: 2 },   // Sep–Feb
];

// Index 0 is intentionally blank so MONTH_NAMES[1] === 'January'.
export const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
