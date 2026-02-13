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

    drawFractal(a, length, depth) {
        const third = length/this.size;
        if(depth < this.properties.maxDepth){
            for(let layer = 0; layer < this.size; layer++){
                let z = a[2] + (third * layer);
                for(let row = 0; row < this.size; row++){
                    let x = a[0] + (third * row);
                    for(let col = 0; col < this.size; col++){
                        let y = a[1] - (third * col);
                        if(this.properties.pattern[layer][row][col] == 1) { this.drawFractal([x,y,z],third,depth+1); }
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

    addShape(a,b,c,d,color) {
        this.addFace(a,b,c,color);
        this.addFace(d,c,b,color);
    }
}