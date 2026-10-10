import { useSyncExternalStore } from 'react';
import { historyStore, type HistorySnapshot } from './history';

export function useHistory(): HistorySnapshot {
  return useSyncExternalStore(historyStore.subscribe, historyStore.getSnapshot, historyStore.getSnapshot);
}
