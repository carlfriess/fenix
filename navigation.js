const Controller = require('node-pid-controller');
//const sleep = require('sleep');

var io;

// throttle 0.7 = 0
var throttle = 0;

// roll, pitch, yaw 0.5 = 0
var roll = 0;
var pitch = 0;
var yaw = 0;

var distBottom = 0;
var distFront = 0;
var distBack = 0;
var distRight = 0;
var distLeft = 0;

// TODO: get regularly all parameters

// hover Throttle
var hoverThrottle = 0.7;
var maxHeight = 200;
var targetHeight = 125;

// Hover PID Controller
var ctrHover;

// START 0, STOP 1
var idle = 1;


function init(config, ioInst) {

    io = ioInst;

    ctrHover = new Controller({
        k_p: 0.5,
        k_i: 0,
        k_d: 0
    });

    ctrHover.setTarget(targetHeight);

}

let isStarting = true;
function slowStart(){
    if (!isStarting) return;

    throttle += 0.01;
    console.log("Throttle:", throttle);
    io.flightcontrol.throttle(throttle);

    distBottom = io.ultrasonic.bottom;

    if (distBottom > 10) {
        isStarting = false;
    }

}

function hoverPID(){
    if (isStarting) return;
    distBottom = io.ultrasonic.bottom;
    console.log(distBottom);
    let correction  = ctrHover.update(distBottom);
    throttleAdjuster(correction);

    /*while (true) {
        distBottom = getDistanceBottom();
        let correction  = ctrHover.update(distBottom);
        throttleAdjuster(correction);

        oldDistFront = distFront;
        distFront = getDistanceFront();

        oldDistRight = distRight;
        distRight = getDistanceRight();

        oldDistLeft = distLeft;
        distLeft = getDistanceLeft();

        if (oldDistFront - distFront > 10 || distBack - oldDistBack > 10) {
            // Drift Richtung Front
            // Pitch 0.5-1 Maximum Nose Up
            setPitch(0.52);

        }else if (distFront - oldDistFront > 10 || oldDistBack - distBack > 10) {
            // Drift Richtung Back
            // Pitch 0-0.5 Maximum Nose Down
            setPitch(0.48);
        }

        if (oldDistLeft - distLeft > 10 || distRight - oldDistRight > 10) {
            // Drift Richtung Left
            // Yaw 0.5-1 Maximum Nose Right Rotation
            setYaw(0.52);

        }else if (distLeft - oldDistLeft > 10 || oldDistRight - distRight > 10) {
            // Drift Richtung Right
            // Yaw 0-0.5 Maximum Nose Left Rotation
            setYaw(0.48);
        }
    }*/
}

// Adjust Throttle
function throttleAdjuster(correction) {
    var throttle;
    if (correction > 0) {
        throttle = hoverThrottle + correction / (targetHeight) * (1 - hoverThrottle);
    } else {
        throttle = hoverThrottle + correction / (maxHeight - targetHeight) * hoverThrottle;
    }
    throttle = Math.max(throttle, 0);
    throttle = Math.min(throttle, 1);
    console.log("Throttle:", throttle);
    io.flightcontrol.throttle(throttle);
}

// Check in Idle in an Interval if signals START (Green) or NOT (Red)
function main() {

    /*
        GREEN -> Start from Idle + Register Distance to Wall (DIST) + 1m hoch steigen
    */
    while(idle){

        take_picture();
        if (analyse_picture == GREEN) {
            idle = 0;
        } else{
            //sleep.msleep(100);
        }
    }

    var distFront = getDistanceFront();

    ctrHover.setTarget(targetHeight);

    setThrottle(0.1);
    hoverPID();
}


module.exports = {
    "init": init,
    "hoverPID": hoverPID,
    "slowStart": slowStart
}
