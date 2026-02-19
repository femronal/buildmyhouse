'use client';

import { useRef, useState } from 'react';
import { Clock3, FileUp, Mail, MapPin, Phone, Plus, Trash2, User, X } from 'lucide-react';
import { api } from '@/lib/api';
import { getBackendAssetUrl } from '@/lib/image';
import { useLands, type CreateLandPayload } from '@/hooks/useLands';
import { useLandViewingInterests } from '@/hooks/useLandViewingInterests';

export default function LandPage() {
  const { lands, isLoading, createLand, isCreating, deleteLand, refetch } = useLands();
  const { interests, markAllRead, updateOutcome } = useLandViewingInterests();
  const [selectedId, setSelectedId] = useState<string | null>(lands[0]?.id ?? null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteLandId, setPendingDeleteLandId] = useState<string | null>(null);
  const [interestLandId, setInterestLandId] = useState<string | null>(null);
  const [pendingPurchaseInterestId, setPendingPurchaseInterestId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
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
  const [images, setImages] = useState<{ file: File; label: string; preview: string }[]>([]);

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
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
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

      const payload: CreateLandPayload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        location: form.location.trim(),
        price: parseFloat(form.price) || 0,
        sizeSqm: parseFloat(form.sizeSqm) || 0,
        titleDocument: form.titleDocument.trim() || undefined,
        zoningType: form.zoningType.trim() || undefined,
        topography: form.topography.trim() || undefined,
        roadAccess: form.roadAccess.trim() || undefined,
        ownershipType: form.ownershipType.trim() || undefined,
        documents: form.documents.split(',').map((s) => s.trim()).filter(Boolean),
        nearbyLandmarks: form.nearbyLandmarks.split(',').map((s) => s.trim()).filter(Boolean),
        restrictions: form.restrictions.split(',').map((s) => s.trim()).filter(Boolean),
        contactName: form.contactName.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
        images: uploadedImages,
      };

      await createLand(payload);
      await refetch();
      setShowUploadModal(false);
      setForm({
        name: '',
        description: '',
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
      setImages([]);
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed');
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Upload land for sale</h3>
              <button onClick={() => setShowUploadModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {uploadError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{uploadError}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Land title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prime Residential Plot"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size (sqm) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.sizeSqm}
                    onChange={(e) => setForm((f) => ({ ...f, sizeSqm: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input placeholder="Title document (e.g. C of O)" value={form.titleDocument} onChange={(e) => setForm((f) => ({ ...f, titleDocument: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                <input placeholder="Zoning type" value={form.zoningType} onChange={(e) => setForm((f) => ({ ...f, zoningType: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                <input placeholder="Topography" value={form.topography} onChange={(e) => setForm((f) => ({ ...f, topography: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Road access" value={form.roadAccess} onChange={(e) => setForm((f) => ({ ...f, roadAccess: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                <input placeholder="Ownership type" value={form.ownershipType} onChange={(e) => setForm((f) => ({ ...f, ownershipType: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <input placeholder="Documents (comma-separated)" value={form.documents} onChange={(e) => setForm((f) => ({ ...f, documents: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input placeholder="Nearby landmarks (comma-separated)" value={form.nearbyLandmarks} onChange={(e) => setForm((f) => ({ ...f, nearbyLandmarks: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input placeholder="Restrictions / caveats (comma-separated)" value={form.restrictions} onChange={(e) => setForm((f) => ({ ...f, restrictions: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Contact name" value={form.contactName} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                <input placeholder="Contact phone" value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photos * (with labels)</label>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddImages} />
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
                    <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <img src={img.preview} alt="" className="w-12 h-12 rounded object-cover" />
                      <input
                        type="text"
                        placeholder="Label (e.g. Main Road Frontage)"
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
                      <button type="button" onClick={() => removeImage(i)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 px-3 py-2 border rounded-lg text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={isCreating} className="flex-1 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50">
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
