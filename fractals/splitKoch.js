import Fractal from '../fractal.js';

export default class SplitKoch extends Fractal {
    constructor(scene, options = {}, properties = {}) {
        super(scene, options, properties);
    }
    
    generate() {
        // generate specific to splitKoch
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
