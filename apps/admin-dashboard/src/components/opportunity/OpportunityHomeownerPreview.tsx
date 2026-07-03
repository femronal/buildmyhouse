'use client';

import {
  buildOpportunityDisplayData,
  formatBuildOpportunityKey,
  formatOpportunityCheckValue,
  getOpportunityProfile,
  splitCommaList,
  type BuildOpportunityCategoryKey,
  type OpportunityEntity,
} from '@buildmyhouse/shared-types';
import { OpportunityPhosphorIcon } from './OpportunityPhosphorIcon';

type Props = {
  entity: OpportunityEntity;
  form: Record<string, string>;
  previewImage?: string | null;
};

export function OpportunityHomeownerPreview({ entity, form, previewImage }: Props) {
  const category = (form.opportunityCategory || 'residential') as BuildOpportunityCategoryKey;
  const profile = getOpportunityProfile(entity, category);
  const title = form.name || form.title || 'Listing preview';
  const displayData = buildOpportunityDisplayData(entity, form);
  const verificationDocs = splitCommaList(form[profile.verificationDocField]);
  const extraDocs = profile.verificationExtraField
    ? splitCommaList(form[profile.verificationExtraField])
    : [];

  return (
    <div className="rounded-xl border border-gray-200 bg-[#050505] text-white overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10">
        <p className="text-xs uppercase tracking-wide text-white/60">Homeowner preview</p>
        <p className="text-sm font-semibold mt-1">{title}</p>
        <p className="text-xs text-white/70 mt-1">
          {formatBuildOpportunityKey(category)} • {formatBuildOpportunityKey(form.opportunityType || 'unspecified')}
        </p>
      </div>

      {previewImage ? (
        <img src={previewImage} alt="" className="w-full h-40 object-cover" />
      ) : (
        <div className="h-40 bg-white/5 flex items-center justify-center text-white/40 text-sm">
          Add photos to preview imagery
        </div>
      )}

      <div className="p-4 space-y-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-sm font-semibold mb-2">Opportunity Snapshot</p>
          <p className="text-xs text-white/70 mb-2">{profile.snapshotIntro}</p>
          {profile.snapshotRows.map((row) => (
            <p key={row.fieldKey} className="text-sm text-white/80">
              {row.label}: {formatOpportunityCheckValue(row, displayData)}
            </p>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-sm font-semibold mb-2">{profile.checksTitle}</p>
          {profile.checkRows.map((row) => (
            <div key={row.fieldKey} className="flex items-start gap-2 mb-2">
              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                <OpportunityPhosphorIcon name={row.icon} size={13} weight="bold" />
              </div>
              <p className="text-sm text-white/80 flex-1">
                {row.label}: {formatOpportunityCheckValue(row, displayData)}
              </p>
            </div>
          ))}
        </div>

        {(verificationDocs.length > 0 || extraDocs.length > 0) && (
          <div>
            <p className="text-sm font-semibold mb-2">{profile.verificationTitle}</p>
            <div className="flex flex-wrap gap-2">
              {[...verificationDocs, ...extraDocs].map((doc) => (
                <span
                  key={doc}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-black"
                >
                  <OpportunityPhosphorIcon name="Scroll" size={12} weight="bold" />
                  {doc}
                </span>
              ))}
            </div>
          </div>
        )}

        {form.description ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-sm font-semibold mb-1">Description</p>
            <p className="text-sm text-white/75 whitespace-pre-wrap">{form.description}</p>
          </div>
        ) : null}

        {form.location ? (
          <p className="text-xs text-white/60">
            Location: {form.location}
            {form.contactName ? ` • Contact: ${form.contactName}` : ''}
          </p>
        ) : null}

        <div className="rounded-full bg-white py-3 text-center text-sm font-semibold text-black">
          Request Property Inspection
        </div>
      </div>
    </div>
  );
}
