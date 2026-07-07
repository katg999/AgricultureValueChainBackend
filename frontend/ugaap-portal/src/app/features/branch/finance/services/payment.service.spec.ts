import {
  computePayoutFee,
  defaultPayoutChannel,
  isTerminalPayoutStatus,
} from './payment.service';

describe('payout pure helpers', () => {
  describe('computePayoutFee', () => {
    it('charges 1.5% + 500 UGX flat for MTN', () => {
      expect(computePayoutFee('MTN', 450000)).toBe(7250); // round(450000*0.015)=6750 + 500
    });

    it('charges 1.5% + 500 UGX flat for AIRTEL', () => {
      expect(computePayoutFee('AIRTEL', 200000)).toBe(3500); // round(200000*0.015)=3000 + 500
    });

    it('charges a flat 1000 UGX for POSTBANK regardless of amount', () => {
      expect(computePayoutFee('POSTBANK', 999999)).toBe(1000);
    });

    it('charges no fee for WENDI', () => {
      expect(computePayoutFee('WENDI', 500000)).toBe(0);
    });
  });

  describe('isTerminalPayoutStatus', () => {
    it('treats SETTLED, FAILED_REVERSED, and TIER_LIMIT_EXCEEDED as terminal', () => {
      expect(isTerminalPayoutStatus('SETTLED')).toBe(true);
      expect(isTerminalPayoutStatus('FAILED_REVERSED')).toBe(true);
      expect(isTerminalPayoutStatus('TIER_LIMIT_EXCEEDED')).toBe(true);
    });

    it('treats INITIATED, VALIDATING, FUNDS_LOCKED, and CHANNEL_PROCESSING as non-terminal', () => {
      expect(isTerminalPayoutStatus('INITIATED')).toBe(false);
      expect(isTerminalPayoutStatus('VALIDATING')).toBe(false);
      expect(isTerminalPayoutStatus('FUNDS_LOCKED')).toBe(false);
      expect(isTerminalPayoutStatus('CHANNEL_PROCESSING')).toBe(false);
    });
  });

  describe('defaultPayoutChannel', () => {
    it('defaults Mobile Money to MTN', () => {
      expect(defaultPayoutChannel('Mobile Money')).toBe('MTN');
    });

    it('defaults Bank Transfer to POSTBANK', () => {
      expect(defaultPayoutChannel('Bank Transfer')).toBe('POSTBANK');
    });

    it('returns null for Cash (not eligible for digital payout)', () => {
      expect(defaultPayoutChannel('Cash')).toBeNull();
    });
  });
});
