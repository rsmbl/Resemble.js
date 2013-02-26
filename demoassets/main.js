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
			bind("mouseout", function () {
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
			$('#brightness').css('width',data.brightness+'%');
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

		$('#buttons').show();

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
		console.log(file);
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


	var buttons = $('#raw, #colors, #antialising');

	buttons.click(function(){
		var $this = $(this);

		buttons.removeClass('active');
		$this.addClass('active');

		if($this.is('#raw')){
			resembleControl.ignoreNothing();
		}
		else
		if($this.is('#colors')){
			resembleControl.ignoreColors();
		}
		else
		if($this.is('#antialising')){
			resembleControl.ignoreAntialiasing();
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
				resembleControl = resemble(file).compareTo(file1).onComplete(onComplete);
			});

			return false;
		});

	}());

});