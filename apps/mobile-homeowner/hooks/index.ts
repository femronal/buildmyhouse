// Project hooks
export { useProjects } from './useProjects';
export { useProject } from './useProject';
export { useCreateProject } from './useCreateProject';
export { useUpdateProject } from './useUpdateProject';
export { useDeleteProject } from './useDeleteProject';
export { 
  useRecommendedGCs, 
  useSendGCRequests, 
  useCheckGCAcceptance, 
  useActivateProject 
} from './useProjects';

// User hooks
export { useCurrentUser } from './useCurrentUser';

// Marketplace hooks
export {
  useMaterials,
  useMaterial,
  useContractors,
  useContractor,
  useSearch,
  useSearchSuggestions,
  usePopularItems,
  useCreateReview,
  useMaterialReviews,
  useContractorReviews,
} from './useMarketplace';

// Vendor hooks
export {
  useMyMaterials,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
} from './useVendor';

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
export { useCreatePaymentIntent } from './usePayment';

