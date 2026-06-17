import { useEffect, type RefObject } from 'react';

export function useServiceExperienceAnimations(
  containerRef: RefObject<HTMLElement | null>,
  loaderComplete: boolean,
  onLoaderComplete: () => void,
) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      onLoaderComplete();
      return;
    }

    let ctx: { revert: () => void } | undefined;

    void (async () => {
      const gsap = (await import('gsap')).default;
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);
      gsap.defaults({ ease: 'power3.out' });

      const root = containerRef.current;
      if (!root) return;

      ctx = gsap.context(() => {
        const loadTl = gsap.timeline({ paused: true });
        loadTl
          .from(root.querySelector('.bmh-svc-header'), { y: -24, opacity: 0, duration: 0.75 })
          .from(root.querySelectorAll('.bmh-svc-hero-copy > *'), { y: 28, opacity: 0, stagger: 0.09, duration: 0.8 }, '-=0.35')
          .from(root.querySelectorAll('.bmh-svc-hero-card'), { y: 90, opacity: 0, scale: 0.94, stagger: 0.08, duration: 1.05 }, '-=0.55')
          .from(root.querySelector('.bmh-svc-hero-cta'), { scale: 0, opacity: 0, duration: 0.6 }, '-=0.45')
          .from(root.querySelector('.bmh-svc-hero-wordmark'), { yPercent: 18, opacity: 0, duration: 1 }, '-=0.7')
          .from(root.querySelector('.bmh-svc-hero-meta'), { y: 24, opacity: 0, duration: 0.75 }, '-=0.65');

        if (!loaderComplete) {
          const counter = { v: 0 };
          const pctEl = root.querySelector('.bmh-svc-loader__pct');
          gsap
            .timeline({
              onComplete: () => {
                onLoaderComplete();
                loadTl.play();
                ScrollTrigger.refresh();
              },
            })
            .to(root.querySelector('.bmh-svc-loader__brand'), { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out' }, 0)
            .to(root.querySelector('.bmh-svc-loader__meta'), { opacity: 1, duration: 0.6 }, 0.3)
            .to(root.querySelector('.bmh-svc-loader__bar'), { scaleX: 1, duration: 1.1, ease: 'power2.inOut' }, 0.2)
            .to(
              counter,
              {
                v: 100,
                duration: 1.1,
                ease: 'power2.inOut',
                onUpdate: () => {
                  if (pctEl) pctEl.textContent = String(Math.round(counter.v)).padStart(3, '0');
                },
              },
              0.2,
            )
            .to([root.querySelector('.bmh-svc-loader__brand'), root.querySelector('.bmh-svc-loader__meta')], { opacity: 0, y: -20, filter: 'blur(8px)', duration: 0.5, ease: 'power2.in' }, '+=0.15')
            .to(root.querySelector('.bmh-svc-loader'), { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, '<0.1');
        } else {
          loadTl.play();
        }

        gsap.utils.toArray<Element>(root.querySelectorAll('[data-reveal], .bmh-svc-reveal')).forEach((item) => {
          gsap.to(item, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            scrollTrigger: {
              trigger: item,
              start: 'top 84%',
              toggleActions: 'play none none reverse',
            },
          });
        });

        gsap.timeline({
          scrollTrigger: {
            trigger: root.querySelector('.bmh-svc-hero-section'),
            start: 'top top',
            end: '+=115%',
            scrub: 1,
            pin: true,
            anticipatePin: 1,
          },
        })
          .to(root.querySelector('.bmh-svc-hero-wordmark'), { yPercent: -50, scale: 1.07, opacity: 0.86, duration: 1 }, 0)
          .to(root.querySelector('.bmh-svc-hero-copy'), { y: -60, opacity: 0.42, duration: 1 }, 0)
          .to(root.querySelector('.bmh-svc-hero-meta'), { y: -34, opacity: 0.72, duration: 1 }, 0)
          .to(root.querySelector('.bmh-svc-hero-stack'), { y: -70, scale: 0.94, duration: 1 }, 0);

        gsap.timeline({
          scrollTrigger: {
            trigger: root.querySelector('.bmh-svc-brand-section'),
            start: 'top top',
            end: '+=110%',
            scrub: 1,
            pin: true,
            anticipatePin: 1,
          },
        })
          .fromTo(root.querySelector('.bmh-svc-brand-drift'), { xPercent: 4 }, { xPercent: -22, duration: 1 }, 0)
          .fromTo(
            root.querySelectorAll('.bmh-svc-brand-word'),
            { opacity: 0, y: 80, x: (i: number) => (i % 2 ? -90 : 90) },
            { opacity: 1, y: 0, x: 0, stagger: 0.08, duration: 0.6 },
            0.08,
          );

        gsap.timeline({
          scrollTrigger: {
            trigger: root.querySelector('.bmh-svc-services-section'),
            start: 'top 65%',
            end: 'bottom 30%',
            scrub: 1,
          },
        })
          .from(root.querySelector('.bmh-svc-services-copy'), { y: 90, opacity: 0, duration: 0.35 })
          .from(root.querySelectorAll('.bmh-svc-pillar-card'), { y: 42, opacity: 0, stagger: 0.08, duration: 0.45 }, 0.16)
          .to(root.querySelector('.bmh-svc-strip-image'), { xPercent: -14, scale: 1.22, duration: 0.8 }, 0);

        gsap.from(root.querySelectorAll('.bmh-svc-stat-card'), {
          y: 52,
          opacity: 0,
          stagger: 0.08,
          duration: 0.8,
          scrollTrigger: {
            trigger: root.querySelector('.bmh-svc-stats-section'),
            start: 'top 58%',
            toggleActions: 'play none none reverse',
          },
        });

        gsap.timeline({
          scrollTrigger: {
            trigger: root.querySelector('.bmh-svc-process-section'),
            start: 'top 60%',
            end: 'bottom 40%',
            scrub: 1,
          },
        })
          .to(root.querySelectorAll('.bmh-svc-timeline-bar'), { scaleX: 1, stagger: 0.12, duration: 0.6 }, 0)
          .from(root.querySelectorAll('.bmh-svc-process-col'), { y: 38, opacity: 0, stagger: 0.08, duration: 0.45 }, 0.25);

        gsap.timeline({
          scrollTrigger: {
            trigger: root.querySelector('.bmh-svc-reviews-section'),
            start: 'top 72%',
            end: 'bottom 28%',
            scrub: 1,
          },
        }).from(root.querySelectorAll('.bmh-svc-review-card'), {
          y: 100,
          opacity: 0,
          rotate: (i: number) => [-2, 2, -1][i] ?? 0,
          stagger: 0.08,
          duration: 0.7,
        });

        gsap.timeline({
          scrollTrigger: {
            trigger: root.querySelector('.bmh-svc-faq-section'),
            start: 'top 62%',
            end: 'bottom 34%',
            scrub: 1,
          },
        }).from(root.querySelectorAll('.bmh-svc-faq-row'), { y: 38, opacity: 0, stagger: 0.08, duration: 0.45 });

        gsap.timeline({
          scrollTrigger: {
            trigger: root.querySelector('.bmh-svc-footer-section'),
            start: 'top 72%',
            end: 'bottom bottom',
            scrub: 1,
          },
        })
          .fromTo(root.querySelector('.bmh-svc-footer-wordmark'), { scale: 0.9, y: 120, opacity: 0.35 }, { scale: 1, y: 0, opacity: 1, duration: 0.9 }, 0)
          .from(root.querySelector('.bmh-svc-footer-cta'), { y: 80, opacity: 0, duration: 0.5 }, 0.2);
      }, root);
    })();

    return () => ctx?.revert();
  }, [containerRef, loaderComplete, onLoaderComplete]);
}
