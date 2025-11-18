import Fractal from './fractal.js';

export default class SierpinskiTetrahedron extends Fractal {
    constructor(scene, options = {}, properties = {}) {
        super(scene, options, properties);
    }

    generate(){

        const a = [-.5,.5,-.5];
        const b = [-.5,-.5,.5];
        const c = [.5,-.5,-.5];
        const d = [.5,.5,.5];

        this.drawFractal(a,b,c,d,0);

    }

    drawFractal(a,b,c,d,depth){

        if (depth < this.properties.maxDepth) {
            this.drawFractal(a,this.split(a,b,.5),this.split(a,c,.5),this.split(a,d,.5),depth+1);
            this.drawFractal(this.split(b,a,.5),b,this.split(b,c,.5),this.split(b,d,.5),depth+1);
            this.drawFractal(this.split(c,a,.5),this.split(c,b,.5),c,this.split(c,d,.5),depth+1);
            this.drawFractal(this.split(d,a,.5),this.split(d,b,.5),this.split(d,c,.5),d,depth+1);
        } else {
            this.addShape(a,b,c,d);
        }

    }

    addShape(a,b,c,d){

        this.addFace(a,b,c,this.properties.colors[0]);
        this.addFace(a,c,d,this.properties.colors[1]);
        this.addFace(a,d,b,this.properties.colors[2]);
        this.addFace(b,d,c,this.properties.colors[3]);

    }
}