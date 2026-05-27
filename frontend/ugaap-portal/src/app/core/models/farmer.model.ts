// ─────────────────────────────────────────────────────────────────────────────
// core/models/farmer.model.ts
//
// Central type definitions for the Farmer domain.
// Used by:
//   - features/farmers/farmer.service.ts
//   - features/farmers/farmer-list, farmer-register, farmer-approval
//   - features/cooperatives (farmer-list sub-view)
// ─────────────────────────────────────────────────────────────────────────────

/** Lifecycle status of a farmer account */
export type FarmerStatus = 'Active' | 'Pending' | 'Rejected' | 'Suspended';

/** Onboarding pipeline step progress */
export type OnboardingStepStatus = 'done' | 'progress' | 'pending';

/** Loan recovery health label */
export type RecoveryStatus = 'settled' | 'partial' | 'overdue';

/** Badge colour variants used across the UI */
export type BadgeVariant =
  | 'active' | 'pending' | 'inactive' | 'suspended'
  | 'overdue' | 'settled' | 'partial'
  | 'verified' | 'failed' | 'draft'
  | 'open' | 'closed' | 'healthy' | 'low' | 'info';

// ── Registration form ─────────────────────────────────────────────────────────

/** What the farmer-register form collects */
export interface ProductionDetails {
  coffee:   boolean;
  maize:    boolean;
  cocoa:    boolean;
  vanilla:  boolean;
  cattle:   number;
  goats:    number;
  poultry:  number;
}

export interface FarmerRegistrationForm {
  fullName:          string;
  emailAddress:      string;
  phoneNumber:       string;
  dateOfBirth:       string;
  nationalIdNumber:  string;
  gender:            string;
  photoPreviewUrl:   string;
  farmLocation:      string;
  village:           string;
  gpsCoordinates:    string;
  totalLandArea:     number | null;
  irrigationSource:  string;
  landOwnershipType: string;
  production:        ProductionDetails;
  cooperativeGroup:  string;
  assignedBranch:    string;
}

// ── Onboarding pipeline ───────────────────────────────────────────────────────

export interface OnboardingStep {
  label:  string;
  sub:    string;
  status: OnboardingStepStatus;
}

// ── Full farmer profile (returned by GET /farmers/:id) ────────────────────────

export interface FarmerProfile {
  id:                string;
  region:            string;
  totalDeliveries:   number;
  primaryCrop:       string;
  pendingReview:     boolean;
  status:            FarmerStatus;
  stage:             string;
  outstandingBalance: number;
  fullName:          string;
  role:              string;
  photoUrl:          string;
  phoneNumber:       string;
  emailAddress:      string;
  gender:            string;
  farmLocation:      string;
  village:           string;
  dateOfBirth:       string;
  primaryLanguage:   string;
  emergencyContact:  string;
  nationalIdNumber:  string;
  farm: {
    gpsCoordinates:    string;
    totalLandArea:     number;
    irrigationSource:  string;
    landOwnershipType: string;
    primaryCrops:      string[];
    livestock:         string[];
  };
  registration: {
    assignedBranch:    string;
    collectionCentre:  string;
    dateRegistered:    string;
    registeredBy:      string;
  };
  onboardingSteps: OnboardingStep[];
  groupCredit: {
    cooperativeGroup: string;
    groupLeader:      string;
    creditLimit:      number;
    creditScore:      number;
    scoreLabel:       string;
    saccoName:        string;
  };
}

// ── Slim list item (returned by GET /farmers) ─────────────────────────────────

export interface FarmerListItem {
  id:               string;
  name:             string;
  branch:           string;
  primaryCommodity: string;
  creditLimit:      string;
  balance:          string;
  status:           FarmerStatus;
  stage:            string;
}
