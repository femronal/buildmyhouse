'use client';

import { useRef, useState } from 'react';
import { Clock3, FileUp, Mail, MapPin, Pencil, Phone, Plus, Trash2, User, X } from 'lucide-react';
import { api } from '@/lib/api';
import { getBackendAssetUrl } from '@/lib/image';
import { useLands, type CreateLandPayload, type LandForSale, type UpdateLandPayload } from '@/hooks/useLands';
import { useLandViewingInterests } from '@/hooks/useLandViewingInterests';
import {
  BUILD_OPPORTUNITY_CATEGORY_OPTIONS,
  BUILD_OPPORTUNITY_TYPE_OPTIONS,
  type BuildOpportunityCategoryKey,
} from '@/lib/build-opportunity-taxonomy';
import { buildLandPayloadFields } from '@/lib/opportunity-listing-payload';
import { OpportunityListingModal } from '@/components/opportunity/OpportunityListingModal';

export default function LandPage() {
  const { lands, isLoading, createLand, isCreating, deleteLand, updateLand, isUpdating, refetch } = useLands();
  const { interests, markAllRead, updateOutcome } = useLandViewingInterests();
  const [selectedId, setSelectedId] = useState<string | null>(lands[0]?.id ?? null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteLandId, setPendingDeleteLandId] = useState<string | null>(null);
  const [interestLandId, setInterestLandId] = useState<string | null>(null);
  const [pendingPurchaseInterestId, setPendingPurchaseInterestId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    opportunityCategory: 'residential' as BuildOpportunityCategoryKey,
    opportunityType: '',
    opportunityTypeCustom: '',
    location: '',
    price: '',
    sizeSqm: '',
    titleDocument: '',
    zoningType: '',
    topography: '',
    roadAccess: '',
    ownershipType: '',
    documents: '',
    nearbyLandmarks: '',
    restrictions: '',
    contactName: '',
    contactPhone: '',
  });
  const [images, setImages] = useState<{ file?: File; url?: string; label: string; preview: string }[]>([]);

  const getTypeOptions = (category: BuildOpportunityCategoryKey) =>
    BUILD_OPPORTUNITY_TYPE_OPTIONS[category] ?? [];

  const validateOpportunityType = () => {
    if (!form.opportunityType) {
      setUploadError('Please select a specific filter for this build category');
      return false;
    }
    if (form.opportunityType === '__custom__' && !form.opportunityTypeCustom.trim()) {
      setUploadError('Please enter a custom filter name');
      return false;
    }
    return true;
  };

  const selected = lands.find((l) => l.id === selectedId) ?? lands[0];
  const selectedInterestLand = lands.find((l) => l.id === interestLandId) ?? null;
  const pendingDeleteLand = lands.find((l) => l.id === pendingDeleteLandId) ?? null;

  const primaryImage = (land: typeof selected) =>
    land?.images?.[0]?.url ? getBackendAssetUrl(land.images[0].url) : null;

  const getLandInterests = (landId: string) =>
    interests.filter((interest) => interest.landForSale.id === landId);

  const getUnreadCount = (landId: string) =>
    getLandInterests(landId).filter((interest) => !interest.isRead).length;

  const selectedLandInterests = selectedInterestLand
    ? getLandInterests(selectedInterestLand.id)
    : [];
  const pendingPurchaseInterest =
    selectedLandInterests.find((interest) => interest.id === pendingPurchaseInterestId) ?? null;

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      opportunityCategory: 'residential',
      opportunityType: '',
      opportunityTypeCustom: '',
      location: '',
      price: '',
      sizeSqm: '',
      titleDocument: '',
      zoningType: '',
      topography: '',
      roadAccess: '',
      ownershipType: '',
      documents: '',
      nearbyLandmarks: '',
      restrictions: '',
      contactName: '',
      contactPhone: '',
    });
  };

  const resetImages = () => {
    setImages((prev) => {
      prev.forEach((img) => {
        if (img.file) URL.revokeObjectURL(img.preview);
      });
      return [];
    });
  };

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const nextImages = files.map((file) => ({
      file,
      label: file.name.replace(/\.[^/.]+$/, '') || 'Image',
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...nextImages]);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const next = [...prev];
      if (next[index].file) URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  const startEditLand = (land: LandForSale) => {
    const category = (land.opportunityCategory || 'residential') as BuildOpportunityCategoryKey;
    const categoryOptions = getTypeOptions(category);
    const matchedOption = categoryOptions.find((option) => option.value === land.opportunityType);
    const usingCustom = !!land.opportunityType && !matchedOption;
    setEditingId(land.id);
    setForm({
      name: land.name,
      description: land.description || '',
      opportunityCategory: category,
      opportunityType: usingCustom ? '__custom__' : (land.opportunityType || ''),
      opportunityTypeCustom: usingCustom ? String(land.opportunityType) : '',
      location: land.location,
      price: String(land.price ?? ''),
      sizeSqm: String(land.sizeSqm ?? ''),
      titleDocument: land.titleDocument || '',
      zoningType: land.zoningType || '',
      topography: land.topography || '',
      roadAccess: land.roadAccess || '',
      ownershipType: land.ownershipType || '',
      documents: (land.documents || []).join(', '),
      nearbyLandmarks: (land.nearbyLandmarks || []).join(', '),
      restrictions: (land.restrictions || []).join(', '),
      contactName: land.contactName || '',
      contactPhone: land.contactPhone || '',
    });
    resetImages();
    setImages(
      (land.images || []).map((img) => ({
        url: img.url,
        label: img.label || 'Image',
        preview: getBackendAssetUrl(img.url) || img.url,
      })),
    );
    setShowEditModal(true);
  };

  const handleDeleteLand = async (landId: string) => {
    try {
      setDeletingId(landId);
      await deleteLand(landId);
      if (selectedId === landId) {
        const fallback = lands.find((l) => l.id !== landId);
        setSelectedId(fallback?.id ?? null);
      }
      await refetch();
    } catch (err: any) {
      window.alert(err?.message || 'Failed to delete land');
    } finally {
      setDeletingId(null);
    }
  };

  const openLandInterests = async (landId: string) => {
    setInterestLandId(landId);
    if (getUnreadCount(landId) > 0) {
      await markAllRead();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    if (!validateOpportunityType()) return;
    if (images.length === 0) {
      setUploadError('Please add at least one photo');
      return;
    }
    try {
      const uploadedImages: { url: string; label: string; order: number }[] = [];
      for (let i = 0; i < images.length; i++) {
        const imageFile = images[i].file;
        if (!imageFile) {
          throw new Error('Please re-add all selected photos before uploading');
        }
        const { url } = await api.uploadFile(imageFile);
        uploadedImages.push({
          url,
          label: images[i].label || `Image ${i + 1}`,
          order: i,
        });
      }

      const payload: CreateLandPayload = {
        ...buildLandPayloadFields(form),
        images: uploadedImages,
      };

      await createLand(payload);
      await refetch();
      setShowUploadModal(false);
      resetForm();
      resetImages();
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setUploadError(null);
    if (!validateOpportunityType()) return;
    if (images.length === 0) {
      setUploadError('Please keep at least one photo');
      return;
    }
    try {
      const uploadedImages: { url: string; label: string; order: number }[] = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        let url = img.url || '';
        if (img.file) {
          const uploaded = await api.uploadFile(img.file);
          url = uploaded.url;
        }
        uploadedImages.push({
          url,
          label: img.label || `Image ${i + 1}`,
          order: i,
        });
      }
      const payload: UpdateLandPayload = {
        ...buildLandPayloadFields(form),
        images: uploadedImages,
      };

      await updateLand({ id: editingId, payload });
      await refetch();
      setShowEditModal(false);
      setEditingId(null);
      resetForm();
      resetImages();
    } catch (err: any) {
      setUploadError(err?.message || 'Update failed');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-poppins">Land</h1>
          <p className="text-gray-500 mt-1">Upload verified land and manage viewing requests</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm flex items-center gap-2"
        >
          <FileUp className="w-4 h-4" />
          Upload land
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Lands for sale</h2>
            <span className="text-xs text-gray-400">{lands.length} total</span>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : lands.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No lands listed yet.</div>
          ) : (
            <div className="divide-y">
              {lands.map((land) => (
                <div key={land.id} className="relative">
                  <button
                    onClick={() => setSelectedId(land.id)}
                    className={`w-full text-left p-4 pr-32 hover:bg-gray-50 flex gap-3 ${
                      selectedId === land.id ? 'bg-gray-50' : ''
                    }`}
                  >
                    {primaryImage(land) && (
                      <img
                        src={primaryImage(land)!}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {land.name}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{land.location}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {land.opportunityCategory ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            {land.opportunityCategory.replace(/_/g, ' ')}
                          </span>
                        ) : null}
                        {land.opportunityType ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            {land.opportunityType.replace(/_/g, ' ')}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {land.sizeSqm} sqm • ₦{land.price.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Listed {new Date(land.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                  <div className="absolute right-4 bottom-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditLand(land);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-gray-700 hover:text-gray-900"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void openLandInterests(land.id);
                      }}
                      className="relative w-7 h-7 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50"
                    >
                      <User className="w-3.5 h-3.5 text-gray-700" />
                      {getUnreadCount(land.id) > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-1 rounded-full bg-red-500 text-white text-[9px] leading-[14px] font-semibold text-center">
                          {getUnreadCount(land.id) > 9 ? '9+' : getUnreadCount(land.id)}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDeleteLandId(land.id);
                      }}
                      disabled={deletingId === land.id}
                      className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {deletingId === land.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          {selected ? (
            <>
              <h3 className="text-xl font-semibold">{selected.name}</h3>
              {primaryImage(selected) && (
                <img src={primaryImage(selected)!} alt="" className="w-full h-40 rounded-lg object-cover" />
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Location</p>
                  <p className="font-medium">{selected.location}</p>
                </div>
                <div>
                  <p className="text-gray-500">Price</p>
                  <p className="font-medium">₦{selected.price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Size</p>
                  <p className="font-medium">{selected.sizeSqm} sqm</p>
                </div>
                <div>
                  <p className="text-gray-500">Title</p>
                  <p className="font-medium">{selected.titleDocument || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Category</p>
                  <p className="font-medium">{selected.opportunityCategory?.replace(/_/g, ' ') || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Filter</p>
                  <p className="font-medium">{selected.opportunityType?.replace(/_/g, ' ') || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Zoning</p>
                  <p className="font-medium">{selected.zoningType || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Road Access</p>
                  <p className="font-medium">{selected.roadAccess || '—'}</p>
                </div>
              </div>
              {selected.documents.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Documents</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.documents.map((doc, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-gray-100 rounded-full">{doc}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">Select a land listing to view details.</div>
          )}
        </div>
      </div>

      {interestLandId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Viewing requests for {selectedInterestLand?.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedLandInterests.length} homeowner
                  {selectedLandInterests.length === 1 ? '' : 's'} interested
                </p>
              </div>
              <button type="button" onClick={() => setInterestLandId(null)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto divide-y">
              {selectedLandInterests.length === 0 ? (
                <div className="p-6 text-sm text-gray-500">
                  No homeowner has scheduled viewing for this land yet.
                </div>
              ) : (
                selectedLandInterests.map((interest) => {
                  const avatarUrl = getBackendAssetUrl(interest.homeowner.pictureUrl);
                  return (
                    <div key={interest.id} className="p-4 flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="font-semibold text-sm text-gray-900">{interest.homeowner.fullName}</p>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate">{interest.homeowner.email}</span>
                        </p>
                        {interest.homeowner.phone && (
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {interest.homeowner.phone}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock3 className="w-3.5 h-3.5" />
                          {new Date(interest.createdAt).toLocaleString()}
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                          <label className="inline-flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                            <input
                              type="radio"
                              name={`land-outcome-${interest.id}`}
                              checked={interest.outcomeStatus !== 'purchased'}
                              onChange={async () => {
                                await updateOutcome({
                                  interestId: interest.id,
                                  outcomeStatus: 'abandoned',
                                });
                              }}
                            />
                            Abandoned
                          </label>
                          <label className="inline-flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                            <input
                              type="radio"
                              name={`land-outcome-${interest.id}`}
                              checked={interest.outcomeStatus === 'purchased'}
                              onChange={() => setPendingPurchaseInterestId(interest.id)}
                            />
                            Purchased
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {pendingPurchaseInterestId && pendingPurchaseInterest && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Confirm purchase tag</h3>
              <p className="text-sm text-gray-500 mt-1">
                Mark <span className="font-semibold text-gray-700">{pendingPurchaseInterest.homeowner.fullName}</span> as
                a successful buyer for <span className="font-semibold text-gray-700">{selectedInterestLand?.name}</span>?
              </p>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingPurchaseInterestId(null)}
                className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await updateOutcome({
                    interestId: pendingPurchaseInterestId,
                    outcomeStatus: 'purchased',
                  });
                  setPendingPurchaseInterestId(null);
                }}
                className="px-4 py-2 rounded-lg bg-black text-white text-sm hover:bg-gray-800"
              >
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteLandId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Delete land listing</h3>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-gray-700">{pendingDeleteLand?.name || 'this land'}</span>
                ? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteLandId(null)}
                className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!pendingDeleteLandId) return;
                  const id = pendingDeleteLandId;
                  setPendingDeleteLandId(null);
                  await handleDeleteLand(id);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
              >
                Delete Land
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <OpportunityListingModal
          title="Upload land for sale"
          entity="land"
          form={form}
          setForm={setForm}
          images={images}
          fileInputRef={fileInputRef}
          uploadError={uploadError}
          isSubmitting={isCreating}
          submitLabel="Upload land"
          onClose={() => {
            setShowUploadModal(false);
            setUploadError(null);
            resetForm();
            resetImages();
          }}
          onSubmit={handleSubmit}
          onAddImages={handleAddImages}
          onRemoveImage={removeImage}
          onLabelChange={(index, label) =>
            setImages((prev) => {
              const next = [...prev];
              next[index] = { ...next[index], label };
              return next;
            })
          }
        />
      )}

      {showEditModal && (
        <OpportunityListingModal
          title="Edit land listing"
          entity="land"
          form={form}
          setForm={setForm}
          images={images}
          fileInputRef={fileInputRef}
          uploadError={uploadError}
          isSubmitting={isUpdating}
          submitLabel="Save changes"
          photoAddLabel="Add more photos"
          onClose={() => {
            setShowEditModal(false);
            setEditingId(null);
            setUploadError(null);
            resetForm();
            resetImages();
          }}
          onSubmit={handleEditSubmit}
          onAddImages={handleAddImages}
          onRemoveImage={removeImage}
          onLabelChange={(index, label) =>
            setImages((prev) => {
              const next = [...prev];
              next[index] = { ...next[index], label };
              return next;
            })
          }
        />
      )}
    </div>
  );
}
