import { View, Text, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, RotateCcw } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  loadNotificationSettings,
  resetNotificationSettings,
  saveNotificationSettings,
  type NotificationSettings,
} from "@/lib/notificationSettings";

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="mb-3">
      <Text className="text-lg text-black" style={{ fontFamily: "Poppins_700Bold" }}>
        {title}
      </Text>
      {!!subtitle && (
        <Text className="text-gray-500 text-sm mt-1" style={{ fontFamily: "Poppins_400Regular" }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

function ToggleRow(props: {
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View className={`bg-white rounded-2xl p-4 border border-gray-200 mb-3 ${props.disabled ? "opacity-50" : ""}`}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-black text-base" style={{ fontFamily: "Poppins_600SemiBold" }}>
            {props.title}
          </Text>
          {!!props.description && (
            <Text className="text-gray-500 text-sm mt-1" style={{ fontFamily: "Poppins_400Regular" }}>
              {props.description}
            </Text>
          )}
        </View>
        <Switch value={props.value} onValueChange={props.onValueChange} disabled={props.disabled} />
      </View>
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const loaded = await loadNotificationSettings();
        if (mounted) setSettings(loaded);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const disabledAll = !settings.allEnabled;

  const setAndPersist = async (next: NotificationSettings) => {
    setSettings(next);
    try {
      await saveNotificationSettings(next);
    } catch {
      // If storage fails, keep UI state but inform user.
      Alert.alert("Could not save", "Your notification settings could not be saved. Please try again.");
    }
  };

  const anyChannelEnabled = useMemo(() => {
    return settings.channels.push || settings.channels.email || settings.channels.sms;
  }, [settings.channels]);

  const handleReset = async () => {
    try {
      const defaults = await resetNotificationSettings();
      setSettings(defaults);
      Alert.alert("Reset", "Notification settings have been reset to defaults.");
    } catch {
      Alert.alert("Could not reset", "Please try again.");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#000" />
        <Text className="text-gray-500 mt-3" style={{ fontFamily: "Poppins_400Regular" }}>
          Loading settings...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-16 px-6 pb-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.push("/profile"))} className="mr-4">
            <ArrowLeft size={28} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
          <Text className="text-2xl text-black" style={{ fontFamily: "Poppins_700Bold" }}>
            Notification Settings
          </Text>
        </View>
        <TouchableOpacity onPress={handleReset} className="flex-row items-center">
          <RotateCcw size={16} color="#000000" strokeWidth={2} />
          <Text className="text-black ml-2" style={{ fontFamily: "Poppins_600SemiBold" }}>
            Reset
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionTitle title="General" subtitle="Control how you receive updates from BuildMyHouse." />
        <ToggleRow
          title="All notifications"
          description="Turn off to pause all notifications."
          value={settings.allEnabled}
          onValueChange={(v) => setAndPersist({ ...settings, allEnabled: v })}
        />

        <SectionTitle title="Delivery channels" subtitle="Choose where notifications are delivered." />
        <ToggleRow
          title="Push notifications"
          description="Recommended for important project updates."
          value={settings.channels.push}
          disabled={disabledAll}
          onValueChange={(v) => setAndPersist({ ...settings, channels: { ...settings.channels, push: v } })}
        />
        <ToggleRow
          title="Email notifications"
          description="Useful for receipts and longer updates."
          value={settings.channels.email}
          disabled={disabledAll}
          onValueChange={(v) => setAndPersist({ ...settings, channels: { ...settings.channels, email: v } })}
        />
        <ToggleRow
          title="SMS/WhatsApp notifications"
          description="For critical alerts (can include carrier charges)."
          value={settings.channels.sms}
          disabled={disabledAll}
          onValueChange={(v) => setAndPersist({ ...settings, channels: { ...settings.channels, sms: v } })}
        />
        {!disabledAll && !anyChannelEnabled && (
          <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <Text className="text-amber-800 text-sm" style={{ fontFamily: "Poppins_500Medium" }}>
              Tip: Enable at least one channel so you don’t miss important updates.
            </Text>
          </View>
        )}

        <SectionTitle title="Account & security" />
        <ToggleRow
          title="Login alerts"
          description="New device or unusual login activity."
          value={settings.account.loginAlerts}
          disabled={disabledAll}
          onValueChange={(v) => setAndPersist({ ...settings, account: { ...settings.account, loginAlerts: v } })}
        />
        <ToggleRow
          title="Security changes"
          description="Password/email/phone changes."
          value={settings.account.securityChanges}
          disabled={disabledAll}
          onValueChange={(v) => setAndPersist({ ...settings, account: { ...settings.account, securityChanges: v } })}
        />
        <ToggleRow
          title="Verification status"
          description="Verification required, approved, or rejected."
          value={settings.account.verification}
          disabled={disabledAll}
          onValueChange={(v) => setAndPersist({ ...settings, account: { ...settings.account, verification: v } })}
        />

        <SectionTitle title="Projects" />
        <ToggleRow
          title="Project status updates"
          description="Active, paused, completed, cancelled."
          value={settings.projects.projectStatus}
          disabled={disabledAll}
          onValueChange={(v) => setAndPersist({ ...settings, projects: { ...settings.projects, projectStatus: v } })}
        />
        <ToggleRow
          title="GC assignment"
          description="GC assigned or changed."
          value={settings.projects.gcAssignment}
          disabled={disabledAll}
          onValueChange={(v) => setAndPersist({ ...settings, projects: { ...settings.projects, gcAssignment: v } })}
        />
        <ToggleRow
          title="Stage updates"
          description="Stage started, completed, or blocked."
          value={settings.projects.stageUpdates}
          disabled={disabledAll}
          onValueChange={(v) => setAndPersist({ ...settings, projects: { ...settings.projects, stageUpdates: v } })}
        />
        <ToggleRow
          title="Milestones"
          description="New milestone or milestone completed."
          value={settings.projects.milestones}
          disabled={disabledAll}
          onValueChange={(v) => setAndPersist({ ...settings, projects: { ...settings.projects, milestones: v } })}
        />
        <ToggleRow
          title="Schedule changes"
          description="Start date, due date, or timeline changes."
          value={settings.projects.scheduleChanges}
          disabled={disabledAll}
          onValueChange={(v) => setAndPersist({ ...settings, projects: { ...settings.projects, scheduleChanges: v } })}
        />
        <ToggleRow
          title="Approvals needed"
          description="When your review or approval is required."
          value={settings.projects.approvalsNeeded}
          disabled={disabledAll}
          onValueChange={(v) => setAndPersist({ ...settings, projects: { ...settings.projects, approvalsNeeded: v } })}
        />

        <SectionTitle title="Payments & billing" />
        <ToggleRow
          title="Payment required"
          description="Payment due or pending payment reminders."
          value={settings.payments.paymentRequired}
          disabled={disabledAll}
          onValueChange={(v) => setAndPersist({ ...settings, payments: { ...settings.payments, paymentRequired: v } })}
        />
        <ToggleRow
          title="Payment successful"
          value={settings.payments.paymentSuccess}
          disabled={disabledAll}
          onValueChange={(v) => setAndPersist({ ...settings, payments: { ...settings.payments, paymentSuccess: v } })}
        />
        <ToggleRow
          title="Payment failed"
          value={settings.payments.paymentFailed}
          disabled={disabledAll}
          onValueChange={(v) => setAndPersist({ ...settings, payments: { ...settings.payments, paymentFailed: v } })}
        />
        <ToggleRow
          title="Refunds"
          value={settings.payments.refunds}
          disabled={disabledAll}
          onValueChange={(v) => setAndPersist({ ...settings, payments: { ...settings.payments, refunds: v } })}
        />
        <ToggleRow
          title="Receipts & invoices"
          value={settings.payments.receipts}
          disabled={disabledAll}
          onValueChange={(v) => setAndPersist({ ...settings, payments: { ...settings.payments, receipts: v } })}
        />

        <SectionTitle title="Files & documents" />
        <ToggleRow
          title="New file uploaded"
          description="Plans, permits, photos, or other files."
          value={settings.files.fileUploaded}
          disabled={disabledAll}
          onValueChange={(v) => setAndPersist({ ...settings, files: { ...settings.files, fileUploaded: v } })}
        />
        <ToggleRow
          title="Action needed on documents"
          description="Approval required or re-upload requested."
          value={settings.files.documentActionNeeded}
          disabled={disabledAll}
          onValueChange={(v) => setAndPersist({ ...settings, files: { ...settings.files, documentActionNeeded: v } })}
        />
        <ToggleRow
          title="Document status"
          description="Approved or rejected."
          value={settings.files.documentStatus}
          disabled={disabledAll}
          onValueChange={(v) => setAndPersist({ ...settings, files: { ...settings.files, documentStatus: v } })}
        />

        <SectionTitle title="Messages" />
        <ToggleRow
          title="New chat messages"
          value={settings.messages.newMessages}
          disabled={disabledAll}
          onValueChange={(v) => setAndPersist({ ...settings, messages: { ...settings.messages, newMessages: v } })}
        />
        <ToggleRow
          title="GC updates"
          description="Project update posts from your GC."
          value={settings.messages.gcUpdates}
          disabled={disabledAll}
          onValueChange={(v) => setAndPersist({ ...settings, messages: { ...settings.messages, gcUpdates: v } })}
        />

        <SectionTitle title="Product & marketing" subtitle="Optional updates about the product." />
        <ToggleRow
          title="Promotions & offers"
          value={settings.product.promos}
          disabled={disabledAll}
          onValueChange={(v) => setAndPersist({ ...settings, product: { ...settings.product, promos: v } })}
        />
        <ToggleRow
          title="Product updates"
          value={settings.product.productUpdates}
          disabled={disabledAll}
          onValueChange={(v) => setAndPersist({ ...settings, product: { ...settings.product, productUpdates: v } })}
        />
        <ToggleRow
          title="Tips & reminders"
          value={settings.product.tips}
          disabled={disabledAll}
          onValueChange={(v) => setAndPersist({ ...settings, product: { ...settings.product, tips: v } })}
        />
      </ScrollView>
    </View>
  );
}

