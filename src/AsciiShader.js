import * as THREE from 'three';

export const AsciiShader = {
    uniforms: {
        uSource: { value: null },
        uGlyphAtlas: { value: null },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uCellSize:   { value: new THREE.Vector2(8, 16) },
        uColumns: { value: 0 },
        uInvert: { value: false },
        uColor: { value: false },
    },
    vertexShader: await fetch('/src/shaders/ascii.vert').then(r => r.text()),
    fragmentShader: await fetch('/src/shaders/ascii.frag').then(r => r.text()),
}