const config = {
    intternalScale: 20,
    nodeRadius: 10,
    externalScale: 200,
    offset: { x: 20, y: 20 },
    N: 25,
}

function setN(N) {
    console.log("updated");
    config.N = N;

    dispatchEvent(configUpdateEvent);
}