// fractal.js
import * as THREE from 'three';

export default class Fractal {
    constructor(scene, { doubleSided = true, materialOptions = {} } = {}, properties = {}) {
        if (!scene) throw new Error('Fractal requires a THREE.Scene instance');
        this.scene = scene;

        // default properties
        this.properties = { "maxDepth": 4, 
                            "colors": [], 
                            "thickness": 1, 
                            "splitWidth": 0.45 };

        this._positions = []; // flat [x,y,z, x,y,z, ...]
        this._colors = [];    // flat [r,g,b, ...]
        this._mesh = null;

        this.materialOptions = Object.assign({ vertexColors: true, side: doubleSided ? THREE.DoubleSide : THREE.FrontSide }, materialOptions);

        // generation/progress state
        this._triangleCount = 0;
        this.progressCallback = null; // function(count)
        this._cancelRequested = false;
    }

    _toVec(v) {
        if (Array.isArray(v)) return v;
        return [v.x, v.y, v.z];
    }

    addFace(v1, v2, v3, color = 0xcccccc) {
        const a = this._toVec(v1), b = this._toVec(v2), c = this._toVec(v3);
        // quick validation
        if (![a, b, c].every(v => v.length === 3 && v.every(Number.isFinite))) {
            throw new TypeError('addFace expects vertices as [x,y,z] or {x,y,z} with numeric components');
        }

        const baseIndex = this._positions.length / 3;
        this._positions.push(...a, ...b, ...c);

        const col = new THREE.Color(color);
        for (let i = 0; i < 3; i++) this._colors.push(col.r, col.g, col.b);

        // update generation counter and call progress callback occasionally
        this._triangleCount += 1;
        if (typeof this.progressCallback === 'function' && (this._triangleCount % 50 === 0)) {
            try { this.progressCallback(this._triangleCount); } catch (e) { /* ignore */ }
        }

        return baseIndex;
    }

    // cancel support for long-running generation
    requestCancel() { this._cancelRequested = true; }
    cancelRequested() { return this._cancelRequested; }

    buildTrianglesMesh({ computeNormals = true } = {}) {
        // remove old mesh if exists
        this.clearMesh();

        if (this._positions.length === 0) return null;

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(this._positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(this._colors, 3));
        geometry.setDrawRange(0, this._positions.length / 3);

        if (computeNormals) geometry.computeVertexNormals();
        geometry.computeBoundingSphere();

        const material = new THREE.MeshStandardMaterial(this.materialOptions);
        const mesh = new THREE.Mesh(geometry, material);

        this.scene.add(mesh);
        this._mesh = mesh;
        return mesh;
    }

    clearMesh() {
        if (!this._mesh) return;
        // remove from scene
        try {
            this.scene.remove(this._mesh);
        } catch (e) { }
        try {
            this._mesh.traverse((c) => {
                // cast to THREE.Mesh for tooling/type-checkers; runtime object may be an Object3D
                const meshChild = /** @type {THREE.Mesh} */ (c);
                if (meshChild && meshChild.isMesh) {
                    if (meshChild.geometry && typeof meshChild.geometry.dispose === 'function') {
                        try { meshChild.geometry.dispose(); } catch (e) { /* ignore */ }
                    }

                    const _disposeMaterial = (m) => {
                        if (!m) return;
                        // dispose common texture maps first
                        if (m.map && typeof m.map.dispose === 'function') {
                            try { m.map.dispose(); } catch (e) { /* ignore */ }
                        }
                        if (typeof m.dispose === 'function') {
                            try { m.dispose(); } catch (e) { /* ignore */ }
                        }
                    };

                    if (meshChild.material) {
                        if (Array.isArray(meshChild.material)) meshChild.material.forEach(_disposeMaterial);
                        else _disposeMaterial(meshChild.material);
                    }
                }
            });
        } catch (e) { }

        this._mesh = null;
    }

    clear() {
        this.clearMesh();
        this._positions.length = 0;
        this._colors.length = 0;
    }

    destroy() {
        this.clear();
        this.scene = null;
    }

    split(a, b, splitWidth = this.properties.splitWidth) {
        const A = this._toVec(a);
        const B = this._toVec(b);

        if (![A, B].every(v => v.length === 3 && v.every(Number.isFinite))) {
            throw new TypeError('split: a and b must be vectors [x,y,z] or {x,y,z}');
        }

        return [
            A[0] + (B[0] - A[0]) * splitWidth,
            A[1] + (B[1] - A[1]) * splitWidth,
            A[2] + (B[2] - A[2]) * splitWidth
        ];
    }

    // index 0 will be depth, more can be added in children
    setProperties(properties) {
        this.properties = properties;
        this.properties.maxDepth = properties.maxDepth;
        this.properties.thickness = properties.thickness;
        this.properties.splitWidth = properties.splitWidth;
    }

    generate() {

        // no-arg form: use properties to drive generation
        const sqrt3 = Math.sqrt(3);
        const a = [1.0, 0.0, 0.0];
        const b = [-0.5, -(sqrt3 / 2.0), 0.0];
        const c = [-0.5, (sqrt3 / 2.0), 0.0];

        const top = [0.0, 0.0, -0.5*this.properties.thickness];
        const bottom = [0.0, 0.0, 0.5*this.properties.thickness];

        return this.drawFractal(a, b, c, top, bottom, 0,
                    this.properties.colors[0], this.properties.colors[1], this.properties.colors[2],
                    this.properties.colors[0], this.properties.colors[1], this.properties.colors[2]);
    }

    // for now, example generate code for fractal parent
    // f and b keep track of color
    drawFractal(a, b, c, top, bottom, depth,
                f1, f2, f3, b1, b2, b3) {

        if (depth < this.properties.maxDepth) {

            const newT1 = this.split(a, b);
            const newT2 = this.split(b, a);
            const newBot2 = this.split(b, c);
            const newBot3 = this.split(c, b);
            const newT3 = this.split(c, a);
            const newBot1 = this.split(a, c);
            this.drawFractal(a, bottom, top, newT1, newBot1, depth + 1, b1, this.properties.colors[3], f1, b3, this.properties.colors[3], f3);
            this.drawFractal(b, top, bottom, newT2, newBot2, depth + 1, f1, this.properties.colors[3], b1, b2, this.properties.colors[3], f2);
            this.drawFractal(c, bottom, top, newT3, newBot3, depth + 1, b3, this.properties.colors[3], f3, b2, this.properties.colors[3], f2);

        } else { // base case, smallest shape

            this.addShape(a, b, c, top, bottom, f1, f2, f3, b1, b2, b3);

        }
    }

    addShape(a, b, c, top, bottom,
            f1, f2, f3, b1, b2, b3) {

        this.addFace(a, b, top, f1);
        this.addFace(b, c, top, f2);
        this.addFace(c, a, top, f3);
        this.addFace(a, bottom, b, b1);
        this.addFace(b, bottom, c, b2);
        this.addFace(c, bottom, a, b3);
    }
}