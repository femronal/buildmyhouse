import type { ReactNode, RefObject } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

/** Shared readable column width — matches `/articles/[slug]` layout. */
export const SEO_CONTENT_MAIN_CLASS = 'px-5 md:px-6 w-full max-w-[760px] self-center';
export const SEO_CONTENT_NARROW_CLASS = 'px-5 md:px-6 w-full max-w-[680px] self-center';

export const seoContentTypography = {
  eyebrow: 'text-[11px] md:text-xs uppercase tracking-wide text-gray-500 mb-2',
  title: 'text-3xl leading-tight text-black mb-3 md:text-5xl md:leading-[1.08] md:mb-4',
  description: 'text-gray-600 text-base leading-7 mb-3 md:text-xl md:leading-8 md:mb-4',
  body: 'text-gray-700 text-base leading-7 mb-3',
  bodyParagraph: 'text-gray-700 text-base leading-7 mb-2.5',
  sectionHeading: 'text-black text-xl md:text-2xl mb-3',
  meta: 'text-gray-500 text-sm',
} as const;

type SeoContentShellProps = {
  children: ReactNode;
  footer?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollRef?: RefObject<ScrollView | null>;
};

export function SeoContentShell({
  children,
  footer,
  contentContainerStyle,
  scrollRef,
}: SeoContentShellProps) {
  return (
    <View className="flex-1 bg-white">
      <ScrollView
        ref={scrollRef}
        className="flex-1 seo-content-shell-scroll"
        contentContainerStyle={contentContainerStyle ?? { paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      {footer}
    </View>
  );
}

type SeoContentColumnProps = {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
};

export function SeoContentColumn({ children, className = '', narrow = false }: SeoContentColumnProps) {
  const widthClass = narrow ? SEO_CONTENT_NARROW_CLASS : SEO_CONTENT_MAIN_CLASS;
  return <View className={`${widthClass} ${className}`.trim()}>{children}</View>;
}

type SeoContentBackButtonProps = {
  fallbackHref?: string;
  className?: string;
};

export function SeoContentBackButton({
  fallbackHref = '/articles',
  className = 'w-9 h-9 bg-gray-100 rounded-full items-center justify-center mb-3 md:mb-5 md:w-10 md:h-10',
}: SeoContentBackButtonProps) {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => (router.canGoBack() ? router.back() : router.push(fallbackHref as any))}
      className={className}
      accessibilityLabel="Go back"
    >
      <ArrowLeft size={18} color="#000000" strokeWidth={2.5} />
    </TouchableOpacity>
  );
}
