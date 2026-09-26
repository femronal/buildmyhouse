import { Children, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'expo-router';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react-native';
import { SeoHeading } from '@/components/seo/SeoHeading';
import { seoContentTypography } from '@/components/seo/SeoContentLayout';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED, LANDING_SURFACE } from '@/lib/home-landing-content';
import type { DirectorySort } from '@/lib/directory-listing';

const INK = LANDING_INK;
const MUTED = LANDING_MUTED;
const LINE = LANDING_BORDER;

export type DirectoryChip = {
  key: string;
  label: string;
  active: boolean;
  href: string;
};

export type DirectoryFilterSection = {
  id: string;
  title: string;
  hint?: string;
  chips: DirectoryChip[];
};

type DirectoryBrowseProps = {
  title: string;
  summary: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  quickChips: DirectoryChip[];
  wideChips?: DirectoryChip[];
  sections: DirectoryFilterSection[];
  activeFilterCount: number;
  clearHref: string;
  resultCount: number | null;
  resultNoun: string;
  loading: boolean;
  sort: DirectorySort;
  sortHrefs: Record<DirectorySort, string>;
  page: number;
  totalPages: number;
  pageHref: (page: number) => string;
  columns: number;
  actions?: ReactNode;
  notice?: ReactNode;
  error?: ReactNode;
  empty?: ReactNode;
  children: ReactNode;
};

function ChipLink({
  chip,
  flush = false,
}: {
  chip: DirectoryChip;
  flush?: boolean;
}) {
  return (
    <Link href={chip.href as any} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityState={{ selected: chip.active }}
        style={{
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 8,
          marginRight: 8,
          marginBottom: flush ? 0 : 8,
          borderWidth: 1,
          borderColor: chip.active ? INK : LINE,
          backgroundColor: chip.active ? INK : '#fff',
        }}
      >
        <Text
          style={{
            fontFamily: 'Poppins_600SemiBold',
            fontSize: 13,
            color: chip.active ? '#fff' : INK,
          }}
        >
          {chip.label}
        </Text>
      </Pressable>
    </Link>
  );
}

function DirectorySearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => onChange(draft), 250);
    return () => clearTimeout(timer);
  }, [draft, onChange, value]);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: LINE,
        borderRadius: 999,
        backgroundColor: '#fff',
        paddingHorizontal: 14,
        minHeight: 48,
      }}
    >
      <Search size={18} color={INK} strokeWidth={2.25} />
      <TextInput
        value={draft}
        onChangeText={setDraft}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        accessibilityLabel="Search listings"
        style={{
          flex: 1,
          marginLeft: 8,
          paddingVertical: 10,
          fontFamily: 'Poppins_400Regular',
          fontSize: 15,
          color: INK,
          outlineStyle: 'none' as any,
        }}
      />
      {draft ? (
        <Pressable onPress={() => setDraft('')} accessibilityLabel="Clear search" hitSlop={8}>
          <X size={16} color={MUTED} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function DirectoryCardGrid({ columns, children }: { columns: number; children: ReactNode }) {
  const items = Children.toArray(children);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
      {items.map((child, index) => (
        <View
          key={index}
          style={{
            width: `${100 / columns}%`,
            paddingHorizontal: 6,
            marginBottom: 12,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

function pageWindow(page: number, totalPages: number): number[] {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const pages: number[] = [];
  for (let current = Math.max(1, end - 4); current <= end; current += 1) pages.push(current);
  return pages;
}

export function useDirectoryColumns(kind: 'vendor' | 'professional'): number {
  const { width } = useWindowDimensions();
  if (width < 720) return 1;
  if (kind === 'vendor' && width >= 1080) return 3;
  return 2;
}

export default function DirectoryBrowse({
  title,
  summary,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  quickChips,
  wideChips = [],
  sections,
  activeFilterCount,
  clearHref,
  resultCount,
  resultNoun,
  loading,
  sort,
  sortHrefs,
  page,
  totalPages,
  pageHref,
  columns,
  actions,
  notice,
  error,
  empty,
  children,
}: DirectoryBrowseProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= 960;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const extraChips = wide ? wideChips : wideChips.filter((chip) => chip.active);
  const seen = new Set(quickChips.map((chip) => chip.key));
  const rowChips = [...quickChips, ...extraChips.filter((chip) => !seen.has(chip.key))];
  const compact = width < 768;
  const shownChips = compact ? rowChips.slice(0, 8) : rowChips;
  const countLabel = loading
    ? `Loading ${resultNoun}s…`
    : resultCount == null
      ? ''
      : `${resultCount.toLocaleString('en-US')} ${resultCount === 1 ? resultNoun : `${resultNoun}s`}`;
  const showEmpty = !loading && !error && resultCount === 0;

  return (
    <View>
      <SeoHeading
        level={1}
        className={seoContentTypography.title}
        style={{ fontFamily: 'Poppins_700Bold', color: INK }}
      >
        {title}
      </SeoHeading>
      <Text
        className={seoContentTypography.description}
        style={{ fontFamily: 'Poppins_400Regular', color: MUTED }}
      >
        {summary}
      </Text>
      {actions ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>{actions}</View> : null}

      <View
        style={
          Platform.OS === 'web'
            ? {
                position: 'sticky' as any,
                top: 0,
                zIndex: 20,
                backgroundColor: '#fff',
                paddingTop: 8,
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: LINE,
              }
            : { paddingTop: 8, paddingBottom: 4 }
        }
      >
        <DirectorySearch value={searchValue} onChange={onSearchChange} placeholder={searchPlaceholder} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 10, flexGrow: 0 }}
          contentContainerStyle={{ paddingRight: 12, alignItems: 'center' }}
        >
          <Pressable
            onPress={() => setFiltersOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Open filters"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 999,
              paddingHorizontal: 14,
              paddingVertical: 8,
              marginRight: 8,
              borderWidth: 1,
              borderColor: INK,
              backgroundColor: activeFilterCount > 0 ? INK : '#fff',
            }}
          >
            <SlidersHorizontal size={14} color={activeFilterCount > 0 ? '#fff' : INK} />
            <Text
              style={{
                marginLeft: 6,
                fontFamily: 'Poppins_600SemiBold',
                fontSize: 13,
                color: activeFilterCount > 0 ? '#fff' : INK,
              }}
            >
              Filters{activeFilterCount > 0 ? ` ${activeFilterCount}` : ''}
            </Text>
          </Pressable>
          {shownChips.map((chip) => (
            <ChipLink key={chip.key} chip={chip} flush />
          ))}
          {compact && rowChips.length > shownChips.length ? (
            <Pressable
              onPress={() => setFiltersOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="More categories"
              style={{
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: INK,
                backgroundColor: '#fff',
              }}
            >
              <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: INK }}>More</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 6,
          marginBottom: 12,
          zIndex: 5,
        }}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <SeoHeading
            level={2}
            style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: INK, marginTop: 0, marginBottom: 0 } as any}
          >
            {countLabel}
          </SeoHeading>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {activeFilterCount > 0 || searchValue ? (
            <Link href={clearHref as any} asChild>
              <Pressable accessibilityRole="link" style={{ marginRight: 12 }}>
                <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: MUTED }}>Clear</Text>
              </Pressable>
            </Link>
          ) : null}
          <Pressable
            onPress={() => setSortOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityLabel="Sort results"
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: INK }}>
              {sort === 'name' ? 'Name' : 'Best match'}
            </Text>
            <ChevronDown size={16} color={INK} />
          </Pressable>
        </View>
      </View>
      {sortOpen ? (
        <View
          style={{
            alignSelf: 'flex-end',
            borderWidth: 1,
            borderColor: LINE,
            borderRadius: 12,
            backgroundColor: '#fff',
            marginBottom: 12,
            overflow: 'hidden',
            minWidth: 160,
          }}
        >
          {(['best', 'name'] as const).map((key) => (
            <Link key={key} href={sortHrefs[key] as any} asChild>
              <Pressable
                onPress={() => setSortOpen(false)}
                accessibilityRole="link"
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  backgroundColor: sort === key ? LANDING_SURFACE : '#fff',
                }}
              >
                <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: INK }}>
                  {key === 'name' ? 'Name' : 'Best match'}
                </Text>
              </Pressable>
            </Link>
          ))}
        </View>
      ) : null}

      {notice}
      {error}
      {showEmpty ? empty : <DirectoryCardGrid columns={columns}>{children}</DirectoryCardGrid>}

      {totalPages > 1 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8, marginBottom: 20 }}>
          <PageLink href={pageHref(page - 1)} disabled={page <= 1} label="Previous" />
          {pageWindow(page, totalPages).map((number) => (
            <Link key={number} href={pageHref(number) as any} asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityState={{ selected: number === page }}
                style={{
                  minWidth: 36,
                  height: 36,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginHorizontal: 2,
                  backgroundColor: number === page ? INK : '#fff',
                  borderWidth: 1,
                  borderColor: number === page ? INK : LINE,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Poppins_600SemiBold',
                    fontSize: 13,
                    color: number === page ? '#fff' : INK,
                  }}
                >
                  {number}
                </Text>
              </Pressable>
            </Link>
          ))}
          <PageLink href={pageHref(page + 1)} disabled={page >= totalPages} label="Next" />
        </View>
      ) : null}

      <Modal visible={filtersOpen} transparent animationType="slide" onRequestClose={() => setFiltersOpen(false)}>
        <View style={{ flex: 1, justifyContent: wide ? 'center' : 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <Pressable
            accessibilityLabel="Close filters"
            onPress={() => setFiltersOpen(false)}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <View
            style={{
              backgroundColor: '#fff',
              maxHeight: wide ? '80%' : '88%',
              width: wide ? 520 : '100%',
              alignSelf: wide ? 'center' : 'stretch',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              borderBottomLeftRadius: wide ? 20 : 0,
              borderBottomRightRadius: wide ? 20 : 0,
              paddingBottom: Math.max(insets.bottom, 16),
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingTop: 16,
                paddingBottom: 8,
              }}
            >
              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 18, color: INK }}>Filters</Text>
              <Pressable onPress={() => setFiltersOpen(false)} accessibilityLabel="Close filters" hitSlop={8}>
                <X size={20} color={INK} />
              </Pressable>
            </View>
            <ScrollView style={{ flexShrink: 1, paddingHorizontal: 20 }} keyboardShouldPersistTaps="handled">
              {sections.map((section) => (
                <View key={section.id} style={{ marginBottom: 16 }}>
                  <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: INK, marginBottom: 4 }}>
                    {section.title}
                  </Text>
                  {section.hint ? (
                    <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: MUTED, marginBottom: 8 }}>
                      {section.hint}
                    </Text>
                  ) : null}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {section.chips.map((chip) => (
                      <ChipLink key={chip.key} chip={chip} />
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingTop: 8 }}>
              <Link href={clearHref as any} asChild>
                <Pressable
                  onPress={() => setFiltersOpen(false)}
                  accessibilityRole="link"
                  style={{
                    borderWidth: 1,
                    borderColor: LINE,
                    borderRadius: 999,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: INK }}>Clear</Text>
                </Pressable>
              </Link>
              <Pressable
                onPress={() => setFiltersOpen(false)}
                accessibilityRole="button"
                style={{
                  flex: 1,
                  backgroundColor: INK,
                  borderRadius: 999,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 14, color: '#fff' }}>
                  {loading || resultCount == null ? 'Show results' : `Show ${countLabel.toLowerCase()}`}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function PageLink({ href, disabled, label }: { href: string; disabled: boolean; label: string }) {
  if (disabled) {
    return (
      <View style={{ paddingHorizontal: 10, paddingVertical: 8, marginHorizontal: 4, opacity: 0.35 }}>
        <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: INK }}>{label}</Text>
      </View>
    );
  }
  return (
    <Link href={href as any} asChild>
      <Pressable accessibilityRole="link" style={{ paddingHorizontal: 10, paddingVertical: 8, marginHorizontal: 4 }}>
        <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: INK }}>{label}</Text>
      </Pressable>
    </Link>
  );
}

export function DirectoryActionLink({
  href,
  label,
  filled = false,
}: {
  href: string;
  label: string;
  filled?: boolean;
}) {
  return (
    <Link href={href as any} asChild>
      <Pressable
        accessibilityRole="link"
        style={{
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 8,
          marginRight: 8,
          marginBottom: 8,
          backgroundColor: filled ? INK : '#fff',
          borderWidth: 1,
          borderColor: filled ? INK : LINE,
        }}
      >
        <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: filled ? '#fff' : INK }}>{label}</Text>
      </Pressable>
    </Link>
  );
}

export function DirectoryPill({ label, tone = 'outline' }: { label: string; tone?: 'outline' | 'solid' }) {
  const solid = tone === 'solid';
  return (
    <View
      style={{
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginRight: 6,
        marginBottom: 6,
        backgroundColor: solid ? INK : '#fff',
        borderWidth: 1,
        borderColor: solid ? INK : LINE,
      }}
    >
      <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 11, color: solid ? '#fff' : MUTED }}>{label}</Text>
    </View>
  );
}
