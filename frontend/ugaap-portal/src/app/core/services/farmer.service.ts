import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { API_ENDPOINTS } from '../constants/api-endpoints';

// ─────────────────────────────────────────────────────────────────────────────
// FORM-FACING TYPES (what the Angular form/template works with)
// ─────────────────────────────────────────────────────────────────────────────

export type GenderOption = 'Female' | 'Male' | 'Other' | 'Prefer not to say';
export type FarmLocationOption =
  | 'Central Region'
  | 'Eastern Region'
  | 'Northern Region'
  | 'Western Region';
export type IrrigationOption = 'Rain-fed' | 'Irrigation' | 'Both';
export type LandOwnershipOption = 'Owned' | 'Leased' | 'Communal' | 'Family Land';
export type PaymentMethodOption = 'bank' | 'wendi_wallet' | 'mobile_money';

export interface FarmerPaymentMethod {
  type: PaymentMethodOption;
  bankName: string;
  bankBranch: string;
  bankAccountHolderName: string;
  bankAccountNumber: string;
  wendiWalletNumber: string;
  mobileMoneyProvider: 'mtn' | 'airtel';
  mobileMoneyPhone: string;
}

export interface FarmerProduction {
  commodity: string;
  livestock: string;
}

// Add this interface near the top with the other interfaces
export interface FarmerSearchResult {
  memberId: string;
  fullName: string;
  branchId: string | null;
}

export interface FarmerRegistrationForm {
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  dateOfBirth: string;
  nationalIdNumber: string;
  gender: GenderOption;
  photoPreviewUrl: string;
  farmLocation: FarmLocationOption;
  village: string;
  gpsCoordinates: string;
  totalLandArea: number | null;
  irrigationSource: IrrigationOption;
  landOwnershipType: LandOwnershipOption;
  production: FarmerProduction;
  cooperativeGroup: string;
  assignedBranch: string;
  paymentMethod: FarmerPaymentMethod;

  // Set just before submit — not part of the initial form model
  branchId?: string;
  cooperativeId?: string;
  status?: string;

  // Holds a real File object when the user picks a photo (separate from the
  // base64 preview used for <img> display)
  photoFile?: File | null;
}

export interface FarmerProfile {
  memberId: string;
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  dateOfBirth: string;
  nationalIdNumber: string;
  gender: GenderOption;
  photoUrl: string;
  farmLocation: FarmLocationOption;
  village: string;
  farm: {
    gpsCoordinates: string;
    totalLandArea: number | null;
    irrigationSource: IrrigationOption;
    landOwnershipType: LandOwnershipOption;
    primaryCrops: string[];
    livestock: string[];
  };
  groupCredit: {
    cooperativeGroup: string;
  };
  registration: {
    assignedBranch: string;
  };
  paymentMethod: FarmerPaymentMethod;
  status: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKEND-FACING TYPES (mirrors MemberDto.CreateRequest / .Response exactly)
// ─────────────────────────────────────────────────────────────────────────────

type BackendGender = 'MALE' | 'FEMALE' | 'OTHER';
type BackendFarmLocation =
  | 'CENTRAL_REGION'
  | 'EASTERN_REGION'
  | 'NORTHERN_REGION'
  | 'WESTERN_REGION';
type BackendIrrigation = 'RAIN_FED' | 'IRRIGATION' | 'BOTH';
type BackendLandOwnership = 'OWNED' | 'LEASED' | 'COMMUNAL' | 'FAMILY_LAND';
type BackendPaymentMethod = 'BANK_ACCOUNT' | 'WENDI_WALLET' | 'MOBILE_MONEY';

interface MemberCreateRequest {
  fullName: string;
  nationalId: string;
  phoneNumber: string;
  gender: BackendGender;
  irrigationSource: BackendIrrigation;
  email: string;
  dateOfBirth: string; // ISO yyyy-MM-dd
  farmLocation: BackendFarmLocation;
  villageTown: string;
  totalLandAreaHectares: number | null;
  landOwnershipType: BackendLandOwnership;
  primaryCrops: string[];
  commodityToDeliver: string;
  livestockKept: string;
  paymentMethodType: BackendPaymentMethod;
  bankName: string;
  bankBranch: string;
  accountHolderName: string;
  accountNumber: string;
  walletNumber: string;
  tenantId: string;
  branchId: string;
  cooperativeId: string;
}

interface MemberResponse {
  memberId: string;
  fullName: string;
  nationalId: string;
  phoneNumber: string;
  gender: string;
  irrigationSource: string;
  email: string;
  dateOfBirth: string;
  profilePhotoUrl: string;
  farmLocation: string;
  villageTown: string;
  totalLandAreaHectares: number;
  landOwnershipType: string;
  cooperativeId: string;
  tenantId: string;
  branchId: string;
  status: string;
  registeredBy: string;
  createdAt: string;
  bankName: string;
  bankBranch: string;
  accountHolderName: string;
  accountNumber: string;
  walletNumber: string;
  commodityToDeliver: string;
  livestockKept: string;
  paymentMethodType: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ENUM MAPPERS — form-facing string ↔ backend enum string
// ─────────────────────────────────────────────────────────────────────────────

const GENDER_MAP: Record<GenderOption, BackendGender> = {
  Female: 'FEMALE',
  Male: 'MALE',
  Other: 'OTHER',
  'Prefer not to say': 'OTHER',
};

const FARM_LOCATION_MAP: Record<FarmLocationOption, BackendFarmLocation> = {
  'Central Region': 'CENTRAL_REGION',
  'Eastern Region': 'EASTERN_REGION',
  'Northern Region': 'NORTHERN_REGION',
  'Western Region': 'WESTERN_REGION',
};

const IRRIGATION_MAP: Record<IrrigationOption, BackendIrrigation> = {
  'Rain-fed': 'RAIN_FED',
  Irrigation: 'IRRIGATION',
  Both: 'BOTH',
};

const LAND_OWNERSHIP_MAP: Record<LandOwnershipOption, BackendLandOwnership> = {
  Owned: 'OWNED',
  Leased: 'LEASED',
  Communal: 'COMMUNAL',
  'Family Land': 'FAMILY_LAND',
};

const PAYMENT_METHOD_MAP: Record<PaymentMethodOption, BackendPaymentMethod> = {
  bank: 'BANK_ACCOUNT',
  wendi_wallet: 'WENDI_WALLET',
  mobile_money: 'MOBILE_MONEY',
};

// Reverse maps, used when reading a farmer back from the API into form shape
const GENDER_MAP_REVERSE: Record<string, GenderOption> = {
  FEMALE: 'Female',
  MALE: 'Male',
  OTHER: 'Other',
};

const FARM_LOCATION_MAP_REVERSE: Record<string, FarmLocationOption> = {
  CENTRAL_REGION: 'Central Region',
  EASTERN_REGION: 'Eastern Region',
  NORTHERN_REGION: 'Northern Region',
  WESTERN_REGION: 'Western Region',
};

const IRRIGATION_MAP_REVERSE: Record<string, IrrigationOption> = {
  RAIN_FED: 'Rain-fed',
  IRRIGATION: 'Irrigation',
  BOTH: 'Both',
};

const LAND_OWNERSHIP_MAP_REVERSE: Record<string, LandOwnershipOption> = {
  OWNED: 'Owned',
  LEASED: 'Leased',
  COMMUNAL: 'Communal',
  FAMILY_LAND: 'Family Land',
};

const PAYMENT_METHOD_MAP_REVERSE: Record<string, PaymentMethodOption> = {
  BANK_ACCOUNT: 'bank',
  WENDI_WALLET: 'wendi_wallet',
  MOBILE_MONEY: 'mobile_money',
};

@Injectable({ providedIn: 'root' })
export class FarmerService {
  constructor(private http: HttpClient) {}

  // ── Create ───────────────────────────────────────────────────────────────
  create(form: FarmerRegistrationForm): Observable<FarmerProfile> {
    const requestBody = this.toCreateRequest(form);
    const formData = this.buildMultipart(requestBody, form.photoFile ?? null);

    console.log('[FarmerService.create] outgoing request body:', requestBody);
    console.log('[FarmerService.create] has photo file:', !!form.photoFile);

    return this.http
      .post<ApiEnvelope<MemberResponse>>(API_ENDPOINTS.MEMBERS.REGISTER, formData)
      .pipe(
        tap((res) => console.log('[FarmerService.create] raw response:', res)),
        map((res) => this.toFarmerProfile(res.data)),
        tap((profile) => console.log('[FarmerService.create] mapped profile:', profile)),
      );
  }

  // ── Update ───────────────────────────────────────────────────────────────
  update(memberId: string, form: FarmerRegistrationForm): Observable<FarmerProfile> {
    const requestBody = this.toCreateRequest(form);
    const formData = this.buildMultipart(requestBody, form.photoFile ?? null);

    console.log('[FarmerService.update] memberId:', memberId);
    console.log('[FarmerService.update] outgoing request body:', requestBody);

    return this.http
      .put<ApiEnvelope<MemberResponse>>(API_ENDPOINTS.MEMBERS.BY_ID(memberId), formData)
      .pipe(
        tap((res) => console.log('[FarmerService.update] raw response:', res)),
        map((res) => this.toFarmerProfile(res.data)),
      );
  }

  // ── Get by id ────────────────────────────────────────────────────────────
  getById(memberId: string): Observable<FarmerProfile> {
    return this.http.get<ApiEnvelope<MemberResponse>>(API_ENDPOINTS.MEMBERS.BY_ID(memberId)).pipe(
      tap((res) => console.log('[FarmerService.getById] raw response:', res)),
      map((res) => this.toFarmerProfile(res.data)),
    );
  }

  // ── Search ───────────────────────────────────────────────────────────────
  search(query: string): Observable<FarmerSearchResult[]> {
    return this.http.get<FarmerSearchResult[]>(`${API_ENDPOINTS.MEMBERS.REGISTER}/search`, {
      params: { query },
    });
  }

  // ── List ─────────────────────────────────────────────────────────────────
  list(tenantId: string, branchId?: string): Observable<FarmerProfile[]> {
    return this.http
      .get<ApiEnvelope<MemberResponse[]>>(API_ENDPOINTS.MEMBERS.LIST(tenantId, branchId))
      .pipe(map((res) => res.data.map((m) => this.toFarmerProfile(m))));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAPPING: form → backend request body
  // ─────────────────────────────────────────────────────────────────────────
  private toCreateRequest(form: FarmerRegistrationForm): MemberCreateRequest {
    const pm = form.paymentMethod;
    const isMobileMoney = pm.type === 'mobile_money';

    return {
      fullName: form.fullName,
      nationalId: form.nationalIdNumber,
      phoneNumber: form.phoneNumber,
      gender: GENDER_MAP[form.gender],
      irrigationSource: IRRIGATION_MAP[form.irrigationSource],
      email: form.emailAddress,
      dateOfBirth: form.dateOfBirth,
      farmLocation: FARM_LOCATION_MAP[form.farmLocation],
      villageTown: form.village,
      totalLandAreaHectares: form.totalLandArea,
      landOwnershipType: LAND_OWNERSHIP_MAP[form.landOwnershipType],
      primaryCrops: [], // not currently collected by this form; backend accepts an empty list
      commodityToDeliver: form.production.commodity,
      livestockKept: form.production.livestock,
      paymentMethodType: PAYMENT_METHOD_MAP[pm.type],
      bankName: pm.type === 'bank' ? pm.bankName : '',
      bankBranch: pm.type === 'bank' ? pm.bankBranch : '',
      accountHolderName: pm.type === 'bank' ? pm.bankAccountHolderName : '',
      accountNumber: pm.type === 'bank' ? pm.bankAccountNumber : '',
      walletNumber:
        pm.type === 'wendi_wallet'
          ? pm.wendiWalletNumber
          : isMobileMoney
            ? pm.mobileMoneyPhone
            : '',
      tenantId: form.cooperativeGroup || '',
      branchId: form.branchId ?? form.assignedBranch,
      cooperativeId: form.cooperativeId ?? '',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAPPING: backend response → form-facing profile
  // ─────────────────────────────────────────────────────────────────────────
  private toFarmerProfile(m: MemberResponse): FarmerProfile {
    return {
      memberId: m.memberId,
      fullName: m.fullName,
      emailAddress: m.email,
      phoneNumber: m.phoneNumber,
      dateOfBirth: m.dateOfBirth,
      nationalIdNumber: m.nationalId,
      gender: GENDER_MAP_REVERSE[m.gender] ?? 'Other',
      photoUrl: m.profilePhotoUrl,
      farmLocation: FARM_LOCATION_MAP_REVERSE[m.farmLocation] ?? 'Central Region',
      village: m.villageTown,
      farm: {
        gpsCoordinates: '',
        totalLandArea: m.totalLandAreaHectares,
        irrigationSource: IRRIGATION_MAP_REVERSE[m.irrigationSource] ?? 'Rain-fed',
        landOwnershipType: LAND_OWNERSHIP_MAP_REVERSE[m.landOwnershipType] ?? 'Owned',
        primaryCrops: m.commodityToDeliver ? [m.commodityToDeliver] : [],
        livestock: m.livestockKept ? m.livestockKept.split(',').map((s) => s.trim()) : [],
      },
      groupCredit: {
        cooperativeGroup: m.tenantId,
      },
      registration: {
        assignedBranch: m.branchId,
      },
      paymentMethod: {
        type: PAYMENT_METHOD_MAP_REVERSE[m.paymentMethodType] ?? 'mobile_money',
        bankName: m.bankName ?? '',
        bankBranch: m.bankBranch ?? '',
        bankAccountHolderName: m.accountHolderName ?? '',
        bankAccountNumber: m.accountNumber ?? '',
        wendiWalletNumber: m.paymentMethodType === 'WENDI_WALLET' ? (m.walletNumber ?? '') : '',
        mobileMoneyProvider: 'mtn',
        mobileMoneyPhone: m.paymentMethodType === 'MOBILE_MONEY' ? (m.walletNumber ?? '') : '',
      },
      status: m.status,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Builds the multipart body the backend expects:
  //   - "data" part: JSON string of MemberCreateRequest
  //   - "photo" part: optional File
  // Matches MemberController's
  //   @RequestPart("data") String requestJson
  //   @RequestPart(value = "photo", required = false) MultipartFile photo
  // ─────────────────────────────────────────────────────────────────────────
  private buildMultipart(body: MemberCreateRequest, photo: File | null): FormData {
    const formData = new FormData();
    const dataBlob = new Blob([JSON.stringify(body)], { type: 'application/json' });
    formData.append('data', dataBlob, 'data.json'); // ← added 'data.json'
    if (photo) {
      formData.append('photo', photo, photo.name);
    }
    return formData;
  }
}
