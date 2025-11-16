import * as THREE from 'three';
import Fractal from './fractal.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();

// Append renderer to the canvas container created by the grid layout.
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
    // will change this to have the objects be generated based on depth if that model was not already generated

    if (clearBtn) clearBtn.addEventListener('click', () => {
        clearScene();
    });

	// we need to change this to be generalized generate button that generates based on the selected fractal
    if (generateBtn) generateBtn.addEventListener('click', () => {
        // create a fractal instance and generate fractal
        const f = new Fractal(scene, {});

        // these will be not all be used
        f.setProperties({ "maxDepth": maxDepth,
                          "colors": colors,
                          "thickness": thickness,
                          "splitWidth": splitWidth,

         });

        // progress
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