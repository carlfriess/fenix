var Jimp = require("jimp");
var ColorThief = require("color-thief");

var colorThief = new ColorThief();

// Constants for color
const UNKNOWN = 0;
const RED = 1;
const GREEN = 2;

// Constants for threshholds
const backgroundThreshhold = 110;
const ratioThreshhold = 0.075;

var imageName = './img/1519450180174.jpg';

/*
jimp.read("./img/1519449993135.jpg").then(function (image) {
    
    // Getting single color decision from the image
    var answer = getSingleColor(image);

    // Printing out decision
    console.log((answer == RED) ? "RED!" : ((answer == GREEN) ? "GREEN!" : "UNKNOWN"));


}).catch(function (err) {

    // handle an exception
    console.error(err);

});
*/

var answer = colorRecognitionColorThief(imageName);

console.log((answer == RED) ? "RED!" : ((answer == GREEN) ? "GREEN!" : "UNKNOWN"));

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

function colorRecognitionColorThief(imageName) {

    var palette = colorThief.getPalette(imageName);

    var colorDecisions = palette.map((rgbColor) => {
        
        var hsvColor = rgbToHsv(rgbColor[0], rgbColor[1], rgbColor[2]);

        var h = hsvColor[0];
        var s = hsvColor[1];
        var v = hsvColor[2];

        if (isRed(h, s, v)) {
            return RED;
        } else if (isGreen(h, s, v)) {
            return GREEN;
        } else {
            return UNKNOWN;
        }

    });

    var redCount = 0;
    var greenCount = 0;
    var unknownCount = 0;
    
    for (i = 0; i < palette.length; i++) { 
        
        var impact = palette.length - i;
        
        if (palette[i] == RED) {
            redCount += i * impact;
        } else if (palette[i] == GREEN) {
            greenCount += i * impact;
        } else {
            unknownCount += 1;
        }

    }

    if (redCount >= greenCount * 1.5) {
        console.log("RED");
        return RED;
    } else if (greenCount >= redCount * 1.5) {
        console.log("GREEN");
        return GREEN;
    } else {
        console.log("UNKNOWN");
        return UNKNOWN;
    }

}

function isRed(h, s, v) {
    return (340 <= h || h <= 10 && v >= 0.3);
}

function isGreen(h, s, v) {
    return (85 <= h && h <= 160 && v >= 0.3);
}

function mod(n, m) {
    return ((n % m) + m) % m;
}

function rgbToHsv(r, g, b) {
  
    r /= 255, g /= 255, b /= 255;

    var Cmax = Math.max(r, g, b);
    var Cmin = Math.min(r, g, b);
    var h, s, v = Cmax;

    var d = Cmax - Cmin;
    s = (Cmax == 0) ? 0 : (d / Cmax);

    if (Cmax == Cmin) {
        h = 0; // achromatic
    } else {
        switch (Cmax) {
            case r: h = mod(Math.floor(60 * (g - b) / d), 360); break;
            case g: h = mod(Math.floor(60 * (b - r) / d + 120), 360); break;
            case b: h = mod(Math.floor(60 * (r - g) / d + 240), 360); break;
        }
    }

    return [ h, s, v ];

}

function colorRecognitionThreshhold(image, x, y, w, h) {

    // Initializing total values for both red and green
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



function colorRecognitionSimple(image, x, y, w, h) {

    // Initializing total values for both red and green
    var totalRed = 0;
    var totalGreen = 0;

    // Iterating through every pixel and adding 
    image.scan(x, y, w, h, function (x, y, idx) {
    
        var red   = this.bitmap.data[ idx + 0 ];
        var green = this.bitmap.data[ idx + 1 ];
        var blue  = this.bitmap.data[ idx + 2 ];
        var alpha = this.bitmap.data[ idx + 3 ];

        // Adding color values     
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


