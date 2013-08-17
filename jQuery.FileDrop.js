(function($){

	// jQuery plugin initialization
	$.fn.fileDragAndDrop = function (options) {

		var opts = _getOptions(options);

		//Return the elements & loop though them
		return this.each(_setEvents);
	};

	$.fn.fileDragAndDrop.defaults = {
		overClass: "state-over",	//The class that will be added to an element when files are dragged over the window
		addClassTo: $([]), 			//Nothing selected by default, in this case the class is added to the selected element
		onFileRead: null 			//A function to run that will read each file
	};

	//====================================================================
	//Private
	//====================================================================

	//The options object is passed in and normalized
	function _getOptions(options){
		//If a function was passed in instead of an options object,
		//just use this as the onFileRead options instead
		if($.isFunction(options)){
			var o = {};
			o.onFileRead = options;
			options=o; 
		}

		//Create a finalized version of the options
		var opts = opts = $.extend({}, $.fn.fileDragAndDrop.defaults, options);

		//If this option was not set, make it the same as the drop area
		if (opts.addClassTo.length===0){
			opts.addClassTo = $dropArea;
		}

		//This option MUST be a function or else you can't really do anything...
		if(!$.isFunction(opts.onFileRead)){
			throw("The option 'onFileRead' is not set to a function!");
		}

		return opts;
	}

	//This is called for each initially selected DOM element
	function _setEvents(){
		var $dropArea = $(this);

		//can't bind these events with jQuery!
		this.addEventListener('dragenter', function(ev){
			_events._over(ev, $dropArea, opts);
		}, false);
		this.addEventListener('dragover', function(ev){
			_events._exit(ev, $dropArea, opts);
		}, false);
		this.addEventListener('drop', function(ev){
			_events._drop(ev, $dropArea, opts);
		}, false);
	}

	//Default timer for when to remove the CSS class
	var _exitTimer = null;

	//
	var _events = {
		_over : function(ev, $dropArea, opts){
			$(opts.addClassTo).addClass(opts.overClass);
			_stopEvent(ev);
		},
		_exit : function(ev, $dropArea, opts){
			clearTimeout(_exitTimer);
			_exitTimer=setTimeout(function(){
				$(opts.addClassTo).removeClass(opts.overClass);
			},100);
			_stopEvent(ev);
		},
		_drop : function(ev, $dropArea, opts){
			$(opts.addClassTo).removeClass(opts.overClass);
			_stopEvent(ev);
			var fileList = ev.dataTransfer.files;

			//Create an array of file objects for us to fill in
			var fileArray = [];

			//Loop through each file
			for(var i = 0; i <= fileList.length; i++){

				//Create a new file reader to read the file
				var reader = new FileReader();

				//Create a closure so we can properly pass in the file information since this will complete async!
				var completeFn = (_handleFile)(fileList[i], fileArray, fileList.length, opts);

				//Different browsers impliment this in different ways, but call the complete function when the file has finished being read
				if(reader.addEventListener) {
					// Firefox, Chrome
					reader.addEventListener('loadend', completeFn, false);
				} else {
					// Safari
					reader.onloadend = completeFn;
				}

				//Actually read the file
				reader.readAsDataURL(fileList[i]);
			}
		}
	};

	//This is the complete function for reading a file,
	function _handleFile(theFile, fileArray, fileCount, opts) {
		//When called, it has to return a function back up to the listener event
		return function(ev){
			//Add the current file to the array
			fileArray.push({
				name: theFile.name,
				size: theFile.size,
				type: theFile.type,
				lastModified: theFile.lastModifiedDate,
				data: ev.target.result
			});
			
			//Once the correct number of items have been put in the array, call the completion function		
			if(fileArray.length == fileCount && $.isFunction(opts.onFileRead)){
				opts.onFileRead(fileArray, opts)
			}
		}
	}

	function _handleReaderLoadEnd(ev, fullFileName, opts) {
		var data = ev.target.result;
		if(data.length>1 && $.isFunction(opts.onFileRead)){
			opts.onFileRead(data, fullFileName)
		}
	}

	function _stopEvent(ev){
		ev.stopPropagation();
		ev.preventDefault();
	}
})(jQuery);