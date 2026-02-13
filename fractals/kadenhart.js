import { Sphere } from 'three';
import Fractal from '../fractal.js';

export default class KadenHart extends Fractal {
    constructor(scene, options = {}, properties = {}) {
        super(scene, options, properties);
    }

    generate(){

        const a = [0,0,0];
        const b = [.5,0,0];
        const c = [0,.75,0];
        const d = [0,.75,0];

        this.drawFractal(a,b,c,d,0);

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
    move(a, b, distance = .5) {
        const A = this._toVec(a);
        const B = this._toVec(b);

        if (![A, B].every(v => v.length === 3 && v.every(Number.isFinite))) {
            throw new TypeError('split: a and b must be vectors [x,y,z] or {x,y,z}');
        }

        return [
            A[0] + (B[0]*distance - A[0]) ,
            A[1] + (B[1]*distance - A[1]) ,
            A[2] + (B[2]*distance - A[2]) 
        ];
    }
    

    drawFractal(a,b,c,d,depth){

        if (depth < this.properties.maxDepth) {
            // this.drawFractal(a,this.split(a,b,.5),this.split(a,c,.5),this.split(a,d,.5),depth+1);
            this.drawFractal(a,b,c,d,depth+1);
            // this.drawFractal(this.split(a,b,.5),this.split(b,this.move(a,c,-.5),.1),b,b,depth+1);
            let slide = this.split(b,c,.5)
            this.drawFractal(c,slide,this.split(a,slide,2),this.split(a,slide,2),depth+1);
            // let b2 = b.map(element => element * -1);
            // let c2 = c.map(element => element * -1);
            // let slide2 = this.split(b2,c2,.5).map(element => element * -1);
            // this.drawFractal(c2,slide2,this.split(a,slide2,2),this.split(a,slide2,2),depth+1);

        } else {
            this.addShape(a,b,c,d);
        }

    }

    addShape(a,b,c,d){

        this.addFace(a,b,c,this.properties.colors[0]);
        this.addPoint(a,.01, this.properties.colors[0]);
        this.addFace(a,c,d,this.properties.colors[1]);
        this.addPoint(b,.01, this.properties.colors[1]);
        this.addFace(a,d,b,this.properties.colors[2]);
        this.addPoint(c,.01, this.properties.colors[2]);
        this.addFace(b,d,c,this.properties.colors[3]);
        this.addPoint(d,.01, this.properties.colors[3]);

    }
}