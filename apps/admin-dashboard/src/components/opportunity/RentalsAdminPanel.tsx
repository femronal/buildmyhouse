'use client';

import { useRef, useState } from 'react';
import { Building, Clock3, FileUp, Mail, MapPin, Pencil, Phone, Plus, Trash2, User, X } from 'lucide-react';
import { api } from '@/lib/api';
import { getBackendAssetUrl } from '@/lib/image';
import { useRentals, type CreateRentalPayload, type RentalListing, type UpdateRentalPayload } from '@/hooks/useRentals';
import { useRentalViewingInterests } from '@/hooks/useRentalViewingInterests';
import {
  BUILD_OPPORTUNITY_CATEGORY_OPTIONS,
  BUILD_OPPORTUNITY_TYPE_OPTIONS,
  type BuildOpportunityCategoryKey,
} from '@/lib/build-opportunity-taxonomy';
import { buildRentalPayloadFields } from '@/lib/opportunity-listing-payload';
import { OpportunityListingModal } from '@/components/opportunity/OpportunityListingModal';

export default function RentalsAdminPanel() {
  const { rentals, isLoading, createRental, isCreating, deleteRental, updateRental, isUpdating, refetch } = useRentals();
  const { interests, markAllRead, updateOutcome } = useRentalViewingInterests();
  const [selectedId, setSelectedId] = useState<string | null>(rentals[0]?.id ?? null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [interestRentalId, setInterestRentalId] = useState<string | null>(null);
  const [pendingPurchaseInterestId, setPendingPurchaseInterestId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    opportunityCategory: 'residential' as BuildOpportunityCategoryKey,
    opportunityType: '',
    opportunityTypeCustom: '',
    propertyType: 'House',
    location: '',
    annualRent: '',
    serviceCharge: '',
    cautionDeposit: '',
    legalFeePercent: '10',
    agencyFeePercent: '2',
    bedrooms: '',
    bathrooms: '',
    sizeSqm: '',
    furnishing: '',
    paymentPattern: '',
    power: '',
    water: '',
    internet: '',
    parking: '',
    security: '',
    rules: '',
    inspectionWindow: '',
    proximity: '',
    verificationDocs: '',
  });
  const [images, setImages] = useState<{ file?: File; url?: string; label: string; preview: string }[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  const selected = rentals.find((r) => r.id === selectedId) ?? rentals[0];

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      opportunityCategory: 'residential',
      opportunityType: '',
      opportunityTypeCustom: '',
      propertyType: 'House',
      location: '',
      annualRent: '',
      serviceCharge: '',
      cautionDeposit: '',
      legalFeePercent: '10',
      agencyFeePercent: '2',
      bedrooms: '',
      bathrooms: '',
      sizeSqm: '',
      furnishing: '',
      paymentPattern: '',
      power: '',
      water: '',
      internet: '',
      parking: '',
      security: '',
      rules: '',
      inspectionWindow: '',
      proximity: '',
      verificationDocs: '',
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
    const newImages = files.map((file) => ({
      file,
      label: file.name.replace(/\.[^/.]+$/, '') || 'Image',
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
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

  const startEditRental = (rental: RentalListing) => {
    const category = (rental.opportunityCategory || 'residential') as BuildOpportunityCategoryKey;
    const categoryOptions = getTypeOptions(category);
    const matchedOption = categoryOptions.find((option) => option.value === rental.opportunityType);
    const usingCustom = !!rental.opportunityType && !matchedOption;
    setEditingId(rental.id);
    setForm({
      title: rental.title,
      description: rental.description || '',
      opportunityCategory: category,
      opportunityType: usingCustom ? '__custom__' : (rental.opportunityType || ''),
      opportunityTypeCustom: usingCustom ? String(rental.opportunityType) : '',
      propertyType: rental.propertyType || 'House',
      location: rental.location,
      annualRent: String(rental.annualRent ?? ''),
      serviceCharge: String(rental.serviceCharge ?? ''),
      cautionDeposit: String(rental.cautionDeposit ?? ''),
      legalFeePercent: String(rental.legalFeePercent ?? ''),
      agencyFeePercent: String(rental.agencyFeePercent ?? ''),
      bedrooms: String(rental.bedrooms ?? ''),
      bathrooms: String(rental.bathrooms ?? ''),
      sizeSqm: String(rental.sizeSqm ?? ''),
      furnishing: rental.furnishing || '',
      paymentPattern: rental.paymentPattern || '',
      power: rental.power || '',
      water: rental.water || '',
      internet: rental.internet || '',
      parking: rental.parking || '',
      security: rental.security || '',
      rules: rental.rules || '',
      inspectionWindow: rental.inspectionWindow || '',
      proximity: (rental.proximity || []).join(', '),
      verificationDocs: (rental.verificationDocs || []).join(', '),
    });
    resetImages();
    setImages(
      (rental.images || []).map((img) => ({
        url: img.url,
        label: img.label || 'Image',
        preview: getBackendAssetUrl(img.url) || img.url,
      })),
    );
    setShowEditModal(true);
  };

  const handleDeleteRental = async (rentalId: string) => {
    try {
      setDeletingId(rentalId);
      await deleteRental(rentalId);
      if (selectedId === rentalId) {
        const fallback = rentals.find((r) => r.id !== rentalId);
        setSelectedId(fallback?.id ?? null);
      }
      await refetch();
    } catch (err: any) {
      window.alert(err?.message || 'Failed to delete rental');
    } finally {
      setDeletingId(null);
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

      const payload: CreateRentalPayload = {
        ...buildRentalPayloadFields(form),
        images: uploadedImages,
      };

      await createRental(payload);
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

      const payload: UpdateRentalPayload = {
        ...buildRentalPayloadFields(form),
        images: uploadedImages,
      };

      await updateRental({ id: editingId, payload });
      await refetch();
      setShowEditModal(false);
      setEditingId(null);
      resetForm();
      resetImages();
    } catch (err: any) {
      setUploadError(err?.message || 'Update failed');
    }
  };

  const primaryImage = (r: typeof selected) =>
    r?.images?.[0]?.url ? getBackendAssetUrl(r.images[0].url) : null;

  const pendingDeleteRental = rentals.find((r) => r.id === pendingDeleteId) ?? null;

  const getRentalInterests = (rentalId: string) =>
    interests.filter((interest) => interest.rentalListing.id === rentalId);

  const getRentalUnreadCount = (rentalId: string) =>
    getRentalInterests(rentalId).filter((interest) => !interest.isRead).length;

  const openRentalInterests = async (rentalId: string) => {
    setInterestRentalId(rentalId);
    if (getRentalUnreadCount(rentalId) > 0) {
      await markAllRead();
    }
  };

  const selectedInterestRental = rentals.find((r) => r.id === interestRentalId) ?? null;
  const selectedRentalInterests = selectedInterestRental
    ? getRentalInterests(selectedInterestRental.id)
    : [];
  const pendingPurchaseInterest =
    selectedRentalInterests.find((interest) => interest.id === pendingPurchaseInterestId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-4">
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm flex items-center gap-2"
        >
          <FileUp className="w-4 h-4" />
          Upload rental
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Homes for rent</h2>
            <span className="text-xs text-gray-400">{rentals.length} total</span>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : rentals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Building className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No rentals listed yet. Upload your first rental to get started.</p>
            </div>
          ) : (
            <div className="divide-y">
              {rentals.map((rental) => (
                <div key={rental.id} className="relative">
                  <button
                    onClick={() => setSelectedId(rental.id)}
                    className={`w-full text-left p-4 pr-28 hover:bg-gray-50 flex gap-3 ${
                      selectedId === rental.id ? 'bg-gray-50' : ''
                    }`}
                  >
                    {primaryImage(rental) && (
                      <img
                        src={primaryImage(rental)!}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {rental.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{rental.location}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {rental.opportunityCategory ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            {rental.opportunityCategory.replace(/_/g, ' ')}
                          </span>
                        ) : null}
                        {rental.opportunityType ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            {rental.opportunityType.replace(/_/g, ' ')}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {rental.bedrooms} bed • {rental.bathrooms} bath • N
                        {rental.annualRent.toLocaleString()}/yr
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Listed {new Date(rental.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </button>

                  <div className="absolute right-4 bottom-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditRental(rental);
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
                        void openRentalInterests(rental.id);
                      }}
                      className="relative w-7 h-7 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50"
                      title="View inspection requests"
                    >
                      <User className="w-3.5 h-3.5 text-gray-700" />
                      {getRentalUnreadCount(rental.id) > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-1 rounded-full bg-red-500 text-white text-[9px] leading-[14px] font-semibold text-center">
                          {getRentalUnreadCount(rental.id) > 9
                            ? '9+'
                            : getRentalUnreadCount(rental.id)}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setPendingDeleteId(rental.id)}
                      disabled={deletingId === rental.id}
                      className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center"
                      title="Delete rental"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-5 space-y-4">
          {selected ? (
            <>
              <div>
                <h3 className="text-xl font-semibold">{selected.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{selected.location}</p>
              </div>
              {primaryImage(selected) ? (
                <img src={primaryImage(selected)!} alt="" className="w-full h-40 rounded-lg object-cover" />
              ) : null}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3">
                  <p className="text-gray-500">Annual Rent</p>
                  <p className="font-semibold">N{selected.annualRent.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-gray-500">Service Charge</p>
                  <p className="font-semibold">N{selected.serviceCharge.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-gray-500">Caution Deposit</p>
                  <p className="font-semibold">N{selected.cautionDeposit.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-gray-500">BuildMyHouse Fee</p>
                  <p className="font-semibold">{selected.agencyFeePercent}%</p>
                </div>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <p><span className="text-gray-500">Power:</span> {selected.power || 'N/A'}</p>
                <p><span className="text-gray-500">Water:</span> {selected.water || 'N/A'}</p>
                <p><span className="text-gray-500">Security:</span> {selected.security || 'N/A'}</p>
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-sm">Select a rental to preview details.</p>
          )}
        </div>
      </div>

      {(showUploadModal || showEditModal) && (
        <OpportunityListingModal
          title={showEditModal ? 'Edit rental listing' : 'Upload rental listing'}
          entity="rental"
          form={form}
          setForm={setForm}
          images={images}
          fileInputRef={fileInputRef}
          uploadError={uploadError}
          isSubmitting={showEditModal ? isUpdating : isCreating}
          submitLabel={showEditModal ? 'Save changes' : 'Upload rental'}
          photoAddLabel={showEditModal ? 'Add more photos' : undefined}
          onClose={() => {
            setShowUploadModal(false);
            setShowEditModal(false);
            setEditingId(null);
            setUploadError(null);
            resetForm();
            resetImages();
          }}
          onSubmit={showEditModal ? handleEditSubmit : handleSubmit}
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

      {pendingDeleteRental ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold">Delete rental listing?</h3>
            <p className="text-sm text-gray-600 mt-2">
              This will permanently remove “{pendingDeleteRental.title}”.
            </p>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setPendingDeleteId(null)}
                className="px-4 py-2 rounded-lg border"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const targetId = pendingDeleteRental.id;
                  setPendingDeleteId(null);
                  await handleDeleteRental(targetId);
                }}
                disabled={deletingId === pendingDeleteRental.id}
                className="px-4 py-2 rounded-lg bg-red-600 text-white disabled:opacity-50"
              >
                {deletingId === pendingDeleteRental.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {interestRentalId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Inspection requests for {selectedInterestRental?.title}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedRentalInterests.length} homeowner
                  {selectedRentalInterests.length === 1 ? '' : 's'} interested
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInterestRentalId(null)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto divide-y">
              {selectedRentalInterests.length === 0 ? (
                <div className="p-6 text-sm text-gray-500">
                  No homeowner has requested inspection for this rental yet.
                </div>
              ) : (
                selectedRentalInterests.map((interest) => {
                  const avatarUrl = getBackendAssetUrl(interest.homeowner?.pictureUrl);
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
                        <p className="font-semibold text-sm text-gray-900">
                          {interest.homeowner?.fullName || 'Unknown homeowner'}
                        </p>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate">{interest.homeowner?.email || 'N/A'}</span>
                        </p>
                        {interest.homeowner?.phone && (
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{interest.homeowner.phone}</span>
                          </p>
                        )}
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock3 className="w-3.5 h-3.5" />
                          <span>{new Date(interest.createdAt).toLocaleString()}</span>
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                          <label className="inline-flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                            <input
                              type="radio"
                              name={`rental-outcome-${interest.id}`}
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
                              name={`rental-outcome-${interest.id}`}
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
                a successful renter for <span className="font-semibold text-gray-700">{selectedInterestRental?.title}</span>?
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
    </div>
  );
}

