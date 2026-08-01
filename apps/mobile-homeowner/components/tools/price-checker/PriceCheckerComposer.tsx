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
};

export function PriceCheckerComposer({
  placeholder,
  label,
  disabled,
  loading,
  onSubmit,
  value: controlled,
  onChangeText,
  multiline,
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

  return (
    <View className="mb-4 w-full">
      <Text className="mb-2 sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
        {label}
      </Text>
      <View
        className="flex-row items-end gap-2 rounded-2xl border px-3 py-2"
        style={{
          backgroundColor: pc.green,
          borderColor: 'rgba(255,255,255,0.25)',
          shadowColor: pc.green,
          shadowOpacity: 0.25,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
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
          className="min-h-[44px] flex-1 px-1 py-2 text-base text-white"
          style={{ fontFamily: 'Poppins_500Medium', maxHeight: multiline ? 120 : 48 }}
        />
        <Pressable
          onPress={send}
          disabled={disabled || loading || !value.trim()}
          accessibilityRole="button"
          accessibilityLabel="Send answer"
          className="h-11 w-11 items-center justify-center rounded-xl"
          style={{
            backgroundColor: 'rgba(255,255,255,0.18)',
            opacity: disabled || loading || !value.trim() ? 0.5 : 1,
            minWidth: 44,
            minHeight: 44,
          }}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <PaperPlaneTilt size={18} color="#fff" weight="fill" />}
        </Pressable>
      </View>
    </View>
  );
}
