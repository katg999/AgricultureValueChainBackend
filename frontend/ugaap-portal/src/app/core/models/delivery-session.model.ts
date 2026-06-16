// A DeliverySession is a stable slot identity — independent of its actual hours,
// since a cooperative can change the hours without invalidating historical records
// that were recorded under that slot. Always exactly 3 slots per day.
export type DeliverySession = 'morning' | 'midday' | 'afternoon';

export const ALL_DELIVERY_SESSIONS: DeliverySession[] = ['morning', 'midday', 'afternoon'];

export interface DeliverySessionWindow {
  id: DeliverySession;
  label: string;
  startHour: number; // 0-23
  endHour: number;   // 0-23, must be greater than startHour
}

export const DEFAULT_SESSION_WINDOWS: DeliverySessionWindow[] = [
  { id: 'morning', label: 'Morning', startHour: 6, endHour: 9 },
  { id: 'midday', label: 'Midday', startHour: 9, endHour: 12 },
  { id: 'afternoon', label: 'Afternoon', startHour: 12, endHour: 18 },
];
