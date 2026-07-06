'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AdminStageEditor } from '@/components/AdminStageEditor';
import { adminProjectService } from '@/services/adminProjectService';

export default function AdminStageDetailPage() {
  const params = useParams();
  const projectId = String(params.id || '');
  const stageId = String(params.stageId || '');

  const projectQuery = useQuery({
    queryKey: ['admin-project', projectId],
    queryFn: () => adminProjectService.getProject(projectId),
    enabled: !!projectId,
  });

  const project = projectQuery.data;
  const stage = project?.stages?.find((s) => s.id === stageId);

  if (projectQuery.isLoading) {
    return <div className="p-8 text-gray-500">Loading stage…</div>;
  }

  if (!project || !stage) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-red-600">Stage not found.</p>
        <Link href={`/projects/${projectId}`} className="text-blue-600 text-sm">
          Back to project
        </Link>
      </div>
    );
  }

  return <AdminStageEditor projectId={projectId} stageId={stageId} project={project} stage={stage} />;
}
