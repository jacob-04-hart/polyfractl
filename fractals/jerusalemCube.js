import Fractal from './fractal.js';

export default class JerusalemCube extends Fractal {
    constructor(scene, options = {}, properties = {}) {
        super(scene, options, properties);
        this.scale = (2**(.5))-1;
        this.scale2 = (this.scale**2);

    }

    generate() {
        const cubeVert = [-.5,.5,-.5];
        this.drawFractal(cubeVert,1,0);
    }

    drawFractal(a, length, depth) {
        if (depth < this.properties.maxDepth) {
            for(let layer = 0; layer < 3; layer++){
                for(let row = 0; row < 3; row++){
                    for(let col = 0; col < 3; col++){
                        let count = (layer == 1? 1 : 0) + (row == 1? 1 : 0) + (col == 1? 1 : 0);
                        if ((layer != 1) && (row != 1) && (col != 1)) {
                            this.drawFractal([ a[0] + ((this.scale + this.scale2) * length * row / 2), a[1] - ((this.scale + this.scale2) * length * col / 2), a[2] + ((this.scale + this.scale2) * length * layer / 2) ], this.scale * length, depth + 1);
                        } else if (count == 1) {
                            this.drawFractal([ a[0] + (this.scale * length * row), a[1] - (this.scale * length * col), a[2] + (this.scale * length * layer) ], this.scale2 * length, depth + 2);
                        }
                    }
                }
            }
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

    // will add a square face
    addShape(a,b,c,d,color) {
        this.addFace(a,b,c,color);
        this.addFace(d,c,b,color);
    }
}