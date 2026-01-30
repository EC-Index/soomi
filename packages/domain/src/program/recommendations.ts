import {
  ProgramTemplate,
  ProgramInstance,
  User,
  ProgramStatus,
  TargetAudience,
} from '@soomi/shared';
import { checkProgramEligibility } from './eligibility';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface ProgramRecommendation {
  templateSlug: string;
  score: number;
  reasonKey: string;
  priority: 'primary' | 'secondary' | 'alternative';
}

export interface RecommendationContext {
  user: User;
  templates: ProgramTemplate[];
  completedPrograms: ProgramInstance[];
  activeProgram: ProgramInstance | null;
  sleepScore?: number;
  daysSinceLastProgram?: number;
  hasCoachRecommendation?: boolean;
}

export interface RecommendationConfig {
  maxRecommendations?: number;
  includeNonPublic?: boolean;
  boostNewUserPrograms?: boolean;
  boostPremiumForGoodSleep?: boolean;
}

const DEFAULT_CONFIG: Required<RecommendationConfig> = {
  maxRecommendations: 3,
  includeNonPublic: false,
  boostNewUserPrograms: true,
  boostPremiumForGoodSleep: false,
};

// ═══════════════════════════════════════════════════════════
// SCORING WEIGHTS
// ═══════════════════════════════════════════════════════════

const WEIGHTS = {
  BASE_SCORE: 50,
  NEW_USER_KICKSTART_BOOST: 40,
  NEW_USER_FULL_PROGRAM_BOOST: 30,
  RETURNING_USER_REPEAT_BOOST: 35,
  RETURNING_USER_PREMIUM_BOOST: 25,
  POOR_SLEEP_FULL_PROGRAM: 45,
  MODERATE_SLEEP_KICKSTART: 20,
  GOOD_SLEEP_PREMIUM: 15,
  RECENT_COMPLETION_PENALTY: -20,
  LONG_GAP_BOOST: 15,
  BUDGET_OPTION_BOOST: 10,
  COACH_RECOMMENDED_BOOST: 30,
} as const;

// ═══════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════

export function recommendPrograms(
  context: RecommendationContext,
  config: RecommendationConfig = {}
): ProgramRecommendation[] {
  const {
    user,
    templates,
    completedPrograms,
    activeProgram,
    sleepScore,
    daysSinceLastProgram,
    hasCoachRecommendation,
  } = context;

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const recommendations: ProgramRecommendation[] = [];

  const completedCount = completedPrograms.filter(
    (p) => p.status === ProgramStatus.COMPLETED
  ).length;
  const isNewUser = completedCount === 0;
  const hasCompletedSleepReset = completedPrograms.some(
    (p) => p.template.slug === 'sleep-reset-14' && p.status === ProgramStatus.COMPLETED
  );

  for (const template of templates) {
    if (!template.isActive) continue;
    if (!template.isPublic && !mergedConfig.includeNonPublic) continue;

    const eligibility = checkProgramEligibility({
      user,
      template,
      completedPrograms,
      activeProgram,
      hasCoachRecommendation,
    });

    if (!eligibility.eligible) continue;

    let score = WEIGHTS.BASE_SCORE;
    let reasonKey = 'programs.recommend.default';

    // User-Status basiertes Scoring
    if (isNewUser) {
      if (template.slug === 'sleep-kickstart-7') {
        score += WEIGHTS.NEW_USER_KICKSTART_BOOST;
        reasonKey = 'programs.recommend.kickstart_new_user';
      } else if (template.slug === 'sleep-reset-14') {
        score += WEIGHTS.NEW_USER_FULL_PROGRAM_BOOST;
        reasonKey = 'programs.recommend.reset_new_user';
      }
    } else {
      if (template.slug === 'repeat-reset-10' && hasCompletedSleepReset) {
        score += WEIGHTS.RETURNING_USER_REPEAT_BOOST;
        reasonKey = 'programs.recommend.repeat_returning';
      } else if (template.slug === 'deep-reset-28' && hasCompletedSleepReset) {
        score += WEIGHTS.RETURNING_USER_PREMIUM_BOOST;
        reasonKey = 'programs.recommend.deep_after_reset';
      }
    }

    // Sleep Score basiertes Scoring
    if (sleepScore !== undefined) {
      if (sleepScore > 60) {
        if (template.slug === 'sleep-reset-14') {
          score += WEIGHTS.POOR_SLEEP_FULL_PROGRAM;
          reasonKey = 'programs.recommend.reset_poor_sleep';
        }
      } else if (sleepScore >= 30 && sleepScore <= 60) {
        if (template.slug === 'sleep-kickstart-7') {
          score += WEIGHTS.MODERATE_SLEEP_KICKSTART;
          reasonKey = 'programs.recommend.kickstart_moderate';
        }
      } else if (sleepScore < 30 && mergedConfig.boostPremiumForGoodSleep) {
        if (template.slug === 'deep-reset-28') {
          score += WEIGHTS.GOOD_SLEEP_PREMIUM;
          reasonKey = 'programs.recommend.deep_optimize';
        }
      }
    }

    // Zeit seit letztem Programm
    if (daysSinceLastProgram !== undefined && !isNewUser) {
      if (daysSinceLastProgram < 30) {
        if (!template.isRepeatProgram) {
          score += WEIGHTS.RECENT_COMPLETION_PENALTY;
        }
      } else if (daysSinceLastProgram > 90) {
        score += WEIGHTS.LONG_GAP_BOOST;
        if (template.slug === 'repeat-reset-10') {
          reasonKey = 'programs.recommend.repeat_after_gap';
        }
      }
    }

    // Coach-Empfehlung
    if (hasCoachRecommendation && template.targetAudience === TargetAudience.COACH_RECOMMENDED) {
      score += WEIGHTS.COACH_RECOMMENDED_BOOST;
      reasonKey = 'programs.recommend.coach_recommended';
    }

    // Budget-Option
    const cheapestPrice = Math.min(...templates.map((t) => t.priceEuroCents));
    if (template.priceEuroCents === cheapestPrice) {
      score += WEIGHTS.BUDGET_OPTION_BOOST;
    }

    // Score normalisieren
    score = Math.max(0, Math.min(100, score));

    recommendations.push({
      templateSlug: template.slug,
      score,
      reasonKey,
      priority: 'secondary',
    });
  }

  // Sortieren nach Score
  recommendations.sort((a, b) => b.score - a.score);

  // Priority setzen
  if (recommendations.length > 0) {
    recommendations[0].priority = 'primary';
  }
  for (let i = 1; i < Math.min(2, recommendations.length); i++) {
    recommendations[i].priority = 'secondary';
  }
  for (let i = 2; i < recommendations.length; i++) {
    recommendations[i].priority = 'alternative';
  }

  return recommendations.slice(0, mergedConfig.maxRecommendations);
}

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

export function getBestRecommendation(
  context: RecommendationContext
): ProgramRecommendation | null {
  const recommendations = recommendPrograms(context, { maxRecommendations: 1 });
  return recommendations.length > 0 ? recommendations[0] : null;
}

export function getPaywallRecommendations(
  context: Omit<RecommendationContext, 'sleepScore'> & { sleepScore: number }
): ProgramRecommendation[] {
  return recommendPrograms(
    { ...context },
    {
      maxRecommendations: 2,
      boostNewUserPrograms: true,
    }
  );
}
