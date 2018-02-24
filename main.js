let io = require('./io.js');
let network = require('./network.js');

let config = require('./config.json');


// Initialization
io.init(config);
network.initializeNetwork(config);

var front = 0;
var back = 0;
var left = 0;
var right = 0;
var bottom = 0;

var tstart = 0;
var tend = 0;

function control() {

    tstart = (new Date()).getTime();

    // Read all sensors
    front = io.readUltrasonic(config.pins.us.front) || front;
    back = io.readUltrasonic(config.pins.us.back) || back;
    left = io.readUltrasonic(config.pins.us.left) || left;
    right = io.readUltrasonic(config.pins.us.right) || right;
    bottom = io.readUltrasonic(config.pins.us.bottom) || bottom;

    // Send telemetry data
    network.sendUltrasonicData(front,right,back,left,bottom);

    // Control....

    // Log loop duration
    console.log("Loop duration: ", (new Date()).getTime() - tstart, "ms after ", tstart - tend, "ms");
    tend = (new Date()).getTime();

    // Repeat the loop
    setTimeout(control, 60);

}
control();

function takePic() {
    io.camera.snap().then(() => {
        console.log("Image captured!");
        network.sendImageData();
        takePic();
    }).catch((err) => {
        console.log("FAILURE: Image capture", err);
        setTimeout(takePic, 100);
    });
}
takePic();