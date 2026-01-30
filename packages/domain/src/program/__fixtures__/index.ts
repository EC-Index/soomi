import {
  ProgramTemplate,
  ProgramInstance,
  User,
  CoachIntensity,
  ReportType,
  TargetAudience,
  ProgramStatus,
  CoachStyle,
  CoachStatus,
} from '@soomi/shared';

// ═══════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════

export const createUser = (overrides: Partial<User> = {}): User => ({
  id: 'user_1',
  email: 'test@example.com',
  locale: 'de-DE',
  timezone: 'Europe/Berlin',
  dataConsentAt: new Date('2025-01-01'),
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
});

export const newUser = createUser({ id: 'user_new' });

export const returningUser = createUser({
  id: 'user_returning',
  createdAt: new Date('2024-06-01'),
});

// ═══════════════════════════════════════════════════════════
// PROGRAM TEMPLATES
// ═══════════════════════════════════════════════════════════

export const createTemplate = (overrides: Partial<ProgramTemplate> = {}): ProgramTemplate => ({
  id: 'template_1',
  slug: 'test-program',
  nameKey: 'programs.test.name',
  descriptionKey: 'programs.test.description',
  shortDescKey: 'programs.test.short',
  durationDays: 14,
  coachRequired: true,
  coachIntensity: CoachIntensity.DAILY,
  priceEuroCents: 19900,
  coachDirectSplit: 80,
  soomiAssignedSplit: 50,
  allowedActionIds: ['action_1', 'action_2'],
  checkInConfig: {
    questions: ['sleep_quality', 'energy_level'],
    allowNotes: true,
  },
  reportType: ReportType.STANDARD,
  targetAudience: TargetAudience.ALL,
  isRepeatProgram: false,
  prerequisiteSlug: null,
  isActive: true,
  isPublic: true,
  sortOrder: 1,
  availableFrom: null,
  availableUntil: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
});

// Konkrete Programme
export const sleepReset14 = createTemplate({
  id: 'template_reset_14',
  slug: 'sleep-reset-14',
  nameKey: 'programs.sleep_reset_14.name',
  durationDays: 14,
  coachRequired: true,
  coachIntensity: CoachIntensity.DAILY,
  priceEuroCents: 19900,
  targetAudience: TargetAudience.ALL,
  sortOrder: 1,
});

export const kickstart7 = createTemplate({
  id: 'template_kickstart_7',
  slug: 'sleep-kickstart-7',
  nameKey: 'programs.kickstart_7.name',
  durationDays: 7,
  coachRequired: false,
  coachIntensity: CoachIntensity.NONE,
  priceEuroCents: 4900,
  targetAudience: TargetAudience.NEW_USERS,
  sortOrder: 0,
});

export const deepReset28 = createTemplate({
  id: 'template_deep_28',
  slug: 'deep-reset-28',
  nameKey: 'programs.deep_reset_28.name',
  durationDays: 28,
  coachRequired: true,
  coachIntensity: CoachIntensity.INTENSIVE,
  priceEuroCents: 34900,
  targetAudience: TargetAudience.ALL,
  sortOrder: 2,
});

export const repeatReset10 = createTemplate({
  id: 'template_repeat_10',
  slug: 'repeat-reset-10',
  nameKey: 'programs.repeat_reset_10.name',
  durationDays: 10,
  coachRequired: true,
  coachIntensity: CoachIntensity.LIGHT,
  priceEuroCents: 14900,
  targetAudience: TargetAudience.RETURNING_USERS,
  isRepeatProgram: true,
  prerequisiteSlug: 'sleep-reset-14',
  isPublic: false,
  sortOrder: 3,
});

export const inactiveProgram = createTemplate({
  id: 'template_inactive',
  slug: 'inactive-program',
  isActive: false,
});

export const futureProgram = createTemplate({
  id: 'template_future',
  slug: 'future-program',
  availableFrom: new Date('2026-01-01'),
});

export const expiredProgram = createTemplate({
  id: 'template_expired',
  slug: 'expired-program',
  availableUntil: new Date('2024-12-31'),
});

export const coachRecommendedOnly = createTemplate({
  id: 'template_coach_only',
  slug: 'coach-recommended-only',
  targetAudience: TargetAudience.COACH_RECOMMENDED,
  isPublic: false,
});

// Alle verfügbaren Templates
export const allTemplates: ProgramTemplate[] = [
  sleepReset14,
  kickstart7,
  deepReset28,
  repeatReset10,
];

// ═══════════════════════════════════════════════════════════
// PROGRAM INSTANCES
// ═══════════════════════════════════════════════════════════

export const createInstance = (overrides: Partial<ProgramInstance> = {}): ProgramInstance => ({
  id: 'instance_1',
  userId: 'user_1',
  coachId: 'coach_1',
  templateId: 'template_reset_14',
  template: sleepReset14,
  variantId: null,
  configSnapshot: {
    durationDays: 14,
    coachIntensity: CoachIntensity.DAILY,
    coachRequired: true,
    allowedActionIds: sleepReset14.allowedActionIds,
    checkInConfig: sleepReset14.checkInConfig,
    reportType: sleepReset14.reportType,
  },
  status: ProgramStatus.COMPLETED,
  currentDay: 14,
  startedAt: new Date('2025-01-01'),
  completedAt: new Date('2025-01-14'),
  paidAt: new Date('2025-01-01'),
  paidAmount: 19900,
  paymentRef: 'pay_123',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-14'),
  ...overrides,
});

export const completedSleepReset = createInstance({
  id: 'instance_completed_reset',
  templateId: sleepReset14.id,
  template: sleepReset14,
  status: ProgramStatus.COMPLETED,
});

export const activeInstance = createInstance({
  id: 'instance_active',
  status: ProgramStatus.ACTIVE,
  currentDay: 7,
  completedAt: null,
});

export const pendingPaymentInstance = createInstance({
  id: 'instance_pending',
  status: ProgramStatus.PENDING_PAYMENT,
  currentDay: 0,
  startedAt: null,
  completedAt: null,
  paidAt: null,
});

export const cancelledInstance = createInstance({
  id: 'instance_cancelled',
  status: ProgramStatus.CANCELLED,
});
