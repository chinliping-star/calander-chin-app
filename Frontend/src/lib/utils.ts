/**
 * Merges class names together. When clsx + tailwind-merge are installed,
 * swap the body to: return twMerge(clsx(inputs));
 */
export type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassValue[];

function clsxInner(...inputs: ClassValue[]): string {
  const classes: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const result = clsxInner(...input);
      if (result) classes.push(result);
    }
  }
  return classes.join(' ');
}

export function cn(...inputs: ClassValue[]): string {
  return clsxInner(...inputs);
}
