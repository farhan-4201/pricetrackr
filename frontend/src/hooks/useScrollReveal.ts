import { useEffect, useRef } from 'react';
import ScrollReveal from 'scrollreveal';

interface ScrollRevealOptions {
  duration?: number;
  distance?: string;
  easing?: string;
  delay?: number;
  opacity?: number;
  origin?: 'top' | 'bottom' | 'left' | 'right';
  interval?: number;
  viewFactor?: number;
}

interface ScrollRevealHookOptions {
  selector?: string;
  options?: ScrollRevealOptions;
  enabled?: boolean;
}

export const useScrollReveal = ({
  selector = '[data-scroll-reveal]',
  options = {},
  enabled = true,
}: ScrollRevealHookOptions = {}) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled) return;

    // Default scroll reveal configuration
    const defaultOptions: ScrollRevealOptions = {
      duration: 800,
      distance: '30px',
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      delay: 100,
      opacity: 0,
      viewFactor: 0.15,
      origin: 'bottom',
    };

    // Merge user options with defaults
    const srOptions = { ...defaultOptions, ...options };

    // Initialize ScrollReveal
    const sr = ScrollReveal({
      ...srOptions,
    });

    // Get elements to reveal
    let elements: NodeListOf<Element>;

    if (containerRef.current) {
      // If using ref, target elements within the container
      elements = containerRef.current.querySelectorAll(selector);
    } else {
      // Global target
      elements = document.querySelectorAll(selector);
    }

    if (elements.length > 0) {
      // Apply reveal to all elements with stagger
      sr.reveal(elements, {
        interval: srOptions.interval || 150,
        origin: srOptions.origin,
        distance: srOptions.distance,
      });
    }

    // Cleanup function - capture the ref value to avoid stale closure
    return () => {
      const container = containerRef.current;
      if (container) {
        sr.clean(container.querySelectorAll(selector));
      } else {
        sr.clean(document.querySelectorAll(selector));
      }
    };
  }, [selector, options, enabled]);

  return containerRef;
};

// Presets for common animations
export const scrollRevealPresets = {
  fadeInUp: {
    origin: 'bottom' as const,
    distance: '30px',
    opacity: 0,
  },
  fadeInLeft: {
    origin: 'left' as const,
    distance: '30px',
    opacity: 0,
  },
  fadeInRight: {
    origin: 'right' as const,
    distance: '30px',
    opacity: 0,
  },
  zoomIn: {
    scale: 0.9,
    opacity: 0,
  },
  slideInUp: {
    origin: 'bottom' as const,
    distance: '50px',
  },
  staggerFade: {
    interval: 150,
    opacity: 0,
  },
};

// Global initialization for pages
export const initGlobalScrollReveal = () => {
  // Initialize after DOM is ready
  if (typeof window !== 'undefined') {
    const sr = ScrollReveal({
      duration: 800,
      distance: '30px',
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      delay: 100,
      opacity: 0,
      viewFactor: 0.15,
      origin: 'bottom',
    });

    // Apply animations to common elements with data attributes
    // These can be added to any component to trigger reveal
    sr.reveal('[data-scroll-reveal-up]', { origin: 'bottom', distance: '30px' });
    sr.reveal('[data-scroll-reveal-left]', { origin: 'left', distance: '30px' });
    sr.reveal('[data-scroll-reveal-right]', { origin: 'right', distance: '30px' });
    sr.reveal('[data-scroll-reveal-zoom]', { scale: 0.9, opacity: 0 });
    sr.reveal('[data-scroll-reveal-fade]', { opacity: 0, distance: '0px' });

    // Stagger animations for multiple elements
    sr.reveal('[data-scroll-reveal-stagger]', {
      interval: 150,
      opacity: 0,
      distance: '20px'
    });

    // Page sections with delay
    sr.reveal('[data-scroll-reveal-section]', {
      delay: 200,
      distance: '40px',
    });

    return sr;
  }
  return null;
};

export default useScrollReveal;
