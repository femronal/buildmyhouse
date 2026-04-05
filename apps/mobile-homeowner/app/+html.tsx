import { ScrollViewStyleReset } from 'expo-router/html';

type RootProps = {
  children: React.ReactNode;
};

const DEFAULT_GSC_VERIFICATION = 'oXMp0QHWTK-YkDQ5L8sNre1YHVZR_6Tt7VBUP8DQ5X8';

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');
const DEFAULT_PAGE_TITLE = 'BuildMyHouse Nigeria | Construction, Renovation, Interior Design';
const DEFAULT_PAGE_DESCRIPTION =
  'Build, renovate, or redesign your home in Nigeria with vetted general contractors and milestone tracking. Also discover homes and land opportunities.';
const DEFAULT_OG_IMAGE = `${WEB_URL}/assets/og/buildmyhouse-default.png`;

export default function Root({ children }: RootProps) {
  const gscVerification =
    process.env.EXPO_PUBLIC_GSC_VERIFICATION || DEFAULT_GSC_VERIFICATION;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <title>{DEFAULT_PAGE_TITLE}</title>
        <meta name="description" content={DEFAULT_PAGE_DESCRIPTION} />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href={`${WEB_URL}/`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="BuildMyHouse" />
        <meta property="og:title" content={DEFAULT_PAGE_TITLE} />
        <meta property="og:description" content={DEFAULT_PAGE_DESCRIPTION} />
        <meta property="og:url" content={`${WEB_URL}/`} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={DEFAULT_PAGE_TITLE} />
        <meta name="twitter:description" content={DEFAULT_PAGE_DESCRIPTION} />
        <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
        <meta name="google-site-verification" content={gscVerification} />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="48x48" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
