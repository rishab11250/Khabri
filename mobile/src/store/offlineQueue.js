/**
 * Zustand store buffering optimistic checklist/watch actions while offline and replaying them on reconnect.
 * Deliberately persists both queued actions and local checklist overrides via `fileCache`.
 */
import { create } from 'zustand';

import { api } from '@/lib/api';
import { readJsonCache, writeJsonCache } from '@/lib/fileCache';

const QUEUE_FILE = 'offline-queue.json';
const CHECKLIST_OVERRIDES_FILE = 'checklist-local.json';

// Persisted offline action queue and local checklist toggle state.
export const useOfflineQueueStore = create((set, get) => ({
  queue: [],
  localChecklistDone: {},
  loaded: false,

  hydrateQueue: async () => {
    const [queue, localChecklistDone] = await Promise.all([
      readJsonCache(QUEUE_FILE, []),
      readJsonCache(CHECKLIST_OVERRIDES_FILE, {}),
    ]);
    set({
      queue: Array.isArray(queue) ? queue : [],
      localChecklistDone: localChecklistDone || {},
      loaded: true,
    });
  },

  setChecklistLocal: async (itemId, done) => {
    const next = { ...get().localChecklistDone, [itemId]: done };
    set({ localChecklistDone: next });
    await writeJsonCache(CHECKLIST_OVERRIDES_FILE, next);
  },

  enqueueAction: async (action) => {
    const next = [...get().queue, { ...action, queuedAt: Date.now() }];
    set({ queue: next });
    await writeJsonCache(QUEUE_FILE, next);
  },

  flushQueue: async () => {
    const current = get().queue;
    if (current.length === 0) return 0;

    const remaining = [];
    let replayed = 0;

    for (const action of current) {
      try {
        if (action.type === 'checklist') {
          await api.patchChecklist(action.id, { done: action.done });
          replayed += 1;
        } else if (action.type === 'watch_create') {
          await api.createWatch(action.body);
          replayed += 1;
        }
      } catch {
        remaining.push(action);
      }
    }

    set({ queue: remaining });
    await writeJsonCache(QUEUE_FILE, remaining);
    return replayed;
  },
}));
