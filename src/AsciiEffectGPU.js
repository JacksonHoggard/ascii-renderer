import * as THREE from 'three';
import { generateFontAtlas } from './AsciiCalculator';
import { AsciiShader } from './AsciiShader';
import { EffectComposer, ShaderPass } from 'three/examples/jsm/Addons.js';

export class AsciiEffectGPU {

    constructor(renderer, charSet, options) {

        const composer = new EffectComposer(renderer);
        const asciiShader = new ShaderPass(AsciiShader);
        composer.addPass(asciiShader);

        charSet = (charSet === undefined) ? ' .:-=+*#%@' : charSet;

        if (!options) options = {};

        var bResolution = !options['resolution'] ? 0.15 : options['resolution'];
        var bColor = !options['color'] ? false : options['color'];
        var bInvert = !options['invert'] ? false : options['invert'];

        var width, height;

        var iWidth, iHeight;

        this.setSize = function (w, h) {
            width = w;
            height = h;
            renderer.setSize(w, h);
            composer.setSize(w, h);
            asciiShader.uniforms.uResolution.value.set(w, h);
            initAsciiSize();
        };

        this.render = function (scene, camera) {
            renderer.render(scene, camera);
            asciifyImage(scene, camera);
        };

        this.domElement = renderer.domElement;

        function initAsciiSize() {
            iWidth = Math.round(width * fResolution);
            iHeight = Math.round(height * fResolution);

            oCanvas.width = iWidth;
            oCanvas.height = iHeight;
        }

        var aDefaultCharList = (`  .\'\`^",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$`).split("");
        var aDefaultColorCharList = (" CGO08@").split("");

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

        asciiShader.uniforms.uGlyphAtlas.value = generateFontAtlas(aCharList, 256, 512);
        asciiShader.uniforms.uCellSize.value.set((1 / fResolution), (2 / fResolution));
        asciiShader.uniforms.uColumns.value = aCharList.length;
        asciiShader.uniforms.uInvert.value = bInvert;
        asciiShader.uniforms.uColor.value = bColor;

        function asciifyImage(scene, camera) {
            oCtx.clearRect(0, 0, iWidth, iHeight);
            oCtx.drawImage(oCanvasImg, 0, 0, iWidth, iHeight);
            var oImgData = oCtx.getImageData(0, 0, iWidth, iHeight);
            var imageTexture = new THREE.DataTexture(oImgData.data, iWidth, iHeight, THREE.RGBAFormat);
            asciiShader.uniforms.uSource.value = imageTexture;
            imageTexture.needsUpdate = true;
            composer.render(scene, camera);
        }
    }
};