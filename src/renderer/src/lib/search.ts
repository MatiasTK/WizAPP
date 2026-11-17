/** Lowercase without accents, so "luz de dia" finds "Luz de día". */
export const normalizeText = (text: string): string =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()

/** Substring match ignoring case and accents. An empty query matches everything. */
export const matches = (text: string, query: string): boolean => {
  const q = normalizeText(query)
  return q === '' || normalizeText(text).includes(q)
}
