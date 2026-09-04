type Listener = (data: any) => void;

const listeners: Set<Listener> = new Set();

export function addSyncListener(listener: Listener) {
  listeners.add(listener);
}

export function removeSyncListener(listener: Listener) {
  listeners.delete(listener);
}

export function broadcastSyncEvent(data: any) {
  for (const listener of listeners) {
    try {
      listener(data);
    } catch (err) {
      console.error('SSE listener broadcast error:', err);
    }
  }
}
