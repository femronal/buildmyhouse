import { Platform, View } from 'react-native';
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

  if (Platform.OS === 'web') {
    return (
      <View
        className="w-full max-w-[680px] self-center article-html-host"
        {...({ dangerouslySetInnerHTML: { __html: htmlFragment } } as any)}
      />
    );
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
