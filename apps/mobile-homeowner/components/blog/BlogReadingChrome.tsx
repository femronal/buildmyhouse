import { useEffect, useState, type ReactNode, type RefObject } from 'react';
import {
  Platform,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
  View,
} from 'react-native';
import BlogKeyTakeaways from '@/components/blog/BlogKeyTakeaways';
import BlogReadingProgress from '@/components/blog/BlogReadingProgress';
import BlogTableOfContents from '@/components/blog/BlogTableOfContents';
import {
  SeoContentShell,
} from '@/components/seo/SeoContentLayout';
import {
  readingProgressFromOffsets,
  type BlogTocItem,
} from '@/lib/blog-reading-chrome';

type BlogReadingChromeProps = {
  children: ReactNode;
  footer?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollRef?: RefObject<ScrollView | null>;
  onScroll?: ScrollViewProps['onScroll'];
  scrollEventThrottle?: number;
};

/**
 * Shared shell for /blog and /articles long-form pages:
 * sticky reading progress + SeoContentShell scroll plumbing.
 */
export default function BlogReadingChrome({
  children,
  footer,
  contentContainerStyle,
  scrollRef,
  onScroll,
  scrollEventThrottle = 16,
}: BlogReadingChromeProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
    const syncFromWindow = () => {
      const doc = document.documentElement;
      setProgress(
        readingProgressFromOffsets(
          window.scrollY || doc.scrollTop,
          doc.scrollHeight,
          window.innerHeight,
        ),
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
    setProgress(
      readingProgressFromOffsets(contentOffset.y, contentSize.height, layoutMeasurement.height),
    );
    onScroll?.(event);
  };

  return (
    <View className="flex-1 bg-white">
      <BlogReadingProgress value={progress} />
      <SeoContentShell
        footer={footer}
        contentContainerStyle={contentContainerStyle}
        scrollRef={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle}
      >
        {children}
      </SeoContentShell>
    </View>
  );
}

type BlogReadingAidsProps = {
  takeaways?: string[];
  toc?: BlogTocItem[];
  takeawaysTitle?: string;
  tocTitle?: string;
};

/** Place after the post intro (description/meta) and before the body. */
export function BlogReadingAids({
  takeaways = [],
  toc = [],
  takeawaysTitle,
  tocTitle,
}: BlogReadingAidsProps) {
  return (
    <>
      <BlogKeyTakeaways items={takeaways} title={takeawaysTitle} />
      <BlogTableOfContents items={toc} title={tocTitle} />
    </>
  );
}
