import { createElement, type ReactNode } from 'react';
import { Platform, StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

type Level = 1 | 2 | 3;

type SeoHeadingProps = {
  level: Level;
  children: ReactNode;
  className?: string;
  style?: StyleProp<TextStyle>;
};

/**
 * Renders real <h1>/<h2>/<h3> on web for SEO; falls back to accessible Text on native.
 */
export function SeoHeading({ level, children, className, style }: SeoHeadingProps) {
  const flattenedStyle = StyleSheet.flatten(style);
  if (Platform.OS === 'web') {
    const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
    return createElement(
      Tag,
      {
        className,
        style: flattenedStyle as object | undefined,
      },
      children,
    );
  }
  return (
    <Text accessibilityRole="header" className={className} style={flattenedStyle}>
      {children}
    </Text>
  );
}
