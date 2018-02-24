var Jimp = require("jimp");

// Constants for color
const UNKNOWN = 0;
const RED = 1;
const GREEN = 2;

// Constants for threshholds
const backgroundThreshhold = 110;
const ratioThreshhold = 0.075;


Jimp.read("./img/green3.jpg").then(function (image) {
    
    // Getting single color decision from the image
    var answer = getSingleColor(image);

    // Printing out decision
    console.log((answer == RED) ? "RED!" : ((answer == GREEN) ? "GREEN!" : "UNKNOWN"));


}).catch(function (err) {

    // handle an exception
    console.error(err);

});


function getSingleColor(image) {

    return colorRecognitionThreshhold(image, 0, 0, image.bitmap.width, image.bitmap.height);

}

function getThreeColors(image) {

    // Getting width and height of image
    var w = image.bitmap.width;
    var h = image.bitmap.height;

    // Setting boundary for intervals
    var x1 = Math.floor((1/3)*w);
    var x2 = Math.ceil((2/3)*w);

    // Calculate answers of three intervals |.....|......|.....|
    var answer1 = colorRecognitionThreshhold(image, 0,  0, x1,    h);
    var answer2 = colorRecognitionThreshhold(image, x1, 0, x2-x1, h);
    var answer3 = colorRecognitionThreshhold(image, x2, 0, w-x2,  h);

    // Returning array with answers
    return [answer1, answer2, answer3];

}

function colorRecognitionThreshhold(image, x, y, w, h) {

    // Initialize total values for both red and green
    var totalRed = 0;
    var totalGreen = 0;

    // Iterating through every pixel and adding 
    image.scan(x, y, w, h, function (x, y, idx) {

        // Getting RGBA
        var red   = this.bitmap.data[ idx + 0 ];
        var green = this.bitmap.data[ idx + 1 ];
        var blue  = this.bitmap.data[ idx + 2 ];
        var alpha = this.bitmap.data[ idx + 3 ];

        // Setting greyscale color
        var greyscaleColor = (red + green + blue) / 3;

        // Checking threshhold of background color
        if (greyscaleColor > backgroundThreshhold) {

            // Adding color values if above background threshhold
            totalRed += red;
            totalGreen += green;

        } else {
            
            // Not adding color values if below background threshhold

        }

    });

    // Setting percentage ratios for red and green
    var ratioRed = totalRed / (totalRed + totalGreen);
    var ratioGreen = totalGreen / (totalRed + totalGreen);

    // Printing total value and ratio for both colors
    console.log("RED:"   + "\t total value: " + totalRed   + "\t ratio: " + ratioRed);
    console.log("GREEN:" + "\t total value: " + totalGreen + "\t ratio: " + ratioGreen);

    // Checking ratio threshhold and returning 
    if (ratioRed > ratioGreen + ratioThreshhold) {
        return RED;
    } else if (ratioGreen > ratioRed + ratioThreshhold) {
        return GREEN;
    } else {
        return UNKNOWN;
    }

}



function colorRecognitionSimple(jimpImage, x, y, w, h) {

    var totalRed = 0;
    var totalGreen = 0;

    //image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
    jimpImage.scan(x, y, w, h, function (x, y, idx) {
    

        var red   = this.bitmap.data[ idx + 0 ];
        var green = this.bitmap.data[ idx + 1 ];
        var blue  = this.bitmap.data[ idx + 2 ];
        var alpha = this.bitmap.data[ idx + 3 ];

        // rgba values run from 0 - 255
        
        totalRed += red;
        totalGreen += green;

    });

    // Setting percentage ratios for red and green
    var ratioRed = totalRed / (totalRed + totalGreen);
    var ratioGreen = totalGreen / (totalRed + totalGreen);

    // Printing total value and ratio for both colors
    console.log("RED:"   + "\t total value: " + totalRed   + "\t ratio: " + ratioRed);
    console.log("GREEN:" + "\t total value: " + totalGreen + "\t ratio: " + ratioGreen);

    // Checking ratio threshhold and returning 
    if (ratioRed > ratioGreen + ratioThreshhold) {
        return RED;
    } else if (ratioGreen > ratioRed + ratioThreshhold) {
        return GREEN;
    } else {
        return UNKNOWN;
    }

}

/*
function preprocessing() { 

    // Resizing image to 128x128
    image.resize(128, 128);

    colorRecognition(image, x, y, w, h);

}
*/


