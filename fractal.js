// fractal.js
import * as THREE from 'three';

export default class Fractal {
    constructor(scene, { doubleSided = true, materialOptions = {} } = {}, maxDepth = 4) {
        if (!scene) throw new Error('Fractal requires a THREE.Scene instance');
        this.maxDepth = maxDepth;
        this.scene = scene;

        this._positions = []; // flat [x,y,z, x,y,z, ...]
        this._colors = [];    // flat [r,g,b, ...]
        this._mesh = null;

        this.materialOptions = Object.assign({ vertexColors: true, side: doubleSided ? THREE.DoubleSide : THREE.FrontSide }, materialOptions);
        // predefined palette (RGB floats)
        this.color1 = new THREE.Color(1.0, 0.0, 0.0); // red
        this.color2 = new THREE.Color(0.0, 1.0, 0.0); // green
        this.color3 = new THREE.Color(0.0, 0.0, 1.0); // blue
        this.color4 = new THREE.Color(1.0, 0.5, 0.0); // orange
        this.color5 = new THREE.Color(1.0, 1.0, 0.0); // yellow
        this.color6 = new THREE.Color(0.5, 0.0, 0.5); // purple
        this.color7 = new THREE.Color(0.2, 0.3, 0.3); // teal-ish
        // generation/progress state
        this._triangleCount = 0;
        this.progressCallback = null; // function(count)
        this._cancelRequested = false;
    }

    _toVec(v) {
        if (Array.isArray(v)) return v;
        return [v.x, v.y, v.z];
    }

    addTriangle(v1, v2, v3, color = 0xcccccc) {
        const a = this._toVec(v1), b = this._toVec(v2), c = this._toVec(v3);
        // quick validation
        if (![a, b, c].every(v => v.length === 3 && v.every(Number.isFinite))) {
            throw new TypeError('addTriangle expects vertices as [x,y,z] or {x,y,z} with numeric components');
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
        this.scene.remove(this._mesh);
        this._mesh.traverse((c) => {
            if (c.isMesh) {
                if (c.geometry) c.geometry.dispose();
                if (c.material) {
                    if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
                    else c.material.dispose();
                }
            }
        });
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

    split(a, b, t = 0.45) {
        const A = this._toVec(a);
        const B = this._toVec(b);

        if (![A, B].every(v => v.length === 3 && v.every(Number.isFinite))) {
            throw new TypeError('split: a and b must be vectors [x,y,z] or {x,y,z}');
        }

        return [
            A[0] + (B[0] - A[0]) * t,
            A[1] + (B[1] - A[1]) * t,
            A[2] + (B[2] - A[2]) * t
        ];
    }

    generateSplitKoch(a, b, c, top, bottom, depth,
        f1, f2, f3,
        b1, b2, b3) {
        if (depth < this.maxDepth) {
            const newT1 = this.split(a, b);
            const newT2 = this.split(b, a);
            const newBot2 = this.split(b, c);
            const newBot3 = this.split(c, b);
            const newT3 = this.split(c, a);
            const newBot1 = this.split(a, c);
            this.generateSplitKoch(a, bottom, top, newT1, newBot1, depth + 1, b1, this.color4, f1, b3, this.color4, f3);
            this.generateSplitKoch(b, top, bottom, newT2, newBot2, depth + 1, f1, this.color4, b1, b2, this.color4, f2);
            this.generateSplitKoch(c, bottom, top, newT3, newBot3, depth + 1, b3, this.color4, f3, b2, this.color4, f2);
        } else {
            this.createDelta(a, b, c, top, bottom, f1, f2, f3, b1, b2, b3);
        }
    }

    createDelta(a, b, c, top, bottom,
        f1, f2, f3,
        b1, b2, b3) {

        this.addTriangle(a, b, top, f1);
        this.addTriangle(b, c, top, f2);
        this.addTriangle(c, a, top, f3);
        this.addTriangle(a, bottom, b, b1);
        this.addTriangle(b, bottom, c, b2);
        this.addTriangle(c, bottom, a, b3);
    }
}