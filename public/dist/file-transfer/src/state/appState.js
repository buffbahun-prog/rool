import { ViewPage } from "../types.js";
export const appState = {
    networkStatus: null,
    peerRole: null,
    currentView: ViewPage.TransferLanding,
    isQrScanned: false,
};
export function setState(key, value) {
    appState[key] = value;
}
