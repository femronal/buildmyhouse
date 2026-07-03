'use client';

import { X } from 'lucide-react';
import type { RefObject } from 'react';
import type { OpportunityEntity } from '@buildmyhouse/shared-types';
import { OpportunityHomeownerPreview } from './OpportunityHomeownerPreview';
import { OpportunityPhotoFields, type OpportunityImageDraft } from './OpportunityPhotoFields';
import { OpportunityProfileFormFields } from './OpportunityProfileFormFields';

type FormRecord = Record<string, string>;

type Props<T extends FormRecord = FormRecord> = {
  title: string;
  entity: OpportunityEntity;
  form: T;
  setForm: React.Dispatch<React.SetStateAction<T>>;
  images: OpportunityImageDraft[];
  fileInputRef: RefObject<HTMLInputElement>;
  uploadError: string | null;
  isSubmitting: boolean;
  submitLabel: string;
  photoAddLabel?: string;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onAddImages: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onLabelChange: (index: number, label: string) => void;
};

export function OpportunityListingModal<T extends FormRecord>({
  title,
  entity,
  form,
  setForm,
  images,
  fileInputRef,
  uploadError,
  isSubmitting,
  submitLabel,
  photoAddLabel,
  onClose,
  onSubmit,
  onAddImages,
  onRemoveImage,
  onLabelChange,
}: Props<T>) {
  const previewImage = images[0]?.preview ?? null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-lg max-w-6xl w-full my-8 max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6">
          {uploadError ? (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-4">{uploadError}</div>
          ) : null}

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
            <div className="space-y-4">
              <OpportunityProfileFormFields entity={entity} form={form} setForm={setForm} />
              <OpportunityPhotoFields
                fileInputRef={fileInputRef}
                images={images}
                onAddImages={onAddImages}
                onRemoveImage={onRemoveImage}
                onLabelChange={onLabelChange}
                addLabel={photoAddLabel}
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : submitLabel}
                </button>
              </div>
            </div>

            <div className="xl:sticky xl:top-24 h-fit">
              <OpportunityHomeownerPreview entity={entity} form={form} previewImage={previewImage} />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
