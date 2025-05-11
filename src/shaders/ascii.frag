precision highp float;

uniform sampler2D uSource;       // rendered scene texture
uniform sampler2D uGlyphAtlas;   // atlas containing the ASCII glyphs
uniform vec2 uResolution;        // screen resolution in pixels
uniform vec2 uCellSize;          // size of one ASCII cell in pixels
uniform int uColumns;            // number of characters in the atlas
uniform bool uInvert;
uniform bool uColor;

const vec3 MONOCHROME_SCALE = vec3(0.298912, 0.586611, 0.114478);

varying vec2 vUv;

void main(){
    vec2 flipUv = vec2(vUv.x, 0.999999 - vUv.y);
    vec2 screenPixelSize = (1.0 / uResolution);
    vec2 screenUv = floor(flipUv / screenPixelSize / uCellSize) * screenPixelSize * uCellSize;
    vec4 color = texture2D(uSource, screenUv);

    if(color.a == 0.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    float glyphWidth = 1.0 / float(uColumns);
    float brightness = dot(color.rgb, MONOCHROME_SCALE);
    if(uInvert)
        brightness = 0.999999 - brightness;

    float glyphIndex = floor(brightness * float(uColumns));
    vec2 asciiUv = fract(flipUv / screenPixelSize / uCellSize);
    asciiUv.y = 0.999999 - asciiUv.y;
    asciiUv.x = asciiUv.x * glyphWidth + glyphWidth * glyphIndex;

    vec4 result = texture2D(uGlyphAtlas, asciiUv);
    
    if(result.r > 0.0 || result.g > 0.0 || result.b > 0.0) {
        if(uColor) {
            if(uInvert)
                color = 1.0 - vec4(color.rgb, 1.0);
            gl_FragColor = color;
            return;
        } else
            gl_FragColor = vec4(1.0, 1.0, 1.0, result.a);
    } else
        gl_FragColor = vec4(result.rgb, 1.0);
}