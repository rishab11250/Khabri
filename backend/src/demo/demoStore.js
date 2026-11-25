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

export function getDemoNotices() {
  return notices.map((n) => ({ ...n }));
}

export function addDemoNotice({ title, href, dateText }) {
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

export function updateDemoNotice(id, patch) {
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
