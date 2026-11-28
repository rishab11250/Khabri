/**
 * Renders an official notice change card into a printable HTML-to-PDF summary and opens system share.
 * Deliberately uses light newspaper theme colors so exported PDFs remain crisp on white paper.
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { lightColors } from '@/theme/tokens';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderDatesHtml(dates) {
  if (!dates.length) return '';
  const items = dates
    .map((d) => `<li><strong>${escapeHtml(d.label)}:</strong> ${escapeHtml(d.iso)}</li>`)
    .join('');
  return `<div class="box"><h3>Important Dates</h3><ul>${items}</ul></div>`;
}

function renderChecklistHtml(checklist) {
  if (!checklist.length) return '';
  const items = checklist.map((c) => `<li>${escapeHtml(c)}</li>`).join('');
  return `<div class="box"><h3>Action Checklist</h3><ol>${items}</ol></div>`;
}

function buildPdfHtml(change, sourceName) {
  const datesHtml = renderDatesHtml(change?.analysis?.dates || []);
  const checklistHtml = renderChecklistHtml(change?.analysis?.checklist || []);
  const dateLabel = new Date(change?.detectedAt || Date.now()).toLocaleDateString('en-IN');
  const impactStamp = `${escapeHtml(change?.impact || 'NOTICE')} • ${escapeHtml(change?.trust || 'OFFICIAL')}`;
  const headline = escapeHtml(change?.after || 'Official Notice Update');
  const publisher = escapeHtml(sourceName || 'Official Portal');
  const whyHtml = change?.analysis?.why
    ? `<div class="why"><strong>Why it matters:</strong> ${escapeHtml(change.analysis.why)}</div>`
    : '';
  const noticeId = escapeHtml(change?._id || 'n/a');

  return `
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
          <div style="font-size: 11px; color: ${lightColors.muted};">${escapeHtml(dateLabel)}</div>
        </div>
        <div class="stamp">${impactStamp}</div>
        <h1>${headline}</h1>
        <div class="source">Source: ${publisher}</div>
        ${whyHtml}
        ${datesHtml}
        ${checklistHtml}
        <div class="footer">
          Notice ID: ${noticeId}<br />
          Disclaimer: Khabri is an independent notification tool. Always cross-check with original portal.
        </div>
      </body>
    </html>
  `;
}

/**
 * Generates a PDF file summarizing `change` and invokes the native share dialog when available.
 *
 * @param {object} change - Full change card record including `analysis.dates` and `checklist`.
 * @param {string} [sourceName] - Human-readable publisher/portal title.
 * @returns {Promise<string>} Temporary file URI produced by `expo-print`.
 */
export async function exportChangePdf(change, sourceName) {
  const html = buildPdfHtml(change, sourceName);
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
