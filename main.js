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



var tstart = 0;
var tend = 0;

var saw_green = false;
var capture_in_progress = false;
var saw_red = false;
var current_gen = 2;
var rotated = false;

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
    navigation.init(config, io);
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

                // Control
                navigation.slowStart();
                navigation.hoverPID();
                let isCT1 = navigation.centerTent1();

                /*if (isCT1) {
                    console.log("\n\n\n!!! Moving into Room 2 !!!\n\n");
                    current_state = states.MOVE_ROOM_2;
                }*/
                break;

            case states.MOVE_ROOM_2:
                let isCT2 = navigation.centerTent2;
                if (isCT2) {
                    console.log("\n\n\n!!! Capturing Generator !!!\n\n");
                    current_state = states.CAPTURE;
                }
                break;

            case states.CAPTURE:
                // Take a picture of the current engine in front of us...
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

                navigation.hoverPID();

                break;

            case states.ROTATE:
                //      Tent1
                //
                // 2 (1)     0 (-1)
                //      1 (0)

                /*if (current_gen < 0) {
                    console.log("\n\n\n!!! Moving into Room 1 !!!\n\n");
                    current_state = states.MOVE_ROOM_1;
                } else if (!rotated) {

                    // Control: ...and rotate to the next generator
                    rotated = !navigation.rotate90(current_gen);

                } else if (rotated) {
                    // Control: Done with rotating, continue with capturing
                    rotated = false;
                    console.log("\n\n\n!!! Capturing Generator !!!\n\n");
                    current_state = states.CAPTURE;
                }*/

                navigation.hoverPID();

                if (!rotated && current_gen >= 0) {
                    rotated = true;
                    io.flightcontrol.roll(0.45);
                    setTimeout(function () {
                        current_state = states.CAPTURE;
                        rotated = false;
                        io.flightcontrol.roll(0.5);
                    }, 5000);
                }

                break;

            case states.MOVE_ROOM_1:
                // TODO DO SHIT
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
