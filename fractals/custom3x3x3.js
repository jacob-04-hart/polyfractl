import Fractal from '../fractal.js';

export default class custom3x3x3 extends Fractal {
    constructor(scene, options = {}, properties = {}) {
        super(scene, options, properties);
        this.gold = (1 + Math.sqrt(5))/2; // golden ratio
        this.splitValue = 1/(1 + this.gold);
    }

    generate() {
        const cubeVert = [-.5,.5,-.5];
        // we have to do this because we don't load the params from json yet
        this.size = 3;
        this.drawFractal(cubeVert,1,0);
    }

    drawFractal(
    a,
    length,
    depth,
    ux = [1, 0, 0],   // local +X
    uy = [0, -1, 0],  // local Y-
    uz = [0, 0, 1]    // local +Z
) {
    const third = length / this.size;

    if (depth < this.properties.maxDepth) {
        for (let layer = 0; layer < this.size; layer++) {
            for (let row = 0; row < this.size; row++) {
                for (let col = 0; col < this.size; col++) {
                    if (this.properties.pattern[layer][row][col] !== 1) continue;

                    // child origin in parent's local frame
                    const childA = [
                        a[0] + ux[0] * (third * row) + uy[0] * (third * col) + uz[0] * (third * layer),
                        a[1] + ux[1] * (third * row) + uy[1] * (third * col) + uz[1] * (third * layer),
                        a[2] + ux[2] * (third * row) + uy[2] * (third * col) + uz[2] * (third * layer),
                    ];

                    // rotate basis for this child (compounds with depth)
                    const rUx = this.rotatePoint(ux, [0, 0, 0]);
                    const rUy = this.rotatePoint(uy, [0, 0, 0]);
                    const rUz = this.rotatePoint(uz, [0, 0, 0]);

                    // keep rotation around child center, not child origin
                    const center = [
                        childA[0] + (ux[0] + uy[0] + uz[0]) * (third / 2),
                        childA[1] + (ux[1] + uy[1] + uz[1]) * (third / 2),
                        childA[2] + (ux[2] + uy[2] + uz[2]) * (third / 2),
                    ];

                    const rotatedChildA = [
                        center[0] - (rUx[0] + rUy[0] + rUz[0]) * (third / 2),
                        center[1] - (rUx[1] + rUy[1] + rUz[1]) * (third / 2),
                        center[2] - (rUx[2] + rUy[2] + rUz[2]) * (third / 2),
                    ];

                    this.drawFractal(rotatedChildA, third, depth + 1, rUx, rUy, rUz);
                }
            }
        }
    } else {
        // leaf cube from local basis
        const b = [a[0] + ux[0] * length, a[1] + ux[1] * length, a[2] + ux[2] * length];
        const c = [a[0] + uy[0] * length, a[1] + uy[1] * length, a[2] + uy[2] * length];
        const d = [b[0] + uy[0] * length, b[1] + uy[1] * length, b[2] + uy[2] * length];
        const e = [a[0] + uz[0] * length, a[1] + uz[1] * length, a[2] + uz[2] * length];
        const f = [b[0] + uz[0] * length, b[1] + uz[1] * length, b[2] + uz[2] * length];
        const g = [c[0] + uz[0] * length, c[1] + uz[1] * length, c[2] + uz[2] * length];
        const h = [d[0] + uz[0] * length, d[1] + uz[1] * length, d[2] + uz[2] * length];

        this.addShape(a, b, c, d, this.properties.colors[0]);
        this.addShape(f, e, h, g, this.properties.colors[1]);
        this.addShape(e, f, a, b, this.properties.colors[2]);
        this.addShape(h, g, d, c, this.properties.colors[3]);
        this.addShape(b, f, d, h, this.properties.colors[4]);
        this.addShape(e, a, g, c, this.properties.colors[5]);
    }
}

    addShape(a,b,c,d,color) {
        this.addFace(a,b,c,color);
        this.addFace(d,c,b,color);
    }
}