'use client';

import { Plus, Trash2, UploadCloud } from 'lucide-react';
import { api } from '@/lib/api';
import type { ServicePagePayload } from '@/hooks/useCmsServicePages';

type ServicePageEditorFormProps = {
  payload: ServicePagePayload;
  onChange: (next: ServicePagePayload) => void;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-xs font-semibold text-gray-700">{label}</span> : null}
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ${props.className || ''}`}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[88px] ${props.className || ''}`}
    />
  );
}

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <TextInput value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://..." />
        <label className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-xs cursor-pointer hover:bg-gray-50 shrink-0">
          <UploadCloud className="w-3.5 h-3.5" />
          Upload
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const result = await api.uploadFile(file);
              onChange(result.url);
              e.target.value = '';
            }}
          />
        </label>
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="px-3 py-2 rounded-lg border border-red-200 text-xs text-red-700 hover:bg-red-50 shrink-0"
          >
            Remove
          </button>
        ) : null}
      </div>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="mt-2 h-20 w-full max-w-xs rounded-lg object-cover border" />
      ) : null}
    </Field>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open className="rounded-xl border border-gray-200 bg-white">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-900">{title}</summary>
      <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">{children}</div>
    </details>
  );
}

export default function ServicePageEditorForm({ payload, onChange }: ServicePageEditorFormProps) {
  const patch = (partial: Partial<ServicePagePayload>) => onChange({ ...payload, ...partial });
  const patchImages = (partial: Partial<ServicePagePayload['images']>) =>
    onChange({ ...payload, images: { ...payload.images, ...partial } });

  return (
    <div className="space-y-4">
      <Section title="Hero & location">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Headline (large hero word)">
            <TextInput value={payload.headline} onChange={(e) => patch({ headline: e.target.value })} />
          </Field>
          <Field label="Location label">
            <TextInput value={payload.locationLabel} onChange={(e) => patch({ locationLabel: e.target.value })} />
          </Field>
        </div>
        <Field label="Hero lead paragraph">
          <TextArea value={payload.heroLead} onChange={(e) => patch({ heroLead: e.target.value })} />
        </Field>
        <Field label="Hero meta line (smaller supporting text)">
          <TextInput value={payload.heroMeta} onChange={(e) => patch({ heroMeta: e.target.value })} />
        </Field>
        <Field label="Trust words (comma-separated — animates in trust section)">
          <TextInput
            value={payload.trustWords.join(', ')}
            onChange={(e) =>
              patch({
                trustWords: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </Field>
      </Section>

      <Section title="Section headings">
        <Field label="Pillars headline">
          <TextArea value={payload.pillarsHeadline} onChange={(e) => patch({ pillarsHeadline: e.target.value })} />
        </Field>
        <Field label="Archive gallery title">
          <TextInput value={payload.archiveTitle} onChange={(e) => patch({ archiveTitle: e.target.value })} />
        </Field>
        <Field label="Field notes heading">
          <TextInput value={payload.fieldNotesHeading} onChange={(e) => patch({ fieldNotesHeading: e.target.value })} />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Work section title">
            <TextInput value={payload.workTitle} onChange={(e) => patch({ workTitle: e.target.value })} />
          </Field>
          <Field label="Work section body">
            <TextArea value={payload.workBody} onChange={(e) => patch({ workBody: e.target.value })} />
          </Field>
        </div>
        <Field label="Engage section intro">
          <TextArea value={payload.engageIntro} onChange={(e) => patch({ engageIntro: e.target.value })} />
        </Field>
        <Field label="Contact / final prompt">
          <TextArea value={payload.contactPrompt} onChange={(e) => patch({ contactPrompt: e.target.value })} />
        </Field>
      </Section>

      <Section title="Template images (fixed slots for page design)">
        <p className="text-xs text-gray-500">
          Hero, strip, parallax, and work-mask images — one slot each to match the page layout.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImageField label="Hero main" value={payload.images.heroMain} onChange={(url) => patchImages({ heroMain: url })} />
          <ImageField label="Hero accent" value={payload.images.heroAccent} onChange={(url) => patchImages({ heroAccent: url })} />
          <ImageField label="Why BuildMyHouse strip" value={payload.images.strip} onChange={(url) => patchImages({ strip: url })} />
          <ImageField label="Parallax image A" value={payload.images.parallaxA} onChange={(url) => patchImages({ parallaxA: url })} />
          <ImageField label="Parallax image B" value={payload.images.parallaxB} onChange={(url) => patchImages({ parallaxB: url })} />
          <ImageField label="Work mask (inside 04 typography)" value={payload.images.workMask} onChange={(url) => patchImages({ workMask: url })} />
        </div>
      </Section>

      <Section title="Evidence gallery (unlimited scroll photos)">
        <p className="text-xs text-gray-500">
          Field Archive section — add as many real job photos as you want. Visitors swipe through on mobile and scroll the full strip on desktop.
        </p>
        <div className="space-y-4">
          {payload.images.archive.map((url, index) => (
            <div key={`evidence-${index}`} className="rounded-lg border border-gray-100 p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-700">Evidence photo {index + 1}</span>
                <button
                  type="button"
                  onClick={() => {
                    const archive = payload.images.archive.filter((_, i) => i !== index);
                    patchImages({ archive });
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-red-200 text-[11px] text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove
                </button>
              </div>
              <ImageField
                label=""
                value={url}
                onChange={(nextUrl) => {
                  const archive = [...payload.images.archive];
                  archive[index] = nextUrl;
                  patchImages({ archive });
                }}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => patchImages({ archive: [...payload.images.archive, ''] })}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-800 hover:bg-gray-50"
        >
          <Plus className="w-3.5 h-3.5" />
          Add evidence photo
        </button>
      </Section>

      <Section title="Pillars (4 trust cards)">
        {payload.pillars.map((pillar, index) => (
          <div key={index} className="rounded-lg border border-gray-100 p-3 space-y-2">
            <Field label={`Pillar ${index + 1} title`}>
              <TextInput
                value={pillar.title}
                onChange={(e) => {
                  const pillars = [...payload.pillars];
                  pillars[index] = { ...pillars[index], title: e.target.value };
                  patch({ pillars });
                }}
              />
            </Field>
            <Field label="Body">
              <TextArea
                value={pillar.body}
                onChange={(e) => {
                  const pillars = [...payload.pillars];
                  pillars[index] = { ...pillars[index], body: e.target.value };
                  patch({ pillars });
                }}
              />
            </Field>
          </div>
        ))}
      </Section>

      <Section title="Stats, process & field notes">
        <p className="text-xs font-semibold text-gray-600">Stats row</p>
        {payload.stats.map((stat, index) => (
          <div key={index} className="grid grid-cols-2 gap-3">
            <Field label={`Stat ${index + 1} value`}>
              <TextInput
                value={stat.value}
                onChange={(e) => {
                  const stats = [...payload.stats];
                  stats[index] = { ...stats[index], value: e.target.value };
                  patch({ stats });
                }}
              />
            </Field>
            <Field label="Label">
              <TextInput
                value={stat.label}
                onChange={(e) => {
                  const stats = [...payload.stats];
                  stats[index] = { ...stats[index], label: e.target.value };
                  patch({ stats });
                }}
              />
            </Field>
          </div>
        ))}
        <p className="text-xs font-semibold text-gray-600 pt-2">Process steps</p>
        {payload.processSteps.map((step, index) => (
          <div key={index} className="rounded-lg border border-gray-100 p-3 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <Field label="Label">
                <TextInput
                  value={step.label}
                  onChange={(e) => {
                    const processSteps = [...payload.processSteps];
                    processSteps[index] = { ...processSteps[index], label: e.target.value };
                    patch({ processSteps });
                  }}
                />
              </Field>
              <Field label="Title">
                <TextInput
                  value={step.title}
                  onChange={(e) => {
                    const processSteps = [...payload.processSteps];
                    processSteps[index] = { ...processSteps[index], title: e.target.value };
                    patch({ processSteps });
                  }}
                />
              </Field>
            </div>
            <Field label="Body">
              <TextArea
                value={step.body}
                onChange={(e) => {
                  const processSteps = [...payload.processSteps];
                  processSteps[index] = { ...processSteps[index], body: e.target.value };
                  patch({ processSteps });
                }}
              />
            </Field>
          </div>
        ))}
        <p className="text-xs font-semibold text-gray-600 pt-2">Field notes</p>
        {payload.fieldNotes.map((note, index) => (
          <div key={index} className="rounded-lg border border-gray-100 p-3 space-y-2">
            <div className="grid grid-cols-4 gap-2">
              <Field label="Number">
                <TextInput
                  value={note.number}
                  onChange={(e) => {
                    const fieldNotes = [...payload.fieldNotes];
                    fieldNotes[index] = { ...fieldNotes[index], number: e.target.value };
                    patch({ fieldNotes });
                  }}
                />
              </Field>
              <div className="col-span-3">
                <Field label="Title">
                  <TextInput
                    value={note.title}
                    onChange={(e) => {
                      const fieldNotes = [...payload.fieldNotes];
                      fieldNotes[index] = { ...fieldNotes[index], title: e.target.value };
                      patch({ fieldNotes });
                    }}
                  />
                </Field>
              </div>
            </div>
            <Field label="Body">
              <TextArea
                value={note.body}
                onChange={(e) => {
                  const fieldNotes = [...payload.fieldNotes];
                  fieldNotes[index] = { ...fieldNotes[index], body: e.target.value };
                  patch({ fieldNotes });
                }}
              />
            </Field>
          </div>
        ))}
      </Section>

      <Section title="Reviews, FAQs & CTAs">
        {payload.reviews.map((review, index) => (
          <div key={index} className="rounded-lg border border-gray-100 p-3 space-y-2">
            <Field label={`Review ${index + 1} quote`}>
              <TextArea
                value={review.quote}
                onChange={(e) => {
                  const reviews = [...payload.reviews];
                  reviews[index] = { ...reviews[index], quote: e.target.value };
                  patch({ reviews });
                }}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name">
                <TextInput
                  value={review.name}
                  onChange={(e) => {
                    const reviews = [...payload.reviews];
                    reviews[index] = { ...reviews[index], name: e.target.value };
                    patch({ reviews });
                  }}
                />
              </Field>
              <Field label="Detail">
                <TextInput
                  value={review.detail}
                  onChange={(e) => {
                    const reviews = [...payload.reviews];
                    reviews[index] = { ...reviews[index], detail: e.target.value };
                    patch({ reviews });
                  }}
                />
              </Field>
            </div>
          </div>
        ))}
        {payload.faqs.map((faq, index) => (
          <div key={index} className="rounded-lg border border-gray-100 p-3 space-y-2">
            <Field label={`FAQ ${index + 1} question`}>
              <TextInput
                value={faq.question}
                onChange={(e) => {
                  const faqs = [...payload.faqs];
                  faqs[index] = { ...faqs[index], question: e.target.value };
                  patch({ faqs });
                }}
              />
            </Field>
            <Field label="Answer">
              <TextArea
                value={faq.answer}
                onChange={(e) => {
                  const faqs = [...payload.faqs];
                  faqs[index] = { ...faqs[index], answer: e.target.value };
                  patch({ faqs });
                }}
              />
            </Field>
          </div>
        ))}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Primary CTA label">
            <TextInput
              value={payload.primaryCta.label}
              onChange={(e) => patch({ primaryCta: { ...payload.primaryCta, label: e.target.value } })}
            />
          </Field>
          <Field label="Primary CTA link">
            <TextInput
              value={payload.primaryCta.href}
              onChange={(e) => patch({ primaryCta: { ...payload.primaryCta, href: e.target.value } })}
            />
          </Field>
          <Field label="Secondary CTA label">
            <TextInput
              value={payload.secondaryCta.label}
              onChange={(e) => patch({ secondaryCta: { ...payload.secondaryCta, label: e.target.value } })}
            />
          </Field>
          <Field label="Secondary CTA link">
            <TextInput
              value={payload.secondaryCta.href}
              onChange={(e) => patch({ secondaryCta: { ...payload.secondaryCta, href: e.target.value } })}
            />
          </Field>
        </div>
      </Section>

      <Section title="Engage cards & related links">
        {payload.engageCards.map((card, index) => (
          <div key={index} className="rounded-lg border border-gray-100 p-3 space-y-2">
            <Field label={`Card ${index + 1} title`}>
              <TextInput
                value={card.title}
                onChange={(e) => {
                  const engageCards = [...payload.engageCards];
                  engageCards[index] = { ...engageCards[index], title: e.target.value };
                  patch({ engageCards });
                }}
              />
            </Field>
            <Field label="Subtitle">
              <TextInput
                value={card.subtitle}
                onChange={(e) => {
                  const engageCards = [...payload.engageCards];
                  engageCards[index] = { ...engageCards[index], subtitle: e.target.value };
                  patch({ engageCards });
                }}
              />
            </Field>
            {index === 0 ? (
              <Field label="Badge (optional)">
                <TextInput
                  value={card.badge || ''}
                  onChange={(e) => {
                    const engageCards = [...payload.engageCards];
                    engageCards[index] = { ...engageCards[index], badge: e.target.value || undefined };
                    patch({ engageCards });
                  }}
                />
              </Field>
            ) : null}
            <Field label="Features (one per line)">
              <TextArea
                value={card.features.join('\n')}
                onChange={(e) => {
                  const engageCards = [...payload.engageCards];
                  engageCards[index] = {
                    ...engageCards[index],
                    features: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                  };
                  patch({ engageCards });
                }}
              />
            </Field>
          </div>
        ))}
        {payload.articleLinks.map((link, index) => (
          <div key={index} className="grid grid-cols-2 gap-3">
            <Field label={`Related link ${index + 1} label`}>
              <TextInput
                value={link.label}
                onChange={(e) => {
                  const articleLinks = [...payload.articleLinks];
                  articleLinks[index] = { ...articleLinks[index], label: e.target.value };
                  patch({ articleLinks });
                }}
              />
            </Field>
            <Field label="Href">
              <TextInput
                value={link.href}
                onChange={(e) => {
                  const articleLinks = [...payload.articleLinks];
                  articleLinks[index] = { ...articleLinks[index], href: e.target.value };
                  patch({ articleLinks });
                }}
              />
            </Field>
          </div>
        ))}
      </Section>
    </div>
  );
}
