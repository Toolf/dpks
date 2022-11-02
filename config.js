const config = {
    intternalScale: 30,
    nodeRadius: 8,
    externalScale: 3,
    offset: { x: 100, y: 100 },
    center: { x: 100, y: 100 },
    N: 3,
}

function setN(N) {
    console.log("updated");
    config.N = N;

    dispatchEvent(configUpdateEvent);
}