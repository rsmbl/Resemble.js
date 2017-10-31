/*
James Cryer / Huddle
URL: https://github.com/Huddle/Resemble.js
*/

(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	} else if (typeof module === 'object' && module.exports) {
		module.exports = factory();
	} else {
		root.resemble = factory();
	}
}(this, function () {
	'use strict';

	var pixelTransparency = 1;

	var errorPixelColor = { // Color for Error Pixels. Between 0 and 255.
		red: 255,
		green: 0,
		blue: 255,
		alpha: 255
	};

	var targetPix = {r: 0, g: 0, b: 0, a: 0}; // isAntialiased

	function colorsDistance(c1, c2){
		return (Math.abs(c1.r - c2.r) + Math.abs(c1.g - c2.g) + Math.abs(c1.b - c2.b))/3;
	}

	function withinBoundingBox(x, y, width, height) {
		if (!boundingBox) {
			return true;
		}

        return x > (boundingBox.left || 0) &&
            x < (boundingBox.right || width) &&
            y > (boundingBox.top || 0) &&
            y < (boundingBox.bottom || height);
	}

	var errorPixelTransform = {
		flat: function (px, offset, d1, d2) {
			px[offset] = errorPixelColor.red;
			px[offset + 1] = errorPixelColor.green;
			px[offset + 2] = errorPixelColor.blue;
			px[offset + 3] = errorPixelColor.alpha;
		},
		movement: function (px, offset, d1, d2) {
			px[offset] = ((d2.r * (errorPixelColor.red / 255)) + errorPixelColor.red) / 2;
			px[offset + 1] = ((d2.g * (errorPixelColor.green / 255)) + errorPixelColor.green) / 2;
			px[offset + 2] = ((d2.b * (errorPixelColor.blue / 255)) + errorPixelColor.blue) / 2;
			px[offset + 3] = d2.a;
		},
		flatDifferenceIntensity: function (px, offset, d1, d2) {
			px[offset] = errorPixelColor.red;
			px[offset + 1] = errorPixelColor.green;
			px[offset + 2] = errorPixelColor.blue;
			px[offset + 3] = colorsDistance(d1, d2);
		},
		movementDifferenceIntensity: function (px, offset, d1, d2) {
			var ratio = colorsDistance(d1, d2) / 255 * 0.8;

			px[offset] = ((1 - ratio) * (d2.r * (errorPixelColor.red / 255)) + ratio * errorPixelColor.red);
			px[offset + 1] = ((1 - ratio) * (d2.g * (errorPixelColor.green / 255)) + ratio * errorPixelColor.green);
			px[offset + 2] = ((1 - ratio) * (d2.b * (errorPixelColor.blue / 255)) + ratio * errorPixelColor.blue);
			px[offset + 3] = d2.a;
		},
		diffOnly: function (px, offset, d1, d2) {
			px[offset] = d2.r;
			px[offset + 1] = d2.g;
			px[offset + 2] = d2.b;
			px[offset + 3] = d2.a;
		}
	};

	var errorPixel = errorPixelTransform.flat;
	var errorType;
	var boundingBox;
	var largeImageThreshold = 1200;
	var useCrossOrigin = true;
	var document = typeof window != "undefined" ? window.document : {
		createElement: function() {
			// This will work as long as only createElement is used on window.document
			var Canvas = require('canvas');
			return new Canvas();
		}
	};

	var resemble = function( fileData ){

		var data = {};
		var images = [];
		var updateCallbackArray = [];

		var tolerance = { // between 0 and 255
			red: 16,
			green: 16,
			blue: 16,
			alpha: 16,
			minBrightness: 16,
			maxBrightness: 240
		};

		var ignoreAntialiasing = false;
		var ignoreColors = false;
		var scaleToSameSize = false;

		function triggerDataUpdate(){
			var len = updateCallbackArray.length;
			var i;
			for(i=0;i<len;i++){
				if (typeof updateCallbackArray[i] === 'function'){
					updateCallbackArray[i](data);
				}
			}
		}

		function loop(w, h, callback){
			var x,y;

			for (x=0;x<w;x++){
				for (y=0;y<h;y++){
					callback(x, y);
				}
			}
		}

		function parseImage(sourceImageData, width, height){

			var pixelCount = 0;
			var redTotal = 0;
			var greenTotal = 0;
			var blueTotal = 0;
			var alphaTotal = 0;
			var brightnessTotal = 0;
			var whiteTotal = 0;
			var blackTotal = 0;

			loop(width, height, function(horizontalPos, verticalPos){
				var offset = (verticalPos*width + horizontalPos) * 4;
				var red = sourceImageData[offset];
				var green = sourceImageData[offset + 1];
				var blue = sourceImageData[offset + 2];
				var alpha = sourceImageData[offset + 3];
				var brightness = getBrightness(red,green,blue);

				if (red == green && red == blue && alpha) {
					if (red == 0) {
						blackTotal++
					} else if (red == 255) {
						whiteTotal++
					}
				}

				pixelCount++;

				redTotal += red / 255 * 100;
				greenTotal += green / 255 * 100;
				blueTotal += blue / 255 * 100;
				alphaTotal += (255 - alpha) / 255 * 100;
				brightnessTotal += brightness / 255 * 100;
			});

			data.red = Math.floor(redTotal / pixelCount);
			data.green = Math.floor(greenTotal / pixelCount);
			data.blue = Math.floor(blueTotal / pixelCount);
			data.alpha = Math.floor(alphaTotal / pixelCount);
			data.brightness = Math.floor(brightnessTotal / pixelCount);
			data.white = Math.floor(whiteTotal / pixelCount * 100);
			data.black = Math.floor(blackTotal / pixelCount * 100);

			triggerDataUpdate();
		}

		function loadImageData( fileData, callback ){
			var fileReader;
			var hiddenImage;
			if (typeof Image !== 'undefined') {
				hiddenImage = new Image();
			} else {
				var CanvasImage = require('canvas').Image;
				hiddenImage = new CanvasImage();
				hiddenImage.setAttribute = function setAttribute() { };
			}


			if(useCrossOrigin) {
				hiddenImage.setAttribute('crossorigin', 'anonymous');
			}

			hiddenImage.onerror = function () {
				hiddenImage.onerror = null; //fixes pollution between calls
				images.push({ error : "Image load error."});
				callback();
			};

			hiddenImage.onload = function() {
				hiddenImage.onload = null; //fixes pollution between calls

				var hiddenCanvas =  document.createElement('canvas');
				var imageData;

				// don't assign to hiddenImage, see https://github.com/Huddle/Resemble.js/pull/87/commits/300d43352a2845aad289b254bfbdc7cd6a37e2d7
				var width = hiddenImage.width;
				var height = hiddenImage.height;

				if( scaleToSameSize && images.length == 1 ){
					width   = images[0].width;
					height  = images[0].height;
				}

				hiddenCanvas.width = width;
				hiddenCanvas.height = height;

				hiddenCanvas.getContext('2d').drawImage(hiddenImage, 0, 0, width, height);
				imageData = hiddenCanvas.getContext('2d').getImageData(0, 0, width, height);

				images.push(imageData);

				callback(imageData, width, height);
			};

			if (typeof fileData === 'string') {
				hiddenImage.src = fileData;
				if (hiddenImage.complete && hiddenImage.naturalWidth > 0) {
					hiddenImage.onload();
				}
			} else if (typeof fileData.data !== 'undefined'
					&& typeof fileData.width === 'number'
					&& typeof fileData.height === 'number') {

				images.push(fileData);

				callback(fileData, fileData.width, fileData.height);
			} else if (typeof Buffer !== 'undefined' && fileData instanceof Buffer){
				// If we have Buffer, assume we're on Node+Canvas and its supported
				hiddenImage.src = fileData;
			} else {
				fileReader = new FileReader();
				fileReader.onload = function (event) {
					hiddenImage.src = event.target.result;
				};
				fileReader.readAsDataURL(fileData);
			}
		}

		function isColorSimilar(a, b, color){

			var absDiff = Math.abs(a - b);

			if(typeof a === 'undefined'){
				return false;
			}
			if(typeof b === 'undefined'){
				return false;
			}

			if(a === b){
				return true;
			} else if ( absDiff < tolerance[color] ) {
				return true;
			} else {
				return false;
			}
		}

		function isPixelBrightnessSimilar(d1, d2){
			var alpha = isColorSimilar(d1.a, d2.a, 'alpha');
			var brightness = isColorSimilar(d1.brightness, d2.brightness, 'minBrightness');
			return brightness && alpha;
		}

		function getBrightness(r,g,b){
			return 0.3*r + 0.59*g + 0.11*b;
		}

		function isRGBSame(d1,d2){
			var red = d1.r === d2.r;
			var green = d1.g === d2.g;
			var blue = d1.b === d2.b;
			return red && green && blue;
		}

		function isRGBSimilar(d1, d2){
			var red = isColorSimilar(d1.r,d2.r,'red');
			var green = isColorSimilar(d1.g,d2.g,'green');
			var blue = isColorSimilar(d1.b,d2.b,'blue');
			var alpha = isColorSimilar(d1.a, d2.a, 'alpha');

			return red && green && blue && alpha;
		}

		function isContrasting(d1, d2){
			return Math.abs(d1.brightness - d2.brightness) > tolerance.maxBrightness;
		}

		function getHue(r,g,b){

			r = r / 255;
			g = g / 255;
			b = b / 255;
			var max = Math.max(r, g, b), min = Math.min(r, g, b);
			var h;
			var d;

			if (max == min){
				h = 0; // achromatic
			} else{
				d = max - min;
				switch(max){
					case r: h = (g - b) / d + (g < b ? 6 : 0); break;
					case g: h = (b - r) / d + 2; break;
					case b: h = (r - g) / d + 4; break;
				}
				h /= 6;
			}

			return h;
		}

		function isAntialiased(sourcePix, data, cacheSet, verticalPos, horizontalPos, width){
			var offset;
			var distance = 1;
			var i;
			var j;
			var hasHighContrastSibling = 0;
			var hasSiblingWithDifferentHue = 0;
			var hasEquivalentSibling = 0;

			addHueInfo(sourcePix);

			for (i = distance*-1; i <= distance; i++){
				for (j = distance*-1; j <= distance; j++){

					if(i===0 && j===0){
						// ignore source pixel
					} else {

						offset = ((verticalPos+j)*width + (horizontalPos+i)) * 4;

						if(!getPixelInfo(targetPix , data, offset, cacheSet)){
							continue;
						}

						addBrightnessInfo(targetPix);
						addHueInfo(targetPix);

						if( isContrasting(sourcePix, targetPix) ){
							hasHighContrastSibling++;
						}

						if( isRGBSame(sourcePix,targetPix) ){
							hasEquivalentSibling++;
						}

						if( Math.abs(targetPix.h - sourcePix.h) > 0.3 ){
							hasSiblingWithDifferentHue++;
						}

						if( hasSiblingWithDifferentHue > 1 || hasHighContrastSibling > 1){
							return true;
						}
					}
				}
			}

			if(hasEquivalentSibling < 2){
				return true;
			}

			return false;
		}

		function copyPixel(px, offset, data){
			if (errorType === 'diffOnly') {
				return;
			}

			px[offset] = data.r; //r
			px[offset + 1] = data.g; //g
			px[offset + 2] = data.b; //b
			px[offset + 3] = data.a * pixelTransparency; //a
		}

		function copyGrayScalePixel(px, offset, data){
			if (errorType === 'diffOnly') {
				return;
			}

			px[offset] = data.brightness; //r
			px[offset + 1] = data.brightness; //g
			px[offset + 2] = data.brightness; //b
			px[offset + 3] = data.a * pixelTransparency; //a
		}

		function getPixelInfo(dst, data, offset, cacheSet) {
			if (data.length > offset) {
				dst.r = data[offset];
				dst.g = data[offset + 1];
				dst.b = data[offset + 2];
				dst.a = data[offset + 3];

				return true;
			}

			return false;
		}

		function addBrightnessInfo(data){
			data.brightness = getBrightness(data.r,data.g,data.b); // 'corrected' lightness
		}

		function addHueInfo(data){
			data.h = getHue(data.r,data.g,data.b);
		}

		function analyseImages(img1, img2, width, height){

			var hiddenCanvas = document.createElement('canvas');

			var data1 = img1.data;
			var data2 = img2.data;

			hiddenCanvas.width = width;
			hiddenCanvas.height = height;

			var context = hiddenCanvas.getContext('2d');
			var imgd = context.createImageData(width,height);
			var targetPix = imgd.data;

			var mismatchCount = 0;
			var diffBounds = {
				top: height,
				left: width,
				bottom: 0,
				right: 0
			};
			var updateBounds = function(x, y) {
				diffBounds.left = Math.min(x, diffBounds.left);
				diffBounds.right = Math.max(x, diffBounds.right);
				diffBounds.top = Math.min(y, diffBounds.top);
				diffBounds.bottom = Math.max(y, diffBounds.bottom);
			};

			var time = Date.now();

			var skip;

			if(!!largeImageThreshold && ignoreAntialiasing && (width > largeImageThreshold || height > largeImageThreshold)){
				skip = 6;
			}

			var pixel1 = {r: 0, g: 0, b: 0, a: 0};
			var pixel2 = { r: 0, g: 0, b: 0, a: 0 };

			loop(width, height, function(horizontalPos, verticalPos){

				if(skip){ // only skip if the image isn't small
					if(verticalPos % skip === 0 || horizontalPos % skip === 0){
						return;
					}
				}

				var offset = (verticalPos*width + horizontalPos) * 4;
				var isWithinBoundingBox = withinBoundingBox(horizontalPos, verticalPos, width, height);

				if (!getPixelInfo(pixel1, data1, offset, 1) || !getPixelInfo(pixel2, data2, offset, 2)) {
					return;
				}

				if (ignoreColors){

					addBrightnessInfo(pixel1);
					addBrightnessInfo(pixel2);

					if( isPixelBrightnessSimilar(pixel1, pixel2) || !isWithinBoundingBox ){
						copyGrayScalePixel(targetPix, offset, pixel2);
					} else {
						errorPixel(targetPix, offset, pixel1, pixel2);
						mismatchCount++;
						updateBounds(horizontalPos, verticalPos);
					}
					return;
				}

				if( isRGBSimilar(pixel1, pixel2)  || !isWithinBoundingBox ){
					copyPixel(targetPix, offset, pixel1, pixel2);

				} else if( ignoreAntialiasing && (
						addBrightnessInfo(pixel1), // jit pixel info augmentation looks a little weird, sorry.
						addBrightnessInfo(pixel2),
						isAntialiased(pixel1, data1, 1, verticalPos, horizontalPos, width) ||
						isAntialiased(pixel2, data2, 2, verticalPos, horizontalPos, width)
					)){

					if( isPixelBrightnessSimilar(pixel1, pixel2) || !isWithinBoundingBox ){
						copyGrayScalePixel(targetPix, offset, pixel2);
					} else {
						errorPixel(targetPix, offset, pixel1, pixel2);
						mismatchCount++;
						updateBounds(horizontalPos, verticalPos);
					}
				} else {
					errorPixel(targetPix, offset, pixel1, pixel2);
					mismatchCount++;
					updateBounds(horizontalPos, verticalPos);
				}

			});

			data.rawMisMatchPercentage = (mismatchCount / (height*width) * 100);
			data.misMatchPercentage = data.rawMisMatchPercentage.toFixed(2);
			data.diffBounds = diffBounds;
			data.analysisTime = Date.now() - time;

			data.getImageDataUrl = function(text){
				var barHeight = 0;

				if(text){
					barHeight = addLabel(text,context,hiddenCanvas);
				}

				context.putImageData(imgd, 0, barHeight);

				return hiddenCanvas.toDataURL("image/png");
			};

			if (hiddenCanvas.toBuffer) {
				data.getBuffer = function() {
					context.putImageData(imgd, 0, 0);
					return hiddenCanvas.toBuffer();
				}
			}
		}

		function addLabel(text, context, hiddenCanvas){
			var textPadding = 2;

			context.font = '12px sans-serif';

			var textWidth = context.measureText(text).width + textPadding*2;
			var barHeight = 22;

			if(textWidth > hiddenCanvas.width){
				hiddenCanvas.width = textWidth;
			}

			hiddenCanvas.height += barHeight;

			context.fillStyle = "#666";
			context.fillRect(0,0,hiddenCanvas.width,barHeight -4);
			context.fillStyle = "#fff";
			context.fillRect(0,barHeight -4,hiddenCanvas.width, 4);

			context.fillStyle = "#fff";
			context.textBaseline = "top";
			context.font = '12px sans-serif';
			context.fillText(text, textPadding, 1);

			return barHeight;
		}

		function normalise(img, w, h){
			var c;
			var context;

			if(img.height < h || img.width < w){
				c = document.createElement('canvas');
				c.width = w;
				c.height = h;
				context = c.getContext('2d');
				context.putImageData(img, 0, 0);
				return context.getImageData(0, 0, w, h);
			}

			return img;
		}

		function compare(one, two){

			function onceWeHaveBoth(){
				var width;
				var height;
				if(images.length === 2){
					if( images[0].error || images[1].error ){
						data = {};
						data.error = images[0].error ?  images[0].error : images[1].error;
						triggerDataUpdate();
						return;
					}
					width = images[0].width > images[1].width ? images[0].width : images[1].width;
					height = images[0].height > images[1].height ? images[0].height : images[1].height;

					if( (images[0].width === images[1].width) && (images[0].height === images[1].height) ){
						data.isSameDimensions = true;
					} else {
						data.isSameDimensions = false;
					}

					data.dimensionDifference = { width: images[0].width - images[1].width, height: images[0].height - images[1].height };

					analyseImages( normalise(images[0],width, height), normalise(images[1],width, height), width, height);

					triggerDataUpdate();
				}
			}

			images = [];
			loadImageData(one, onceWeHaveBoth);
			loadImageData(two, onceWeHaveBoth);
		}

		function getCompareApi(param){

			var secondFileData,
				hasMethod = typeof param === 'function';

			if( !hasMethod ){
				// assume it's file data
				secondFileData = param;
			}

			var self = {
				scaleToSameSize: function(){
					scaleToSameSize = true;

					if(hasMethod) { param(); }
					return self;
				},
				useOriginalSize: function(){
					scaleToSameSize = false;

					if(hasMethod) { param(); }
					return self;
				},
				ignoreNothing: function(){

					tolerance.red = 0;
					tolerance.green = 0;
					tolerance.blue = 0;
					tolerance.alpha = 0;
					tolerance.minBrightness = 0;
					tolerance.maxBrightness = 255;

					ignoreAntialiasing = false;
					ignoreColors = false;

					if(hasMethod) { param(); }
					return self;
				},
				ignoreLess: function(){

					tolerance.red = 16;
					tolerance.green = 16;
					tolerance.blue = 16;
					tolerance.alpha = 16;
					tolerance.minBrightness = 16;
					tolerance.maxBrightness = 240;

					ignoreAntialiasing = false;
					ignoreColors = false;

					if(hasMethod) { param(); }
					return self;
				},
				ignoreAntialiasing: function(){

					tolerance.red = 32;
					tolerance.green = 32;
					tolerance.blue = 32;
					tolerance.alpha = 32;
					tolerance.minBrightness = 64;
					tolerance.maxBrightness = 96;

					ignoreAntialiasing = true;
					ignoreColors = false;

					if(hasMethod) { param(); }
					return self;
				},
				ignoreColors: function(){

					tolerance.alpha = 16;
					tolerance.minBrightness = 16;
					tolerance.maxBrightness = 240;

					ignoreAntialiasing = false;
					ignoreColors = true;

					if(hasMethod) { param(); }
					return self;
				},
				ignoreAlpha: function() {

					tolerance.red = 16;
					tolerance.green = 16;
					tolerance.blue = 16;
					tolerance.alpha = 255;
					tolerance.minBrightness = 16;
					tolerance.maxBrightness = 240;

					ignoreAntialiasing = false;
					ignoreColors = false;

					if(hasMethod) { param(); }
					return self;
				},
				repaint: function(){
					if(hasMethod) { param(); }
					return self;
				},
				onComplete: function( callback ){

					updateCallbackArray.push(callback);

					var wrapper = function(){
						compare(fileData, secondFileData);
					};

					wrapper();

					return getCompareApi(wrapper);
				}
			};

			return self;
		}

		return {
			onComplete: function( callback ){
				updateCallbackArray.push(callback);
				loadImageData(fileData, function(imageData, width, height){
					parseImage(imageData.data, width, height);
				});
			},
			compareTo: function(secondFileData){
				return getCompareApi(secondFileData);
			}
		};

	};

	resemble.outputSettings = function(options){
		var key;
		var undefined;

		if(options.errorColor){
			for (key in options.errorColor) {
				errorPixelColor[key] = options.errorColor[key] === undefined ? errorPixelColor[key] : options.errorColor[key];
			}
		}

		if(options.errorType && errorPixelTransform[options.errorType] ){
			errorPixel = errorPixelTransform[options.errorType];
			errorType = options.errorType;
		}

		if(options.errorPixel && typeof options.errorPixel === "function") {
			errorPixel = options.errorPixel;
		}

		pixelTransparency = isNaN(Number(options.transparency)) ? pixelTransparency : options.transparency;

		if (options.largeImageThreshold !== undefined) {
			largeImageThreshold = options.largeImageThreshold;
		}

		if (options.useCrossOrigin !== undefined) {
			useCrossOrigin = options.useCrossOrigin;
		}

		if (options.boundingBox !== undefined) {
			boundingBox = options.boundingBox;
		}

		return this;
	};

	return resemble;
}));
