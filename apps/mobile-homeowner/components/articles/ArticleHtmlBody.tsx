import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { wrapArticleHtmlFragment } from '@/lib/article-tiptap-html';

type Props = {
  htmlFragment: string;
  minHeight?: number;
};

/**
 * Renders TipTap-generated HTML. Web: RN Web View + dangerouslySetInnerHTML. Native: WebView.
 */
export default function ArticleHtmlBody({ htmlFragment, minHeight = 480 }: Props) {
  const fullHtml = wrapArticleHtmlFragment(
    `<div class="bmx-article-body">${htmlFragment}</div>`,
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    const videos = Array.from(document.querySelectorAll('figure.article-anim video')) as HTMLVideoElement[];
    if (motion || saveData) {
      videos.forEach((video) => {
        video.removeAttribute('autoplay');
        video.pause();
      });
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) void video.play().catch(() => undefined);
          else video.pause();
        });
      },
      { rootMargin: '200px' },
    );
    videos.forEach((video) => observer.observe(video));
    return () => observer.disconnect();
  }, [htmlFragment]);

  if (Platform.OS === 'web') {
    return React.createElement('div', {
      className: 'w-full max-w-[680px] self-center article-html-host',
      dangerouslySetInnerHTML: { __html: htmlFragment },
    } as any);
  }

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html: fullHtml }}
      style={{ width: '100%', minHeight, backgroundColor: 'transparent' }}
      scrollEnabled={false}
      setBuiltInZoomControls={false}
      showsVerticalScrollIndicator={false}
    />
  );
}
