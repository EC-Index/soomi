import * as fs from 'fs';
import * as path from 'path';

const LOCALES_DIR = path.join(__dirname, 'locales');

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];

  for (const key of Object.keys(obj)) {
    if (key === '_meta') continue;

    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

export function validateLocales(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Load English as the master
  const enUSPath = path.join(LOCALES_DIR, 'en-US.json');

  if (!fs.existsSync(enUSPath)) {
    return {
      valid: false,
      errors: ['Master locale file en-US.json not found'],
      warnings: [],
    };
  }

  const masterData = JSON.parse(fs.readFileSync(enUSPath, 'utf-8'));
  const masterKeys = new Set(flattenKeys(masterData));

  console.log(`📋 Master locale (en-US) has ${masterKeys.size} keys`);

  // Get all locale files
  const localeFiles = fs.readdirSync(LOCALES_DIR).filter((f) => f.endsWith('.json'));

  for (const file of localeFiles) {
    if (file === 'en-US.json') continue;

    const localePath = path.join(LOCALES_DIR, file);
    const localeData = JSON.parse(fs.readFileSync(localePath, 'utf-8'));
    const localeKeys = new Set(flattenKeys(localeData));

    console.log(`\n🔍 Checking ${file}...`);

    // Check for missing keys
    let missingCount = 0;
    for (const key of masterKeys) {
      if (!localeKeys.has(key)) {
        errors.push(`[${file}] Missing key: ${key}`);
        missingCount++;
      }
    }

    // Check for extra keys (warnings)
    let extraCount = 0;
    for (const key of localeKeys) {
      if (!masterKeys.has(key)) {
        warnings.push(`[${file}] Extra key (not in master): ${key}`);
        extraCount++;
      }
    }

    if (missingCount === 0 && extraCount === 0) {
      console.log(`  ✅ All ${localeKeys.size} keys present`);
    } else {
      if (missingCount > 0) {
        console.log(`  ❌ Missing ${missingCount} keys`);
      }
      if (extraCount > 0) {
        console.log(`  ⚠️  Extra ${extraCount} keys`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// CLI
if (require.main === module) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  SOOMI i18n VALIDATION');
  console.log('═══════════════════════════════════════════════════════════\n');

  const result = validateLocales();

  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach((w) => console.log(`   - ${w}`));
  }

  if (!result.valid) {
    console.log('\n❌ Errors:');
    result.errors.forEach((e) => console.log(`   - ${e}`));
    console.log('\n');
    process.exit(1);
  }

  console.log('\n✅ All locale files are valid!\n');
}
