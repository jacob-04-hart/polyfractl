import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import Fractal from './fractal.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const loader = new GLTFLoader();

const addedObjects = [];

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const directional = new THREE.DirectionalLight(0xffffff, 0.8);
directional.position.set(5, 10, 7.5);
scene.add(directional);

camera.position.set(0, 0, 6);

// handles multiple objects if we decided this
function addObjectToScene(obj) {
    scene.add(obj);
    addedObjects.push(obj);
}

// example object adders for testing
function createCube() {
    clearScene();
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x4caf50 });
    const mesh = new THREE.Mesh(geo, mat);
    return mesh;
}

// fractal class usage example
// const f = new Fractal(scene);
// f.addTriangle([0,0,0],[1,0,0],[0,1,0], 0xff0000);
// f.addTriangle({x:1,y:0,z:0},{x:1,y:1,z:0},{x:0,y:1,z:0}, '#00ff00');
// f.buildTrianglesMesh();    // creates mesh and adds to scene
//
// f.clear();                 // disposes mesh & clears arrays
// f.destroy();               // final cleanup if you're done with this instance

function createSphere() {
    clearScene();
    const geo = new THREE.SphereGeometry(0.6, 32, 32);
    const mat = new THREE.MeshStandardMaterial({ color: 0x2196f3, metalness: 0.3, roughness: 0.6 });
    const mesh = new THREE.Mesh(geo, mat);
    return mesh;
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
    const addCubeBtn = document.getElementById('add-cube');
    const addSphereBtn = document.getElementById('add-sphere');
    const clearBtn = document.getElementById('clear-scene');
    const genSplitKochBtn = document.getElementById('gen-split-koch');
    // will change this to have the objects be generated based on depth if that model was not already generated

    if (addCubeBtn) addCubeBtn.addEventListener('click', () => {
        const cube = createCube();
        addObjectToScene(cube);
    });

    if (addSphereBtn) addSphereBtn.addEventListener('click', () => {
        const s = createSphere();
        addObjectToScene(s);
    });

    if (clearBtn) clearBtn.addEventListener('click', () => {
        clearScene();
    });

    if (genSplitKochBtn) genSplitKochBtn.addEventListener('click', () => {
        // create a fractal instance and generate a split-Koch fractal
        const depth = 5;
        const f = new Fractal(scene, {}, depth);

        // show progress
        const progressEl = document.getElementById('progress');
        const progressMsg = document.getElementById('progress-msg');
        const progressCancel = document.getElementById('progress-cancel');
        if (progressEl) progressEl.style.display = 'block';
        if (progressMsg) progressMsg.textContent = 'Preparing generation...';

        // wire cancel button
        const onCancel = () => {
            f.requestCancel();
            if (progressMsg) progressMsg.textContent = 'Cancel requested; stopping soon...';
        };
        if (progressCancel) progressCancel.addEventListener('click', onCancel, { once: true });

        // update progress text occasionally
        f.progressCallback = (count) => {
            if (progressMsg) progressMsg.textContent = `Generating fractal... triangles: ${count}`;
        };

        // initial vertices (equilateral triangle)
        const sqrt3 = Math.sqrt(3);
        const a = [1.0, 0.0, 0.0];
        const b = [-0.5, -(sqrt3 / 2.0), 0.0];
        const c = [-0.5, (sqrt3 / 2.0), 0.0];

        const top = [0.0, 0.0, -0.5];
        const bottom = [0.0, 0.0, 0.5];

        // run generation asynchronously so the overlay can paint before heavy work
        setTimeout(() => {
            try {
                if (progressMsg) progressMsg.textContent = 'Generating fractal...';
                f.generateSplitKoch(a, b, c, top, bottom, 0,
                    f.color1, f.color2, f.color3,
                    f.color1, f.color2, f.color3);

                if (f.cancelRequested() && progressMsg) progressMsg.textContent = 'Generation cancelled.';

                const mesh = f.buildTrianglesMesh();
                if (mesh) addObjectToScene(mesh);
            } catch (e) {
                console.error('Fractal generation error', e);
                if (progressMsg) progressMsg.textContent = 'Generation error (see console)';
            } finally {
                // hide overlay after a short delay so user sees final message
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

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});