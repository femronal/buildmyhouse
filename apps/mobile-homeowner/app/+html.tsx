import { ScrollViewStyleReset } from 'expo-router/html';

type RootProps = {
  children: React.ReactNode;
};

const DEFAULT_GSC_VERIFICATION = 'oXMp0QHWTK-YkDQ5L8sNre1YHVZR_6Tt7VBUP8DQ5X8';

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
        <meta name="google-site-verification" content={gscVerification} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
