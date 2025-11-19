import Fractal from './fractal.js';

export default class LSponge extends Fractal {
    constructor(scene, options = {}, properties = {}) {
        super(scene, options, properties);
    }

    generate() {
        const cubeVert = [-.5,.5,-.5];
        this.drawFractal(cubeVert,1,0);
    }

    drawFractal(a, length, depth) {
        const third = length/3;
        if(depth < this.properties.maxDepth){
            let fourth = length / 4;
            let half = length / 2;
            let threeQ = length * 3 / 4;

            this.drawFractal(a, fourth, depth + 2);
            this.drawFractal([ a[0]+fourth, a[1], a[2]], fourth, depth + 2);
            this.drawFractal([ a[0]+half, a[1], a[2]], half, depth + 1);
            this.drawFractal([ a[0], a[1]-fourth, a[2]], fourth, depth + 2);
            this.drawFractal([ a[0], a[1]-half, a[2]], fourth, depth + 2);
            this.drawFractal([ a[0]+threeQ, a[1]-half, a[2]], fourth, depth + 2);
            this.drawFractal([ a[0], a[1]-threeQ, a[2]], fourth, depth + 2);
            this.drawFractal([ a[0]+fourth, a[1]-threeQ, a[2]], fourth, depth + 2);
            this.drawFractal([ a[0]+half, a[1]-threeQ, a[2]], fourth, depth + 2);
            this.drawFractal([ a[0]+threeQ, a[1]-threeQ, a[2]], fourth, depth + 2);
            this.drawFractal([ a[0], a[1], a[2]+fourth ], fourth, depth + 2);
            this.drawFractal([ a[0], a[1]-threeQ, a[2]+fourth ], fourth, depth + 2);
            this.drawFractal([ a[0]+threeQ, a[1]-threeQ, a[2]+fourth ], fourth, depth + 2);
            this.drawFractal([ a[0], a[1], a[2]+half ], fourth, depth + 2);
            this.drawFractal([ a[0]+threeQ, a[1], a[2]+half ], fourth, depth + 2);
            this.drawFractal([ a[0], a[1]-half, a[2]+half ], half, depth + 1);
            this.drawFractal([ a[0]+threeQ, a[1]-threeQ, a[2]+half ], fourth, depth + 2);
            this.drawFractal([ a[0], a[1], a[2]+threeQ ], fourth, depth + 2);
            this.drawFractal([ a[0]+fourth, a[1], a[2]+threeQ ], fourth, depth + 2);
            this.drawFractal([ a[0], a[1]-fourth, a[2]+threeQ ], fourth, depth + 2);
            this.drawFractal([ a[0]+half, a[1], a[2]+threeQ ], fourth, depth + 2);
            this.drawFractal([ a[0]+threeQ, a[1], a[2]+threeQ ], fourth, depth + 2);
            this.drawFractal([ a[0]+threeQ, a[1]-fourth, a[2]+threeQ ], fourth, depth + 2);
            this.drawFractal([ a[0]+threeQ, a[1]-half, a[2]+threeQ ], fourth, depth + 2);
            this.drawFractal([ a[0]+half, a[1]-threeQ, a[2]+threeQ ], fourth, depth + 2);
            this.drawFractal([ a[0]+threeQ, a[1]-threeQ, a[2]+threeQ ], fourth, depth + 2);
        } else {
            let b = [ a[0] + length, a[1], a[2] ];
            let c = [ a[0], a[1] - length, a[2] ];
            let d = [ a[0] + length, a[1] - length, a[2] ];
            let e = [ a[0], a[1], a[2] + length ];
            let f = [ a[0] + length, a[1], a[2] + length ];
            let g = [ a[0], a[1] - length, a[2] + length ];
            let h = [ a[0] + length, a[1] - length, a[2] + length ];

            this.addShape(a,b,c,d,this.properties.colors[0]);
            this.addShape(f,e,h,g,this.properties.colors[1]);
            this.addShape(e,f,a,b,this.properties.colors[2]);
            this.addShape(h,g,d,c,this.properties.colors[3]);
            this.addShape(b,f,d,h,this.properties.colors[4]);
            this.addShape(e,a,g,c,this.properties.colors[5]);
        }
    }

    addShape(a,b,c,d,color) {
        this.addFace(a,b,c,color);
        this.addFace(d,c,b,color);
    }
}