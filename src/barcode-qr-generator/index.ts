import "./components/barcode/barcode";
import "./components/qrcode/qrcode";
import { Qrcode } from "./components/qrcode/qrcode";
import { QrErrorCorrection } from "./components/qrcode/qrcode.types";

const errSelect = document.getElementById("errorcr") as HTMLInputElement | null;
const qrInput = document.getElementById("qrdata") as HTMLInputElement | null;
const qrElm = document.getElementById("qr") as Qrcode | null;

if (qrElm && errSelect && qrInput) {
    errSelect.addEventListener("change", () => {
        const errVal = errSelect.value as QrErrorCorrection | null;
        console.log(errVal);
        qrElm.errorcorrection = errVal;
    });

    qrInput.addEventListener("input", () => {
        const dataVal = qrInput.value;
        console.log(dataVal);
        qrElm.value = dataVal;
    });
}

const downloadBtn = document.getElementById("downloadBtn") as HTMLButtonElement | null;

if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
        if (!qrInput?.value || !qrElm?.shadowRoot) return;
        const svgElm = qrElm.shadowRoot.querySelector("svg") as SVGAElement | null;
        // console.log(svgElm, "here");
        downloadSvgAsFile(svgElm, undefined, "svg");
    });
}

    //   const typeSelec = document.getElementById("brtype");
    //   const brInput = document.getElementById("brdata");
    //   const br = document.getElementById("brcd");

    //   typeSelec.addEventListener("change", (evt) => {
    //     const typeVal = evt.target.value;
    //     br.setAttribute("type", typeVal);
    //   });

    //   brInput.addEventListener("input", (evt) => {
    //     const dataVal = evt.target.value;
    //     if (!dataVal) {
    //       // qr.style.visibility = "hidden";
    //     }
    //     br.setAttribute("value", dataVal);
    //   })

function downloadSvgAsFile(svgElm: SVGAElement | null, filename = "rool_qr", format: "svg" | "png" | "jpg" | "jpeg") {
    if (!svgElm) return;

    if (format === "svg") {
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElm);

        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = filename.trim() + "." + format;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } else {
        convertSvgToRaster(svgElm, filename, format);
    }
}

function convertSvgToRaster(svgElement: SVGAElement, filename = "rool_qr", format: 'png' | "jpg" | "jpeg") {
  // 1. Serialize the live SVG DOM element to a string
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);

  // 2. Create an SVG blob URL
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const blobUrl = URL.createObjectURL(svgBlob);

  // 3. Load the SVG blob into a temporary Image object
  const img = new Image();
  img.src = blobUrl;

  img.onload = () => {
    // 4. Create a canvas matching the SVG dimensions
    const canvas = document.createElement('canvas');
    canvas.width = svgElement.clientWidth || 500;   // Fallback width
    canvas.height = svgElement.clientHeight || 500; // Fallback height
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // 5. Handle background color for JPG (Canvas defaults to transparent)
    if (format === 'jpeg' || format === 'jpg') {
      ctx.fillStyle = '#ffffff'; // Fills transparent areas with white
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 6. Draw the SVG image onto the canvas context
    ctx.drawImage(img, 0, 0);

    // 7. Export the canvas content to a downloadable data URL
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const rasterUrl = canvas.toDataURL(mimeType, 1.0); // 1.0 is maximum quality

    // 8. Trigger the download browser event
    const link = document.createElement('a');
    link.href = rasterUrl;
    link.download = `${filename}.${format}`;
    document.body.appendChild(link);
    link.click();

    // 9. Clean up memory allocations
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };
}
