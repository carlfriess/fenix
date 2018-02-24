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

setInterval(function control() {

    tstart = (new Date()).getTime();

    // Send telemetry data
    network.sendUltrasonicData(io.ultrasonic.front,io.ultrasonic.right,io.ultrasonic.back,io.ultrasonic.left,io.ultrasonic.bottom);

    // Control....

    // Log loop duration
    console.log("Loop duration: ", (new Date()).getTime() - tstart, "ms after ", tstart - tend, "ms");
    tend = (new Date()).getTime();

}, 60);

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