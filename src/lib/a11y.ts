/**
 * Accessibility utilities for IHARC website
 */

export interface FocusTrapConfig {
  escapeDeactivates?: boolean;
  clickOutsideDeactivates?: boolean;
  returnFocusOnDeactivate?: boolean;
}

/**
 * Simple focus trap implementation for modals and mobile menus
 */
export class FocusTrap {
  private container: HTMLElement;
  private config: FocusTrapConfig;
  private previousFocus: HTMLElement | null = null;
  private isActive = false;

  constructor(container: HTMLElement, config: FocusTrapConfig = {}) {
    this.container = container;
    this.config = {
      escapeDeactivates: true,
      clickOutsideDeactivates: true,
      returnFocusOnDeactivate: true,
      ...config,
    };
  }

  activate() {
    if (this.isActive) return;
    
    this.previousFocus = document.activeElement as HTMLElement;
    this.isActive = true;

    // Focus first focusable element
    const firstFocusable = this.getFirstFocusableElement();
    if (firstFocusable) {
      firstFocusable.focus();
    }

    // Add event listeners
    document.addEventListener('keydown', this.handleKeyDown);
    if (this.config.clickOutsideDeactivates) {
      document.addEventListener('click', this.handleClickOutside);
    }
  }

  deactivate() {
    if (!this.isActive) return;
    
    this.isActive = false;

    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('click', this.handleClickOutside);

    // Return focus
    if (this.config.returnFocusOnDeactivate && this.previousFocus) {
      this.previousFocus.focus();
    }
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (!this.isActive) return;

    if (event.key === 'Escape' && this.config.escapeDeactivates) {
      event.preventDefault();
      this.deactivate();
      return;
    }

    if (event.key === 'Tab') {
      this.handleTabKey(event);
    }
  };

  private handleTabKey = (event: KeyboardEvent) => {
    const focusableElements = this.getFocusableElements();
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  };

  private handleClickOutside = (event: MouseEvent) => {
    if (!this.container.contains(event.target as Node)) {
      this.deactivate();
    }
  };

  private getFocusableElements(): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(this.container.querySelectorAll(selector));
  }

  private getFirstFocusableElement(): HTMLElement | null {
    const elements = this.getFocusableElements();
    return elements[0] || null;
  }
}

/**
 * Announces text to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', priority);
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'visually-hidden';
  
  document.body.appendChild(announcer);
  
  // Small delay to ensure screen reader notices the element
  setTimeout(() => {
    announcer.textContent = message;
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }, 100);
}

/**
 * Creates a visually hidden element for screen readers
 */
export function createScreenReaderText(text: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'visually-hidden';
  span.textContent = text;
  return span;
}

/**
 * Checks if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Respects user motion preferences for animations
 */
export function respectMotionPreference<T extends HTMLElement>(
  element: T,
  animationClass: string,
  duration = 300
): void {
  if (prefersReducedMotion()) {
    // Skip animation
    element.classList.add(animationClass);
    return;
  }

  // Animate normally
  element.classList.add(animationClass);
  
  setTimeout(() => {
    element.classList.remove(animationClass);
  }, duration);
}