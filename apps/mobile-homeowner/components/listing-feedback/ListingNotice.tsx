import { Text, View } from 'react-native';
import { LANDING_BORDER, LANDING_INK, LANDING_MUTED } from '@/lib/home-landing-content';
import { listingNoticeFrom } from '@/lib/listing-feedback';

export default function ListingNotice({ profile }: { profile: object | null | undefined }) {
  const notice = listingNoticeFrom(profile);
  if (!notice) return null;
  const date = notice.date ? new Date(notice.date) : null;
  const dateLabel = date && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date)
    : '';
  return (
    <View style={{ borderWidth: 1, borderColor: LANDING_BORDER, borderRadius: 12, padding: 14, marginTop: 24 }}>
      <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, color: LANDING_INK }}>Notice from BMH</Text>
      <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 15, color: LANDING_INK, lineHeight: 22, marginTop: 8 }}>{notice.text}</Text>
      {dateLabel ? (
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: LANDING_MUTED, marginTop: 8 }}>{dateLabel}</Text>
      ) : null}
    </View>
  );
}
