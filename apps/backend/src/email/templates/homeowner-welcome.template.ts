export const HOMEOWNER_WELCOME_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <meta name="x-apple-disable-message-reformatting">
  <style>
    @media (max-width: 640px) {
      .stack { display: block !important; width: 100% !important; }
      .mobile-pad { padding: 16px !important; }
    }
  </style>
</head>
<body style="width:100%;-webkit-text-size-adjust:100%;text-size-adjust:100%;background-color:#f0f1f5;margin:0;padding:0;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f0f1f5">
    <tbody>
      <tr>
        <td style="padding:20px 0;">
          <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:10px;overflow:hidden;">
            <tbody>
              <tr>
                <td style="padding:0;">
                  <img src="https://og9okqnotav9nuedcikba5wumcoqvnnumwriiprfebm.canva-cdn.email/719ecb7ba73a0b39036add6f9821b58a.jpg" width="600" style="display:block;width:100%;height:auto;max-width:100%;">
                </td>
              </tr>
              <tr>
                <td class="mobile-pad" style="padding:22px 20px 14px 20px;font-family:Poppins,Arial,Helvetica,sans-serif;color:#111111;">
                  <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;">Hi {{full_name}},</p>
                  <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;"><strong>Welcome to BuildMyHouse.</strong></p>
                  <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;">You have just taken the first step towards building your home in Nigeria. <strong>Without the usual stress, guesswork, or "connection" problems.</strong></p>
                  <p style="margin:0 0 8px 0;font-size:14px;line-height:1.6;">We know how this usually goes:</p>
                  <ul style="margin:0 0 12px 20px;padding:0;font-size:14px;line-height:1.7;">
                    <li>You are far from home</li>
                    <li>You do not fully trust contractors</li>
                    <li>You hear stories of abandoned projects, inflated costs, and no accountability</li>
                  </ul>
                  <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;">That is exactly why BuildMyHouse exists.</p>
                  <table width="100%" border="0" cellpadding="0" cellspacing="0"><tbody><tr><td style="height:1px;background:#000000;font-size:0;line-height:0;">&nbsp;</td></tr></tbody></table>
                </td>
              </tr>
              <tr>
                <td class="mobile-pad" style="padding:8px 20px 10px 20px;font-family:Poppins,Arial,Helvetica,sans-serif;color:#111111;">
                  <p style="margin:0 0 8px 0;font-size:14px;line-height:1.6;"><strong>What you can now do with BuildMyHouse</strong></p>
                  <p style="margin:0 0 8px 0;font-size:14px;line-height:1.6;">With your account, you can:</p>
                  <ul style="margin:0 0 14px 20px;padding:0;font-size:14px;line-height:1.7;">
                    <li>Start your building project from anywhere in the world</li>
                    <li>Connect with verified general contractors</li>
                    <li>Track every stage of your project in real time</li>
                    <li>Communicate directly and transparently</li>
                    <li>Have structured payments tied to actual progress</li>
                  </ul>
                  <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;"><strong>This is not just a listing platform.</strong> It is a system designed to protect your money, your time, and your peace of mind.</p>
                </td>
              </tr>
              <tr>
                <td class="mobile-pad" style="padding:12px 20px 16px 20px;text-align:center;">
                  <a href="https://buildmyhouse.app" target="_blank" rel="noopener" style="display:inline-block;padding:12px 22px;border:1px solid #000000;border-radius:999px;color:#000000;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:15px;">Explore</a>
                </td>
              </tr>
              <tr>
                <td class="mobile-pad" style="padding:10px 20px 0 20px;font-family:Poppins,Arial,Helvetica,sans-serif;color:#111111;">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0"><tbody><tr><td style="height:1px;background:#000000;font-size:0;line-height:0;">&nbsp;</td></tr></tbody></table>
                  <p style="margin:14px 0 0 0;font-size:14px;line-height:1.6;">Building a home in Nigeria should not feel like a gamble. With BuildMyHouse, it becomes a <strong>managed, transparent process.</strong></p>
                </td>
              </tr>
              <tr>
                <td class="mobile-pad" style="padding:16px 20px;text-align:center;">
                  <img src="https://og9okqnotav9nuedcikba5wumcoqvnnumwriiprfebm.canva-cdn.email/dba62c043a90390fe0b8f709c5bc3764.png" width="294" style="display:inline-block;width:100%;max-width:294px;height:auto;">
                </td>
              </tr>
              <tr>
                <td style="padding:18px 20px 24px 20px;text-align:center;font-family:Arial,Helvetica,sans-serif;color:#606060;">
                  <p style="margin:0 0 10px 0;font-size:13px;line-height:1.7;">
                    <a href="https://buildmyhouse.app" target="_blank" rel="noopener nofollow" style="color:#1a62ff;text-decoration:underline;">Contact</a>
                    &nbsp;|&nbsp;
                    <a href="{{ update_preferences }}" target="_blank" rel="noopener nofollow" style="color:inherit;text-decoration:underline;">Manage Preferences</a>
                    &nbsp;|&nbsp;
                    <a href="{{ unsubscribe }}" target="_blank" rel="noopener nofollow" style="color:inherit;text-decoration:underline;">Unsubscribe</a>
                    &nbsp;|&nbsp;
                    <a href="{{ view_in_browser }}" target="_blank" rel="noopener nofollow" style="color:inherit;text-decoration:underline;">View in Browser</a>
                  </p>
                  <p style="margin:8px 0 0 0;font-size:13px;line-height:1.6;">
                    BuildMyHouse, Ransome Kuti Road, University of Lagos, Lagos Mainland, 10001
                  </p>
                  <p style="margin:8px 0 0 0;font-size:12px;line-height:1.6;">
                    &copy; 2026 BuildMyHouse. All rights reserved.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
