import React from 'react';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { wrapArticleHtmlFragment } from '@/lib/article-tiptap-html';

type Props = {
  htmlFragment: string;
  minHeight?: number;
};

export default function ArticleHtmlBody({ htmlFragment, minHeight = 480 }: Props) {
  const fullHtml = wrapArticleHtmlFragment(
    `<div class="bmx-article-body">${htmlFragment}</div>`,
  );

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
