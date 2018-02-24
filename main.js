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
var capture_finished = false;
var saw_red = false;
var current_gen = 0;

function wait_for_green() {
    capture(false).then(color => {
        if (color == GREEN) {
            saw_green = true;
        }
        else {
            wait_for_green();
        }
    });
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
                if (true) {
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
                if (capture_finished) {
                    capture_in_progress = false;
                    capture_finished = false;
                    current_gen++;
                    current_state = states.ROTATE;
                    console.log("\n\n\n!!! Rotating !!!\n\n");
                }
                else if (!capture_in_progress) {
                    capture_in_progress = true;
                    capture(true).then(color => {
                        if (color ==  RED) {
                            saw_red = true;
                            capture_finished = true;
                            network.sendGeneratorData(current_gen);
                        }
                    });
                }
                break;

            case states.ROTATE:
                if (true && saw_red) {
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
                    process.abort();
                }

        }

        // Log loop duration
        console.log("Loop duration: ", (new Date()).getTime() - tstart, "ms after ", tstart - tend, "ms");
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
