import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
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

type MissingFieldKey =
  | 'profilePhoto'
  | 'fullName'
  | 'email'
  | 'phone'
  | 'address'
  | 'city'
  | 'state'
  | 'country'
  | 'agreedTerms';

type InfoLabelProps = {
  label: string;
  info: string;
  onPressInfo: (payload: { label: string; info: string }) => void;
};

function InfoLabel(props: InfoLabelProps) {
  return (
    <View className="flex-row items-center mb-2">
      <Text className="text-sm text-gray-700" style={{ fontFamily: 'Poppins_500Medium' }}>
        {props.label}
      </Text>
      <TouchableOpacity
        onPress={() => props.onPressInfo({ label: props.label, info: props.info })}
        className="ml-2"
        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
      >
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
  const [missingFields, setMissingFields] = useState<Partial<Record<MissingFieldKey, string>>>({});
  const [activeInfo, setActiveInfo] = useState<{ label: string; info: string } | null>(null);

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
  const validateRequiredFields = (): Partial<Record<MissingFieldKey, string>> => {
    const errors: Partial<Record<MissingFieldKey, string>> = {};

    if (!hasProfilePhoto) {
      errors.profilePhoto =
        'You forgot your profile photo. We use this to verify your identity before project work starts.';
    }
    if (!fullName.trim()) {
      errors.fullName = 'You forgot your full name. We need it to keep your account accountable and secure.';
    }
    if (!email.trim()) {
      errors.email = 'You forgot your email. We need it for receipts, alerts, and important account updates.';
    }
    if (!phone.trim()) {
      errors.phone = 'You forgot your phone number. We need it for urgent project coordination.';
    }
    if (!address.trim()) {
      errors.address = 'You forgot your address. We need this to match you with general contractors in your area.';
    }
    if (!city.trim()) {
      errors.city = 'You forgot your city. This helps us route your project to nearby professionals.';
    }
    if (!stateValue.trim()) {
      errors.state = 'You forgot your state. This helps us apply the right local workflow for your project.';
    }
    if (!country.trim()) {
      errors.country = 'You forgot your country. We need this for location context and support compliance.';
    }
    if (!agreedTerms) {
      errors.agreedTerms = 'Please accept the homeowner terms so we can proceed with your account setup.';
    }

    return errors;
  };

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
      setMissingFields((prev) => {
        if (!prev.profilePhoto) return prev;
        const next = { ...prev };
        delete next.profilePhoto;
        return next;
      });
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

    const errors = validateRequiredFields();
    if (Object.keys(errors).length > 0) {
      setMissingFields(errors);
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

  const clearFieldError = (field: MissingFieldKey) => {
    setMissingFields((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
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
            onPressInfo={setActiveInfo}
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
          {missingFields.profilePhoto ? (
            <Text className="text-[11px] text-red-600 mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {missingFields.profilePhoto}
            </Text>
          ) : null}
        </View>

        <View className="mb-4">
          <InfoLabel
            label="Full name"
            info="Your legal/full name helps us prevent fake accounts and resolve disputes quickly."
            onPressInfo={setActiveInfo}
          />
          <TextInput
            value={fullName}
            onChangeText={(value) => {
              setFullName(value);
              if (value.trim()) clearFieldError('fullName');
            }}
            placeholder="Enter your full name"
            className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-black"
            style={{ fontFamily: 'Poppins_400Regular' }}
          />
          {missingFields.fullName ? (
            <Text className="text-[11px] text-red-600 mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {missingFields.fullName}
            </Text>
          ) : null}
        </View>

        <View className="mb-4">
          <InfoLabel
            label="Email"
            info="We use your email for project alerts, payment receipts, and important security notices."
            onPressInfo={setActiveInfo}
          />
          <TextInput
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (value.trim()) clearFieldError('email');
            }}
            placeholder="email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-black"
            style={{ fontFamily: 'Poppins_400Regular' }}
          />
          {missingFields.email ? (
            <Text className="text-[11px] text-red-600 mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {missingFields.email}
            </Text>
          ) : null}
        </View>

        <View className="mb-4">
          <InfoLabel
            label="Phone number"
            info="Your phone helps your assigned GC and BuildMyHouse support reach you for urgent project coordination."
            onPressInfo={setActiveInfo}
          />
          <TextInput
            value={phone}
            onChangeText={(value) => {
              setPhone(value);
              if (value.trim()) clearFieldError('phone');
            }}
            placeholder="+234..."
            keyboardType="phone-pad"
            className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-black"
            style={{ fontFamily: 'Poppins_400Regular' }}
          />
          {missingFields.phone ? (
            <Text className="text-[11px] text-red-600 mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {missingFields.phone}
            </Text>
          ) : null}
        </View>

        <View className="mb-4">
          <InfoLabel
            label="Address"
            info="Your address is encrypted and shown only to your assigned GC and BuildMyHouse admin when dispute handling is necessary."
            onPressInfo={setActiveInfo}
          />
          <TextInput
            value={address}
            onChangeText={(value) => {
              setAddress(value);
              if (value.trim()) clearFieldError('address');
            }}
            placeholder="House number, street, area"
            className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-black"
            style={{ fontFamily: 'Poppins_400Regular' }}
          />
          {missingFields.address ? (
            <Text className="text-[11px] text-red-600 mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {missingFields.address}
            </Text>
          ) : null}
        </View>

        <View className="mb-4">
          <InfoLabel
            label="City"
            info="City helps us match you with nearby professionals and coordinate site logistics."
            onPressInfo={setActiveInfo}
          />
          <TextInput
            value={city}
            onChangeText={(value) => {
              setCity(value);
              if (value.trim()) clearFieldError('city');
            }}
            placeholder="e.g. Lagos"
            className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-black"
            style={{ fontFamily: 'Poppins_400Regular' }}
          />
          {missingFields.city ? (
            <Text className="text-[11px] text-red-600 mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {missingFields.city}
            </Text>
          ) : null}
        </View>

        <View className="mb-4">
          <InfoLabel
            label="State"
            info="State information improves matching accuracy and helps apply the right local workflows."
            onPressInfo={setActiveInfo}
          />
          <TextInput
            value={stateValue}
            onChangeText={(value) => {
              setStateValue(value);
              if (value.trim()) clearFieldError('state');
            }}
            placeholder="e.g. Lagos State"
            className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-black"
            style={{ fontFamily: 'Poppins_400Regular' }}
          />
          {missingFields.state ? (
            <Text className="text-[11px] text-red-600 mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {missingFields.state}
            </Text>
          ) : null}
        </View>

        <View className="mb-4">
          <InfoLabel
            label="Country"
            info="Country is used for compliance, notifications, and cross-border support context."
            onPressInfo={setActiveInfo}
          />
          <TextInput
            value={country}
            onChangeText={(value) => {
              setCountry(value);
              if (value.trim()) clearFieldError('country');
            }}
            placeholder="e.g. Nigeria"
            className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-black"
            style={{ fontFamily: 'Poppins_400Regular' }}
          />
          {missingFields.country ? (
            <Text className="text-[11px] text-red-600 mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
              {missingFields.country}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={() => {
            setAgreedTerms((prev) => {
              const next = !prev;
              if (next) clearFieldError('agreedTerms');
              return next;
            });
          }}
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
        {missingFields.agreedTerms ? (
          <Text className="text-[11px] text-red-600 mb-3 -mt-1" style={{ fontFamily: 'Poppins_400Regular' }}>
            {missingFields.agreedTerms}
          </Text>
        ) : null}

        <TouchableOpacity onPress={() => router.push('/terms-conditions')} className="mb-6">
          <Text className="text-xs text-black underline" style={{ fontFamily: 'Poppins_500Medium' }}>
            View Homeowner Terms & Policies
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          className={`rounded-full py-4 items-center ${isSubmitting ? 'bg-gray-300' : 'bg-black'}`}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#6B7280" />
          ) : (
            <Text className="text-white text-base" style={{ fontFamily: 'Poppins_700Bold' }}>
              Save and continue
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={!!activeInfo} transparent animationType="fade" onRequestClose={() => setActiveInfo(null)}>
        <View className="flex-1 bg-black/45 justify-center px-6">
          <View className="rounded-2xl bg-white p-5 border border-gray-200">
            <Text className="text-base text-black mb-2" style={{ fontFamily: 'Poppins_700Bold' }}>
              {activeInfo?.label}
            </Text>
            <Text className="text-sm text-gray-700 leading-6" style={{ fontFamily: 'Poppins_400Regular' }}>
              {activeInfo?.info}
            </Text>
            <TouchableOpacity
              onPress={() => setActiveInfo(null)}
              className="self-end mt-4 rounded-full bg-black px-4 py-2"
            >
              <Text className="text-white text-xs" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
