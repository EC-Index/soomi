export {
  checkProgramEligibility,
  checkMultipleProgramEligibility,
  filterEligiblePrograms,
  type EligibilityResult,
  type EligibilityReason,
  type EligibilityContext,
  type BatchEligibilityResult,
} from './eligibility';

export {
  recommendPrograms,
  getBestRecommendation,
  getPaywallRecommendations,
  type ProgramRecommendation,
  type RecommendationContext,
  type RecommendationConfig,
} from './recommendations';
