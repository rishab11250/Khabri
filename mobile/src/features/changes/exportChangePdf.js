import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { lightColors } from '@/theme/tokens';

export async function exportChangePdf(change, sourceName) {
  const dates = change?.analysis?.dates || [];
  const checklist = change?.analysis?.checklist || [];

  const datesHtml = dates.length
    ? `<div class="box"><h3>Important Dates</h3><ul>${dates
        .map((d) => `<li><strong>${d.label}:</strong> ${d.iso}</li>`)
        .join('')}</ul></div>`
    : '';

  const checklistHtml = checklist.length
    ? `<div class="box"><h3>Action Checklist</h3><ol>${checklist
        .map((c) => `<li>${c}</li>`)
        .join('')}</ol></div>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: serif; background: ${lightColors.background}; color: ${lightColors.ink}; padding: 24px; line-height: 1.5; }
          .masthead { border-bottom: 2px solid ${lightColors.rule}; padding-bottom: 8px; margin-bottom: 16px; }
          .stamp { display: inline-block; border: 2px solid ${lightColors.accent}; color: ${lightColors.accent}; font-weight: bold; padding: 4px 8px; text-transform: uppercase; margin-bottom: 12px; }
          h1 { margin: 0 0 8px; font-size: 22px; }
          .source { font-style: italic; color: ${lightColors.muted}; margin-bottom: 16px; }
          .why { background: ${lightColors.card}; border-left: 3px solid ${lightColors.rule}; padding: 12px; margin-bottom: 16px; }
          .box { background: ${lightColors.card}; border: 1px solid ${lightColors.rule}; padding: 12px; margin-bottom: 16px; }
          .footer { font-size: 11px; color: ${lightColors.muted}; border-top: 1px solid ${lightColors.rule}; padding-top: 8px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="masthead">
          <div style="font-size: 12px; font-weight: bold; letter-spacing: 1px;">KHABRI — OFFICIAL NOTICE REPORT</div>
          <div style="font-size: 11px; color: ${lightColors.muted};">${new Date(change.detectedAt || Date.now()).toLocaleDateString('en-IN')}</div>
        </div>
        <div class="stamp">${change.impact || 'NOTICE'} • ${change.trust || 'OFFICIAL'}</div>
        <h1>${change.after || 'Official Notice Update'}</h1>
        <div class="source">Source: ${sourceName || 'Official Portal'}</div>
        ${change.analysis?.why ? `<div class="why"><strong>Why it matters:</strong> ${change.analysis.why}</div>` : ''}
        ${datesHtml}
        ${checklistHtml}
        <div class="footer">
          Notice ID: ${change._id || 'n/a'}<br />
          Disclaimer: Khabri is an independent notification tool. Always cross-check with original portal.
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share Khabar PDF Report',
      UTI: 'com.adobe.pdf',
    });
  }
  return uri;
}
