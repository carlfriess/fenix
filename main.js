let io = require('./io.js');
let network = require('./network.js');
let navigation = require('./navigation.js');

let config = require('./config.json');


// Initialization
io.init(config);
io.flightcontrol.throttle(0);
io.flightcontrol.yaw(0.5);
io.flightcontrol.pitch(0.5);
io.flightcontrol.roll(0.5);
io.flightcontrol.arm(0);
network.initializeNetwork(config, io);
navigation.init(config, io);


var tstart = 0;
var tend = 0;

setTimeout(function() {
    console.log("\n\n\n***** ARMING *****\n\n");
    io.flightcontrol.arm(1);
    setTimeout(function() {
        setInterval(function control() {

            tstart = (new Date()).getTime();

            // Send telemetry data
            network.sendUltrasonicData(io.ultrasonic.front, io.ultrasonic.right, io.ultrasonic.back, io.ultrasonic.left, io.ultrasonic.bottom);

            // Control
            navigation.hoverPID();

            // Log loop duration
            console.log("Loop duration: ", (new Date()).getTime() - tstart, "ms after ", tstart - tend, "ms");
            tend = (new Date()).getTime();

        }, 60);
    }, 10000);
}, 3000);

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