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
var targetHeight = 1.25;

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

function hoverPID(){

    distBottom = io.ultrasonic.bottom;
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
    io.flightcontrol.throttle(hoverThrottle + correction / targetHeight * ((correction > 0) ? hoverThrottle : 1 - hoverThrottle ));
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
    "hoverPID": hoverPID
}