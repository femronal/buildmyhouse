'use client';

import { useState, useRef } from 'react';
import { FileUp, Home, X, Plus, Trash2, User, Mail, Phone, Clock3 } from 'lucide-react';
import { useHouses, type CreateHousePayload } from '@/hooks/useHouses';
import { useHouseViewingInterests } from '@/hooks/useHouseViewingInterests';
import { api } from '@/lib/api';
import { getBackendAssetUrl } from '@/lib/image';

export default function HousesPage() {
  const { houses, isLoading, createHouse, isCreating, deleteHouse, refetch } = useHouses();
  const { interests, markAllRead, updateOutcome } = useHouseViewingInterests();
  const [selectedId, setSelectedId] = useState<string | null>(houses[0]?.id ?? null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteHouseId, setPendingDeleteHouseId] = useState<string | null>(null);
  const [interestHouseId, setInterestHouseId] = useState<string | null>(null);
  const [pendingPurchaseInterestId, setPendingPurchaseInterestId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    squareFootage: '',
    squareMeters: '',
    propertyType: '',
    yearBuilt: '',
    condition: '',
    parking: '',
    documents: '',
    amenities: '',
    nearbyFacilities: '',
    contactName: '',
    contactPhone: '',
  });
  const [images, setImages] = useState<{ file: File; label: string; preview: string }[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const selected = houses.find((h) => h.id === selectedId) ?? houses[0];

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
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  const handleDeleteHouse = async (houseId: string) => {
    try {
      setDeletingId(houseId);
      await deleteHouse(houseId);
      if (selectedId === houseId) {
        const fallback = houses.find((h) => h.id !== houseId);
        setSelectedId(fallback?.id ?? null);
      }
      await refetch();
    } catch (err: any) {
      window.alert(err?.message || 'Failed to delete house');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    if (images.length === 0) {
      setUploadError('Please add at least one photo');
      return;
    }
    try {
      const uploadedImages: { url: string; label: string; order: number }[] = [];
      for (let i = 0; i < images.length; i++) {
        const { url } = await api.uploadFile(images[i].file);
        uploadedImages.push({
          url: url.startsWith('/') ? url : `/${url}`,
          label: images[i].label || `Image ${i + 1}`,
          order: i,
        });
      }

      const payload: CreateHousePayload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        location: form.location.trim(),
        price: parseFloat(form.price) || 0,
        bedrooms: parseInt(form.bedrooms, 10) || 1,
        bathrooms: parseInt(form.bathrooms, 10) || 1,
        squareFootage: parseFloat(form.squareFootage) || 0,
        squareMeters: form.squareMeters ? parseFloat(form.squareMeters) : undefined,
        propertyType: form.propertyType.trim() || undefined,
        yearBuilt: form.yearBuilt ? parseInt(form.yearBuilt, 10) : undefined,
        condition: form.condition.trim() || undefined,
        parking: form.parking ? parseInt(form.parking, 10) : undefined,
        documents: form.documents
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        amenities: form.amenities
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        nearbyFacilities: form.nearbyFacilities
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        contactName: form.contactName.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
        images: uploadedImages,
      };

      await createHouse(payload);
      setShowUploadModal(false);
      setForm({
        name: '',
        description: '',
        location: '',
        price: '',
        bedrooms: '',
        bathrooms: '',
        squareFootage: '',
        squareMeters: '',
        propertyType: '',
        yearBuilt: '',
        condition: '',
        parking: '',
        documents: '',
        amenities: '',
        nearbyFacilities: '',
        contactName: '',
        contactPhone: '',
      });
      setImages([]);
      refetch();
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed');
    }
  };

  const primaryImage = (h: typeof selected) =>
    h?.images?.[0]?.url ? getBackendAssetUrl(h.images[0].url) : null;

  const getHouseInterests = (houseId: string) =>
    interests.filter((interest) => interest.houseForSale.id === houseId);

  const getHouseUnreadCount = (houseId: string) =>
    getHouseInterests(houseId).filter((interest) => !interest.isRead).length;

  const openHouseInterests = async (houseId: string) => {
    setInterestHouseId(houseId);
    if (getHouseUnreadCount(houseId) > 0) {
      await markAllRead();
    }
  };

  const selectedInterestHouse = houses.find((house) => house.id === interestHouseId) ?? null;
  const selectedHouseInterests = selectedInterestHouse
    ? getHouseInterests(selectedInterestHouse.id)
    : [];
  const pendingDeleteHouse = houses.find((house) => house.id === pendingDeleteHouseId) ?? null;
  const pendingPurchaseInterest =
    selectedHouseInterests.find((interest) => interest.id === pendingPurchaseInterestId) ?? null;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-poppins">Houses</h1>
          <p className="text-gray-500 mt-1">Upload houses for sale and manage listings</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm flex items-center gap-2"
        >
          <FileUp className="w-4 h-4" />
          Upload house
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Houses for sale</h2>
            <span className="text-xs text-gray-400">{houses.length} total</span>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : houses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Home className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No houses listed yet. Upload your first house to get started.</p>
            </div>
          ) : (
            <div className="divide-y">
              {houses.map((house) => (
                <div key={house.id} className="relative">
                  <button
                    onClick={() => setSelectedId(house.id)}
                    className={`w-full text-left p-4 pr-32 hover:bg-gray-50 flex gap-3 ${
                      selectedId === house.id ? 'bg-gray-50' : ''
                    }`}
                  >
                    {primaryImage(house) && (
                      <img
                        src={primaryImage(house)!}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold flex items-center gap-2">
                        <Home className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        {house.name}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {house.location} • {house.bedrooms} bed, {house.bathrooms} bath
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        ${house.price.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Listed {new Date(house.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                  <div className="absolute right-4 bottom-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void openHouseInterests(house.id);
                      }}
                      className="relative w-7 h-7 rounded-full border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-50"
                      title="View scheduled homeowners"
                    >
                      <User className="w-3.5 h-3.5 text-gray-700" />
                      {getHouseUnreadCount(house.id) > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-1 rounded-full bg-red-500 text-white text-[9px] leading-[14px] font-semibold text-center">
                          {getHouseUnreadCount(house.id) > 9
                            ? '9+'
                            : getHouseUnreadCount(house.id)}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDeleteHouseId(house.id);
                      }}
                      disabled={deletingId === house.id}
                      className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {deletingId === house.id ? 'Deleting...' : 'Delete'}
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
                <img
                  src={primaryImage(selected)!}
                  alt=""
                  className="w-full h-40 rounded-lg object-cover"
                />
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Location</p>
                  <p className="font-medium">{selected.location}</p>
                </div>
                <div>
                  <p className="text-gray-500">Price</p>
                  <p className="font-medium">${selected.price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Bedrooms</p>
                  <p className="font-medium">{selected.bedrooms}</p>
                </div>
                <div>
                  <p className="text-gray-500">Bathrooms</p>
                  <p className="font-medium">{selected.bathrooms}</p>
                </div>
                <div>
                  <p className="text-gray-500">Area</p>
                  <p className="font-medium">
                    {selected.squareMeters ?? selected.squareFootage} m²
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Condition</p>
                  <p className="font-medium">{selected.condition || '—'}</p>
                </div>
              </div>
              {selected.description && (
                <p className="text-sm text-gray-600">{selected.description}</p>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Home className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Select a house listing to view details.
            </div>
          )}
        </div>
      </div>

      {interestHouseId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Viewing requests for {selectedInterestHouse?.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedHouseInterests.length} homeowner
                  {selectedHouseInterests.length === 1 ? '' : 's'} interested
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInterestHouseId(null)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto divide-y">
              {selectedHouseInterests.length === 0 ? (
                <div className="p-6 text-sm text-gray-500">
                  No homeowner has scheduled a viewing for this house yet.
                </div>
              ) : (
                selectedHouseInterests.map((interest) => {
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
                        <p className="font-semibold text-sm text-gray-900">
                          {interest.homeowner.fullName}
                        </p>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate">{interest.homeowner.email}</span>
                        </p>
                        {interest.homeowner.phone && (
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
                              name={`house-outcome-${interest.id}`}
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
                              name={`house-outcome-${interest.id}`}
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
                a successful buyer for <span className="font-semibold text-gray-700">{selectedInterestHouse?.name}</span>?
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

      {pendingDeleteHouseId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Delete house listing</h3>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-gray-700">
                  {pendingDeleteHouse?.name || 'this house'}
                </span>
                ? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteHouseId(null)}
                className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!pendingDeleteHouseId) return;
                  const houseId = pendingDeleteHouseId;
                  setPendingDeleteHouseId(null);
                  await handleDeleteHouse(houseId);
                }}
                disabled={deletingId === pendingDeleteHouseId}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId === pendingDeleteHouseId ? 'Deleting...' : 'Delete House'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Upload house for sale</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {uploadError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                  {uploadError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Luxury Modern Villa"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the property..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Victoria Island, Lagos"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 285000"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Move-in Ready"
                    value={form.condition}
                    onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bedrooms *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="4"
                    value={form.bedrooms}
                    onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bathrooms *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="3"
                    value={form.bathrooms}
                    onChange={(e) => setForm((f) => ({ ...f, bathrooms: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sq Ft *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="2800"
                    value={form.squareFootage}
                    onChange={(e) => setForm((f) => ({ ...f, squareFootage: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sq m
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="260"
                    value={form.squareMeters}
                    onChange={(e) => setForm((f) => ({ ...f, squareMeters: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Type
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Detached House"
                    value={form.propertyType}
                    onChange={(e) => setForm((f) => ({ ...f, propertyType: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year Built
                  </label>
                  <input
                    type="number"
                    placeholder="2020"
                    value={form.yearBuilt}
                    onChange={(e) => setForm((f) => ({ ...f, yearBuilt: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parking
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="2"
                    value={form.parking}
                    onChange={(e) => setForm((f) => ({ ...f, parking: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Documents (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Title Deed, Survey Plan, Building Approval"
                  value={form.documents}
                  onChange={(e) => setForm((f) => ({ ...f, documents: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amenities (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 24/7 Security, Swimming Pool, Garden, Gym"
                  value={form.amenities}
                  onChange={(e) => setForm((f) => ({ ...f, amenities: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nearby Facilities (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Schools: 2km, Shopping: 1.5km, Hospital: 3km"
                  value={form.nearbyFacilities}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nearbyFacilities: e.target.value }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Real Estate"
                    value={form.contactName}
                    onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +234 801 234 5678"
                    value={form.contactPhone}
                    onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photos * (with labels)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleAddImages}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center gap-2 text-gray-500 hover:border-gray-400"
                >
                  <Plus className="w-5 h-5" />
                  Add photos
                </button>
                <div className="mt-3 space-y-2">
                  {images.map((img, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                    >
                      <img
                        src={img.preview}
                        alt=""
                        className="w-12 h-12 rounded object-cover"
                      />
                      <input
                        type="text"
                        placeholder="Label (e.g. Exterior, Living Room)"
                        value={img.label}
                        onChange={(e) =>
                          setImages((prev) => {
                            const next = [...prev];
                            next[i] = { ...next[i], label: e.target.value };
                            return next;
                          })
                        }
                        className="flex-1 px-2 py-1 border rounded text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  {isCreating ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
