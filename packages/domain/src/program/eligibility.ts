import {
  ProgramTemplate,
  ProgramInstance,
  User,
  ProgramStatus,
  TargetAudience,
} from '@soomi/shared';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export type EligibilityReason =
  | 'active_program_exists'
  | 'repeat_program_requires_previous'
  | 'prerequisite_not_completed'
  | 'program_for_new_users_only'
  | 'program_for_returning_users_only'
  | 'program_not_yet_available'
  | 'program_no_longer_available'
  | 'program_inactive'
  | 'program_not_public'
  | 'coach_recommendation_required'
  | 'already_completed_this_program';

export interface EligibilityResult {
  eligible: boolean;
  reasons: EligibilityReason[];
}

export interface EligibilityContext {
  user: User;
  template: ProgramTemplate;
  completedPrograms: ProgramInstance[];
  activeProgram: ProgramInstance | null;
  hasCoachRecommendation?: boolean;
  currentDate?: Date;
}

// ═══════════════════════════════════════════════════════════
// MAIN FUNCTION
// ═══════════════════════════════════════════════════════════

export function checkProgramEligibility(context: EligibilityContext): EligibilityResult {
  const {
    template,
    completedPrograms,
    activeProgram,
    hasCoachRecommendation = false,
    currentDate = new Date(),
  } = context;

  const reasons: EligibilityReason[] = [];

  // ─── 1. Programm-Status prüfen ───
  if (!template.isActive) {
    reasons.push('program_inactive');
  }

  // ─── 2. Aktives Programm? ───
  if (activeProgram && activeProgram.status === ProgramStatus.ACTIVE) {
    reasons.push('active_program_exists');
  }

  // ─── 3. Repeat-Programm? ───
  if (template.isRepeatProgram) {
    const hasCompletedAny = completedPrograms.some(
      (p) => p.status === ProgramStatus.COMPLETED
    );
    if (!hasCompletedAny) {
      reasons.push('repeat_program_requires_previous');
    }
  }

  // ─── 4. Prerequisite? ───
  if (template.prerequisiteSlug) {
    const hasPrerequisite = completedPrograms.some(
      (p) =>
        p.template.slug === template.prerequisiteSlug &&
        p.status === ProgramStatus.COMPLETED
    );
    if (!hasPrerequisite) {
      reasons.push('prerequisite_not_completed');
    }
  }

  // ─── 5. Target Audience ───
  const completedCount = completedPrograms.filter(
    (p) => p.status === ProgramStatus.COMPLETED
  ).length;

  switch (template.targetAudience) {
    case TargetAudience.NEW_USERS:
      if (completedCount > 0) {
        reasons.push('program_for_new_users_only');
      }
      break;

    case TargetAudience.RETURNING_USERS:
      if (completedCount === 0) {
        reasons.push('program_for_returning_users_only');
      }
      break;

    case TargetAudience.COACH_RECOMMENDED:
      if (!hasCoachRecommendation) {
        reasons.push('coach_recommendation_required');
      }
      if (!template.isPublic && !hasCoachRecommendation) {
        reasons.push('program_not_public');
      }
      break;

    case TargetAudience.ALL:
    default:
      break;
  }

  // ─── 6. Verfügbarkeitszeitraum ───
  if (template.availableFrom && currentDate < template.availableFrom) {
    reasons.push('program_not_yet_available');
  }

  if (template.availableUntil && currentDate > template.availableUntil) {
    reasons.push('program_no_longer_available');
  }

  // ─── 7. Bereits abgeschlossen (bei nicht-repeat)? ───
  if (!template.isRepeatProgram) {
    const alreadyCompleted = completedPrograms.some(
      (p) =>
        p.template.slug === template.slug &&
        p.status === ProgramStatus.COMPLETED
    );
    if (alreadyCompleted) {
      reasons.push('already_completed_this_program');
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

// ═══════════════════════════════════════════════════════════
// HELPER: Batch-Check für mehrere Programme
// ═══════════════════════════════════════════════════════════

export interface BatchEligibilityResult {
  [templateSlug: string]: EligibilityResult;
}

export function checkMultipleProgramEligibility(
  user: User,
  templates: ProgramTemplate[],
  completedPrograms: ProgramInstance[],
  activeProgram: ProgramInstance | null,
  options: { currentDate?: Date; hasCoachRecommendation?: boolean } = {}
): BatchEligibilityResult {
  const results: BatchEligibilityResult = {};

  for (const template of templates) {
    results[template.slug] = checkProgramEligibility({
      user,
      template,
      completedPrograms,
      activeProgram,
      ...options,
    });
  }

  return results;
}

// ═══════════════════════════════════════════════════════════
// HELPER: Nur eligible Programme filtern
// ═══════════════════════════════════════════════════════════

export function filterEligiblePrograms(
  user: User,
  templates: ProgramTemplate[],
  completedPrograms: ProgramInstance[],
  activeProgram: ProgramInstance | null,
  options: { currentDate?: Date; hasCoachRecommendation?: boolean } = {}
): ProgramTemplate[] {
  return templates.filter((template) => {
    const result = checkProgramEligibility({
      user,
      template,
      completedPrograms,
      activeProgram,
      ...options,
    });
    return result.eligible;
  });
}
