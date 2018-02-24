let net = require('net');
let fs = require('fs');
let config = require('./config.json');

let socket;
function initializeNetwork() {
    socket = net.createConnection({
        port: config.network.protocol_port,
        host: config.network.ip_address
    });
}

function sendGeneratorData(generatorID) {
    let buffer = Buffer.alloc(2);
    buffer.writeUInt8(config.network.protocol.generator, 0);
    socket.write(Buffer.from[generatorID]);
}

function sendUltrasonicData(forward, right, backward, left, down) {
    let buffer = Buffer.alloc(21);
    buffer.writeUInt8(config.network.protocol.ultrasonic, 0);
    buffer.writeFloatLE(forward, 1);
    buffer.writeFloatLE(right, 5);
    buffer.writeFloatLE(backward, 9);
    buffer.writeFloatLE(left, 13);
    buffer.writeFloatLE(down, 17);
    socket.write(buffer);
}

function sendImageData() {
    fs.readFile(`${__dirname}/pic.jpg`).then((err, data) => {
        let buffer = Buffer.alloc(data.length + 1);
        buffer.writeUInt8(config.network.protocol.image, 0);
        buffer.write(data, 1);
        socket.write(buffer);
    });
}

module.exports = {
    initializeNetwork: initializeNetwork,
    sendGeneratorData: sendGeneratorData,
    sendUltrasonicData: sendUltrasonicData,
    sendImageData: sendImageData
};