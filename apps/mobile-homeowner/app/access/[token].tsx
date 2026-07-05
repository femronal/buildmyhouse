import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { storeAuthToken } from '@/lib/auth';
import {
  fetchAccessPreview,
  requestAccessCode,
  verifyAccessCode,
  type AccessPreview,
} from '@/lib/project-access';
import { MapPin, ShieldCheck, Mail, KeyRound } from 'lucide-react-native';
import LogoText from '@/components/LogoText';

type Step = 'loading' | 'intro' | 'verify' | 'error';

export default function ProjectAccessScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const rawToken = params.token;
  const token = useMemo(
    () => (Array.isArray(rawToken) ? rawToken[0] : rawToken)?.trim() || '',
    [rawToken],
  );

  const [step, setStep] = useState<Step>('loading');
  const [preview, setPreview] = useState<AccessPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('This project link is missing or invalid.');
      setStep('error');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await fetchAccessPreview(token);
        if (cancelled) return;
        setPreview(data);
        setEmail(data.contactEmail);
        setStep('intro');
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || 'Could not load project link.');
        setStep('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSendCode = async () => {
    if (!token || !email.trim()) return;
    setError(null);
    setSendingCode(true);
    try {
      await requestAccessCode(token, email);
      setCodeSent(true);
      setStep('verify');
    } catch (e: any) {
      setError(e?.message || 'Could not send verification code.');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerify = async () => {
    if (!token || !email.trim() || !code.trim()) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    if (!acceptTerms) {
      setError('Please accept the tracking terms to continue.');
      return;
    }

    setError(null);
    setVerifying(true);
    try {
      const result = await verifyAccessCode(token, {
        email,
        code,
        acceptTerms,
      });
      await storeAuthToken(result.token);
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      router.replace(result.redirectPath as any);
    } catch (e: any) {
      setError(e?.message || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const roleLabel = preview?.role === 'general_contractor' ? 'General Contractor' : 'Homeowner';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40 }}
      >
        <View className="w-full self-center" style={{ maxWidth: 480 }}>
          <View className="items-center mb-8">
            <LogoText variant="black" size="md" />
          </View>

          {step === 'loading' && (
            <View className="items-center py-16">
              <ActivityIndicator size="large" color="#000" />
              <Text className="text-gray-500 mt-4" style={{ fontFamily: 'Poppins_400Regular' }}>
                Loading your project…
              </Text>
            </View>
          )}

          {step === 'error' && (
            <View className="rounded-2xl border border-red-100 bg-red-50 p-6">
              <Text className="text-red-700 text-base" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Link unavailable
              </Text>
              <Text className="text-red-600 mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                {error || 'This project link is invalid or has expired.'}
              </Text>
            </View>
          )}

          {(step === 'intro' || step === 'verify') && preview && (
            <View className="space-y-6">
              <View>
                <Text
                  className="text-2xl text-black"
                  style={{ fontFamily: 'Poppins_700Bold' }}
                >
                  Open your project
                </Text>
                <Text className="text-gray-500 mt-2" style={{ fontFamily: 'Poppins_400Regular' }}>
                  You are joining as the {roleLabel.toLowerCase()}. No full signup is required — we
                  will verify your email first.
                </Text>
              </View>

              <View className="rounded-2xl border border-gray-200 p-5 bg-gray-50">
                <Text className="text-lg text-black" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                  {preview.project.name}
                </Text>
                <View className="flex-row items-center mt-2">
                  <MapPin size={16} color="#6b7280" />
                  <Text className="text-gray-600 ml-2 flex-1" style={{ fontFamily: 'Poppins_400Regular' }}>
                    {preview.project.address}
                  </Text>
                </View>
                <Text className="text-gray-500 mt-3 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                  Budget ₦{Number(preview.project.budget || 0).toLocaleString()} ·{' '}
                  {preview.project.progress || 0}% complete
                </Text>
              </View>

              <View>
                <Text className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                  Email on file
                </Text>
                <View className="flex-row items-center rounded-xl border border-gray-200 px-4 py-3 bg-white">
                  <Mail size={18} color="#6b7280" />
                  <TextInput
                    value={email}
                    editable={false}
                    className="flex-1 ml-3 text-black"
                    style={{ fontFamily: 'Poppins_400Regular' }}
                  />
                </View>
              </View>

              {step === 'intro' && (
                <TouchableOpacity
                  onPress={handleSendCode}
                  disabled={sendingCode}
                  className="bg-black rounded-full py-4 items-center"
                >
                  {sendingCode ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      Email me a verification code
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {step === 'verify' && (
                <View className="space-y-4">
                  {codeSent && (
                    <Text className="text-sm text-emerald-700" style={{ fontFamily: 'Poppins_400Regular' }}>
                      Verification code sent. Check your inbox.
                    </Text>
                  )}

                  <View>
                    <Text className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'Poppins_500Medium' }}>
                      6-digit code
                    </Text>
                    <View className="flex-row items-center rounded-xl border border-gray-200 px-4 py-3 bg-white">
                      <KeyRound size={18} color="#6b7280" />
                      <TextInput
                        value={code}
                        onChangeText={setCode}
                        keyboardType="number-pad"
                        maxLength={6}
                        placeholder="123456"
                        className="flex-1 ml-3 text-black tracking-widest"
                        style={{ fontFamily: 'Poppins_600SemiBold', letterSpacing: 4 }}
                      />
                    </View>
                  </View>

                  <Pressable
                    onPress={() => setAcceptTerms((prev) => !prev)}
                    className="flex-row items-start gap-3"
                  >
                    <View
                      className={`w-5 h-5 rounded border mt-0.5 items-center justify-center ${
                        acceptTerms ? 'bg-black border-black' : 'border-gray-300 bg-white'
                      }`}
                    >
                      {acceptTerms ? (
                        <ShieldCheck size={14} color="#fff" />
                      ) : null}
                    </View>
                    <Text className="flex-1 text-sm text-gray-600" style={{ fontFamily: 'Poppins_400Regular' }}>
                      I agree to use BuildMyHouse for project tracking on this managed project and
                      understand my activity may be shared with the other party.
                    </Text>
                  </Pressable>

                  <TouchableOpacity
                    onPress={handleVerify}
                    disabled={verifying}
                    className="bg-black rounded-full py-4 items-center"
                  >
                    {verifying ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                        Open project dashboard
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSendCode}
                    disabled={sendingCode}
                    className="items-center py-2"
                  >
                    <Text className="text-gray-500 text-sm" style={{ fontFamily: 'Poppins_500Medium' }}>
                      Resend code
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      router.push(`/email-login?accessToken=${encodeURIComponent(token)}&mode=signup` as any)
                    }
                    className="items-center py-2"
                  >
                    <Text className="text-black text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                      Save this project to my account
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {error ? (
                <Text className="text-red-600 text-sm" style={{ fontFamily: 'Poppins_400Regular' }}>
                  {error}
                </Text>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
