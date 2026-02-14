/** Auto-capitalize each word (Title Case) for clean formatting */
export function titleCase(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}
