import { createElement, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ArrowLeft, Clock3 } from 'lucide-react-native';
import GcPillarCoverImage from '@/components/articles/GcPillarCoverImage';
import {
  buildGcPillarJsonLd,
  gcPillarBlocks,
  gcPillarCluster,
  gcPillarFaqs,
  gcPillarHero,
  gcPillarSeo,
  gcPillarTakeaways,
  gcPillarWorkflow,
  getGcPillarToc,
  type GcPillarBlock,
} from '@/lib/gc-pillar-article';
import { useWebSeo } from '@/lib/seo';

function readingProgressFromOffsets(offsetY: number, contentHeight: number, viewportHeight: number) {
  const travel = contentHeight - viewportHeight;
  if (travel <= 0) return 1;
  return Math.min(1, Math.max(0, offsetY / travel));
}

function ArticleHeading({
  level,
  id,
  className,
  children,
}: {
  level: 1 | 2 | 3;
  id?: string;
  className: string;
  children: ReactNode;
}) {
  if (Platform.OS === 'web') {
    return createElement(`h${level}`, { id, className, style: { fontFamily: level === 3 ? 'Poppins_600SemiBold' : 'Poppins_700Bold' } }, children);
  }
  return (
    <Text
      nativeID={id}
      accessibilityRole="header"
      className={className}
      style={{ fontFamily: level === 3 ? 'Poppins_600SemiBold' : 'Poppins_700Bold' }}
    >
      {children}
    </Text>
  );
}

function Paragraph({ children }: { children: string }) {
  return (
    <Text className="text-gray-800 text-[17px] leading-8 mb-5" style={{ fontFamily: 'Poppins_400Regular' }}>
      {children}
    </Text>
  );
}

function PullQuote({ text }: { text: string }) {
  return (
    <View className="my-6 border-l-4 border-blue-600 pl-4 py-1">
      <Text className="text-gray-900 text-lg leading-8" style={{ fontFamily: 'Poppins_600SemiBold' }}>
        {text}
      </Text>
    </View>
  );
}

function ExternalCta({ href, label }: { href: string; label: string }) {
  const isInternal = href.startsWith('/');
  if (isInternal) {
    return (
      <Link href={href as any} asChild>
        <TouchableOpacity className="mt-3 self-start rounded-xl bg-[#2563EB] px-4 py-3" accessibilityRole="link">
          <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {label}
          </Text>
        </TouchableOpacity>
      </Link>
    );
  }
  return (
    <TouchableOpacity
      className="mt-3 self-start rounded-xl bg-[#2563EB] px-4 py-3"
      accessibilityRole="link"
      onPress={() => Linking.openURL(href)}
    >
      <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function scrollToHeading(id: string) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderBlock(block: GcPillarBlock, index: number) {
  switch (block.type) {
    case 'p':
      return <Paragraph key={`p-${index}`}>{block.text}</Paragraph>;
    case 'h2':
      return (
        <ArticleHeading key={block.id} level={2} id={block.id} className="text-black text-2xl mt-10 mb-4">
          {block.text}
        </ArticleHeading>
      );
    case 'h3':
      return (
        <ArticleHeading key={`h3-${index}`} level={3} className="text-black text-lg mt-6 mb-3">
          {block.text}
        </ArticleHeading>
      );
    case 'pull':
      return <PullQuote key={`pull-${index}`} text={block.text} />;
    case 'quote':
      return (
        <View key={`q-${index}`} className="my-5 rounded-2xl bg-gray-50 border border-gray-200 px-4 py-4">
          <Text className="text-gray-700 text-base leading-7 italic" style={{ fontFamily: 'Poppins_400Regular' }}>
            “{block.text}”
          </Text>
        </View>
      );
    case 'list':
      return (
        <View key={`list-${index}`} className="mb-5 gap-2">
          {block.items.map((item) => (
            <View key={item} className="flex-row gap-2">
              <Text className="text-blue-700" style={{ fontFamily: 'Poppins_700Bold' }}>
                •
              </Text>
              <Text className="flex-1 text-gray-700 text-base leading-7" style={{ fontFamily: 'Poppins_400Regular' }}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      );
    case 'stack':
      return (
        <View key={`stack-${index}`} className="mb-6 gap-2">
          {block.items.map((item, itemIndex) => (
            <View key={item} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
              <Text className="text-gray-500 text-xs mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {itemIndex + 1}
              </Text>
              <Text className="text-gray-900" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      );
    case 'tool':
      return (
        <View key={block.title} className="mb-5 rounded-2xl border border-gray-200 bg-[#f8fafc] p-5">
          <Text className="text-black text-lg mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
            {block.title}
          </Text>
          <Text className="text-gray-800 text-sm leading-6 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
            {block.when}
          </Text>
          <Text className="text-gray-600 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
            {block.body}
          </Text>
          <ExternalCta href={block.href} label={block.label} />
        </View>
      );
    case 'step':
      return (
        <View key={`step-${block.n}`} className="mb-4 flex-row gap-3">
          <Text className="text-blue-700 w-7" style={{ fontFamily: 'Poppins_700Bold' }}>
            {block.n}.
          </Text>
          <View className="flex-1">
            <Text className="text-black text-base mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
              {block.title}
            </Text>
            <Text className="text-gray-700 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
              {block.body}
            </Text>
          </View>
        </View>
      );
    default:
      return null;
  }
}

export default function GcPillarArticlePage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const toc = useMemo(() => getGcPillarToc(), []);
  const jsonLd = useMemo(() => buildGcPillarJsonLd(), []);

  useWebSeo({
    title: gcPillarSeo.title,
    description: gcPillarSeo.description,
    canonicalPath: gcPillarSeo.canonicalPath,
    ogImage: gcPillarSeo.ogImage,
    jsonLd,
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
    const syncFromWindow = () => {
      const doc = document.documentElement;
      setProgress(
        readingProgressFromOffsets(window.scrollY || doc.scrollTop, doc.scrollHeight, window.innerHeight),
      );
    };
    syncFromWindow();
    window.addEventListener('scroll', syncFromWindow, { passive: true });
    window.addEventListener('resize', syncFromWindow);
    return () => {
      window.removeEventListener('scroll', syncFromWindow);
      window.removeEventListener('resize', syncFromWindow);
    };
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    setProgress(readingProgressFromOffsets(contentOffset.y, contentSize.height, layoutMeasurement.height));
  };

  return (
    <View className="flex-1 bg-white">
      <View className="h-1 bg-gray-100">
        <View className="h-1 bg-[#2563EB]" style={{ width: `${Math.round(progress * 100)}%` }} />
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View className="px-5 pt-10 pb-4 md:px-6 md:pt-14 max-w-[760px] w-full self-center">
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/articles' as any))}
            className="w-9 h-9 bg-gray-100 rounded-full items-center justify-center mb-4"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={18} color="#000000" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text className="text-[11px] uppercase tracking-wide text-blue-700 mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            {gcPillarHero.eyebrow}
          </Text>
          <ArticleHeading level={1} className="text-3xl leading-tight text-black mb-4 md:text-5xl">
            {gcPillarHero.h1}
          </ArticleHeading>
          <Text className="text-gray-700 text-lg leading-8 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
            {gcPillarHero.introduction}
          </Text>
          <View className="flex-row items-center mb-6">
            <Clock3 size={14} color="#6b7280" />
            <Text className="text-gray-500 text-sm ml-1.5" style={{ fontFamily: 'Poppins_400Regular' }}>
              {gcPillarSeo.readingMinutes} min read · {gcPillarSeo.authorName}
            </Text>
          </View>

          <View className="rounded-3xl overflow-hidden bg-gray-100 mb-8">
            <GcPillarCoverImage height={320} />
          </View>

          <View className="mb-6 rounded-2xl border border-gray-200 bg-[#f8fafc] p-5">
            <Text className="text-black text-sm mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
              Key takeaways
            </Text>
            {gcPillarTakeaways.map((item) => (
              <View key={item} className="flex-row gap-2 mb-2">
                <Text className="text-blue-700" style={{ fontFamily: 'Poppins_700Bold' }}>
                  •
                </Text>
                <Text className="flex-1 text-gray-700 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          <View className="mb-8 rounded-2xl border border-gray-200 bg-white p-5">
            <Text className="text-black text-sm mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
              In this article
            </Text>
            {toc.map((item) => (
              <TouchableOpacity key={item.id} onPress={() => scrollToHeading(item.id)} accessibilityRole="button">
                <View className="flex-row items-start gap-3 py-1.5">
                  <View className="mt-1.5 w-2 h-2 rounded-sm bg-[#16a34a]" />
                  <Text className="flex-1 text-gray-700 text-sm leading-6" style={{ fontFamily: 'Poppins_500Medium' }}>
                    {item.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="px-5 md:px-6 max-w-[760px] w-full self-center">
          {gcPillarBlocks.map(renderBlock)}

          <View className="mt-8 mb-8 rounded-3xl border border-gray-200 bg-[#0A1628] p-6">
            <Text className="text-white text-2xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
              Use the actual contractor workflow
            </Text>
            <Text className="text-gray-300 text-sm leading-6 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
              When you are ready, move from reading into verification, project requests, stage evidence and earnings.
            </Text>
            <View className="gap-3">
              {gcPillarWorkflow.map((item) => (
                <Link key={item.href} href={item.href as any} asChild>
                  <TouchableOpacity className="rounded-xl border border-white/15 px-4 py-3" accessibilityRole="link">
                    <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      {item.title}
                    </Text>
                    <Text className="text-blue-200 text-xs mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                </Link>
              ))}
            </View>
          </View>

          <View className="mb-8">
            <Text className="text-black text-2xl mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
              Supporting articles
            </Text>
            <Text className="text-gray-600 text-sm leading-6 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
              After this article, these guides will give extra knowledge. They are not published yet.
            </Text>
            <View className="gap-3">
              {gcPillarCluster.map((item) => (
                <View key={item.slug} className="rounded-2xl border border-gray-200 bg-white p-4">
                  <Text className="text-[10px] uppercase tracking-wide text-gray-500 mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
                    Coming soon
                  </Text>
                  <Text className="text-black text-base mb-1" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                    {item.title}
                  </Text>
                  <Text className="text-gray-600 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {item.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View className="mb-8">
            <Text className="text-black text-2xl mb-4" style={{ fontFamily: 'Poppins_700Bold' }}>
              Frequently asked questions
            </Text>
            {gcPillarFaqs.map((item) => (
              <View key={item.question} className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
                <Text className="text-black text-sm mb-2" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {item.question}
                </Text>
                <Text className="text-gray-600 text-sm leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {item.answer}
                </Text>
              </View>
            ))}
          </View>

          <View className="mb-4 rounded-3xl border border-gray-200 bg-gray-50 p-6">
            <Text className="text-black text-xl mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
              Are you a Nigerian general contractor, construction company or specialist contractor?
            </Text>
            <Text className="text-gray-700 text-sm leading-6 mb-4" style={{ fontFamily: 'Poppins_400Regular' }}>
              Join the BuildMyHouse contractor network. Registration and verification are currently free. Bring your experience, documents and work you are proud to show.
            </Text>
            <Link href={'/email-login' as any} asChild>
              <TouchableOpacity className="rounded-xl bg-[#2563EB] px-5 py-3.5 items-center" accessibilityRole="link">
                <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
                  Join at gc.buildmyhouse.app
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
