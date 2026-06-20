import { ScrollViewStyleReset } from 'expo-router/html';
import { GC_HOMEPAGE_META, GC_OG_IMAGE } from '../lib/gc-landing-content';

type RootProps = {
  children: React.ReactNode;
};

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://gc.buildmyhouse.app').replace(/\/+$/, '');

export default function Root({ children }: RootProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <title>{GC_HOMEPAGE_META.title}</title>
        <meta name="description" content={GC_HOMEPAGE_META.description} />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={`${WEB_URL}${GC_HOMEPAGE_META.canonicalPath}`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="BuildMyHouse Technologies" />
        <meta property="og:title" content={GC_HOMEPAGE_META.title} />
        <meta property="og:description" content={GC_HOMEPAGE_META.description} />
        <meta property="og:url" content={`${WEB_URL}/`} />
        <meta property="og:image" content={GC_OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={GC_HOMEPAGE_META.title} />
        <meta name="twitter:description" content={GC_HOMEPAGE_META.description} />
        <meta name="twitter:image" content={GC_OG_IMAGE} />
        <link rel="icon" href="https://buildmyhouse.app/favicon.png" type="image/png" sizes="48x48" />
        <link rel="apple-touch-icon" href="https://buildmyhouse.app/apple-touch-icon.png" sizes="180x180" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
