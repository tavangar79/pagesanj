// Progressive scroll reveals for browsers without CSS scroll-driven animations (DESIGN.md §8).
// Content never depends on this: without JavaScript every element is already visible in place.
const REVEAL = '.reveal, .w, .slide-in, .band-open, .fact, .final-slide, .wordmark-rise';

export function startMotion() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || CSS.supports('animation-timeline: view()') || !('IntersectionObserver' in window)) return;

  document.documentElement.classList.add('io');
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  document.querySelectorAll(REVEAL).forEach((el) => io.observe(el));
}
