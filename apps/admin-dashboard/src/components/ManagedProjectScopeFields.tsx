'use client';

import { Plus, Trash2 } from 'lucide-react';

export type PlanTypeTag = 'repair' | 'upgrades' | 'renovation' | 'full_builds';

export type ConstructionPhaseDraft = {
  name: string;
  description: string;
  estimatedDuration: string;
  estimatedCost: string;
};

export type ManagedProjectScope = {
  name: string;
  address: string;
  description: string;
  scopeSummary: string;
  planType: PlanTypeTag;
  projectTypeFilter: string;
  customProjectTypeFilter: string;
  bedrooms: string;
  bathrooms: string;
  squareFootage: string;
  floors: string;
  budget: string;
  estimatedDuration: string;
  rooms: string[];
  materials: string[];
  features: string[];
  constructionPhases: ConstructionPhaseDraft[];
};

export const PLAN_TYPE_OPTIONS: { value: PlanTypeTag; label: string }[] = [
  { value: 'repair', label: 'Repair' },
  { value: 'upgrades', label: 'Upgrades' },
  { value: 'renovation', label: 'Renovation' },
  { value: 'full_builds', label: 'Full Builds' },
];

export const PLAN_TYPE_FILTER_OPTIONS: Record<PlanTypeTag, string[]> = {
  repair: [
    'Electricals',
    'Plumbing Fixes',
    'Roof Leak Repair',
    'Drainage Fix',
    'Bathroom Repair',
    'Gate/Fence Repair',
  ],
  upgrades: [
    'Kitchen Upgrade',
    'Bedroom Upgrade',
    'Security Gate Upgrade',
    'Door Upgrade',
    'Bathroom Upgrade',
    'Lighting Upgrade',
  ],
  renovation: [
    'Room-by-Room',
    'Occupied Home',
    'Family Home Rehab',
    'Rental Prep',
    'Interior Refresh',
  ],
  full_builds: [
    'Bungalow Build',
    'Duplex Build',
    'Blockwork + Roofing',
    'Shell to Finish',
    'Turnkey Build',
  ],
};

export const CUSTOM_FILTER_VALUE = '__custom__';

export function createEmptyPhase(): ConstructionPhaseDraft {
  return {
    name: '',
    description: '',
    estimatedDuration: '1 week',
    estimatedCost: '',
  };
}

export function createDefaultScope(): ManagedProjectScope {
  return {
    name: '',
    address: '',
    description: '',
    scopeSummary: '',
    planType: 'repair',
    projectTypeFilter: PLAN_TYPE_FILTER_OPTIONS.repair[0],
    customProjectTypeFilter: '',
    bedrooms: '1',
    bathrooms: '1',
    squareFootage: '320',
    floors: '1',
    budget: '',
    estimatedDuration: '4 weeks',
    rooms: [],
    materials: [],
    features: [],
    constructionPhases: [createEmptyPhase()],
  };
}

function ListEditor({
  label,
  items,
  placeholder,
  onChange,
}: {
  label: string;
  items: string[];
  placeholder: string;
  onChange: (items: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <button
          type="button"
          className="text-xs inline-flex items-center gap-1 text-indigo-700"
          onClick={() => onChange([...items, ''])}
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-gray-500">None added yet.</p>
      ) : (
        items.map((item, index) => (
          <div key={`${label}-${index}`} className="flex items-center gap-2">
            <input
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[index] = e.target.value;
                onChange(next);
              }}
              placeholder={placeholder}
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="button"
              className="p-2 rounded-lg border text-red-600"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}

type Props = {
  scope: ManagedProjectScope;
  onChange: (scope: ManagedProjectScope) => void;
};

export function ManagedProjectScopeFields({ scope, onChange }: Props) {
  const filterOptions = PLAN_TYPE_FILTER_OPTIONS[scope.planType] || [];

  const update = (patch: Partial<ManagedProjectScope>) => {
    onChange({ ...scope, ...patch });
  };

  const updatePhase = (index: number, patch: Partial<ConstructionPhaseDraft>) => {
    const next = scope.constructionPhases.map((phase, i) =>
      i === index ? { ...phase, ...patch } : phase,
    );
    update({ constructionPhases: next });
  };

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-sm font-semibold text-gray-900">Project scope</h4>
        <p className="text-xs text-gray-500 mt-1">
          Define the plan the same way a GC would upload it. Homeowner and GC tracking links will
          reflect this scope.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-gray-700">Project name</span>
          <input
            value={scope.name}
            onChange={(e) => update({ name: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Electricity Fix"
          />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-gray-700">Site address</span>
          <input
            value={scope.address}
            onChange={(e) => update({ address: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="University of Lagos, Yaba"
          />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-gray-700">Description</span>
          <textarea
            value={scope.description}
            onChange={(e) => update({ description: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px]"
            placeholder="Describe the work scope..."
          />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-gray-700">GC project summary note</span>
          <textarea
            value={scope.scopeSummary}
            onChange={(e) => update({ scopeSummary: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm min-h-[72px]"
            placeholder="Shown on the homeowner dashboard as the GC project summary."
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1">
          <span className="text-sm font-medium text-gray-700">Plan type</span>
          <select
            value={scope.planType}
            onChange={(e) => {
              const planType = e.target.value as PlanTypeTag;
              update({
                planType,
                projectTypeFilter: PLAN_TYPE_FILTER_OPTIONS[planType][0],
                customProjectTypeFilter: '',
              });
            }}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            {PLAN_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-gray-700">Project filter</span>
          <select
            value={scope.projectTypeFilter}
            onChange={(e) => update({ projectTypeFilter: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            {filterOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            <option value={CUSTOM_FILTER_VALUE}>Custom</option>
          </select>
        </label>
        {scope.projectTypeFilter === CUSTOM_FILTER_VALUE && (
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium text-gray-700">Custom filter</span>
            <input
              value={scope.customProjectTypeFilter}
              onChange={(e) => update({ customProjectTypeFilter: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </label>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ['Bedrooms', 'bedrooms'],
          ['Bathrooms', 'bathrooms'],
          ['Sq ft', 'squareFootage'],
          ['Floors', 'floors'],
        ].map(([label, key]) => (
          <label key={key} className="space-y-1">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <input
              value={scope[key as keyof ManagedProjectScope] as string}
              onChange={(e) => update({ [key]: e.target.value } as Partial<ManagedProjectScope>)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              inputMode="numeric"
            />
          </label>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1">
          <span className="text-sm font-medium text-gray-700">Estimated budget (₦)</span>
          <input
            value={scope.budget}
            onChange={(e) => update({ budget: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            inputMode="numeric"
            placeholder="Auto-sums phases if left blank"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-gray-700">Estimated duration</span>
          <input
            value={scope.estimatedDuration}
            onChange={(e) => update({ estimatedDuration: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="5 weeks"
          />
        </label>
      </div>

      <ListEditor
        label="Rooms"
        items={scope.rooms}
        placeholder="kitchen"
        onChange={(rooms) => update({ rooms })}
      />
      <ListEditor
        label="Key materials"
        items={scope.materials}
        placeholder="Concrete, Steel, Wood"
        onChange={(materials) => update({ materials })}
      />
      <ListEditor
        label="Features"
        items={scope.features}
        placeholder="Smart lighting"
        onChange={(features) => update({ features })}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-sm font-semibold text-gray-900">Construction phases</h5>
            <p className="text-xs text-gray-500">These become the project timeline stages.</p>
          </div>
          <button
            type="button"
            className="text-sm inline-flex items-center gap-1 text-indigo-700"
            onClick={() =>
              update({ constructionPhases: [...scope.constructionPhases, createEmptyPhase()] })
            }
          >
            <Plus className="w-4 h-4" />
            Add phase
          </button>
        </div>

        {scope.constructionPhases.map((phase, index) => (
          <div key={`phase-${index}`} className="rounded-lg border p-4 space-y-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Phase {index + 1}</span>
              {scope.constructionPhases.length > 1 && (
                <button
                  type="button"
                  className="text-xs text-red-600 inline-flex items-center gap-1"
                  onClick={() =>
                    update({
                      constructionPhases: scope.constructionPhases.filter((_, i) => i !== index),
                    })
                  }
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              )}
            </div>
            <input
              value={phase.name}
              onChange={(e) => updatePhase(index, { name: e.target.value })}
              placeholder="Identify Problem"
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
            />
            <textarea
              value={phase.description}
              onChange={(e) => updatePhase(index, { description: e.target.value })}
              placeholder="Phase details"
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white min-h-[64px]"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={phase.estimatedDuration}
                onChange={(e) => updatePhase(index, { estimatedDuration: e.target.value })}
                placeholder="Duration (e.g. 2 hours)"
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
              />
              <input
                value={phase.estimatedCost}
                onChange={(e) => updatePhase(index, { estimatedCost: e.target.value })}
                placeholder="Cost (₦)"
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                inputMode="numeric"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function buildManagedProjectPayload(
  scope: ManagedProjectScope,
  contacts: {
    homeownerName: string;
    homeownerEmail: string;
    homeownerPhone?: string;
    gcName: string;
    gcEmail: string;
    gcPhone?: string;
  },
) {
  const phases = scope.constructionPhases
    .map((phase) => ({
      name: phase.name.trim(),
      description: phase.description.trim(),
      estimatedDuration: phase.estimatedDuration.trim() || '1 week',
      estimatedCost: Number(phase.estimatedCost || 0),
    }))
    .filter((phase) => phase.name);

  const phaseBudgetTotal = phases.reduce((sum, phase) => sum + phase.estimatedCost, 0);
  const budget = Number(scope.budget || phaseBudgetTotal || 0);
  const resolvedFilter =
    scope.projectTypeFilter === CUSTOM_FILTER_VALUE
      ? scope.customProjectTypeFilter.trim()
      : scope.projectTypeFilter.trim();

  return {
    name: scope.name.trim(),
    address: scope.address.trim(),
    description: scope.description.trim() || undefined,
    scopeSummary: scope.scopeSummary.trim() || undefined,
    budget,
    projectTypeTag: scope.planType,
    projectTypeFilter: resolvedFilter || undefined,
    bedrooms: Number(scope.bedrooms || 1),
    bathrooms: Number(scope.bathrooms || 1),
    squareFootage: Number(scope.squareFootage || 0),
    floors: Number(scope.floors || 1),
    estimatedDuration: scope.estimatedDuration.trim() || undefined,
    rooms: scope.rooms.map((item) => item.trim()).filter(Boolean),
    materials: scope.materials.map((item) => item.trim()).filter(Boolean),
    features: scope.features.map((item) => item.trim()).filter(Boolean),
    constructionPhases: phases,
    homeownerName: contacts.homeownerName.trim(),
    homeownerEmail: contacts.homeownerEmail.trim().toLowerCase(),
    homeownerPhone: contacts.homeownerPhone?.trim() || undefined,
    gcName: contacts.gcName.trim(),
    gcEmail: contacts.gcEmail.trim().toLowerCase(),
    gcPhone: contacts.gcPhone?.trim() || undefined,
  };
}

export function validateManagedProjectScope(
  scope: ManagedProjectScope,
  contacts: {
    homeownerName: string;
    homeownerEmail: string;
    gcName: string;
    gcEmail: string;
  },
): string | null {
  if (!scope.name.trim() || !scope.address.trim()) {
    return 'Enter the project name and site address.';
  }
  if (!contacts.homeownerName.trim() || !contacts.homeownerEmail.trim()) {
    return 'Enter homeowner contact details.';
  }
  if (!contacts.gcName.trim() || !contacts.gcEmail.trim()) {
    return 'Enter general contractor contact details.';
  }
  const phases = scope.constructionPhases.filter((phase) => phase.name.trim());
  if (phases.length === 0) {
    return 'Add at least one construction phase with a name.';
  }
  return null;
}
