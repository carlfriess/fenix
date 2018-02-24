let io = require('./io.js');
let network = require('./network.js');
let navigation = require('./navigation.js');

let config = require('./config.json');

var states = {
    WAITING: 0,
    CENTER_ROOM: 1,
    MOVE_ROOM_2: 2,
    CAPTURE: 3,
    ROTATE: 4,
    MOVE_ROOM_1: 5,
    LAND: 6
};
var current_state = WAITING;


// Initialization
io.init(config);
io.flightcontrol.arm(0);
io.flightcontrol.throttle(0);
io.flightcontrol.yaw(0.5);
io.flightcontrol.pitch(0.5);
io.flightcontrol.roll(0.5);
network.initializeNetwork(config, io);
navigation.init(config, io);


var tstart = 0;
var tend = 0;

setTimeout(function() {
    console.log("\n\n\n***** ARMING *****\n\n");
    io.flightcontrol.arm(1);
    setInterval(function control() {

        tstart = (new Date()).getTime();

        // Send telemetry data
        network.sendUltrasonicData(io.ultrasonic.front, io.ultrasonic.right, io.ultrasonic.back, io.ultrasonic.left, io.ultrasonic.bottom);

        // Control
        navigation.slowStart();
        navigation.hoverPID();

        switch (current_state) {

            case states.WAITING:
                if (GREEN) {
                    current_state = states.CENTER_ROOM;
                }
                break;

            case states.CENTER_ROOM:
                if (DONE) {
                    current_state = states.MOVE_ROOM_2;
                }
                break;

            case states.MOVE_ROOM_2:
                if (DONE) {
                    current_state = states.CAPTURE;
                }
                break;

            case states.CAPTURE:
                if (PICTURE_TAKEN) {
                    current_state = states.ROTATE;
                }
                break;

            case states.ROTATE:
                if (DONE_AND_FOUND) {
                    current_state = states.MOVE_ROOM_1;
                }
                else (DONE_AND_NOT_FOUND) {
                    current_state = states.CAPTURE;
                }
                break;

            case states.MOVE_ROOM_1:
                if (DONE) {
                    current_state = states.LAND;
                }

            case states.LAND:
                if (DONE) {
                    io.flightcontrol.throttle(0);
                    io.flightcontrol.arm(0);
                    process.abort();
                }

        }

        // Log loop duration
        console.log("Loop duration: ", (new Date()).getTime() - tstart, "ms after ", tstart - tend, "ms");
        tend = (new Date()).getTime();

    }, 60);
}, 5000);

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
