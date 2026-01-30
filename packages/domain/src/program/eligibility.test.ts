import { describe, it, expect } from 'vitest';
import {
  checkProgramEligibility,
  checkMultipleProgramEligibility,
  filterEligiblePrograms,
} from './eligibility';
import {
  newUser,
  returningUser,
  sleepReset14,
  kickstart7,
  deepReset28,
  repeatReset10,
  inactiveProgram,
  futureProgram,
  expiredProgram,
  coachRecommendedOnly,
  completedSleepReset,
  activeInstance,
  cancelledInstance,
  createTemplate,
  createInstance,
  allTemplates,
} from './__fixtures__';
import { ProgramStatus, TargetAudience } from '@soomi/shared';

describe('checkProgramEligibility', () => {
  // ═══════════════════════════════════════════════════════════
  // BASIC ELIGIBILITY
  // ═══════════════════════════════════════════════════════════

  describe('Basis-Szenarien', () => {
    it('sollte eligible sein für neuen User ohne aktives Programm', () => {
      const result = checkProgramEligibility({
        user: newUser,
        template: sleepReset14,
        completedPrograms: [],
        activeProgram: null,
      });

      expect(result.eligible).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });

    it('sollte NICHT eligible sein wenn Programm inaktiv', () => {
      const result = checkProgramEligibility({
        user: newUser,
        template: inactiveProgram,
        completedPrograms: [],
        activeProgram: null,
      });

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain('program_inactive');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // ACTIVE PROGRAM
  // ═══════════════════════════════════════════════════════════

  describe('Aktives Programm', () => {
    it('sollte NICHT eligible sein wenn User aktives Programm hat', () => {
      const result = checkProgramEligibility({
        user: newUser,
        template: sleepReset14,
        completedPrograms: [],
        activeProgram: activeInstance,
      });

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain('active_program_exists');
    });

    it('sollte eligible sein wenn Programm nur PENDING_PAYMENT', () => {
      const pendingInstance = createInstance({
        status: ProgramStatus.PENDING_PAYMENT,
      });

      const result = checkProgramEligibility({
        user: newUser,
        template: sleepReset14,
        completedPrograms: [],
        activeProgram: pendingInstance,
      });

      expect(result.eligible).toBe(true);
    });

    it('sollte eligible sein wenn vorheriges Programm CANCELLED', () => {
      const result = checkProgramEligibility({
        user: newUser,
        template: sleepReset14,
        completedPrograms: [cancelledInstance],
        activeProgram: null,
      });

      expect(result.eligible).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TARGET AUDIENCE
  // ═══════════════════════════════════════════════════════════

  describe('Target Audience', () => {
    describe('NEW_USERS', () => {
      it('sollte eligible sein für neuen User', () => {
        const result = checkProgramEligibility({
          user: newUser,
          template: kickstart7,
          completedPrograms: [],
          activeProgram: null,
        });

        expect(result.eligible).toBe(true);
      });

      it('sollte NICHT eligible sein für User mit abgeschlossenem Programm', () => {
        const result = checkProgramEligibility({
          user: returningUser,
          template: kickstart7,
          completedPrograms: [completedSleepReset],
          activeProgram: null,
        });

        expect(result.eligible).toBe(false);
        expect(result.reasons).toContain('program_for_new_users_only');
      });

      it('sollte eligible sein wenn nur cancelled Programm existiert', () => {
        const result = checkProgramEligibility({
          user: newUser,
          template: kickstart7,
          completedPrograms: [cancelledInstance],
          activeProgram: null,
        });

        expect(result.eligible).toBe(true);
      });
    });

    describe('RETURNING_USERS', () => {
      it('sollte NICHT eligible sein für neuen User', () => {
        const result = checkProgramEligibility({
          user: newUser,
          template: repeatReset10,
          completedPrograms: [],
          activeProgram: null,
        });

        expect(result.eligible).toBe(false);
        expect(result.reasons).toContain('program_for_returning_users_only');
      });

      it('sollte eligible sein für User mit abgeschlossenem Programm', () => {
        const result = checkProgramEligibility({
          user: returningUser,
          template: repeatReset10,
          completedPrograms: [completedSleepReset],
          activeProgram: null,
        });

        expect(result.eligible).toBe(true);
      });
    });

    describe('COACH_RECOMMENDED', () => {
      it('sollte NICHT eligible sein ohne Coach-Empfehlung', () => {
        const result = checkProgramEligibility({
          user: newUser,
          template: coachRecommendedOnly,
          completedPrograms: [],
          activeProgram: null,
          hasCoachRecommendation: false,
        });

        expect(result.eligible).toBe(false);
        expect(result.reasons).toContain('coach_recommendation_required');
      });

      it('sollte eligible sein MIT Coach-Empfehlung', () => {
        const coachOnlyButActive = createTemplate({
          ...coachRecommendedOnly,
          isActive: true,
          isPublic: true,
        });

        const result = checkProgramEligibility({
          user: newUser,
          template: coachOnlyButActive,
          completedPrograms: [],
          activeProgram: null,
          hasCoachRecommendation: true,
        });

        expect(result.eligible).toBe(true);
      });
    });

    describe('ALL', () => {
      it('sollte eligible sein für jeden User', () => {
        const result = checkProgramEligibility({
          user: newUser,
          template: sleepReset14,
          completedPrograms: [],
          activeProgram: null,
        });

        expect(result.eligible).toBe(true);
      });

      it('sollte eligible sein für returning User', () => {
        const result = checkProgramEligibility({
          user: returningUser,
          template: deepReset28,
          completedPrograms: [completedSleepReset],
          activeProgram: null,
        });

        expect(result.eligible).toBe(true);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════
  // PREREQUISITES
  // ═══════════════════════════════════════════════════════════

  describe('Prerequisites', () => {
    it('sollte NICHT eligible sein ohne erfülltes Prerequisite', () => {
      const result = checkProgramEligibility({
        user: returningUser,
        template: repeatReset10,
        completedPrograms: [],
        activeProgram: null,
      });

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain('prerequisite_not_completed');
    });

    it('sollte eligible sein MIT erfülltem Prerequisite', () => {
      const result = checkProgramEligibility({
        user: returningUser,
        template: repeatReset10,
        completedPrograms: [completedSleepReset],
        activeProgram: null,
      });

      expect(result.eligible).toBe(true);
    });

    it('sollte NICHT eligible sein wenn Prerequisite nur CANCELLED', () => {
      const cancelledReset = createInstance({
        ...completedSleepReset,
        status: ProgramStatus.CANCELLED,
      });

      const result = checkProgramEligibility({
        user: returningUser,
        template: repeatReset10,
        completedPrograms: [cancelledReset],
        activeProgram: null,
      });

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain('prerequisite_not_completed');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // REPEAT PROGRAMS
  // ═══════════════════════════════════════════════════════════

  describe('Repeat Programs', () => {
    it('sollte NICHT eligible sein als erstes Programm', () => {
      const result = checkProgramEligibility({
        user: newUser,
        template: repeatReset10,
        completedPrograms: [],
        activeProgram: null,
      });

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain('repeat_program_requires_previous');
    });

    it('sollte eligible sein als Folgeprogramm', () => {
      const result = checkProgramEligibility({
        user: returningUser,
        template: repeatReset10,
        completedPrograms: [completedSleepReset],
        activeProgram: null,
      });

      expect(result.eligible).toBe(true);
    });

    it('sollte mehrfach eligible sein (repeat kann wiederholt werden)', () => {
      const completedRepeat = createInstance({
        template: repeatReset10,
        templateId: repeatReset10.id,
        status: ProgramStatus.COMPLETED,
      });

      const result = checkProgramEligibility({
        user: returningUser,
        template: repeatReset10,
        completedPrograms: [completedSleepReset, completedRepeat],
        activeProgram: null,
      });

      expect(result.eligible).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // ALREADY COMPLETED (Non-Repeat)
  // ═══════════════════════════════════════════════════════════

  describe('Already Completed (Non-Repeat)', () => {
    it('sollte NICHT eligible sein wenn bereits abgeschlossen', () => {
      const result = checkProgramEligibility({
        user: returningUser,
        template: sleepReset14,
        completedPrograms: [completedSleepReset],
        activeProgram: null,
      });

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain('already_completed_this_program');
    });

    it('sollte eligible sein wenn anderes Programm abgeschlossen', () => {
      const completedKickstart = createInstance({
        template: kickstart7,
        templateId: kickstart7.id,
        status: ProgramStatus.COMPLETED,
      });

      const result = checkProgramEligibility({
        user: returningUser,
        template: sleepReset14,
        completedPrograms: [completedKickstart],
        activeProgram: null,
      });

      expect(result.eligible).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // AVAILABILITY DATES
  // ═══════════════════════════════════════════════════════════

  describe('Verfügbarkeitszeitraum', () => {
    const now = new Date('2025-06-15');

    it('sollte NICHT eligible sein wenn Programm noch nicht verfügbar', () => {
      const result = checkProgramEligibility({
        user: newUser,
        template: futureProgram,
        completedPrograms: [],
        activeProgram: null,
        currentDate: now,
      });

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain('program_not_yet_available');
    });

    it('sollte NICHT eligible sein wenn Programm abgelaufen', () => {
      const result = checkProgramEligibility({
        user: newUser,
        template: expiredProgram,
        completedPrograms: [],
        activeProgram: null,
        currentDate: now,
      });

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain('program_no_longer_available');
    });

    it('sollte eligible sein innerhalb des Zeitfensters', () => {
      const windowedProgram = createTemplate({
        availableFrom: new Date('2025-01-01'),
        availableUntil: new Date('2025-12-31'),
      });

      const result = checkProgramEligibility({
        user: newUser,
        template: windowedProgram,
        completedPrograms: [],
        activeProgram: null,
        currentDate: now,
      });

      expect(result.eligible).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // MULTIPLE REASONS
  // ═══════════════════════════════════════════════════════════

  describe('Mehrere Gründe', () => {
    it('sollte alle zutreffenden Gründe zurückgeben', () => {
      const result = checkProgramEligibility({
        user: newUser,
        template: repeatReset10,
        completedPrograms: [],
        activeProgram: activeInstance,
      });

      expect(result.eligible).toBe(false);
      expect(result.reasons).toContain('active_program_exists');
      expect(result.reasons).toContain('repeat_program_requires_previous');
      expect(result.reasons).toContain('prerequisite_not_completed');
      expect(result.reasons).toContain('program_for_returning_users_only');
      expect(result.reasons.length).toBeGreaterThanOrEqual(4);
    });
  });
});

// ═══════════════════════════════════════════════════════════
// BATCH ELIGIBILITY
// ═══════════════════════════════════════════════════════════

describe('checkMultipleProgramEligibility', () => {
  it('sollte Eligibility für alle Programme zurückgeben', () => {
    const results = checkMultipleProgramEligibility(
      newUser,
      allTemplates,
      [],
      null
    );

    expect(Object.keys(results)).toHaveLength(allTemplates.length);
    expect(results['sleep-reset-14'].eligible).toBe(true);
    expect(results['sleep-kickstart-7'].eligible).toBe(true);
    expect(results['deep-reset-28'].eligible).toBe(true);
    expect(results['repeat-reset-10'].eligible).toBe(false);
  });

  it('sollte unterschiedliche Ergebnisse für returning User', () => {
    const results = checkMultipleProgramEligibility(
      returningUser,
      allTemplates,
      [completedSleepReset],
      null
    );

    expect(results['sleep-reset-14'].eligible).toBe(false);
    expect(results['sleep-kickstart-7'].eligible).toBe(false);
    expect(results['deep-reset-28'].eligible).toBe(true);
    expect(results['repeat-reset-10'].eligible).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════
// FILTER ELIGIBLE
// ═══════════════════════════════════════════════════════════

describe('filterEligiblePrograms', () => {
  it('sollte nur eligible Programme zurückgeben', () => {
    const eligible = filterEligiblePrograms(newUser, allTemplates, [], null);

    const slugs = eligible.map((t) => t.slug);
    expect(slugs).toContain('sleep-reset-14');
    expect(slugs).toContain('sleep-kickstart-7');
    expect(slugs).toContain('deep-reset-28');
    expect(slugs).not.toContain('repeat-reset-10');
  });

  it('sollte leeres Array zurückgeben wenn nichts eligible', () => {
    const eligible = filterEligiblePrograms(
      newUser,
      [inactiveProgram, expiredProgram],
      [],
      null,
      { currentDate: new Date('2025-06-15') }
    );

    expect(eligible).toHaveLength(0);
  });
});
