import { useEffect, type RefObject } from 'react';

type ScrollTriggerVars = {
  trigger?: Element | string | null;
  scroller?: Element | string;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  pin?: boolean;
  anticipatePin?: number;
  toggleActions?: string;
};

function setupScroller(root: HTMLElement, ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger) {
  ScrollTrigger.scrollerProxy(root, {
    scrollTop(value) {
      if (arguments.length) {
        root.scrollTop = value as number;
      }
      return root.scrollTop;
    },
    getBoundingClientRect() {
      return {
        top: 0,
        left: 0,
        width: root.clientWidth,
        height: root.clientHeight,
      };
    },
    pinType: 'transform',
  });

  ScrollTrigger.defaults({ scroller: root });

  return (vars: ScrollTriggerVars): ScrollTriggerVars => ({
    ...vars,
    scroller: root,
  });
}

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
      const root = containerRef.current;
      root?.querySelectorAll('.bmh-svc-reveal, [data-reveal]').forEach((el) => {
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.transform = 'none';
      });
      root?.querySelectorAll('.bmh-svc-timeline-bar').forEach((el) => {
        (el as HTMLElement).style.transform = 'scaleX(1)';
      });
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

      const st = setupScroller(root, ScrollTrigger);

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
            scrollTrigger: st({
              trigger: item,
              start: 'top 84%',
              toggleActions: 'play none none reverse',
            }),
          });
        });

        gsap.timeline({
          scrollTrigger: st({
            trigger: root.querySelector('.bmh-svc-hero-section'),
            start: 'top top',
            end: '+=115%',
            scrub: 1,
            pin: true,
            anticipatePin: 1,
          }),
        })
          .to(root.querySelector('.bmh-svc-hero-wordmark'), { yPercent: -50, scale: 1.07, opacity: 0.86, duration: 1 }, 0)
          .to(root.querySelector('.bmh-svc-hero-copy'), { y: -60, opacity: 0.42, duration: 1 }, 0)
          .to(root.querySelector('.bmh-svc-hero-meta'), { y: -34, opacity: 0.72, duration: 1 }, 0)
          .to(root.querySelector('.bmh-svc-hero-stack'), { y: -70, scale: 0.94, duration: 1 }, 0)
          .to(root.querySelector('.bmh-svc-hero-card:nth-child(1)'), { x: -46, y: 34, rotate: -24, duration: 1 }, 0)
          .to(root.querySelector('.bmh-svc-hero-card:nth-child(2)'), { x: 42, y: -34, rotate: 20, duration: 1 }, 0)
          .to(root.querySelector('.bmh-svc-hero-card:nth-child(3)'), { x: 54, y: 22, rotate: 22, duration: 1 }, 0)
          .to(root.querySelector('.bmh-svc-hero-card:nth-child(4)'), { x: 8, y: 12, rotate: 0, duration: 1 }, 0);

        gsap.timeline({
          scrollTrigger: st({
            trigger: root.querySelector('.bmh-svc-brand-section'),
            start: 'top top',
            end: '+=110%',
            scrub: 1,
            pin: true,
            anticipatePin: 1,
          }),
        })
          .fromTo(root.querySelector('.bmh-svc-brand-drift'), { xPercent: 4 }, { xPercent: -22, duration: 1 }, 0)
          .fromTo(
            root.querySelectorAll('.bmh-svc-brand-word'),
            { opacity: 0, y: 80, x: (i: number) => (i % 2 ? -90 : 90) },
            { opacity: 1, y: 0, x: 0, stagger: 0.08, duration: 0.6 },
            0.08,
          )
          .to(
            root.querySelectorAll('.bmh-svc-brand-word'),
            { x: (i: number) => (i % 2 ? -34 : 34), stagger: 0.04, duration: 0.45 },
            0.64,
          );

        gsap.timeline({
          scrollTrigger: st({
            trigger: root.querySelector('.bmh-svc-services-section'),
            start: 'top 65%',
            end: 'bottom 30%',
            scrub: 1,
          }),
        })
          .from(root.querySelector('.bmh-svc-services-copy'), { y: 90, opacity: 0, duration: 0.35 })
          .from(root.querySelectorAll('.bmh-svc-pillar-card'), { y: 42, opacity: 0, stagger: 0.08, duration: 0.45 }, 0.16)
          .to(root.querySelector('.bmh-svc-strip-image'), { xPercent: -14, scale: 1.22, duration: 0.8 }, 0);

        gsap.utils.toArray<Element>(root.querySelectorAll('.bmh-svc-parallax-image')).forEach((item) => {
          const isFast = item.classList.contains('bmh-svc-parallax-fast');
          const section = item.closest('section');
          if (!section) return;

          gsap.fromTo(
            item,
            { y: isFast ? 90 : 50 },
            {
              y: isFast ? -120 : -70,
              ease: 'none',
              scrollTrigger: st({
                trigger: section,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              }),
            },
          );

          const img = item.querySelector('img');
          if (img) {
            gsap.fromTo(
              img,
              { scale: 1.18, yPercent: isFast ? -8 : -5 },
              {
                scale: 1.04,
                yPercent: isFast ? 8 : 5,
                ease: 'none',
                scrollTrigger: st({
                  trigger: section,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true,
                }),
              },
            );
          }
        });

        gsap.from(root.querySelectorAll('.bmh-svc-stat-card'), {
          y: 52,
          opacity: 0,
          stagger: 0.08,
          duration: 0.8,
          scrollTrigger: st({
            trigger: root.querySelector('.bmh-svc-stats-section'),
            start: 'top 58%',
            toggleActions: 'play none none reverse',
          }),
        });

        gsap.timeline({
          scrollTrigger: st({
            trigger: root.querySelector('.bmh-svc-archive-section'),
            start: 'top 75%',
            end: 'bottom 20%',
            scrub: 1,
          }),
        })
          .from(root.querySelector('.bmh-svc-archive-title'), { y: 80, opacity: 0, duration: 0.45 }, 0)
          .from(
            root.querySelectorAll('.bmh-svc-archive-card'),
            {
              y: 100,
              opacity: 0,
              rotate: (i: number) => [-3, 2, -2, 3, -1][i] ?? 0,
              stagger: 0.08,
              duration: 0.65,
            },
            0.12,
          )
          .to(root.querySelector('.bmh-svc-archive-gallery'), { xPercent: -18, duration: 1 }, 0.25)
          .to(root.querySelectorAll('.bmh-svc-archive-card img'), { scale: 1.18, duration: 1 }, 0.25);

        gsap.timeline({
          scrollTrigger: st({
            trigger: root.querySelector('.bmh-svc-work-section'),
            start: 'top top',
            end: '+=120%',
            scrub: 1,
            pin: true,
            anticipatePin: 1,
          }),
        })
          .from(root.querySelector('.bmh-svc-work-copy'), { x: -80, opacity: 0, duration: 0.4 }, 0)
          .fromTo(
            root.querySelector('.bmh-svc-masked-number'),
            { scale: 0.82, y: 80, backgroundPosition: '50% 28%' },
            { scale: 1.1, y: -50, backgroundPosition: '50% 74%', duration: 1 },
            0,
          )
          .from(root.querySelectorAll('.bmh-svc-project-card'), { y: 80, opacity: 0, rotate: 0, stagger: 0.1, duration: 0.4 }, 0.15)
          .to(root.querySelectorAll('.bmh-svc-project-card'), { y: -40, x: (i: number) => (i ? 42 : -34), duration: 0.8 }, 0.45);

        gsap.timeline({
          scrollTrigger: st({
            trigger: root.querySelector('.bmh-svc-field-notes-section'),
            start: 'top 72%',
            end: 'bottom 28%',
            scrub: 1,
          }),
        })
          .fromTo(
            root.querySelector('.bmh-svc-partners-heading'),
            { yPercent: 10, opacity: 0.06 },
            { yPercent: -16, opacity: 0.12, duration: 1 },
            0,
          )
          .from(root.querySelector('.bmh-svc-field-notes-section .bmh-svc-section-label'), { y: 24, opacity: 0, duration: 0.35 }, 0.08)
          .from(root.querySelector('.bmh-svc-field-notes-heading'), { y: 70, opacity: 0, duration: 0.55 }, 0.12)
          .from(
            root.querySelectorAll('.bmh-svc-note-card'),
            {
              y: 100,
              opacity: 0,
              rotate: (i: number) => [-2, 2, -1, 1, -2][i] ?? 0,
              stagger: 0.08,
              duration: 0.7,
            },
            0.2,
          )
          .to(
            root.querySelectorAll('.bmh-svc-note-card'),
            {
              y: (i: number) => [-24, 18, -12, 14, -18][i] ?? 0,
              stagger: 0.04,
              duration: 0.55,
            },
            0.62,
          );

        gsap.timeline({
          scrollTrigger: st({
            trigger: root.querySelector('.bmh-svc-process-section'),
            start: 'top 60%',
            end: 'bottom 40%',
            scrub: 1,
          }),
        })
          .to(root.querySelectorAll('.bmh-svc-timeline-bar'), { scaleX: 1, stagger: 0.12, duration: 0.6 }, 0)
          .from(root.querySelectorAll('.bmh-svc-process-col'), { y: 38, opacity: 0, stagger: 0.08, duration: 0.45 }, 0.25);

        gsap.timeline({
          scrollTrigger: st({
            trigger: root.querySelector('.bmh-svc-pricing-section'),
            start: 'top top',
            end: '+=80%',
            scrub: 1,
            pin: window.innerWidth >= 768,
            anticipatePin: 1,
          }),
        })
          .from(root.querySelector('.bmh-svc-pricing-copy'), { y: 50, opacity: 0, duration: 0.35 }, 0)
          .from(root.querySelectorAll('.bmh-svc-pricing-card'), { x: 110, opacity: 0, stagger: 0.16, duration: 0.55 }, 0.12);

        gsap.timeline({
          scrollTrigger: st({
            trigger: root.querySelector('.bmh-svc-reviews-section'),
            start: 'top 72%',
            end: 'bottom 28%',
            scrub: 1,
          }),
        }).from(root.querySelectorAll('.bmh-svc-review-card'), {
          y: 100,
          opacity: 0,
          rotate: (i: number) => [-2, 2, -1][i] ?? 0,
          stagger: 0.08,
          duration: 0.7,
        });

        gsap.timeline({
          scrollTrigger: st({
            trigger: root.querySelector('.bmh-svc-contact-section'),
            start: 'top 62%',
            end: 'bottom 34%',
            scrub: 1,
          }),
        })
          .from(root.querySelectorAll('.bmh-svc-contact-form > *'), { y: 36, opacity: 0, stagger: 0.07, duration: 0.45 }, 0)
          .from(root.querySelectorAll('.bmh-svc-faq-row'), { y: 38, opacity: 0, stagger: 0.08, duration: 0.45 }, 0.12);

        gsap.timeline({
          scrollTrigger: st({
            trigger: root.querySelector('.bmh-svc-footer-section'),
            start: 'top 72%',
            end: 'bottom bottom',
            scrub: 1,
          }),
        })
          .fromTo(
            root.querySelector('.bmh-svc-footer-wordmark'),
            { scale: 0.9, y: 120, opacity: 0.35 },
            { scale: 1, y: 0, opacity: 1, duration: 0.9 },
            0,
          )
          .from(root.querySelector('.bmh-svc-footer-links'), { y: 80, opacity: 0, duration: 0.5 }, 0.2)
          .from(root.querySelector('.bmh-svc-footer-links h3'), { y: 60, opacity: 0, letterSpacing: '-0.12em', duration: 0.45 }, 0.3)
          .from(root.querySelectorAll('.bmh-svc-footer-links a'), { y: 18, opacity: 0, stagger: 0.04, duration: 0.3 }, 0.45);
      }, root);

      ScrollTrigger.refresh();
    })();

    return () => ctx?.revert();
  }, [containerRef, loaderComplete, onLoaderComplete]);
}
