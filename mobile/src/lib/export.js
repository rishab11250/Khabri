import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

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
          body { font-family: serif; background: #F4ECDD; color: #1B1A17; padding: 24px; line-height: 1.5; }
          .masthead { border-bottom: 2px solid #1B1A17; padding-bottom: 8px; margin-bottom: 16px; }
          .stamp { display: inline-block; border: 2px solid #C8402A; color: #C8402A; font-weight: bold; padding: 4px 8px; text-transform: uppercase; margin-bottom: 12px; }
          h1 { margin: 0 0 8px; font-size: 22px; }
          .source { font-style: italic; color: #6B665C; margin-bottom: 16px; }
          .why { background: #FBF6EA; border-left: 3px solid #1B1A17; padding: 12px; margin-bottom: 16px; }
          .box { background: #FBF6EA; border: 1px solid #1B1A17; padding: 12px; margin-bottom: 16px; }
          .footer { font-size: 11px; color: #6B665C; border-top: 1px solid #1B1A17; padding-top: 8px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="masthead">
          <div style="font-size: 12px; font-weight: bold; letter-spacing: 1px;">KHABRI — OFFICIAL NOTICE REPORT</div>
          <div style="font-size: 11px; color: #6B665C;">${new Date(change.detectedAt || Date.now()).toLocaleDateString('en-IN')}</div>
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

export async function exportDeadlinesCsv(deadlines = []) {
  const header = ['Label', 'Due Date (ISO)', 'Status', 'Days Remaining', 'Source'];
  const rows = deadlines.map((d) => {
    const due = d.dueAt ? new Date(d.dueAt).toISOString().split('T')[0] : '';
    const diffDays = d.dueAt
      ? Math.ceil((new Date(d.dueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : '';
    const safeLabel = `"${String(d.label || '').replace(/"/g, '""')}"`;
    const safeStatus = `"${String(d.status || 'pending').replace(/"/g, '""')}"`;
    const safeSource = `"${String(d.sourceId?.name || '').replace(/"/g, '""')}"`;
    return [safeLabel, due, safeStatus, diffDays, safeSource].join(',');
  });

  const csvContent = [header.join(','), ...rows].join('\r\n');

  if (Platform.OS === 'web') {
    return csvContent;
  }

  const file = new File(Paths.document, 'khabri-deadlines.csv');
  if (!file.exists) {
    file.create({ intermediates: true });
  }
  await file.write(csvContent);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Deadlines CSV',
      UTI: 'public.comma-separated-values-text',
    });
  }
  return file.uri;
}
