import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { setTypedReferralCode, SHOW_REFERRAL_CODE_FIELD } from '@/lib/referral-code';

export function ReferralCodeField() {
  const [value, setValue] = useState('');
  if (!SHOW_REFERRAL_CODE_FIELD) return null;
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontFamily: 'Poppins_500Medium', marginBottom: 6 }}>Have a referral code?</Text>
      <TextInput
        value={value}
        autoCapitalize="characters"
        onChangeText={(next) => {
          setValue(next);
          setTypedReferralCode(next);
        }}
        placeholder="Enter a code"
        style={{ borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 12, padding: 12, fontFamily: 'Poppins_400Regular' }}
      />
    </View>
  );
}
