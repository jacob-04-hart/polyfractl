// fractal.js
import * as THREE from 'three';

export default class Fractal {
    constructor(scene, { doubleSided = true, materialOptions = {} } = {}, properties = {}) {
        if (!scene) throw new Error('Fractal requires a THREE.Scene instance');
        this.scene = scene;
        this.properties = properties;

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
        // we need to fix this
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
    }

    generate() {
        const sqrt3 = Math.sqrt(3);
        const a = [1.0, 0.0, 0.0];
        const b = [-0.5, -(sqrt3 / 2.0), 0.0];
        const c = [-0.5, (sqrt3 / 2.0), 0.0];
        const top = [0.0, 0.0, 0.75];

        return this.drawFractal(a, b, c, top,
                    this.properties.colors[0],
                    this.properties.colors[1],
                    this.properties.colors[2],
                    this.properties.colors[3]
                    );
    }

    drawFractal(a, b, c, top,
                f1, f2, f3, f4) {

        this.addShape(a, b, c, top, f1, f2, f3, f4);

    }

    addShape(a, b, c, top,
            f1, f2, f3, f4) {

        try {
            this.addFace(a, b, c, f1);
            this.addFace(a, b, top, f2);
            this.addFace(b, c, top, f3);
            this.addFace(c, a, top, f4);
        } catch (e) { }
    }
    addPoint(a, size, color) {

        try {
            let sphereMesh = new THREE.SphereGeometry(size, 8, 8);
            let sphereMaterial = new THREE.MeshBasicMaterial({ color: color });
            let sphere = new THREE.Mesh(sphereMesh, sphereMaterial);
            sphere.position.set(a[0], a[1], a[2]);
            this.scene.add(sphere);
            // this.scene.add(new THREE.Sphere(a,size))
            
        } catch (e) { }
    }

}