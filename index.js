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
    for (const name of names) {
        let el = document.getElementById(`${name}`);
        let val = state.results[name].toLocaleString(
            undefined,
            { minimumFractionDigits: 2 }
        );
        el.innerText = `${name}=${val}`;
    }
}

function rotate(cx, cy, x, y, angle) {
    var radians = (Math.PI / 180) * angle,
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
        ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
    return { x: nx, y: ny };
}

function genInternal({ x, y, rotateAngle = 0, startIndex }) {
    let coordinates = [
        [1, 1],
        [3, 1],
        [2, 2],
        [2, 3],
        [1, 4],
        [3, 4],
    ];
    let maxX = 3;
    let maxY = 4;
    let nodes = [];
    for (coor of coordinates) {
        let pos = {
            x: x + coor[0] * config.intternalScale,
            y: y + coor[1] * config.intternalScale,
        };
        let rotatedPos = rotate(x + maxX / 2 * config.intternalScale, y + maxY / 2 * config.intternalScale, pos.x, pos.y, rotateAngle);
        let node = {
            x: rotatedPos.x,
            y: rotatedPos.y,
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
    let N = n / K;
    let matrix = new Array(n);
    for (let i = 0; i < n; i++) {
        matrix[i] = new Array(n).fill(0);
    }
    for (let index = 0; index < N; index++) {
        let cIndex = index * K;
        let sumbmatrix = [
            [0, 0, 1, 0, 0, 0],
            [0, 0, 1, 0, 0, 0],
            [1, 1, 0, 1, 0, 0],
            [0, 0, 1, 0, 1, 1],
            [0, 0, 0, 1, 0, 0],
            [0, 0, 0, 1, 0, 0],
        ];
        for (let row = 0; row < K; row++) {
            for (let col = 0; col < K; col++) {
                if (cIndex + row >= n || cIndex + col >= n) continue;
                matrix[cIndex + row][cIndex + col] = sumbmatrix[row][col];
            }
        }
    }

    let externalMatrix = [
        [0, 0, 0, 0, 1, 0],
        [0, 0, 0, 0, 0, 1],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
    ];
    let externalMatrix2 = [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
    ];
    for (let i = 0; i < N; i++) {
        let cIndex = i * K;
        let cIndexNext = ((i + 1) % N) * K;
        let cIndexNext1 = ((i + Math.floor(N / 3)) % N) * K;
        if (N == 1) break;
        for (let row = 0; row < K; row++) {
            for (let col = 0; col < K; col++) {
                if (cIndex + row < n && cIndexNext + col < n) {
                    matrix[cIndex + row][cIndexNext + col] = Math.max(
                        matrix[cIndex + row][cIndexNext + col],
                        externalMatrix[row][col],
                    );
                    matrix[cIndexNext + col][cIndex + row] = Math.max(
                        matrix[cIndexNext + col][cIndex + row],
                        externalMatrix[row][col],
                    );
                }
                if (cIndex + row < n && cIndexNext1 + col < n) {
                    matrix[cIndex + row][cIndexNext1 + col] = Math.max(
                        matrix[cIndex + row][cIndexNext1 + col],
                        externalMatrix2[row][col],
                    );
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
    let scale = config.externalScale;
    let offset = config.offset;
    let nodes = [];
    let center = config.center;
    for (let i = 0; i < config.N; i++) {
        let pos = { x: center.x, y: 0 };
        let nextPos = rotate(center.x, center.y, pos.x, pos.y, 360 / config.N * i);
        let internalNodes = genInternal({
            x: nextPos.x * scale + offset.x,
            y: nextPos.y * scale + offset.y,
            startIndex: nodes.length + 1,
            rotateAngle: 360 / config.N * i + 90,
        });
        nodes = [...nodes, ...internalNodes];
    }


    let characteristics = getTopologicalCharacteristics(matrix);

    // set new state
    state = {
        ...state,
        nodes,
        matrix,
        results: characteristics
    }
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
    console.dir(dMatrix);

    for (let i = 0; i < N; i++) {
        for (let k = 0; k < N; k++) {
            for (let j = 0; j < N; j++) {
                if (dMatrix[k][j] > dMatrix[k][i] + dMatrix[i][j]) {
                    dMatrix[k][j] = dMatrix[k][i] + dMatrix[i][j];
                    dMatrix[j][k] = dMatrix[k][j];
                }
            }
        }
    }
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