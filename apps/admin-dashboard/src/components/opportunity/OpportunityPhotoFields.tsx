'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { RefObject } from 'react';

export type OpportunityImageDraft = {
  file?: File;
  url?: string;
  label: string;
  preview: string;
};

type Props = {
  fileInputRef: RefObject<HTMLInputElement>;
  images: OpportunityImageDraft[];
  onAddImages: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onLabelChange: (index: number, label: string) => void;
  addLabel?: string;
};

export function OpportunityPhotoFields({
  fileInputRef,
  images,
  onAddImages,
  onRemoveImage,
  onLabelChange,
  addLabel = 'Add photos',
}: Props) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Photos * (with labels)</label>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onAddImages}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center gap-2 text-gray-500 hover:border-gray-400"
      >
        <Plus className="w-5 h-5" />
        {addLabel}
      </button>
      <div className="mt-3 space-y-2">
        {images.map((img, index) => (
          <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
            <img src={img.preview} alt="" className="w-12 h-12 rounded object-cover" />
            <input
              type="text"
              placeholder="Label (e.g. Exterior, Living Room)"
              value={img.label}
              onChange={(e) => onLabelChange(index, e.target.value)}
              className="flex-1 px-2 py-1 border rounded text-sm"
            />
            <button
              type="button"
              onClick={() => onRemoveImage(index)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
