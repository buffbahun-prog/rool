import { PeerType, ViewPage } from "../types";
import { NetworkStatus } from "../utils/networkState";

export const appState = {
  networkStatus: null as NetworkStatus | null,
  peerRole: null as PeerType | null,
  currentView: ViewPage.TransferLanding,
  isQrScanned: false,
};

export function setState<K extends keyof typeof appState>(
  key: K,
  value: typeof appState[K]
) {
  appState[key] = value;
}