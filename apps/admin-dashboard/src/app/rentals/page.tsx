'use client';

import { useRef, useState } from 'react';
import { Building, Clock3, FileUp, Mail, MapPin, Phone, Plus, Trash2, User, X } from 'lucide-react';
import { api } from '@/lib/api';
import { getBackendAssetUrl } from '@/lib/image';
import { useRentals, type CreateRentalPayload } from '@/hooks/useRentals';
import { useRentalViewingInterests } from '@/hooks/useRentalViewingInterests';

export default function RentalsPage() {
  const { rentals, isLoading, createRental, isCreating, deleteRental, refetch } = useRentals();
  const { interests, markAllRead, updateOutcome } = useRentalViewingInterests();
  const [selectedId, setSelectedId] = useState<string | null>(rentals[0]?.id ?? null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [interestRentalId, setInterestRentalId] = useState<string | null>(null);
  const [pendingPurchaseInterestId, setPendingPurchaseInterestId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
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
  const [images, setImages] = useState<{ file: File; label: string; preview: string }[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const selected = rentals.find((r) => r.id === selectedId) ?? rentals[0];

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

      const payload: CreateRentalPayload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        propertyType: form.propertyType.trim(),
        location: form.location.trim(),
        annualRent: parseFloat(form.annualRent) || 0,
        serviceCharge: parseFloat(form.serviceCharge) || 0,
        cautionDeposit: parseFloat(form.cautionDeposit) || 0,
        legalFeePercent: parseFloat(form.legalFeePercent) || 0,
        agencyFeePercent: parseFloat(form.agencyFeePercent) || 2,
        bedrooms: parseInt(form.bedrooms, 10) || 0,
        bathrooms: parseInt(form.bathrooms, 10) || 0,
        sizeSqm: parseFloat(form.sizeSqm) || 0,
        furnishing: form.furnishing.trim() || undefined,
        paymentPattern: form.paymentPattern.trim() || undefined,
        power: form.power.trim() || undefined,
        water: form.water.trim() || undefined,
        internet: form.internet.trim() || undefined,
        parking: form.parking.trim() || undefined,
        security: form.security.trim() || undefined,
        rules: form.rules.trim() || undefined,
        inspectionWindow: form.inspectionWindow.trim() || undefined,
        proximity: form.proximity
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        verificationDocs: form.verificationDocs
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        images: uploadedImages,
      };

      await createRental(payload);
      await refetch();
      setShowUploadModal(false);
      setForm({
        title: '',
        description: '',
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
      setImages([]);
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed');
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
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-poppins">Rentals</h1>
          <p className="text-gray-500 mt-1">Upload rentals from homeowners and manage active listings</p>
        </div>
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

      {showUploadModal ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="text-xl font-semibold">Upload rental listing</h3>
              <button onClick={() => setShowUploadModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form className="p-5 space-y-4" onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-4">
                <input className="border rounded-lg px-3 py-2" placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
                <input className="border rounded-lg px-3 py-2" placeholder="Property Type (House/Apartment)" value={form.propertyType} onChange={(e) => setForm((f) => ({ ...f, propertyType: e.target.value }))} required />
                <input className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} required />
                <textarea className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />

                <input className="border rounded-lg px-3 py-2" type="number" step="0.01" placeholder="Annual Rent" value={form.annualRent} onChange={(e) => setForm((f) => ({ ...f, annualRent: e.target.value }))} required />
                <input className="border rounded-lg px-3 py-2" type="number" step="0.01" placeholder="Service Charge" value={form.serviceCharge} onChange={(e) => setForm((f) => ({ ...f, serviceCharge: e.target.value }))} required />
                <input className="border rounded-lg px-3 py-2" type="number" step="0.01" placeholder="Caution Deposit" value={form.cautionDeposit} onChange={(e) => setForm((f) => ({ ...f, cautionDeposit: e.target.value }))} required />
                <input className="border rounded-lg px-3 py-2" type="number" step="0.01" placeholder="Legal Fee (%)" value={form.legalFeePercent} onChange={(e) => setForm((f) => ({ ...f, legalFeePercent: e.target.value }))} required />
                <input className="border rounded-lg px-3 py-2" type="number" step="0.01" placeholder="BuildMyHouse Agency Fee (%)" value={form.agencyFeePercent} onChange={(e) => setForm((f) => ({ ...f, agencyFeePercent: e.target.value }))} required />
                <input className="border rounded-lg px-3 py-2" type="number" placeholder="Bedrooms" value={form.bedrooms} onChange={(e) => setForm((f) => ({ ...f, bedrooms: e.target.value }))} required />
                <input className="border rounded-lg px-3 py-2" type="number" placeholder="Bathrooms" value={form.bathrooms} onChange={(e) => setForm((f) => ({ ...f, bathrooms: e.target.value }))} required />
                <input className="border rounded-lg px-3 py-2" type="number" step="0.01" placeholder="Size (sqm)" value={form.sizeSqm} onChange={(e) => setForm((f) => ({ ...f, sizeSqm: e.target.value }))} required />
                <input className="border rounded-lg px-3 py-2" placeholder="Furnishing (Furnished/Semi-furnished/Unfurnished)" value={form.furnishing} onChange={(e) => setForm((f) => ({ ...f, furnishing: e.target.value }))} />
                <input className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Payment Pattern (e.g. 1 year upfront)" value={form.paymentPattern} onChange={(e) => setForm((f) => ({ ...f, paymentPattern: e.target.value }))} />
                <input className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Power details" value={form.power} onChange={(e) => setForm((f) => ({ ...f, power: e.target.value }))} />
                <input className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Water details" value={form.water} onChange={(e) => setForm((f) => ({ ...f, water: e.target.value }))} />
                <input className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Internet details" value={form.internet} onChange={(e) => setForm((f) => ({ ...f, internet: e.target.value }))} />
                <input className="border rounded-lg px-3 py-2" placeholder="Parking details" value={form.parking} onChange={(e) => setForm((f) => ({ ...f, parking: e.target.value }))} />
                <input className="border rounded-lg px-3 py-2" placeholder="Security details" value={form.security} onChange={(e) => setForm((f) => ({ ...f, security: e.target.value }))} />
                <input className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="House rules" value={form.rules} onChange={(e) => setForm((f) => ({ ...f, rules: e.target.value }))} />
                <input className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Inspection Window" value={form.inspectionWindow} onChange={(e) => setForm((f) => ({ ...f, inspectionWindow: e.target.value }))} />
                <input className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Nearby landmarks (comma-separated)" value={form.proximity} onChange={(e) => setForm((f) => ({ ...f, proximity: e.target.value }))} />
                <input className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Verification docs (comma-separated)" value={form.verificationDocs} onChange={(e) => setForm((f) => ({ ...f, verificationDocs: e.target.value }))} />
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Rental photos (you can add labels)</p>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddImages} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-2 border rounded-lg text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add photos
                </button>
                {images.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-3 mt-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="border rounded-lg p-2 flex gap-2">
                        <img src={img.preview} alt="" className="w-20 h-20 rounded object-cover" />
                        <div className="flex-1 space-y-2">
                          <input className="border rounded px-2 py-1 text-sm w-full" value={img.label} onChange={(e) => setImages((prev) => prev.map((item, i) => (i === idx ? { ...item, label: e.target.value } : item)))} placeholder="Label (e.g. Living Room)" />
                          <button type="button" onClick={() => removeImage(idx)} className="text-red-600 text-xs inline-flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {uploadError ? <p className="text-sm text-red-600">{uploadError}</p> : null}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowUploadModal(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
                <button type="submit" disabled={isCreating} className="px-4 py-2 rounded-lg bg-gray-900 text-white disabled:opacity-50">
                  {isCreating ? 'Uploading...' : 'Upload rental'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

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

