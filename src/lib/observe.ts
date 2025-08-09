/**
 * Intersection Observer utilities for IHARC website
 */

export interface CountUpOptions {
  duration?: number;
  easing?: (t: number) => number;
  onUpdate?: (value: number) => void;
  onComplete?: () => void;
}

/**
 * Simple easing functions
 */
export const easing = {
  linear: (t: number) => t,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
};

/**
 * Animates counting up to a target number
 */
export function countUp(
  target: number,
  options: CountUpOptions = {}
): Promise<void> {
  const {
    duration = 2000,
    easing: easingFn = easing.easeOut,
    onUpdate,
    onComplete
  } = options;

  return new Promise((resolve) => {
    const startTime = performance.now();
    const startValue = 0;

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easedProgress = easingFn(progress);
      const currentValue = Math.floor(startValue + (target - startValue) * easedProgress);
      
      onUpdate?.(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onUpdate?.(target); // Ensure we end at exact target
        onComplete?.();
        resolve();
      }
    }

    requestAnimationFrame(animate);
  });
}

/**
 * Creates an intersection observer for elements that should animate when visible
 */
export function createVisibilityObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1,
    ...options,
  };

  return new IntersectionObserver(callback, defaultOptions);
}

/**
 * Observes counter elements and triggers count-up animations
 */
export function observeCounters(selector: string = '[data-counter]'): void {
  const counterElements = document.querySelectorAll(selector);
  
  if (counterElements.length === 0) return;

  const observer = createVisibilityObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.hasAttribute('data-counted')) {
          const element = entry.target as HTMLElement;
          const targetValue = parseInt(element.dataset.counter || '0', 10);
          const duration = parseInt(element.dataset.duration || '2000', 10);
          
          // Mark as counted to prevent re-animation
          element.setAttribute('data-counted', 'true');
          
          // Add animation class
          element.classList.add('animate-count-up');
          
          countUp(targetValue, {
            duration,
            onUpdate: (value) => {
              element.textContent = value.toLocaleString();
            },
            onComplete: () => {
              // Remove animation class after completion
              setTimeout(() => {
                element.classList.remove('animate-count-up');
              }, 100);
            }
          });

          // Stop observing this element
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  counterElements.forEach((element) => {
    observer.observe(element);
  });
}

/**
 * Generic function to observe elements for fade-in animations
 */
export function observeFadeIns(selector: string = '[data-fade-in]'): void {
  const elements = document.querySelectorAll(selector);
  
  if (elements.length === 0) return;

  const observer = createVisibilityObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          const delay = parseInt(element.dataset.delay || '0', 10);
          
          setTimeout(() => {
            element.classList.add('animate-fade-in');
          }, delay);

          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  elements.forEach((element) => {
    observer.observe(element);
  });
}

/**
 * Initialize all observers when DOM is ready
 */
export function initializeObservers(): void {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return;
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      observeCounters();
      observeFadeIns();
    });
  } else {
    observeCounters();
    observeFadeIns();
  }
}