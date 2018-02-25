let Vibrant = require('node-vibrant');
let io = require('./io.js');
let network = require('./network.js');
let navigation = require('./navigation.js');

let config = require('./config.json');

let GREEN = 1;
let RED = 2;

var states = {
    WAITING: 0,
    CENTER_ROOM: 1,
    MOVE_ROOM_2: 2,
    CAPTURE: 3,
    ROTATE: 4,
    MOVE_ROOM_1: 5,
    LAND: 6
};
var current_state = states.WAITING;


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

var saw_green = false;
var capture_in_progress = false;
var saw_red = false;
var current_gen = 2;

function wait_for_green() {
    capture(true).then(color => {
        if (color == GREEN) {
            saw_green = true;
        }
        else {
            wait_for_green();
        }
    }).catch(console.error);
}

setTimeout(function () {
    console.log("\n\n\n***** ARMING *****\n\n");
    io.flightcontrol.arm(1);
    wait_for_green();
    setInterval(function control() {

        tstart = (new Date()).getTime();

        // Send telemetry data
        network.sendUltrasonicData(io.ultrasonic.front, io.ultrasonic.right, io.ultrasonic.back, io.ultrasonic.left, io.ultrasonic.bottom);

        switch (current_state) {

            case states.WAITING:
                if (saw_green) {
                    console.log("!!! SAW GREEN !!!");
                    current_state = states.CENTER_ROOM;
                }
                break;

            case states.CENTER_ROOM:
                if (false) {
                    console.log("\n\n\n!!! Moving into Room 2 !!!\n\n");
                    current_state = states.MOVE_ROOM_2;
                }
                // Control
                navigation.slowStart();
                navigation.hoverPID();
                navigation.centerTent1();
                break;

            case states.MOVE_ROOM_2:
                if (true) {
                    console.log("\n\n\n!!! Capturing Generator !!!\n\n");
                    current_state = states.CAPTURE;
                }
                break;

            case states.CAPTURE:
                if (!capture_in_progress) {
                    capture_in_progress = true;
                    capture(true).then(color => {
                        if (color == RED) {
                            saw_red = true;
                            network.sendGeneratorData(current_gen);
                        }
                        capture_in_progress = false;
                        current_gen--;
                        console.log("\n\n\n!!! Rotating !!!\n\n");
                        current_state = states.ROTATE;
                    }).catch(console.error);
                }

                break;

            case states.ROTATE:
                if (true && (saw_red || current_gen < 0)) {
                    console.log("\n\n\n!!! Moving into Room 1 !!!\n\n");
                    current_state = states.MOVE_ROOM_1;
                }
                else if (true && !saw_red) {
                    console.log("\n\n\n!!! Capturing Generator !!!\n\n");
                    current_state = states.CAPTURE;
                }
                break;

            case states.MOVE_ROOM_1:
                if (true) {
                    console.log("\n\n\n!!! Landing !!!\n\n");
                    current_state = states.LAND;
                }

            case states.LAND:
                if (io.ultrasonic.bottom < 6) {
                    console.log("\n\n\nBye Bye :D :*\n\n");
                    io.flightcontrol.throttle(0);
                    io.flightcontrol.arm(0);
                    current_state = 100;
                    //process.abort();
                }

        }

        // Log loop duration
        var stateName = "UNKNOWN";
        for(var name in states) {
            if (current_state == states[name]) {
                stateName = name;
            }
        }
        console.log("Loop duration: ", (new Date()).getTime() - tstart, "ms after ", tstart - tend, "ms", "[", stateName, "]");
        tend = (new Date()).getTime();

    }, 60);
}, 5000);

async function capture(relay) {
    try {
        await io.camera.snap();
        let palette = await Vibrant.from(`${__dirname}/pic.jpg`).getPalette();

        if (palette.Vibrant == null) {
            console.log("? IMAGE");
            return -1;
        }

        let red = palette.Vibrant.r;
        let green = palette.Vibrant.g;

        if (green > red * 1.25 && green > 128) {
            console.log('GREEN IMAGE!');
            return GREEN;
        } else if (red > green * 1.25 && red > 128) {
            console.log('RED IMAGE!');
            if (relay) network.sendImageData();
            return RED;
        } else {
            console.log('? IMAGE!');
            return -1;
        }
    } catch (e) {
        console.log("Image Capture Error: " + e);
    }
}


// function takePic() {
//     io.camera.snap().then(() => {
//         console.log("Image captured!");
//         network.sendImageData();
//         takePic();
//     }).catch((err) => {
//         console.log("FAILURE: Image capture", err);
//         setTimeout(takePic, 100);
//     });
// }

// takePic();
