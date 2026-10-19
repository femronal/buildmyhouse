export function renderProjectRequestEmail(params: {
  contractorName: string;
  homeownerFirstName: string;
  planTitle: string;
  location: string;
  projectUrl: string;
  extraMonitoring: boolean;
}) {
  const monitoring = params.extraMonitoring
    ? '<p style="margin:16px 0 0 0;font-size:15px;line-height:22px;color:#111111;">BuildMyHouse will monitor this project closely while your verification is completed.</p>'
    : '';
  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#ffffff;font-family:Arial,sans-serif;color:#111111;">
  <p style="margin:0;font-size:16px;line-height:24px;">Hello ${escapeHtml(params.contractorName)},</p>
  <p style="margin:16px 0 0 0;font-size:15px;line-height:22px;">You have a new project request on BuildMyHouse.</p>
  <p style="margin:16px 0 0 0;font-size:15px;line-height:22px;">
    Homeowner: ${escapeHtml(params.homeownerFirstName)}<br/>
    Plan: ${escapeHtml(params.planTitle)}<br/>
    Location: ${escapeHtml(params.location)}
  </p>
  ${monitoring}
  <p style="margin:20px 0 0 0;">
    <a href="${escapeHtml(params.projectUrl)}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-size:14px;">Open the request</a>
  </p>
</body>
</html>`;
  const text = [
    `Hello ${params.contractorName},`,
    '',
    'You have a new project request on BuildMyHouse.',
    `Homeowner: ${params.homeownerFirstName}`,
    `Plan: ${params.planTitle}`,
    `Location: ${params.location}`,
    params.extraMonitoring
      ? 'BuildMyHouse will monitor this project closely while your verification is completed.'
      : '',
    '',
    `Open the request: ${params.projectUrl}`,
  ]
    .filter((line) => line !== '')
    .join('\n');
  return { html, text };
}

export function renderExtraMonitoringAdminEmail(params: {
  projectName: string;
  projectId: string;
  homeownerName: string;
  homeownerEmail: string;
  gcName: string;
  gcEmail: string;
  planTitle: string;
  createdAt: string;
  adminUrl: string;
}) {
  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#ffffff;font-family:Arial,sans-serif;color:#111111;">
  <p style="margin:0;font-size:16px;line-height:24px;">A new project needs extra monitoring because the contractor is not verified yet.</p>
  <p style="margin:16px 0 0 0;font-size:15px;line-height:22px;">
    Project: ${escapeHtml(params.projectName)}<br/>
    Project id: ${escapeHtml(params.projectId)}<br/>
    Homeowner: ${escapeHtml(params.homeownerName)} (${escapeHtml(params.homeownerEmail)})<br/>
    Contractor: ${escapeHtml(params.gcName)} (${escapeHtml(params.gcEmail)})<br/>
    Plan: ${escapeHtml(params.planTitle)}<br/>
    Created: ${escapeHtml(params.createdAt)}
  </p>
  <p style="margin:20px 0 0 0;">
    <a href="${escapeHtml(params.adminUrl)}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-size:14px;">Open project</a>
  </p>
</body>
</html>`;
  const text = [
    'A new project needs extra monitoring because the contractor is not verified yet.',
    `Project: ${params.projectName}`,
    `Project id: ${params.projectId}`,
    `Homeowner: ${params.homeownerName} (${params.homeownerEmail})`,
    `Contractor: ${params.gcName} (${params.gcEmail})`,
    `Plan: ${params.planTitle}`,
    `Created: ${params.createdAt}`,
    `Open project: ${params.adminUrl}`,
  ].join('\n');
  return { html, text };
}

function escapeHtml(value: string) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
