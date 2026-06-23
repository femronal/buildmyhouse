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

function mobileEnter(
  isMobile: boolean,
  st: (vars: ScrollTriggerVars) => ScrollTriggerVars,
  vars: ScrollTriggerVars,
): ScrollTriggerVars {
  const base = st(vars);
  if (!isMobile) return base;
  return {
    ...base,
    pin: false,
    scrub: false,
    anticipatePin: 0,
    toggleActions: 'play none none none',
  };
}

function mobileScrub(
  isMobile: boolean,
  st: (vars: ScrollTriggerVars) => ScrollTriggerVars,
  vars: ScrollTriggerVars,
  scrubAmount: number | boolean = 0.45,
): ScrollTriggerVars {
  const base = st(vars);
  if (!isMobile) return base;
  return {
    ...base,
    pin: false,
    scrub: scrubAmount,
    anticipatePin: 0,
  };
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
      ScrollTrigger.config({ ignoreMobileResize: true });

      const root = containerRef.current;
      if (!root) return;

      const isMobile = window.innerWidth < 768;
      const st = setupScroller(root, ScrollTrigger);
      const enter = (vars: ScrollTriggerVars) => mobileEnter(isMobile, st, vars);
      const scrub = (vars: ScrollTriggerVars, amount: number | boolean = 0.45) => mobileScrub(isMobile, st, vars, amount);

      ctx = gsap.context(() => {
        const loadTl = gsap.timeline({ paused: true });
        loadTl
          .from(root.querySelector('.bmh-svc-header'), { y: isMobile ? -12 : -24, opacity: 0, duration: isMobile ? 0.5 : 0.75 })
          .from(
            root.querySelectorAll('.bmh-svc-hero-copy > *'),
            { y: isMobile ? 16 : 28, opacity: 0, stagger: isMobile ? 0.05 : 0.09, duration: isMobile ? 0.55 : 0.8 },
            '-=0.35',
          )
          .from(
            root.querySelectorAll('.bmh-svc-hero-card'),
            { y: isMobile ? 40 : 90, opacity: 0, scale: isMobile ? 0.98 : 0.94, stagger: isMobile ? 0.05 : 0.08, duration: isMobile ? 0.65 : 1.05 },
            '-=0.55',
          )
          .from(root.querySelector('.bmh-svc-hero-cta'), { scale: 0, opacity: 0, duration: isMobile ? 0.4 : 0.6 }, '-=0.45')
          .from(root.querySelector('.bmh-svc-hero-wordmark'), { yPercent: isMobile ? 8 : 18, opacity: 0, duration: isMobile ? 0.65 : 1 }, '-=0.7')
          .from(root.querySelector('.bmh-svc-hero-meta'), { y: isMobile ? 12 : 24, opacity: 0, duration: isMobile ? 0.5 : 0.75 }, '-=0.65');

        if (!loaderComplete) {
          const counter = { v: 0 };
          const pctEl = root.querySelector('.bmh-svc-loader__pct');
          gsap
            .timeline({
              onComplete: () => {
                onLoaderComplete();
                loadTl.play();
                requestAnimationFrame(() => ScrollTrigger.refresh());
              },
            })
            .to(root.querySelector('.bmh-svc-loader__brand'), { opacity: 1, y: 0, filter: 'blur(0px)', duration: isMobile ? 0.65 : 0.9, ease: 'power2.out' }, 0)
            .to(root.querySelector('.bmh-svc-loader__meta'), { opacity: 1, duration: isMobile ? 0.45 : 0.6 }, 0.3)
            .to(root.querySelector('.bmh-svc-loader__bar'), { scaleX: 1, duration: isMobile ? 0.75 : 1.1, ease: 'power2.inOut' }, 0.2)
            .to(
              counter,
              {
                v: 100,
                duration: isMobile ? 0.75 : 1.1,
                ease: 'power2.inOut',
                onUpdate: () => {
                  if (pctEl) pctEl.textContent = String(Math.round(counter.v)).padStart(3, '0');
                },
              },
              0.2,
            )
            .to(
              [root.querySelector('.bmh-svc-loader__brand'), root.querySelector('.bmh-svc-loader__meta')],
              { opacity: 0, y: -20, filter: 'blur(8px)', duration: isMobile ? 0.35 : 0.5, ease: 'power2.in' },
              '+=0.15',
            )
            .to(root.querySelector('.bmh-svc-loader'), { yPercent: -100, duration: isMobile ? 0.65 : 0.9, ease: 'power4.inOut' }, '<0.1');
        } else {
          loadTl.play();
        }

        gsap.utils.toArray<Element>(root.querySelectorAll('[data-reveal], .bmh-svc-reveal')).forEach((item) => {
          gsap.to(item, {
            opacity: 1,
            y: 0,
            duration: isMobile ? 0.55 : 0.9,
            ease: 'power2.out',
            scrollTrigger: enter({
              trigger: item,
              start: isMobile ? 'top 92%' : 'top 84%',
            }),
          });
        });

        if (isMobile) {
          gsap.timeline({
            scrollTrigger: scrub({
              trigger: root.querySelector('.bmh-svc-hero-section'),
              start: 'top top',
              end: 'bottom top',
            }),
          })
            .to(root.querySelector('.bmh-svc-hero-wordmark'), { yPercent: -4, opacity: 0.18, duration: 1 }, 0)
            .to(root.querySelector('.bmh-svc-hero-copy'), { y: -36, opacity: 0.76, duration: 1 }, 0)
            .to(root.querySelector('.bmh-svc-hero-stack'), { y: -24, scale: 0.96, duration: 1 }, 0)
            .to(root.querySelector('.bmh-svc-hero-card:nth-child(1)'), { x: -14, y: 10, rotate: -10, duration: 1 }, 0)
            .to(root.querySelector('.bmh-svc-hero-card:nth-child(2)'), { x: 12, y: -8, rotate: 8, duration: 1 }, 0)
            .to(root.querySelector('.bmh-svc-hero-card:nth-child(3)'), { x: 16, y: 6, rotate: 10, duration: 1 }, 0)
            .to(root.querySelector('.bmh-svc-hero-card:nth-child(4)'), { x: 4, y: 4, rotate: 2, duration: 1 }, 0);
        } else {
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
        }

        if (isMobile) {
          gsap.timeline({
            scrollTrigger: scrub({
              trigger: root.querySelector('.bmh-svc-brand-section'),
              start: 'top 88%',
              end: 'bottom 55%',
            }, 0.4),
          })
            .fromTo(root.querySelector('.bmh-svc-brand-drift'), { xPercent: 2 }, { xPercent: -8, duration: 1 }, 0)
            .fromTo(
              root.querySelectorAll('.bmh-svc-brand-word'),
              { opacity: 0, y: 36, x: (i: number) => (i % 2 ? -24 : 24) },
              { opacity: 1, y: 0, x: 0, stagger: 0.07, duration: 0.55 },
              0.08,
            );
        } else {
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
        }

        gsap.timeline({
          scrollTrigger: isMobile
            ? scrub({
                trigger: root.querySelector('.bmh-svc-services-section'),
                start: 'top 78%',
                end: 'bottom 35%',
              }, 0.4)
            : st({
                trigger: root.querySelector('.bmh-svc-services-section'),
                start: 'top 65%',
                end: 'bottom 30%',
                scrub: 1,
              }),
        })
          .from(root.querySelector('.bmh-svc-services-copy'), { y: isMobile ? 36 : 90, opacity: 0, duration: 0.35 })
          .from(root.querySelectorAll('.bmh-svc-pillar-card'), { y: isMobile ? 24 : 42, opacity: 0, stagger: 0.08, duration: 0.45 }, 0.16)
          .fromTo(
            root.querySelector('.bmh-svc-strip-image'),
            { scale: 1, xPercent: 0, transformOrigin: 'center center' },
            {
              scale: isMobile ? 1.08 : 1.22,
              xPercent: isMobile ? -6 : -14,
              duration: 0.8,
              transformOrigin: 'center center',
            },
            0,
          );

        gsap.utils.toArray<Element>(root.querySelectorAll('.bmh-svc-parallax-image')).forEach((item) => {
          const isFast = item.classList.contains('bmh-svc-parallax-fast');
          const section = item.closest('section');
          if (!section) return;

          gsap.fromTo(
            item,
            { y: isMobile ? (isFast ? 36 : 22) : isFast ? 90 : 50 },
            {
              y: isMobile ? (isFast ? -48 : -28) : isFast ? -120 : -70,
              ease: 'none',
              scrollTrigger: st({
                trigger: section,
                start: 'top bottom',
                end: 'bottom top',
                scrub: isMobile ? 0.35 : true,
              }),
            },
          );

          const img = item.querySelector('img');
          if (img) {
            gsap.fromTo(
              img,
              { scale: isMobile ? 1.08 : 1.18, yPercent: isMobile ? -3 : isFast ? -8 : -5 },
              {
                scale: isMobile ? 1.02 : 1.04,
                yPercent: isMobile ? 3 : isFast ? 8 : 5,
                ease: 'none',
                scrollTrigger: st({
                  trigger: section,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: isMobile ? 0.35 : true,
                }),
              },
            );
          }
        });

        gsap.from(root.querySelectorAll('.bmh-svc-stat-card'), {
          y: isMobile ? 24 : 52,
          opacity: 0,
          stagger: isMobile ? 0.05 : 0.08,
          duration: isMobile ? 0.45 : 0.8,
          ease: 'power2.out',
          scrollTrigger: enter({
            trigger: root.querySelector('.bmh-svc-stats-section'),
            start: isMobile ? 'top 85%' : 'top 58%',
          }),
        });

        gsap.timeline({
          scrollTrigger: isMobile
            ? scrub({
                trigger: root.querySelector('.bmh-svc-archive-section'),
                start: 'top 80%',
                end: 'bottom 30%',
              }, 0.4)
            : st({
                trigger: root.querySelector('.bmh-svc-archive-section'),
                start: 'top 75%',
                end: 'bottom 20%',
                scrub: 1,
              }),
        })
          .from(root.querySelector('.bmh-svc-archive-title'), { y: isMobile ? 28 : 80, opacity: 0, duration: 0.45 }, 0)
          .from(
            root.querySelectorAll('.bmh-svc-archive-card'),
            {
              y: isMobile ? 32 : 100,
              opacity: 0,
              rotate: isMobile ? 0 : (i: number) => [-3, 2, -2, 3, -1][i % 5] ?? 0,
              stagger: 0.08,
              duration: 0.65,
            },
            0.12,
          );

        if (!isMobile) {
          const gallery = root.querySelector('.bmh-svc-archive-gallery') as HTMLElement | null;
          const scrollWrap = root.querySelector('.bmh-svc-archive-scroll') as HTMLElement | null;

          const bindArchiveHorizontalScroll = () => {
            const galleryWidth = gallery?.scrollWidth || 0;
            const viewportWidth = scrollWrap?.clientWidth || window.innerWidth;
            const overflowPx = Math.max(0, galleryWidth - viewportWidth);
            const scrollPercent = galleryWidth > 0 ? (overflowPx / galleryWidth) * 100 : 0;
            const xPercent = overflowPx > 0 ? -Math.min(scrollPercent, 92) : 0;

            if (!gallery || xPercent === 0) return;

            gsap.timeline({
              scrollTrigger: st({
                trigger: root.querySelector('.bmh-svc-archive-section'),
                start: 'top 75%',
                end: 'bottom 20%',
                scrub: 1,
              }),
            })
              .to(gallery, { xPercent, duration: 1 }, 0.25)
              .to(root.querySelectorAll('.bmh-svc-archive-card img'), { scale: 1.18, duration: 1 }, 0.25);
          };

          const archiveImages = root.querySelectorAll('.bmh-svc-archive-card img');
          const waitForArchiveImages = () =>
            Promise.all(
              Array.from(archiveImages).map(
                (img) =>
                  new Promise<void>((resolve) => {
                    if ((img as HTMLImageElement).complete) {
                      resolve();
                      return;
                    }
                    img.addEventListener('load', () => resolve(), { once: true });
                    img.addEventListener('error', () => resolve(), { once: true });
                  }),
              ),
            );

          void waitForArchiveImages().then(() => {
            bindArchiveHorizontalScroll();
            ScrollTrigger.refresh();
          });
        }

        if (isMobile) {
          gsap.timeline({
            scrollTrigger: scrub({
              trigger: root.querySelector('.bmh-svc-work-section'),
              start: 'top 82%',
              end: 'bottom 40%',
            }, 0.4),
          })
            .from(root.querySelector('.bmh-svc-work-copy'), { x: 0, y: 28, opacity: 0, duration: 0.4 }, 0)
            .fromTo(
              root.querySelector('.bmh-svc-masked-number'),
              { scale: 0.92, y: 24, backgroundPosition: '50% 40%' },
              { scale: 1.02, y: 0, backgroundPosition: '50% 58%', duration: 0.8 },
              0,
            );
        } else {
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
        }

        gsap.timeline({
          scrollTrigger: isMobile
            ? scrub({
                trigger: root.querySelector('.bmh-svc-field-notes-section'),
                start: 'top 80%',
                end: 'bottom 35%',
              }, 0.4)
            : st({
                trigger: root.querySelector('.bmh-svc-field-notes-section'),
                start: 'top 72%',
                end: 'bottom 28%',
                scrub: 1,
              }),
        })
          .fromTo(
            root.querySelector('.bmh-svc-partners-heading'),
            { yPercent: isMobile ? 4 : 10, opacity: 0.06 },
            { yPercent: isMobile ? -8 : -16, opacity: 0.12, duration: 1 },
            0,
          )
          .from(root.querySelector('.bmh-svc-field-notes-section .bmh-svc-section-label'), { y: isMobile ? 16 : 24, opacity: 0, duration: 0.35 }, 0.08)
          .from(root.querySelector('.bmh-svc-field-notes-heading'), { y: isMobile ? 32 : 70, opacity: 0, duration: 0.55 }, 0.12)
          .from(
            root.querySelectorAll('.bmh-svc-note-card'),
            {
              y: isMobile ? 36 : 100,
              opacity: 0,
              rotate: isMobile ? 0 : (i: number) => [-2, 2, -1, 1, -2][i] ?? 0,
              stagger: 0.08,
              duration: 0.7,
            },
            0.2,
          );

        if (!isMobile) {
          gsap.timeline({
            scrollTrigger: st({
              trigger: root.querySelector('.bmh-svc-field-notes-section'),
              start: 'top 72%',
              end: 'bottom 28%',
              scrub: 1,
            }),
          }).to(
            root.querySelectorAll('.bmh-svc-note-card'),
            {
              y: (i: number) => [-24, 18, -12, 14, -18][i] ?? 0,
              stagger: 0.04,
              duration: 0.55,
            },
            0.62,
          );
        }

        gsap.timeline({
          scrollTrigger: isMobile
            ? scrub({
                trigger: root.querySelector('.bmh-svc-process-section'),
                start: 'top 82%',
                end: 'bottom 45%',
              }, 0.4)
            : st({
                trigger: root.querySelector('.bmh-svc-process-section'),
                start: 'top 60%',
                end: 'bottom 40%',
                scrub: 1,
              }),
        })
          .to(root.querySelectorAll('.bmh-svc-timeline-bar'), { scaleX: 1, stagger: 0.12, duration: 0.6 }, 0)
          .from(root.querySelectorAll('.bmh-svc-process-col'), { y: isMobile ? 22 : 38, opacity: 0, stagger: 0.08, duration: 0.45 }, 0.25);

        gsap.timeline({
          scrollTrigger: isMobile
            ? scrub({
                trigger: root.querySelector('.bmh-svc-pricing-section'),
                start: 'top 85%',
                end: 'bottom 35%',
              }, 0.4)
            : st({
                trigger: root.querySelector('.bmh-svc-pricing-section'),
                start: 'top top',
                end: '+=80%',
                scrub: 1,
                pin: true,
                anticipatePin: 1,
              }),
        })
          .from(root.querySelector('.bmh-svc-pricing-copy'), { y: isMobile ? 24 : 50, opacity: 0, duration: 0.35 }, 0)
          .from(
            root.querySelectorAll('.bmh-svc-pricing-card'),
            { x: isMobile ? 0 : 110, y: isMobile ? 24 : 0, opacity: 0, stagger: 0.16, duration: 0.55 },
            0.12,
          );

        gsap.timeline({
          scrollTrigger: isMobile
            ? scrub({
                trigger: root.querySelector('.bmh-svc-reviews-section'),
                start: 'top 85%',
                end: 'bottom 40%',
              }, 0.4)
            : st({
                trigger: root.querySelector('.bmh-svc-reviews-section'),
                start: 'top 72%',
                end: 'bottom 28%',
                scrub: 1,
              }),
        }).from(root.querySelectorAll('.bmh-svc-review-card'), {
          y: isMobile ? 28 : 100,
          opacity: 0,
          rotate: isMobile ? 0 : (i: number) => [-2, 2, -1][i] ?? 0,
          stagger: 0.08,
          duration: 0.7,
        });

        gsap.timeline({
          scrollTrigger: isMobile
            ? scrub({
                trigger: root.querySelector('.bmh-svc-contact-section'),
                start: 'top 85%',
                end: 'bottom 35%',
              }, 0.4)
            : st({
                trigger: root.querySelector('.bmh-svc-contact-section'),
                start: 'top 62%',
                end: 'bottom 34%',
                scrub: 1,
              }),
        })
          .from(root.querySelectorAll('.bmh-svc-contact-form > *'), { y: isMobile ? 18 : 36, opacity: 0, stagger: 0.07, duration: 0.45 }, 0)
          .from(root.querySelectorAll('.bmh-svc-faq-row'), { y: isMobile ? 18 : 38, opacity: 0, stagger: 0.08, duration: 0.45 }, 0.12);

        if (!isMobile) {
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
        } else {
          gsap.from(root.querySelector('.bmh-svc-footer-mobile'), {
            y: 20,
            opacity: 0,
            duration: 0.5,
            ease: 'power2.out',
            scrollTrigger: scrub({
              trigger: root.querySelector('.bmh-svc-footer-section'),
              start: 'top 92%',
              end: 'bottom 70%',
            }, 0.35),
          });
        }
      }, root);

      requestAnimationFrame(() => ScrollTrigger.refresh());
    })();

    return () => ctx?.revert();
  }, [containerRef, loaderComplete, onLoaderComplete]);
}
