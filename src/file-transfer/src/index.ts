// ===================== IMPORTS =====================
//import "./style.css";
// import QRCode from "qrcode";
// import { BrowserQRCodeReader } from '@zxing/browser';

import {
  formatFileSize,
  formatTimeLeft,
  getFileCategory,
} from "./utils/convert";

// import { UploadAnimation } from "./objects/upload-animation";
import { getNetworkState, NetworkStatus } from "./utils/networkState";
import { FileMetadata, PeerType, TransferState, ViewPage} from "./types";
// import { Reciever } from "./core/reciever";
import { TypedEmitter } from "./core/emmiter";
import { SenderWS } from "../ws/sender-ws";
import { RecieverWS } from "../ws/reciever-ws";
import { PeerTransfer } from "./core/peer-transfer";
import { createSignature, generateSigningKeyPair, verifySignature } from "./crypto/encrypt-decrypt";
import { SHA256 } from "./utils/hasher";
// import { RecieverTest } from "./core/reciever-test";

type FileInfo = {
  fileId: number;
  name: string;
  total: number;
  fileSize: number;
  fileType: string;
};

// const worker = new Worker(
//   new URL("./core/workers/index.worker.ts", import.meta.url),
//   {  type: "module"}
// )

// ===================== DOM =====================
// const videoScanner = document.getElementById("qrVideo") as HTMLVideoElement;
// const codeReader = new BrowserQRCodeReader();
// const canvas = document.getElementById("qrCanvas") as HTMLCanvasElement;

const uploadProgressElm = document.getElementById("uploadProgress")!;
const fileSizeElm = document.getElementById("fileSize")!;
const uploadRateElm = document.getElementById("uploadRate")!;
const pauseToggleBtn = document.getElementById("pauseToggle") as HTMLButtonElement;

const peerPauseBar = document.getElementById("peerPauseBar") as HTMLDivElement;
const peerPauseTextElm = document.getElementById("peerPauseText") as HTMLDivElement;

// const showQR = (data: string) => {
//   QRCode.toCanvas(canvas, data, { errorCorrectionLevel: "L" });
// };


// ===================== COMMON =====================
function updateUIProgress(progress: number) {
  uploadProgressElm.textContent = `${progress.toFixed(0)}%`;
}

function updateSpeed(bytesPerSec: number) {
  uploadRateElm.textContent = `${formatFileSize(bytesPerSec, 0)}/s`;
}


function applyRemotePause(isPause: boolean, by: "reciever" | "sender") {
  peerPauseBar.classList.toggle("show-peer-pause", isPause);
  peerPauseTextElm.textContent = by === "reciever" ? "Paused by Receiver" : "Paused by Sender";
}

// async function initSender() {
  // 1. Initialize sender
  // const sender = await Sender.initConnection(worker);

  // const anim: UploadAnimation = new UploadAnimation(0, "sender");

  // sender.on("stateChange", async (evt) => {
  //   const state = evt.state;

  //   switch (state) {
  //     case TransferState.Handshaking: {
  //       viewPage = ViewPage.FilesTransfer;
  //       await updatePageUI();
  //       // anim.mount();
  //     }
  //   }
  // });

  // sender.on("fileInfo", (evt) => {
  //   const totaChunks = evt.files.reduce((acc, cur) => acc + cur.total, 0);
  //   const filesTotalSize = evt.files.reduce((acc, cur) => acc + cur.fileSize, 0);
  //   // anim.updateRequestedChunks(totaChunks);
  //   fileSizeElm.textContent = formatFileSize(filesTotalSize, 2);
  //   updatePreviewPage(evt.files);
  // });

  // sender.on("progress", (evt) => {
  //   const progress = evt.percent;
  //   updateUIProgress(progress);
  //   // anim.updateProgress(progress);
  // });

  // sender.on("speed", (evt) => {
  //   const speed = evt.bytesPerSecond;
  //   updateSpeed(speed);
  // });

//   sender.on("pause", (evt) => {
//     if (evt.by === "remote") {
//       applyRemotePause(evt.paused, "reciever");
//     }
//   });

//   sender.on("closed", (evt) => {
//     const isClosed = evt.isClosed;
//     if (!isClosed) return;
//     // anim.cleanup();
//   });

//   pauseToggleBtn.onclick = () => {
//     if (!sender) return; // safety check

//     // Toggle pause state
//     const nextPause = !sender.getisPaused();

//     // Inform sender to pause/resume properly
//     sender.onLocalPause(nextPause);

//     // Update button UI
//     pauseToggleBtn.textContent = nextPause ? "Resume" : "Pause";
//     pauseToggleBtn.classList.toggle("paused", nextPause);
//   };

//   return sender;
// }

// async function initReceiver() {
//   const receiver = await Reciever.initConnection();

//   // const anim = new UploadAnimation(0, "receiver");

//   let filesInfo: FileInfo[] | null = null;

//   receiver.on("stateChange", async (evt) => {
//     const state = evt.state;

//     // switch (state) {
//     //   case TransferState.Handshaking: {
//     //     viewPage = ViewPage.FilesTransfer;
//     //     await updatePageUI();
//     //     // anim.mount();
//     //   }
//     // }
//   });

//   receiver.on("fileInfo", (evt) => {
//     // filesInfo = evt.files;
//     // const totaChunks = evt.files.reduce((acc, cur) => acc + cur.total, 0);
//     // const filesTotalSize = evt.files.reduce((acc, cur) => acc + cur.fileSize, 0);
//     // // anim.updateRequestedChunks(totaChunks);
//     // fileSizeElm.textContent = formatFileSize(filesTotalSize, 2);
//     // updatePreviewPage(evt.files);
//   });

//   receiver.on("progress", (evt) => {
//     const progress = evt.percent;
//     updateUIProgress(progress);
//     // anim.updateProgress(progress);
//   });

//   receiver.on("speed", (evt) => {
//     const speed = evt.bytesPerSecond;
//     updateSpeed(speed);
//   });

//   receiver.on("pause", (evt) => {
//     if (evt.by === "remote") {
//       applyRemotePause(evt.paused, "sender");
//     }
//   });

//   receiver.on("complete", (evt) => {
//     if (filesInfo && evt) setupFinalDownload(filesInfo, evt.opfs);
//   });

//   receiver.on("closed", (evt) => {
//     const isClosed = evt.isClosed;
//     if (!isClosed) return;
//     // anim.cleanup();
//   });
  
//   pauseToggleBtn.onclick = () => {
//     const nextPause = !receiver['pauseState'].pause;

//     receiver.onLocalPause(nextPause);

//     pauseToggleBtn.textContent = nextPause ? "Resume" : "Pause";
//     pauseToggleBtn.classList.toggle("paused", nextPause);
//   };

//   return receiver;
// }

async function setupFinalDownload(filesInfo: FileInfo[], opfsRoot: FileSystemDirectoryHandle) {
    downloadBtn.classList.remove("disabled");
    downloadBtn.onclick = async () => {
      const filteredFilesInfo = filesInfo.filter(info => !removeFileIds.includes(info.fileId));
        for (const info of filteredFilesInfo) {
            const fileHandle = await opfsRoot.getFileHandle(info.name);
            const file = await fileHandle.getFile();
            
            // Trigger the browser's native "Save As" or download behavior
            const a = document.createElement("a");
            a.href = URL.createObjectURL(file);
            a.download = info.name;
            a.click();
        }
    };
}

// function stopCamera() {
//   (videoScanner.srcObject as MediaStream)?.getTracks().forEach(t => t.stop());
//   videoScanner.srcObject = null;
// }

// let sender: Sender | null = null;
// let reciever: Reciever | null = null;

// let networkStatus: NetworkStatus | null = null;
// let connectionType: ConnectionType = ConnectionType.Local;
let peerType: PeerType | null = null;
let viewPage: ViewPage = ViewPage.TransferLanding;

const localInitialView = document.getElementById("local") as HTMLDivElement;
// const globalInitialView = document.getElementById("global") as HTMLDivElement;
const roomJoinView = document.getElementById("qrExchangeCard") as HTMLDivElement;
const roomJoinViewChooseCont = document.getElementById("qrExchangeChoose") as HTMLDivElement;
const downloadBtn = document.getElementById("downloadBtn") as HTMLDivElement;

const genRoomHeading = document.getElementById("showQr") as HTMLDivElement;
const joinRoomHeading = document.getElementById("scanQr") as HTMLDivElement;

async function updatePageUI() {

  console.log(peerType, viewPage);
  switch (peerType) {
    case PeerType.Sender: {
      roomJoinViewChooseCont.classList.remove("reverse-row");
      genRoomHeading.classList.remove("hidden");
      joinRoomHeading.classList.add("hidden");
      downloadBtn.classList.add("hidden");

      break;
    } case PeerType.Reciever: {
      console.log("rec");
      genRoomHeading.classList.add("hidden");
      joinRoomHeading.classList.remove("hidden");
      break;
    }
  }

  switch (viewPage) {
    case ViewPage.TransferLanding: {
      transferLandingView.classList.remove("hidden");
      localCardFileUploadView.classList.add("hidden");
      roomJoinView.classList.add("hidden");
      fileTransferView.classList.add("hidden");

      // sender = null;
      // reciever = null;

      break;
    } case ViewPage.FilesUpload: {
      transferLandingView.classList.add("hidden");
      localCardFileUploadView.classList.remove("hidden");
      roomJoinView.classList.add("hidden");
      fileTransferView.classList.add("hidden");

      break;
    } case ViewPage.JoinRoom:
      case ViewPage.CreateRoom: {
      transferLandingView.classList.add("hidden");
      localCardFileUploadView.classList.add("hidden");
      fileTransferView.classList.add("hidden");
      roomJoinView.classList.remove("hidden");

      // if (peerType === PeerType.Sender) {
      //   if (sender === null) sender = await initSender();
      //   await sender.initFiles(fileHandles);
      // }

      // if (peerType === PeerType.Reciever && reciever === null) {
      //   // reciever = await initReceiver();
      // }

      if (viewPage === ViewPage.CreateRoom) {
        // showQrBtn.classList.add("selected");
        createRoomView.classList.remove("hidden");

        // scanQrBtn.classList.remove("selected");
        joinRoomView.classList.add("hidden");

        console.log("here");

        // if (peerType === PeerType.Sender && sender) {
        //   // const offer = await sender.getDescriptorJSON();
        //   // showQR(offer);
        // }
        // if (peerType === PeerType.Reciever && reciever) {
        //   // const answer = await reciever.getDescriptorJSON();
        //   // showQR(answer);
        // }
      } else {
        // scanQrBtn.classList.add("selected");
        joinRoomView.classList.remove("hidden");

        // showQrBtn.classList.remove("selected");
        createRoomView.classList.add("hidden");
        
        // if (peerType === PeerType.Sender && sender) {
        //   // const answer = await scanQRAndReturn();
        //   // isQrScanned = true;
        //   // await sender.setRemoteDescriptor(answer);
        // }
        // if (peerType === PeerType.Reciever && reciever) {
        //   // const offer = await scanQRAndReturn();
        //   // isQrScanned = true;
        //   // await reciever.setRemoteDescriptor(offer);
        //   viewPage = ViewPage.CreateRoom;
        //   updatePageUI();
        // }
      }

      break;
    } case ViewPage.FilesTransfer: {
        transferLandingView.classList.add("hidden");
        localCardFileUploadView.classList.add("hidden");
        fileTransferView.classList.remove("hidden");
        roomJoinView.classList.add("hidden");

        pauseToggleBtn.classList.remove("hidden");
        downloadBtn.classList.add("disabled");
      break;
    }
  }
}



window.addEventListener("load", () => {
  updatePageUI();
});

const transferLandingView = document.getElementById("transferLanding") as HTMLDivElement;
const localCardFileUploadView = document.getElementById("localCardFileUpload") as HTMLDivElement;
const sendFileLocalBtn = document.getElementById("sendFileLocal") as HTMLLIElement;
const recieveFileLocalBtn = document.getElementById("recieveFileLocal") as HTMLLIElement;
const localFileUploadBackBtn = document.getElementById("localFileUploadBackBtn") as HTMLDivElement;

recieveFileLocalBtn.addEventListener('click', () => {
  peerType = PeerType.Reciever;
  viewPage = ViewPage.JoinRoom;
  updatePageUI();
})

sendFileLocalBtn.addEventListener("click", () => {
  peerType = PeerType.Sender;
  viewPage = ViewPage.FilesUpload;
  updatePageUI();
});

localFileUploadBackBtn.addEventListener("click", () => {
  peerType = null;
  viewPage = ViewPage.TransferLanding;
  updatePageUI();
});

const localFileUploadBtn = document.getElementById("localFileDrpzn") as HTMLDivElement;

// Global state: only store handles, not File objects!
let fileHandles: (FileSystemFileHandle | File)[] = [];
localFileUploadBtn.addEventListener("click", async () => {
  try {
    //@ts-ignore
    const pickerHandles = await window.showOpenFilePicker({
      multiple: true
    });

    fileHandles.push(...pickerHandles);
    
    updateLocalFileView();
  } catch (err) {
    const fileElm = document.createElement("input") as HTMLInputElement;
    fileElm.hidden = true;
    fileElm.type = "file";
    fileElm.multiple =  true;
    document.body.appendChild(fileElm);
    fileElm.click();

    fileElm.addEventListener("change", (evt) => {
    const input = evt.target as HTMLInputElement;

    if (!input.files) return;

    for (const file of input.files) {
        fileHandles.push(file);
    }

    updateLocalFileView();
    fileElm.remove(); // Optional: clean up the temporary input
});

    console.error("User cancelled or browser doesn't support API", err);
  }
});

async function removeFile(index: number) {
  fileHandles.splice(index, 1);
  updateLocalFileView();
}

const totalVolSummaryElm = document.getElementById("totalVolSummary")!;
const totalFilesSummaryElm = document.getElementById("totalFilesSummary")!;
const localFileListCont = document.getElementById("localFileList")!;

async function getAllFilesInfo() {
  const filesInfo: {name: string; fileType: string, fileSize: number}[] = [];
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (const handle of fileHandles) {
    const file = (handle instanceof FileSystemFileHandle) ? await handle.getFile() : handle;
    filesInfo.push({
      name: file.name,
      fileType: file.type,
      fileSize: file.size,
    })
    await delay(0);
  }

  return filesInfo;
}

async function updateLocalFileView() {
  if (fileHandles.length > 0) {
    const allFiles = await getAllFilesInfo();
    const totalSize = allFiles.reduce((acc, cur) => acc + cur.fileSize, 0);
    const totalFiles = fileHandles.length;

    totalVolSummaryElm.textContent = formatFileSize(totalSize, 2);
    totalFilesSummaryElm.textContent = `${totalFiles}`;

    localFileListCont.innerHTML = ``;
    localCardFileUploadView.classList.add("has-file");
    for (const [index, file] of allFiles.entries()) {
      const fileName = file.name;
      const fileSize = formatFileSize(file.fileSize, 2);
      const fileType = getFileCategory(undefined,file.fileType);

      const liElement = document.createElement("li");

      liElement.innerHTML = `
          <div>
            <div>
              <img src="file.svg" alt="">
            </div>
            <div>
              <span>${fileName}</span>
              <span><span>${fileSize}</span> <img src="dot.svg" alt=""> <span>${fileType}</span></span>
            </div>
          </div>
          <div class="file-rmv-btn">
            <img src="cross.svg" alt="">
          </div>
      `;
      const removeBtn = liElement.querySelector(".file-rmv-btn") as HTMLDivElement;
      removeBtn?.addEventListener("click",(e) => {
        e.stopPropagation();
        removeFile(index);
      });

      localFileListCont.appendChild(liElement);
    }
    localFileListCont.scrollTop = localFileListCont.scrollHeight;
  } else {
    localCardFileUploadView.classList.remove("has-file");
    localFileListCont.innerHTML = ``;
  }
}

const previewFileListCont = document.getElementById("previewFileList") as HTMLUListElement;
const previewFilesSummary = document.getElementById("previewFilesSummary") as HTMLDivElement;
const previewVolSummary = document.getElementById("previewVolSummary") as HTMLDivElement;
let removeFileIds: number[] = [];

function updatePreviewPage(filesInfo: FileInfo[]) {
  const totalSize = filesInfo.reduce((acc, cur) => acc + cur.fileSize, 0);
  const totalFiles = filesInfo.length;

  previewVolSummary.innerText = formatFileSize(totalSize);
  previewFilesSummary.innerText = totalFiles.toString();

  previewFileListCont.innerHTML = ``;
  for (const info of filesInfo) {
    const fileName = info.name;
    const fileSize = formatFileSize(info.fileSize, 2);
    const fileType = getFileCategory(undefined, info.fileType);

    const liElement = document.createElement("li");
    liElement.innerHTML = `
        <div>
          <div>
            <img src="file.svg" alt="">
          </div>
          <div>
            <span>${fileName}</span>
            <span><span>${fileSize}</span> <img src="dot.svg" alt=""> <span>${fileType}</span></span>
          </div>
        </div>
        <div class="file-rmv-btn">
          ${removeFileIds.includes(info.fileId) ? '<img src="dot.svg" width="12px" alt="">' : '<img src="check.svg" width="16px" alt="">'}
        </div>
    `;
    const removeBtn = liElement.querySelector(".file-rmv-btn") as HTMLDivElement;
    removeBtn?.addEventListener("click",(e) => {
      e.stopPropagation();
      if (removeFileIds.includes(info.fileId)) removeFileIds = removeFileIds.filter(id => id !== info.fileId);
      else removeFileIds.push(info.fileId);
      updatePreviewPage(filesInfo);
    });

    previewFileListCont.appendChild(liElement);
  }
}

const localFileUploadNextBtn = document.getElementById("localFileUploadNextBtn") as HTMLDivElement;

localFileUploadNextBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (fileHandles.length <= 0) return;
  viewPage = ViewPage.CreateRoom;
  updatePageUI();
});

const qrExchangeBackBtn = document.getElementById("qrExchangeBackBtn") as HTMLDivElement;
// const showQrBtn = document.getElementById("showQr") as HTMLDivElement;
// const scanQrBtn = document.getElementById("scanQr") as HTMLDivElement;
const createRoomView = document.getElementById("showQrCard") as HTMLDivElement;
const joinRoomView = document.getElementById("scanQrCard") as HTMLDivElement;

qrExchangeBackBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (peerType === PeerType.Sender) viewPage = ViewPage.FilesUpload;
  else {
    peerType = null;
    viewPage = ViewPage.TransferLanding;
  }
  updatePageUI();
});

const fileTransferView = document.getElementById("localCardFileTransfer") as HTMLDivElement;
const transferCancleBtn = document.getElementById("transferCancleBtn") as HTMLDivElement;

transferCancleBtn.addEventListener("click", () => {
  // if (sender) {
  //   sender.cleanup();
  // }
  // if (reciever) {
  //   reciever.cleanup();
  // }
  // sender = null;
  // reciever = null;

  while (fileHandles.length) fileHandles.pop();

  viewPage = ViewPage.TransferLanding;
  peerType = null;
  // connectionType = ConnectionType.Local;
  // updateHomePage();
  updatePageUI();
});

const inputs = document.querySelectorAll(".pin") as NodeListOf<HTMLInputElement>;
const roomJoinBtn = document.getElementById("roomJoinBtn");

const url = new URL(window.location.href);
const params = url.searchParams;

const roomCode = params.get("roomCode");

// move forward on input
inputs.forEach((input, index) => {
  input.addEventListener("input", (e: any) => {
    const value = e.target?.value;

    // allow only alphanumeric
    e.target.value = value.replace(/[^a-zA-Z0-9]/g, "");

    if (e.target.value && index < inputs.length - 1) {
      inputs[index + 1].focus();
    }
  });

  // backspace behavior
  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !input.value && index > 0) {
      inputs[index - 1].focus();
    }
  });
});

inputs[0].addEventListener("paste", (e) => {
  e.preventDefault();

  const text = (e.clipboardData)
    ?.getData("text")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, inputs.length);

  text?.split("").forEach((char, i) => {
    if (inputs[i]) {
      inputs[i].value = char;
    }
  });

  // focus last filled input
  const lastIndex = Math.min(text?.length ?? 0, inputs.length - 1);
  inputs[lastIndex].focus();
});

if (roomCode && roomCode.length === 5) {
     peerType = PeerType.Reciever;
     viewPage = ViewPage.JoinRoom;
     await updatePageUI();
     
    const text = roomCode
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, inputs.length);

  text.split("").forEach((char, i) => {
    if (inputs[i]) {
      inputs[i].value = char;
    }
  });

  // focus last filled input
  const lastIndex = Math.min(text.length, inputs.length - 1);
  inputs[lastIndex].focus();
}

const createRoomBtn = document.getElementById("createRoomBtn") as HTMLButtonElement | null;
const createdRoomCodeText = document.getElementById("createdRoomCodeText");

const infoBar = document.getElementById("infoBar");
const infoBarText = document.getElementById("infoBarText");

const infoBarR = document.getElementById("infoBarR");
const infoBarTextR = document.getElementById("infoBarTextR");

let senderWS: SenderWS | null = null;
let recieverWS: RecieverWS | null = null;

let senderWRTC: PeerTransfer | null = null;
let recieverWRTC: PeerTransfer | null = null;

pauseToggleBtn.addEventListener("click", () => {
  if (senderWRTC) senderWRTC.onTransferPause();
  if (recieverWRTC) recieverWRTC.onTransferPause();
});

createRoomBtn?.addEventListener("click", async () => {
  if (senderWS) return;
  createRoomBtn.setAttribute("disabled", "disabled");
  if (infoBarText) infoBarText.textContent = "Creating Room";
  if (infoBar) infoBar.classList.add("show-info");
  senderWS = new SenderWS();
  senderWRTC = new PeerTransfer(PeerType.Sender ,fileHandles as FileSystemFileHandle[] | File[]);

  senderWS.on("roomCreate", (payload) => {
    const code = payload.code;
    if (!code) {
      if (infoBarText) infoBarText.textContent = "Failed Retry";
      createRoomBtn.removeAttribute("disabled");
      return;
    }
    
    if (createdRoomCodeText) createdRoomCodeText.textContent = code;
  });

  senderWS.on("roomJoining", () => {
    if (infoBarText) infoBarText.textContent = "Joining Room";
  });

  senderWS.on("roomJoin", async () => {
    if (infoBarText) infoBarText.textContent = "Joined Room";
    if (infoBarText) infoBarText.textContent = "Waiting Reciever Join Room";
  });

  senderWS.on("answer", (payload) => {
    senderWRTC?.setAnswer(payload.value);
    if (infoBarText) infoBarText.textContent = "Exchanging Peer Informations";
  });

  senderWS.on("recieverCandidates", (payload) => {
    console.log("reciever candidates", payload);
    senderWRTC?.addRemoteCandidate(payload.value);
  });

  senderWRTC.on("gatheringComplete", (payload) => {
    if (!payload.complete) return;
    const createRoomCodeCont = document.getElementById("createRoomCodeCont");
    createRoomCodeCont?.classList.remove("hidden");
  })

  senderWRTC.on("offer", (payload) => {
    const offerJson = payload.value;
    if (!senderWS || !offerJson) return;
    senderWS.sendOffer(offerJson);
  });

  senderWRTC.on("senderCandidates", (payload) => {
    const candidateJson = payload.value;
    if (!senderWS || !candidateJson) return;
    senderWS.sendSenderCandidates(candidateJson);
  });

  senderWRTC.on("safetyCode", (payload) => {
    const safetyCode = payload.value;
    privacyPopover(safetyCode);
  });

  downloadBtn.remove();

  let fileProgressElms: {
    fileId: number;
    elms: FileProgressElms | undefined;
  }[] = [];

  let fileProgressAnims: FileProgressAnim[] = [];

  senderWRTC.on("fileInfo", (payload) => {
    const filesInfoList = payload.files;
    fileProgressElms = filesInfoList.map((fil) => {
      return {
        fileId: fil.fileId,
        elms: createFileCard(fil),
      }
    });

    fileProgressAnims = fileProgressElms.map((fpe) => {
      return {
        fileId: fpe.fileId,
        animId: null,
        currentAngle: 0,
        lastEventTime: null,
        arcPath: fpe.elms?.pathElm ?? null,
        cx: 100,
        cy: 100,
        r: 80,
      }
    });

    fileProgressElms.forEach((fpe) => {
      if (!fpe.elms) throw new Error("File card not initialized properly");
      fpe.elms.uploadStatusElm.textContent = "Uploading";
      fpe.elms.pauseBtnElm.addEventListener("click", () => {
        senderWRTC?.onFilePause(fpe.fileId);
      });

      fpe.elms.dwnldBtnElm.remove();
      fpe.elms.selectButtonElm.remove();
    });

    viewPage = ViewPage.FilesTransfer;
    updatePageUI();
  });

  senderWRTC.on("progress", (payload) => {
    const {fileId, progressRatio, timeLeft, speed, of, reset} = payload;
    const filePrgAnim = fileProgressAnims.find(fpa => fpa.fileId === fileId);
    const filePrgElm = fileProgressElms.find(fpe => fpe.fileId === fileId);
    if (!filePrgAnim || !filePrgElm) throw new Error("No file with fileId: " + fileId + " found");
    if (!filePrgElm.elms) throw new Error("no progress percentage element found for fileId: " + fileId);

    filePrgElm.elms.progressSpeedElm.textContent = `${formatFileSize(speed, 0)}/s`;

    filePrgElm.elms.progressTimeElm.textContent = formatTimeLeft(timeLeft);

    const progressPercentage = (progressRatio * 100).toFixed(1);
    filePrgElm.elms.progressPercentageElm.textContent = progressPercentage + "%";
    const targetRadian = progressRatio * (2 * Math.PI);
    smoothProgressTo(targetRadian, filePrgAnim, reset);
  });

  senderWRTC.on("transferPause", (payload) => {
    const {by, paused} = payload;
    if (by === "remote") applyRemotePause(paused, "reciever");
    else {
      pauseToggleBtn.textContent = paused ? "Resume" : "Pause";
      pauseToggleBtn.classList.toggle("paused", paused);
    }
  });

  senderWRTC.on("filePause", (payload) => {
    const {fileId, by, paused} = payload;
    const filePrgElm = fileProgressElms.find(fpe => fpe.fileId === fileId);
    if (!filePrgElm?.elms) throw new Error("No file with fileId: " + fileId + " found");
    if (by === "remote") {
      filePrgElm.elms.uploadStatusElm.textContent = paused ? "Paused by reciever" : "Uploading";
    } else {
      filePrgElm.elms.pauseBtnTxtElm.textContent = paused ? "Resume" : "Pause";
      filePrgElm.elms.pauseBtnElm.classList.toggle("paused", paused);
    }
  });

  senderWRTC.on("fileUploadComplete", (payload) => {
    const {fileId} = payload;
    const filePrgElm = fileProgressElms.find(fpe => fpe.fileId === fileId);
    if (!filePrgElm?.elms) throw new Error("No file with fileId: " + fileId + " found");
    filePrgElm.elms.uploadStatusElm.textContent = "Upload Complete";
    // disable pause button
    filePrgElm.elms.pauseBtnElm.disabled = true;
  });

  await senderWS.init();
  await senderWRTC.initWRTC();
});

roomJoinBtn?.addEventListener("click", async () => {
  if (recieverWS) return;
  const roomCode = getCodeInput();
  if (roomCode.length !== 5) {
    popoverUI("error", "Please fill all the input fields");
    roomJoinBtn.removeAttribute("disabled");
    return;
  }
  roomJoinBtn.setAttribute("disabled", "disabled");
  if (infoBarR) infoBarR.classList.add("show-info");
  if (infoBarTextR) infoBarTextR.textContent = "Joining Room";
  recieverWS = new RecieverWS();
  recieverWRTC = new PeerTransfer(PeerType.Reciever, []);

  recieverWS.on("roomJoining", () => {
    if (infoBarTextR) infoBarTextR.textContent = "Joining Room";
  });

  recieverWS.on("roomJoin", async () => {
    if (infoBarTextR) infoBarTextR.textContent = "Joined Room";
  });

  recieverWS.on("offer", async (payload) => {
    console.log("offer", payload.value);
    recieverWRTC?.setOffer(payload.value);
    // recieverWS?.sendAnswer("This is answer");
    // await new Promise(resolve => setTimeout(resolve, 2000));
    if (infoBarTextR) infoBarTextR.textContent = "Exchanging Peer Infomations";
  });

  recieverWS.on("senderCandidates", (payload) => {
    recieverWRTC?.addRemoteCandidate(payload.value);
  });

  recieverWRTC.on("answer", (payload) => {
    recieverWS?.sendAnswer(payload.value);
  });

  recieverWRTC.on("recieverCandidates", (payload) => {
    recieverWS?.sendRecieverCandidates(payload.value);
  });

  recieverWRTC.on("safetyCode", (payload) => {
    const safetyCode = payload.value;
    privacyPopover(safetyCode);
  });

  let fileProgressElms: {
    fileId: number;
    elms: FileProgressElms | undefined;
  }[] = [];

  let fileProgressAnims: FileProgressAnim[] = [];

  const selectedFileIdsForDwnld: Map<number, boolean> = new Map();

  recieverWRTC.on("fileInfo", (payload) => {
    const filesInfoList = payload.files;
    fileProgressElms = filesInfoList.map((fil) => {
      return {
        fileId: fil.fileId,
        elms: createFileCard(fil),
      }
    });

    fileProgressAnims = fileProgressElms.map((fpe) => {
      return {
        fileId: fpe.fileId,
        animId: null,
        currentAngle: 0,
        lastEventTime: null,
        arcPath: fpe.elms?.pathElm ?? null,
        cx: 100,
        cy: 100,
        r: 80,
      }
    });

    fileProgressElms.forEach((fpe) => {
      if (!fpe.elms) throw new Error("File card not initialized properly");
      fpe.elms.uploadStatusElm.textContent = "Downloading";
      fpe.elms.pauseBtnElm.addEventListener("click", () => {
        recieverWRTC?.onFilePause(fpe.fileId);
      });

      fpe.elms.dwnldBtnElm.addEventListener("click", async () => {
        if (fpe.elms?.dwnldBtnElm) {
          fpe.elms.dwnldBtnElm.disabled = true;
          const fileHandleName = recieverWRTC?.onFileDownload(fpe.fileId);
          if (!fileHandleName) return;
          const root = await navigator.storage.getDirectory();
          const fileHandle = await root.getFileHandle(fileHandleName);
          console.log(fileHandle);
        const file = await fileHandle.getFile();
        const url = URL.createObjectURL(file);
        const downloadElm = document.createElement("a") as HTMLAnchorElement;
        downloadElm.href = url;
        downloadElm.download = file.name;
        downloadElm.style.display = "none";

        document.body.appendChild(downloadElm);
        downloadElm.click();

        document.body.removeChild(downloadElm);
        URL.revokeObjectURL(url);
          fpe.elms.dwnldBtnElm.disabled = false;
        }
      });

      fpe.elms.selectButtonElm.addEventListener("click", (evt) => {
        if (fpe.elms?.selectButtonElm) {
          const isSelected = fpe.elms.selectButtonElm.classList.toggle("selected");
          selectedFileIdsForDwnld.set(fpe.fileId, isSelected);
        }
      });

      fpe.elms.dwnldBtnElm.disabled = true;
    });

    viewPage = ViewPage.FilesTransfer;
    updatePageUI();
  });

  recieverWRTC.on("progress", (payload) => {
    const {fileId, progressRatio, timeLeft, speed, of, reset} = payload;
    const filePrgAnim = fileProgressAnims.find(fpa => fpa.fileId === fileId);
    const filePrgElm = fileProgressElms.find(fpe => fpe.fileId === fileId);
    if (!filePrgAnim || !filePrgElm) throw new Error("No file with fileId: " + fileId + " found");
    if (!filePrgElm.elms) throw new Error("no progress percentage element found for fileId: " + fileId);

    filePrgElm.elms.progressSpeedElm.textContent = `${formatFileSize(speed, 0)}/s`;

    filePrgElm.elms.progressTimeElm.textContent = formatTimeLeft(timeLeft);

    const progressPercentage = (progressRatio * 100).toFixed(1);
    filePrgElm.elms.progressPercentageElm.textContent = progressPercentage + "%";
    const targetRadian = progressRatio * (2 * Math.PI);
    smoothProgressTo(targetRadian, filePrgAnim);
  });

  recieverWRTC.on("isHashing", (payload) => {
    const filePrgElm = fileProgressElms.find(fpe => fpe.fileId === payload.fileId);
    if (!filePrgElm?.elms) throw new Error("no progress percentage element found for fileId: " + payload.fileId);
    filePrgElm.elms.uploadStatusElm.textContent = "Verifying File";
    filePrgElm.elms.pauseBtnElm.disabled = true;
  });

  recieverWRTC.on("isFileValid", (payload) => {
        const filePrgElm = fileProgressElms.find(fpe => fpe.fileId === payload.fileId);
    if (!filePrgElm?.elms) throw new Error("no progress percentage element found for fileId: " + payload.fileId);
    filePrgElm.elms.uploadStatusElm.textContent = payload.isValid ? "File Valid": "File Currupted";

    if (payload.isValid) {
      filePrgElm.elms.dwnldBtnElm.disabled = false;
      downloadBtn.classList.remove("disabled");
      filePrgElm.elms.selectButtonElm.classList.add("selected");
      selectedFileIdsForDwnld.set(payload.fileId, true);
    }
  });

  recieverWRTC.on("transferPause", (payload) => {
    const {by, paused} = payload;
    if (by === "remote") applyRemotePause(paused, "reciever");
    else {
      pauseToggleBtn.textContent = paused ? "Resume" : "Pause";
      pauseToggleBtn.classList.toggle("paused", paused);
    }
  });

  recieverWRTC.on("filePause", (payload) => {
    const {fileId, by, paused} = payload;
    const filePrgElm = fileProgressElms.find(fpe => fpe.fileId === fileId);
    if (!filePrgElm?.elms) throw new Error("No file with fileId: " + fileId + " found");
    if (by === "remote") {
      filePrgElm.elms.uploadStatusElm.textContent = paused ? "Paused by sender" : "Downloading";
    } else {
      console.log("paused", paused);
      filePrgElm.elms.pauseBtnTxtElm.textContent = paused ? "Resume" : "Pause";
      filePrgElm.elms.pauseBtnElm.classList.toggle("paused", paused);
    }
  });

  downloadBtn.addEventListener("click", () => {
    if (downloadBtn.classList.contains("disabled")) return;
    downloadBtn.classList.add("disabled");
    fileProgressElms.map((fpe) => fpe.fileId)
    .filter(fi => selectedFileIdsForDwnld.get(fi))
    .forEach(async (fi) => {
      const fileHandleName = recieverWRTC?.onFileDownload(fi);
          if (!fileHandleName) return;
          const root = await navigator.storage.getDirectory();
          const fileHandle = await root.getFileHandle(fileHandleName);
          console.log(fileHandle);
        const file = await fileHandle.getFile();
        const url = URL.createObjectURL(file);
        const downloadElm = document.createElement("a") as HTMLAnchorElement;
        downloadElm.href = url;
        downloadElm.download = file.name;
        downloadElm.style.display = "none";

        document.body.appendChild(downloadElm);
        downloadElm.click();

        document.body.removeChild(downloadElm);
        URL.revokeObjectURL(url);
    });
    downloadBtn.classList.remove("disabled");
  });

  await recieverWRTC.initWRTC();
  await recieverWS.init(roomCode);
});

const popoverElm = document.getElementById("privacyPopover");

function privacyPopover(safetyNum: string) {
    const numDisplayElm = document.getElementById("safetyNum");

    if (!popoverElm || !numDisplayElm) throw new Error("Privacy popover element not on the DOM");
    
    numDisplayElm.textContent = safetyNum;
    popoverElm.showPopover();
}

const safetyCodeMatchBtn = document.getElementById("privacyBtnMatch");
const safetyCodeBypassBtn = document.getElementById("privacyBtnBypass");

safetyCodeMatchBtn?.addEventListener("click", () => {
  if (popoverElm) popoverElm.hidePopover();
  if (peerType === PeerType.Sender && senderWRTC) {
    senderWRTC.onPrivaryPopoverConfirm(true);
  } else if (peerType === PeerType.Reciever && recieverWRTC) {
    recieverWRTC.onPrivaryPopoverConfirm(true);
  }
});

safetyCodeBypassBtn?.addEventListener("click", () => {
  if (popoverElm) popoverElm.hidePopover();
  if (peerType === PeerType.Sender && senderWRTC) {
    senderWRTC.onPrivaryPopoverConfirm(false);
  } else if (peerType === PeerType.Reciever && recieverWRTC) {
    recieverWRTC.onPrivaryPopoverConfirm(false);
  }
});

const scCopyBtn = document.getElementById("scCopyBtn");
const scShareBtn = document.getElementById("scShareBtn");

scCopyBtn?.addEventListener("click", () => {
  const numDisplayElm = document.getElementById("safetyNum");
  if (!numDisplayElm) return;
  const safetyCode = numDisplayElm.textContent;
  copyToClipBoard(safetyCode);
});

scShareBtn?.addEventListener("click", () => {
  const numDisplayElm = document.getElementById("safetyNum");
  if (!numDisplayElm) return;
  const safetyCode = numDisplayElm.textContent;
  shareSecurityCode(safetyCode);  
});

function getCodeInput() {
  const roomCode = [...inputs]
  .map((inp) => inp.value.trim().toUpperCase())
  .filter((inp) => inp)
  .join("");

  return roomCode;
}

const copyCodeBtn = document.getElementById("copyBtn");
const shareUrlBtn = document.getElementById("shareBtn");

copyCodeBtn?.addEventListener("click", () => {
  const code = createdRoomCodeText?.textContent;
  if (code) copyToClipBoard(`https://rool.buffbahun.workers.dev/file-transfer/?roomCode=${code}`);
});

shareUrlBtn?.addEventListener("click", () => {
  const code = createdRoomCodeText?.textContent;
  if (code) shareRoomUrl(code);
});

// -------------------------- ws signalling server -----------------------------------

// function disconnectFromRoom() {
//   if (!roomConnectWS) return;

//   roomConnectWS.close(1000, 'Room close.');
//   roomConnectWS = null;
// }


// ----------------- Utils -----------------

async function copyToClipBoard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    popoverUI("success", "Copied to clipboard.");
  } catch {
    popoverUI("error", "Failed to copy.");
  }
}

async function shareSecurityCode(code: string) {
  try {
    await navigator.share({
      title: "Security Code",
      text: code,
    });
  } catch {
    popoverUI("error", "Failed to share");
  }
}

async function shareRoomUrl(code: string) {
  try {
    await navigator.share({
      title: "Room Join URL",
      text: `https://rool.buffbahun.workers.dev/file-transfer/?roomCode=${code}`,
    });
  } catch {
    popoverUI("error", "Failed to share");
  }
}

function popoverUI(type: "error" | "success", message: string) {
    const errorPopoverElm = document.getElementById("errorPop");
    const errorMessageElm = document.getElementById("errPopMsg");
    const errorPopTitle = document.getElementById("errorPopTitle");

    if (!errorPopoverElm || !errorMessageElm || !errorPopTitle) return;
    errorPopoverElm.classList.remove("show");
    errorPopoverElm.classList.add("show");
    errorMessageElm.textContent = message;

    errorPopTitle.textContent = type.toUpperCase();
    if (type === "success") {
      errorPopoverElm.classList.add("success");
    } else {
      errorMessageElm.classList.remove("success");
    }

    const keyframes = [
      { transform: 'translateX(200px)', opacity: 0 },
      { transform: 'translateX(0px)', opacity: 1 },
    ];

    const options = {
      duration: 500,
      iterations: 1,
      easing: 'ease-in-out'
    };

    errorPopoverElm.animate(keyframes, options);
    setTimeout(() => {
      const dissaperKeyframe = [
        { transform: 'translateX(0px)', opacity: 1 },
        { transform: 'translateX(200px)', opacity: 0 },
      ];

      const dissaperAnim = errorPopoverElm.animate(dissaperKeyframe, options);
      dissaperAnim.onfinish = () => {
        errorPopoverElm.classList.remove("show");
        errorPopoverElm.classList.remove("success");
      };
    }, 5000);

}

interface FileProgressElms {
  pathElm: SVGPathElement;
  uploadStatusElm: HTMLSpanElement;
  progressSpeedElm: HTMLSpanElement;
  progressTimeElm: HTMLSpanElement;
  progressPercentageElm: HTMLSpanElement;
  pauseBtnElm: HTMLButtonElement;
  pauseBtnTxtElm: HTMLSpanElement;
  dwnldBtnElm: HTMLButtonElement;
  selectButtonElm: HTMLDivElement;
}

function createFileCard(fileMeta: FileMetadata): FileProgressElms | undefined {
  const {fileId, fileName, fileType, fileSize, totalChunks} = fileMeta;
  // Grab the structural template
  const parentElm = document.getElementById("previewFileList");
  const template = document.getElementById("pieProgressTemplate") as HTMLTemplateElement | null;
  if (!template || !parentElm) return;

  const clone = template.content.cloneNode(true) as DocumentFragment;

  const filterElm = clone.querySelector(".shadowFilter") as SVGFilterElement;

  const filterId = `shadowFilter${fileId}`
  filterElm.id = filterId;

  const circleElm = clone.querySelector(".bgTrack") as SVGCircleElement;
  // circleElm.setAttribute("filter", `url(#${filterId})`);

  const pathElm = clone.querySelector(".progressWedge") as SVGPathElement;
  pathElm.setAttribute("filter", `url(#${filterId})`);
  pathElm.id = `progressWedge${fileId}`;

  const uploadStatusElm = clone.querySelector(".uploadStatus") as HTMLSpanElement;
  uploadStatusElm.id = `uploadStatus${fileId}`;

  const fileNameElm = clone.querySelector(".fileNameTxt") as HTMLDivElement;
  fileNameElm.textContent = fileName;

  const fileSizeElm = clone.querySelector(".fileSizeTxt") as HTMLSpanElement;
  fileSizeElm.textContent = formatFileSize(fileSize, 1);

  const fileTypeElm = clone.querySelector(".fileTypeTxt") as HTMLSpanElement;
  fileTypeElm.textContent = getFileCategory(undefined, fileType) ?? "Unknown Type";

  const progressSpeedElm = clone.querySelector(".progressSpeed") as HTMLSpanElement;
  progressSpeedElm.id = `progressSpeed${fileId}`;

  const progressTimeElm = clone.querySelector(".progressTime") as HTMLSpanElement;
  progressTimeElm.id = `progressTime${fileId}`;

  const progressPercentageElm = clone.querySelector(".progressPercentage") as HTMLSpanElement;
  progressPercentageElm.id = `progressPercentage${fileId}`;

  const pauseBtnElm = clone.querySelector(".pauseBtn") as HTMLButtonElement;
  pauseBtnElm.id = `pauseBtn${fileId}`;

  const pauseBtnTxtElm = clone.querySelector(".pauseBtnTxt") as HTMLSpanElement;
  pauseBtnTxtElm.id = `pauseBtnTxt${fileId}`;

  const dwnldBtnElm = clone.querySelector(".dwnldBtn") as HTMLButtonElement;
  dwnldBtnElm.id = `dwnldBtn${fileId}`;

  const selectButtonElm = clone.querySelector(".sel") as HTMLDivElement;
  selectButtonElm.id = `selectBtn${fileId}`;

  parentElm.appendChild(clone);

  return {pathElm, uploadStatusElm, progressSpeedElm, progressTimeElm, progressPercentageElm, pauseBtnElm, pauseBtnTxtElm, dwnldBtnElm, selectButtonElm};
}

interface FileProgressAnim {
  fileId: number;
  animId: number | null;
  currentAngle: number;
  lastEventTime: number | null;
  arcPath: SVGPathElement | null;
  cx: number;
  cy: number;
  r: number;
}

function smoothProgressTo(targetAngle: number, animMap: FileProgressAnim, reset = false) {
  if (reset) {
    animMap.currentAngle = 0;
  }
  // CRITICAL FIX 1: Prevent downloads from ever animating backwards.
  // If the incoming target angle is less than where we currently are, 
  // ignore the backward jitter completely.
  if (targetAngle <= animMap.currentAngle) {
    return; 
  }

  const now = performance.now(); 
  let calculatedDuration = 300; 

  if (animMap.lastEventTime !== null) {
    calculatedDuration = now - animMap.lastEventTime;
  }
  
  animMap.lastEventTime = now;
  const optimizedDuration = Math.max(150, Math.min(calculatedDuration, 600));

  if (animMap.animId) {
    cancelAnimationFrame(animMap.animId);
  }

  // CRITICAL FIX 2: Explicitly capture the absolute snapshot start position 
  // before the recursive renderFrame loop starts altering memory strings.
  const startAngle = animMap.currentAngle;
  const startTime = performance.now();

  function renderFrame(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = optimizedDuration > 0 ? Math.min(elapsed / optimizedDuration, 1) : 1;
    const easeOutCubic = 1 - Math.pow(1 - progress, 3);

    let frameAngle = startAngle + (targetAngle - startAngle) * easeOutCubic;
    
    // CRITICAL FIX 3: Double guard inside the frame loop. 
    // Ensure intermediate rendering increments can never slip backwards 
    // due to browser thread frame timing drift.
    if (frameAngle > animMap.currentAngle) {
      animMap.currentAngle = frameAngle;
    } else {
      frameAngle = animMap.currentAngle; // Fallback to current progressive maximum
    }

    // Edge-case protections
    if (frameAngle >= 2 * Math.PI) frameAngle = 2 * Math.PI - 0.001;
    if (frameAngle <= 0) frameAngle = 0.0001;

    // Trigonometry geometry strings
    const x1 = animMap.cx;
    const y1 = animMap.cy - animMap.r;
    const x2 = animMap.cx + (animMap.r * Math.cos(frameAngle - Math.PI / 2));
    const y2 = animMap.cy + (animMap.r * Math.sin(frameAngle - Math.PI / 2));
    const largeArcFlag = frameAngle > Math.PI ? 1 : 0;

    if (!animMap.arcPath) throw new Error("Progress arch svg path not found for fileId: " + animMap.fileId);
    animMap.arcPath.setAttribute("d", `M ${animMap.cx} ${animMap.cy} L ${x1} ${y1} A ${animMap.r} ${animMap.r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`);

    if (progress < 1) {
      animMap.animId = requestAnimationFrame(renderFrame);
    }
  }

  animMap.animId = requestAnimationFrame(renderFrame);
}

// for test

// peerType = PeerType.Reciever;
// viewPage = ViewPage.FilesTransfer;

// const cfc = createFileCard({
//     fileId: 0,
//     fileName: "name_1_asim_file.png",
//     fileSize: 1023476,
//     fileType: "Image",
//     totalChunks: 30,
// });

// cfc?.dwnldBtnElm.addEventListener("click", () => {
//   console.log("here download");
// });

// cfc?.pauseBtnElm.addEventListener("click", () => {
//   console.log("here pause");
//   if (cfc?.pauseBtnElm) cfc.pauseBtnElm.disabled = true;
// });

// createFileCard({
//     fileId: 1,
//     fileName: "name_2_asim_file.png",
//     fileSize: 102376,
//     fileType: "Video",
//     totalChunks: 13,
// });

// createFileCard({
//     fileId: 2,
//     fileName: "name_5_asim_file.png",
//     fileSize: 1023476764,
//     fileType: "Text",
//     totalChunks: 100,
// });

// updatePageUI();

// const sha = new SHA256();
// sha.reset();
// sha.update(new TextEncoder().encode("abc"));
// const hash = sha.digest();
// // const trueHash = await crypto.subtle.digest("SHA256", new TextEncoder().encode("abc"));
// console.log(hash);