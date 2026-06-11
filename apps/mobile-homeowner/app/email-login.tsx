import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { storeAuthToken } from "@/lib/auth";
import { api } from "@/lib/api";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus } from "lucide-react-native";
import Logo from "@/components/Logo";

const PAGE_BG = '#050505';
const CARD_BG = '#171717';
const INPUT_BG = 'rgba(10, 10, 10, 0.5)';
const INPUT_RING = 'rgba(255, 255, 255, 0.12)';
const LABEL_COLOR = '#d4d4d4';
const MUTED_COLOR = '#9ca3af';
const FAINT_COLOR = '#737373';

export default function EmailLoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const clearError = () => setFormError(null);

  const toggleMode = () => {
    setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
    clearError();
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!email || !password || (mode === 'signup' && !fullName.trim())) {
      alert(mode === 'signup' ? 'Please enter your full name, email, and password' : 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const data = mode === 'signup'
        ? await api.post('/auth/register', {
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            password,
            role: 'homeowner',
          })
        : await api.post('/auth/login', {
            email: email.trim().toLowerCase(),
            password,
          });

      if (!data?.token) {
        alert(`${mode === 'signup' ? 'Signup' : 'Login'} error: No token received from server`);
        return;
      }

      // ROLE VALIDATION: Only allow homeowners
      const userRole = data.user?.role;
      if (!userRole || userRole !== 'homeowner') {
        alert(
          `This app is for homeowners only.\n\nYour account role: ${userRole || 'unknown'}\n\nPlease use the contractor app to sign in.`
        );
        return;
      }

      await storeAuthToken(data.token);
      router.replace('/');
    } catch (error: any) {
      const message = error?.data?.message ?? error?.message ?? 'Something went wrong. Please try again.';
      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  const isSignup = mode === 'signup';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      style={{ backgroundColor: PAGE_BG }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 40,
        }}
      >
        <View className="w-full" style={{ maxWidth: 448 }}>
          {/* Back + logo */}
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.push('/'))}
            className="w-9 h-9 rounded-full items-center justify-center self-start mb-6"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={18} color="#ffffff" strokeWidth={2} />
          </TouchableOpacity>

          <View className="items-center mb-8">
            <View className="bg-white rounded-2xl px-5 py-3">
              <Logo size="sm" />
            </View>
          </View>

          {/* Card */}
          <View className="relative w-full">
            {Platform.OS === 'web' ? (
              <View className="absolute inset-0 rounded-2xl overflow-hidden">
                <View className="bmh-auth-spin-1" />
                <View className="bmh-auth-spin-2" />
              </View>
            ) : null}
            {Platform.OS === 'web' ? <View className="bmh-auth-border" /> : null}

            <View
              className="bmh-auth-card relative overflow-hidden rounded-2xl"
              style={{ backgroundColor: CARD_BG, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}
            >
              <View className="p-6 sm:p-8 lg:p-10">
                {/* Header */}
                <View className="mb-8">
                  <View className="flex-row items-center gap-2 mb-3">
                    <View
                      className="bmh-auth-dot w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: 'rgba(52,211,153,0.8)' }}
                    />
                    <Text className="text-xs" style={{ color: MUTED_COLOR, fontFamily: 'Poppins_400Regular' }}>
                      Secure area
                    </Text>
                  </View>
                  <Text
                    className="text-2xl sm:text-3xl text-white tracking-tight"
                    style={{ fontFamily: 'Poppins_600SemiBold' }}
                  >
                    {isSignup ? 'Create account' : 'Sign in'}
                  </Text>
                  <Text className="text-sm mt-1.5" style={{ color: MUTED_COLOR, fontFamily: 'Poppins_400Regular' }}>
                    {isSignup
                      ? 'Sign up with your email to start your first project.'
                      : 'Use your email and password to continue.'}
                  </Text>
                </View>

                {/* Full name (signup) */}
                {isSignup ? (
                  <View className="mb-5">
                    <Text className="text-xs mb-1.5" style={{ color: LABEL_COLOR, fontFamily: 'Poppins_500Medium' }}>
                      Full name
                    </Text>
                    <View className="relative justify-center">
                      <View className="absolute left-3 z-10" pointerEvents="none">
                        <User size={16} color={MUTED_COLOR} strokeWidth={1.5} />
                      </View>
                      <TextInput
                        className="w-full rounded-lg text-sm"
                        style={{
                          backgroundColor: INPUT_BG,
                          color: '#f5f5f5',
                          borderWidth: 1,
                          borderColor: INPUT_RING,
                          paddingLeft: 40,
                          paddingRight: 16,
                          paddingVertical: 10,
                          fontFamily: 'Poppins_400Regular',
                          outlineStyle: 'none',
                        } as any}
                        placeholder="Your full name"
                        placeholderTextColor="#6b7280"
                        value={fullName}
                        onChangeText={(t) => { setFullName(t); clearError(); }}
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </View>
                  </View>
                ) : null}

                {/* Email */}
                <View className="mb-5">
                  <Text className="text-xs mb-1.5" style={{ color: LABEL_COLOR, fontFamily: 'Poppins_500Medium' }}>
                    Email
                  </Text>
                  <View className="relative justify-center">
                    <View className="absolute left-3 z-10" pointerEvents="none">
                      <Mail size={16} color={MUTED_COLOR} strokeWidth={1.5} />
                    </View>
                    <TextInput
                      className="w-full rounded-lg text-sm"
                      style={{
                        backgroundColor: INPUT_BG,
                        color: '#f5f5f5',
                        borderWidth: 1,
                        borderColor: INPUT_RING,
                        paddingLeft: 40,
                        paddingRight: 16,
                        paddingVertical: 10,
                        fontFamily: 'Poppins_400Regular',
                        outlineStyle: 'none',
                      } as any}
                      placeholder="you@example.com"
                      placeholderTextColor="#6b7280"
                      value={email}
                      onChangeText={(t) => { setEmail(t); clearError(); }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Password */}
                <View className="mb-5">
                  <View className="flex-row items-center justify-between mb-1.5">
                    <Text className="text-xs" style={{ color: LABEL_COLOR, fontFamily: 'Poppins_500Medium' }}>
                      Password
                    </Text>
                    {!isSignup ? (
                      <Pressable onPress={() => router.push('/forgot-password' as any)}>
                        <Text className="text-xs" style={{ color: MUTED_COLOR, fontFamily: 'Poppins_400Regular' }}>
                          Forgot?
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                  <View className="relative justify-center">
                    <View className="absolute left-3 z-10" pointerEvents="none">
                      <Lock size={16} color={MUTED_COLOR} strokeWidth={1.5} />
                    </View>
                    <TextInput
                      className="w-full rounded-lg text-sm"
                      style={{
                        backgroundColor: INPUT_BG,
                        color: '#f5f5f5',
                        borderWidth: 1,
                        borderColor: INPUT_RING,
                        paddingLeft: 40,
                        paddingRight: 44,
                        paddingVertical: 10,
                        fontFamily: 'Poppins_400Regular',
                        outlineStyle: 'none',
                      } as any}
                      placeholder="••••••••"
                      placeholderTextColor="#6b7280"
                      value={password}
                      onChangeText={(t) => { setPassword(t); clearError(); }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <Pressable
                      onPress={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 z-10"
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff size={16} color={MUTED_COLOR} strokeWidth={1.5} />
                      ) : (
                        <Eye size={16} color={MUTED_COLOR} strokeWidth={1.5} />
                      )}
                    </Pressable>
                  </View>
                </View>

                {/* Submit */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading}
                  className="bmh-auth-submit w-full rounded-lg flex-row items-center justify-center gap-2"
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    backgroundColor: '#3a3a3a',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      {isSignup ? (
                        <UserPlus size={16} color="#ffffff" strokeWidth={2} />
                      ) : (
                        <LogIn size={16} color="#ffffff" strokeWidth={2} />
                      )}
                      <Text className="text-sm text-white" style={{ fontFamily: 'Poppins_500Medium' }}>
                        {isSignup ? 'Create account' : 'Sign in'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {formError ? (
                  <Text
                    className="text-xs text-center mt-3"
                    style={{ color: '#f87171', fontFamily: 'Poppins_400Regular' }}
                  >
                    {formError}
                  </Text>
                ) : null}

                {/* Divider */}
                <View className="relative items-center justify-center my-5">
                  <View
                    className="absolute left-0 right-0 h-px"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  />
                  <Text
                    className="text-[10px] uppercase px-2"
                    style={{ color: FAINT_COLOR, letterSpacing: 1.5, backgroundColor: CARD_BG, fontFamily: 'Poppins_400Regular' }}
                  >
                    or
                  </Text>
                </View>

                {/* Mode switch */}
                <TouchableOpacity
                  onPress={toggleMode}
                  className="bmh-auth-secondary w-full rounded-lg flex-row items-center justify-center gap-2"
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    backgroundColor: 'rgba(38,38,38,0.6)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  {isSignup ? (
                    <LogIn size={16} color={LABEL_COLOR} strokeWidth={1.5} />
                  ) : (
                    <UserPlus size={16} color={LABEL_COLOR} strokeWidth={1.5} />
                  )}
                  <Text className="text-sm" style={{ color: LABEL_COLOR, fontFamily: 'Poppins_500Medium' }}>
                    {isSignup ? 'Sign in to an existing account' : 'Create a new account'}
                  </Text>
                </TouchableOpacity>

                {/* Footer */}
                <View className="mt-8 flex-row items-center justify-between flex-wrap gap-2">
                  <Text className="text-xs" style={{ color: FAINT_COLOR, fontFamily: 'Poppins_400Regular' }}>
                    {isSignup ? 'Already have an account? ' : "Don't have an account? "}
                    <Text
                      onPress={toggleMode}
                      style={{ color: LABEL_COLOR, fontFamily: 'Poppins_500Medium' }}
                    >
                      {isSignup ? 'Sign in' : 'Sign up'}
                    </Text>
                  </Text>
                  <View className="flex-row items-center gap-3">
                    <Pressable onPress={() => router.push('/terms-conditions' as any)}>
                      <Text className="text-xs" style={{ color: FAINT_COLOR, fontFamily: 'Poppins_400Regular' }}>
                        Terms
                      </Text>
                    </Pressable>
                    <Text className="text-xs" style={{ color: '#525252' }}>•</Text>
                    <Pressable onPress={() => router.push('/privacy-security' as any)}>
                      <Text className="text-xs" style={{ color: FAINT_COLOR, fontFamily: 'Poppins_400Regular' }}>
                        Privacy
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
