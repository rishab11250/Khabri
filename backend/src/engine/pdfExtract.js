/**
 * Downloads linked notice PDFs through SSRF guards and extracts text from the opening pages.
 * Deliberately caps extraction to `PDF_MAX_PAGES` (5) and `PDF_MAX_BYTES` (5 MB) so giant
 * official gazettes cannot exhaust worker memory or tick time.
 */
import { PDFParse } from 'pdf-parse';

import { safeFetch } from '../security/ssrfGuard.js';
import { stripNoiseLines } from './normalise.js';

const PDF_MAX_BYTES = 5 * 1024 * 1024;
const PDF_MAX_PAGES = 5;

/**
 * Parses text from a PDF `Buffer` up to `options.maxPages` pages.
 * Always calls `parser.destroy()` because `pdf-parse` v2 holds native worker allocations.
 *
 * @param {Buffer} buffer - Raw PDF file bytes.
 * @param {object} [options] - Optional `maxPages` limit override.
 * @returns {Promise<{ text: string, totalPages: number }>} Noise-stripped text and page count.
 */
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
    // Release pdf-parse v2 worker/canvas resources even when parsing throws.
    await parser.destroy();
  }
}

/**
 * Fetches a remote PDF with SSRF validation and extracts its leading pages as text.
 *
 * @param {string} url - Candidate notice PDF URL.
 * @param {object} [options] - `safeFetch` and `maxPages` overrides.
 * @returns {Promise<{ text: string, totalPages: number }>} Extracted PDF text and page count.
 * @throws {Error} When the upstream server returns a non-2xx HTTP status or fails SSRF checks.
 */
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
