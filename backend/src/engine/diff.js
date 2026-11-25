import { diffSentences } from 'diff';
import { collapseWhitespace } from './normalise.js';

function itemIdentity(item) {
  return item.href ? `href:${item.href}` : `title:${item.title.toLowerCase()}`;
}

export function diffListings(prevItems = [], nextItems = [], options = {}) {
  const displacementThreshold = options.displacementThreshold ?? 5;
  const prevMap = new Map(prevItems.map((item, idx) => [itemIdentity(item), { item, idx }]));
  const nextMap = new Map(nextItems.map((item) => [itemIdentity(item), item]));

  const added = [];
  const updated = [];
  const rawRemoved = [];

  for (const nextItem of nextItems) {
    const key = itemIdentity(nextItem);
    const prevEntry = prevMap.get(key);
    if (!prevEntry) {
      // Check if an item with identical title changed href or date
      const titleMatch = prevItems.find(
        (p) => p.title.toLowerCase() === nextItem.title.toLowerCase(),
      );
      if (titleMatch) {
        if (titleMatch.href !== nextItem.href || titleMatch.dateText !== nextItem.dateText) {
          updated.push({ before: titleMatch, after: nextItem });
        }
      } else {
        added.push(nextItem);
      }
    } else if (
      prevEntry.item.title !== nextItem.title ||
      prevEntry.item.dateText !== nextItem.dateText
    ) {
      updated.push({ before: prevEntry.item, after: nextItem });
    }
  }

  for (const prevItem of prevItems) {
    const key = itemIdentity(prevItem);
    if (!nextMap.has(key)) {
      const matchedByTitle = updated.some(
        (u) => u.before.title.toLowerCase() === prevItem.title.toLowerCase(),
      );
      const stillPresentByTitle = nextItems.some(
        (n) => n.title.toLowerCase() === prevItem.title.toLowerCase(),
      );
      if (!matchedByTitle && !stillPresentByTitle) {
        rawRemoved.push({ item: prevItem, prevIndex: prevMap.get(key)?.idx ?? 0 });
      }
    }
  }

  // Displacement guard: items pushed off the bottom of page 1 by new top items are not removals
  let displacedCount = 0;
  const removed = [];
  if (added.length > 0 && prevItems.length >= displacementThreshold) {
    const tailBoundary = Math.max(0, prevItems.length - added.length - 1);
    for (const entry of rawRemoved) {
      if (entry.prevIndex >= tailBoundary) {
        displacedCount += 1;
      } else {
        removed.push(entry.item);
      }
    }
  } else {
    for (const entry of rawRemoved) {
      removed.push(entry.item);
    }
  }

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

export function diffPages(prevSnapshot, nextSnapshot) {
  const prevHash = prevSnapshot?.contentHash ?? '';
  const nextHash = nextSnapshot?.contentHash ?? '';
  if (prevHash && nextHash && prevHash === nextHash) {
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

  const prevText = collapseWhitespace(prevSnapshot?.text ?? prevSnapshot?.textExcerpt ?? '');
  const nextText = collapseWhitespace(nextSnapshot?.text ?? nextSnapshot?.textExcerpt ?? '');

  const parts = diffSentences(prevText, nextText);
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
