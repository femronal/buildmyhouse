import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { PaperPlaneTilt } from 'phosphor-react-native';
import { pc } from './theme';

type Props = {
  placeholder: string;
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onSubmit: (value: string) => void;
  value?: string;
  onChangeText?: (value: string) => void;
  multiline?: boolean;
  /** Narrow phones — smaller type + tighter hit targets that still stay ≥40px. */
  compact?: boolean;
};

/**
 * Search / answer field. Critical for thin mobiles: the TextInput must be allowed
 * to shrink (`minWidth: 0` + `width: 0` + `flex: 1`) so the send button never
 * overflows off-screen.
 */
export function PriceCheckerComposer({
  placeholder,
  label,
  disabled,
  loading,
  onSubmit,
  value: controlled,
  onChangeText,
  multiline,
  compact = false,
}: Props) {
  const [uncontrolled, setUncontrolled] = useState('');
  const value = controlled ?? uncontrolled;
  const setValue = onChangeText ?? setUncontrolled;

  const send = () => {
    if (disabled || loading) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    if (controlled === undefined) setUncontrolled('');
  };

  const btn = compact ? 40 : 44;
  const inputMinH = compact ? 40 : 44;
  const inputMaxH = multiline ? (compact ? 88 : 120) : inputMinH;

  return (
    <View style={{ width: '100%', maxWidth: '100%', marginBottom: compact ? 10 : 16 }}>
      <Text style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>{label}</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: compact ? 6 : 8,
          borderRadius: compact ? 14 : 16,
          borderWidth: 1,
          paddingHorizontal: compact ? 8 : 12,
          paddingVertical: compact ? 5 : 8,
          backgroundColor: pc.green,
          borderColor: 'rgba(255,255,255,0.25)',
          shadowColor: pc.green,
          shadowOpacity: 0.22,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
        }}
      >
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.65)"
          editable={!disabled && !loading}
          multiline={Boolean(multiline)}
          onSubmitEditing={send}
          blurOnSubmit={!multiline}
          returnKeyType="send"
          style={{
            flexGrow: 1,
            flexShrink: 1,
            flexBasis: 0,
            minWidth: 0,
            width: 0,
            minHeight: inputMinH,
            maxHeight: inputMaxH,
            paddingHorizontal: 4,
            paddingVertical: compact ? 8 : 10,
            fontSize: compact ? 15 : 16,
            lineHeight: compact ? 20 : 22,
            color: '#ffffff',
            fontFamily: 'Poppins_500Medium',
          }}
        />
        <Pressable
          onPress={send}
          disabled={disabled || loading || !value.trim()}
          accessibilityRole="button"
          accessibilityLabel="Send answer"
          style={{
            width: btn,
            height: btn,
            flexGrow: 0,
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.18)',
            opacity: disabled || loading || !value.trim() ? 0.5 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <PaperPlaneTilt size={compact ? 16 : 18} color="#fff" weight="fill" />
          )}
        </Pressable>
      </View>
    </View>
  );
}
