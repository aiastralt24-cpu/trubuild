import { useEffect } from 'react';

// Content is visible by default. Only elements entering the viewport animate.
export function useHomeMotion(root) {
  useEffect(() => {
    const el = root.current;
    if (!el || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = matchMedia('(min-width: 901px) and (hover: hover)');
    const animations = new Set();
    let revealObserver, imageObserver, frame = 0, imageVisible = false;
    const image = el.querySelector('.studio-visual');
    const reveal = (target) => {
      if (target.dataset.motionSeen) return;
      target.dataset.motionSeen = 'true';
      if (reduced.matches || target.contains(document.activeElement)) return;
      const order = Number(target.dataset.motionOrder || 0);
      const distance = desktop.matches ? 22 : 12;
      const animation = target.animate([
        { opacity: 0, transform: `translateY(${distance}px)` },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: desktop.matches ? 680 : 440, delay: Math.min(order, 3) * (desktop.matches ? 65 : 35), easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
      animations.add(animation);
      animation.onfinish = animation.oncancel = () => animations.delete(animation);
    };
    const updateImage = () => {
      frame = 0;
      if (!imageVisible || reduced.matches || !desktop.matches || document.hidden) return;
      const bounds = image.getBoundingClientRect();
      const progress = Math.max(-1, Math.min(1, (innerHeight / 2 - bounds.top - bounds.height / 2) / (innerHeight / 2 + bounds.height / 2)));
      image.style.setProperty('--home-parallax', `${(progress * 16).toFixed(2)}px`);
    };
    const schedule = () => { if (!frame && imageVisible && !document.hidden) frame = requestAnimationFrame(updateImage); };
    const setup = () => {
      revealObserver?.disconnect(); imageObserver?.disconnect();
      animations.forEach(animation => animation.cancel());
      cancelAnimationFrame(frame); frame = 0; imageVisible = false;
      image?.style.removeProperty('--home-parallax');
      if (reduced.matches) return;
      revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { reveal(entry.target); revealObserver.unobserve(entry.target); }
      }), { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
      el.querySelectorAll('[data-motion]:not([data-motion-seen])').forEach(target => revealObserver.observe(target));
      if (image && desktop.matches) {
        imageObserver = new IntersectionObserver(([entry]) => { imageVisible = entry.isIntersecting; if (imageVisible) schedule(); });
        imageObserver.observe(image);
      }
    };
    const onFocus = event => {
      const target = event.target.closest('[data-motion]');
      if (!target) return;
      target.dataset.motionSeen = 'true';
      revealObserver?.unobserve(target);
      target.getAnimations().forEach(animation => animation.finish());
    };
    setup();
    reduced.addEventListener('change', setup); desktop.addEventListener('change', setup);
    el.addEventListener('focusin', onFocus);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    document.addEventListener('visibilitychange', schedule);
    return () => {
      revealObserver?.disconnect(); imageObserver?.disconnect();
      animations.forEach(animation => animation.cancel()); cancelAnimationFrame(frame);
      reduced.removeEventListener('change', setup); desktop.removeEventListener('change', setup);
      el.removeEventListener('focusin', onFocus); window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule); document.removeEventListener('visibilitychange', schedule);
      image?.style.removeProperty('--home-parallax');
    };
  }, [root]);
}
