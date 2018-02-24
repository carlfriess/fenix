var Gpio = require('pigpio').Gpio;
var PiCamera = require('pi-camera');



var triggerFront, echoFront,
    triggerRight, echoRight,
    triggerBack, echoBack,
    triggerLeft, echoLeft,
    triggerBottom, echoBottom;

var yaw, pitch, roll, throttle, arm;

// The number of microseconds it takes sound to travel 1cm at 20 degrees celcius
var MICROSECDONDS_PER_CM = 1e6/34321;

function initEcho(gpio, name) {
    var startTick;

    gpio.on('alert', function (level, tick) {
        var endTick,
            diff;

        if (level == 1) {
            startTick = tick;
        } else {
            endTick = tick;
            diff = (endTick >> 0) - (startTick >> 0); // Unsigned 32 bit arithmetic
            module.exports.ultrasonic[name] = (diff / 2 / MICROSECDONDS_PER_CM);
            console.log(name, module.exports.ultrasonic[name].toFixed(0));
        }
    });
}

function init(config) {

    // DEBUG ONLY
    config = require('./config.json');

    triggerFront = new Gpio(config.pins.us.front.trigger, {mode: Gpio.OUTPUT});
    echoFront = new Gpio(config.pins.us.front.echo, {mode: Gpio.INPUT, alert: true});

    triggerRight = new Gpio(config.pins.us.right.trigger, {mode: Gpio.OUTPUT});
    echoRight = new Gpio(config.pins.us.right.echo, {mode: Gpio.INPUT, alert: true});

    triggerBack = new Gpio(config.pins.us.back.trigger, {mode: Gpio.OUTPUT});
    echoBack = new Gpio(config.pins.us.back.echo, {mode: Gpio.INPUT, alert: true});

    triggerLeft = new Gpio(config.pins.us.left.trigger, {mode: Gpio.OUTPUT});
    echoLeft = new Gpio(config.pins.us.left.echo, {mode: Gpio.INPUT, alert: true});

    triggerBottom = new Gpio(config.pins.us.bottom.trigger, {mode: Gpio.OUTPUT});
    echoBottom = new Gpio(config.pins.us.bottom.echo, {mode: Gpio.INPUT, alert: true});

    triggerFront.digitalWrite(0);
    triggerRight.digitalWrite(0);
    triggerBack.digitalWrite(0);
    triggerLeft.digitalWrite(0);
    triggerBottom.digitalWrite(0);

    initEcho(echoFront, "front");
    initEcho(echoRight, "right");
    initEcho(echoBack, "back");
    initEcho(echoLeft, "left");
    initEcho(echoBottom, "bottom");

    setInterval(function () {
        triggerFront.trigger(10, 1); // Set trigger high for 10 microseconds
        }, 60);
    setInterval(function () {
        triggerRight.trigger(10, 1); // Set trigger high for 10 microseconds
    }, 60);
    setInterval(function () {
        triggerBack.trigger(10, 1); // Set trigger high for 10 microseconds
    }, 60);
    setInterval(function () {
        triggerLeft.trigger(10, 1); // Set trigger high for 10 microseconds
    }, 60);
    setInterval(function () {
        triggerBottom.trigger(10, 1); // Set trigger high for 10 microseconds
    }, 60);

    yaw = new Gpio(config.pins.fc.yaw, {mode: Gpio.OUTPUT});
    pitch = new Gpio(config.pins.fc.pitch, {mode: Gpio.OUTPUT});
    roll = new Gpio(config.pins.fc.roll, {mode: Gpio.OUTPUT});
    throttle = new Gpio(config.pins.fc.throttle, {mode: Gpio.OUTPUT});
    arm = new Gpio(config.pins.fc.arm, {mode: Gpio.OUTPUT});

    module.exports.flightcontrol.yaw = writePWM(yaw);
    module.exports.flightcontrol.pitch = writePWM(pitch);
    module.exports.flightcontrol.roll = writePWM(roll);
    module.exports.flightcontrol.trottle = writePWM(throttle);
    module.exports.flightcontrol.arm = function (val) { arm.servoWrite(val * 2500); }

}

function writePWM(pin) {

    return function (val) {
        pin.servoWrite(val * 2000 + 500);
    }

}

module.exports = {
    "init": init,
    "ultrasonic": {
        "front": 0,
        "back": 0,
        "left": 0,
        "right": 0,
        "bottom":0
    },
    "flightcontrol": {},
    "camera": new PiCamera({
        mode: 'photo',
        output: `${ __dirname }/pic.jpg`,
        width: 160,
        height: 120,
        nopreview: true,
    })
};