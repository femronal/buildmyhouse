import { ScrollViewStyleReset } from 'expo-router/html';

type RootProps = {
  children: React.ReactNode;
};

const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || 'https://gc.buildmyhouse.app').replace(/\/+$/, '');
const DEFAULT_PAGE_TITLE = 'BuildMyHouse Technologies for General Contractors';
const DEFAULT_PAGE_DESCRIPTION =
  'BuildMyHouse Technologies helps general contractors receive vetted project opportunities, share stage updates, upload evidence, and manage homeowners with clearer workflows.';
const DEFAULT_OG_IMAGE = 'https://buildmyhouse.app/assets/images/engineer%20at%20BuildMyHouse.png';

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
        <link rel="icon" href="https://buildmyhouse.app/favicon.png" type="image/png" sizes="48x48" />
        <link rel="apple-touch-icon" href="https://buildmyhouse.app/apple-touch-icon.png" sizes="180x180" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
