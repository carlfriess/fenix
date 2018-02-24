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

// hover Throttle
var hoverThrottle = 0.6;
var maxHeight = 150;
var targetHeight = 30;

var defaultPitch = 0.5;
var maxPitch = 0.52;
var minPitch = 0.48;

var defaultYaw = 0.5;
var maxYaw = 0.52;
var minYaw = 0.48;

// Hover PID Controller
var ctrHover;
// FrontCenterTent1 PID Controller
var ctrFrontCT1;
// BackCenterTent1 PID Controller
var ctrBackCT1;
// LeftCenterTent1 PID Controller
var ctrLeftCT1;
// RightCenterTent1 PID Controller
var ctrRightCT1;

// START 0, STOP 1
var idle = 1;

var tent1Length;
var tent1Width;
var tent1;
var tent2Center;


function init(config, ioInst) {

    io = ioInst;

    distFront = io.ultrasonic.front;
    distBack = io.ultrasonic.back;
    distLeft = io.ultrasonic.left;
    distRight = io.ultrasonic.right;

    tent1Length = Math.abs(distFront + distBack);
    tent1Width = Math.abs(distLeft + distRight);

    // get the right length of the tent1 (in case we are sitting infront of the door)
    tent1 = Math.min(tent1Length, tent1Width);

    ctrHover = new Controller({
        k_p: 0.5,
        k_i: 0,
        k_d: 0
    });

    ctrFrontCT1 = new Controller({
        k_p: 0.5,
        k_i: 0,
        k_d: 0
    });

    /*
    ctrBackCT1 = new Controller({
        k_p: 0.5,
        k_i: 0,
        k_d: 0
    });

    ctrLeftCT1 = new Controller({
        k_p: 0.5,
        k_i: 0,
        k_d: 0
    });
    */

    ctrRightCT1 = new Controller({
        k_p: 0.5,
        k_i: 0,
        k_d: 0
    });

    ctrHover.setTarget(targetHeight);

    ctrFrontCT1.setTarget(tent1/2);
    // ctrBackCT1.setTarget(tent1/2);
    // ctrLeftCT1.setTarget(tent1/2);
    ctrRightCT1.setTarget(tent1/2);

    ctrRightCT2 = new Controller({
        k_p: 0.5,
        k_i: 0,
        k_d: 0
    });

    tent2Center = tent1+tent1/2;

    ctrRightCT2.setTarget(tent2Center);
}

let isStarting = true;

function slowStart() {
    if (!isStarting) return;

    throttle += 0.01;
    console.log("Throttle:", throttle);
    io.flightcontrol.throttle(throttle);

    distBottom = io.ultrasonic.bottom;

    if (distBottom > 10) {
        isStarting = false;
    }
}

function hoverPID() {
    if (isStarting) return;

    distBottom = io.ultrasonic.bottom;
    console.log(distBottom);
    let correction = ctrHover.update(distBottom);
    throttleAdjuster(correction);
}

// center Tent1
let isCenterT1 = false;
function centerTent1() {
    if (isStarting) return;
    if (isCenterT1) return;

    distFront = io.ultrasonic.front;
    console.log("Distance Front:", distFront);
    let correction = ctrFrontCT1.update(distFront);
    // Correction if positive then close to wall

        // Pitch 0.5-1 Maximum Nose Up
        // the bigger the correction the higher the pitch (higher closer to wall)
    pitch = 0.5 + correction/(tent1/2)*(maxPitch - 0.5);
    pitch = Math.max(pitch, minPitch);
    pitch = Math.min(pitch, maxPitch);
    console.log("Pitch:", pitch);
    io.flightcontrol.pitch(pitch);


    /* Ist das überhaupt nötig
    distBack = io.ultrasonic.back;
    console.log("Distance Back:", distBack);
    let correction = ctrBackCT1.update(distFront);
    if (correction > 0) {

    }else if (correction < 0) {

    }

    distLeft = io.ultrasonic.left;
    console.log("Distance Left:", distLeft);
    let correction = ctrLeftCT1.update(distFront);
    */

    // Yaw 0-0.5 Maximum Nose Left Rotation
    // Yaw 0.5-1 Maximum Nose Right Rotation
    distRight = io.ultrasonic.right;
    console.log("Distance Right:", distRight);
    correction = ctrRightCT1.update(distRight);

    // Yaw 0-0.5 Maximum Nose Left Rotation
    // Yaw 0.5-1 Maximum Nose Right Rotation

    yaw = 0.5 - correction/(tent1/2)*(maxYaw - 0.5);
    yaw = Math.max(yaw, minYaw);
    yaw = Math.min(yaw, maxYaw);
    console.log("yaw:", yaw);
    io.flightcontrol.yaw(yaw);

    if (Math.abs(distFront - tent1/2) < 20 && Math.abs(distRight - tent1/2) < 20 ) {
        isCenterT1 = true;
        pitch = 0.5;
        io.flightcontrol.pitch(pitch);
        yaw = 0.5;
        io.flightcontrol.yaw(yaw);
    }
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

/* Adjust to Drift
function driftAdjuster(){

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

let isCenterT2 = false;
function centerTent2() {
    if (isStarting) return;
    if (!isCenterT1) return;
    if (isCenterT2) return;

    distRight = io.ultrasonic.right;
    console.log("Distance Right:", distRight);
    let correction = ctrRightCT2.update(distRight);
    // TODO: Copy turn to left from above

    // TODO: Mindestabstand von Front und Back auf 20cm machen, damit man durch die Tür kommt

    //if () {
    //    isCenterT1 = true;
    //}
}

let engineDecided = false;
function engineDecider(){
    if (isStarting) return;
    if (!isCenterT1) return;
    if (!isCenterT2) return;
    if (engineDecided) return;

    // TODO: Take Picture
    // TODO: Turn 90 degress to left + stabalize
    // TODO: Take Picture
    // TODO: Turn 90 degress to left + stabalize
    // TODO: Take Picture
    // TODO: Turn 90 degress to left + stabalize

    engineDecided = true;
}

let landed = false;
function takeMeHome() {
    if (isStarting) return;
    if (!isCenterT1) return;
    if (!isCenterT2) return;
    if (!engineDecided) return;
    if (landed) return;

    // TODO: FIRST fly until distFront == 40
    // TODO: SECOND (sequential order) fly until distRight == 40
    // TODO: set targetHeight to 0

    landed = true;
}


// Check in Idle in an Interval if signals START (Green) or NOT (Red)
function main() {

    /*
        GREEN -> Start from Idle + Register Distance to Wall (DIST) + 1m hoch steigen
    */
    while (idle) {

        take_picture();
        if (analyse_picture == GREEN) {
            idle = 0;
        } else {
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
    "slowStart": slowStart,
    "centerTent1": centerTent1
}
