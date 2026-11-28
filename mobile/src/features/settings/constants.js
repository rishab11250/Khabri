/**
 * @file Language, digest schedule, and interest-icon option constants for settings and onboarding.
 */

export const SETTINGS_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'gu', label: 'ગુજરાતી' },
];

export const DIGEST_TIMES = [
  { time: '08:00', label: '08:00 AM' },
  { time: '09:00', label: '09:00 AM' },
  { time: '20:00', label: '08:00 PM' },
];

export const ONBOARDING_LANGUAGES = [
  { code: 'en', title: 'English', subtitle: 'National & state portals in clear English' },
  { code: 'hi', title: 'हिन्दी', subtitle: 'सरकारी सूचनाएं और तिथियाँ सरल हिन्दी में' },
  { code: 'gu', title: 'ગુજરાતી', subtitle: 'સરકારી નોટિસ અને તારીખો સરળ ગુજરાતીમાં' },
];

export const INTEREST_CATEGORY_ICONS = {
  exam: 'school-outline',
  recruitment: 'briefcase-outline',
  scholarship: 'ribbon-outline',
  scheme: 'document-text-outline',
  utility: 'flash-outline',
};
