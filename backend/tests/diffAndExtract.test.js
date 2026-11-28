import { describe, expect, it } from 'vitest';

import { diffListings, diffPages } from '../src/engine/diff.js';
import { extractSignals } from '../src/engine/extract.js';
import { evaluateMateriality } from '../src/engine/materialFilter.js';

describe('diff, extract, and materialFilter', () => {
  it('ignores listing rank shuffles and displaced tail items', () => {
    const prev = [
      { title: 'Notice 1', href: 'https://x.gov.in/1', dateText: '01 Dec 2026' },
      { title: 'Notice 2', href: 'https://x.gov.in/2', dateText: '02 Dec 2026' },
      { title: 'Notice 3', href: 'https://x.gov.in/3', dateText: '03 Dec 2026' },
      { title: 'Notice 4', href: 'https://x.gov.in/4', dateText: '04 Dec 2026' },
      { title: 'Notice 5', href: 'https://x.gov.in/5', dateText: '05 Dec 2026' },
    ];

    const reordered = [prev[2], prev[0], prev[4], prev[1], prev[3]];
    expect(diffListings(prev, reordered).changed).toBe(false);

    // New notice added at top pushes Notice 5 off page 1
    const displaced = [
      { title: 'Admit Card Out', href: 'https://x.gov.in/6', dateText: '10 Dec 2026' },
      prev[0],
      prev[1],
      prev[2],
      prev[3],
    ];
    const d = diffListings(prev, displaced);
    expect(d.changed).toBe(true);
    expect(d.added).toHaveLength(1);
    expect(d.removed).toHaveLength(0);
    expect(d.displacedCount).toBe(1);
  });

  it('detects updated listing dates and page sentence diffs while ignoring hash/whitespace matches', () => {
    const dListing = diffListings(
      [{ title: 'Exam Schedule', href: 'https://x.gov.in/s', dateText: '10 Dec 2026' }],
      [{ title: 'Exam Schedule', href: 'https://x.gov.in/s', dateText: '20 Dec 2026' }],
    );
    expect(dListing.changed).toBe(true);
    expect(dListing.updated).toHaveLength(1);

    const sameHash = diffPages({ contentHash: 'abc' }, { contentHash: 'abc' });
    expect(sameHash.changed).toBe(false);
    expect(sameHash.reason).toBe('hash_match');

    const pageDiff = diffPages(
      {
        contentHash: 'h1',
        textExcerpt: 'Application deadline is 10 Dec 2026. Fee is Rs 500.',
      },
      {
        contentHash: 'h2',
        textExcerpt: 'Application deadline is 25 Dec 2026. Fee is Rs 500.',
      },
    );
    expect(pageDiff.changed).toBe(true);
    expect(pageDiff.beforeExcerpt).toContain('10 Dec 2026');
    expect(pageDiff.afterExcerpt).toContain('25 Dec 2026');
  });

  it('extracts Indian/ISO dates, numbers, and eligibility rules and evaluates materiality', () => {
    const beforeText =
      'Last date to apply is 15/12/2026. Application fee is Rs 500. Candidates must hold a graduate degree.';
    const afterText =
      'Last date to apply is extended to 2026-12-30. Admit card will be released on January 10, 2027. Total 1,250 vacancies announced. Minimum 60% marks required for eligibility.';

    const beforeSignals = extractSignals(beforeText);
    const afterSignals = extractSignals(afterText);

    expect(beforeSignals.dates[0].iso).toBe('2026-12-15');
    expect(afterSignals.dates.map((d) => d.iso)).toEqual(['2026-12-30', '2027-01-10']);
    expect(afterSignals.dates[0].label).toBe('Application deadline');
    expect(afterSignals.dates[1].label).toBe('Admit card date');
    expect(afterSignals.numbers).toEqual(expect.arrayContaining(['1,250 vacancies', '60%']));
    expect(afterSignals.eligibility.length).toBeGreaterThanOrEqual(1);

    const diffResult = diffPages(
      { contentHash: 'a', textExcerpt: beforeText },
      { contentHash: 'b', textExcerpt: afterText },
    );
    const mat = evaluateMateriality({ diffResult, beforeSignals, afterSignals });
    expect(mat.material).toBe(true);
    expect(mat.impact).toBe('HIGH');

    const noiseMat = evaluateMateriality({
      diffResult: {
        type: 'page',
        changed: true,
        changedChars: 5,
        beforeExcerpt: 'hi',
        afterExcerpt: 'hi!',
      },
      beforeSignals,
      afterSignals: beforeSignals,
    });
    expect(noiseMat.material).toBe(false);
  });
});
