import { api } from '@/lib/api';
import { RESOURCE_SIDEBAR_TOPICS, type ResourceSidebarTopic } from '@/lib/resources-catalog';

export type RemoteResourceSection = {
  id?: string;
  key: string;
  label: string;
  hint?: string;
  sortOrder?: number;
};

export async function fetchResourceSections(): Promise<ResourceSidebarTopic[]> {
  try {
    const remote = await api.get<RemoteResourceSection[]>('/resource-sections');
    if (!Array.isArray(remote) || remote.length === 0) {
      return RESOURCE_SIDEBAR_TOPICS;
    }

    return remote
      .map((section) => ({
        key: String(section.key || '').trim(),
        label: String(section.label || '').trim(),
        hint: String(section.hint || '').trim(),
        sortOrder: Number(section.sortOrder || 0),
      }))
      .filter((section) => section.key && section.label)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
      .map(({ key, label, hint }) => ({ key, label, hint }));
  } catch {
    return RESOURCE_SIDEBAR_TOPICS;
  }
}

export function resolveSidebarTopics(sections: ResourceSidebarTopic[] | null | undefined): ResourceSidebarTopic[] {
  if (sections && sections.length > 0) return sections;
  return RESOURCE_SIDEBAR_TOPICS;
}
