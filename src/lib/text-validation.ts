// Minimum-length rules count only letters and digits, so filler like
// "  .  .  ." can't pass "at least N characters". Maximums still use the raw
// length, since that is what gets saved. Mirrors the API's text-validation.ts.
const MEANINGFUL_CHAR = /[\p{L}\p{N}]/gu;

export function countMeaningfulChars(value: string): number {
  return value.match(MEANINGFUL_CHAR)?.length ?? 0;
}
