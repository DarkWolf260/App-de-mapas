/**
 * Formats phone number into 0000-0000000 format, strictly capped at maximum 11 digits (12 characters).
 */
export function formatPhone(val: string): string {
  if (!val) return "";

  const isHyphenEnd = val.endsWith("-");
  // Limit to maximum 11 digits (e.g. 04141234567)
  const digits = val.replace(/\D/g, "").slice(0, 11);
  if (!digits) return val.startsWith("+") ? val : "";

  if (digits.length <= 4) {
    if (digits.length === 4 && isHyphenEnd) {
      return `${digits}-`;
    }
    return val.startsWith("+") ? `+${digits}` : digits;
  }

  const prefix = val.startsWith("+") ? "+" : "";
  const areaCode = digits.substring(0, 4);
  const subscriberNumber = digits.substring(4);

  return `${prefix}${areaCode}-${subscriberNumber}`;
}
