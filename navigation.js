const Controller = require('node-pid-controller');
const sleep = require('sleep');

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
var ctrHover = new Controller({
  k_p: 0.5,
  k_i: 0,
  k_d: 0
});

// STOP 0, START 1
var start = 0;

function findHeight(){

    while (true) {
        let distBottom = getDistanceBottom();
        let correction  = ctrHover.update(distBottom);

        thrustAdjuster(correction);
    }
}

function thrustAdjuster(correction) {
    throttle = hoverThrottle + correction / targetHeight * ((correction > 0) ? hoverThrottle : 1 - hoverThrottle );
}

// Check in Idle in an Interval if signals START (Green) or NOT (Red)
function main() {

    /*
        GREEN -> Start from Idle + Register Distance to Wall (DIST) + 2m hoch steigen
    */
    while(!start){

        take_picture();
        if (analyse_picture == 2) {
            start = 1;
        } else{
            sleep.msleep(100);
        }

    }

    var distFront = getDistanceFront();

    ctrHover.setTarget(targetHeight);

    setThrottle(0.1);
    findHeight();

}
