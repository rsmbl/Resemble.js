(function(_this){

	_this['resemble'] = function( fileData ){

		var data = {};
		var images = [];
		var updateCallbackArray = [];

		var tolerance = [ // between 0 and 255
			255, // red
			255, // green 16
			255, // blue 24
			255, // alpha
			255 // brightness
		];

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
				var alpha = sourceImageData[offset + 3];
				var brightness = (0.3*red + 0.59*green + 0.11*blue);

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

		function isPixelDifferent(d1, d2, off, plus){
			var a = d1[off + plus];
			var b = d2[off + plus];

			var absDiff = Math.abs(a - b);

			if(typeof a === 'undefined'){
				return false;
			}
			if(typeof b === 'undefined'){
				return false;
			}

			if(a === b){
				return true;
			} else if ( absDiff < tolerance[plus] ) {
				return true;
			} else {
				return false;
			}
		}

		function compareBrightness(data1, data2, offset){
			var red1 = data1[offset + 0];
			var green1 = data1[offset + 1];
			var blue1 = data1[offset + 2];

			var red2 = data2[offset + 0];
			var green2 = data2[offset + 1];
			var blue2 = data2[offset + 2];

			var brightness1;
			var brightness2;

			if(red1 && green1 && blue1 && red2 && green2 && blue2){

				brightness1 = (0.3*red1 + 0.59*green1 + 0.11*blue1);
				brightness2 = (0.3*red2 + 0.59*green2 + 0.11*blue2);

				return Math.abs(brightness1 - brightness2) < tolerance[4];

			} else {
				return false;
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
			var pix = imgd.data;

			var mismatchCount = 0;

			loop(height, width, function(verticalPos, horizontalPos){

				var offset = (verticalPos*width + horizontalPos) * 4;
				var red = isPixelDifferent(data1, data2, offset, 0);
				var green = isPixelDifferent(data1, data2, offset, 1);
				var blue = isPixelDifferent(data1, data2, offset, 2);
				var alpha = isPixelDifferent(data1, data2, offset, 3);

				var brightness = compareBrightness(data1, data2, offset);

				if(brightness && red && green && blue){

					pix[offset] = data1[offset + 0];
					pix[offset + 1] = data1[offset + 1];
					pix[offset + 2] = data1[offset + 2];
					pix[offset + 3] = data1[offset + 3];

				} else {
					pix[offset] = 255;
					pix[offset + 1] = 0;
					pix[offset + 2] = 255;
					pix[offset + 3] = 255;

					mismatchCount++;
				}
			});

			context.putImageData(imgd, 0,0);

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

			loadImageData(one, onceWeHaveBoth);
			loadImageData(two, onceWeHaveBoth);
		}

		return {
			onComplete: function( callback ){
				updateCallbackArray.push(callback);
				loadImageData(fileData, function(imageData, width, height){
					parseImage(imageData.data, width, height);
				});
			},
			compareTo: function(secondFileData){
				return {
					onComplete: function( callback ){
						updateCallbackArray.push(callback);
						compare(fileData, secondFileData);
					}
				};
			}
		};

	};
}(this));