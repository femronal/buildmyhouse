import { createElement, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'expo-router';
import { ArrowRight } from 'phosphor-react-native';
import type { ServiceExperienceContent } from '@/lib/service-experience-content';
import { buildSeoJsonLd } from '@/lib/seo-schema';
import { useWebSeo } from '@/lib/seo';
import { useServiceExperienceAnimations } from '@/components/service-experience/useServiceExperienceAnimations.web';

type ServiceExperiencePageProps = {
  content: ServiceExperienceContent;
};

const cream = '#f3f0e8';
const orange = '#ff5a1f';

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

  const CtaLink = ({ href, label, primary }: { href: string; label: string; primary?: boolean }) =>
    createElement(
      Link,
      { href: href as any, asChild: true },
      createElement(
        'a',
        {
          className: primary ? 'bmh-svc-magnetic-button bmh-svc-primary-cta' : 'bmh-svc-magnetic-button bmh-svc-secondary-cta',
          style: primary
            ? ({ backgroundColor: orange, color: '#060706' } as CSSProperties)
            : ({ border: `1px solid rgba(243,240,232,.12)`, color: cream } as CSSProperties),
        },
        label,
        primary
          ? createElement('span', { className: 'bmh-svc-cta-icon' }, createElement(ArrowRight, { size: 16, color: '#060706', weight: 'bold' }))
          : null,
      ),
    );

  return createElement(
    'div',
    { ref: containerRef, className: 'bmh-svc-page' },
    createElement('div', { className: 'bmh-svc-noise', 'aria-hidden': 'true' }),
    createElement('div', { className: 'bmh-svc-grid-veil', 'aria-hidden': 'true' }),
    createElement('div', { className: 'bmh-svc-page-rail', 'aria-hidden': 'true' }, `BuildMyHouse / ${content.locationLabel}`),
    !loaderComplete
      ? createElement(
          'div',
          { className: 'bmh-svc-loader', 'aria-hidden': 'true' },
          createElement(
            'div',
            { className: 'bmh-svc-loader__inner' },
            createElement('div', { className: 'bmh-svc-loader__brand' }, 'BuildMyHouse'),
            createElement('div', { className: 'bmh-svc-loader__track' }, createElement('div', { className: 'bmh-svc-loader__bar' })),
            createElement(
              'div',
              { className: 'bmh-svc-loader__meta' },
              createElement('span', { className: 'bmh-svc-loader__pct' }, '000'),
              createElement('span', null, content.locationLabel),
            ),
          ),
        )
      : null,
    createElement(
      'header',
      { className: 'bmh-svc-header fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 py-5 md:px-8 lg:px-12' },
      createElement(Link, { href: '/' as any, asChild: true }, createElement('a', { className: 'bmh-svc-logo-link' }, 'BuildMyHouse')),
      createElement('nav', { className: 'hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wide' }, createElement('span', { style: { color: 'rgba(243,240,232,.55)' } }, content.locationLabel)),
      createElement(CtaLink, { href: content.primaryCta.href, label: content.primaryCta.label, primary: true }),
    ),
    createElement(
      'main',
      { className: 'relative z-10 overflow-hidden' },
      createElement(
        'section',
        { className: 'bmh-svc-hero-section relative flex min-h-screen items-center overflow-hidden px-5 py-24 md:px-8 lg:px-12' },
        createElement(
          'div',
          { className: 'bmh-svc-hero-copy relative z-20 max-w-[420px]' },
          createElement('p', { className: 'bmh-svc-section-label mb-8' }, `Verified ${content.headline} · ${content.locationLabel}`),
          createElement('p', { className: 'bmh-svc-hero-lead' }, content.heroLead),
          createElement('div', { className: 'mt-10 flex flex-wrap gap-3' }, createElement(CtaLink, { href: content.primaryCta.href, label: content.primaryCta.label, primary: true }), createElement(CtaLink, { href: content.secondaryCta.href, label: content.secondaryCta.label })),
        ),
        createElement(
          'div',
          { className: 'bmh-svc-hero-stack absolute left-1/2 top-[48%] z-10 h-[430px] w-[310px] -translate-x-1/2 -translate-y-1/2 md:h-[560px] md:w-[430px]' },
          createElement('div', { className: 'bmh-svc-hero-card absolute inset-0 -translate-x-20 translate-y-12 -rotate-[17deg] rounded-[20px]', style: { background: '#151713' } }),
          createElement('div', { className: 'bmh-svc-hero-card absolute inset-0 translate-x-20 translate-y-10 rotate-[13deg] rounded-[20px]', style: { background: '#d8cbb5' } }),
          createElement('div', { className: 'bmh-svc-hero-card absolute inset-0 rotate-[4deg] overflow-hidden rounded-[20px]' }, createElement('img', { src: content.images.heroMain, alt: content.headline, className: 'h-full w-full object-cover' })),
          createElement(Link, { href: content.primaryCta.href as any, asChild: true }, createElement('a', { className: 'bmh-svc-hero-cta bmh-svc-hero-cta-btn', 'aria-label': 'Start repair' }, '→')),
        ),
        createElement('h1', { className: 'bmh-svc-hero-wordmark pointer-events-none absolute -bottom-5 left-2 z-0 select-none text-[18vw] font-black leading-none md:-bottom-12 lg:left-6 lg:text-[16vw]' }, content.headline),
        createElement(
          'div',
          { className: 'bmh-svc-hero-meta bmh-svc-glass absolute bottom-10 right-5 z-20 hidden w-[270px] rounded-[24px] p-6 md:right-8 lg:block' },
          createElement('div', { className: 'mb-6 text-2xl', style: { color: orange } }, '✳'),
          createElement('p', { className: 'text-lg leading-snug tracking-tight' }, content.heroMeta),
          createElement('div', { className: 'mt-8 text-[10px] font-bold uppercase tracking-[0.14em]', style: { color: 'rgba(243,240,232,.45)' } }, 'Evidence before payment'),
        ),
      ),
      createElement(
        'section',
        { className: 'bmh-svc-brand-section relative flex min-h-screen items-center overflow-hidden px-5 py-24 md:px-8 lg:px-12' },
        createElement('h2', { className: 'bmh-svc-brand-drift pointer-events-none absolute -top-16 left-0 text-[5rem] font-black leading-none md:text-[12rem] lg:text-[16rem]', style: { color: 'rgba(243,240,232,.08)' } }, 'BuildMyHouse'),
        createElement(
          'div',
          { className: 'mx-auto grid w-full max-w-6xl gap-12 md:grid-cols-12' },
          createElement(
            'div',
            { className: 'md:col-span-4' },
            createElement('p', { className: 'bmh-svc-section-label' }, 'Trust Method'),
            createElement('p', { className: 'bmh-svc-reveal mt-8 max-w-sm text-sm leading-7', style: { color: 'rgba(243,240,232,.56)' } }, 'Verified workers, tracked repairs, and evidence before payment — the BuildMyHouse workflow in four moves.'),
          ),
          createElement(
            'div',
            { className: 'grid gap-6 md:col-span-7 md:col-start-6' },
            ...content.trustWords.map((word, index) =>
              createElement('p', { key: word, className: `bmh-svc-brand-word text-5xl font-semibold tracking-tight md:text-7xl ${index % 2 ? 'text-right' : ''}` }, word),
            ),
          ),
        ),
      ),
      createElement(
        'section',
        { className: 'bmh-svc-services-section relative min-h-screen overflow-hidden px-5 py-24 md:px-8 lg:px-12' },
        createElement(
          'div',
          { className: 'absolute left-1/2 top-0 h-[360px] w-[78%] -translate-x-1/2 overflow-hidden rounded-b-[32px] border-x border-b', style: { borderColor: 'rgba(243,240,232,.1)' } },
          createElement('img', { src: content.images.strip, alt: '', className: 'bmh-svc-strip-image h-full w-full object-cover opacity-70' }),
        ),
        createElement(
          'div',
          { className: 'grid min-h-screen items-center gap-14 md:grid-cols-12' },
          createElement('div', { className: 'md:col-span-3' }, createElement('p', { className: 'bmh-svc-section-label mb-16' }, 'Why BuildMyHouse')),
          createElement(
            'div',
            { className: 'md:col-span-8 md:col-start-4' },
            createElement('p', { className: 'bmh-svc-services-copy text-4xl font-semibold leading-[0.95] tracking-tight md:text-6xl' }, 'Repairs with clearer scope, verified workers, and proof before payment.'),
            createElement(
              'div',
              { className: 'mt-10 grid gap-3 sm:grid-cols-2' },
              ...content.pillars.map((pillar, index) =>
                createElement(
                  'div',
                  { key: pillar.title, className: 'bmh-svc-pillar-card bmh-svc-glass rounded-[28px] p-6' },
                  createElement('p', { className: 'mb-10 text-xs font-bold uppercase tracking-[0.14em]', style: { color: 'rgba(243,240,232,.44)' } }, String(index + 1).padStart(2, '0')),
                  createElement('h3', { className: 'text-2xl font-semibold tracking-tight' }, pillar.title),
                  createElement('p', { className: 'mt-4 text-sm leading-relaxed', style: { color: 'rgba(243,240,232,.54)' } }, pillar.body),
                ),
              ),
            ),
          ),
        ),
      ),
      createElement(
        'section',
        { className: 'bmh-svc-stats-section relative min-h-[70vh] overflow-hidden px-5 py-24 md:px-8 lg:px-12' },
        createElement(
          'div',
          { className: 'grid items-center gap-12 md:grid-cols-12' },
          createElement('div', { className: 'md:col-span-5' }, createElement('h2', { className: 'text-5xl font-semibold tracking-tight md:text-7xl' }, 'Repair\nTelemetry')),
          createElement(
            'div',
            { className: 'md:col-span-6 md:col-start-7 grid grid-cols-2 gap-4' },
            ...content.stats.map((stat) =>
              createElement(
                'div',
                { key: stat.label, className: 'bmh-svc-stat-card bmh-svc-glass rounded-[24px] p-5' },
                createElement('p', { className: 'text-5xl font-semibold tracking-tight' }, stat.value),
                createElement('p', { className: 'mt-6 text-xs font-medium', style: { color: 'rgba(243,240,232,.5)' } }, stat.label),
              ),
            ),
          ),
        ),
      ),
      createElement(
        'section',
        { className: 'bmh-svc-process-section relative overflow-hidden px-5 py-24 md:px-8 lg:px-12' },
        createElement('p', { className: 'bmh-svc-section-label mb-8' }, 'Operating Loop'),
        createElement('h2', { className: 'text-5xl font-semibold tracking-tight md:text-7xl mb-10' }, 'How it works'),
        createElement(
          'div',
          { className: 'relative h-64 overflow-hidden rounded-[32px] border mb-8', style: { borderColor: 'rgba(243,240,232,.1)', background: 'rgba(255,255,255,.025)' } },
          ...content.processSteps.map((step, index) =>
            createElement(
              'div',
              {
                key: step.label,
                className: 'bmh-svc-timeline-bar absolute h-7 rounded-r-full',
                style: { left: `${index * 18}%`, top: `${2.5 + index * 2.5}rem`, width: '25%' },
              },
              createElement('span', { className: 'ml-4 text-xs font-bold leading-7', style: { color: '#060706' } }, step.label),
            ),
          ),
        ),
        createElement(
          'div',
          { className: 'grid gap-4 md:grid-cols-4' },
          ...content.processSteps.map((step) =>
            createElement(
              'div',
              { key: step.title, className: 'bmh-svc-process-col bmh-svc-glass rounded-[28px] p-6' },
              createElement('h3', { className: 'text-2xl font-semibold tracking-tight' }, step.title),
              createElement('p', { className: 'mt-5 text-sm leading-relaxed', style: { color: 'rgba(243,240,232,.56)' } }, step.body),
            ),
          ),
        ),
      ),
      createElement(
        'section',
        { className: 'bmh-svc-field-notes-section relative overflow-hidden px-5 py-16 md:px-8 lg:px-12' },
        createElement('p', { className: 'bmh-svc-section-label mb-8' }, 'What to know'),
        createElement(
          'div',
          { className: 'grid gap-4 md:grid-cols-3' },
          ...content.fieldNotes.map((note) =>
            createElement(
              'article',
              { key: note.number, className: 'bmh-svc-glass rounded-[28px] p-6' },
              createElement('p', { className: 'text-xs font-black uppercase tracking-[0.18em] opacity-40' }, note.number),
              createElement('h3', { className: 'mt-4 text-2xl font-black tracking-tight' }, note.title),
              createElement('p', { className: 'mt-3 text-sm leading-relaxed opacity-60' }, note.body),
            ),
          ),
        ),
      ),
      createElement(
        'section',
        { className: 'bmh-svc-reviews-section relative overflow-hidden px-5 py-24 md:px-8 lg:px-12' },
        createElement('p', { className: 'bmh-svc-section-label mb-8' }, 'Field Notes'),
        createElement(
          'div',
          { className: 'grid gap-5 md:grid-cols-12' },
          ...content.reviews.map((review, index) =>
            createElement(
              'article',
              {
                key: review.name + index,
                className: `bmh-svc-review-card bmh-svc-glass rounded-[32px] p-8 ${index === 0 ? 'md:col-span-5 bg-[#f3f0e8] text-[#060706]' : 'md:col-span-4'}`,
              },
              createElement('p', { className: 'text-lg leading-relaxed font-medium' }, `"${review.quote}"`),
              createElement('p', { className: 'mt-6 text-sm font-bold' }, review.name),
              createElement('p', { className: 'text-xs mt-1 opacity-60' }, review.detail),
            ),
          ),
        ),
      ),
      content.faqs.length
        ? createElement(
            'section',
            { className: 'bmh-svc-faq-section relative px-5 py-24 md:px-8 lg:px-12' },
            createElement('p', { className: 'bmh-svc-section-label mb-8' }, 'FAQ'),
            ...content.faqs.map((faq) =>
              createElement(
                'div',
                { key: faq.question, className: 'bmh-svc-faq-row border-t py-8', style: { borderColor: 'rgba(243,240,232,.1)' } },
                createElement('h3', { className: 'text-2xl md:text-4xl font-semibold tracking-tight' }, faq.question),
                createElement('p', { className: 'mt-4 max-w-3xl text-sm leading-7', style: { color: 'rgba(243,240,232,.56)' } }, faq.answer),
              ),
            ),
          )
        : null,
      createElement(
        'footer',
        { className: 'bmh-svc-footer-section relative min-h-[70vh] overflow-hidden px-5 py-24 md:px-8 lg:px-12' },
        createElement('h2', { className: 'bmh-svc-footer-wordmark text-[4rem] font-black leading-none md:text-[8rem] lg:text-[11rem]' }, 'BuildMyHouse'),
        createElement(
          'div',
          { className: 'bmh-svc-footer-cta mt-16 grid gap-10 md:grid-cols-12 border-t pt-10', style: { borderColor: 'rgba(243,240,232,.12)' } },
          createElement(
            'div',
            { className: 'md:col-span-6' },
            createElement('p', { className: 'text-3xl md:text-5xl font-black tracking-tight max-w-xl' }, `Start your ${content.headline.toLowerCase()} repair with evidence before payment.`),
            createElement('div', { className: 'mt-8 flex flex-wrap gap-3' }, createElement(CtaLink, { href: content.primaryCta.href, label: content.primaryCta.label, primary: true }), createElement(CtaLink, { href: content.secondaryCta.href, label: content.secondaryCta.label })),
          ),
          createElement(
            'div',
            { className: 'md:col-span-4 md:col-start-9' },
            createElement('p', { className: 'bmh-svc-section-label mb-4' }, 'Guides'),
            ...content.articleLinks.map((link) =>
              createElement(Link, { key: link.href, href: link.href as any, asChild: true }, createElement('a', { className: 'block py-2 text-sm font-semibold hover:opacity-80', style: { color: 'rgba(243,240,232,.72)' } }, link.label)),
            ),
          ),
        ),
      ),
    ),
  );
}
