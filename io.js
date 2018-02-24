var rpio = require('rpio');
var microtime = require('microtime');
var PiCamera = require('pi-camera');


var pwmRange = 1024;


function init(config) {

    // DEBUG ONLY
    config = require('./config.json');


    rpio.open(config.pins.us.front.trigger, rpio.OUTPUT, rpio.LOW);
    rpio.open(config.pins.us.front.echo, rpio.INPUT);

    rpio.open(config.pins.us.back.trigger, rpio.OUTPUT, rpio.LOW);
    rpio.open(config.pins.us.back.echo, rpio.INPUT);

    rpio.open(config.pins.us.left.trigger, rpio.OUTPUT, rpio.LOW);
    rpio.open(config.pins.us.left.echo, rpio.INPUT);

    rpio.open(config.pins.us.right.trigger, rpio.OUTPUT, rpio.LOW);
    rpio.open(config.pins.us.right.echo, rpio.INPUT);

    rpio.open(config.pins.us.bottom.trigger, rpio.OUTPUT, rpio.LOW);
    rpio.open(config.pins.us.bottom.echo, rpio.INPUT);


    /*rpio.open(config.pins.fc.throttle, rpio.PWM);
    rpio.open(config.pins.fc.roll, rpio.PWM);
    rpio.open(config.pins.fc.pitch, rpio.PWM);
    rpio.open(config.pins.fc.yaw, rpio.PWM);

    rpio.pwmSetClockDivider(clockdiv);

    rpio.pwmSetRange(config.pins.fc.throttle, pwmRange);
    rpio.pwmSetRange(config.pins.fc.roll, pwmRange);
    rpio.pwmSetRange(config.pins.fc.pitch, pwmRange);
    rpio.pwmSetRange(config.pins.fc.yaw, pwmRange);*/


}

function readUltrasonic(pins) {

    // Hold the trigger pin high for at least 10 us
    rpio.write(pins.trigger, rpio.HIGH);
    var ttrig = microtime.now();
    while (microtime.now() - ttrig <= 10) ;
    rpio.write(pins.trigger, rpio.LOW);

    // Wait for pulse on echo pin
    while (!rpio.read(pins.echo)) {
        if (microtime.now() - ttrig >= 5000) {
            return null;
        }
    }

    // Measure how long the echo pin was held high (pulse width)
    var t1 = microtime.now();
    while (rpio.read(pins.echo)) {
        if (microtime.now() - ttrig >= 29000) {
            return null;
        }
    }
    var t2 = microtime.now();
    var pulse_width = t2 - t1;

    // Calculate distance in centimeters
    return pulse_width / 58.0;

}

function writePWM(pin, value) {

    rpio.pwmSetData(pin, value * pwmRange);

}

module.exports = {
    "init": init,
    "readUltrasonic": readUltrasonic,
    "writePWM": writePWM,
    "camera": new PiCamera({
        mode: 'photo',
        output: `${ __dirname }/pic.jpg`,
        width: 160,
        height: 120,
        nopreview: true,
    })
};