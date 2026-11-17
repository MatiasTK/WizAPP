import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Joins class names and resolves conflicting Tailwind utilities (last one wins). */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs))

/** The one focus pattern of the app: a ring in the primary color, no border change. */
export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg'
