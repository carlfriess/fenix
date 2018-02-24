let io = require('./io.js');
let network = require('./network.js');

let config = require('./config.json');


// Initialization
io.init(config);
network.initializeNetwork(config);

setInterval(() => {

    var cm = io.readUltrasonic(config.pins.us.front);
    if (cm) {
        network.sendUltrasonicData(cm,0,0,0,0);
    }

}, 60);

function takePic() {
    io.camera.snap().then(() => {
        console.log("Image captured!");
        network.sendImageData();
        takePic();
    }).catch(() => {
        console.log("FAILURE: Image capture");
    });
}
takePic();