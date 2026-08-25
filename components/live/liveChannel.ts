export const LIVE_CHANNEL = 'rastaak-live';
export const LIVE_STORAGE_KEY = 'rastaak-live-patch';
export const LIVE_EVENT = 'rastaak-live-patch';

export type LivePatch = {
  siteContent?: unknown;
  typeChrome?: unknown;
  heroCopy?: unknown;
  flowSteps?: unknown;
  flowChrome?: unknown;
  lights?: unknown;
  materials?: unknown;
  environment?: unknown;
  renderer?: unknown;
  cameraMethod?: unknown;
  cameraStops?: unknown;
  progressKeyframes?: unknown;
  scroll?: unknown;
  look?: unknown;
};

export function publishLive(patch: LivePatch) {
  if (typeof window === 'undefined') return;
  const payload = { ...patch, at: Date.now() };
  try {
    localStorage.setItem(LIVE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
  window.dispatchEvent(new CustomEvent(LIVE_EVENT, { detail: payload }));
  try {
    const channel = new BroadcastChannel(LIVE_CHANNEL);
    channel.postMessage(payload);
    channel.close();
  } catch {
    /* ignore */
  }
}

export function subscribeLive(onPatch: (patch: LivePatch) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handle = (patch: LivePatch) => {
    if (patch && typeof patch === 'object') onPatch(patch);
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== LIVE_STORAGE_KEY || !event.newValue) return;
    try {
      handle(JSON.parse(event.newValue) as LivePatch);
    } catch {
      /* ignore */
    }
  };
  const onLocal = (event: Event) => handle((event as CustomEvent<LivePatch>).detail);
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(LIVE_CHANNEL);
    channel.onmessage = (event) => handle(event.data as LivePatch);
  } catch {
    channel = null;
  }
  window.addEventListener('storage', onStorage);
  window.addEventListener(LIVE_EVENT, onLocal);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(LIVE_EVENT, onLocal);
    channel?.close();
  };
}
