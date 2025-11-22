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
    new THREE.Color(0.2, 0.3, 0.3), // learnOpenGL green
    new THREE.Color(0.0, 0.5, 0.5), // cyan
    new THREE.Color(0.07, 0.21, 0.14), // phthalo green
    new THREE.Color(.55, 0, .55) // magenta
];
let thickness = 1;
let splitWidth = .45;

// load fractal-types.json into local storage
// if already in local storage, use it
async function getFractalTypes() {
    const key = 'fractal-types';
    try {
        const raw = localStorage.getItem(key);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                return parsed;
            } catch (e) {
                console.warn('ivalid JSON in localStorage for fractal-types, refetching', e);
                localStorage.removeItem(key);
            }
        }
    } catch (e) {
        console.warn("couldn't read fractal-types from localStorage", e)
    }

    try {
        const res = await fetch('/fractal-types.json', { cache: 'no-cache' });
        if (!res.ok) return null;
        const json = await res.json();
        try {
            localStorage.setItem(key, JSON.stringify(json));
        } catch (e) {
            console.warn('could not write fractal-types to localStorage', e);
        }
        return json;
    } catch (e) {
        console.warn('Failed to fetch fractal-types.json', e);
        return null;
    }
}

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

function addSlider(name, min, max, initial, typeSelect) {
    try {
        // container holds label, slider and value
        const sliderContainer = document.createElement('div');
        sliderContainer.style.display = 'flex';
        sliderContainer.style.alignItems = 'center';
        sliderContainer.style.gap = '8px';
        sliderContainer.style.marginTop = '8px';

        const label = document.createElement('label');
        label.htmlFor = 'slider-' + name;
        label.textContent = name;

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.id = 'slider-' + name;
        slider.min = String(min);
        slider.max = String(max);
        slider.step = '1';
        slider.value = String(initial);
        slider.style.flex = '1';

        const valueSpan = document.createElement('span');
        valueSpan.id = 'slider-' + name + 'value';
        valueSpan.textContent = String(slider.value);

        sliderContainer.appendChild(label);
        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(valueSpan);

        // insert the slider container after the select's parent block if possible
        const insertAfter = typeSelect.parentElement || typeSelect;
        insertAfter.insertAdjacentElement('afterend', sliderContainer);
        return sliderContainer;
    } catch (e) {
        console.warn('Could not create slider control', e);
        return null;
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

    if (typeSelect) typeSelect.addEventListener('change', async () => {
        const sel = (typeSelect && typeSelect.value) ? typeSelect.value : 'split-koch';
        // console.log(sel);
        const res = await fetch('/fractal-types.json', { cache: 'no-cache' });

        const json = await getFractalTypes();
        if (!json) return;
        const entries = Object.values(json.fractals || {});
        // entry is the specific fractal
        const entry = entries.find(e => e && (e.id === sel || e.name === sel));
        if (!entry || !entry.parameters) return;
        // parameters is the parameters of the specific fractal
        const parameters = entry.parameters;
        for (const parameter in parameters) {
            // console.log(parameter);
            switch (parameter) {
                case "maxDepth":
                    {
                        // remove any existing maxDepth slider
                        try {
                            const existing = document.getElementById('slider-maxDepth');
                            if (existing && existing.parentElement) existing.parentElement.remove();
                        } catch (e) { /* ignore */ }

                        const sliderContainer = addSlider("maxDepth", 0, 10, parameters.maxDepth, typeSelect);
                        if (!sliderContainer) break;
                        // cast as input elements
                        const slider = /** @type {HTMLInputElement|null} */ (sliderContainer.querySelector('input[type="range"]'));
                        const valueSpan = /** @type {HTMLElement|null} */ (sliderContainer.querySelector('span'));
                        if (slider) {
                            slider.addEventListener('input', () => {
                                if (valueSpan) valueSpan.textContent = String(slider.value);
                                try {
                                    const key = 'fractal-types';
                                    const raw = localStorage.getItem(key);

                                    if (raw) {
                                        const data = JSON.parse(raw);
                                        const ids = Object.keys(data.fractals || {});
                                        for (const id of ids) {
                                            const item = data.fractals[id];
                                            if (!item) continue;
                                            // change maxDepth for selected fractal
                                            if (item.id === sel || item.name === sel) {
                                                if (!item.parameters) item.parameters = [];
                                                item.parameters.maxDepth = Number(slider.value);
                                                break;
                                            }
                                        }
                                        localStorage.setItem(key, JSON.stringify(data));
                                    }
                                } catch (e) {
                                    console.warn('could not update maxDepth in localStorage', e);
                                }
                            });
                        }
                    }
                    break;
                case "splitWidth":

                    break;
                case "thickness":

                    break;
                case "colors":

                    break;
                case "pattern":

                    break;
                default:

            }
        }
    });

    // populate the type select from fractal-types.json
    (async () => {
        if (!typeSelect) return;
        try {
            // get request to fetch json
            const json = await getFractalTypes();
            if (!json) return;
            const list = Object.keys(json.fractals);
            for (const t of list) {
                // skip adding split koch, that is added in html
                if (!json.fractals[t] || !json.fractals[t].id || json.fractals[t].id == "split-koch") continue;
                // add each fractal to drop-down
                if (typeSelect.querySelector(`option[value="${json.fractals[t].id}"]`)) continue;
                const opt = document.createElement('option');
                opt.value = json.fractals[t].id;
                opt.textContent = json.fractals[t].name || json.fractals[t].id;
                typeSelect.appendChild(opt);
            }
            try { typeSelect.dispatchEvent(new Event('change')); } catch (e) { /* ignore */ }
        } catch (e) {
            console.warn('Failed to load fractal-types', e);
        }
    })();

    if (generateBtn) generateBtn.addEventListener('click', async () => {
        // determine which class to instantiate based on selection, defaults to Fractal class
        let Klass = Fractal;
        let properties = {};
        try {
            const sel = (typeSelect && typeSelect.value) ? typeSelect.value : 'kaden-hart';
            const json = await getFractalTypes();
            // response is good, set parameters
            if (json) {
                const list = Object.keys(json.fractals);
                for (const t of list) {
                    if ((json.fractals[t].id === sel || json.fractals[t].name === sel) && json.fractals[t].parameters) {
                        properties = json.fractals[t].parameters;
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
    for (const obj of addedObjects) {
        obj.rotation.x += 0.01;
        obj.rotation.y += 0.01;
    }

    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);