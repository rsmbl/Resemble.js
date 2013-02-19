(function(_this){

	_this['resemble'] = function( fileData ){

		var data = {};
		var images = [];
		var updateCallbackArray = [];

		var tolerance = { // between 0 and 255
			red: 16,
			green: 16,
			blue: 16,
			minBrightness: 16,
			maxBrightness: 240
		};

		var ignoreAntialiasing = false;
		var ignoreColors = false;
		var skip = false;

		function triggerDataUpdate(){
			var len = updateCallbackArray.length;
			var i;
			for(i=0;i<len;i++){
				if (typeof updateCallbackArray[i] === 'function'){
					updateCallbackArray[i](data);
				}
			}
		}

		function loop(x, y, callback){
			var i,j;
			for (i=0;i<x;i++){
				for (j=0;j<y;j++){
					callback(i, j);
				}
			}
		}

		function parseImage(sourceImageData, width, height){

			var pixleCount = 0;
			var redTotal = 0;
			var greenTotal = 0;
			var blueTotal = 0;
			var brightnessTotal = 0;

			loop(height, width, function(verticalPos, horizontalPos){
				var offset = (verticalPos*width + horizontalPos) * 4;
				var red = sourceImageData[offset];
				var green = sourceImageData[offset + 1];
				var blue = sourceImageData[offset + 2];
				var brightness = getBrightness(red,green,blue);

				pixleCount++;

				redTotal += red / 255 * 100;
				greenTotal += green / 255 * 100;
				blueTotal += blue / 255 * 100;
				brightnessTotal += brightness / 255 * 100;
			});

			data.red = Math.floor(redTotal / pixleCount);
			data.green = Math.floor(greenTotal / pixleCount);
			data.blue = Math.floor(blueTotal / pixleCount);
			data.brightness = Math.floor(brightnessTotal / pixleCount);

			triggerDataUpdate();
		}

		function loadImageData( fileData, callback ){
			var hiddenImage = new Image();
			var fileReader = new FileReader();
			
			fileReader.onload = function (event) {
				hiddenImage.src = event.target.result;
			};

			hiddenImage.onload = function() {
				
				var hiddenCanvas =  document.createElement('canvas');
				var imageData;
				var width = hiddenImage.width;
				var height = hiddenImage.height;

				hiddenCanvas.width = width;
				hiddenCanvas.height = height;
				hiddenCanvas.getContext('2d').drawImage(hiddenImage, 0, 0, width, height);
				imageData = hiddenCanvas.getContext('2d').getImageData(0, 0, width, height);
				
				images.push(imageData);

				callback(imageData, width, height);
			};
				
			fileReader.readAsDataURL(fileData);
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

		function isNumber(n) {
			return !isNaN(parseFloat(n));
		}

		function isPixelBrightnessSimilar(d1, d2){
			return Math.abs(d1.brightness - d2.brightness) < tolerance.minBrightness;
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

			return red && green && blue;
		}

		function isContrasting(d1, d2){
			return Math.abs(d1.brightness - d2.brightness) > tolerance.maxBrightness;
		}

		function getHsl(data, offset){

			var r = data[offset] / 255;
			var g = data[offset+1] / 255;
			var b = data[offset+2] / 255;
			var max = Math.max(r, g, b), min = Math.min(r, g, b);
			var h;
			var s;
			var l = (max + min) / 2;
			var d;

			if (max == min){
				h = s = 0; // achromatic
			} else{
				d = max - min;
				s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
				switch(max){
					case r: h = (g - b) / d + (g < b ? 6 : 0); break;
					case g: h = (b - r) / d + 2; break;
					case b: h = (r - g) / d + 4; break;
				}
				h /= 6;
			}

			return { // values between 0 and 1
				hue: h,
				saturation: s,
				lightness: l
			};
		}

		function isAntialiased(sourcePix, data, cacheSet, verticalPos, horizontalPos, width){
			var offset;
			var targetPix;
			var distance = 1;
			var i;
			var j;
			var hasHighContrastSibling = 0;
			var hasSiblingWithDifferentHue = 0;
			var hasEquivilantSibling = 0;

			for (i = distance*-1; i <= distance; i++){
				for (j = distance*-1; j <= distance; j++){

					if(i===0 && j===0){
						// ignore source pixel
					} else {

						offset = ((verticalPos+j)*width + (horizontalPos+i)) * 4;
						targetPix = getRGBAndHSL(data, offset, cacheSet);

						if(targetPix === null){
							continue;
						}

						if( isContrasting(sourcePix, targetPix) ){
							hasHighContrastSibling++;
						}

						if( isRGBSame(sourcePix,targetPix) ){
							hasEquivilantSibling++;
						}

						if( Math.abs(targetPix.h - sourcePix.h) > 0.3 ){
							hasSiblingWithDifferentHue++;
						}

						if( hasSiblingWithDifferentHue > 1 || hasHighContrastSibling > 1 || hasEquivilantSibling === 0){
							return true;
						}
					}
				}
			}

			return false;
		}

		function errorPixel(px, offset){
			px[offset] = 255; //r
			px[offset + 1] = 0; //g
			px[offset + 2] = 255; //b
			px[offset + 3] = 255; //a
		}

		function copyPixel(px, offset, data){
			px[offset] = data.r; //r
			px[offset + 1] = data.g; //g
			px[offset + 2] = data.b; //b
			px[offset + 3] = 255; //a
		}

		function copyGrayScalePixel(px, offset, data){
			px[offset] = data.brightness; //r
			px[offset + 1] = data.brightness; //g
			px[offset + 2] = data.brightness; //b
			px[offset + 3] = 255; //a
		}

		var cache = [];
		function getRGBAndHSL(data, offset, cacheSet){
			var hsl;
			var r;
			var g;
			var b;
			var d;

			if(cache[cacheSet] && cache[cacheSet][offset]){
				return cache[cacheSet][offset];
			} else {
				if(typeof data[offset] !== 'undefined'){
					hsl = getHsl(data, offset);
					r = data[offset];
					g = data[offset+1];
					b = data[offset+2];
					d = {
						r: r,
						g: g,
						b: b,
						h: hsl.hue,
						s: hsl.saturation,
						l: hsl.lightness,
						brightness: getBrightness(r,g,b) // 'corrected' lightness
					};
					if(!cache[cacheSet]){
						cache[cacheSet] = [];
					}
					cache[cacheSet][offset] = d;
					return d;
				} else {
					return null;
				}
			}
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
			var isAntialiasedCount = 0;
			var isBrightnessCount = 0;

			loop(height, width, function(verticalPos, horizontalPos){

				var offset = (verticalPos*width + horizontalPos) * 4;
				var pixel1 = getRGBAndHSL(data1, offset, 1);

				if(skip){
					if(verticalPos % skip === 0 || horizontalPos % skip === 0){
						copyGrayScalePixel(targetPix, offset, pixel1);
						return;
					}
				}

				var pixel2 = getRGBAndHSL(data2, offset, 2);

				if(pixel1 === null || pixel2 === null){
					return;
				}

				if (ignoreColors){
					if( isPixelBrightnessSimilar(pixel1, pixel2) ){
						copyGrayScalePixel(targetPix, offset, pixel2);
					} else {
						errorPixel(targetPix, offset);
						mismatchCount++;
					}
					return;
				}
				
				if( isRGBSimilar(pixel1, pixel2) ){
					copyPixel(targetPix, offset, pixel2);

				} else if( ignoreAntialiasing &&
					(isAntialiased(pixel1, data1, 1, verticalPos, horizontalPos, width) ||
					isAntialiased(pixel2, data2, 2, verticalPos, horizontalPos, width)) ){

					isAntialiasedCount++;

					if( isPixelBrightnessSimilar(pixel1, pixel2) ){
						isBrightnessCount++;
						copyGrayScalePixel(targetPix, offset, pixel2);
					} else {
						errorPixel(targetPix, offset);
						mismatchCount++;
					}
				} else {
					errorPixel(targetPix, offset);
					mismatchCount++;
				}

			});

			context.putImageData(imgd, 0,0);

			cache = [];

			data.misMatchPercentage = (mismatchCount / (height*width) * 100).toFixed(2);
			data.imageDiffFileData = hiddenCanvas.toDataURL("image/png");
		}

		function compare(one, two){

			function onceWeHaveBoth(){
				var width;
				var height;
				if(images.length === 2){
					width = images[0].width > images[1].width ? images[0].width : images[1].width;
					height = images[0].height > images[1].height ? images[0].height : images[1].height;

					if( (images[0].width === images[1].width) && (images[0].height === images[1].height) ){
						data.isSameDimensions = true;
					} else {
						data.isSameDimensions = false;
					}
					
					analyseImages(images[0], images[1], width, height);

					triggerDataUpdate();
				}
			}

			images = [];
			loadImageData(one, onceWeHaveBoth);
			loadImageData(two, onceWeHaveBoth);
		}

		function getCompareApi(param){

			var hasMethod = typeof param === 'function';

			if( !hasMethod ){
				// assume it's file data
				secondFileData = param;
			}

			var self = {
				ignoreNothing: function(){
					
					tolerance.red = 16;
					tolerance.green = 16;
					tolerance.blue = 16;
					tolerance.minBrightness = 16;
					tolerance.maxBrightness = 240;

					ignoreAntialiasing = false;
					ignoreColors = false;

					skip = false;

					if(hasMethod) { param(); }
					return self;
				},
				ignoreAntialiasing: function(){

					tolerance.red = 24;
					tolerance.green = 24;
					tolerance.blue = 24;
					tolerance.minBrightness = 64;
					tolerance.maxBrightness = 96;

					ignoreAntialiasing = true;
					ignoreColors = false;
					skip = 4;

					if(hasMethod) { param(); }
					return self;
				},
				ignoreColors: function(){
					
					tolerance.minBrightness = 16;
					tolerance.maxBrightness = 240;

					ignoreAntialiasing = false;
					ignoreColors = true;

					skip = false;

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
}(this));