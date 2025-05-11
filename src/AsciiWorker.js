import { calculateAscii } from './AsciiCalculator.js';

self.onmessage = function (e) {
    const { imgData, width, height, options } = e.data;
    options.charList = options.bColor ? options.defaultColorList : options.defaultCharList;
    const ascii = calculateAscii(imgData, width, height, options);
    self.postMessage({ ascii });
}