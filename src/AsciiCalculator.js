import * as THREE from 'three';

export function calculateAscii(oImgData, iWidth, iHeight, options) {
    const {
        bColor,
        bInvert,
        bBlock,
        bAlpha,
        charList
    } = options;

    let output = "";

    for (let y = 0; y < iHeight; y+=2) {
        if (bColor) {
            let lastStyle = "";
            let segment = "";
            for (let x = 0; x < iWidth; x++) {
                const iOffset = (y * iWidth + x) * 4;
                const iRed = oImgData[iOffset];
                const iGreen = oImgData[iOffset + 1];
                const iBlue = oImgData[iOffset + 2];
                const iAlpha = oImgData[iOffset + 3];
                let fBrightness = (0.298912 * iRed + 0.586611 * iGreen + 0.114478 * iBlue) / 255;
                if (bInvert) {
                    fBrightness = 0.999999 - fBrightness;
                }
                fBrightness = Math.min(Math.max(fBrightness, 0), 0.999999);
                let iCharIdx = Math.floor(fBrightness * (charList.length));
                let ch = charList[iCharIdx];
                if(iAlpha === 0) {
                    ch = " ";
                }
                var color = `color:rgb(${iRed},${iGreen},${iBlue});`;
                if(bInvert) {
                    var color = `color:rgb(${255 - iRed},${255 - iGreen},${255 - iBlue});`;
                }
                const currentStyle = color +
                    (bBlock ? `background-color:rgb(${iRed},${iGreen},${iBlue});` : "") +
                    (bAlpha ? `opacity:${(iAlpha / 255)};` : "");

                if (currentStyle === lastStyle) {
                    segment += ch;
                } else {
                    if (lastStyle) {
                        output += `<span style='${lastStyle}'>${segment}</span>`;
                    } else {
                        output += segment;
                    }
                    lastStyle = currentStyle;
                    segment = ch;
                }
            }
            if (segment) {
                output += `<span style='${lastStyle}'>${segment}</span>`;
            }
        } else {
            for (let x = 0; x < iWidth; x++) {
                const iOffset = (y * iWidth + x) * 4;
                const iRed = oImgData[iOffset];
                const iGreen = oImgData[iOffset + 1];
                const iBlue = oImgData[iOffset + 2];
                const iAlpha = oImgData[iOffset + 3];
                let fBrightness = (0.298912 * iRed + 0.586611 * iGreen + 0.114478 * iBlue) / 255.0;
                if (bInvert) {
                    fBrightness = 0.999999 - fBrightness;
                }
                fBrightness = Math.min(Math.max(fBrightness, 0), 0.999999);
                let iCharIdx = Math.floor((fBrightness) * (charList.length));
                let ch = charList[iCharIdx];
                if(iAlpha === 0) {
                    ch = " ";
                }
                output += ch;
            }
        }
        output += "<br/>";
    }
    return output;
}

export function generateFontAtlas(charRamp, glyphW, glyphH) {
    const canvas = document.createElement('canvas');
    canvas.width = charRamp.length * glyphW;
    canvas.height = glyphH;
    const ctx = canvas.getContext('2d');

    // Fill background (black)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set font properties
    ctx.font = glyphH + "px courier new, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";

    // Render each cell with a character from charRamp (cycling if needed)
    for (let i = 0; i < charRamp.length; i++) {
        const char = charRamp.charAt(i);
        const x = (i * glyphW) + (glyphW / 2);
        const y = glyphH / 2;
        ctx.fillText(char, x, y);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;

    return texture;
}