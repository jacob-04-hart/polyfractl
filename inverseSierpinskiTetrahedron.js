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

        if (depth < (this.properties.maxDepth - 1)) {
            this.drawFractal(a,this.split(a,b,.5),this.split(a,c,.5),this.split(a,d,.5),depth+1);
            this.drawFractal(this.split(b,a,.5),b,this.split(b,c,.5),this.split(b,d,.5),depth+1);
            this.drawFractal(this.split(c,a,.5),this.split(c,b,.5),c,this.split(c,d,.5),depth+1);
            this.drawFractal(this.split(d,a,.5),this.split(d,b,.5),this.split(d,c,.5),d,depth+1);
            this.addShape(a,b,c,d);
        } else {
            this.addShape(a,b,c,d);
        }

    }

    addShape(a,b,c,d){
        const ab = this.split(a,b,.5);
        const ac = this.split(a,c,.5);
        const ad = this.split(a,d,.5);
        const bc = this.split(b,c,.5);
        const bd = this.split(b,d,.5);
        const cd = this.split(c,d,.5);
        this.addFace(ab,ac,ad,this.properties.colors[0]);
        this.addFace(bd,cd,bc,this.properties.colors[0]);
        this.addFace(ab,bc,bd,this.properties.colors[1]);
        this.addFace(ac,cd,ad,this.properties.colors[1]);
        this.addFace(ac,cd,bc,this.properties.colors[2]);
        this.addFace(ad,bd,ab,this.properties.colors[2]);
        this.addFace(ad,bd,cd,this.properties.colors[3]);
        this.addFace(ab,bc,ac,this.properties.colors[3]);

    }
}