/**
 * Hosts an in-memory HTML notice board used to test live monitoring and demo walkthroughs safely.
 * Deliberately keeps notice state ephemeral so resets require zero database writes.
 */
import { AppError } from '../middleware/envelope.js';

const INITIAL_NOTICES = [
  {
    id: 'demo-1',
    title: 'Combined Graduate Recruitment 2026 — Application Window & Exam Schedule',
    href: '/demo/board/notices/cgr-2026',
    dateText: '15 Dec 2026',
  },
  {
    id: 'demo-2',
    title: 'National Merit Scholarship Renewal — Document Verification Guidelines',
    href: '/demo/board/notices/nms-2026',
    dateText: '20 Dec 2026',
  },
  {
    id: 'demo-3',
    title: 'State Engineering Entrance Admit Card Release Window',
    href: '/demo/board/notices/see-2026',
    dateText: '05 Jan 2027',
  },
];

let notices = INITIAL_NOTICES.map((n) => ({ ...n }));

/**
 * Returns a shallow clone of active demo notices.
 *
 * @returns {Array<{ id: string, title: string, href: string, dateText: string }>} Notice list copy.
 */
export function getDemoNotices() {
  return notices.map((n) => ({ ...n }));
}

/**
 * Prepends a new demo notice to the simulated notice board.
 *
 * @param {object} params - Notice fields.
 * @param {string} params.title - Display notice headline.
 * @param {string} [params.href] - Optional target path.
 * @param {string} [params.dateText] - Optional date badge text.
 * @returns {{ id: string, title: string, href: string, dateText: string }} Created notice item.
 */
function addDemoNotice({ title, href, dateText }) {
  const id = `demo-${Date.now()}`;
  const item = {
    id,
    title,
    href: href || `/demo/board/notices/${id}`,
    dateText: dateText || '',
  };
  notices = [item, ...notices];
  return item;
}

/**
 * Updates an existing demo notice by `id`.
 *
 * @param {string} id - Demo notice identifier (`demo-1`, `demo-...`).
 * @param {object} patch - Optional `title`, `dateText`, and `href` updates.
 * @returns {object|null} Updated notice object or `null` if missing.
 */
function updateDemoNotice(id, patch) {
  const idx = notices.findIndex((n) => n.id === id);
  if (idx === -1) return null;
  notices[idx] = {
    ...notices[idx],
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.dateText !== undefined ? { dateText: patch.dateText } : {}),
    ...(patch.href !== undefined ? { href: patch.href } : {}),
  };
  return { ...notices[idx] };
}

/**
 * Restores the simulated notice board back to its initial 3 sample notices.
 *
 * @returns {Array<object>} Reset notice list.
 */
export function resetDemoNotices() {
  notices = INITIAL_NOTICES.map((n) => ({ ...n }));
  return getDemoNotices();
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Renders the simulated notice board as escaped HTML parseable by `fetchListing`.
 *
 * @returns {string} Complete HTML document string.
 */
export function renderDemoBoardHtml() {
  const itemsHtml = notices
    .map(
      (n) =>
        `<li class="notice-item" data-id="${escapeHtml(n.id)}"><a href="${escapeHtml(n.href)}">${escapeHtml(n.title)}</a> <span class="notice-date">${escapeHtml(n.dateText)}</span></li>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Khabri Demo Notice Board</title></head>
<body>
  <main>
    <h1>Demo Official Notice Board</h1>
    <p>Simulated notice board for reliable end-to-end change detection testing.</p>
    <ul class="notice-list">
      ${itemsHtml}
    </ul>
  </main>
</body>
</html>`;
}

/**
 * Applies `add`, `update`, or `reset` mutations to the demo board when enabled.
 *
 * @param {object} body - Validated mutation request (`action` and notice fields).
 * @param {boolean} demoEnabled - Feature flag controlling whether mutations are allowed.
 * @returns {{ status: number, payload: object }} HTTP status and response payload.
 * @throws {AppError} When demo mutations are disabled (403) or target ID is missing (404).
 */
export function mutateDemoBoard(body, demoEnabled) {
  if (!demoEnabled) {
    throw new AppError(403, 'DEMO_DISABLED', 'Demo Notice Board mutations are disabled');
  }

  if (body.action === 'add') {
    const created = addDemoNotice(body);
    return { status: 201, payload: { notice: created, notices: getDemoNotices() } };
  }

  if (body.action === 'update') {
    const updated = updateDemoNotice(body.id, body);
    if (!updated) {
      throw new AppError(404, 'NOTICE_NOT_FOUND', `Demo notice ${body.id} not found`);
    }
    return { status: 200, payload: { notice: updated, notices: getDemoNotices() } };
  }

  return { status: 200, payload: { notices: resetDemoNotices() } };
}
