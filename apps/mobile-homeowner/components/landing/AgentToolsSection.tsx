import { createElement, type ReactNode } from 'react';
import { Link } from 'expo-router';
import { Platform, Pressable, Text, View } from 'react-native';
import {
  ArrowUpRight,
  Calculator,
  CurrencyNgn,
  FlagBanner,
  HouseLine,
  Scales,
  ShieldWarning,
  Wrench,
  type Icon,
} from 'phosphor-react-native';
import WebLandmark from '@/components/seo/WebLandmark';
import { FEATURED_PROPERTY_TOOLS, type PropertyTool } from '@/lib/property-tools-catalog';

const TOOL_ICONS: Record<string, Icon> = {
  'price-checker': CurrencyNgn,
  'construction-scam-red-flag-checker': ShieldWarning,
  'contractor-quote-comparison': Scales,
  'nigeria-building-cost-planner': Calculator,
  'property-repair-triage': Wrench,
  'land-purchase-risk-checker': HouseLine,
};

function SemanticHeading({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: object;
}) {
  if (Platform.OS === 'web') {
    return createElement('h3', { className, style: { margin: 0, ...style } }, children);
  }

  return (
    <Text accessibilityRole="header" className={className} style={style}>
      {children}
    </Text>
  );
}

function ToolCard({ tool, index }: { tool: PropertyTool; index: number }) {
  const IconComponent = TOOL_ICONS[tool.slug] ?? FlagBanner;
  const indexLabel = `{ ${String(index + 1).padStart(2, '0')} }`;
  const statusLabel = tool.status === 'live' ? 'Live now' : 'Coming soon';
  const title = tool.shortTitle ?? tool.title;

  const card = (
    <Link href={tool.href as any} asChild>
      <Pressable
        className="bmh-pricing-card group h-full"
        accessibilityRole="link"
        accessibilityLabel={`${title} — ${statusLabel}`}
      >
        <View className="flex-row items-center justify-between">
          <Text className="bmh-pricing-card-index text-[11px] text-neutral-400" style={{ fontFamily: 'Poppins_400Regular' }}>
            {indexLabel}
          </Text>
          <Text
            className={`text-[10px] uppercase tracking-wide ${tool.status === 'live' ? 'text-neutral-800' : 'text-neutral-400'}`}
            style={{ fontFamily: 'Poppins_500Medium' }}
          >
            {statusLabel}
          </Text>
        </View>

        <View className="mt-6">
          <View className="bmh-pricing-card-icon h-10 w-10 rounded-lg bg-neutral-100 items-center justify-center">
            <IconComponent size={20} color="#171717" weight="regular" />
          </View>

          <SemanticHeading
            className="mt-4 text-neutral-900 text-base tracking-tight bmh-pricing-card-title"
            style={{ fontFamily: 'Poppins_600SemiBold' }}
          >
            {title}
          </SemanticHeading>

          <Text
            className="mt-2 text-neutral-800 text-sm leading-snug bmh-pricing-card-price"
            style={{ fontFamily: 'JetBrainsMono_500Medium' }}
          >
            {tool.tagline}
          </Text>

          <Text className="mt-3 text-neutral-500 text-sm leading-relaxed bmh-pricing-card-note" style={{ fontFamily: 'Poppins_400Regular' }}>
            {tool.solves}
          </Text>
        </View>
      </Pressable>
    </Link>
  );

  if (Platform.OS === 'web') {
    return createElement('li', { className: 'bmh-pricing-grid-item' }, createElement('article', null, card));
  }

  return card;
}

function ToolsGrid() {
  const cards = FEATURED_PROPERTY_TOOLS.map((tool, index) => (
    <ToolCard key={tool.slug} tool={tool} index={index} />
  ));

  if (Platform.OS === 'web') {
    return createElement('ul', { className: 'bmh-pricing-grid bmh-tools-grid' }, cards);
  }

  return <View className="bmh-pricing-grid bmh-tools-grid">{cards}</View>;
}

export default function AgentToolsSection() {
  return (
    <WebLandmark tag="section" id="tools" className="py-16 md:py-24 bg-white border-t border-neutral-100">
      <View className="max-w-7xl w-full self-center px-6 md:px-12">
        <View className="items-center mb-8 md:mb-10">
          {Platform.OS === 'web'
            ? createElement(
                'p',
                {
                  className: 'text-neutral-500 text-xs uppercase tracking-[0.2em] mb-2 text-center',
                  style: { fontFamily: 'Poppins_500Medium', margin: 0 },
                },
                'Property management tools',
              )
            : (
                <Text
                  className="text-neutral-500 text-xs uppercase tracking-widest mb-2 text-center"
                  style={{ fontFamily: 'Poppins_500Medium' }}
                >
                  Property management tools
                </Text>
              )}

          {Platform.OS === 'web'
            ? createElement(
                'h2',
                {
                  className: 'text-3xl md:text-4xl text-black tracking-tight text-center',
                  style: { fontFamily: 'Poppins_600SemiBold', margin: 0 },
                },
                'Tools that protect your project',
              )
            : (
                <Text
                  accessibilityRole="header"
                  className="text-3xl text-black tracking-tight text-center"
                  style={{ fontFamily: 'Poppins_600SemiBold' }}
                >
                  Tools that protect your project
                </Text>
              )}

          {Platform.OS === 'web'
            ? createElement(
                'p',
                {
                  className: 'text-base text-neutral-600 max-w-2xl mt-4 leading-relaxed text-center mx-auto',
                  style: { fontFamily: 'Poppins_400Regular', margin: 0 },
                },
                'BuildMyHouse is building software for land risk, quote fairness, repair triage, budgets, and remote oversight — not just price lists. Start with the six tools below.',
              )
            : (
                <Text
                  className="text-base text-neutral-600 max-w-2xl mt-4 leading-relaxed text-center"
                  style={{ fontFamily: 'Poppins_400Regular' }}
                >
                  BuildMyHouse is building software for land risk, quote fairness, repair triage, budgets, and remote
                  oversight — not just price lists. Start with the six tools below.
                </Text>
              )}
        </View>

        <ToolsGrid />

        <View className="flex-col sm:flex-row gap-3 mt-8 md:mt-10 justify-center">
          <Link href={'/tools' as any} asChild>
            <Pressable
              className="h-11 px-5 rounded-lg border border-neutral-200 bg-white items-center justify-center flex-row gap-2"
              accessibilityRole="link"
            >
              <Text className="text-sm text-black" style={{ fontFamily: 'Poppins_500Medium' }}>
                Check all tools
              </Text>
              <ArrowUpRight size={14} color="#171717" weight="bold" />
            </Pressable>
          </Link>
          <Link href={'/book-repair' as any} asChild>
            <Pressable
              className="h-11 px-5 rounded-lg bg-black items-center justify-center bmh-glass-btn bmh-glass-btn-dark"
              accessibilityRole="link"
            >
              <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                Book repair online
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </WebLandmark>
  );
}
