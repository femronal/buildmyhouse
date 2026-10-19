import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Bed, MapPin, X } from 'phosphor-react-native';
import {
  formatOpportunityCheckValue,
  getOpportunityProfile,
  splitCommaList,
  type BuildOpportunityCategoryKey,
  type OpportunityEntity,
} from '@buildmyhouse/shared-types';

const GREEN = '#22c55e';

function shown(value: string) {
  const text = value.trim();
  if (!text) return '';
  if (/^not specified$/i.test(text) || text === 'N/A' || text === 'null') return '';
  return text;
}

export default function OpportunityDetailView({
  entity,
  data,
  title,
  priceLabel,
  location,
  sourceLabel,
  images,
  onRequestInspection,
  requesting,
}: {
  entity: OpportunityEntity;
  data: Record<string, unknown>;
  title: string;
  priceLabel: string;
  location: string;
  sourceLabel: string;
  images: { url: string; label?: string | null }[];
  onRequestInspection: () => void;
  requesting: boolean;
}) {
  const { width } = useWindowDimensions();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [viewer, setViewer] = useState<number | null>(null);
  const category = (data.opportunityCategory || 'residential') as BuildOpportunityCategoryKey;
  const profile = getOpportunityProfile(entity, category);
  const facts = [...profile.snapshotRows, ...profile.checkRows]
    .map((row) => ({ label: row.label, value: shown(formatOpportunityCheckValue(row, data)) }))
    .filter((row) => row.value && !/price|rent|fee|deposit/i.test(row.label));
  const description = shown(String(data.description || ''));
  const featurePills = [
    ...splitCommaList(data[profile.verificationDocField]),
    ...(profile.verificationExtraField ? splitCommaList(data[profile.verificationExtraField]) : []),
  ].filter(Boolean);
  const sellerClaims = facts.slice(0, 10);
  const photos = images.filter((image) => image.url).slice(0, 12);
  const beds = Number(data.bedrooms);
  const baths = Number(data.bathrooms);
  const size = Number(data.sizeSqm || data.squareMeters || 0);
  const factBits = [
    entity !== 'land' && beds > 0 ? `${beds} bed` : '',
    entity !== 'land' && baths > 0 ? `${baths} bath` : '',
    size > 0 ? `${size} m²` : '',
    sourceLabel,
  ].filter(Boolean);
  const mapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const lat = Number(data.latitude) + 0.006;
  const lng = Number(data.longitude) + 0.006;
  const mapUrl = mapsKey && Number.isFinite(lat) && Number.isFinite(lng)
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=14&size=640x320&scale=2&key=${mapsKey}`
    : '';

  return (
    <View>
      <Text accessibilityLabel={title} style={{ fontFamily: 'Poppins_700Bold', fontSize: 28, color: '#111' }}>{priceLabel}</Text>
      {factBits.length > 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
          {entity !== 'land' && beds > 0 ? <Bed size={16} color="#111" /> : null}
          <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#111', marginLeft: 6 }}>{factBits.join('  ·  ')}</Text>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
        <MapPin size={14} color="#6B7280" />
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#374151', marginLeft: 4, flex: 1 }}>{location}</Text>
      </View>
      <View style={{ alignSelf: 'flex-start', borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 }}>
        <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 12 }}>{sourceLabel}</Text>
      </View>

      <View style={{ marginTop: 16 }}>
        <Pressable onPress={() => photos[0] && setViewer(0)}>
          {photos[0] ? (
            <Image source={{ uri: photos[0].url }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 16, backgroundColor: '#F3F4F6' }} />
          ) : (
            <View style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 16, backgroundColor: '#F3F4F6' }} />
          )}
        </Pressable>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
          {photos.slice(1, 5).map((photo, index) => (
            <Pressable key={photo.url} onPress={() => setViewer(index + 1)} style={{ width: '24%', marginRight: '1%', marginBottom: 8 }}>
              <Image source={{ uri: photo.url }} style={{ width: '100%', aspectRatio: 1, borderRadius: 10 }} />
            </Pressable>
          ))}
        </View>
        {photos.length > 0 ? (
          <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#6B7280' }}>1/{photos.length} photos</Text>
        ) : null}
      </View>

      <View style={{ marginTop: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 16, padding: 14 }}>
        <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, marginBottom: 6 }}>Checked by BuildMyHouse</Text>
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#374151', lineHeight: 20 }}>
          Not checked by BuildMyHouse yet. Request an inspection to have it checked.
        </Text>
      </View>

      <View style={{ marginBottom: 24, borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 16, padding: 14 }}>
        <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, marginBottom: 6 }}>Listed by the seller</Text>
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#6B7280', marginBottom: 10 }}>
          Not verified by BuildMyHouse.
        </Text>
        {sellerClaims.length > 0 ? (
          sellerClaims.map((item) => (
            <Text
              key={`${item.label}-${item.value}`}
              style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#111', marginBottom: 8, lineHeight: 20 }}
            >
              {item.label}: {item.value}
            </Text>
          ))
        ) : (
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#6B7280', lineHeight: 20 }}>
            The seller has not added more details yet.
          </Text>
        )}
      </View>

      {description ? (
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, marginBottom: 8 }}>About this property</Text>
          <Text numberOfLines={aboutOpen ? undefined : 3} style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#374151', lineHeight: 22 }}>
            {description}
          </Text>
          <Pressable onPress={() => setAboutOpen((open) => !open)}>
            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, marginTop: 6 }}>{aboutOpen ? 'Show less' : 'Show more'}</Text>
          </Pressable>
        </View>
      ) : null}

      {facts.length > 0 ? (
        <View style={{ marginBottom: 24, borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 16, padding: 14 }}>
          <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, marginBottom: 8 }}>Key facts</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {facts.map((fact) => (
              <View key={fact.label} style={{ width: '50%', paddingVertical: 8, paddingRight: 8 }}>
                <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#6B7280' }}>{fact.label}</Text>
                <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#111' }}>{fact.value}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {featurePills.length > 0 ? (
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, marginBottom: 8 }}>Features</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {featurePills.map((item) => (
              <View key={item} style={{ borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, marginBottom: 8 }}>
                <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#111' }}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={{ marginTop: 16 }}>
        <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, marginBottom: 8 }}>What happens next</Text>
        {[
          'Request an inspection.',
          'A BuildMyHouse inspector visits and reports back with photos.',
          'You decide, then work with a verified contractor.',
          'Work runs in stages with evidence and your approval.',
        ].map((step, index) => (
          <Text key={step} style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#111', marginBottom: 6 }}>
            {index + 1}. {step}
          </Text>
        ))}
      </View>

      <View style={{ marginTop: 16, borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 16, overflow: 'hidden' }}>
        {mapUrl ? <Image source={{ uri: mapUrl }} style={{ width: '100%', height: 180 }} /> : null}
        <View style={{ padding: 14 }}>
          <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16 }}>Area</Text>
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#374151', marginTop: 4 }}>{location}</Text>
          <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#6B7280', marginTop: 4 }}>Approximate area only. The exact point stays private.</Text>
        </View>
      </View>

      <Pressable
        onPress={onRequestInspection}
        disabled={requesting}
        style={{ marginTop: 20, backgroundColor: GREEN, borderRadius: 999, paddingVertical: 14, alignItems: 'center' }}
      >
        <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#fff' }}>{requesting ? 'Submitting...' : 'Request inspection'}</Text>
      </Pressable>

      <Modal visible={viewer != null} animationType="fade" onRequestClose={() => setViewer(null)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <Pressable onPress={() => setViewer(null)} style={{ position: 'absolute', top: 48, right: 16, zIndex: 2 }}>
            <X size={28} color="#fff" />
          </Pressable>
          <ScrollView horizontal pagingEnabled>
            {photos.map((photo) => (
              <Image key={photo.url} source={{ uri: photo.url }} style={{ width, height: '100%' }} resizeMode="contain" />
            ))}
          </ScrollView>
          <Text style={{ color: '#fff', textAlign: 'center', paddingBottom: 24, fontFamily: 'Poppins_500Medium' }}>
            {viewer != null ? `${viewer + 1}/${photos.length} photos` : ''}
          </Text>
        </View>
      </Modal>
    </View>
  );
}
