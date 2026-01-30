// ═══════════════════════════════════════════════════════════
// SOOMI CONFIGURATION CONSTANTS
// ═══════════════════════════════════════════════════════════

export const CONFIG = {
  // Attribution
  ATTRIBUTION_WINDOW_DAYS: 90,
  
  // Lead Routing
  LEAD_REQUEST_TIMEOUT_HOURS: 48,
  
  // Programs
  DEFAULT_PROGRAM_SLUG: 'sleep-reset-14',
  
  // Pricing (in cents)
  SLEEP_RESET_14_PRICE: 19900,
  
  // Revenue Split (percentages)
  COACH_DIRECT_SPLIT: 80,
  SOOMI_ASSIGNED_SPLIT: 50,
  
  // Limits
  MAX_COACH_CLIENTS: 50,
  MAX_INTERNAL_NOTE_LENGTH: 500,
  MAX_REPORT_COMMENT_LENGTH: 500,
  MAX_CHECKIN_NOTES_LENGTH: 500,
  
  // Check-in
  CHECKIN_ESTIMATED_SECONDS: 30,
} as const;

export const SLEEP_THRESHOLDS = {
  // Total Sleep Time (minutes)
  TST_POOR: 360,      // < 6 hours
  TST_FAIR: 420,      // 6-7 hours
  TST_GOOD: 480,      // 7-8 hours
  TST_OPTIMAL: 540,   // 8-9 hours
  
  // Sleep Onset Latency (minutes)
  SOL_GOOD: 15,
  SOL_FAIR: 30,
  SOL_POOR: 45,
  
  // Awakenings
  AWAKENINGS_GOOD: 1,
  AWAKENINGS_FAIR: 3,
  AWAKENINGS_POOR: 5,
} as const;

export const PAYWALL_CONFIG = {
  // Score thresholds
  SOFT_OFFER_MAX: 40,
  MEDIUM_OFFER_MAX: 70,
  // Above 70 = hard offer
  
  // Scoring weights
  WEIGHTS: {
    TST: 25,
    SOL: 20,
    AWAKENINGS: 15,
    STABILITY: 15,
    SUBJECTIVE: 10,
    PHONE_TRIGGER: 10,
    CAFFEINE_TRIGGER: 5,
  },
} as const;
