import Fractal from '../fractal.js';

export default class SierpinskiDodecahedron extends Fractal {
    constructor(scene, options = {}, properties = {}) {
        super(scene, options, properties);
        this.gold = (1 + Math.sqrt(5))/2; // golden ratio
        this.splitValue = 1/(1 + this.gold);
    }

    generate() {
        let vertices = [
        [this.gold,0,1/this.gold],      //a 1
        [-this.gold,0,1/this.gold],     //b 2
        [-this.gold,0,-1/this.gold],    //c 3
        [this.gold,0,-1/this.gold],     //d 4
        [1/this.gold, this.gold, 0],    //e 5
        [1/this.gold, -this.gold, 0],   //f 6
        [-1/this.gold, -this.gold, 0],  //g 7
        [-1/this.gold, this.gold, 0],   //h 8
        [0, 1/this.gold, this.gold],    //i 9
        [0, 1/this.gold, -this.gold],   //j 10
        [0, -1/this.gold, -this.gold],  //k 11
        [0, -1/this.gold, this.gold],   //l 12
        [1, 1, 1],                      //m 13
        [1, -1, 1],                     //n 14
        [-1, -1, 1],                    //o 15
        [-1, 1, 1],                     //p 16
        [-1, 1, -1],                    //q 17
        [1, 1, -1],                     //r 18
        [1, -1, -1],                    //s 19
        [-1, -1, -1]                    //t 20
        ];
        this.drawFractal(vertices, 0);
    }
    drawFractal(vertices, depth) {

        if (depth < this.properties.maxDepth) {
            for (let i = 0; i < 20; i++) {
                // each new shape is defined by one of the vertices, and "midpoints" from that vertex to the rest of the vertices
                const newVertices = vertices.map((vertex) => {
                    return this.split(vertices[i],vertex,this.splitValue);
                });
                this.drawFractal(newVertices, depth + 1);
            }
        } else {
            this.addShape(vertices[11],vertices[8],vertices[12],vertices[0],vertices[13],this.properties.colors[0]);
            this.addShape(vertices[2],vertices[19],vertices[10],vertices[9],vertices[16],this.properties.colors[0]);
            this.addShape(vertices[12],vertices[4],vertices[17],vertices[3],vertices[0],this.properties.colors[1]);
            this.addShape(vertices[1],vertices[14],vertices[6],vertices[19],vertices[2],this.properties.colors[1]);
            this.addShape(vertices[8],vertices[15],vertices[7],vertices[4],vertices[12],this.properties.colors[2]);
            this.addShape(vertices[19],vertices[6],vertices[5],vertices[18],vertices[10],this.properties.colors[2]);
            this.addShape(vertices[8],vertices[11],vertices[14],vertices[1],vertices[15],this.properties.colors[3]);
            this.addShape(vertices[10],vertices[18],vertices[3],vertices[17],vertices[9],this.properties.colors[3]);
            this.addShape(vertices[15],vertices[1],vertices[2],vertices[16],vertices[7],this.properties.colors[4]);
            this.addShape(vertices[13],vertices[0],vertices[3],vertices[18],vertices[5],this.properties.colors[4]);
            this.addShape(vertices[4],vertices[7],vertices[16],vertices[9],vertices[17],this.properties.colors[5]);
            this.addShape(vertices[11],vertices[13],vertices[5],vertices[6],vertices[14],this.properties.colors[5]);
        }
    }

    addShape(a,b,c,d,e,color) {
        this.addFace(a,b,c,color);
        this.addFace(a,c,d,color);
        this.addFace(a,d,e,color);
    }

}