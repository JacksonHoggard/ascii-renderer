import * as THREE from 'three';
import { AsciiEffect } from './AsciiEffect.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import GUI from 'lil-gui';
import { createNoise2D } from 'simplex-noise';
import { AsciiEffectGPU } from './AsciiEffectGPU.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

let noise2D = createNoise2D();

const defaultSettings = {
    renderMode: 'GPU',
    ramp: ' .:-=+*#%@',
    invert: true,
    resolution: 0.15,
    colorized: false,
    spin: true,
    spinSpeed: 0.01,

    dirLightColor: '#ffffff',
    dirLightIntensity: 1.0,
    ambIntensity: 0.3,
    meshColor: '#cccccc',
    flat: false,

    terrain: {
        size: 100,
        segments: 200,
        amplitude: 8,
        noiseScale: 0.08
    }
};
const LS_KEY = 'ascii3d-settings';
const settings = Object.assign({}, defaultSettings, JSON.parse(localStorage.getItem(LS_KEY) || '{}'));

/* ---- three.js core ---- */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(2, 1.5, 2);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

let effect = buildAsciiEffect();
let effectGPU = buildAsciiEffectGPU();

renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x000000);
renderer.setClearAlpha(0);

/* Lights  */
const dirLight = new THREE.DirectionalLight(settings.dirLightColor, settings.dirLightIntensity);
dirLight.position.set(2, 5, 1);
scene.add(dirLight);
const ambLight = new THREE.AmbientLight(0x404040, settings.ambIntensity);
scene.add(ambLight);

/* Mesh */
let mesh = buildMesh();
scene.add(mesh);

const terrainMesh = buildTerrainMesh();

/* Controls */
let controls = null;
switch (settings.renderMode) {
    case 'GPU':
        controls = new OrbitControls(camera, renderer.domElement);
        document.body.appendChild(renderer.domElement);
        break;
    case 'CPU':
        controls = new OrbitControls(camera, effect.domElement);
        document.body.appendChild(effect.domElement);
        break;
}
controls.enableDamping = true;

/* ---- GUI ---- */
const gui = new GUI({ title: 'Settings' });

gui.add({
    importModel: function () {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.obj,.stl,.gltf,.glb,model/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        fileInput.addEventListener('change', async e => {
            const file = e.target.files[0];
            if (!file) return;

            const url = URL.createObjectURL(file);
            try {
                let obj;
                if (file.name.match(/\.(obj)$/i))
                    obj = await new OBJLoader().loadAsync(url);
                else if (file.name.match(/\.(stl)$/i))
                    obj = await new STLLoader().loadAsync(url);
                else if (file.name.match(/\.(gltf|glb)$/i))
                    obj = (await new GLTFLoader().loadAsync(url)).scene;
                else {
                    alert('Unsupported format');
                    return;
                }
                scene.remove(mesh);
                obj.traverse(c => {
                    if (c.isMesh) {
                        c.material = mesh.material.clone();
                        c.material.flatShading = settings.flat;
                        c.material.needsUpdate = true;
                    }
                });
                mesh = obj;
                const geometries = [];
                mesh.traverse(child => {
                    if (child.isMesh && child.geometry) {
                        child.updateMatrix();
                        const clonedGeom = child.geometry.clone();
                        clonedGeom.applyMatrix4(child.matrix);
                        geometries.push(clonedGeom);
                    }
                });
                if (geometries.length > 0) {
                    const mergedGeometry = mergeGeometries(geometries, false);
                    const material = new THREE.MeshStandardMaterial({
                        color: settings.meshColor,
                        flatShading: settings.flat
                    });
                    material.needsUpdate = true;
                    mesh = new THREE.Mesh(mergedGeometry, material);
                }
                scene.add(mesh);
            } catch (err) {
                console.error(err);
                alert('Failed to load model');
            }
            document.body.removeChild(fileInput);
        });
        fileInput.click();
    }
}, 'importModel').name('Import Model');

/* group: ascii */
gui.add(settings, 'renderMode', ['GPU', 'CPU']).name('Render Mode').onChange(rebuildPipeline);
gui.add(settings, 'ramp').name('Char Ramp').onFinishChange(() => {
    rebuildAscii();
});
gui.add(settings, 'invert').name('Invert').onChange(rebuildAscii);
gui.add(settings, 'resolution', 0.05, 0.3, 0.01).name('Resolution').onChange(rebuildAscii);
gui.add(settings, 'colorized').name('Color chars').onChange(rebuildAscii);
gui.add(settings, 'spin').name('Spin');
gui.add(settings, 'spinSpeed', 0, 0.05, 0.001).name('Spin Speed');

/* group: light */
const fLight = gui.addFolder('Lighting');
fLight.addColor(settings, 'dirLightColor').name('Directional Color').onChange(() => dirLight.color.set(settings.dirLightColor));
fLight.add(settings, 'dirLightIntensity', 0, 4, 0.1).name('Dir Intensity').onChange(() => dirLight.intensity = settings.dirLightIntensity);
fLight.add(settings, 'ambIntensity', 0, 2, 0.05).name('Ambient Intensity').onChange(() => ambLight.intensity = settings.ambIntensity);

/* group: material */
const fMat = gui.addFolder('Material');
fMat.addColor(settings, 'meshColor').name('Mesh Color').onChange(() => updateMaterial());
fMat.add(settings, 'flat').name('Flat Shading').onChange(() => updateMaterial());

/* group: terrain */
const fTerrain = gui.addFolder('Terrain');
fTerrain.add(settings.terrain, 'amplitude', 0, 20, 0.5).name('Amplitude').onChange(rebuildTerrain);
fTerrain.add(settings.terrain, 'noiseScale', 0.02, 0.2, 0.005).name('Noise Scale').onChange(rebuildTerrain);
fTerrain.add({ randomize() { rebuildTerrain(true); terrainCameraSetup(); } }, 'randomize').name('Randomize');

gui.onFinishChange(() => localStorage.setItem(LS_KEY, JSON.stringify(settings)));

/* group: export */
const fExport = gui.addFolder('Export');

const exportActions = {
    copy: () => {
        let lastRM = settings.renderMode;
        settings.renderMode = 'CPU';
        rebuildPipeline();
        setTimeout(() => {
            effect.render(scene, camera);
            const asciiText = effect.domElement.innerText;
            navigator.clipboard.writeText(asciiText)
                .then(() => alert('Copied to clipboard!'))
                .catch(err => alert(`Failed to copy to clipboard: ${err}`));
            settings.renderMode = lastRM;
            rebuildPipeline();
        }, 100);
    },

    saveTxt: () => {
        let lastRM = settings.renderMode;
        settings.renderMode = 'CPU';
        rebuildPipeline();
        setTimeout(() => {
            effect.render(scene, camera);
            const asciiText = effect.domElement.innerText;
            const blob = new Blob([asciiText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'ascii_render.txt';
            a.click();
            URL.revokeObjectURL(url);
            settings.renderMode = lastRM;
            rebuildPipeline();
        }, 100);
    },

    saveJpg: () => {
        let lastRM = settings.renderMode;
        settings.renderMode = 'GPU';
        rebuildPipeline();
        setTimeout(() => {
            effectGPU.render(scene, camera);
            effectGPU.domElement.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'ascii_render.jpg';
                a.click();
                URL.revokeObjectURL(url);
            }, 'image/jpeg');
            settings.renderMode = lastRM;
            rebuildPipeline();
        }, 100);
    }
};

fExport.add(exportActions, 'copy').name('Copy to Clipboard');
fExport.add(exportActions, 'saveTxt').name('Save as TXT');
fExport.add(exportActions, 'saveJpg').name('Save as JPG');

/* ---- helpers ---- */
function buildAsciiEffect() {
    const eff = new AsciiEffect(renderer, settings.ramp, {
        invert: settings.invert,
        resolution: settings.resolution,
        color: settings.colorized,
    });

    eff.setSize(innerWidth, innerHeight);
    eff.domElement.style.whiteSpace = 'pre';
    eff.domElement.style.letterSpacing = '0px';
    return eff;
}

function buildAsciiEffectGPU() {
    const eff = new AsciiEffectGPU(renderer, settings.ramp, {
        invert: settings.invert,
        resolution: settings.resolution,
        color: settings.colorized,
    });
    eff.setSize(innerWidth, innerHeight);
    eff.domElement.style.whiteSpace = 'pre';
    eff.domElement.style.letterSpacing = '0px';
    return eff;
}

function rebuildAscii() {
    const prevTarget = controls ? controls.target.clone() : new THREE.Vector3();
    switch (settings.renderMode) {
        case 'CPU':
            rebuildAsciiCPU();
            break;
        case 'GPU':
            rebuildAsciiGPU();
            break;
    }
    controls.target.copy(prevTarget);
}

function rebuildAsciiCPU() {
    if (document.body.contains(effect.domElement))
        document.body.removeChild(effect.domElement);
    effect = buildAsciiEffect();
    controls = new OrbitControls(camera, effect.domElement);
    controls.enableDamping = true;
    controls.update();
    document.body.appendChild(effect.domElement);
}

function rebuildAsciiGPU() {
    if (document.body.contains(effectGPU.domElement))
        document.body.removeChild(effectGPU.domElement);
    effectGPU = buildAsciiEffectGPU();
    controls = new OrbitControls(camera, effectGPU.domElement);
    controls.enableDamping = true;
    controls.update();
    document.body.appendChild(effectGPU.domElement);
}

function buildMesh() {
    const mat = new THREE.MeshStandardMaterial({ color: settings.meshColor, flatShading: settings.flat });
    const geo = new THREE.TorusKnotGeometry(0.6, 0.25, 150, 20);
    return new THREE.Mesh(geo, mat);
}

function buildTerrainMesh() {
    const { size, segments } = settings.terrain;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    applyHeightField(geo);

    const mat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        wireframe: false,
        flatShading: settings.flat
    });

    return new THREE.Mesh(geo, mat);
}

function applyHeightField(geo) {
    const { amplitude, noiseScale } = settings.terrain;
    const position = geo.attributes.position;
    const colors = [];
    for (let i = 0; i < position.count; i++) {
        const x = position.getX(i);
        const z = position.getZ(i);
        const y = noise2D(x * noiseScale, z * noiseScale) * amplitude;
        position.setY(i, y);

        const hNorm = THREE.MathUtils.clamp((y / amplitude + 1) / 2, 0, 1);
        const color = new heightToColor(hNorm);
        colors.push(color.r, color.g, color.b);
    }
    position.needsUpdate = true;
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
}

function heightToColor(t) {
    const color = new THREE.Color();
    if (t < 0.4) {
        color.setRGB(0.1, 0.5 + t, 0.1);
    } else if (t < 0.7) {
        color.setRGB(0.4 + t * 0.5, 0.3, 0.1);
    } else {
        color.setRGB(0.9, 0.9, 0.9);
    }
    return color;
}

function rebuildTerrain(newSeed = false) {
    if (newSeed) {
        noise2D = createNoise2D(Math.random);
    }
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh = buildTerrainMesh();
    scene.add(mesh);
    localStorage.setItem(LS_KEY, JSON.stringify(settings));
}

function terrainCameraSetup() {
    camera.position.set(0, settings.terrain.amplitude * 3, settings.terrain.size * 0.4);
    controls.target.set(0, 0, 0);
    controls.update();
}

function updateMaterial() {
    mesh.material = new THREE.MeshStandardMaterial({
        color: settings.meshColor,
        flatShading: settings.flat
    });
    mesh.material.needsUpdate = true;
}

addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    effect.setSize(innerWidth, innerHeight);
    effectGPU.setSize(innerWidth, innerHeight);
});

function rebuildPipeline() {
    switch (settings.renderMode) {
        case 'GPU':
            if (document.body.contains(effect.domElement))
                document.body.removeChild(effect.domElement);
            break;
        case 'CPU':
            if (document.body.contains(effectGPU.domElement))
                document.body.removeChild(effectGPU.domElement);
            break;
    }
    rebuildAscii();
}

function animate() {
    requestAnimationFrame(animate);
    if (settings.spin)
        mesh.rotation.y += settings.spinSpeed;
    controls.update();
    switch (settings.renderMode) {
        case 'GPU':
            effectGPU.render(scene, camera);
            break;
        case 'CPU':
            effect.render(scene, camera);
            break;
    }
}
animate();