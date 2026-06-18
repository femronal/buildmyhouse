import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import {
  resolveAuthContinueModal,
  subscribeAuthContinueModal,
  type AuthContinueModalState,
} from '@/lib/auth-continue-modal-store';

const EMPTY: AuthContinueModalState = { visible: false, title: '', message: '' };

export default function AuthContinueModal() {
  const [modal, setModal] = useState<AuthContinueModalState>(EMPTY);

  useEffect(() => {
    return subscribeAuthContinueModal(setModal);
  }, []);

  if (!modal.visible) return null;

  const dismiss = (confirmed: boolean) => resolveAuthContinueModal(confirmed);

  if (Platform.OS === 'web') {
    return (
      <div
        className="bmh-auth-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bmh-auth-modal-title"
        onClick={() => dismiss(false)}
      >
        <div className="bmh-auth-modal-card" onClick={(event) => event.stopPropagation()}>
          <p className="bmh-auth-modal-eyebrow">BuildMyHouse</p>
          <h2 id="bmh-auth-modal-title" className="bmh-auth-modal-title">
            {modal.title}
          </h2>
          <p className="bmh-auth-modal-message">{modal.message}</p>
          <div className="bmh-auth-modal-actions">
            <button type="button" className="bmh-auth-modal-secondary" onClick={() => dismiss(false)}>
              Not now
            </button>
            <button type="button" className="bmh-auth-modal-primary" onClick={() => dismiss(true)}>
              Sign up / Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => dismiss(false)}>
      <Pressable className="flex-1 justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.72)' }} onPress={() => dismiss(false)}>
        <Pressable
          className="rounded-3xl border px-6 py-7"
          style={{ backgroundColor: '#0a0a0a', borderColor: 'rgba(255,255,255,0.12)' }}
          onPress={(event) => event.stopPropagation()}
        >
          <Text className="text-[11px] uppercase tracking-[0.18em] text-white/45 mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            BuildMyHouse
          </Text>
          <Text className="text-2xl text-white mb-3" style={{ fontFamily: 'Poppins_700Bold' }}>
            {modal.title}
          </Text>
          <Text className="text-sm leading-6 text-white/70 mb-8" style={{ fontFamily: 'Poppins_400Regular' }}>
            {modal.message}
          </Text>
          <View className="flex-row gap-3">
            <Pressable className="flex-1 rounded-full border border-white/15 py-3.5 items-center" onPress={() => dismiss(false)}>
              <Text className="text-white text-sm" style={{ fontFamily: 'Poppins_600SemiBold' }}>
                Not now
              </Text>
            </Pressable>
            <Pressable className="flex-1 rounded-full py-3.5 items-center" style={{ backgroundColor: '#22c55e' }} onPress={() => dismiss(true)}>
              <Text className="text-[#060706] text-sm" style={{ fontFamily: 'Poppins_700Bold' }}>
                Sign up / Sign in
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
