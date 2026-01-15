import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Modal, Platform, Pressable, Text, View, Alert } from "react-native";

export type AppAlertButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

type AppAlertContextValue = {
  showAlert: (title: string, message?: string, buttons?: AppAlertButton[]) => void;
};

const AppAlertContext = createContext<AppAlertContextValue | null>(null);

export function useAppAlert(): AppAlertContextValue {
  const ctx = useContext(AppAlertContext);
  if (!ctx) throw new Error("useAppAlert must be used within AppAlertProvider");
  return ctx;
}

export function AppAlertProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [buttons, setButtons] = useState<AppAlertButton[]>([{ text: "OK" }]);

  const close = useCallback(() => setVisible(false), []);

  const showAlert = useCallback(
    (t: string, m?: string, b?: AppAlertButton[]) => {
      if (Platform.OS !== "web") {
        // Native: use the platform alert
        // @ts-ignore Alert typings vary a bit depending on RN version
        Alert.alert(t, m, b as any);
        return;
      }

      // Web: show a branded modal
      setTitle(t);
      setMessage(m || "");
      setButtons(b && b.length > 0 ? b : [{ text: "OK" }]);
      setVisible(true);
    },
    [],
  );

  const value = useMemo(() => ({ showAlert }), [showAlert]);

  return (
    <AppAlertContext.Provider value={value}>
      {children}
      {Platform.OS === "web" && (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={close}>
          <View className="flex-1 justify-center items-center bg-black/60 px-6">
            <View className="w-full max-w-md bg-[#0A1628] rounded-3xl border border-blue-900 overflow-hidden">
              {/* Header */}
              <View className="px-6 pt-6 pb-4 border-b border-blue-900 bg-[#0A1628]">
                <Text className="text-white text-xl" style={{ fontFamily: "Poppins_700Bold" }}>
                  {title}
                </Text>
                {message ? (
                  <Text
                    className="text-gray-300 mt-3 leading-6"
                    style={{ fontFamily: "Poppins_400Regular" }}
                  >
                    {message}
                  </Text>
                ) : null}
              </View>

              {/* Actions */}
              <View className="px-6 py-5 flex-row justify-end" style={{ gap: 10 }}>
                {buttons.map((btn, idx) => {
                  const isDestructive = btn.style === "destructive";
                  const isCancel = btn.style === "cancel";
                  const bg = isDestructive ? "bg-red-600" : isCancel ? "bg-[#1E3A5F]" : "bg-blue-600";
                  const textColor = "text-white";
                  return (
                    <Pressable
                      key={`${btn.text}-${idx}`}
                      onPress={() => {
                        close();
                        btn.onPress?.();
                      }}
                      className={`${bg} rounded-full px-5 py-3`}
                    >
                      <Text className={`${textColor}`} style={{ fontFamily: "Poppins_700Bold" }}>
                        {btn.text}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </AppAlertContext.Provider>
  );
}

