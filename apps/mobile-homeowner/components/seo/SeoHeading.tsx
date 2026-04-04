import { createElement, type ReactNode } from 'react';
import { Platform, Text, type TextStyle } from 'react-native';

type Level = 1 | 2 | 3;

type SeoHeadingProps = {
  level: Level;
  children: ReactNode;
  className?: string;
  style?: TextStyle;
};

/**
 * Renders real <h1>/<h2>/<h3> on web for SEO; falls back to accessible Text on native.
 */
export function SeoHeading({ level, children, className, style }: SeoHeadingProps) {
  if (Platform.OS === 'web') {
    const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
    return createElement(
      Tag,
      {
        className,
        style: style as object,
      },
      children,
    );
  }
  return (
    <Text accessibilityRole="header" className={className} style={style}>
      {children}
    </Text>
  );
}
