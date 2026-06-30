const PEERJS_URL = 'https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js';

type PeerEvent = 'open' | 'connection' | 'error' | 'disconnected' | 'close';
type ConnectionEvent = 'open' | 'data' | 'error' | 'close';

export type LiveDataConnection = {
  open: boolean;
  send: (data: unknown) => void;
  close: () => void;
  on: (event: ConnectionEvent, callback: (...args: any[]) => void) => void;
};

export type LivePeer = {
  id: string;
  destroyed: boolean;
  connect: (peerId: string, options?: Record<string, unknown>) => LiveDataConnection;
  destroy: () => void;
  on: (event: PeerEvent, callback: (...args: any[]) => void) => void;
};

type PeerConstructor = new (id?: string, options?: Record<string, unknown>) => LivePeer;

declare global {
  interface Window {
    Peer?: PeerConstructor;
  }
}

let loadingPeerJs: Promise<PeerConstructor> | null = null;

export function loadPeerJs(): Promise<PeerConstructor> {
  if (window.Peer) {
    return Promise.resolve(window.Peer);
  }

  if (loadingPeerJs) {
    return loadingPeerJs;
  }

  loadingPeerJs = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${PEERJS_URL}"]`);
    const script = existingScript ?? document.createElement('script');

    script.src = PEERJS_URL;
    script.async = true;
    script.onload = () => {
      if (window.Peer) {
        resolve(window.Peer);
        return;
      }
      reject(new Error('PeerJS failed to load'));
    };
    script.onerror = () => reject(new Error('PeerJS failed to load'));

    if (!existingScript) {
      document.head.appendChild(script);
    }
  });

  return loadingPeerJs;
}

export async function createLivePeer(id?: string): Promise<LivePeer> {
  const Peer = await loadPeerJs();
  return new Peer(id, {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true,
    debug: 0,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    }
  });
}
