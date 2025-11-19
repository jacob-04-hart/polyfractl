import Fractal from './fractal.js';

export default class SierpinskiOctahedron extends Fractal {
    constructor(scene, options = {}, properties = {}) {
        super(scene, options, properties);
    }

    generate(){

        const a = [0,1,0];
        const b = [0,0,1];
        const c = [-1,0,0];
        const d = [0,0,-1];
        const e = [1,0,0];
        const f = [0,-1,0];

        this.drawFractal(a,b,c,d,e,f,0);

    }

    split(a, b, splitWidth = .5) {
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

    drawFractal(a,b,c,d,e,f,depth){

        if (depth < this.properties.maxDepth) {
            this.drawFractal(a,this.split(a,b),this.split(a,c),this.split(a,d),this.split(a,e),this.split(a,f),depth+1);
            this.drawFractal(this.split(b,a),b,this.split(b,c),this.split(b,d),this.split(b,e),this.split(b,f),depth+1);
            this.drawFractal(this.split(c,a),this.split(c,b),c,this.split(c,d),this.split(c,e),this.split(c,f),depth+1);
            this.drawFractal(this.split(d,a),this.split(d,b),this.split(d,c),d,this.split(d,e),this.split(d,f),depth+1);
            this.drawFractal(this.split(e,a),this.split(e,b),this.split(e,c),this.split(e,d),e,this.split(e,f),depth+1);
            this.drawFractal(this.split(f,a),this.split(f,b),this.split(f,c),this.split(f,d),this.split(f,e),f,depth+1);
        } else {
            this.addShape(a,b,c,d,e,f);
        }

    }

    addShape(a,b,c,d,e,f){

        this.addFace(a,b,c,this.properties.colors[0]);
        this.addFace(a,c,d,this.properties.colors[1]);
        this.addFace(a,d,e,this.properties.colors[2]);
        this.addFace(a,e,b,this.properties.colors[3]);
        this.addFace(f,e,d,this.properties.colors[0]);
        this.addFace(f,b,e,this.properties.colors[1]);
        this.addFace(f,c,b,this.properties.colors[2]);
        this.addFace(f,d,c,this.properties.colors[3]);

    }
}