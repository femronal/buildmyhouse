import { createElement, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ArrowLeft } from 'phosphor-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { SeoContentColumn, SeoContentShell } from '@/components/seo/SeoContentLayout';
import { LEGAL_OPERATOR_LINE } from '@buildmyhouse/shared-utils';
import {
  FEATURED_PROPERTY_TOOLS,
  PROPERTY_TOOL_CATEGORIES,
  PROPERTY_TOOLS,
  getPropertyToolBySlug,
  type PropertyTool,
} from '@/lib/property-tools-catalog';
import { faqsFor, getBatch1Page, type JourneyNode, type ToolPageCopy } from '@/lib/tools/batch-1-pages';
import { useWebSeo } from '@/lib/seo';
import { buildCanonical } from '@/lib/seo-schema';
import WaitlistForm from './WaitlistForm';

type Props = {
  slug: string;
  toolSlot?: ReactNode;
};

const mono = 'JetBrainsMono_500Medium';
const body = 'Poppins_400Regular';
const medium = 'Poppins_500Medium';
const semibold = 'Poppins_600SemiBold';
const bold = 'Poppins_700Bold';

function scrollToId(id: string) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function Anchor({ id, children }: { id: string; children: ReactNode }) {
  if (Platform.OS === 'web') return createElement('div', { id }, children);
  return <View nativeID={id}>{children}</View>;
}

function StatusBadge({ status }: { status: PropertyTool['status'] }) {
  const live = status === 'live';
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: live ? '#DCFCE7' : '#FEF3C7',
      }}
    >
      <Text style={{ fontFamily: mono, fontSize: 12, color: live ? '#166534' : '#92400E' }}>
        {live ? '● LIVE' : '◷ COMING SOON'}
      </Text>
    </View>
  );
}

export default function ToolPage({ slug, toolSlot }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const desktop = width >= 1024;
  const tool = getPropertyToolBySlug(slug);
  const page = getBatch1Page(slug);
  const [openFaq, setOpenFaq] = useState(0);
  const [showSticky, setShowSticky] = useState(false);

  const category = PROPERTY_TOOL_CATEGORIES.find((item) => item.key === tool?.category);
  const faqs = page ? faqsFor(page) : [];
  const live = tool?.status === 'live';

  const relatedCards = useMemo(() => {
    if (!tool) return [];
    return PROPERTY_TOOLS.filter((item) => item.category === tool.category && item.slug !== tool.slug).slice(0, 3);
  }, [tool]);

  const crossSell = useMemo(() => {
    if (!tool) return [];
    const liveFirst = PROPERTY_TOOLS.filter((item) => item.status === 'live' && item.slug !== tool.slug);
    const featured = FEATURED_PROPERTY_TOOLS.filter(
      (item) => item.slug !== tool.slug && !liveFirst.some((liveTool) => liveTool.slug === item.slug),
    );
    return [...liveFirst, ...featured].slice(0, 3);
  }, [tool]);

  useWebSeo({
    title: page?.seoTitle || (tool ? `${tool.title} | BuildMyHouse` : 'BuildMyHouse Tools'),
    description: page?.seoDescription || tool?.description || 'BuildMyHouse tools for Nigerian property owners.',
    canonicalPath: tool?.href || `/tools/${slug}`,
    robots: 'index,follow',
    jsonLd: tool && page
      ? {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'SoftwareApplication',
              name: tool.title,
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              description: page.seoDescription,
              url: buildCanonical(tool.href),
            },
            {
              '@type': 'FAQPage',
              mainEntity: faqs.map((item) => ({
                '@type': 'Question',
                name: item.q,
                acceptedAnswer: { '@type': 'Answer', text: item.a },
              })),
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: buildCanonical('/') },
                { '@type': 'ListItem', position: 2, name: 'Tools', item: buildCanonical('/tools') },
                { '@type': 'ListItem', position: 3, name: category?.shortLabel || 'Tools', item: buildCanonical('/tools') },
                { '@type': 'ListItem', position: 4, name: tool.title, item: buildCanonical(tool.href) },
              ],
            },
          ],
        }
      : undefined,
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof IntersectionObserver === 'undefined') return;
    const hero = document.getElementById('tool-hero');
    const band = document.getElementById('waitlist');
    if (!hero) return;
    let heroVisible = true;
    let bandVisible = false;
    const update = () => setShowSticky(!heroVisible && !bandVisible);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === hero) heroVisible = entry.isIntersecting;
          if (entry.target === band) bandVisible = entry.isIntersecting;
        });
        update();
      },
      { threshold: 0.15 },
    );
    observer.observe(hero);
    if (band) observer.observe(band);
    return () => observer.disconnect();
  }, [slug]);

  if (!tool || !page) {
    return (
      <SeoContentShell>
        <SeoContentColumn className="pt-10 pb-16">
          <SeoHeading level={1} style={{ fontFamily: bold, fontSize: 32 }}>
            Tool not found
          </SeoHeading>
        </SeoContentColumn>
      </SeoContentShell>
    );
  }

  return (
    <SeoContentShell contentContainerStyle={{ paddingBottom: 96 }}>
      <View style={{ width: '100%', maxWidth: 1120, alignSelf: 'center', paddingHorizontal: 20 }}>
        <View style={{ paddingTop: width < 768 ? 20 : 40, paddingBottom: 8, gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.push('/tools' as never))}
              accessibilityLabel="Back"
              style={{ width: 44, height: 44, borderRadius: 999, borderWidth: 1, borderColor: '#E5E5E5', alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowLeft size={16} color="#171717" weight="bold" />
            </Pressable>
            <Link href={'/start/repair' as never} asChild>
              <Pressable style={{ minHeight: 44, justifyContent: 'center', maxWidth: width < 768 ? 150 : undefined }}>
                <Text style={{ fontFamily: medium, fontSize: 13, color: '#171717', textAlign: 'right' }}>Book a tracked repair</Text>
              </Pressable>
            </Link>
          </View>
          <Text style={{ fontFamily: mono, fontSize: 12, lineHeight: 18, color: '#525252' }}>
            Tools / {category?.shortLabel || 'Tools'} / {tool.title}
          </Text>
        </View>

        <Anchor id="tool-hero">
          <View style={{ paddingTop: 28, paddingBottom: 48, flexDirection: desktop ? 'row' : 'column', gap: 28 }}>
            <View style={{ flex: desktop ? 1.2 : undefined, gap: 14 }}>
              <Text style={{ fontFamily: mono, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: '#525252' }}>
                {page.eyebrow}
              </Text>
              <StatusBadge status={tool.status} />
              <SeoHeading level={1} style={{ fontFamily: bold, fontSize: width < 768 ? 34 : 48, lineHeight: width < 768 ? '40px' : '56px', color: '#000000', margin: 0 }}>
                {tool.title}
              </SeoHeading>
              <Text style={{ fontFamily: medium, fontSize: 18, lineHeight: 28, color: '#171717' }}>{page.outcome}</Text>
              {page.supporting.map((paragraph) => (
                <Text key={paragraph} style={{ fontFamily: body, fontSize: 16, lineHeight: 26, color: '#525252' }}>
                  {paragraph}
                </Text>
              ))}
              {live ? (
                <View style={{ gap: 10, marginTop: 6 }}>
                  <Pressable onPress={() => scrollToId('tool')} style={blackButton}>
                    <Text style={blackButtonLabel}>{page.primaryCta}</Text>
                  </Pressable>
                  {page.secondaryCta ? (
                    <Pressable onPress={() => scrollToId('example')} style={{ minHeight: 44, justifyContent: 'center' }}>
                      <Text style={{ fontFamily: semibold, fontSize: 15, color: '#171717' }}>{page.secondaryCta}</Text>
                    </Pressable>
                  ) : null}
                  {page.timeNote ? (
                    <Text style={{ fontFamily: body, fontSize: 13, color: '#525252' }}>{page.timeNote}</Text>
                  ) : null}
                </View>
              ) : (
                <View style={{ marginTop: 6, gap: 8 }}>
                  <WaitlistForm
                    compact
                    productKey={tool.slug}
                    toolTitle={tool.title}
                    sourcePath={tool.href}
                    submitLabel={page.primaryCta}
                    successDetail="We will let you know when early access opens. In the meantime, you can use Price Checker or explore other BuildMyHouse tools."
                  />
                  <Text style={{ fontFamily: body, fontSize: 13, color: '#525252' }}>
                    Be among the first homeowners and professionals invited to test it.
                  </Text>
                </View>
              )}
            </View>
            <View style={{ flex: desktop ? 0.9 : undefined, minWidth: 0, width: desktop ? undefined : '100%' }}>
              <PreviewCard page={page} />
            </View>
          </View>
        </Anchor>

        {toolSlot ? (
          <Anchor id="tool">
            <View style={{ marginBottom: 64 }}>{toolSlot}</View>
          </Anchor>
        ) : null}

        <Section>
          <SeoHeading level={2} style={h2}>
            {page.problemHeadline}
          </SeoHeading>
          {page.problemIntro.map((paragraph) => (
            <Text key={paragraph} style={paragraphStyle}>
              {paragraph}
            </Text>
          ))}
          <View style={{ flexDirection: desktop ? 'row' : 'column', gap: 16, marginTop: 8 }}>
            <CompareCard title="Without this tool" items={page.without} positive={false} />
            <CompareCard title={`With ${tool.shortTitle || tool.title}`} items={page.with} positive />
          </View>
        </Section>

        <Section>
          <View style={{ flexDirection: desktop ? 'row' : 'column', gap: 16, alignItems: 'stretch' }}>
            <View style={lightCard}>
              <Text style={kicker}>You provide</Text>
              {page.inputs.map((item) => (
                <View key={item.label} style={{ marginBottom: 14 }}>
                  <Text style={{ fontFamily: semibold, fontSize: 16, color: '#171717' }}>{item.label}</Text>
                  <Text style={{ fontFamily: body, fontSize: 14, lineHeight: 22, color: '#525252', marginTop: 4 }}>{item.why}</Text>
                </View>
              ))}
              {page.timeNote ? <Text style={{ fontFamily: body, fontSize: 13, color: '#525252' }}>{page.timeNote}</Text> : null}
            </View>
            {desktop ? (
              <Text style={{ alignSelf: 'center', fontFamily: bold, fontSize: 22, color: '#171717' }}>→</Text>
            ) : (
              <Text style={{ alignSelf: 'center', fontFamily: bold, fontSize: 22, color: '#171717' }}>↓</Text>
            )}
            <View style={darkCard}>
              <Text style={{ ...kicker, color: '#A3A3A3' }}>You get back</Text>
              {page.outputs.map((item) => (
                <View key={item.label} style={{ marginBottom: 14 }}>
                  <Text style={{ fontFamily: semibold, fontSize: 16, color: '#FFFFFF' }}>✓ {item.label}</Text>
                  <Text style={{ fontFamily: body, fontSize: 14, lineHeight: 22, color: '#E5E5E5', marginTop: 4 }}>{item.detail}</Text>
                </View>
              ))}
              {page.trustLine ? (
                <View style={{ marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#3F3F46' }}>
                  <Text style={{ fontFamily: semibold, fontSize: 14, color: '#22C55E' }}>{page.trustLine}</Text>
                  {page.trustDetail ? (
                    <Text style={{ fontFamily: body, fontSize: 14, lineHeight: 22, color: '#E5E5E5', marginTop: 6 }}>{page.trustDetail}</Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        </Section>

        <Anchor id="example">
          <Section>
            <SeoHeading level={2} style={h2}>
              How it works
            </SeoHeading>
            <View style={{ flexDirection: desktop ? 'row' : 'column', gap: 16 }}>
              {page.steps.map((step, index) => (
                <View key={step.title} style={{ flex: 1, gap: 8 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#FFFFFF', fontFamily: semibold, fontSize: 14 }}>{index + 1}</Text>
                  </View>
                  <Text style={{ fontFamily: semibold, fontSize: 16, color: '#171717' }}>{step.title}</Text>
                  <Text style={{ fontFamily: body, fontSize: 14, lineHeight: 22, color: '#525252' }}>{step.detail}</Text>
                </View>
              ))}
            </View>
          </Section>
        </Anchor>

        <Section>
          <SeoHeading level={2} style={h2}>
            Where this fits in your project
          </SeoHeading>
          <Text style={paragraphStyle}>{page.journeyWhy}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 8 }}>
            {page.journey.map((node, index) => (
              <View key={nodeKey(node)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <JourneyCard node={node} currentSlug={tool.slug} />
                {index < page.journey.length - 1 ? (
                  <Text style={{ fontFamily: bold, color: '#171717' }}>→</Text>
                ) : null}
              </View>
            ))}
          </ScrollView>
          {relatedCards.length ? (
            <View style={{ marginTop: 28 }}>
              <Text style={kicker}>More in {category?.shortLabel || 'this category'}</Text>
              <View style={{ flexDirection: desktop ? 'row' : 'column', gap: 12 }}>
                {relatedCards.map((item) => (
                  <ToolLinkCard key={item.slug} tool={item} />
                ))}
              </View>
            </View>
          ) : null}
        </Section>

        <Section>
          <SeoHeading level={2} style={h2}>
            Who it is for
          </SeoHeading>
          <View style={{ flexDirection: desktop ? 'row' : 'column', gap: 16 }}>
            <View style={lightCard}>
              <Text style={kicker}>Homeowners and Nigerians abroad</Text>
              <Text style={paragraphStyle}>{page.homeowner}</Text>
            </View>
            <View style={lightCard}>
              <Text style={kicker}>Professionals</Text>
              <Text style={paragraphStyle}>{page.professional}</Text>
              <Link href={'/professionals/apply' as never}>
                <Text style={{ fontFamily: semibold, fontSize: 14, color: '#171717', textDecorationLine: 'underline' }}>
                  Work with BuildMyHouse as a professional
                </Text>
              </Link>
            </View>
          </View>
        </Section>

        {page.education?.map((block) => (
          <Section key={block.heading}>
            <SeoHeading level={2} style={h2}>
              {block.heading}
            </SeoHeading>
            {block.paragraphs?.map((paragraph) => (
              <Text key={paragraph} style={paragraphStyle}>
                {paragraph}
              </Text>
            ))}
            {block.steps?.map((step, index) => (
              <Text key={step.title} style={paragraphStyle}>
                {index + 1}. {step.title}. {step.detail}
              </Text>
            ))}
          </Section>
        ))}

        <Anchor id="waitlist">
          <View style={{ backgroundColor: '#F3F0E8', borderRadius: 24, padding: width < 768 ? 20 : 32, marginBottom: 64 }}>
            <View style={{ flexDirection: desktop ? 'row' : 'column', gap: 24 }}>
              <View style={{ flex: 1, gap: 8 }}>
                <SeoHeading level={2} style={h2}>
                  {live ? page.waitlistHeading : page.waitlistHeading}
                </SeoHeading>
                <Text style={paragraphStyle}>{page.waitlistCopy}</Text>
                {live ? (
                  <Pressable onPress={() => scrollToId('tool')} style={{ ...blackButton, alignSelf: 'flex-start', marginTop: 8 }}>
                    <Text style={blackButtonLabel}>{page.primaryCta}</Text>
                  </Pressable>
                ) : null}
                {page.extraLinks?.map((link) => (
                  <Link key={link.href} href={link.href as never}>
                    <Text style={{ fontFamily: semibold, fontSize: 15, color: '#171717', textDecorationLine: 'underline', marginTop: 8 }}>
                      {link.label}
                    </Text>
                  </Link>
                ))}
              </View>
              <View style={{ flex: 1 }}>
                {live ? (
                  <WaitlistForm
                    productKey="all-tools"
                    toolTitle="new BuildMyHouse tools"
                    sourcePath={tool.href}
                    submitLabel="Notify me about new tools"
                    successDetail="We will email you when another BuildMyHouse tool opens. You can keep using this one in the meantime."
                  />
                ) : (
                  <WaitlistForm
                    productKey={tool.slug}
                    toolTitle={tool.title}
                    sourcePath={tool.href}
                    submitLabel="Join the early-access list"
                    successDetail="We will contact you when early access opens. In the meantime, you can use Price Checker or explore other BuildMyHouse tools."
                  />
                )}
              </View>
            </View>
          </View>
        </Anchor>

        <Section>
          <View style={{ flexDirection: desktop ? 'row' : 'column', gap: 24 }}>
            <View style={{ flex: desktop ? 0.4 : undefined }}>
              <SeoHeading level={2} style={h2}>
                Questions people ask
              </SeoHeading>
              <Text style={paragraphStyle}>Straight answers about what this tool does and what it does not do.</Text>
            </View>
            <View style={{ flex: 1 }}>
              {faqs.map((item, index) =>
                Platform.OS === 'web' ? (
                  createElement(
                    'details',
                    {
                      key: item.q,
                      open: openFaq === index,
                      onToggle: (event: { currentTarget: { open: boolean } }) => {
                        if (event.currentTarget.open) setOpenFaq(index);
                        else if (openFaq === index) setOpenFaq(-1);
                      },
                      style: { borderTop: '1px solid #E5E5E5', padding: '16px 0' },
                    },
                    createElement(
                      'summary',
                      { style: { fontFamily: semibold, fontSize: 16, color: '#171717', cursor: 'pointer', minHeight: 44 } },
                      item.q,
                    ),
                    createElement(
                      'p',
                      { style: { fontFamily: body, fontSize: 15, lineHeight: '24px', color: '#525252', marginTop: 8 } },
                      item.a,
                    ),
                  )
                ) : (
                  <Pressable
                    key={item.q}
                    onPress={() => setOpenFaq(openFaq === index ? -1 : index)}
                    accessibilityRole="button"
                    style={{ borderTopWidth: 1, borderTopColor: '#E5E5E5', paddingVertical: 16, minHeight: 44 }}
                  >
                    <Text style={{ fontFamily: semibold, fontSize: 16, color: '#171717' }}>{item.q}</Text>
                    {openFaq === index ? (
                      <Text style={{ fontFamily: body, fontSize: 15, lineHeight: 24, color: '#525252', marginTop: 8 }}>{item.a}</Text>
                    ) : null}
                  </Pressable>
                ),
              )}
            </View>
          </View>
        </Section>

        <Section>
          <SeoHeading level={2} style={h2}>
            Other BuildMyHouse tools
          </SeoHeading>
          <View style={{ flexDirection: desktop ? 'row' : 'column', gap: 12 }}>
            {crossSell.map((item) => (
              <ToolLinkCard key={item.slug} tool={item} />
            ))}
          </View>
        </Section>

        <View style={{ borderTopWidth: 1, borderTopColor: '#E5E5E5', paddingVertical: 28, backgroundColor: '#060706', marginHorizontal: -20, paddingHorizontal: 20 }}>
          <Text style={{ fontFamily: body, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{LEGAL_OPERATOR_LINE}</Text>
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
            <Link href={'/privacy-security' as never}>
              <Text style={{ fontFamily: medium, fontSize: 13, color: '#FFFFFF' }}>Privacy</Text>
            </Link>
            <Link href={'/tools' as never}>
              <Text style={{ fontFamily: medium, fontSize: 13, color: '#FFFFFF' }}>All tools</Text>
            </Link>
          </View>
        </View>
      </View>

      {showSticky ? (
        <View
          style={{
            position: Platform.OS === 'web' ? ('fixed' as unknown as 'absolute') : 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E5E5',
            paddingHorizontal: 20,
            paddingVertical: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Text style={{ fontFamily: semibold, fontSize: 14, color: '#171717', flex: 1 }} numberOfLines={2}>
            {tool.title}
          </Text>
          <Pressable
            onPress={() => scrollToId(live ? 'tool' : 'waitlist')}
            style={{ ...blackButton, paddingHorizontal: 16 }}
          >
            <Text style={blackButtonLabel}>{live ? 'Use the tool' : 'Join waitlist'}</Text>
          </Pressable>
        </View>
      ) : null}
    </SeoContentShell>
  );
}

function PreviewCard({ page }: { page: ToolPageCopy }) {
  return (
    <View style={{ ...darkCard, minHeight: 280 }}>
      <Text style={{ fontFamily: mono, fontSize: 12, color: '#FDE68A' }}>{page.preview.kicker}</Text>
      <Text style={{ fontFamily: bold, fontSize: 22, color: '#FFFFFF', marginTop: 10, marginBottom: 16 }}>{page.preview.title}</Text>
      {page.preview.lines.map((line) => (
        <View key={line.label} style={{ borderTopWidth: 1, borderTopColor: '#3F3F46', paddingVertical: 10 }}>
          <Text style={{ fontFamily: mono, fontSize: 11, color: '#A3A3A3' }}>{line.label}</Text>
          <Text style={{ fontFamily: medium, fontSize: 15, color: '#FFFFFF', marginTop: 2, flexShrink: 1 }}>{line.value}</Text>
        </View>
      ))}
      {page.preview.illustrative ? (
        <Text style={{ fontFamily: body, fontSize: 12, lineHeight: 18, color: '#D4D4D4', marginTop: 8 }}>
          This sample shows the shape of the result. It is not a saved report and it is not today’s price.
        </Text>
      ) : null}
    </View>
  );
}

function CompareCard({ title, items, positive }: { title: string; items: string[]; positive: boolean }) {
  return (
    <View style={{ ...lightCard, flex: 1, borderColor: positive ? '#BBF7D0' : '#E5E5E5' }}>
      <Text style={{ fontFamily: semibold, fontSize: 16, color: '#171717', marginBottom: 10 }}>{title}</Text>
      {items.map((item) => (
        <Text key={item} style={{ fontFamily: body, fontSize: 14, lineHeight: 22, color: '#525252', marginBottom: 8 }}>
          {positive ? '✓ ' : '• '}
          {item}
        </Text>
      ))}
    </View>
  );
}

function JourneyCard({ node, currentSlug }: { node: JourneyNode; currentSlug: string }) {
  if ('slug' in node) {
    const tool = getPropertyToolBySlug(node.slug);
    if (!tool) return null;
    const here = tool.slug === currentSlug;
    return (
      <Link href={tool.href as never} asChild>
        <Pressable style={{ ...lightCard, width: 200, backgroundColor: here ? '#F3F0E8' : '#FFFFFF' }}>
          <StatusBadge status={tool.status} />
          <Text style={{ fontFamily: semibold, fontSize: 14, color: '#171717', marginTop: 8 }}>{tool.shortTitle || tool.title}</Text>
          <Text style={{ fontFamily: body, fontSize: 12, lineHeight: 18, color: '#525252', marginTop: 4 }} numberOfLines={3}>
            {here ? 'You are here. ' : ''}
            {tool.tagline}
          </Text>
        </Pressable>
      </Link>
    );
  }
  return (
    <Link href={node.href as never} asChild>
      <Pressable style={{ ...lightCard, width: 200 }}>
        <StatusBadge status={node.live ? 'live' : 'coming-soon'} />
        <Text style={{ fontFamily: semibold, fontSize: 14, color: '#171717', marginTop: 8 }}>{node.title}</Text>
        <Text style={{ fontFamily: body, fontSize: 12, lineHeight: 18, color: '#525252', marginTop: 4 }}>{node.tagline}</Text>
      </Pressable>
    </Link>
  );
}

function ToolLinkCard({ tool }: { tool: PropertyTool }) {
  return (
    <Link href={tool.href as never} asChild>
      <Pressable style={{ ...lightCard, flex: 1 }}>
        <StatusBadge status={tool.status} />
        <Text style={{ fontFamily: semibold, fontSize: 16, color: '#171717', marginTop: 8 }}>{tool.title}</Text>
        <Text style={{ fontFamily: body, fontSize: 13, lineHeight: 20, color: '#525252', marginTop: 4 }}>{tool.tagline}</Text>
      </Pressable>
    </Link>
  );
}

function Section({ children }: { children: ReactNode }) {
  return <View style={{ marginBottom: 64 }}>{children}</View>;
}

function nodeKey(node: JourneyNode) {
  return 'slug' in node ? node.slug : node.href;
}

const h2 = { fontFamily: bold, fontSize: 28, lineHeight: '36px', color: '#000000', marginBottom: 12 } as const;
const paragraphStyle = { fontFamily: body, fontSize: 16, lineHeight: 26, color: '#525252', marginBottom: 10 } as const;
const kicker = { fontFamily: mono, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase' as const, color: '#525252', marginBottom: 12 };
const lightCard = {
  borderWidth: 1,
  borderColor: '#E5E5E5',
  borderRadius: 20,
  backgroundColor: '#FFFFFF',
  padding: 18,
} as const;
const darkCard = {
  flex: 1,
  borderRadius: 20,
  backgroundColor: '#23262F',
  padding: 18,
} as const;
const blackButton = {
  minHeight: 44,
  borderRadius: 10,
  backgroundColor: '#000000',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  paddingHorizontal: 18,
};
const blackButtonLabel = { color: '#FFFFFF', fontFamily: semibold, fontSize: 15 };
