let io = require('./io.js');
let network = require('./network.js');
let navigation = require('./navigation.js');

let config = require('./config.json');


// Initialization
io.init(config);
network.initializeNetwork(config, io);
navigation.init(config, io);


var tstart = 0;
var tend = 0;

setTimeout(function() {
    io.flightcontrol.arm(1);
    setInterval(function control() {

        tstart = (new Date()).getTime();

        // Send telemetry data
        network.sendUltrasonicData(io.ultrasonic.front,io.ultrasonic.right,io.ultrasonic.back,io.ultrasonic.left,io.ultrasonic.bottom);

        // Control
        navigation.hoverPID();

        // Log loop duration
        console.log("Loop duration: ", (new Date()).getTime() - tstart, "ms after ", tstart - tend, "ms");
        tend = (new Date()).getTime();

    }, 60);
}, 1000);

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