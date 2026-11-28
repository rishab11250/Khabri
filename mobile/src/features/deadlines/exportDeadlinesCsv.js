/**
 * Exports active and historical deadlines as an RFC-4180 CSV spreadsheet via native share.
 */
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * Formats `deadlines` to CSV and shares the generated `khabri-deadlines.csv` file on native devices.
 *
 * @param {Array<object>} [deadlines] - User deadline records to serialize.
 * @returns {Promise<string>} CSV string on web or generated file URI on native.
 */
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
