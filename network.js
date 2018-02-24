let net = require('net');
let fs = require('fs');

let socket;
let config;

function initializeNetwork(conf) {
    config = conf;
    socket = net.createConnection({
        port: config.network.protocol_port,
        host: config.network.ip_address
    });

    socket.on('close', () => {
        console.log("Socket Closed!");
        initializeNetwork(conf);
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
    fs.readFile(`${__dirname}/pic.jpg`, (err, data) => {
        let buffer = Buffer.alloc(5);
        buffer.writeUInt8(config.network.protocol.image, 0);
        buffer.writeUInt32LE(data.length, 1);
        console.log("Sending ", data.length, " bytes!");
        socket.write(Buffer.concat([buffer, data]));
    });
}

module.exports = {
    initializeNetwork: initializeNetwork,
    sendGeneratorData: sendGeneratorData,
    sendUltrasonicData: sendUltrasonicData,
    sendImageData: sendImageData
};