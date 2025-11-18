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

    drawFractal(one, length, depth) {
        if (depth < this.properties.maxDepth) {
            for(let layer = 0; layer < 3; layer++){
                for(let row = 0; row < 3; row++){
                    for(let col = 0; col < 3; col++){
                        let count = (layer == 1? 1 : 0) + (row == 1? 1 : 0) + (col == 1? 1 : 0);
                        if ((layer != 1) && (row != 1) && (col != 1)) {
                            this.drawFractal([ one[0] + ((this.scale + this.scale2) * length * row / 2), one[1] - ((this.scale + this.scale2) * length * col / 2), one[2] + ((this.scale + this.scale2) * length * layer / 2) ], this.scale * length, depth + 1);
                        } else if (count == 1) {
                            this.drawFractal([ one[0] + (this.scale * length * row), one[1] - (this.scale * length * col), one[2] + (this.scale * length * layer) ], this.scale2 * length, depth + 2);
                        }
                    }
                }
            }
        } else {
            let two = [ one[0] + length, one[1], one[2] ];
            let three = [ one[0], one[1] - length, one[2] ];
            let four = [ one[0] + length, one[1] - length, one[2] ];
            let five = [ one[0], one[1], one[2] + length ];
            let six = [ one[0] + length, one[1], one[2] + length ];
            let seven = [ one[0], one[1] - length, one[2] + length ];
            let eight = [ one[0] + length, one[1] - length, one[2] + length ];

            this.addShape(one,two,three,four,this.properties.colors[0]);
            this.addShape(six,five,eight,seven,this.properties.colors[1]);
            this.addShape(five,six,one,two,this.properties.colors[2]);
            this.addShape(eight,seven,four,three,this.properties.colors[3]);
            this.addShape(two,six,four,eight,this.properties.colors[4]);
            this.addShape(five,one,seven,three,this.properties[5]);
        }

    }

    // will add one square face
    addShape(a,b,c,d,color) {
        this.addFace(a,b,c,color);
        this.addFace(d,c,b,color);
    }
}