'use client';

import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { api } from '@/lib/api';
import { getBackendAssetUrl } from '@/lib/image';
import { useAdminCreateProjectScope, type AdminProjectScope } from '@/hooks/useAdminProjectScopes';

type PlanType = 'repair' | 'upgrades' | 'renovation' | 'full_builds';

const PLAN_TYPE_OPTIONS: { value: PlanType; label: string }[] = [
  { value: 'repair', label: 'Repair' },
  { value: 'upgrades', label: 'Upgrades' },
  { value: 'renovation', label: 'Renovation' },
  { value: 'full_builds', label: 'Full Builds' },
];

const PLAN_TYPE_FILTER_OPTIONS: Record<PlanType, string[]> = {
  repair: ['Electricals', 'Plumbing Fixes', 'Roof Leak Repair', 'Drainage Fix', 'Bathroom Repair', 'Gate/Fence Repair'],
  upgrades: ['Kitchen Upgrade', 'Bedroom Upgrade', 'Security Gate Upgrade', 'Door Upgrade', 'Bathroom Upgrade', 'Lighting Upgrade'],
  renovation: ['Room-by-Room', 'Occupied Home', 'Family Home Rehab', 'Rental Prep', 'Interior Refresh'],
  full_builds: ['Bungalow Build', 'Duplex Build', 'Blockwork + Roofing', 'Shell to Finish', 'Turnkey Build'],
};

const CUSTOM_FILTER = '__custom__';

type Phase = { name: string; description: string; estimatedDuration: string; estimatedCost: string };
type Photo = { url: string; label: string; preview: string };

function mapPlanTypeForApi(planType: PlanType) {
  if (planType === 'upgrades') return 'interior_design';
  if (planType === 'full_builds') return 'homebuilding';
  return 'renovation';
}

function moneyToCents(value: string) {
  const n = Number(String(value).replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

const inputClass = 'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm';

export function AdminCreateScopeForm({
  contractorUserId,
  contractorName,
  onCancel,
  onCreated,
}: {
  contractorUserId: string;
  contractorName: string;
  onCancel: () => void;
  onCreated: (scope: AdminProjectScope) => void;
}) {
  const createScope = useAdminCreateProjectScope(contractorUserId);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [planType, setPlanType] = useState<PlanType>('repair');
  const [selectedFilter, setSelectedFilter] = useState(PLAN_TYPE_FILTER_OPTIONS.repair[0]);
  const [customFilter, setCustomFilter] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [squareFootage, setSquareFootage] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [floors, setFloors] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [rooms, setRooms] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filters = PLAN_TYPE_FILTER_OPTIONS[planType];
  const resolvedFilter = useMemo(
    () => (selectedFilter === CUSTOM_FILTER ? customFilter.trim() : selectedFilter),
    [selectedFilter, customFilter],
  );

  const changePlanType = (next: PlanType) => {
    setPlanType(next);
    setSelectedFilter(PLAN_TYPE_FILTER_OPTIONS[next][0]);
    setCustomFilter('');
  };

  const addPhoto = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await api.uploadFile(file);
      const path = uploaded.url.startsWith('http') ? new URL(uploaded.url).pathname : uploaded.url;
      setPhotos((current) => [...current, { url: path, label: '', preview: uploaded.url }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload that photo.');
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    setError(null);
    if (!name.trim()) return setError('Enter a scope name.');
    if (!description.trim()) return setError('Enter a description.');
    if (!resolvedFilter) return setError('Choose what kind of work this scope covers.');
    const beds = Number(bedrooms);
    const baths = Number(bathrooms);
    const area = Number(squareFootage);
    const cost = Number(estimatedCost);
    if (!Number.isFinite(beds) || beds < 1) return setError('Enter the number of bedrooms.');
    if (!Number.isFinite(baths) || baths < 1) return setError('Enter the number of bathrooms.');
    if (!Number.isFinite(area) || area < 1) return setError('Enter the square footage.');
    if (!Number.isFinite(cost) || cost < 0) return setError('Enter the estimated cost.');
    if (!estimatedDuration.trim()) return setError('Enter the estimated duration.');
    if (photos.length === 0) return setError('Upload at least one photo.');
    if (photos.some((photo) => !photo.label.trim())) return setError('Label every photo.');
    for (let i = 0; i < phases.length; i += 1) {
      const phase = phases[i];
      if (!phase.name.trim() || !phase.description.trim() || !phase.estimatedDuration.trim()) {
        return setError(`Complete the name, description, and duration for phase ${i + 1}.`);
      }
      if (!Number.isFinite(moneyToCents(phase.estimatedCost)) || moneyToCents(phase.estimatedCost) <= 0) {
        return setError(`Enter a cost for phase ${i + 1}.`);
      }
    }
    const phaseTotal = phases.reduce((sum, phase) => sum + (moneyToCents(phase.estimatedCost) || 0), 0);
    if (phaseTotal !== moneyToCents(estimatedCost)) {
      return setError('The phase costs must add up to the estimated cost.');
    }

    try {
      const created = await createScope.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        planType: mapPlanTypeForApi(planType),
        projectTypeTag: planType,
        projectTypeFilter: resolvedFilter,
        bedrooms: beds,
        bathrooms: baths,
        squareFootage: area,
        estimatedCost: cost,
        floors: floors.trim() ? Number(floors) : undefined,
        estimatedDuration: estimatedDuration.trim(),
        rooms: rooms.map((item) => item.trim()).filter(Boolean).join(', '),
        materials: materials.map((item) => item.trim()).filter(Boolean).join(', '),
        features: features.map((item) => item.trim()).filter(Boolean).join(', '),
        constructionPhases: JSON.stringify(
          phases.map((phase) => ({
            name: phase.name.trim(),
            description: phase.description.trim(),
            estimatedDuration: phase.estimatedDuration.trim(),
            estimatedCost: Number(phase.estimatedCost),
          })),
        ),
        images: photos.map((photo, index) => ({
          url: photo.url,
          label: photo.label.trim(),
          order: index,
        })),
      });
      onCreated(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload this scope.');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-base font-semibold text-gray-900">Upload a scope for {contractorName}</h4>
        <p className="text-sm text-gray-500 mt-1">
          This uses the same questions as the contractor upload. Homeowners will see it as {contractorName}&apos;s scope.
        </p>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <label className="block text-xs font-medium text-gray-600">
        Scope name *
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="block text-xs font-medium text-gray-600">
        Description *
        <textarea className={inputClass} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-gray-600">
          Plan type *
          <select
            className={`${inputClass} bg-white`}
            value={planType}
            onChange={(e) => changePlanType(e.target.value as PlanType)}
          >
            {PLAN_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-gray-600">
          Work covered *
          <select
            className={`${inputClass} bg-white`}
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
          >
            {filters.map((filter) => (
              <option key={filter} value={filter}>{filter}</option>
            ))}
            <option value={CUSTOM_FILTER}>Something else</option>
          </select>
        </label>
        {selectedFilter === CUSTOM_FILTER ? (
          <label className="block text-xs font-medium text-gray-600 sm:col-span-2">
            Custom work type
            <input className={inputClass} value={customFilter} onChange={(e) => setCustomFilter(e.target.value)} />
          </label>
        ) : null}
        <label className="block text-xs font-medium text-gray-600">Bedrooms *<input type="number" min={1} className={inputClass} value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} /></label>
        <label className="block text-xs font-medium text-gray-600">Bathrooms *<input type="number" min={1} className={inputClass} value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} /></label>
        <label className="block text-xs font-medium text-gray-600">Square footage *<input type="number" min={1} className={inputClass} value={squareFootage} onChange={(e) => setSquareFootage(e.target.value)} /></label>
        <label className="block text-xs font-medium text-gray-600">Estimated cost (NGN) *<input type="number" min={0} className={inputClass} value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} /></label>
        <label className="block text-xs font-medium text-gray-600">Floors<input type="number" min={1} className={inputClass} value={floors} onChange={(e) => setFloors(e.target.value)} /></label>
        <label className="block text-xs font-medium text-gray-600">Estimated duration *<input className={inputClass} placeholder="e.g. 6-8 months" value={estimatedDuration} onChange={(e) => setEstimatedDuration(e.target.value)} /></label>
      </div>

      <ListEditor label="Rooms" placeholder="Kitchen, living room" values={rooms} onChange={setRooms} addLabel="Add room" />
      <ListEditor label="Key materials" placeholder="Concrete, steel, wood" values={materials} onChange={setMaterials} addLabel="Add material" />
      <ListEditor label="Features" placeholder="Solar panels, smart home" values={features} onChange={setFeatures} addLabel="Add feature" />

      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">Construction phases</p>
        <div className="space-y-3">
          {phases.map((phase, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-2 border border-gray-200 rounded-xl p-3">
              <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Phase name" value={phase.name} onChange={(e) => setPhases(phases.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} />
              <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Duration" value={phase.estimatedDuration} onChange={(e) => setPhases(phases.map((item, i) => i === index ? { ...item, estimatedDuration: e.target.value } : item))} />
              <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" placeholder="Description" value={phase.description} onChange={(e) => setPhases(phases.map((item, i) => i === index ? { ...item, description: e.target.value } : item))} />
              <input type="number" min={0} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Cost (NGN)" value={phase.estimatedCost} onChange={(e) => setPhases(phases.map((item, i) => i === index ? { ...item, estimatedCost: e.target.value } : item))} />
              <button type="button" className="text-sm text-red-600" onClick={() => setPhases(phases.filter((_, i) => i !== index))}>Remove phase</button>
            </div>
          ))}
          <button
            type="button"
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
            onClick={() => setPhases([...phases, { name: '', description: '', estimatedDuration: '', estimatedCost: '' }])}
          >
            + Add construction phase
          </button>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">Design photos *</p>
        <div className="flex flex-wrap gap-3">
          {photos.map((photo, index) => (
            <div key={`${photo.url}-${index}`} className="w-32">
              <img src={getBackendAssetUrl(photo.preview) || photo.preview} alt="" className="h-24 w-32 rounded-lg object-cover" />
              <input
                className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-xs"
                placeholder="Label, e.g. Kitchen"
                value={photo.label}
                onChange={(e) => setPhotos(photos.map((item, i) => i === index ? { ...item, label: e.target.value } : item))}
              />
              <button type="button" className="mt-1 text-xs text-red-600" onClick={() => setPhotos(photos.filter((_, i) => i !== index))}>Remove</button>
            </div>
          ))}
          <label className="flex h-24 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-500">
            {uploading ? 'Uploading…' : 'Add photo'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                e.target.value = '';
                void addPhoto(file);
              }}
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={createScope.isPending || uploading}
          className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {createScope.isPending ? 'Uploading…' : 'Upload scope'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700">
          Cancel
        </button>
      </div>
    </div>
  );
}

function ListEditor({
  label,
  placeholder,
  values,
  onChange,
  addLabel,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
  addLabel: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-600 mb-2">{label}</p>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(values.map((item, i) => (i === index ? e.target.value : item)))}
            />
            <button type="button" className="rounded-lg border border-red-200 px-2 text-red-600" onClick={() => onChange(values.filter((_, i) => i !== index))} aria-label={`Remove ${label}`}>
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button type="button" className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" onClick={() => onChange([...values, ''])}>
          <Plus className="w-4 h-4" /> {addLabel}
        </button>
      </div>
    </div>
  );
}
