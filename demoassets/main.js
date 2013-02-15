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
		var diffImage = new Image();
		diffImage.src = data.imageDiffFileData;
		$('#image-diff').html(diffImage);

		$(diffImage).click(function(){
			window.open(diffImage.src, '_blank');
		});

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
	dropZone($('#dropzone1'), function(file){
		file1 = file;
		if(file2){
			resemble(file).compareTo(file2).onComplete(onComplete);
		}
	});
	dropZone($('#dropzone2'), function(file){
		file2 = file;
		if(file1){
			resemble(file).compareTo(file1).onComplete(onComplete);
		}
	});

});