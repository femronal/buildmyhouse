import { EmailService } from '../email/email.service';
import { getPlanRequestStep } from './plan-request-step';

export async function notifyPlanRequestLate(params: {
  prisma: any;
  emailService: EmailService;
  request: any;
  project: any;
  force?: boolean;
}) {
  const view = getPlanRequestStep(params.request, params.project, 'admin');
  if (view.state !== 'late') return view;
  if (!params.force && params.request.lateNotifiedStep === view.step) return view;

  const admins = await params.prisma.user.findMany({
    where: { role: 'admin' },
    select: { email: true, fullName: true },
  });
  for (const admin of admins) {
    const email = String(admin.email || '').trim();
    if (!email) continue;
    try {
      await params.emailService.sendNotificationEmail({
        to: email,
        recipientName: admin.fullName || 'Admin',
        recipientRole: 'admin',
        title: 'A project request needs a follow-up',
        message: `${params.project?.name || 'A project'} is late on step ${view.step} (${view.label}). ${view.lateReason || ''}`.trim(),
        data: { projectId: params.project?.id, requestId: params.request?.id },
      });
    } catch {
      // Keep going so one bad address does not block the rest.
    }
  }

  await params.prisma.projectRequest.update({
    where: { id: params.request.id },
    data: { lateNotifiedStep: view.step },
  });
  return view;
}
