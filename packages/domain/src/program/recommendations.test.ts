import { describe, it, expect } from 'vitest';
import {
  recommendPrograms,
  getBestRecommendation,
  getPaywallRecommendations,
  RecommendationContext,
} from './recommendations';
import {
  newUser,
  returningUser,
  sleepReset14,
  kickstart7,
  deepReset28,
  repeatReset10,
  completedSleepReset,
  activeInstance,
  createInstance,
  allTemplates,
  inactiveProgram,
  expiredProgram,
} from './__fixtures__';
import { ProgramStatus } from '@soomi/shared';

describe('recommendPrograms', () => {
  // ═══════════════════════════════════════════════════════════
  // NEW USER SCENARIOS
  // ═══════════════════════════════════════════════════════════

  describe('Neuer User', () => {
    const baseContext: RecommendationContext = {
      user: newUser,
      templates: allTemplates,
      completedPrograms: [],
      activeProgram: null,
    };

    it('sollte Kickstart als Top-Empfehlung für neuen User', () => {
      const recommendations = recommendPrograms(baseContext);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].templateSlug).toBe('sleep-kickstart-7');
      expect(recommendations[0].priority).toBe('primary');
      expect(recommendations[0].reasonKey).toBe('programs.recommend.kickstart_new_user');
    });

    it('sollte Sleep Reset als zweite Empfehlung', () => {
      const recommendations = recommendPrograms(baseContext);

      const sleepResetRec = recommendations.find(
        (r) => r.templateSlug === 'sleep-reset-14'
      );
      expect(sleepResetRec).toBeDefined();
      expect(sleepResetRec!.priority).toBe('secondary');
    });

    it('sollte Repeat Reset NICHT empfehlen', () => {
      const recommendations = recommendPrograms(baseContext);

      const repeatRec = recommendations.find(
        (r) => r.templateSlug === 'repeat-reset-10'
      );
      expect(repeatRec).toBeUndefined();
    });

    it('sollte maximal 3 Empfehlungen zurückgeben (default)', () => {
      const recommendations = recommendPrograms(baseContext);

      expect(recommendations.length).toBeLessThanOrEqual(3);
    });

    it('sollte Sleep Reset priorisieren bei schlechtem Schlaf', () => {
      const contextWithPoorSleep: RecommendationContext = {
        ...baseContext,
        sleepScore: 75,
      };

      const recommendations = recommendPrograms(contextWithPoorSleep);

      expect(recommendations[0].templateSlug).toBe('sleep-reset-14');
      expect(recommendations[0].reasonKey).toBe('programs.recommend.reset_poor_sleep');
    });

    it('sollte Kickstart bei moderatem Schlaf bevorzugen', () => {
      const contextWithModerateSleep: RecommendationContext = {
        ...baseContext,
        sleepScore: 45,
      };

      const recommendations = recommendPrograms(contextWithModerateSleep);

      const kickstartRec = recommendations.find(
        (r) => r.templateSlug === 'sleep-kickstart-7'
      );
      expect(kickstartRec).toBeDefined();
      expect(kickstartRec!.score).toBeGreaterThan(60);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // RETURNING USER SCENARIOS
  // ═══════════════════════════════════════════════════════════

  describe('Returning User (nach Sleep Reset)', () => {
    const baseContext: RecommendationContext = {
      user: returningUser,
      templates: allTemplates,
      completedPrograms: [completedSleepReset],
      activeProgram: null,
    };

    it('sollte Repeat Reset empfehlen', () => {
      const recommendations = recommendPrograms(baseContext);

      const repeatRec = recommendations.find(
        (r) => r.templateSlug === 'repeat-reset-10'
      );
      expect(repeatRec).toBeDefined();
      expect(repeatRec!.reasonKey).toBe('programs.recommend.repeat_returning');
    });

    it('sollte Deep Reset als Premium-Option empfehlen', () => {
      const recommendations = recommendPrograms(baseContext);

      const deepRec = recommendations.find(
        (r) => r.templateSlug === 'deep-reset-28'
      );
      expect(deepRec).toBeDefined();
      expect(deepRec!.reasonKey).toBe('programs.recommend.deep_after_reset');
    });

    it('sollte Kickstart NICHT empfehlen (NEW_USERS only)', () => {
      const recommendations = recommendPrograms(baseContext);

      const kickstartRec = recommendations.find(
        (r) => r.templateSlug === 'sleep-kickstart-7'
      );
      expect(kickstartRec).toBeUndefined();
    });

    it('sollte Sleep Reset NICHT empfehlen (already completed)', () => {
      const recommendations = recommendPrograms(baseContext);

      const resetRec = recommendations.find(
        (r) => r.templateSlug === 'sleep-reset-14'
      );
      expect(resetRec).toBeUndefined();
    });

    it('sollte Penalty anwenden wenn kürzlich abgeschlossen', () => {
      const contextRecentCompletion: RecommendationContext = {
        ...baseContext,
        daysSinceLastProgram: 15,
      };

      const recommendations = recommendPrograms(contextRecentCompletion);

      const deepRec = recommendations.find(
        (r) => r.templateSlug === 'deep-reset-28'
      );

      const contextNoRecent: RecommendationContext = {
        ...baseContext,
        daysSinceLastProgram: undefined,
      };
      const recsNoRecent = recommendPrograms(contextNoRecent);
      const deepRecNoRecent = recsNoRecent.find(
        (r) => r.templateSlug === 'deep-reset-28'
      );

      if (deepRec && deepRecNoRecent) {
        expect(deepRec.score).toBeLessThan(deepRecNoRecent.score);
      }
    });

    it('sollte Boost anwenden wenn lange her (>90 Tage)', () => {
      const contextLongGap: RecommendationContext = {
        ...baseContext,
        daysSinceLastProgram: 120,
      };

      const recommendations = recommendPrograms(contextLongGap);

      const repeatRec = recommendations.find(
        (r) => r.templateSlug === 'repeat-reset-10'
      );
      expect(repeatRec).toBeDefined();
      expect(repeatRec!.reasonKey).toBe('programs.recommend.repeat_after_gap');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // ACTIVE PROGRAM
  // ═══════════════════════════════════════════════════════════

  describe('User mit aktivem Programm', () => {
    it('sollte keine Empfehlungen zurückgeben', () => {
      const context: RecommendationContext = {
        user: newUser,
        templates: allTemplates,
        completedPrograms: [],
        activeProgram: activeInstance,
      };

      const recommendations = recommendPrograms(context);

      expect(recommendations).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // SLEEP SCORE SCENARIOS
  // ═══════════════════════════════════════════════════════════

  describe('Sleep Score basierte Empfehlungen', () => {
    it('sollte bei sehr schlechtem Schlaf (>80) volles Programm stark pushen', () => {
      const context: RecommendationContext = {
        user: newUser,
        templates: allTemplates,
        completedPrograms: [],
        activeProgram: null,
        sleepScore: 85,
      };

      const recommendations = recommendPrograms(context);

      expect(recommendations[0].templateSlug).toBe('sleep-reset-14');
      expect(recommendations[0].score).toBeGreaterThan(80);
    });

    it('sollte bei gutem Schlaf (<30) Deep Reset für Optimierung vorschlagen', () => {
      const context: RecommendationContext = {
        user: returningUser,
        templates: allTemplates,
        completedPrograms: [completedSleepReset],
        activeProgram: null,
        sleepScore: 20,
      };

      const recommendations = recommendPrograms(context, {
        boostPremiumForGoodSleep: true,
      });

      const deepRec = recommendations.find(
        (r) => r.templateSlug === 'deep-reset-28'
      );
      expect(deepRec).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════

  describe('Konfiguration', () => {
    const baseContext: RecommendationContext = {
      user: newUser,
      templates: allTemplates,
      completedPrograms: [],
      activeProgram: null,
    };

    it('sollte maxRecommendations respektieren', () => {
      const recommendations = recommendPrograms(baseContext, {
        maxRecommendations: 1,
      });

      expect(recommendations).toHaveLength(1);
    });

    it('sollte nicht-öffentliche Programme ausschließen (default)', () => {
      const templatesWithPrivate = [
        ...allTemplates,
        { ...sleepReset14, id: 'private_1', slug: 'private-program', isPublic: false },
      ];

      const context: RecommendationContext = {
        ...baseContext,
        templates: templatesWithPrivate,
      };

      const recommendations = recommendPrograms(context);

      const privateRec = recommendations.find(
        (r) => r.templateSlug === 'private-program'
      );
      expect(privateRec).toBeUndefined();
    });

    it('sollte nicht-öffentliche Programme einschließen wenn konfiguriert', () => {
      const privateTemplate = {
        ...sleepReset14,
        id: 'private_1',
        slug: 'private-program',
        isPublic: false,
        isActive: true,
      };

      const context: RecommendationContext = {
        ...baseContext,
        templates: [...allTemplates, privateTemplate],
      };

      const recommendations = recommendPrograms(context, {
        includeNonPublic: true,
      });

      const privateRec = recommendations.find(
        (r) => r.templateSlug === 'private-program'
      );
      expect(privateRec).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // PRIORITY ASSIGNMENT
  // ═══════════════════════════════════════════════════════════

  describe('Priority Zuweisung', () => {
    it('sollte primary nur einmal vergeben', () => {
      const context: RecommendationContext = {
        user: newUser,
        templates: allTemplates,
        completedPrograms: [],
        activeProgram: null,
      };

      const recommendations = recommendPrograms(context);

      const primaryCount = recommendations.filter(
        (r) => r.priority === 'primary'
      ).length;
      expect(primaryCount).toBe(1);
    });

    it('sollte korrekte Priority-Reihenfolge haben', () => {
      const context: RecommendationContext = {
        user: newUser,
        templates: allTemplates,
        completedPrograms: [],
        activeProgram: null,
      };

      const recommendations = recommendPrograms(context, {
        maxRecommendations: 5,
      });

      if (recommendations.length >= 1) {
        expect(recommendations[0].priority).toBe('primary');
      }
      if (recommendations.length >= 2) {
        expect(recommendations[1].priority).toBe('secondary');
      }
      if (recommendations.length >= 3) {
        expect(recommendations[2].priority).toBe('alternative');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════
  // EDGE CASES
  // ═══════════════════════════════════════════════════════════

  describe('Edge Cases', () => {
    it('sollte leeres Array zurückgeben wenn keine Templates', () => {
      const context: RecommendationContext = {
        user: newUser,
        templates: [],
        completedPrograms: [],
        activeProgram: null,
      };

      const recommendations = recommendPrograms(context);

      expect(recommendations).toHaveLength(0);
    });

    it('sollte leeres Array zurückgeben wenn alle inaktiv', () => {
      const inactiveTemplates = allTemplates.map((t) => ({
        ...t,
        isActive: false,
      }));

      const context: RecommendationContext = {
        user: newUser,
        templates: inactiveTemplates,
        completedPrograms: [],
        activeProgram: null,
      };

      const recommendations = recommendPrograms(context);

      expect(recommendations).toHaveLength(0);
    });

    it('sollte Score zwischen 0 und 100 normalisieren', () => {
      const context: RecommendationContext = {
        user: newUser,
        templates: allTemplates,
        completedPrograms: [],
        activeProgram: null,
        sleepScore: 100,
      };

      const recommendations = recommendPrograms(context);

      for (const rec of recommendations) {
        expect(rec.score).toBeGreaterThanOrEqual(0);
        expect(rec.score).toBeLessThanOrEqual(100);
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

describe('getBestRecommendation', () => {
  it('sollte die beste Empfehlung zurückgeben', () => {
    const context: RecommendationContext = {
      user: newUser,
      templates: allTemplates,
      completedPrograms: [],
      activeProgram: null,
    };

    const best = getBestRecommendation(context);

    expect(best).not.toBeNull();
    expect(best!.priority).toBe('primary');
  });

  it('sollte null zurückgeben wenn keine Empfehlungen', () => {
    const context: RecommendationContext = {
      user: newUser,
      templates: [],
      completedPrograms: [],
      activeProgram: null,
    };

    const best = getBestRecommendation(context);

    expect(best).toBeNull();
  });
});

describe('getPaywallRecommendations', () => {
  it('sollte maximal 2 Empfehlungen für Paywall zurückgeben', () => {
    const context = {
      user: newUser,
      templates: allTemplates,
      completedPrograms: [],
      activeProgram: null,
      sleepScore: 70,
    };

    const recommendations = getPaywallRecommendations(context);

    expect(recommendations.length).toBeLessThanOrEqual(2);
  });

  it('sollte Sleep Reset bei schlechtem Schlaf priorisieren', () => {
    const context = {
      user: newUser,
      templates: allTemplates,
      completedPrograms: [],
      activeProgram: null,
      sleepScore: 80,
    };

    const recommendations = getPaywallRecommendations(context);

    expect(recommendations[0].templateSlug).toBe('sleep-reset-14');
  });
});
