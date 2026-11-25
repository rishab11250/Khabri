import { PDFParse } from 'pdf-parse';
import { safeFetch } from '../security/ssrfGuard.js';
import { stripNoiseLines } from './normalise.js';

export const PDF_MAX_BYTES = 5 * 1024 * 1024;
export const PDF_MAX_PAGES = 5;

export async function extractPdfTextFromBuffer(buffer, options = {}) {
  const maxPages = options.maxPages ?? PDF_MAX_PAGES;
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText({ first: maxPages });
    return {
      text: stripNoiseLines(result?.text || ''),
      totalPages: result?.total ?? 0,
    };
  } finally {
    await parser.destroy();
  }
}

export async function fetchAndExtractPdf(url, options = {}) {
  const res = await safeFetch(url, {
    ...options,
    maxBytes: options.maxBytes ?? PDF_MAX_BYTES,
    allowedContentTypes: ['application/pdf'],
  });
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`PDF fetch failed with HTTP ${res.status}`);
  }
  return extractPdfTextFromBuffer(res.buffer, options);
}
