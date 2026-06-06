// import templateHTML from "./qrcode.html?raw.js";
import { QrErrorCorrection } from "./qrcode.types.js";
import { encodeQr } from "./utils/encoding.js";
const templateHTML = `
<style>
    :host svg {
  border: solid 2px grey;
  border-radius: .4em;
}
</style>
<div>
    <svg
    xmlns="http://www.w3.org/2000/svg">
    </svg>
</div>
`;
const template = document.createElement("template");
template.innerHTML = templateHTML;
const svgns = "http://www.w3.org/2000/svg";
const svgRelativeX = 0;
const svgRelativeY = 0;
const svgRelativeWidth = 300;
const svgRelativeHeight = svgRelativeWidth;
const viewBoxValue = `${svgRelativeX} ${svgRelativeY} ${svgRelativeWidth} ${svgRelativeHeight}`;
const xTotalPadding = 30;
const yTotalPadding = xTotalPadding;
export class Qrcode extends HTMLElement {
    constructor() {
        super();
        this.svgElm = null;
    }
    get errorcorrection() {
        return this.getAttribute("errorcorrection");
    }
    set errorcorrection(value) {
        if (value === null) {
            this.removeAttribute("errorcorrection");
        }
        else {
            this.setAttribute("errorcorrection", value);
        }
    }
    get value() {
        return this.getAttribute("value");
    }
    set value(value) {
        if (value === null) {
            this.removeAttribute("value");
        }
        else {
            this.setAttribute("value", value);
        }
    }
    connectedCallback() {
        const shadow = this.attachShadow({ mode: "open" });
        shadow.appendChild(template.content.cloneNode(true));
        this.svgElm = shadow.querySelector("svg");
        this.svgElm?.setAttribute("viewBox", viewBoxValue);
        this.onQrcodeAttrChange();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        this.onQrcodeAttrChange();
    }
    onQrcodeAttrChange() {
        try {
            const qrCodeBitMatrix = this.getQrcodeBits();
            this.drawQrcode(qrCodeBitMatrix);
        }
        catch (e) {
            this.drawQrcode([], e.message);
            throw e;
        }
    }
    getQrcodeBits() {
        try {
            const errorCorrection = (this.getAttribute("errorcorrection") || null);
            const value = this.getAttribute("value") || null;
            return encodeQr(value, errorCorrection ?? QrErrorCorrection.M);
        }
        catch (e) {
            throw e;
        }
    }
    drawQrcode(bitMatrix, errMessage) {
        if (this.svgElm === null)
            return;
        const totalWidth = 300;
        this.svgElm.innerHTML = "";
        if (errMessage) {
            const textNode = document.createElementNS(svgns, "text");
            textNode.textContent = errMessage;
            textNode.setAttribute("textLength", `${totalWidth - xTotalPadding}`);
            textNode.setAttribute("lengthAdjust", "spacingAndGlyphs");
            textNode.setAttribute("x", `${xTotalPadding / 2}`);
            textNode.setAttribute("y", `${totalWidth / 2}`);
            textNode.setAttribute("fill", "red");
            this.svgElm.appendChild(textNode);
            this.svgElm.style.borderColor = "red";
        }
        else {
            this.svgElm.style.borderColor = "grey";
        }
        const qrcodeWidth = totalWidth - xTotalPadding;
        const moduleSize = (qrcodeWidth / bitMatrix.length);
        const startX = xTotalPadding / 2;
        const startY = yTotalPadding / 2;
        const module0Color = 'white';
        const module1Color = 'black';
        let xPos = startX;
        let yPos = startY;
        for (const row of bitMatrix) {
            const rectWidth = moduleSize;
            const rectHeight = moduleSize;
            for (const bitModule of row) {
                const rectElm = document.createElementNS(svgns, 'rect');
                rectElm.setAttribute("x", `${xPos}`);
                rectElm.setAttribute("y", `${yPos}`);
                rectElm.setAttribute("width", `${rectWidth}`);
                rectElm.setAttribute("height", `${rectHeight}`);
                rectElm.setAttribute("fill", bitModule > 0 ? module1Color : module0Color);
                rectElm.setAttribute("stroke", bitModule > 0 ? module1Color : module0Color);
                if (bitModule === null)
                    rectElm.setAttribute("fill", "grey");
                this.svgElm.appendChild(rectElm);
                xPos += rectWidth;
            }
            yPos += rectHeight;
            xPos = startX;
        }
    }
}
Qrcode.observedAttributes = ["errorcorrection", "value"];
customElements.define("dami-qrcode", Qrcode);
