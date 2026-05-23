import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Info, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getScreenHorizontalPadding } from '@/lib/responsive-layout';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUpdateCurrentUser } from '@/hooks/useUpdateCurrentUser';
import { useUploadProfilePicture } from '@/hooks/useUploadProfilePicture';
import { getBackendAssetUrl } from '@/lib/image';
import { needsHomeownerIntroOnboarding } from '@/lib/onboarding';

function InfoLabel(props: { label: string; info: string }) {
  return (
    <View className="flex-row items-center mb-2">
      <Text className="text-sm text-gray-700" style={{ fontFamily: 'Poppins_500Medium' }}>
        {props.label}
      </Text>
      <TouchableOpacity onPress={() => Alert.alert(props.label, props.info)} className="ml-2">
        <Info size={15} color="#6B7280" strokeWidth={2.2} />
      </TouchableOpacity>
    </View>
  );
}

export default function HomeownerOnboardingIntroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const horizontalPadding = useMemo(() => getScreenHorizontalPadding(width), [width]);

  const { data: currentUser, isLoading } = useCurrentUser();
  const updateMe = useUpdateCurrentUser();
  const uploadProfilePicture = useUploadProfilePicture();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateValue, setStateValue] = useState('');
  const [country, setCountry] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setFullName(String(currentUser.fullName || ''));
    setEmail(String(currentUser.email || ''));
    setPhone(String(currentUser.phone || ''));
    setAddress(String(currentUser.address || ''));
    setCity(String(currentUser.city || ''));
    setStateValue(String(currentUser.state || ''));
    setCountry(String(currentUser.country || ''));
    setAgreedTerms(!!currentUser.homeownerTermsAcceptedAt);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    if (!needsHomeownerIntroOnboarding(currentUser)) {
      router.replace('/(tabs)/home');
    }
  }, [currentUser, router]);

  const hasProfilePhoto = !!String(currentUser?.pictureUrl || '').trim();

  const isSubmitting = updateMe.isPending || uploadProfilePicture.isPending;
  const canSubmit =
    !isSubmitting &&
    !!fullName.trim() &&
    !!email.trim() &&
    !!phone.trim() &&
    !!address.trim() &&
    !!city.trim() &&
    !!stateValue.trim() &&
    !!country.trim() &&
    hasProfilePhoto &&
    agreedTerms;

  const handlePickProfilePhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow photo library access to upload your profile photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) return;
      const fileName = asset.fileName || `homeowner-profile-${Date.now()}.jpg`;
      const mimeType = asset.mimeType || 'image/jpeg';
      await uploadProfilePicture.mutateAsync({ uri: asset.uri, name: fileName, type: mimeType });
      Alert.alert('Uploaded', 'Profile photo uploaded successfully.');
    } catch (error: any) {
      Alert.alert('Upload failed', error?.message || 'Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!currentUser?.id) {
      Alert.alert('Sign in required', 'Please sign in again to continue.');
      router.replace('/login');
      return;
    }
    if (!canSubmit) {
      Alert.alert('Complete required details', 'Fill all required fields, upload a photo, and accept the terms.');
      return;
    }

    try {
      await updateMe.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: stateValue.trim(),
        country: country.trim(),
        acceptHomeownerTerms: agreedTerms,
        completeProfileSetup: true,
      });
      Alert.alert('All set', 'Thank you. Your information has been saved and your account is now verified.', [
        { text: 'Continue', onPress: () => router.replace('/(tabs)/home') },
      ]);
    } catch (error: any) {
      Alert.alert('Could not submit', error?.message || 'Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-gray-600 text-center" style={{ fontFamily: 'Poppins_500Medium' }}>
          Please sign in to continue.
        </Text>
        <TouchableOpacity onPress={() => router.replace('/login')} className="mt-4 bg-black rounded-full px-6 py-3">
          <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
            Go to Login
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingTop: Math.max(16, insets.top + 8),
          paddingBottom: Math.max(28, insets.bottom + 16),
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-3xl text-black mb-2" style={{ fontFamily: 'Poppins_800ExtraBold' }}>
          Complete your profile
        </Text>
        <Text className="text-sm text-gray-500 mb-6" style={{ fontFamily: 'Poppins_400Regular' }}>
          Before you use BuildMyHouse, we need a few details to keep projects secure and accountable.
        </Text>

        <View className="mb-5">
          <InfoLabel
            label="Profile photo"
            info="We use your profile photo to help contractors and support teams verify who is requesting work."
          />
          <TouchableOpacity
            onPress={handlePickProfilePhoto}
            className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 flex-row items-center"
          >
            {hasProfilePhoto ? (
              <Image
                source={{ uri: getBackendAssetUrl(currentUser.pictureUrl || '') || String(currentUser.pictureUrl) }}
                className="w-12 h-12 rounded-full mr-3"
              />
            ) : (
              <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
                <Upload size={18} color="#4B5563" strokeWidth={2.2} />
              </View>
            )}
            <Text className="text-gray-800 flex-1" style={{ fontFamily: 'Poppins_500Medium' }}>
              {hasProfilePhoto ? 'Profile photo uploaded' : 'Upload profile photo'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mb-4">
          <InfoLabel label="Full name" info="Your legal/full name helps us prevent fake accounts and resolve disputes quickly." />
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-black"
            style={{ fontFamily: 'Poppins_400Regular' }}
          />
        </View>

        <View className="mb-4">
          <InfoLabel
            label="Email"
            info="We use your email for project alerts, payment receipts, and important security notices."
          />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-black"
            style={{ fontFamily: 'Poppins_400Regular' }}
          />
        </View>

        <View className="mb-4">
          <InfoLabel
            label="Phone number"
            info="Your phone helps your assigned GC and BuildMyHouse support reach you for urgent project coordination."
          />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+234..."
            keyboardType="phone-pad"
            className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-black"
            style={{ fontFamily: 'Poppins_400Regular' }}
          />
        </View>

        <View className="mb-4">
          <InfoLabel
            label="Address"
            info="Your address is encrypted and shown only to your assigned GC and BuildMyHouse admin when dispute handling is necessary."
          />
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="House number, street, area"
            className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-black"
            style={{ fontFamily: 'Poppins_400Regular' }}
          />
        </View>

        <View className="mb-4">
          <InfoLabel label="City" info="City helps us match you with nearby professionals and coordinate site logistics." />
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="e.g. Lagos"
            className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-black"
            style={{ fontFamily: 'Poppins_400Regular' }}
          />
        </View>

        <View className="mb-4">
          <InfoLabel label="State" info="State information improves matching accuracy and helps apply the right local workflows." />
          <TextInput
            value={stateValue}
            onChangeText={setStateValue}
            placeholder="e.g. Lagos State"
            className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-black"
            style={{ fontFamily: 'Poppins_400Regular' }}
          />
        </View>

        <View className="mb-4">
          <InfoLabel label="Country" info="Country is used for compliance, notifications, and cross-border support context." />
          <TextInput
            value={country}
            onChangeText={setCountry}
            placeholder="e.g. Nigeria"
            className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-black"
            style={{ fontFamily: 'Poppins_400Regular' }}
          />
        </View>

        <TouchableOpacity
          onPress={() => setAgreedTerms((prev) => !prev)}
          className="flex-row items-start rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 mb-3"
        >
          <View
            className={`w-5 h-5 rounded border items-center justify-center mr-3 mt-0.5 ${
              agreedTerms ? 'bg-black border-black' : 'bg-white border-gray-300'
            }`}
          >
            {agreedTerms ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : null}
          </View>
          <Text className="text-xs text-gray-700 flex-1 leading-5" style={{ fontFamily: 'Poppins_400Regular' }}>
            I agree to BuildMyHouse Homeowner Terms & Policies.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/terms-conditions')} className="mb-6">
          <Text className="text-xs text-black underline" style={{ fontFamily: 'Poppins_500Medium' }}>
            View Homeowner Terms & Policies
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canSubmit}
          className={`rounded-full py-4 items-center ${canSubmit ? 'bg-black' : 'bg-gray-200'}`}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={canSubmit ? '#FFFFFF' : '#6B7280'} />
          ) : (
            <Text
              className={`${canSubmit ? 'text-white' : 'text-gray-500'} text-base`}
              style={{ fontFamily: 'Poppins_700Bold' }}
            >
              Save and continue
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
