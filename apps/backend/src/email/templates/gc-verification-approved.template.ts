const CANVA_CDN = 'https://og9okqnotav9nuedcikba5wumcoqvnnumwriiprfebm.canva-cdn.email';

export const GC_VERIFICATION_APPROVED_EMAIL_TEMPLATE = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <meta name="x-apple-disable-message-reformatting">
  <title>You're Now a Verified Contractor on BuildMyHouse</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f0f1f5; }
    table { border-collapse: collapse; }
    img { border: 0; display: block; max-width: 100%; height: auto; }
    a { color: inherit; }
    @media (max-width: 620px) {
      .container { width: 100% !important; min-width: 0 !important; }
      .px { padding-left: 16px !important; padding-right: 16px !important; }
      .stack { display: block !important; width: 100% !important; }
      .stack-gap { height: 16px !important; }
      .hero-title { font-size: 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f1f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f0f1f5">
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" bgcolor="#090042" style="width:600px;max-width:600px;background-color:#090042;">
          <tr>
            <td class="px" style="padding:24px 24px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" style="color:#ffffff;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:16px;font-weight:900;letter-spacing:-0.03em;">
                    BUILDMYHOUSE
                  </td>
                  <td align="right" style="white-space:nowrap;">
                    <img src="${CANVA_CDN}/9d74e5c8253431512eaa9303ea9de2ff.png" width="18" height="19" alt="" style="display:inline-block;margin-left:8px;">
                    <img src="${CANVA_CDN}/e1bcbfe208c956da3e2d041622704b32.png" width="18" height="19" alt="" style="display:inline-block;margin-left:8px;">
                    <img src="${CANVA_CDN}/23e99c395ed12f62fa944bc21aa3dfd0.png" width="20" height="21" alt="" style="display:inline-block;margin-left:8px;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:0 24px 16px;">
              <img src="${CANVA_CDN}/289cd2b5e447048db37de30763258bcd.png" width="552" alt="You're now verified on BuildMyHouse" style="width:100%;max-width:552px;border-radius:10px;">
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:0 24px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border-radius:10px;">
                <tr>
                  <td style="padding:20px 18px;font-family:Tahoma,Geneva,sans-serif;color:#f8f8f2;font-size:14px;line-height:1.6;">
                    <p style="margin:0 0 14px;">Hi <strong>{{contractorName}}</strong>,</p>
                    <p style="margin:0 0 14px;">Your BuildMyHouse contractor verification has been approved. Your verified specialty: <strong>{{specialty}}</strong></p>
                    <p style="margin:0 0 14px;">You are now a <strong>Verified General Contractor</strong> on BuildMyHouse — trusted to receive project opportunities from homeowners in Nigeria, including diaspora clients who need structured, accountable property work from abroad.</p>
                    <p style="margin:0;">Welcome to a platform built for <strong>clear scope, stage-based delivery, photo evidence, and payment only after approved progress</strong>.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:0 24px 12px;">
              <p class="hero-title" style="margin:0;text-align:center;color:#b4fa1e;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;font-style:italic;letter-spacing:-0.08em;">
                WHAT YOU CAN DO NOW
              </p>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:0 24px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="stack" width="48%" valign="top">
                    <img src="${CANVA_CDN}/21b9fbfec84beaf4edf23cad02bba621.png" width="270" alt="" style="width:100%;border-radius:10px;">
                  </td>
                  <td class="stack-gap" width="4%" style="font-size:0;line-height:0;">&nbsp;</td>
                  <td class="stack" width="48%" valign="top">
                    <img src="${CANVA_CDN}/b02dac1ad7079a1c3eb3223e49e09b2b.png" width="270" alt="" style="width:100%;border-radius:10px;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:0 24px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="stack" width="48%" valign="bottom" style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:16px;line-height:1.5;padding-right:8px;">
                    <p style="margin:0 0 12px;font-weight:700;">As a verified GC, you can now:</p>
                    <p style="margin:0 0 8px;">• <strong>Receive project requests</strong> from homeowners looking for trusted professionals</p>
                    <p style="margin:0 0 8px;">• <strong>Review and accept opportunities</strong> matched to your specialty</p>
                    <p style="margin:0 0 8px;">• <strong>Manage active projects</strong> from your contractor dashboard</p>
                    <p style="margin:0 0 8px;">• <strong>Upload stage updates and photo evidence</strong> so homeowners can approve progress remotely</p>
                    <p style="margin:0 0 8px;">• <strong>Communicate with homeowners</strong> through the platform</p>
                    <p style="margin:0 0 8px;">• <strong>Upload design plans</strong> (now unlocked on your verified account)</p>
                    <p style="margin:0 0 8px;">• <strong>Get paid through staged project workflows</strong> as milestones are approved</p>
                    <p style="margin:0;">• <strong>Build your reputation</strong> through completed work, ratings, and verified performance</p>
                  </td>
                  <td class="stack-gap" width="4%" style="font-size:0;line-height:0;">&nbsp;</td>
                  <td class="stack" width="48%" valign="top">
                    <img src="${CANVA_CDN}/ace165563c2f83933601bae722ae2fee.png" width="270" alt="" style="width:100%;border-radius:10px;margin-bottom:12px;">
                    <img src="${CANVA_CDN}/32718f59b08f40617c68651a69dea8c2.png" width="270" alt="" style="width:100%;border-radius:10px;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:0 24px 12px;">
              <p class="hero-title" style="margin:0;text-align:center;color:#b4fa1e;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;font-style:italic;letter-spacing:-0.08em;">
                WHAT WE EXPECT FROM YOU
              </p>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:0 24px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="stack" width="48%" valign="top">
                    <img src="${CANVA_CDN}/1fa1580541c6e1a12a22537a8cfb18c6.png" width="270" alt="" style="width:100%;border-radius:10px;">
                  </td>
                  <td class="stack-gap" width="4%" style="font-size:0;line-height:0;">&nbsp;</td>
                  <td class="stack" width="48%" valign="bottom" style="font-family:Arial,Helvetica,sans-serif;color:#f8f8f2;font-size:16px;line-height:1.5;">
                    <p style="margin:0 0 12px;">BuildMyHouse is built on <strong>professionalism, communication, clear stage progression, and accountability</strong>.</p>
                    <p style="margin:0 0 12px;">Homeowners trust verified contractors to:</p>
                    <p style="margin:0 0 8px;">• communicate clearly and promptly</p>
                    <p style="margin:0 0 8px;">• upload proper updates at each stage</p>
                    <p style="margin:0 0 8px;">• respect agreed timelines</p>
                    <p style="margin:0 0 12px;">• complete work professionally <strong>before</strong> requesting payment approval</p>
                    <p style="margin:0;">Your performance affects your <strong>visibility, future opportunities, and homeowner trust</strong> on the platform.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:0 24px 12px;">
              <p class="hero-title" style="margin:0;text-align:center;color:#b4fa1e;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;font-style:italic;letter-spacing:-0.08em;">
                YOUR NEXT STEPS
              </p>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:0 24px 16px;font-family:Arial,Helvetica,sans-serif;color:#f8f8f2;font-size:16px;line-height:1.6;">
              <p style="margin:0 0 8px;">1. <strong>Log in</strong> to your contractor dashboard</p>
              <p style="margin:0 0 8px;">2. <strong>Turn on notifications</strong> so you never miss a project request</p>
              <p style="margin:0 0 8px;">3. <strong>Keep your profile, specialty, and portfolio updated</strong></p>
              <p style="margin:0 0 8px;">4. <strong>Respond quickly</strong> when a new request comes in</p>
              <p style="margin:0 0 16px;">5. <strong>Upload clear stage evidence</strong> as work progresses</p>
              <p style="margin:0 0 8px;font-size:13px;">Welcome to BuildMyHouse.</p>
              <p style="margin:0 0 8px;font-size:13px;">We're glad to have you as part of a new generation of contractors helping make property work in Nigeria more <strong>structured, transparent, and trustworthy</strong>.</p>
              <p style="margin:0;font-size:13px;">— <strong>The BuildMyHouse Team</strong></p>
            </td>
          </tr>

          <tr>
            <td class="px" style="padding:0 24px 16px;">
              <img src="${CANVA_CDN}/b1b2cde712096a8e9aa50de7d7755786.png" width="552" alt="" style="width:100%;max-width:552px;border-radius:10px;">
            </td>
          </tr>

          <tr>
            <td class="px" align="center" style="padding:0 24px 24px;">
              <a href="{{dashboardUrl}}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background-color:#b4fa1e;color:#000000;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;line-height:57px;height:57px;padding:0 28px;border-radius:999px;">
                Open Contractor Dashboard
              </a>
            </td>
          </tr>

          <tr>
            <td class="px" align="center" style="padding:0 24px 32px;font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:13px;line-height:1.6;">
              <p style="margin:0 0 8px;">
                <a href="{{viewInBrowserUrl}}" style="color:#ffffff;text-decoration:underline;">View email in browser</a>
                ·
                <a href="{{updatePreferencesUrl}}" style="color:#ffffff;text-decoration:underline;">Update your preferences</a>
                ·
                <a href="{{unsubscribeUrl}}" style="color:#ffffff;text-decoration:underline;">Unsubscribe</a>
              </p>
              <p style="margin:0;">
                BuildMyHouse Technologies<br>
                7 Ransome Kuti Rd, Akoka, Lagos 100001, Lagos, Nigeria<br>
                <a href="tel:+2347030282417" style="color:#ffffff;text-decoration:none;">+234 703 028 2417</a><br>
                © BuildMyHouse
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderGCVerificationApprovedEmail(params: {
  contractorName: string;
  specialty: string;
  dashboardUrl: string;
  viewInBrowserUrl?: string;
  updatePreferencesUrl?: string;
  unsubscribeUrl?: string;
}): string {
  const footer = {
    viewInBrowserUrl: params.viewInBrowserUrl || 'https://buildmyhouse.app',
    updatePreferencesUrl: params.updatePreferencesUrl || 'https://buildmyhouse.app',
    unsubscribeUrl: params.unsubscribeUrl || 'https://buildmyhouse.app',
  };

  return GC_VERIFICATION_APPROVED_EMAIL_TEMPLATE.replace(/\{\{contractorName\}\}/g, escapeHtml(params.contractorName))
    .replace(/\{\{specialty\}\}/g, escapeHtml(params.specialty))
    .replace(/\{\{dashboardUrl\}\}/g, escapeHtml(params.dashboardUrl))
    .replace(/\{\{viewInBrowserUrl\}\}/g, footer.viewInBrowserUrl)
    .replace(/\{\{updatePreferencesUrl\}\}/g, footer.updatePreferencesUrl)
    .replace(/\{\{unsubscribeUrl\}\}/g, footer.unsubscribeUrl);
}

export function buildGCVerificationApprovedPlainText(params: {
  contractorName: string;
  specialty: string;
  dashboardUrl: string;
}): string {
  const { contractorName, specialty, dashboardUrl } = params;

  return `Hi ${contractorName},

Your BuildMyHouse contractor verification has been approved.
Your verified specialty: ${specialty}

You are now a Verified General Contractor on BuildMyHouse — trusted to receive project opportunities from homeowners in Nigeria, including diaspora clients who need structured, accountable property work from abroad.

WHAT YOU CAN DO NOW
- Receive project requests from homeowners
- Review and accept opportunities matched to your specialty
- Manage active projects from your contractor dashboard
- Upload stage updates and photo evidence
- Communicate with homeowners through the platform
- Upload design plans (now unlocked on your verified account)
- Get paid through staged project workflows as milestones are approved
- Build your reputation through completed work, ratings, and verified performance

WHAT WE EXPECT FROM YOU
BuildMyHouse is built on professionalism, communication, clear stage progression, and accountability.

YOUR NEXT STEPS
1. Log in to your contractor dashboard
2. Turn on notifications so you never miss a project request
3. Keep your profile, specialty, and portfolio updated
4. Respond quickly when a new request comes in
5. Upload clear stage evidence as work progresses

Open Contractor Dashboard: ${dashboardUrl}

Welcome to BuildMyHouse.
— The BuildMyHouse Team`;
}
