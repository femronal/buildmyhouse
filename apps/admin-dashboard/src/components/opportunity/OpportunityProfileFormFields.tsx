'use client';

import {
  BUILD_OPPORTUNITY_CATEGORY_OPTIONS,
  BUILD_OPPORTUNITY_TYPE_OPTIONS,
  getOpportunityProfile,
  type BuildOpportunityCategoryKey,
  type OpportunityEntity,
  type OpportunityFieldDef,
} from '@buildmyhouse/shared-types';
import { OpportunityPhosphorIcon } from './OpportunityPhosphorIcon';

type FormRecord = Record<string, string>;

type Props<T extends FormRecord = FormRecord> = {
  entity: OpportunityEntity;
  form: T;
  setForm: React.Dispatch<React.SetStateAction<T>>;
};

function fieldGridClass(field: OpportunityFieldDef): string {
  if (field.gridSpan === 2) return 'md:col-span-2';
  if (field.gridSpan === 3) return 'md:col-span-3';
  if (field.gridSpan === 4) return 'md:col-span-4';
  return '';
}

function renderFieldInput<T extends FormRecord>(
  field: OpportunityFieldDef,
  form: T,
  setForm: React.Dispatch<React.SetStateAction<T>>,
) {
  const commonClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10';
  const value = form[field.key] ?? '';

  if (field.kind === 'textarea') {
    return (
      <textarea
        rows={3}
        required={field.required}
        placeholder={field.placeholder}
        value={value}
        onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
        className={commonClass}
      />
    );
  }

  const inputType =
    field.kind === 'number' || field.kind === 'currency' || field.kind === 'percent' ? 'number' : 'text';

  return (
    <input
      type={inputType}
      required={field.required}
      min={field.min}
      placeholder={field.placeholder}
      value={value}
      onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
      className={commonClass}
    />
  );
}

export function OpportunityProfileFormFields<T extends FormRecord>({ entity, form, setForm }: Props<T>) {
  const category = (form.opportunityCategory || 'residential') as BuildOpportunityCategoryKey;
  const profile = getOpportunityProfile(entity, category);
  const typeOptions = BUILD_OPPORTUNITY_TYPE_OPTIONS[category] ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-black text-white">
            <OpportunityPhosphorIcon name="Buildings" size={18} weight="bold" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{profile.entityLabel}</p>
            <p className="text-sm text-gray-600">{profile.formIntro}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <OpportunityPhosphorIcon name="MapPinArea" size={18} weight="bold" className="text-gray-900" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Build plan & filter</p>
            <p className="text-xs text-gray-500">Category and type drive the fields homeowners see.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Build category *</label>
            <select
              value={form.opportunityCategory || 'residential'}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  opportunityCategory: e.target.value,
                  opportunityType: '',
                  opportunityTypeCustom: '',
                }))
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              {BUILD_OPPORTUNITY_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specific filter *</label>
            <select
              value={form.opportunityType || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, opportunityType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">Select filter</option>
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
              <option value="__custom__">Custom filter...</option>
            </select>
          </div>
        </div>
        {form.opportunityType === '__custom__' ? (
          <input
            type="text"
            placeholder="Custom filter (e.g. mixed_use_residential_hub)"
            value={form.opportunityTypeCustom || ''}
            onChange={(e) => setForm((prev) => ({ ...prev, opportunityTypeCustom: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        ) : null}
      </div>

      {profile.sections.map((section) => (
        <div key={section.id} className="rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="flex items-center gap-2">
            {section.icon ? (
              <OpportunityPhosphorIcon name={section.icon} size={18} weight="bold" className="text-gray-900" />
            ) : null}
            <div>
              <p className="text-sm font-semibold text-gray-900">{section.title}</p>
              {section.subtitle ? <p className="text-xs text-gray-500">{section.subtitle}</p> : null}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {section.fields.map((field) => (
              <div key={field.key} className={fieldGridClass(field)}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.required ? ' *' : ''}
                </label>
                {renderFieldInput(field, form, setForm)}
                {field.helpText ? <p className="mt-1 text-xs text-gray-500">{field.helpText}</p> : null}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
