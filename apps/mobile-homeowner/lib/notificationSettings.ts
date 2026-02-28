import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotificationSettings = {
  allEnabled: boolean;
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  account: {
    loginAlerts: boolean;
    securityChanges: boolean;
    verification: boolean;
  };
  projects: {
    projectStatus: boolean;
    gcAssignment: boolean;
    stageUpdates: boolean;
    milestones: boolean;
    scheduleChanges: boolean;
    approvalsNeeded: boolean;
    disputeUpdates: boolean;
  };
  payments: {
    paymentRequired: boolean;
    paymentSuccess: boolean;
    paymentFailed: boolean;
    manualPaymentConfirmed: boolean;
    refunds: boolean;
    receipts: boolean;
  };
  files: {
    fileUploaded: boolean;
    documentActionNeeded: boolean;
    documentStatus: boolean;
  };
  messages: {
    newMessages: boolean;
    gcUpdates: boolean;
  };
  product: {
    promos: boolean;
    productUpdates: boolean;
    tips: boolean;
  };
  propertyViewing: {
    houseViewingOutcome: boolean;
    landViewingOutcome: boolean;
    rentalViewingOutcome: boolean;
  };
};

const STORAGE_KEY = 'notificationSettings:v2';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  allEnabled: true,
  channels: {
    push: true,
    email: true,
    sms: false,
  },
  account: {
    loginAlerts: true,
    securityChanges: true,
    verification: true,
  },
  projects: {
    projectStatus: true,
    gcAssignment: true,
    stageUpdates: true,
    milestones: true,
    scheduleChanges: true,
    approvalsNeeded: true,
    disputeUpdates: true,
  },
  payments: {
    paymentRequired: true,
    paymentSuccess: true,
    paymentFailed: true,
    manualPaymentConfirmed: true,
    refunds: true,
    receipts: true,
  },
  files: {
    fileUploaded: true,
    documentActionNeeded: true,
    documentStatus: true,
  },
  messages: {
    newMessages: true,
    gcUpdates: true,
  },
  product: {
    promos: false,
    productUpdates: true,
    tips: true,
  },
  propertyViewing: {
    houseViewingOutcome: true,
    landViewingOutcome: true,
    rentalViewingOutcome: true,
  },
};

export async function loadNotificationSettings(): Promise<NotificationSettings> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;
  try {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export async function resetNotificationSettings(): Promise<NotificationSettings> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATION_SETTINGS));
  return DEFAULT_NOTIFICATION_SETTINGS;
}

