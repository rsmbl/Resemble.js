$(function(){
	var $target = $('#drop-zone');

	function dropZone($target, onDrop){
		$target.
			bind('dragover', function(){
				$target.addClass( 'drag-over' );
				return false;
			}).
			bind("dragend", function () {
				$target.removeClass( 'drag-over' );
				return false;
			}).
			bind("dragleave", function () {
				$target.removeClass( 'drag-over' );
				return false;
			}).
			bind("drop", function(event) {
				var file = event.originalEvent.dataTransfer.files[0];

				event.stopPropagation();
				event.preventDefault();

				$target.removeClass( 'drag-over' );

				var droppedImage = new Image();
				var fileReader = new FileReader();

				fileReader.onload = function (event) {
					droppedImage.src = event.target.result;
					$target.html(droppedImage);
				};

				fileReader.readAsDataURL(file);

				onDrop(file);
			});
	}

	dropZone($target, function(file){

		resemble(file).onComplete(function(data){
			$('#image-data').show();
			$('#red').css('width',data.red+'%');
			$('#green').css('width',data.green+'%');
			$('#blue').css('width',data.blue+'%');
			$('#alpha').css('width',data.alpha+'%');
			$('#brightness').css('width',data.brightness+'%');
			$('#white').css('width',data.white+'%');
			$('#black').css('width',data.black+'%');
		});

	});

	function onComplete(data){
		var time = Date.now();
		var diffImage = new Image();
		diffImage.src = data.getImageDataUrl();

		$('#image-diff').html(diffImage);

		$(diffImage).click(function(){
			window.open(diffImage.src, '_blank');
		});

		$('.buttons').show();

		if(data.misMatchPercentage == 0){
			$('#thesame').show();
			$('#diff-results').hide();
		} else {
			$('#mismatch').text(data.misMatchPercentage);
			if(!data.isSameDimensions){
				$('#differentdimensions').show();
			} else {
				$('#differentdimensions').hide();
			}
			$('#diff-results').show();
			$('#thesame').hide();
		}
	}

	var file1;
	var file2;
	var resembleControl;

	dropZone($('#dropzone1'), function(file){
		file1 = file;
		if(file2){
			resembleControl = resemble(file).compareTo(file2).onComplete(onComplete);
		}
	});

	dropZone($('#dropzone2'), function(file){
		file2 = file;
		if(file1){
			resembleControl = resemble(file).compareTo(file1).onComplete(onComplete);
		}
	});

	var buttons = $('.buttons button');

	buttons.click(function(){
		var $this = $(this);

		$this.parent('.buttons').find('button').removeClass('active');
		$this.addClass('active');

		if($this.is('#raw')){
			resembleControl.ignoreNothing();
		}
		else
		if($this.is('#less')){
			resembleControl.ignoreLess();
		}
		if($this.is('#colors')){
			resembleControl.ignoreColors();
		}
		else
		if($this.is('#antialising')){
			resembleControl.ignoreAntialiasing();
		}
		else
		if($this.is('#same-size')){
			resembleControl.scaleToSameSize();
		}
		else
		if($this.is('#original-size')){
			resembleControl.useOriginalSize();
		}
		else
		if($this.is('#pink')){
			resemble.outputSettings({
				errorColor: {
					red: 255,
					green: 0,
					blue: 255
				}
			});
			resembleControl.repaint();
		}
		else
		if($this.is('#yellow')){
			resemble.outputSettings({
				errorColor: {
					red: 255,
					green: 255,
					blue: 0
				}
			});
			resembleControl.repaint();
		}
		else
		if($this.is('#flat')){
			resemble.outputSettings({
				errorType: 'flat'
			});
			resembleControl.repaint();
		}
		else
		if($this.is('#movement')){
			resemble.outputSettings({
				errorType: 'movement'
			});
			resembleControl.repaint();
		}
		else
		if($this.is('#flatDifferenceIntensity')){
			resemble.outputSettings({
				errorType: 'flatDifferenceIntensity'
			});
			resembleControl.repaint();
		}
		else
		if($this.is('#movementDifferenceIntensity')){
			resemble.outputSettings({
				errorType: 'movementDifferenceIntensity'
			});
			resembleControl.repaint();
		}
		else
		if($this.is('#opaque')){
			resemble.outputSettings({
				transparency: 1
			});
			resembleControl.repaint();
		}
		else
		if($this.is('#transparent')){
			resemble.outputSettings({
				transparency: 0.3
			});
			resembleControl.repaint();
		}
	});

	(function(){
		var xhr = new XMLHttpRequest();
		var xhr2 = new XMLHttpRequest();
		var done = $.Deferred();
		var dtwo = $.Deferred();

		xhr.open('GET', 'demoassets/People.jpg', true);
		xhr.responseType = 'blob';
		xhr.onload = function(e) {
			done.resolve(this.response);
		};
		xhr.send();

		xhr2.open('GET', 'demoassets/People2.jpg', true);
		xhr2.responseType = 'blob';
		xhr2.onload = function(e) {
			dtwo.resolve(this.response);
		};
		xhr2.send();

		$('#example-images').click(function(){

			$('#dropzone1').html('<img src="demoassets/People.jpg"/>');
			$('#dropzone2').html('<img src="demoassets/People2.jpg"/>');

			$.when(done, dtwo).done(function(file, file1){
				if (typeof FileReader === 'undefined') {
					resembleControl = resemble('demoassets/People.jpg').compareTo('demoassets/People2.jpg').onComplete(onComplete);
				} else {
					resembleControl = resemble(file).compareTo(file1).onComplete(onComplete);
				}
			});

			return false;
		});

	}());

});
