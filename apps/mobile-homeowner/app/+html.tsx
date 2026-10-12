import { ScrollViewStyleReset } from 'expo-router/html';

const META_PIXEL_ID = '1184965440648017';

type RootProps = {
  children: React.ReactNode;
};

const DEFAULT_GSC_VERIFICATION = 'oXMp0QHWTK-YkDQ5L8sNre1YHVZR_6Tt7VBUP8DQ5X8';

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://buildmyhouse.app').replace(/\/+$/, '');
const DEFAULT_PAGE_TITLE = 'BuildMyHouse | Find Verified Repairers, Renovators & Contractors in Nigeria';
const DEFAULT_PAGE_DESCRIPTION =
  'Find verified repairers, artisans, renovators, interior specialists, and contractors in Nigeria. Manage repairs, upgrades, renovations, and property work with clearer scope, evidence, and progress updates.';
const DEFAULT_OG_IMAGE = `${WEB_URL}/engineer-at-buildmyhouse.png`;

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
        <meta property="og:site_name" content="BuildMyHouse Technologies" />
        <meta property="og:title" content={DEFAULT_PAGE_TITLE} />
        <meta property="og:description" content={DEFAULT_PAGE_DESCRIPTION} />
        <meta property="og:url" content={`${WEB_URL}/`} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={DEFAULT_PAGE_TITLE} />
        <meta name="twitter:description" content={DEFAULT_PAGE_DESCRIPTION} />
        <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
        <meta name="google-site-verification" content={gscVerification} />
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`,
          }}
        />
        <noscript
          dangerouslySetInnerHTML={{
            __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1" alt="" />`,
          }}
        />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="48x48" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
