import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Scrolls the window to the top of the page
 * @param behavior - The scroll behavior ('auto', 'smooth', or 'instant')
 */
export function scrollToTop(behavior: ScrollBehavior = "instant"): void {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior,
  });
}
