import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'expo-router';
import { ArrowRight, CheckCircle } from 'phosphor-react-native';
import type { ServiceExperienceContent } from '@/lib/service-experience-content';
import { buildSeoJsonLd } from '@/lib/seo-schema';
import { useWebSeo } from '@/lib/seo';
import { useServiceExperienceAnimations } from '@/components/service-experience/useServiceExperienceAnimations.web';

type ServiceExperiencePageProps = {
  content: ServiceExperienceContent;
};

const green = '#22c55e';
const cream = '#f3f0e8';
const muted = 'rgba(243,240,232,.56)';
const PAGE_BG = '#060706';

const pageShellStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  width: '100%',
  height: '100%',
  overflowX: 'hidden',
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  backgroundColor: PAGE_BG,
  color: cream,
  zIndex: 0,
};

function CtaLink({
  href,
  label,
  primary,
  compact,
}: {
  href: string;
  label: string;
  primary?: boolean;
  compact?: boolean;
}) {
  return (
    <Link href={href as any} asChild>
      <a
        className={`bmh-svc-magnetic-button ${primary ? 'bmh-svc-primary-cta' : 'bmh-svc-secondary-cta'}`}
        style={
          primary
            ? ({ backgroundColor: green, color: '#060706' } as CSSProperties)
            : ({ border: `1px solid rgba(243,240,232,.12)`, color: cream } as CSSProperties)
        }
      >
        {label}
        {primary ? (
          <span className="bmh-svc-cta-icon">
            <ArrowRight size={compact ? 14 : 16} color={green} weight="bold" />
          </span>
        ) : null}
      </a>
    </Link>
  );
}

export default function ServiceExperiencePage({ content }: ServiceExperiencePageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaderComplete, setLoaderComplete] = useState(false);

  const jsonLd = useMemo(
    () =>
      buildSeoJsonLd({
        path: content.canonicalPath,
        title: content.metaTitle,
        description: content.summary,
        schemaType: 'Service',
        faqs: [...content.faqs],
        breadcrumbs: [
          { name: 'Home', path: '/' },
          { name: content.headline, path: content.canonicalPath },
        ],
      }),
    [content],
  );

  useWebSeo({
    title: content.metaTitle,
    description: content.summary,
    canonicalPath: content.canonicalPath,
    robots: 'index,follow',
    jsonLd,
  });

  useServiceExperienceAnimations(containerRef, loaderComplete, () => setLoaderComplete(true));

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add('bmh-svc-active');
    html.style.backgroundColor = PAGE_BG;
    body.style.backgroundColor = PAGE_BG;
    body.style.overflow = 'hidden';

    return () => {
      html.classList.remove('bmh-svc-active');
      html.style.backgroundColor = '';
      body.style.backgroundColor = '';
      body.style.overflow = '';
    };
  }, []);

  const archiveImages = content.images.archive.length >= 5
    ? content.images.archive
    : [...content.images.archive, content.images.heroMain, content.images.heroAccent];

  return (
    <div ref={containerRef} className="bmh-svc-page" style={pageShellStyle}>
      <div className="bmh-svc-noise" aria-hidden="true" />
      <div className="bmh-svc-grid-veil" aria-hidden="true" />
      <div className="bmh-svc-page-rail" aria-hidden="true">
        BuildMyHouse / {content.locationLabel}
      </div>

      {!loaderComplete ? (
        <div className="bmh-svc-loader" aria-hidden="true">
          <div className="bmh-svc-loader__inner">
            <div className="bmh-svc-loader__brand">BuildMyHouse</div>
            <div className="bmh-svc-loader__track">
              <div className="bmh-svc-loader__bar" />
            </div>
            <div className="bmh-svc-loader__meta">
              <span className="bmh-svc-loader__pct">000</span>
              <span>{content.locationLabel}</span>
            </div>
          </div>
        </div>
      ) : null}

      <header className="bmh-svc-header sticky top-0 z-50 flex items-center justify-between px-5 py-5 md:px-8 lg:px-12" style={{ backgroundColor: 'rgba(6,7,6,0.82)', backdropFilter: 'blur(12px)' }}>
        <Link href={'/' as any} asChild>
          <a className="bmh-svc-logo-link">BuildMyHouse</a>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wide">
          <span style={{ color: 'rgba(243,240,232,.55)' }}>{content.locationLabel}</span>
        </nav>
        <CtaLink href={content.primaryCta.href} label={content.primaryCta.label} primary compact />
      </header>

      <main className="bmh-svc-main">
        {/* HERO */}
        <section className="bmh-svc-hero-section relative flex min-h-screen items-center overflow-hidden px-5 py-24 md:px-8 lg:px-12">
          <div className="bmh-svc-hero-copy relative z-20 max-w-[420px]">
            <p className="bmh-svc-section-label mb-8">
              Verified {content.headline} · {content.locationLabel}
            </p>
            <p className="bmh-svc-hero-lead">{content.heroLead}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <CtaLink href={content.primaryCta.href} label={content.primaryCta.label} primary />
              <CtaLink href={content.secondaryCta.href} label={content.secondaryCta.label} />
            </div>
            <p className="mt-6 max-w-sm text-sm leading-relaxed" style={{ color: 'rgba(243,240,232,.52)' }}>
              Describe the fault once, match a verified worker, and approve each stage with photo evidence before you pay.
            </p>
          </div>

          <div className="bmh-svc-hero-stack absolute left-1/2 top-[48%] z-10 h-[430px] w-[310px] -translate-x-1/2 -translate-y-1/2 md:h-[560px] md:w-[430px] lg:h-[620px] lg:w-[480px]">
            <div
              className="bmh-svc-hero-card absolute inset-0 -translate-x-20 translate-y-12 -rotate-[17deg] rounded-[20px]"
              style={{ background: '#151713' }}
            >
              <div
                className="h-full w-full rounded-[20px]"
                style={{ background: 'linear-gradient(135deg, rgba(34,197,94,.28), transparent 45%)' }}
              />
            </div>
            <div
              className="bmh-svc-hero-card absolute inset-0 translate-x-20 translate-y-10 rotate-[13deg] rounded-[20px]"
              style={{ background: '#d8cbb5' }}
            >
              <div className="absolute right-10 top-24 text-[110px] font-serif" style={{ color: 'rgba(34,197,94,.75)' }}>
                B
              </div>
            </div>
            <div className="bmh-svc-hero-card absolute inset-0 translate-x-32 translate-y-20 rotate-[18deg] rounded-[20px] bg-[#080808]">
              <div
                className="h-full w-full rounded-[20px]"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,.16), transparent 45%)' }}
              />
            </div>
            <div className="bmh-svc-hero-card absolute inset-0 rotate-[4deg] overflow-hidden rounded-[20px] bg-[#201714]">
              <img src={content.images.heroMain} alt={content.headline} className="h-full w-full object-cover saturate-125" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/48 via-transparent to-emerald-950/10" />
              <div className="absolute inset-0 mix-blend-overlay" style={{ background: 'rgba(34,197,94,.1)' }} />
            </div>
            <Link href={content.primaryCta.href as any} asChild>
              <a className="bmh-svc-hero-cta bmh-svc-hero-cta-btn" aria-label="Start repair">
                →
              </a>
            </Link>
          </div>

          <h1 className="bmh-svc-hero-wordmark pointer-events-none absolute -bottom-5 left-2 z-0 select-none text-[18vw] font-black leading-none md:-bottom-12 lg:left-6 lg:text-[16vw]">
            {content.headline}
          </h1>

          <div className="bmh-svc-hero-meta bmh-svc-glass absolute bottom-10 right-5 z-20 hidden w-[270px] rounded-[24px] p-6 md:right-8 lg:block">
            <div className="mb-6 text-2xl" style={{ color: green }}>
              ✳
            </div>
            <p className="text-lg leading-snug tracking-tight">{content.heroMeta}</p>
            <div className="mt-8 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(243,240,232,.45)' }}>
              <span>Evidence before payment</span>
              <span className="h-1 w-1 rounded-full" style={{ background: green }} />
              <span>{content.locationLabel}</span>
            </div>
          </div>
        </section>

        {/* TRUST METHOD */}
        <section className="bmh-svc-brand-section relative flex min-h-screen items-center overflow-hidden px-5 py-24 md:px-8 lg:px-12">
          <h2
            className="bmh-svc-brand-drift pointer-events-none absolute -top-16 left-0 text-[5rem] font-black leading-none md:text-[12rem] lg:text-[16rem]"
            style={{ color: 'rgba(243,240,232,.08)' }}
          >
            BuildMyHouse
          </h2>
          <div className="mx-auto grid w-full max-w-6xl gap-12 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="bmh-svc-section-label">Trust Method</p>
              <p className="bmh-svc-reveal mt-8 max-w-sm text-sm leading-7" style={{ color: muted }}>
                Verified workers, tracked repairs, and evidence before payment — the BuildMyHouse workflow in four moves.
              </p>
            </div>
            <div className="grid gap-6 md:col-span-7 md:col-start-6">
              {content.trustWords.map((word, index) => (
                <p
                  key={word}
                  className={`bmh-svc-brand-word text-5xl font-semibold tracking-tight md:text-7xl ${index % 2 ? 'text-right' : ''}`}
                >
                  {word}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* WHY BUILDMYHOUSE / PILLARS */}
        <section className="bmh-svc-services-section relative min-h-screen overflow-hidden px-5 py-24 md:px-8 lg:px-12">
          <div
            className="absolute left-1/2 top-0 h-[360px] w-[78%] -translate-x-1/2 overflow-hidden rounded-b-[32px] border-x border-b md:h-[480px] lg:h-[620px]"
            style={{ borderColor: 'rgba(243,240,232,.1)' }}
          >
            <img src={content.images.strip} alt="" className="bmh-svc-strip-image h-full w-full object-cover object-center opacity-70" />
          </div>
          <div className="grid min-h-screen items-center gap-14 md:grid-cols-12">
            <div className="bmh-svc-reveal md:col-span-3">
              <p className="bmh-svc-section-label mb-16">Why BuildMyHouse</p>
              <p className="max-w-60 text-sm font-medium leading-7" style={{ color: muted }}>
                For homeowners, landlords, and diaspora owners who need {content.headline.toLowerCase()} work without losing control of scope or spend.
              </p>
            </div>
            <div className="md:col-span-6 md:col-start-4">
              <p className="bmh-svc-services-copy text-4xl font-semibold leading-[0.95] tracking-tight md:text-6xl lg:text-7xl">
                {content.pillarsHeadline}
              </p>
              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                {content.pillars.map((pillar, index) => (
                  <div key={pillar.title} className="bmh-svc-pillar-card bmh-svc-glass rounded-[28px] p-6">
                    <p className="mb-14 text-xs font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(243,240,232,.44)' }}>
                      {String(index + 1).padStart(2, '0')}
                    </p>
                    <h3 className="text-2xl font-semibold tracking-tight">{pillar.title}</h3>
                    <p className="mt-4 text-sm leading-relaxed" style={{ color: 'rgba(243,240,232,.54)' }}>
                      {pillar.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bmh-svc-reveal md:col-span-2 md:col-start-11">
              <p className="mb-6 text-xs font-bold uppercase tracking-[0.12em]">
                Start now <span aria-hidden="true">→</span>
              </p>
              <p className="max-w-60 text-sm font-medium leading-7" style={{ color: muted }}>
                The outcome is not another referral. It is a tracked repair you can approve with evidence.
              </p>
            </div>
          </div>
        </section>

        {/* REPAIR TELEMETRY */}
        <section className="bmh-svc-stats-section relative min-h-screen overflow-hidden px-5 py-24 md:px-8 lg:px-12">
          <figure className="bmh-svc-parallax-image bmh-svc-parallax-slow pointer-events-none right-4 top-32 h-28 w-40 rotate-[7deg] md:right-8 md:top-28 md:h-48 md:w-72">
            <img src={content.images.parallaxA} alt="" />
          </figure>
          <figure className="bmh-svc-parallax-image bmh-svc-parallax-fast pointer-events-none bottom-24 left-4 h-24 w-36 rotate-[-9deg] md:bottom-20 md:left-10 md:h-40 md:w-60">
            <img src={content.images.parallaxB} alt="" />
          </figure>
          <div className="grid min-h-[70vh] items-center gap-12 md:grid-cols-12">
            <div className="bmh-svc-reveal md:col-span-3">
              <p className="bmh-svc-section-label mb-8">Repair Telemetry</p>
              <p className="max-w-72 text-sm font-medium leading-7" style={{ color: muted }}>
                Every stage should reduce explanation time — for you, your family, and your worker.
              </p>
              <Link href={content.primaryCta.href as any} asChild>
                <a className="mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em]">
                  Start a tracked repair <ArrowRight size={16} color={green} weight="bold" />
                </a>
              </Link>
            </div>
            <div className="bmh-svc-reveal md:col-span-5 md:col-start-5">
              <h2 className="text-6xl font-semibold leading-[0.92] tracking-tight md:text-8xl lg:text-9xl">
                Repair
                <br />
                Telemetry
              </h2>
            </div>
            <div className="md:col-span-3 md:col-start-10">
              <div className="grid grid-cols-2 gap-4">
                {content.stats.map((stat) => (
                  <div key={stat.label} className="bmh-svc-stat-card bmh-svc-glass rounded-[24px] p-5">
                    <p className="text-5xl font-semibold tracking-tight">{stat.value}</p>
                    <p className="mt-6 text-xs font-medium" style={{ color: 'rgba(243,240,232,.5)' }}>
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FIELD ARCHIVE */}
        <section className="bmh-svc-archive-section relative overflow-hidden px-5 py-24 md:px-8 lg:px-12">
          <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-12">
            <div className="md:col-span-3">
              <p className="bmh-svc-section-label">Field Archive</p>
              <p className="mt-8 max-w-64 text-sm font-medium leading-7" style={{ color: muted }}>
                Visual proof from real {content.headline.toLowerCase()} jobs — scope, materials, and completion evidence.
              </p>
            </div>
            <div className="md:col-span-8 md:col-start-5">
              <h2 className="bmh-svc-archive-title text-[42px] font-black leading-[0.9] tracking-tight md:text-[72px] lg:text-[96px]">
                {content.archiveTitle}
              </h2>
            </div>
          </div>
          <div className="bmh-svc-archive-gallery mt-20 flex gap-5 will-change-transform">
            {archiveImages.slice(0, 5).map((src, index) => (
              <figure
                key={src + index}
                className={`bmh-svc-archive-card shrink-0 overflow-hidden rounded-[34px] border bg-[#101310] ${
                  index % 2 === 1 ? 'mt-20 h-[360px] w-[300px] md:h-[460px] md:w-[360px]' : 'h-[420px] w-[320px] md:h-[560px] md:w-[420px]'
                } ${index === 3 ? 'mt-28' : ''}`}
                style={{ borderColor: 'rgba(243,240,232,.1)' }}
              >
                <img src={src} alt="" className="h-full w-full object-cover opacity-75" />
              </figure>
            ))}
          </div>
        </section>

        {/* WORK / 04 STAGES */}
        <section className="bmh-svc-work-section relative min-h-screen overflow-hidden px-5 py-24 md:px-8 lg:px-12">
          <div className="grid min-h-screen items-center gap-12 md:grid-cols-12">
            <div className="bmh-svc-work-copy md:col-span-3">
              <p className="bmh-svc-section-label mb-8">Systems</p>
              <h2 className="text-5xl font-semibold leading-[0.95] tracking-tight md:text-6xl">{content.workTitle}</h2>
              <p className="mt-6 max-w-72 text-sm font-medium leading-7" style={{ color: muted }}>
                {content.workBody}
              </p>
              <Link href={content.primaryCta.href as any} asChild>
                <a className="bmh-svc-magnetic-button mt-8 inline-flex rounded-full border px-5 py-3 text-xs font-bold uppercase tracking-[0.12em]" style={{ borderColor: 'rgba(243,240,232,.12)' }}>
                  Start the loop
                </a>
              </Link>
            </div>
            <div className="relative md:col-span-7 md:col-start-4">
              <div className="relative flex min-h-[520px] items-center justify-center">
                <span
                  className="bmh-svc-masked-number text-[13rem] font-black leading-none tracking-tight md:text-[24rem] lg:text-[29rem]"
                  style={{ '--number-image': `url('${content.images.heroMain}')` } as CSSProperties}
                >
                  04
                </span>
                <img
                  src={content.images.heroAccent}
                  alt=""
                  className="bmh-svc-project-card absolute left-0 top-14 hidden h-44 w-72 rotate-[-14deg] rounded-[18px] border object-cover md:block"
                  style={{ borderColor: 'rgba(243,240,232,.1)' }}
                />
                <img
                  src={content.images.heroMain}
                  alt=""
                  className="bmh-svc-project-card absolute right-4 top-6 hidden h-44 w-72 rotate-[10deg] rounded-[18px] border object-cover md:block"
                  style={{ borderColor: 'rgba(243,240,232,.1)' }}
                />
              </div>
            </div>
            <div className="bmh-svc-reveal md:col-span-2">
              <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: 'rgba(243,240,232,.62)' }}>
                Repair Archive
              </p>
              <p className="mt-8 text-sm font-medium leading-7" style={{ color: 'rgba(243,240,232,.5)' }}>
                Scope, match, track, approve — the same loop for every {content.headline.toLowerCase()} job.
              </p>
            </div>
          </div>
        </section>

        {/* FIELD NOTES EDITORIAL */}
        <section className="bmh-svc-field-notes-section relative min-h-screen overflow-hidden px-5 py-24 md:px-8 lg:px-12">
          <h2 className="bmh-svc-partners-heading pointer-events-none absolute left-5 top-16 text-[18vw] font-black leading-none md:left-8 md:top-10 md:text-[15vw]">
            Field Notes
          </h2>
          <figure className="bmh-svc-parallax-image bmh-svc-parallax-slow pointer-events-none absolute right-5 top-28 hidden h-44 w-72 rotate-[5deg] overflow-hidden rounded-[28px] border md:block lg:right-14 lg:h-56 lg:w-96" style={{ borderColor: 'rgba(243,240,232,.1)' }}>
            <img src={content.images.parallaxA} alt="" className="h-full w-full object-cover" />
          </figure>
          <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center">
            <div className="mb-16 grid gap-8 md:grid-cols-12">
              <div className="md:col-span-3">
                <p className="bmh-svc-section-label">Field Notes</p>
              </div>
              <div className="md:col-span-7 md:col-start-5">
                <h2 className="bmh-svc-field-notes-heading text-[42px] font-black leading-[0.9] tracking-tight md:text-[72px] lg:text-[96px]">
                  {content.fieldNotesHeading}
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
              {content.fieldNotes[0] ? (
                <article className="bmh-svc-note-card group relative min-h-[430px] overflow-hidden rounded-[38px] border bg-[#f3f0e8] p-8 text-[#060706] md:col-span-5" style={{ borderColor: 'rgba(243,240,232,.1)' }}>
                  <div className="absolute -right-6 -top-8 text-[180px] font-black leading-none tracking-tight text-[#060706]/[0.06]">
                    {content.fieldNotes[0].number}
                  </div>
                  <div className="relative z-10 flex h-full flex-col justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#060706]/45">
                        {content.fieldNotes[0].number} / Signal
                      </p>
                      <h3 className="mt-12 max-w-sm text-[42px] font-black leading-[0.88] tracking-tight md:text-[56px]">
                        {content.fieldNotes[0].title}
                      </h3>
                    </div>
                    <p className="max-w-sm text-base font-semibold leading-relaxed text-[#060706]/62">{content.fieldNotes[0].body}</p>
                  </div>
                </article>
              ) : null}
              <article className="bmh-svc-note-card group relative min-h-[430px] overflow-hidden rounded-[38px] border bg-[#111612] md:col-span-4" style={{ borderColor: 'rgba(243,240,232,.1)' }}>
                <img src={content.images.heroMain} alt="" className="h-full w-full object-cover opacity-70 transition duration-700 group-hover:scale-105 group-hover:opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#060706] via-[#060706]/25 to-transparent" />
                {content.fieldNotes[1] ? (
                  <div className="absolute bottom-7 left-7 right-7">
                    <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: 'rgba(243,240,232,.5)' }}>
                      {content.fieldNotes[1].number} / Scope
                    </p>
                    <h3 className="mt-5 text-[30px] font-black leading-[0.92] tracking-tight md:text-[34px]">{content.fieldNotes[1].title}</h3>
                  </div>
                ) : null}
              </article>
              <article className="bmh-svc-note-card relative min-h-[430px] overflow-hidden rounded-[38px] border p-7 md:col-span-3" style={{ borderColor: 'rgba(243,240,232,.1)', background: 'rgba(255,255,255,.035)' }}>
                <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: 'rgba(243,240,232,.42)' }}>
                  Index
                </p>
                <div className="mt-10 space-y-5">
                  {content.fieldNotes.slice(2).map((note) => (
                    <div key={note.number} className="border-b pb-5" style={{ borderColor: 'rgba(243,240,232,.1)' }}>
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'rgba(243,240,232,.32)' }}>
                        {note.number}
                      </p>
                      <p className="mt-2 text-2xl font-black tracking-tight">{note.title}</p>
                    </div>
                  ))}
                </div>
              </article>
              {content.pillars[0] ? (
                <article className="bmh-svc-note-card relative overflow-hidden rounded-[38px] border bg-[#0c0f0c] p-8 md:col-span-7" style={{ borderColor: 'rgba(243,240,232,.1)' }}>
                  <div className="grid gap-8 md:grid-cols-12">
                    <div className="md:col-span-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: 'rgba(243,240,232,.42)' }}>
                        04 / Evidence
                      </p>
                    </div>
                    <div className="md:col-span-8">
                      <h3 className="max-w-2xl text-[40px] font-black leading-[0.9] tracking-tight md:text-[56px]">
                        {content.pillars[0].title}. {content.pillars[0].body}
                      </h3>
                    </div>
                  </div>
                </article>
              ) : null}
              <article className="bmh-svc-note-card relative overflow-hidden rounded-[38px] border p-8 text-[#060706] md:col-span-5" style={{ borderColor: 'rgba(243,240,232,.1)', background: green }}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#060706]/50">05 / Start</p>
                <h3 className="mt-12 max-w-sm text-[38px] font-black leading-[0.9] tracking-tight md:text-[52px]">
                  Start your {content.headline.toLowerCase()} repair today.
                </h3>
                <p className="mt-8 max-w-sm text-sm font-semibold leading-relaxed text-[#060706]/62">
                  Describe the fault, match verified workers, and approve each stage with photo evidence.
                </p>
                <div className="mt-8">
                  <CtaLink href={content.primaryCta.href} label={content.primaryCta.label} primary />
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* PROCESS */}
        <section className="bmh-svc-process-section relative min-h-screen overflow-hidden px-5 py-24 md:px-8 lg:px-12">
          <figure className="bmh-svc-parallax-image bmh-svc-parallax-slow pointer-events-none right-4 top-24 h-28 w-44 rotate-[4deg] md:right-8 md:top-20 md:h-56 md:w-80">
            <img src={content.images.parallaxB} alt="" />
          </figure>
          <div className="bmh-svc-reveal mb-16 max-w-2xl">
            <p className="bmh-svc-section-label mb-8">Operating Loop</p>
            <h2 className="text-6xl font-semibold leading-[0.95] tracking-tight md:text-8xl">Operating Loop</h2>
            <p className="mt-6 max-w-md text-sm font-medium leading-7" style={{ color: muted }}>
              A compact sequence for turning a messy {content.headline.toLowerCase()} fault into a repair you can trust.
            </p>
          </div>
          <div className="relative h-72 overflow-hidden rounded-[32px] border mb-8" style={{ borderColor: 'rgba(243,240,232,.1)', background: 'rgba(255,255,255,.025)' }}>
            {content.processSteps.map((step, index) => (
              <div
                key={step.label}
                className="bmh-svc-timeline-bar absolute h-7 rounded-r-full"
                style={{ left: `${index * 18}%`, top: `${2.5 + index * 2.5}rem`, width: index === 2 || index === 3 ? '33%' : '25%' }}
              >
                <span className="ml-4 text-xs font-bold leading-7 text-[#060706]">{step.label}</span>
              </div>
            ))}
            <div className="grid h-full grid-cols-4 divide-x" style={{ borderColor: 'rgba(243,240,232,.1)' }} />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {content.processSteps.map((step) => (
              <div key={step.title} className="bmh-svc-process-col bmh-svc-glass rounded-[28px] p-6">
                <h3 className="text-2xl font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-5 text-sm leading-relaxed" style={{ color: muted }}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ENGAGE / PRICING */}
        <section className="bmh-svc-pricing-section relative min-h-screen px-5 py-24 md:px-8 lg:px-12">
          <div className="grid gap-12 md:grid-cols-12">
            <div className="bmh-svc-pricing-copy md:col-span-4">
              <p className="bmh-svc-section-label mb-8">Engage</p>
              <h2 className="text-6xl font-semibold leading-[0.95] tracking-tight md:text-8xl">Engage</h2>
              <p className="mt-6 max-w-72 text-sm font-medium leading-7" style={{ color: muted }}>
                {content.engageIntro}
              </p>
            </div>
            <div className="grid gap-5 md:col-span-7 md:col-start-6">
              {content.engageCards.map((card) => (
                <div key={card.title} className="bmh-svc-pricing-card bmh-svc-glass rounded-[36px] p-8">
                  {card.badge ? (
                    <div className="mb-10 flex flex-wrap gap-2">
                      <span className="bmh-svc-badge">{card.badge}</span>
                    </div>
                  ) : null}
                  <h3 className="text-4xl font-semibold tracking-tight md:text-5xl">{card.title}</h3>
                  <p className="mt-3 text-sm font-medium" style={{ color: 'rgba(243,240,232,.54)' }}>
                    {card.subtitle}
                  </p>
                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    {card.features.map((feature) => (
                      <p key={feature} className="flex items-center gap-2 text-sm font-medium">
                        <CheckCircle size={16} color={green} weight="fill" />
                        {feature}
                      </p>
                    ))}
                  </div>
                  <div className="mt-10">
                    <CtaLink href={content.primaryCta.href} label={content.primaryCta.label} primary />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* REVIEWS */}
        <section className="bmh-svc-reviews-section relative overflow-hidden px-5 py-24 md:px-8 lg:px-12">
          <p className="bmh-svc-section-label mb-8">Homeowner Proof</p>
          <div className="grid gap-5 md:grid-cols-12">
            {content.reviews.map((review, index) => (
              <article
                key={review.name + index}
                className={`bmh-svc-review-card bmh-svc-glass rounded-[32px] p-8 ${
                  index === 0 ? 'md:col-span-5 bg-[#f3f0e8] text-[#060706]' : 'md:col-span-4'
                }`}
              >
                <p className="text-lg leading-relaxed font-medium">&ldquo;{review.quote}&rdquo;</p>
                <p className="mt-6 text-sm font-bold">{review.name}</p>
                <p className="text-xs mt-1 opacity-60">{review.detail}</p>
              </article>
            ))}
          </div>
        </section>

        {/* CONTACT + FAQ */}
        <section className="bmh-svc-contact-section relative min-h-screen px-5 py-24 md:px-8 lg:px-12">
          <div className="grid gap-14 md:grid-cols-12">
            <div className="bmh-svc-contact-form md:col-span-4">
              <p className="bmh-svc-section-label mb-10">Start</p>
              <div className="bmh-svc-contact-field bmh-svc-glass mb-5 flex w-full max-w-sm items-center justify-between rounded-[22px] px-5 py-4 text-sm font-medium" style={{ color: 'rgba(243,240,232,.58)' }}>
                {content.headline} · {content.locationLabel}
              </div>
              <div className="bmh-svc-contact-field mb-5 w-full max-w-sm border-b py-5 text-sm font-medium" style={{ borderColor: 'rgba(243,240,232,.1)', color: 'rgba(243,240,232,.58)' }}>
                Describe the fault with <span style={{ color: cream }}>photos</span>
              </div>
              <div className="bmh-svc-contact-field mb-10 w-full max-w-sm border-b py-5 text-sm font-medium" style={{ borderColor: 'rgba(243,240,232,.1)', color: 'rgba(243,240,232,.58)' }}>
                Match verified workers and track each stage
              </div>
              <p className="mb-8 max-w-72 text-sm font-medium leading-7" style={{ color: muted }}>
                {content.contactPrompt}
              </p>
              <Link href={content.primaryCta.href as any} asChild>
                <a className="bmh-svc-magnetic-button inline-flex items-center gap-4 rounded-full border px-4 py-3 text-xs font-bold uppercase tracking-[0.12em]" style={{ borderColor: 'rgba(243,240,232,.12)' }}>
                  Begin{' '}
                  <span className="rounded-full px-5 py-3 text-[#060706]" style={{ background: green }}>
                    {content.primaryCta.label}
                  </span>
                </a>
              </Link>
            </div>
            <div className="md:col-span-7 md:col-start-6">
              <p className="mb-6 text-xs font-bold uppercase tracking-[0.14em]">Common questions</p>
              {content.faqs.map((faq) => (
                <div key={faq.question} className="bmh-svc-faq-row border-t py-9" style={{ borderColor: 'rgba(243,240,232,.1)' }}>
                  <h3 className="text-2xl md:text-4xl font-semibold tracking-tight">{faq.question}</h3>
                  <p className="mt-5 max-w-2xl text-sm font-medium leading-7" style={{ color: muted }}>
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bmh-svc-footer-section relative min-h-screen overflow-hidden px-5 py-24 md:px-8 lg:px-12">
          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-3">
              <p className="bmh-svc-section-label">BuildMyHouse</p>
            </div>
            <div className="md:col-span-9">
              <h2 className="bmh-svc-footer-wordmark text-[4rem] font-black leading-none md:text-[8rem] lg:text-[11rem]">
                BuildMyHouse
              </h2>
            </div>
          </div>
          <div className="absolute right-5 top-28 text-xs font-bold uppercase tracking-[0.14em] md:right-8" style={{ color: 'rgba(243,240,232,.44)' }}>
            © 2024–26
          </div>
          <div
            className="bmh-svc-footer-links absolute bottom-16 left-5 right-5 grid gap-10 border-t pt-10 md:left-8 md:right-8 md:grid-cols-12"
            style={{ borderColor: 'rgba(243,240,232,.12)' }}
          >
            <div className="md:col-span-5">
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.22em]" style={{ color: 'rgba(243,240,232,.36)' }}>
                Verified property work / {content.locationLabel}
              </p>
              <h3 className="max-w-xl text-[36px] font-black leading-[0.92] tracking-tight md:text-[56px] lg:text-[64px]">
                Start your {content.headline.toLowerCase()} repair with evidence before payment.
              </h3>
              <div className="mt-10 flex flex-wrap gap-3">
                <CtaLink href={content.primaryCta.href} label={content.primaryCta.label} primary />
                <CtaLink href={content.secondaryCta.href} label={content.secondaryCta.label} />
              </div>
            </div>
            <div className="md:col-span-3 md:col-start-7">
              <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: 'rgba(243,240,232,.36)' }}>
                Guides
              </p>
              <p className="mt-6 text-sm font-medium leading-relaxed" style={{ color: 'rgba(243,240,232,.58)' }}>
                Practical reading for homeowners planning repairs, renovations, or contractor hires in Nigeria.
              </p>
              {content.articleLinks.map((link) => (
                <Link key={link.href} href={link.href as any} asChild>
                  <a className="group mt-6 flex items-center justify-between border-b pb-4 text-sm font-bold transition hover:opacity-80" style={{ borderColor: 'rgba(243,240,232,.14)', color: cream }}>
                    {link.label}
                    <span className="transition duration-300 group-hover:translate-x-2">→</span>
                  </a>
                </Link>
              ))}
            </div>
            <div className="md:col-span-2 md:col-start-11">
              <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: 'rgba(243,240,232,.36)' }}>
                Field
              </p>
              <div className="mt-6 space-y-3 text-sm font-semibold" style={{ color: 'rgba(243,240,232,.5)' }}>
                <p>{content.locationLabel}</p>
                <p>{content.headline} repairs</p>
                <p>Evidence before payment</p>
              </div>
            </div>
            <div className="md:col-span-12">
              <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t pt-5" style={{ borderColor: 'rgba(243,240,232,.12)' }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(243,240,232,.34)' }}>
                  © 2024-2026 BuildMyHouse
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(243,240,232,.34)' }}>
                  Lagos / Nigeria / Repairs-first
                </p>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
