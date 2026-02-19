// Project hooks
export { useProject } from './useProject';
export { 
  useRecommendedGCs, 
  useSendGCRequests, 
  useCheckGCAcceptance, 
  useActivateProject,
  useSaveProjectForLater,
  usePendingProjects,
  usePausedProjects,
  useActiveProjects,
  useDeletePendingProject,
  useCreateProjectFromDesign,
} from './useProjects';

// Design hooks
export { useDesigns, useDesign } from './useDesigns';

// Houses for sale
export { useHousesForSale, useHouseForSale } from './useHousesForSale';
export { useScheduleHouseViewing } from './useHouseViewing';
export { useLandsForSale, useLandForSale } from './useLandsForSale';
export { useScheduleLandViewing } from './useLandViewing';
export { useHomePurchases, useLandPurchases } from './usePropertyPurchases';

// User hooks
export { useCurrentUser } from './useCurrentUser';
export { useUpdateCurrentUser } from './useUpdateCurrentUser';
export { useUploadProfilePicture } from './useUploadProfilePicture';

// Marketplace hooks
// NOTE: Marketplace hooks were referenced here but the module (`./useMarketplace`) does not exist.
// Keeping this index file free of missing exports prevents Metro from crashing on app load.

// GC (General Contractor) hooks
export {
  usePendingRequests,
  useAcceptRequest,
  useRejectRequest,
} from './useGC';

// Plan upload hooks
export {
  useUploadPlan,
  useProjectAnalysis,
} from './usePlan';

// Payment hooks
export {
  useCreatePaymentIntent,
  useCreateSetupIntent,
  useCreateSetupCheckoutSession,
  usePaymentMethods,
  useSetDefaultPaymentMethod,
  useUserPayments,
  useUserPaymentsStructured,
} from './usePayment';

export { useDeclareManualPayment } from './useManualPayment';


