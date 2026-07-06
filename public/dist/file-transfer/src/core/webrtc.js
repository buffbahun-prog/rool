export const rtcConfig = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ]
};
export function createPeerConnection() {
    return new RTCPeerConnection(rtcConfig);
}
