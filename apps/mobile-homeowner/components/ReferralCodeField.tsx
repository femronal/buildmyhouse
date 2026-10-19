import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { loadReferralProgram, referralProgram, setTypedReferralCode } from '@/lib/referral-code';

export function ReferralCodeField() {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState('');

  useEffect(() => {
    void loadReferralProgram().then((settings) => setVisible(settings.allowHomeownerTypedCode));
  }, []);

  if (!visible && !referralProgram().allowHomeownerTypedCode) return null;
  if (!visible) return null;
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
