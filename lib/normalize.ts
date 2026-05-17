/**
 * Normalize a restaurant name for dedup-key purposes.
 *   "Yat Lok Roast Goose"  → "yat lok roast goose"
 *   "一樂燒鵝"               → "一樂燒鵝"          (CJK preserved)
 *   "Lin Heung Kui (蓮香居)" → "lin heung kui"      (paren removed)
 */
export function normalizeName(name: string): string {
  return name
    .normalize('NFKC')
    .replace(/[‘’“”]/g, "'") // smart quotes → straight
    .replace(/\([^)]*\)/g, ' ') // strip parentheticals (often the local-script version)
    .replace(/[*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function placesCacheKey(name: string, city: string, country: string): string {
  return [normalizeName(name), city.toLowerCase().trim(), country.toUpperCase().trim()].join('|')
}
