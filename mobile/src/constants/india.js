/**
 * @file Indian states/UT list, interest categories, and fuzzy state-name matcher.
 */

export const INDIAN_STATES = [
  'All India',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Chandigarh',
  'Puducherry',
];

export const INTEREST_CATEGORIES = ['exam', 'recruitment', 'scholarship', 'scheme', 'university'];

/**
 * Matches a device or user-entered region name against {@link INDIAN_STATES}.
 *
 * @param {string | null | undefined} regionName - Candidate region label.
 * @returns {string | null} Canonical state name, or `null` when unmatched.
 */
export function matchIndianState(regionName) {
  if (!regionName) return null;
  const normalised = regionName.trim().toLowerCase();
  return (
    INDIAN_STATES.find((s) => s.toLowerCase() === normalised) ??
    INDIAN_STATES.find((s) => normalised.includes(s.toLowerCase())) ??
    null
  );
}
