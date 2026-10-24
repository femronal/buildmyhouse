import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { readReviewWidgetId } from '@/lib/review-widgets';
import type { TrustindexStatus } from '@/components/reviews/TrustindexReviews';

type TrustindexReviewsNativeProps = {
  widgetId?: string | null;
  onStatusChange?: (status: TrustindexStatus) => void;
};

const HEIGHT_WAIT_MS = 10000;
const MIN_HEIGHT = 80;

function widgetHtml(widgetId: string) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>html,body{margin:0;padding:0;background:#ffffff;}</style>
</head>
<body>
<div id="trustindex">
<script defer async src="https://cdn.trustindex.io/loader.js?${widgetId}"></script>
</div>
<script>
function sendHeight(){
  var text = document.body.innerText || '';
  if (/widget not found/i.test(text)) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage('failed');
    return;
  }
  var height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(String(height));
}
window.addEventListener('load', sendHeight);
if (window.ResizeObserver) new ResizeObserver(sendHeight).observe(document.body);
var ticks = 0;
var timer = setInterval(function(){
  sendHeight();
  ticks += 1;
  if (ticks >= 10) clearInterval(timer);
}, 1000);
</script>
</body>
</html>`;
}

function isFirstLoad(url: string) {
  if (!url || url === 'about:blank' || url.startsWith('about:')) return true;
  if (url.startsWith('https://buildmyhouse.app')) return true;
  if (url.includes('cdn.trustindex.io') || url.includes('trustindex.io')) return true;
  return false;
}

export default function TrustindexReviewsNative({ widgetId, onStatusChange }: TrustindexReviewsNativeProps) {
  const id = readReviewWidgetId(widgetId);
  const [height, setHeight] = useState(0);
  const [failed, setFailed] = useState(false);
  const heightRef = useRef(0);
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;
  const shown = height > MIN_HEIGHT;

  useEffect(() => {
    if (!id || Platform.OS === 'web') {
      onStatusChangeRef.current?.('off');
      return;
    }
    onStatusChangeRef.current?.('loading');
    const timer = setTimeout(() => {
      if (heightRef.current <= MIN_HEIGHT) {
        setFailed(true);
        onStatusChangeRef.current?.('failed');
      }
    }, HEIGHT_WAIT_MS);
    return () => clearTimeout(timer);
  }, [id]);

  if (!id || Platform.OS === 'web' || failed) return null;

  const html = widgetHtml(id);

  return (
    <View style={{ height: shown ? height : 1, overflow: 'hidden', width: '100%' }}>
      <WebView
        source={{ html, baseUrl: 'https://buildmyhouse.app' }}
        style={{ height: Math.max(height, 480), backgroundColor: '#ffffff', opacity: shown ? 1 : 0 }}
        scrollEnabled={false}
        originWhitelist={['*']}
        setSupportMultipleWindows={false}
        onOpenWindow={(event) => {
          const url = event.nativeEvent.targetUrl;
          if (url) Linking.openURL(url);
        }}
        onShouldStartLoadWithRequest={(request) => {
          if (request.isTopFrame === false) return true;
          const url = request.url || '';
          if (isFirstLoad(url)) return true;
          if (url.startsWith('http')) Linking.openURL(url);
          return false;
        }}
        onMessage={(event) => {
          if (event.nativeEvent.data === 'failed') {
            setFailed(true);
            onStatusChangeRef.current?.('failed');
            return;
          }
          const next = Number(event.nativeEvent.data);
          if (!Number.isFinite(next) || next <= MIN_HEIGHT) return;
          heightRef.current = next;
          setHeight(next);
          onStatusChangeRef.current?.('ready');
        }}
        onError={() => {
          setFailed(true);
          onStatusChangeRef.current?.('failed');
        }}
        onHttpError={() => {
          setFailed(true);
          onStatusChangeRef.current?.('failed');
        }}
      />
    </View>
  );
}
