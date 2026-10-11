/** A dotted IPv4 address with every octet between 0 and 255, after trimming. */
export const isValidIPv4 = (value: string): boolean => {
  const parts = value.trim().split('.')
  if (parts.length !== 4) return false
  return parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
}
