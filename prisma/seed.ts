import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ═══════════════════════════════════════════════════════════
  // CHECK-IN QUESTIONS
  // ═══════════════════════════════════════════════════════════

  console.log('  Creating check-in questions...');

  await prisma.checkInQuestion.createMany({
    data: [
      {
        id: 'q_sleep_quality',
        slug: 'sleep_quality',
        questionKey: 'checkin.q_sleep_quality',
        questionType: 'SCALE_1_5',
        options: { min: 1, max: 5, labels: { 1: 'checkin.quality_1', 5: 'checkin.quality_5' } },
        metricKey: 'subjectiveQuality',
        sortOrder: 1,
      },
      {
        id: 'q_energy_level',
        slug: 'energy_level',
        questionKey: 'checkin.q_energy',
        questionType: 'SCALE_1_5',
        options: { min: 1, max: 5 },
        metricKey: 'energyLevel',
        sortOrder: 2,
      },
      {
        id: 'q_mood_level',
        slug: 'mood_level',
        questionKey: 'checkin.q_mood',
        questionType: 'SCALE_1_5',
        options: { min: 1, max: 5 },
        metricKey: 'moodLevel',
        sortOrder: 3,
      },
      {
        id: 'q_phone_in_bed',
        slug: 'phone_in_bed',
        questionKey: 'checkin.q_phone_bed',
        questionType: 'BOOLEAN',
        metricKey: 'phoneInBed',
        sortOrder: 4,
      },
      {
        id: 'q_caffeine_after_14',
        slug: 'caffeine_after_14',
        questionKey: 'checkin.q_caffeine',
        questionType: 'BOOLEAN',
        metricKey: 'caffeineAfter14',
        sortOrder: 5,
      },
    ],
    skipDuplicates: true,
  });

  // ═══════════════════════════════════════════════════════════
  // DAILY ACTIONS
  // ═══════════════════════════════════════════════════════════

  console.log('  Creating daily action templates...');

  await prisma.dailyActionTemplate.createMany({
    data: [
      {
        id: 'action_no_phone',
        titleKey: 'actions.no_phone_bed_title',
        descriptionKey: 'actions.no_phone_bed_desc',
        category: 'ENVIRONMENT',
        difficulty: 1,
        timingHint: 'BEDTIME',
        sortOrder: 1,
      },
      {
        id: 'action_no_caffeine',
        titleKey: 'actions.no_caffeine_title',
        descriptionKey: 'actions.no_caffeine_desc',
        category: 'NUTRITION',
        difficulty: 1,
        timingHint: 'AFTERNOON',
        sortOrder: 2,
      },
      {
        id: 'action_morning_light',
        titleKey: 'actions.morning_light_title',
        descriptionKey: 'actions.morning_light_desc',
        category: 'LIGHT',
        difficulty: 1,
        timingHint: 'MORNING',
        sortOrder: 3,
      },
      {
        id: 'action_cool_bedroom',
        titleKey: 'actions.cool_bedroom_title',
        descriptionKey: 'actions.cool_bedroom_desc',
        category: 'ENVIRONMENT',
        difficulty: 1,
        timingHint: 'EVENING',
        sortOrder: 4,
      },
      {
        id: 'action_wind_down',
        titleKey: 'actions.wind_down_title',
        descriptionKey: 'actions.wind_down_desc',
        category: 'ROUTINE',
        difficulty: 2,
        timingHint: 'EVENING',
        sortOrder: 5,
      },
      {
        id: 'action_consistent_wake',
        titleKey: 'actions.consistent_wake_title',
        descriptionKey: 'actions.consistent_wake_desc',
        category: 'ROUTINE',
        difficulty: 2,
        timingHint: 'MORNING',
        sortOrder: 6,
      },
      {
        id: 'action_no_alcohol',
        titleKey: 'actions.no_alcohol_title',
        descriptionKey: 'actions.no_alcohol_desc',
        category: 'NUTRITION',
        difficulty: 2,
        timingHint: 'EVENING',
        sortOrder: 7,
      },
      {
        id: 'action_gratitude',
        titleKey: 'actions.gratitude_title',
        descriptionKey: 'actions.gratitude_desc',
        category: 'MINDSET',
        difficulty: 1,
        timingHint: 'BEDTIME',
        sortOrder: 8,
      },
      {
        id: 'action_body_scan',
        titleKey: 'actions.body_scan_title',
        descriptionKey: 'actions.body_scan_desc',
        category: 'MINDSET',
        difficulty: 2,
        timingHint: 'BEDTIME',
        sortOrder: 9,
      },
      {
        id: 'action_exercise_timing',
        titleKey: 'actions.exercise_timing_title',
        descriptionKey: 'actions.exercise_timing_desc',
        category: 'MOVEMENT',
        difficulty: 2,
        timingHint: 'AFTERNOON',
        sortOrder: 10,
      },
    ],
    skipDuplicates: true,
  });

  // ═══════════════════════════════════════════════════════════
  // V1.0 PROGRAM: 14-Day Sleep Reset
  // ═══════════════════════════════════════════════════════════

  console.log('  Creating program templates...');

  const sleepReset14 = await prisma.programTemplate.upsert({
    where: { slug: 'sleep-reset-14' },
    update: {},
    create: {
      slug: 'sleep-reset-14',
      nameKey: 'programs.sleep_reset_14.name',
      descriptionKey: 'programs.sleep_reset_14.description',
      shortDescKey: 'programs.sleep_reset_14.short',

      durationDays: 14,
      coachRequired: true,
      coachIntensity: 'DAILY',

      priceEuroCents: 19900,
      coachDirectSplit: 80,
      soomiAssignedSplit: 50,

      allowedActionIds: [
        'action_no_phone',
        'action_no_caffeine',
        'action_morning_light',
        'action_cool_bedroom',
        'action_wind_down',
        'action_consistent_wake',
        'action_no_alcohol',
        'action_gratitude',
        'action_body_scan',
        'action_exercise_timing',
      ],

      checkInConfig: {
        questions: ['sleep_quality', 'energy_level', 'mood_level', 'phone_in_bed', 'caffeine_after_14'],
        allowNotes: true,
        maxNotesLength: 500,
      },

      reportType: 'STANDARD',
      targetAudience: 'ALL',
      isRepeatProgram: false,

      isActive: true,
      isPublic: true,
      sortOrder: 1,
    },
  });

  // Standard-Variante
  await prisma.programVariant.upsert({
    where: { slug: 'sleep-reset-14-standard' },
    update: {},
    create: {
      templateId: sleepReset14.id,
      slug: 'sleep-reset-14-standard',
      nameKey: 'programs.sleep_reset_14.variant_standard',
      priceEuroCents: 19900,
      isActive: true,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // V1.1 PROGRAMS (Prepared but inactive)
  // ═══════════════════════════════════════════════════════════

  console.log('  Creating v1.1 program templates (inactive)...');

  // Kickstart (Self-Guided) - 49€
  const kickstart7 = await prisma.programTemplate.upsert({
    where: { slug: 'sleep-kickstart-7' },
    update: {},
    create: {
      slug: 'sleep-kickstart-7',
      nameKey: 'programs.kickstart_7.name',
      descriptionKey: 'programs.kickstart_7.description',
      shortDescKey: 'programs.kickstart_7.short',

      durationDays: 7,
      coachRequired: false,
      coachIntensity: 'NONE',

      priceEuroCents: 4900,
      coachDirectSplit: 0,
      soomiAssignedSplit: 0,

      allowedActionIds: [
        'action_no_phone',
        'action_no_caffeine',
        'action_morning_light',
        'action_consistent_wake',
      ],

      checkInConfig: {
        questions: ['sleep_quality', 'energy_level'],
        allowNotes: false,
      },

      reportType: 'MINI',
      targetAudience: 'NEW_USERS',
      isRepeatProgram: false,

      isActive: false, // v1.1
      isPublic: true,
      sortOrder: 0,
    },
  });

  // Deep Reset (Premium) - 349€
  const deepReset28 = await prisma.programTemplate.upsert({
    where: { slug: 'deep-reset-28' },
    update: {},
    create: {
      slug: 'deep-reset-28',
      nameKey: 'programs.deep_reset_28.name',
      descriptionKey: 'programs.deep_reset_28.description',
      shortDescKey: 'programs.deep_reset_28.short',

      durationDays: 28,
      coachRequired: true,
      coachIntensity: 'INTENSIVE',

      priceEuroCents: 34900,
      coachDirectSplit: 75,
      soomiAssignedSplit: 45,

      allowedActionIds: [
        'action_no_phone',
        'action_no_caffeine',
        'action_morning_light',
        'action_cool_bedroom',
        'action_wind_down',
        'action_consistent_wake',
        'action_no_alcohol',
        'action_gratitude',
        'action_body_scan',
        'action_exercise_timing',
      ],

      checkInConfig: {
        questions: ['sleep_quality', 'energy_level', 'mood_level', 'phone_in_bed', 'caffeine_after_14'],
        allowNotes: true,
        maxNotesLength: 1000,
      },

      reportType: 'DETAILED',
      targetAudience: 'ALL',
      isRepeatProgram: false,

      isActive: false, // v1.1
      isPublic: true,
      sortOrder: 2,
    },
  });

  // Repeat Reset (Rückkehrer) - 149€
  await prisma.programTemplate.upsert({
    where: { slug: 'repeat-reset-10' },
    update: {},
    create: {
      slug: 'repeat-reset-10',
      nameKey: 'programs.repeat_reset_10.name',
      descriptionKey: 'programs.repeat_reset_10.description',
      shortDescKey: 'programs.repeat_reset_10.short',

      durationDays: 10,
      coachRequired: true,
      coachIntensity: 'LIGHT',

      priceEuroCents: 14900,
      coachDirectSplit: 80,
      soomiAssignedSplit: 50,

      allowedActionIds: [
        'action_no_phone',
        'action_consistent_wake',
        'action_wind_down',
        'action_gratitude',
      ],

      checkInConfig: {
        questions: ['sleep_quality', 'energy_level'],
        allowNotes: true,
        maxNotesLength: 300,
      },

      reportType: 'STANDARD',
      targetAudience: 'RETURNING_USERS',
      isRepeatProgram: true,
      prerequisiteSlug: 'sleep-reset-14',

      isActive: false, // v1.1
      isPublic: false,
      sortOrder: 3,
    },
  });

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
