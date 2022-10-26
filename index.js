const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');

let state = {
    nodes: null,
    matrix: null,
    canvas: {
        scale: 1.0,
    },
    results: {
        D: 0,
        S: 0,
        Ds: 0,
        C: 0,
        T: 0,
    }
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.onresize = resize;
resize();


function drawNode(node) {
    context.beginPath();
    context.fillStyle = node.fillStyle;
    context.arc(node.x, node.y, node.radius, 0, Math.PI * 2, true);
    context.strokeStyle = node.strokeStyle;
    context.stroke();
    context.fill();
    context.fillStyle = node.textStyle;
    let w = context.measureText(node.text).width;
    context.fillText(node.text, node.x - (w / 2), node.y + 3);

}

function drawEdge({ from, to }) {
    let fromNode = from;
    let toNode = to;
    context.beginPath();
    context.strokeStyle = fromNode.strokeStyle;
    context.moveTo(fromNode.x, fromNode.y);
    context.lineTo(toNode.x, toNode.y);
    context.stroke();
}

function redraw() {
    // clear canvas
    console.log(canvas.width);
    context.clearRect(0, 0, 10000, 10000);

    let { nodes, matrix } = state;
    // draw edges
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            if (matrix[i][j] == 1) {
                drawEdge({ from: nodes[i], to: nodes[j] });
            }
        }
    }

    // draw nodes
    for (let node of nodes) {
        drawNode(node);
    }
}

function updateCaracteristics() {
    let names = ["D", "S", "Ds", "C", "T"];
    console.dir(state);
    for (const name of names) {
        let el = document.getElementById(`${name}`);
        let val = state.results[name].toLocaleString(
            undefined,
            { minimumFractionDigits: 2 }
        );
        el.innerText = `${name}=${val}`;
    }
}


function genInternal({ x, y, startIndex }) {
    let coordinates = [
        [3.5, 2.5],
        [4.5, 4.5],
        [2.5, 4.5],
        [3.5, 0.5],
        [6.5, 6.5],
        [0.5, 6.5],
    ];
    let nodes = [];
    for (coor of coordinates) {
        let node = {
            x: x + coor[0] * config.intternalScale,
            y: y + coor[1] * config.intternalScale,
            radius: config.nodeRadius,
            fillStyle: '#22cccc',
            strokeStyle: '#009999',
            textStyle: '#000',
            text: `${startIndex + nodes.length} `,
        };
        nodes.push(node);
    }
    return nodes;
}

function genMatrix(n) {
    let K = 6;
    let C = 6;
    let N = Math.ceil(n / K);
    let L = Math.ceil(Math.sqrt(N));
    let H = L * (L - 1) > N ? L - 1 : L;
    let matrix = new Array(n);
    for (let i = 0; i < n; i++) {
        matrix[i] = new Array(n).fill(0);
    }
    for (let index = 0; index < N; index++) {
        let cindex = index * K;
        let sumbmatrix = [
            [0, 1, 1, 1, 0, 0],
            [1, 0, 1, 0, 1, 0],
            [1, 1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1, 1],
            [0, 1, 0, 1, 0, 1],
            [0, 0, 1, 1, 1, 0],
        ];
        for (let row = 0; row < K; row++) {
            for (let col = 0; col < K; col++) {
                if (cindex + row >= n || cindex + col >= n) continue;
                matrix[cindex + row][cindex + col] = sumbmatrix[row][col];
            }
        }
    }
    for (let row = 0; row < L; row++) {
        for (let col = 0; col < H; col++) {
            if ((row * H + col) * K >= matrix.length) break;
            if (row == 0 && col == 0) continue;
            let externalMatrix = [
                [0, 0, 0, 0, 1, 0],
                [0, 0, 0, 0, 0, 1],
                [0, 0, 0, 1, 0, 0],
                [0, 0, 1, 0, 0, 0],
                [1, 0, 0, 0, 0, 0],
                [0, 1, 0, 0, 0, 0],
            ];
            let m1Index = (row * H + col) * K;
            let m2Index = (row * H + col - 1) * K;
            let m3Index = ((row - 1) * H + col) * K;
            if (col != 0) {
                for (let lrow = 0; lrow < K; lrow++) {
                    for (let lcol = 0; lcol < K; lcol++) {
                        if (n > m1Index + lrow && n > m2Index + lcol) {
                            matrix[m1Index + lrow][m2Index + lcol] = externalMatrix[lrow][lcol];
                            matrix[m2Index + lcol][m1Index + lrow] = externalMatrix[lrow][lcol];
                        }
                    }
                }
            }
            if (row != 0) {
                for (let lrow = 0; lrow < K; lrow++) {
                    for (let lcol = 0; lcol < K; lcol++) {
                        if (n > m1Index + lrow && n > m3Index + lcol) {
                            matrix[m1Index + lrow][m3Index + lcol] = externalMatrix[lrow][lcol];
                            matrix[m3Index + lcol][m1Index + lrow] = externalMatrix[lcol][lrow];
                        }
                    }
                }
            }
        }
    }
    return matrix;
}

function onInitOrUpdateConfig() {
    //update Matrix
    let matrix = genMatrix(config.N * 6);

    //update Nodes
    let l = Math.ceil(Math.sqrt(config.N));
    let c = l * (l - 1) > config.N ? l - 1 : l;
    let scale = config.externalScale;
    let offset = config.offset;
    let nodes = [];
    for (let i = 0; i < l; i++) {
        for (let j = 0; j < c; j++) {
            if (i * c + j >= config.N) break;
            let internalNodes = genInternal({
                x: i * scale + offset.x,
                y: j * scale + offset.y,
                startIndex: nodes.length + 1
            });
            nodes = [...nodes, ...internalNodes];
        }
    }

    let characteristics = getTopologicalCharacteristics(matrix);

    // set new state
    state = {
        ...state,
        nodes,
        matrix,
        results: characteristics
    }
    console.dir(matrix);
    // redraw
    redraw();
    // update characteristics
    updateCaracteristics();
}

function getTopologicalCharacteristics(matrix) {
    let dMatrix = [];
    let N = matrix.length;
    for (let i = 0; i < N; i++) {
        let arr = [];
        for (let j = 0; j < N; j++) {
            let el = matrix[i][j];
            arr.push(el != 0 ? el : i == j ? 0 : Infinity);
        }
        dMatrix.push(arr);
    }

    for (let i = 0; i < N; i++) {
        for (let k = 0; k < N; k++) {
            if (i == k) break;
            for (let j = 0; j < N; j++) {
                if (dMatrix[i][k] > dMatrix[i][j] + dMatrix[j][k]) {
                    dMatrix[i][k] = dMatrix[i][j] + dMatrix[j][k]
                    dMatrix[k][i] = dMatrix[i][k]
                }
            }
        }
    }
    console.dir(matrix);
    let D = Math.max(...dMatrix.map((a) => Math.max(...a)));
    let S = Math.max(...matrix.map((l) => l.reduce((a, b) => a + b, 0)));
    let Ds = dMatrix.map((l) => l.reduce((a, b) => a + b, 0)).reduce((a, b) => a + b, 0) / (N * (N - 1));
    let C = matrix.map((l) => l.reduce((a, b) => a + b, 0)).reduce((a, b) => a + b, 0) / 2;
    let T = 2 * Ds / S;

    return { D, S, Ds, C, T }
}

function initialize() {
    onInitOrUpdateConfig();
}


initialize();

// user controlls

addEventListener('wheel', ({ deltaY }) => {
    let oldScale = state.canvas.scale;
    let newState = {
        ...state,
        canvas: {
            ...state.canvas,
            scale: state.canvas.scale - deltaY / 1000,
        }
    }
    if (newState.canvas.scale < 0.1 || newState.canvas.scale > 100) return;

    state = newState;

    context.scale(state.canvas.scale / oldScale, state.canvas.scale / oldScale);
    redraw();
});

addEventListener('configUpdate', (e) => {
    console.log("update");
    onInitOrUpdateConfig();
});