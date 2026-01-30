// ═══════════════════════════════════════════════════════════
// USER & AUTH TYPES
// ═══════════════════════════════════════════════════════════

export interface User {
  id: string;
  email: string;
  emailVerified?: Date | null;
  locale: string;
  timezone: string;
  dataConsentAt?: Date | null;
  marketingConsentAt?: Date | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MagicLink {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════
// COACH TYPES
// ═══════════════════════════════════════════════════════════

export enum CoachStyle {
  SCIENTIFIC = 'SCIENTIFIC',
  MIXED = 'MIXED',
  SPIRITUAL = 'SPIRITUAL',
}

export enum CoachStatus {
  OPEN = 'OPEN',
  FULL = 'FULL',
  PAUSED = 'PAUSED',
}

export interface CoachProfile {
  id: string;
  userId: string;
  displayName: string;
  instagramHandle?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  languages: string[];
  style: CoachStyle;
  focusTags: string[];
  maxActiveClients: number;
  status: CoachStatus;
  responseScore: number;
  assignedCount: number;
  referralCode: string;
  createdAt: Date;
  updatedAt: Date;
}

// ═══════════════════════════════════════════════════════════
// ATTRIBUTION & LEADS TYPES
// ═══════════════════════════════════════════════════════════

export enum AttributionSource {
  COACH_LINK = 'COACH_LINK',
  SOOMI_ASSIGNED = 'SOOMI_ASSIGNED',
  ORGANIC = 'ORGANIC',
}

export interface Attribution {
  id: string;
  userId: string;
  source: AttributionSource;
  referralCode?: string | null;
  coachId?: string | null;
  attributedAt: Date;
  expiresAt: Date;
  createdAt: Date;
}

export enum LeadRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  AUTO_ROUTED = 'AUTO_ROUTED',
}

export interface LeadRequest {
  id: string;
  userId: string;
  coachId: string;
  status: LeadRequestStatus;
  createdAt: Date;
  expiresAt: Date;
  respondedAt?: Date | null;
  declineReason?: string | null;
  routingAttempt: number;
  previousCoachId?: string | null;
}

// ═══════════════════════════════════════════════════════════
// PROGRAM TYPES
// ═══════════════════════════════════════════════════════════

export enum CoachIntensity {
  NONE = 'NONE',
  LIGHT = 'LIGHT',
  DAILY = 'DAILY',
  INTENSIVE = 'INTENSIVE',
}

export enum ReportType {
  MINI = 'MINI',
  STANDARD = 'STANDARD',
  DETAILED = 'DETAILED',
}

export enum TargetAudience {
  ALL = 'ALL',
  NEW_USERS = 'NEW_USERS',
  RETURNING_USERS = 'RETURNING_USERS',
  COACH_RECOMMENDED = 'COACH_RECOMMENDED',
}

export interface CheckInConfig {
  questions: string[];
  allowNotes: boolean;
  maxNotesLength?: number;
}

export interface ProgramTemplate {
  id: string;
  slug: string;
  nameKey: string;
  descriptionKey: string;
  shortDescKey: string;
  durationDays: number;
  coachRequired: boolean;
  coachIntensity: CoachIntensity;
  priceEuroCents: number;
  coachDirectSplit: number;
  soomiAssignedSplit: number;
  allowedActionIds: string[];
  checkInConfig: CheckInConfig;
  reportType: ReportType;
  targetAudience: TargetAudience;
  isRepeatProgram: boolean;
  prerequisiteSlug?: string | null;
  isActive: boolean;
  isPublic: boolean;
  sortOrder: number;
  availableFrom?: Date | null;
  availableUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProgramVariant {
  id: string;
  templateId: string;
  slug: string;
  nameKey: string;
  priceEuroCents: number;
  originalPrice?: number | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
  maxRedemptions?: number | null;
  currentRedemptions: number;
  promoCode?: string | null;
  isActive: boolean;
  createdAt: Date;
}

export enum ProgramStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface ConfigSnapshot {
  durationDays: number;
  coachIntensity: CoachIntensity;
  coachRequired: boolean;
  allowedActionIds: string[];
  checkInConfig: CheckInConfig;
  reportType: ReportType;
}

export interface ProgramInstance {
  id: string;
  userId: string;
  coachId?: string | null;
  templateId: string;
  template: ProgramTemplate;
  variantId?: string | null;
  configSnapshot: ConfigSnapshot;
  status: ProgramStatus;
  currentDay: number;
  startedAt?: Date | null;
  completedAt?: Date | null;
  paidAt?: Date | null;
  paidAmount?: number | null;
  paymentRef?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ═══════════════════════════════════════════════════════════
// ACTION TYPES
// ═══════════════════════════════════════════════════════════

export enum ActionCategory {
  LIGHT = 'LIGHT',
  ROUTINE = 'ROUTINE',
  ENVIRONMENT = 'ENVIRONMENT',
  MINDSET = 'MINDSET',
  NUTRITION = 'NUTRITION',
  MOVEMENT = 'MOVEMENT',
}

export enum ActionTiming {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING',
  BEDTIME = 'BEDTIME',
  ANYTIME = 'ANYTIME',
}

export interface DailyActionTemplate {
  id: string;
  titleKey: string;
  descriptionKey: string;
  category: ActionCategory;
  difficulty: number;
  timingHint?: ActionTiming | null;
  isActive: boolean;
  sortOrder: number;
}

export interface ProgramDay {
  id: string;
  programInstanceId: string;
  dayNumber: number;
  date: Date;
  actionTemplateId?: string | null;
  actionTemplate?: DailyActionTemplate | null;
  actionCompletedAt?: Date | null;
  checkIn?: DailyCheckIn | null;
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════
// CHECK-IN TYPES
// ═══════════════════════════════════════════════════════════

export enum QuestionType {
  SCALE_1_5 = 'SCALE_1_5',
  BOOLEAN = 'BOOLEAN',
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTI_CHOICE = 'MULTI_CHOICE',
  FREE_TEXT = 'FREE_TEXT',
}

export interface CheckInQuestion {
  id: string;
  slug: string;
  questionKey: string;
  questionType: QuestionType;
  options?: Record<string, unknown> | null;
  metricKey?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface CheckInAnswers {
  [questionSlug: string]: number | boolean | string | string[];
}

export interface DailyCheckIn {
  id: string;
  programDayId: string;
  answers: CheckInAnswers;
  notes?: string | null;
  completedAt: Date;
}

// ═══════════════════════════════════════════════════════════
// SLEEP DATA TYPES
// ═══════════════════════════════════════════════════════════

export enum SleepDataSource {
  MANUAL = 'MANUAL',
  GOOGLE_FIT = 'GOOGLE_FIT',
  FITBIT = 'FITBIT',
  APPLE_HEALTH = 'APPLE_HEALTH',
}

export interface SleepSessionNormalized {
  id: string;
  userId: string;
  source: SleepDataSource;
  externalId?: string | null;
  date: Date;
  bedtimeStart: Date;
  bedtimeEnd: Date;
  totalSleepTime: number; // minutes
  sleepOnsetLatency?: number | null;
  wakeAfterSleepOnset?: number | null;
  awakenings?: number | null;
  deepSleepMins?: number | null;
  remSleepMins?: number | null;
  lightSleepMins?: number | null;
  subjectiveQuality?: number | null;
  syncedAt: Date;
}

// ═══════════════════════════════════════════════════════════
// REPORT TYPES
// ═══════════════════════════════════════════════════════════

export interface ProgramReport {
  id: string;
  programInstanceId: string;
  baselineTST?: number | null;
  endTST?: number | null;
  baselineSOL?: number | null;
  endSOL?: number | null;
  baselineAwakenings?: number | null;
  endAwakenings?: number | null;
  tstImprovement?: number | null;
  solImprovement?: number | null;
  awakeningsChange?: number | null;
  streakMax: number;
  checkInRate?: number | null;
  actionCompleteRate?: number | null;
  coachComment?: string | null;
  generatedAt: Date;
}

// ═══════════════════════════════════════════════════════════
// PAYMENT TYPES
// ═══════════════════════════════════════════════════════════

export enum PayoutSplitType {
  COACH_DIRECT = 'COACH_DIRECT',
  SOOMI_ASSIGNED = 'SOOMI_ASSIGNED',
}

export enum LedgerStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PAID_OUT = 'PAID_OUT',
  CANCELLED = 'CANCELLED',
}

export interface LedgerEntry {
  id: string;
  programInstanceId: string;
  coachId?: string | null;
  grossAmount: number;
  coachAmount: number;
  platformAmount: number;
  affiliateAmount: number;
  splitType: PayoutSplitType;
  status: LedgerStatus;
  paidOutAt?: Date | null;
  payoutRef?: string | null;
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════
// COACH NOTES TYPES
// ═══════════════════════════════════════════════════════════

export interface CoachInternalNote {
  id: string;
  coachId: string;
  clientUserId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
