import { describe, expect, it } from 'vitest';
import { extractPdfTextFromBuffer } from '../src/engine/pdfExtract.js';

function buildMinimalPdf(text) {
  const safeText = text.replace(/[()\\]/g, '\\$&');
  const stream = `BT /F1 12 Tf 72 720 Td (${safeText}) Tj ET`;
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n',
    `4 0 obj << /Length ${Buffer.byteLength(stream, 'utf8')} >> stream\n${stream}\nendstream endobj\n`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'utf8');
}

describe('pdfExtract', () => {
  it('extracts text from an in-memory PDF buffer using pdf-parse v2', async () => {
    const buffer = buildMinimalPdf('Admit card deadline extended to 28 Dec 2026');
    const result = await extractPdfTextFromBuffer(buffer, { maxPages: 3 });

    expect(result.totalPages).toBe(1);
    expect(result.text).toContain('Admit card deadline extended to 28 Dec 2026');
  });
});
