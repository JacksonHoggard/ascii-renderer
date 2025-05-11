import { calculateAscii } from "./AsciiCalculator";

export class AsciiEffect {
    
    static worker;

    constructor(renderer, charSet, options) {

        if(window.Worker && !AsciiEffect.worker) {
            AsciiEffect.worker = new Worker('/src/AsciiWorker.js', { type: "module" });
        }

        charSet = (charSet === undefined) ? ' .:-=+*#%@' : charSet;

        if (!options) options = {};

        var bResolution = !options['resolution'] ? 0.15 : options['resolution'];
        var bColor = !options['color'] ? false : options['color'];
        var bAlpha = !options['alpha'] ? false : options['alpha'];
        var bInvert = !options['invert'] ? false : options['invert'];

        var width, height;

        var domElement = document.createElement('div');
        domElement.style.cursor = 'default';

        var oAscii = document.createElement("table");
        domElement.appendChild(oAscii);

        var iWidth, iHeight;
        var oImg;

        this.setSize = function (w, h) {
            width = w;
            height = h;
            renderer.setSize(w, h);
            initAsciiSize();
        };

        this.render = function (scene, camera) {
            renderer.render(scene, camera);
            asciifyImage(oAscii);
        };

        this.domElement = domElement;

        function initAsciiSize() {
            iWidth = Math.round(width * fResolution);
            iHeight = Math.round(height * fResolution);

            oCanvas.width = iWidth;
            oCanvas.height = iHeight;
            oImg = renderer.domElement;

            if (oImg.style.backgroundColor) {
                oAscii.rows[0].cells[0].style.backgroundColor = oImg.style.backgroundColor;
                oAscii.rows[0].cells[0].style.color = oImg.style.color;
            }

            var oStyle = oAscii.style;
            oStyle.letterSpacing = "0px";
            oStyle.fontFamily = strFont;
            oStyle.fontSize = fFontSize + "px";
        }

        var aDefaultCharList = (`  .\'\`^",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$`).split("");
        var aDefaultColorCharList = (" CGO08@").split("");
        var strFont = "courier new, monospace";

        var oCanvasImg = renderer.domElement;

        var oCanvas = document.createElement("canvas");
        if (!oCanvas.getContext) {
            return;
        }

        var oCtx = oCanvas.getContext("2d");
        if (!oCtx.getImageData) {
            return;
        }

        var aCharList = (bColor ? aDefaultColorCharList : aDefaultCharList);

        if (charSet) aCharList = charSet;

        var fResolution = 0.5;

        if (bResolution) fResolution = bResolution;

        var fFontSize = (1.75 / fResolution);

        function asciifyImage(oAscii) {
            oCtx.clearRect(0, 0, iWidth, iHeight);
            oCtx.drawImage(oCanvasImg, 0, 0, iWidth, iHeight);
            var oImgData = oCtx.getImageData(0, 0, iWidth, iHeight).data;

            if(AsciiEffect.worker) {
                AsciiEffect.worker.postMessage({
                    imgData: oImgData,
                    width: iWidth,
                    height: iHeight,
                    options: {
                        bColor: bColor,
                        bInvert: bInvert,
                        bAlpha: bAlpha,
                        defaultCharList: aCharList,
                        defaultColorList: aCharList,
                    }
                });
                AsciiEffect.worker.onmessage = function (e) {
                    oAscii.innerHTML = "<tr><td>" + e.data.ascii + "</td></tr>";
                };
            } else {
                const ascii = calculateAscii(oImgData, iWidth, iHeight, {
                    bColor: bColor,
                    bInvert: bInvert,
                    bAlpha: bAlpha,
                    charList: aCharList,
                });
                oAscii.innerHTML = "<tr><td>" + ascii + "</td></tr>";
            }
        }
    }
};