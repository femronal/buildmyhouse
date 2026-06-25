'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Globe, Save, Send } from 'lucide-react';
import AdminFeedbackModal, { closedAdminFeedback, type AdminFeedbackState } from '@/components/AdminFeedbackModal';
import ServicePageEditorForm from '@/components/service-pages/ServicePageEditorForm';
import {
  SERVICE_PAGE_TEMPLATE_KINDS,
  useCmsServicePage,
  useCmsServicePages,
  useServicePageTemplate,
  type ServicePagePayload,
  type ServicePageRegion,
  type UpsertCmsServicePagePayload,
} from '@/hooks/useCmsServicePages';

type FormState = {
  slug: string;
  region: ServicePageRegion;
  templateKind: string;
  metaTitle: string;
  summary: string;
  canonicalPath: string;
  payload: ServicePagePayload;
  isPublished: boolean;
};

function defaultCanonicalPath(region: ServicePageRegion, slug: string) {
  return region === 'lagos' ? `/services/lagos/${slug}` : `/services/${slug}-nigeria`;
}

function emptyForm(region: ServicePageRegion): FormState {
  return {
    slug: '',
    region,
    templateKind: 'plumbing-repair',
    metaTitle: '',
    summary: '',
    canonicalPath: '',
    payload: {
      locationLabel: region === 'lagos' ? 'Lagos, Nigeria' : 'Nigeria',
      headline: '',
      heroLead: '',
      heroMeta: '',
      trustWords: ['verify', 'scope', 'track', 'approve'],
      pillarsHeadline: '',
      archiveTitle: '',
      fieldNotesHeading: '',
      workTitle: '04 tracked stages',
      workBody: '',
      engageIntro: '',
      contactPrompt: '',
      engageCards: [],
      pillars: [],
      stats: [],
      processSteps: [],
      fieldNotes: [],
      reviews: [],
      faqs: [],
      articleLinks: [],
      images: {
        heroMain: '',
        heroAccent: '',
        strip: '',
        parallaxA: '',
        parallaxB: '',
        workMask: '',
        archive: [],
      },
      primaryCta: { label: 'Start a Tracked Repair', href: '/start-repair' },
      secondaryCta: { label: 'Browse Verified Plans', href: '/location?mode=explore' },
    },
    isPublished: false,
  };
}

function toFormState(page: {
  slug: string;
  region: ServicePageRegion;
  templateKind: string;
  metaTitle: string;
  summary: string;
  canonicalPath: string;
  payload: ServicePagePayload;
  isPublished: boolean;
}): FormState {
  return {
    slug: page.slug,
    region: page.region,
    templateKind: page.templateKind,
    metaTitle: page.metaTitle,
    summary: page.summary,
    canonicalPath: page.canonicalPath,
    payload: page.payload,
    isPublished: page.isPublished,
  };
}

export default function ServicePageEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageId = searchParams.get('id');
  const initialRegion = (searchParams.get('region') as ServicePageRegion) || 'lagos';
  const initialTemplateKind = searchParams.get('templateKind') || 'plumbing-repair';
  const initialSlug = searchParams.get('slug') || '';

  const { data: existingPage, isLoading: isLoadingPage } = useCmsServicePage(pageId);
  const { createPageFromTemplate, updatePage } = useCmsServicePages();

  const [form, setForm] = useState<FormState>(() => {
    const slug =
      initialSlug ||
      (initialRegion === 'lagos' ? initialTemplateKind : `${initialTemplateKind}-nigeria`);
    return {
      ...emptyForm(initialRegion),
      templateKind: initialTemplateKind,
      slug,
      canonicalPath: defaultCanonicalPath(initialRegion, slug),
    };
  });
  const [saving, setSaving] = useState(false);
  const [pendingAction, setPendingAction] = useState<'draft' | 'publish' | null>(null);
  const [feedback, setFeedback] = useState<AdminFeedbackState>(() => closedAdminFeedback());

  const templateQuery = useServicePageTemplate(
    !pageId ? form.templateKind : undefined,
    !pageId ? form.region : undefined,
    !pageId ? form.slug || form.templateKind : undefined,
  );

  useEffect(() => {
    if (existingPage) {
      setForm(toFormState(existingPage));
    }
  }, [existingPage]);

  useEffect(() => {
    if (pageId || !templateQuery.data) return;
    setForm((prev) => ({
      ...prev,
      metaTitle: prev.metaTitle || templateQuery.data!.metaTitle,
      summary: prev.summary || templateQuery.data!.summary,
      canonicalPath: prev.canonicalPath || templateQuery.data!.canonicalPath,
      payload: prev.payload.headline ? prev.payload : templateQuery.data!.payload,
    }));
  }, [pageId, templateQuery.data]);

  const previewUrl = useMemo(() => {
    const path = form.canonicalPath || defaultCanonicalPath(form.region, form.slug || form.templateKind);
    return `https://buildmyhouse.app${path}`;
  }, [form.canonicalPath, form.region, form.slug, form.templateKind]);

  const handleSave = async (publish?: boolean) => {
    setSaving(true);
    setPendingAction(publish ? 'publish' : 'draft');
    setFeedback(closedAdminFeedback());
    try {
      const slug = form.slug.trim() || form.templateKind;
      const payload: UpsertCmsServicePagePayload = {
        slug,
        region: form.region,
        templateKind: form.templateKind,
        metaTitle: form.metaTitle,
        summary: form.summary,
        canonicalPath: form.canonicalPath || defaultCanonicalPath(form.region, slug),
        payload: form.payload,
        isPublished: publish ?? form.isPublished,
      };

      if (pageId) {
        await updatePage({
          id: pageId,
          payload: { ...payload, isPublished: publish ?? form.isPublished },
        });
      } else {
        const created = await createPageFromTemplate({
          slug,
          region: form.region,
          templateKind: form.templateKind,
          metaTitle: form.metaTitle,
          summary: form.summary,
        });
        await updatePage({ id: created.id, payload: { ...payload, slug: created.slug } });
        router.replace(`/service-pages/editor?id=${created.id}&region=${created.region}`);
      }

      const pageLabel = form.payload.headline?.trim() || form.metaTitle.trim() || slug;
      const livePath = form.canonicalPath || defaultCanonicalPath(form.region, slug);

      if (publish) {
        setForm((prev) => ({ ...prev, isPublished: true }));
        setFeedback({
          open: true,
          tone: 'success',
          title: 'Service Page Published',
          message: `"${pageLabel}" is now live on BuildMyHouse. Homeowners can view the updated page immediately.`,
          liveUrl: `https://buildmyhouse.app${livePath}`,
        });
        return;
      }

      setFeedback({
        open: true,
        tone: 'success',
        title: 'Draft Saved',
        message: `Your edits to "${pageLabel}" were saved as a draft.`,
      });
    } catch (err: any) {
      const message =
        err?.message ||
        (publish ? 'Could not publish this service page right now.' : 'Could not save this service page right now.');
      setFeedback({
        open: true,
        tone: 'error',
        title: publish ? 'Publish Failed' : 'Save Failed',
        message,
      });
    } finally {
      setSaving(false);
      setPendingAction(null);
    }
  };

  if (pageId && isLoadingPage) {
    return <div className="p-8 text-gray-500">Loading service page...</div>;
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link href="/articles?tab=service-pages" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-3">
            <ArrowLeft className="w-4 h-4" />
            Back to Content
          </Link>
          <h1 className="text-3xl font-bold font-poppins">
            {pageId ? 'Edit service page' : 'New service page'}
          </h1>
          <p className="text-gray-500 mt-1">
            Uses the same animated service template on the public site.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm flex items-center gap-2 hover:bg-gray-50"
          >
            <Globe className="w-4 h-4" />
            Preview
          </a>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(false)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm flex items-center gap-2 hover:bg-gray-50 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {pendingAction === 'draft' ? 'Saving…' : 'Save draft'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(true)}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {pendingAction === 'publish' ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>

      <AdminFeedbackModal
        open={feedback.open}
        title={feedback.title}
        message={feedback.message}
        tone={feedback.tone}
        liveUrl={feedback.liveUrl}
        onClose={() => setFeedback(closedAdminFeedback())}
      />

      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Page setup & SEO</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-gray-700">Region</span>
            <select
              value={form.region}
              disabled={Boolean(pageId)}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  region: e.target.value as ServicePageRegion,
                  payload: {
                    ...prev.payload,
                    locationLabel: e.target.value === 'lagos' ? 'Lagos, Nigeria' : 'Nigeria',
                  },
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="lagos">Lagos — /services/lagos/*</option>
              <option value="nigeria">Nigeria — /services/*-nigeria</option>
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-gray-700">URL slug</span>
            <input
              value={form.slug}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  slug: e.target.value,
                  canonicalPath: prev.canonicalPath || defaultCanonicalPath(prev.region, e.target.value || prev.templateKind),
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="plumbing-repair"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-gray-700">Template kind</span>
            <select
              value={form.templateKind}
              onChange={(e) => setForm((prev) => ({ ...prev, templateKind: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {SERVICE_PAGE_TEMPLATE_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5 md:col-span-2">
            <span className="text-xs font-semibold text-gray-700">SEO title (Google)</span>
            <input
              value={form.metaTitle}
              onChange={(e) => setForm((prev) => ({ ...prev, metaTitle: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1.5 md:col-span-2">
            <span className="text-xs font-semibold text-gray-700">Meta description</span>
            <textarea
              value={form.summary}
              onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[80px]"
            />
          </label>
          <label className="block space-y-1.5 md:col-span-2">
            <span className="text-xs font-semibold text-gray-700">Canonical path</span>
            <input
              value={form.canonicalPath || defaultCanonicalPath(form.region, form.slug || form.templateKind)}
              onChange={(e) => setForm((prev) => ({ ...prev, canonicalPath: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </div>

      <ServicePageEditorForm
        payload={form.payload}
        onChange={(payload) => setForm((prev) => ({ ...prev, payload }))}
      />
    </div>
  );
}
