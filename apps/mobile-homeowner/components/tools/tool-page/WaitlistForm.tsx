import { useId, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { api } from '@/lib/api';
import { trackWebEvent } from '@/lib/analytics';

type Status = 'idle' | 'submitting' | 'success' | 'duplicate' | 'error';

type Props = {
  productKey: string;
  toolTitle: string;
  sourcePath: string;
  submitLabel: string;
  /** Hero starts as email + button, then reveals the name field. */
  compact?: boolean;
  successDetail?: string;
  onDark?: boolean;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fieldStyle(invalid: boolean) {
  return {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: invalid ? '#DC2626' : '#E5E5E5',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: '#171717',
  } as const;
}

export default function WaitlistForm({
  productKey,
  toolTitle,
  sourcePath,
  submitLabel,
  compact = false,
  successDetail,
  onDark = false,
}: Props) {
  const emailId = useId();
  const nameId = useId();
  const emailErrorId = useId();
  const nameErrorId = useId();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [expanded, setExpanded] = useState(!compact);
  const [status, setStatus] = useState<Status>('idle');
  const [emailError, setEmailError] = useState('');
  const [nameError, setNameError] = useState('');
  const [formError, setFormError] = useState('');

  const labelColor = onDark ? '#FFFFFF' : '#171717';
  const hintColor = onDark ? 'rgba(255,255,255,0.72)' : '#525252';

  const validate = () => {
    const nextEmail = email.trim().toLowerCase();
    const nextName = fullName.trim();
    let valid = true;
    if (!EMAIL_PATTERN.test(nextEmail)) {
      setEmailError('Enter a valid email address.');
      valid = false;
    } else {
      setEmailError('');
    }
    if (nextName && (nextName.length < 2 || nextName.length > 80)) {
      setNameError('Use 2 to 80 characters.');
      valid = false;
    } else {
      setNameError('');
    }
    return valid ? { email: nextEmail, fullName: nextName } : null;
  };

  const onSubmit = async () => {
    if (compact && !expanded) {
      setExpanded(true);
      return;
    }
    const values = validate();
    if (!values) return;
    if (honeypot.trim()) {
      setStatus('success');
      return;
    }
    setStatus('submitting');
    setFormError('');
    try {
      const result = await api.post('/waitlist/join', {
        productKey,
        email: values.email,
        fullName: values.fullName || undefined,
        sourcePath,
      });
      const already = Boolean(result?.alreadyJoined);
      setStatus(already ? 'duplicate' : 'success');
      trackWebEvent('waitlist_join', { tool_slug: productKey, already_joined: already });
    } catch {
      setStatus('error');
      setFormError('Something went wrong, please try again.');
    }
  };

  if (status === 'success' || status === 'duplicate') {
    const headline =
      status === 'duplicate'
        ? `You're already on the list for ${toolTitle}.`
        : `You're on the list for ${toolTitle}`;
    return (
      <View
        accessibilityRole="text"
        {...(Platform.OS === 'web' ? ({ role: 'status' } as object) : { accessibilityLiveRegion: 'polite' as const })}
        style={{
          borderRadius: 16,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#E5E5E5',
          padding: 16,
          gap: 8,
        }}
      >
        <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#166534' }}>✓ {headline}</Text>
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 22, color: '#525252' }}>
          {successDetail ||
            'We will let you know when early access opens. In the meantime, you can use Price Checker or explore other BuildMyHouse tools.'}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
          <Link href={'/tools/price-checker' as never} asChild>
            <Pressable style={linkButton(true)}>
              <Text style={linkLabel(true)}>Try Price Checker</Text>
            </Pressable>
          </Link>
          <Link href={'/tools' as never} asChild>
            <Pressable style={linkButton(false)}>
              <Text style={linkLabel(false)}>See all tools</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    );
  }

  const fields = (
    <View style={{ gap: 10 }}>
      <View style={{ position: 'absolute', left: -9999, height: 0, overflow: 'hidden' }} pointerEvents="none">
        <TextInput
          value={honeypot}
          onChangeText={setHoneypot}
          accessibilityElementsHidden
          importantForAccessibility="no"
          tabIndex={-1}
        />
      </View>
      {expanded ? (
        <View>
          <Text nativeID={nameId} style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, color: labelColor, marginBottom: 6 }}>
            Full name
          </Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            onBlur={() => {
              const next = fullName.trim();
              if (next && (next.length < 2 || next.length > 80)) setNameError('Use 2 to 80 characters.');
              else setNameError('');
            }}
            placeholder="Your name"
            placeholderTextColor="#A3A3A3"
            autoCapitalize="words"
            accessibilityLabel="Full name"
            aria-describedby={nameError ? nameErrorId : undefined}
            style={fieldStyle(Boolean(nameError))}
          />
          {nameError ? (
            <Text nativeID={nameErrorId} style={errorText}>
              {nameError}
            </Text>
          ) : null}
        </View>
      ) : null}
      <View>
        <Text nativeID={emailId} style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, color: labelColor, marginBottom: 6 }}>
          Email
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          onFocus={() => {
            if (compact) setExpanded(true);
          }}
          onBlur={() => {
            const next = email.trim().toLowerCase();
            if (next && !EMAIL_PATTERN.test(next)) setEmailError('Enter a valid email address.');
            else setEmailError('');
          }}
          placeholder="you@email.com"
          placeholderTextColor="#A3A3A3"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Email"
          aria-describedby={emailError ? emailErrorId : undefined}
          style={fieldStyle(Boolean(emailError))}
          editable={status !== 'submitting'}
        />
        {emailError ? (
          <Text nativeID={emailErrorId} style={errorText}>
            {emailError}
          </Text>
        ) : null}
      </View>
      {formError ? <Text style={errorText}>{formError}</Text> : null}
      <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 18, color: hintColor }}>
        We will email you about this tool. See our{' '}
        <Link href={'/privacy-security' as never} style={{ color: onDark ? '#FFFFFF' : '#171717', textDecorationLine: 'underline' }}>
          privacy policy
        </Link>
        .
      </Text>
      <Pressable
        onPress={() => void onSubmit()}
        disabled={status === 'submitting'}
        accessibilityRole="button"
        style={{
          minHeight: 44,
          borderRadius: 10,
          backgroundColor: '#000000',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 16,
          opacity: status === 'submitting' ? 0.7 : 1,
        }}
      >
        {status === 'submitting' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ActivityIndicator color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold', fontSize: 15 }}>Joining…</Text>
          </View>
        ) : (
          <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold', fontSize: 15 }}>{submitLabel}</Text>
        )}
      </Pressable>
    </View>
  );

  return <View>{fields}</View>;
}

const errorText = {
  fontFamily: 'Poppins_400Regular',
  fontSize: 13,
  color: '#DC2626',
  marginTop: 6,
} as const;

function linkButton(filled: boolean) {
  return {
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: filled ? '#000000' : '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
  };
}

function linkLabel(filled: boolean) {
  return {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: filled ? '#FFFFFF' : '#000000',
  };
}
