// ═══════════════════════════════════════════════════════════
// FORMATTERS
// ═══════════════════════════════════════════════════════════

/**
 * Format minutes to hours and minutes string
 * @param minutes Total minutes
 * @returns Formatted string like "7h 30m"
 */
export function formatSleepDuration(minutes: number): { hours: number; minutes: number } {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return { hours, minutes: mins };
}

/**
 * Format price in cents to display string
 * @param cents Price in cents
 * @param locale Locale for formatting
 * @returns Formatted price string like "199,00 €"
 */
export function formatPrice(cents: number, locale: string = 'de-DE'): string {
  const euros = cents / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(euros);
}

/**
 * Format date for display
 * @param date Date object or string
 * @param locale Locale for formatting
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, locale: string = 'de-DE'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Format time for display
 * @param date Date object or string
 * @param locale Locale for formatting
 * @returns Formatted time string like "23:30"
 */
export function formatTime(date: Date | string, locale: string = 'de-DE'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param date Date object or string
 * @param locale Locale for formatting
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: Date | string, locale: string = 'de-DE'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffMins < 60) {
    return rtf.format(-diffMins, 'minute');
  } else if (diffHours < 24) {
    return rtf.format(-diffHours, 'hour');
  } else {
    return rtf.format(-diffDays, 'day');
  }
}

/**
 * Calculate percentage change
 * @param baseline Baseline value
 * @param current Current value
 * @returns Percentage change (positive = improvement for TST, negative = improvement for SOL)
 */
export function calculatePercentageChange(baseline: number, current: number): number {
  if (baseline === 0) return 0;
  return Math.round(((current - baseline) / baseline) * 100);
}

/**
 * Format percentage with sign
 * @param value Percentage value
 * @returns Formatted string like "+15%" or "-10%"
 */
export function formatPercentageChange(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}%`;
}

/**
 * Get greeting based on time of day
 * @param hour Hour (0-23)
 * @returns Greeting key for i18n
 */
export function getGreetingKey(hour: number): string {
  if (hour >= 5 && hour < 12) {
    return 'home.greeting_morning';
  } else if (hour >= 12 && hour < 18) {
    return 'home.greeting_afternoon';
  } else {
    return 'home.greeting_evening';
  }
}

/**
 * Truncate text with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @returns Truncated text
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
