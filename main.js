import * as THREE from 'three';
import Fractal from './fractal.js';
// other fractal classes will be dynamically imported

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();

// containers for grid
const canvasContainer = document.getElementById('canvas') || document.body;
canvasContainer.appendChild(renderer.domElement);

renderer.domElement.style.position = 'absolute';
renderer.domElement.style.left = '0';
renderer.domElement.style.top = '0';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.domElement.style.zIndex = '0';

function resizeRendererToDisplaySize() {
    const width = (canvasContainer.clientWidth && canvasContainer.clientWidth > 0) ? canvasContainer.clientWidth : window.innerWidth;
    const height = (canvasContainer.clientHeight && canvasContainer.clientHeight > 0) ? canvasContainer.clientHeight : window.innerHeight;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(DPR);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

// initial size
resizeRendererToDisplaySize();
window.addEventListener('resize', resizeRendererToDisplaySize);

const addedObjects = [];

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const directional = new THREE.DirectionalLight(0xffffff, 0.8);
directional.position.set(5, 10, 7.5);
scene.add(directional);

camera.position.set(0, 0, 3);

// default properties, will not always be used
let maxDepth = 4;
let colors = [
    new THREE.Color(1.0, 0.0, 0.0), // red
    new THREE.Color(0.0, 1.0, 0.0), // green
    new THREE.Color(0.0, 0.0, 1.0), // blue
    new THREE.Color(1.0, 0.5, 0.0), // orange
    new THREE.Color(1.0, 1.0, 0.0), // yellow
    new THREE.Color(0.5, 0.0, 0.5), // purple
    new THREE.Color(0.2, 0.3, 0.3), // learnOpenGL green]
];
let thickness = 1;
let splitWidth = .45;

// handles multiple objects if we decided this
function addObjectToScene(obj) {
    scene.add(obj);
    addedObjects.push(obj);
}

function clearScene() {
    while (addedObjects.length) {
        const obj = addedObjects.pop();
        scene.remove(obj);
        obj.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                    else child.material.dispose();
                }
            }
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const clearBtn = document.getElementById('clear-scene');
    const generateBtn = document.getElementById('generate');
    /** @type {HTMLSelectElement|null} */
    const typeSelect = /** @type {HTMLSelectElement|null} */ (document.getElementById('fractal-type-select'));

    if (clearBtn) clearBtn.addEventListener('click', () => {
        clearScene();
    });

    // populate the type select from fractal-types.json
    (async () => {
        if (!typeSelect) return;
        try {
            // get request to fetch json
            const res = await fetch('/fractal-types.json', { cache: 'no-cache' });
            // response is good
            if (!res.ok) return;
            const json = await res.json();
            const list = Array.isArray(json.fractals) ? json.fractals : [];
            for (const t of list) {
                // skip adding split koch, that is added in html
                if (!t || !t.id || t.id == "kaden-hart") continue;
                // add each fractal to drop-down
                if (typeSelect.querySelector(`option[value="${t.id}"]`)) continue;
                const opt = document.createElement('option');
                opt.value = t.id;
                opt.textContent = t.name || t.id;
                typeSelect.appendChild(opt);
            }
        } catch (e) {
            console.warn('Failed to load fractal-types.json', e);
        }
    })();

    if (generateBtn) generateBtn.addEventListener('click', async () => {
        // determine which class to instantiate based on selection, defaults to Fractal class
        let Klass = Fractal;
        let properties = {};
        try {
            const sel = (typeSelect && typeSelect.value) ? typeSelect.value : 'kaden-hart';
            const res = await fetch('/fractal-types.json', { cache: 'no-cache' });
            // response is good, set parameters
            if (res.ok) {
                const json = await res.json();
                const list = Array.isArray(json.fractals) ? json.fractals : [];
                for (const t of list) {
                    if ((t.id === sel || t.name === sel) && t.parameters) {
                        properties = t.parameters;
                        break;
                    }
                }
                properties.colors = colors;
            } else { 
                properties = { "maxDepth": maxDepth, "colors": colors, "thickness": thickness, "splitWidth": splitWidth};
            }
            // convert id to camel-case class file name - starts by splitting up words
            const moduleName = sel.split(/[^a-zA-Z0-9]+/).map(
                // lowercase first word
                (part, i) => i === 0 ? part.toLowerCase() :
                    // uppercase the start of each subsequent word
                    (part.charAt(0).toUpperCase() + part.slice(1))
            ).join('');
            try {
                const mod = await import(/* @vite-ignore */`./${moduleName}.js`);
                if (mod && (typeof mod.default === 'function')) {
                    Klass = mod.default;
                }
            } catch (e) {
                console.warn('Could not import module for type', sel, e);
                Klass = Fractal;
            }
        } catch (e) {
            console.warn('Error resolving fractal class, falling back to Fractal', e);
            Klass = Fractal;
        }

        // create a fractal instance and generate fractal
        const f = new Klass(scene, {}, properties);

        // these will be not all be used
        // we should load these from the json
        // f.setProperties(properties);

        // progress for generation and a bail button
        const progressEl = document.getElementById('progress');
        const progressMsg = document.getElementById('progress-msg');
        const progressCancel = document.getElementById('progress-cancel');
        if (progressEl) progressEl.style.display = 'block';
        if (progressMsg) progressMsg.textContent = 'Preparing generation...';

        // cancel button
        const onCancel = () => {
            f.requestCancel();
            if (progressMsg) progressMsg.textContent = 'Cancel requested; stopping soon...';
        };
        if (progressCancel) progressCancel.addEventListener('click', onCancel, { once: true });

        // update progress text occasionally
        f.progressCallback = (count) => {
            if (progressMsg) progressMsg.textContent = `Generating fractal... triangles: ${count}`;
        };

        // run generation asynchronously
        setTimeout(() => {
            try {
                if (progressMsg) progressMsg.textContent = 'Generating fractal...';

                f.generate();

			    clearScene();
                // cancel doesn't do anything yet
                if (f.cancelRequested() && progressMsg) progressMsg.textContent = 'Generation cancelled.';

                const mesh = f.buildTrianglesMesh();
                if (mesh) addObjectToScene(mesh);
            } catch (e) {
                console.error('Fractal generation error', e);
                if (progressMsg) progressMsg.textContent = 'Generation error (see console)';
            } finally {
                // hide overlay after a short delay
                setTimeout(() => { if (progressEl) progressEl.style.display = 'none'; }, 500);
            }
        }, 20);
    });
});

function animate() {
    // rotate all added objects
    // for (const obj of addedObjects) {
    //     obj.rotation.x += 0.01;
    //     obj.rotation.y += 0.01;
    // }

    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);