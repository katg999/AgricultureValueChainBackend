// Farmer activity methods and interfaces were merged into FarmerService.
// This file re-exports from there so any stale import still compiles.
export { FarmerService as FarmerActivityService } from '../../features/shared-farmer-domain/farmer.service';
export type { InputAllocation, ProduceDelivery, BalanceLine, Repayment, FarmerNotification } from '../../features/shared-farmer-domain/farmer.service';
