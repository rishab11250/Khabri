/**
 * Computes structural diffs between consecutive notice-board listings or prose HTML snapshots.
 * Deliberately guards against false-positive removals when new top entries push old items off page 1.
 */
import { diffSentences } from 'diff';

import { collapseWhitespace } from './normalise.js';

function itemIdentity(item) {
  return item.href ? `href:${item.href}` : `title:${item.title.toLowerCase()}`;
}

function classifyNextItems(prevItems, nextItems, prevMap) {
  const added = [];
  const updated = [];

  for (const nextItem of nextItems) {
    const prevEntry = prevMap.get(itemIdentity(nextItem));
    if (prevEntry) {
      if (
        prevEntry.item.title !== nextItem.title ||
        prevEntry.item.dateText !== nextItem.dateText
      ) {
        updated.push({ before: prevEntry.item, after: nextItem });
      }
      continue;
    }

    // Match title when href changed (for example query param rotation) instead of emitting add+remove.
    const titleMatch = prevItems.find(
      (p) => p.title.toLowerCase() === nextItem.title.toLowerCase(),
    );
    if (!titleMatch) {
      added.push(nextItem);
    } else if (titleMatch.href !== nextItem.href || titleMatch.dateText !== nextItem.dateText) {
      updated.push({ before: titleMatch, after: nextItem });
    }
  }

  return { added, updated };
}

function collectRawRemovals(prevItems, nextMap, prevMap, updated) {
  const updatedTitles = new Set(updated.map((u) => u.before.title.toLowerCase()));
  const nextTitles = new Set(Array.from(nextMap.values()).map((n) => n.title.toLowerCase()));
  const rawRemoved = [];

  for (const prevItem of prevItems) {
    const key = itemIdentity(prevItem);
    if (nextMap.has(key)) continue;
    const lowerTitle = prevItem.title.toLowerCase();
    if (!updatedTitles.has(lowerTitle) && !nextTitles.has(lowerTitle)) {
      rawRemoved.push({ item: prevItem, prevIndex: prevMap.get(key)?.idx ?? 0 });
    }
  }

  return rawRemoved;
}

function applyDisplacementGuard(rawRemoved, { prevCount, addedCount, displacementThreshold }) {
  if (addedCount === 0 || prevCount < displacementThreshold) {
    return { removed: rawRemoved.map((entry) => entry.item), displacedCount: 0 };
  }

  // Items pushed off the bottom of a fixed-size notice table by new top notices are not removals.
  const tailBoundary = Math.max(0, prevCount - addedCount - 1);
  const removed = [];
  let displacedCount = 0;

  for (const entry of rawRemoved) {
    if (entry.prevIndex >= tailBoundary) {
      displacedCount += 1;
    } else {
      removed.push(entry.item);
    }
  }

  return { removed, displacedCount };
}

/**
 * Diffs two normalized notice listings (`added`, `updated`, `removed`) with pagination displacement filtering.
 *
 * @param {Array<object>} [prevItems] - Previous snapshot's normalized items.
 * @param {Array<object>} [nextItems] - Latest fetched normalized items.
 * @param {object} [options] - Optional `displacementThreshold` minimum item count to apply tail filtering.
 * @returns {{ type: 'listing', changed: boolean, added: Array<object>, updated: Array<object>, removed: Array<object>, displacedCount: number }} Listing diff.
 */
export function diffListings(prevItems = [], nextItems = [], options = {}) {
  const displacementThreshold = options.displacementThreshold ?? 5;
  const prevMap = new Map(prevItems.map((item, idx) => [itemIdentity(item), { item, idx }]));
  const nextMap = new Map(nextItems.map((item) => [itemIdentity(item), item]));

  const { added, updated } = classifyNextItems(prevItems, nextItems, prevMap);
  const rawRemoved = collectRawRemovals(prevItems, nextMap, prevMap, updated);
  const { removed, displacedCount } = applyDisplacementGuard(rawRemoved, {
    prevCount: prevItems.length,
    addedCount: added.length,
    displacementThreshold,
  });

  const changed = added.length > 0 || updated.length > 0 || removed.length > 0;

  return {
    type: 'listing',
    changed,
    added,
    updated,
    removed,
    displacedCount,
  };
}

function collectSentenceChanges(parts) {
  const addedSentences = [];
  const removedSentences = [];
  let changedChars = 0;

  for (const part of parts) {
    const val = collapseWhitespace(part.value);
    if (!val) continue;
    if (part.added) {
      addedSentences.push(val);
      changedChars += val.length;
    } else if (part.removed) {
      removedSentences.push(val);
      changedChars += val.length;
    }
  }

  return { addedSentences, removedSentences, changedChars };
}

function extractSnapshotText(snapshot) {
  return collapseWhitespace(snapshot?.text ?? snapshot?.textExcerpt ?? '');
}

/**
 * Computes sentence-level prose differences between two page snapshots.
 * Short-circuits on identical `contentHash` to avoid unnecessary sentence diffing.
 *
 * @param {object} prevSnapshot - Previous snapshot record (`contentHash`, `text`/`textExcerpt`).
 * @param {object} nextSnapshot - Latest fetched page record.
 * @returns {{ type: 'page', changed: boolean, reason: string, addedSentences: string[], removedSentences: string[], changedChars: number, beforeExcerpt: string, afterExcerpt: string }} Page diff.
 */
export function diffPages(prevSnapshot, nextSnapshot) {
  const prevHash = prevSnapshot?.contentHash ?? '';
  const nextHash = nextSnapshot?.contentHash ?? '';
  if (prevHash && prevHash === nextHash) {
    return {
      type: 'page',
      changed: false,
      reason: 'hash_match',
      addedSentences: [],
      removedSentences: [],
      changedChars: 0,
      beforeExcerpt: '',
      afterExcerpt: '',
    };
  }

  const prevText = extractSnapshotText(prevSnapshot);
  const nextText = extractSnapshotText(nextSnapshot);
  const { addedSentences, removedSentences, changedChars } = collectSentenceChanges(
    diffSentences(prevText, nextText),
  );
  const changed = addedSentences.length > 0 || removedSentences.length > 0;

  return {
    type: 'page',
    changed,
    reason: changed ? 'sentence_diff' : 'whitespace_only',
    addedSentences,
    removedSentences,
    changedChars,
    beforeExcerpt: removedSentences.join(' ').slice(0, 600),
    afterExcerpt: addedSentences.join(' ').slice(0, 600),
  };
}
