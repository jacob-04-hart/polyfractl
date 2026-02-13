import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Fractal from './fractal.js';
// other fractal classes will be dynamically imported
const fractalModules = {
    './custom2x2x2.js': () => import('./custom2x2x2.js'),
    './custom3x3x3.js': () => import('./custom3x3x3.js'),
    './custom4x4x4.js': () => import('./custom4x4x4.js'),
    './custom5x5x5.js': () => import('./custom5x5x5.js'),
    './splitKoch.js': () => import('./splitKoch.js'),
    './inverseSierpinskiTetrahedron.js': () => import('./inverseSierpinskiTetrahedron.js'),
    './jerusalemCube.js': () => import('./jerusalemCube.js'),
    './lSponge.js': () => import('./lSponge.js'),
    './mengerSponge.js': () => import('./mengerSponge.js'),
};

const scene = new THREE.Scene();
const perspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const orthographicCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
let camera = /** @type {THREE.PerspectiveCamera | THREE.OrthographicCamera} */ (perspectiveCamera); // active camera
const initialTarget = new THREE.Vector3(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
    //antialias: true 
});

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
    
    if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    } else if (camera instanceof THREE.OrthographicCamera) {
        const aspect = width / height;
        const frustumSize = 5;
        camera.left = -frustumSize * aspect / 2;
        camera.right = frustumSize * aspect / 2;
        camera.top = frustumSize / 2;
        camera.bottom = -frustumSize / 2;
        camera.updateProjectionMatrix();
    }
}

// controls for zoom and rotate
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.maxDistance = 4000;
controls.target.copy(initialTarget);
controls.enablePan = true;
controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN
};

// initial size
resizeRendererToDisplaySize();
window.addEventListener('resize', resizeRendererToDisplaySize);

const addedObjects = [];

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const directional = new THREE.DirectionalLight(0xffffff, 0.8);
directional.position.set(5, 10, 7.5);
scene.add(directional);

const viewAngles = [
    new THREE.Vector3(0, 0, 3),
    new THREE.Vector3(3, 0, 0),
    new THREE.Vector3(0, 3, 0),
    new THREE.Vector3(-3, 0, 0),
    new THREE.Vector3(0, -3, 0),
    new THREE.Vector3(0, 0, -3),
    new THREE.Vector3(3, 3, 3),
    new THREE.Vector3(-3, 3, 3),
    new THREE.Vector3(3, -3, 3),
    new THREE.Vector3(3, 3, -3),
    new THREE.Vector3(-3, -3, 3),
    new THREE.Vector3(3, -3, -3),
    new THREE.Vector3(-3, 3, -3),
    new THREE.Vector3(-3, -3, -3),
];
let currentViewIndex = 0;

perspectiveCamera.position.copy(viewAngles[currentViewIndex]);
orthographicCamera.position.copy(viewAngles[currentViewIndex]);

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
        const res = await fetch('./fractal-types.json', { cache: 'no-cache' });
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

function addSlider(name, min, max, initial, step, typeSelect) {
    try {
        // container holds label on top, then a row with slider + value
        const sliderContainer = document.createElement('div');
        sliderContainer.style.display = 'flex';
        sliderContainer.style.flexDirection = 'column';
        sliderContainer.style.alignItems = 'stretch';
        sliderContainer.style.gap = '6px';
        sliderContainer.style.marginTop = '8px';

        const label = document.createElement('label');
        label.htmlFor = 'slider-' + name;
        label.textContent = name;

        // row that contains the slider and the numeric value
        const sliderRow = document.createElement('div');
        sliderRow.style.display = 'flex';
        sliderRow.style.alignItems = 'center';
        sliderRow.style.gap = '8px';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.id = 'slider-' + name;
        slider.min = String(min);
        slider.max = String(max);
        slider.step = String(step);
        slider.value = String(initial);
        slider.style.flex = '1';

        const valueSpan = document.createElement('span');
        valueSpan.id = 'slider-' + name + 'value';
        valueSpan.textContent = String(slider.value);

        sliderRow.appendChild(slider);
        sliderRow.appendChild(valueSpan);

        sliderContainer.appendChild(label);
        sliderContainer.appendChild(sliderRow);

        // insert the slider container after the select's parent block if possible
        const insertAfter = (typeSelect && typeSelect.parentElement) ? typeSelect.parentElement : typeSelect;
        if (insertAfter && typeof insertAfter.insertAdjacentElement === 'function') {
            insertAfter.insertAdjacentElement('afterend', sliderContainer);
        } else if (typeSelect && typeSelect.insertAdjacentElement) {
            typeSelect.insertAdjacentElement('afterend', sliderContainer);
        }

        return sliderContainer;
    } catch (e) {
        console.warn('Could not create slider control', e);
        return null;
    }
}

// grid of nxn toggle buttons with layer navigation for 3D patterns
function addGrid(size, typeSelect, pattern3D, sel) {
    try {
    const wrapperContainer = document.createElement('div');
    wrapperContainer.id = 'grid-pattern';
    wrapperContainer.style.marginTop = '8px';
    
    // Layer navigation controls
    const layerControls = document.createElement('div');
    layerControls.style.display = 'flex';
    layerControls.style.alignItems = 'center';
    layerControls.style.gap = '8px';
    layerControls.style.marginBottom = '8px';
    
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '◀';
    prevBtn.style.padding = '5px 10px';
    prevBtn.style.cursor = 'pointer';
    
    const layerLabel = document.createElement('span');
    layerLabel.style.minWidth = '80px';
    layerLabel.style.textAlign = 'center';
    
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '▶';
    nextBtn.style.padding = '5px 10px';
    nextBtn.style.cursor = 'pointer';
    
    layerControls.appendChild(prevBtn);
    layerControls.appendChild(layerLabel);
    layerControls.appendChild(nextBtn);
    wrapperContainer.appendChild(layerControls);
    
    const gridContainer = document.createElement('div');
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    gridContainer.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    gridContainer.style.gap = '4px';
    gridContainer.style.width = '100%';
    
    // Create buttons
    for (let i = 0; i < size * size; i++) {
        const btn = document.createElement('button');
        btn.textContent = '';
        btn.dataset.toggled = 'false';
        btn.style.backgroundColor = '#ccc';
        btn.style.border = '1px solid #999';
        btn.style.padding = '0';
        btn.style.cursor = 'pointer';
        btn.style.aspectRatio = '1';
        btn.style.width = '100%';
        gridContainer.appendChild(btn);
    }
    
    wrapperContainer.appendChild(gridContainer);
    
    // State management
    let currentLayer = 0;
    const numLayers = pattern3D ? pattern3D.length : 1;
    
    // Update grid based on current layer
    function updateGrid() {
        layerLabel.textContent = `Layer ${currentLayer + 1}`;
        const buttons = gridContainer.querySelectorAll('button');
        
        if (pattern3D && pattern3D[currentLayer]) {
            const layerData = pattern3D[currentLayer];
            for (let i = 0; i < buttons.length && i < size * size; i++) {
                const row = Math.floor(i / size);
                const col = i % size;
                if (layerData[row] && layerData[row][col] !== undefined) {
                    const toggled = !!layerData[row][col];
                    buttons[i].dataset.toggled = toggled ? 'true' : 'false';
                    buttons[i].style.backgroundColor = toggled ? '#4CAF50' : '#ccc';
                }
            }
        }
        
        prevBtn.disabled = currentLayer === 0;
        nextBtn.disabled = currentLayer === numLayers - 1;
    }
    
    // Layer navigation handlers
    prevBtn.addEventListener('click', () => {
        if (currentLayer > 0) {
            currentLayer--;
            updateGrid();
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (currentLayer < numLayers - 1) {
            currentLayer++;
            updateGrid();
        }
    });
    
    // Button toggle handlers
    const buttons = gridContainer.querySelectorAll('button');
    buttons.forEach((btn, i) => {
        btn.addEventListener('click', () => {
            const isToggled = btn.dataset.toggled === 'true';
            const newToggled = !isToggled;
            btn.dataset.toggled = newToggled ? 'true' : 'false';
            btn.style.backgroundColor = newToggled ? '#4CAF50' : '#ccc';
            
            // Update the 3D pattern array
            if (pattern3D && pattern3D[currentLayer]) {
                const row = Math.floor(i / size);
                const col = i % size;
                if (pattern3D[currentLayer][row]) {
                    pattern3D[currentLayer][row][col] = newToggled ? 1 : 0;
                    // Update localStorage
                    updateFractalTypeParameter({pattern: pattern3D}, sel, 'pattern', pattern3D);
                }
            }
        });
    });
    
    // Initial render
    updateGrid();
    
    const insertAfter = (typeSelect && typeSelect.parentElement) ? typeSelect.parentElement : typeSelect;
    if (insertAfter && typeof insertAfter.insertAdjacentElement === 'function') {
        insertAfter.insertAdjacentElement('afterend', wrapperContainer);
    } else if (typeSelect && typeSelect.insertAdjacentElement) {
        typeSelect.insertAdjacentElement('afterend', wrapperContainer);
    }

    return wrapperContainer;
    } catch (e) {
        console.warn('Could not create grid control', e);
        return null;
    }
}

function updateFractalTypeParameter(properties, sel, paramName, value) {
    const key = 'fractal-types';
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (!data || !data.fractals) return false;

        const ids = Object.keys(data.fractals);
        for (const id of ids) {
            const item = data.fractals[id];
            if (!item) continue;
            if (item.id === sel || item.name === sel) {
                if (!item.parameters || typeof item.parameters !== 'object') item.parameters = {};
                item.parameters[paramName] = value;
                // keep the runtime properties object in sync if provided
                if (properties && typeof properties === 'object') properties[paramName] = value;
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            }
        }
    } catch (e) {
        console.warn('Could not update fractal-types in localStorage', e);
    }
    return false;
}

window.addEventListener('DOMContentLoaded', () => {
    const clearBtn = document.getElementById('clear-scene');
    const generateBtn = document.getElementById('generate');
    const cycleViewBtn = document.getElementById('cycle-view');
    /** @type {HTMLSelectElement|null} */
    const typeSelect = /** @type {HTMLSelectElement|null} */ (document.getElementById('fractal-type-select'));
    
    // Add view controls above typeSelect
    const sidebarUI = document.getElementById('sidebar-ui');
    if (sidebarUI && typeSelect && typeSelect.parentElement) {
        // Ortho toggle
        const orthoContainer = document.createElement('div');
        orthoContainer.style.display = 'flex';
        orthoContainer.style.alignItems = 'center';
        orthoContainer.style.gap = '8px';
        orthoContainer.style.width = '100%';
        
        const orthoCheckbox = document.createElement('input');
        orthoCheckbox.type = 'checkbox';
        orthoCheckbox.id = 'ortho-toggle';
        
        const orthoLabel = document.createElement('label');
        orthoLabel.htmlFor = 'ortho-toggle';
        orthoLabel.textContent = 'Orthographic Projection';
        orthoLabel.style.cursor = 'pointer';
        
        orthoContainer.appendChild(orthoCheckbox);
        orthoContainer.appendChild(orthoLabel);
        
        // Insert before the typeSelect container
        typeSelect.parentElement.parentNode.insertBefore(orthoContainer, typeSelect.parentElement);
        
        // Ortho toggle handler
        orthoCheckbox.addEventListener('change', () => {
            const oldCamera = camera;
            camera = orthoCheckbox.checked ? orthographicCamera : perspectiveCamera;
            
            // Copy position and target
            camera.position.copy(oldCamera.position);
            controls.object = camera;
            
            resizeRendererToDisplaySize();
        });
    }

    // cycle view handler - look at cube corner
    if (cycleViewBtn) cycleViewBtn.addEventListener('click', () => {
        if (viewAngles.length === 0) return;
        currentViewIndex = (currentViewIndex + 1) % viewAngles.length;
        perspectiveCamera.position.copy(viewAngles[currentViewIndex]);
        orthographicCamera.position.copy(viewAngles[currentViewIndex]);
        controls.target.set(0, 0, 0);
        controls.update();
    });

    if (clearBtn) clearBtn.addEventListener('click', () => {
        clearScene();
    });

    if (typeSelect) typeSelect.addEventListener('change', async () => {
        const sel = (typeSelect && typeSelect.value) ? typeSelect.value : 'split-koch';
        const res = await fetch('./fractal-types.json', { cache: 'no-cache' });
        const json = await getFractalTypes();
        if (!json) return;
        const entries = Object.values(json.fractals || {});
        // entry is the specific fractal
        const entry = entries.find(e => e && (e.id === sel || e.name === sel));
        if (!entry || !entry.parameters) return;
        // parameters is the parameters of the specific fractal
        const parameters = entry.parameters;
        //remove grid and sliders
        try {
            const existing = document.getElementById('grid-pattern');
            if (existing) existing.remove();
        } catch (e) { /* ignore */ }
        try {
            const existing = document.getElementById('slider-Recursive Depth');
            if (existing && existing.parentElement && existing.parentElement.parentElement) existing.parentElement.parentElement.remove();
        } catch (e) { /* ignore */ }

        try {
            const existing = document.getElementById('slider-Split Width');
            if (existing && existing.parentElement && existing.parentElement.parentElement) existing.parentElement.parentElement.remove();
        } catch (e) { /* ignore */ }

        try {
            const existing = document.getElementById('slider-Thickness');
            if (existing && existing.parentElement && existing.parentElement.parentElement) existing.parentElement.parentElement.remove();
        } catch (e) { /* ignore */ }
        for (const parameter in parameters) {
        // console.log(parameter);
            switch (parameter) {
                case "splitWidth":
                    {
                        const sliderContainer = addSlider("Split Width", 0, .5, parameters.splitWidth, .01, typeSelect);
                        if (!sliderContainer) break;
                        // cast as input elements
                        const slider = /** @type {HTMLInputElement|null} */ (sliderContainer.querySelector('input[type="range"]'));
                        const valueSpan = /** @type {HTMLElement|null} */ (sliderContainer.querySelector('span'));
                        if (slider) {
                            slider.addEventListener('input', () => {
                                if (valueSpan) valueSpan.textContent = String(slider.value);
                                updateFractalTypeParameter(parameters, sel, 'splitWidth', Number(slider.value));
                            });
                        }
                    }
                    break;
                case "thickness":
                    {
                        const sliderContainer = addSlider("Thickness", 0, 3, parameters.thickness, .01, typeSelect);
                        if (!sliderContainer) break;
                        // cast as input elements
                        const slider = /** @type {HTMLInputElement|null} */ (sliderContainer.querySelector('input[type="range"]'));
                        const valueSpan = /** @type {HTMLElement|null} */ (sliderContainer.querySelector('span'));
                        if (slider) {
                            slider.addEventListener('input', () => {
                                if (valueSpan) valueSpan.textContent = String(slider.value);
                                updateFractalTypeParameter(parameters, sel, 'thickness', Number(slider.value));
                            });
                        }
                    }
                    break;
                case "colors":

                    break;
                case "pattern":
                        // add a grid control for pattern
                        // includes two buttons with arrows for scrolling through pattern layers
                        // then a grid of buttons for the current layer
                    {
                        if (Array.isArray(parameters.pattern) && parameters.pattern.length > 0) {
                            // Determine grid size from pattern dimensions
                            // Pattern can be 2D or 3D array
                            let gridSize;
                            let pattern3D;
                            
                            // Check if it's a 3D array (array of 2D arrays)
                            if (Array.isArray(parameters.pattern[0]) && Array.isArray(parameters.pattern[0][0])) {
                                // It's 3D: [layer][row][col]
                                pattern3D = parameters.pattern;
                                gridSize = parameters.pattern[0].length; // rows in first layer
                            } else if (Array.isArray(parameters.pattern[0])) {
                                // It's 2D: [row][col], convert to 3D with single layer
                                pattern3D = [parameters.pattern];
                                gridSize = parameters.pattern.length;
                            } else {
                                // Invalid format, skip
                                break;
                            }
                            
                            const gridContainer = addGrid(gridSize, typeSelect, pattern3D, sel);
                        }
                    }

                    break;
                case "maxDepth":
                    {
                        const sliderContainer = addSlider("Recursive Depth", 0, 12, parameters.maxDepth, 1, typeSelect);
                        if (!sliderContainer) break;
                        // cast as input elements
                        const slider = /** @type {HTMLInputElement|null} */ (sliderContainer.querySelector('input[type="range"]'));
                        const valueSpan = /** @type {HTMLElement|null} */ (sliderContainer.querySelector('span'));
                        if (slider) {
                            slider.addEventListener('input', () => {
                                if (valueSpan) valueSpan.textContent = String(slider.value);
                                updateFractalTypeParameter(parameters, sel, 'maxDepth', Number(slider.value));
                            });
                        }
                    }
                    break;
                default: // maybe we can add toggles for x,y,z auto rotate

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
                const modulePath = `./${moduleName}.js`;

                if (fractalModules[modulePath]) {
                    const mod = await fractalModules[modulePath]();
                    if (mod && (typeof mod.default === 'function')) {
                        Klass = mod.default;
                    }
                } else {
                    console.warn('Module not found:', modulePath);
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
    controls.update();
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);