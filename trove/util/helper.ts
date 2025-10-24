export function formatString(toFormat: string) {
  return toFormat.trim().toLowerCase();
}

export function formatTitle(toFormat: string) {
  return toFormat.charAt(0).toUpperCase() + toFormat.slice(1).toLowerCase();
}
