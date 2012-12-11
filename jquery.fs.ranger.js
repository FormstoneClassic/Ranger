/*
 * Ranger Plugin [Formstone Library]
 * @author Ben Plum
 * @version 0.1
 *
 * Copyright © 2012 Ben Plum <mr@benplum.com>
 * Released under the MIT License <http://www.opensource.org/licenses/mit-license.php>
 */
 
if (jQuery) (function($) {
	
	// Default Options
	var options = {
		customClass: "",
		labels: true,
		vertical: false
	};
	
	// Public Methods
	var pub = {
		
		// Set Defaults
		defaults: function(opts) {
			options = $.extend(options, opts || {});
			return $(this);
		},
		
		// Disable field
		disable: function() {
			var $items = $(this);
			for (var i = 0, count = $items.length; i < count; i++) {
				var $input = $items.eq(i);
				var $ranger = $input.next(".ranger");
				
				$input.attr("disabled", "disabled");
				$ranger.addClass("disabled");
			}
			return $items;
		},
		
		// Reset the layout
		reset: function(_data) {
			var $items = $(this);
			var data;
			for (var i = 0, count = $items.length; i < count; i++) {
				data = _data || $items.eq(i).data("ranger");
				
				if (typeof data != "undefined") {
					data.stepCount = (data.max - data.min) / data.step;
					if (data.vertical == true) {
						data.trackHeight = data.$track.outerHeight();
						data.handleHeight = data.$handle.outerHeight();
						data.increment = data.trackHeight / data.stepCount;
					} else {
						data.trackWidth = data.$track.outerWidth();
						data.handleWidth = data.$handle.outerWidth();
						data.increment = data.trackWidth / data.stepCount;
					}
					
					var perc = data.$input.val() / (data.max - data.min);
					_position.apply(data.$input, [data, perc]);
			}
			}
			return $items;
		},
		
		// Enable field
		enable: function() {
			var $items = $(this);
			for (var i = 0, count = $items.length; i < count; i++) {
				var $input = $items.eq(i);
				var $ranger = $input.next(".ranger");
				
				$input.attr("disabled", null);
				$ranger.removeClass("disabled");
			}
			return $items;
		},
		
		// Destroy ranger
		destroy: function() {
			var $items = $(this);
			for (var i = 0, count = $items.length; i < count; i++) {
				var $input = $items.eq(i);
				var $label = $("label[for=" + $input.attr("id") + "]");
				var $ranger = $input.next(".ranger");
				var $handle = $ranger.find(".ranger-handle");
				
				// Restore DOM / Unbind click events
				$ranger.off(".ranger")
					   .remove();
				$input.off(".ranger")
					  .removeClass("ranger-element");
			}
			return $items;
		}
	};
	
	// Private Methods
	
	// Initialize
	function _init(opts) {
		opts = opts || {};
		
		// Define settings
		var settings = $.extend({}, options, opts);
		
		// Apply to each element
		var $items = $(this);
		for (var i = 0, count = $items.length; i < count; i++) {
			_build($items.eq(i), settings);
		}
		return $items;
	}
	
	// Build each
	function _build($input, opts) {
		if (!$input.data("ranger")) {
			var min = parseFloat($input.attr("min")) || 0;
			var max = parseFloat($input.attr("max")) || 100;
			var step = parseFloat($input.attr("step")) || 1;
			var value = $input.val() || ((max - min) / 2);
			
			var html = '<div class="ranger';
			if (opts.vertical) {
				html += ' ranger-vertical';
			}
			if (opts.labels) {
				html += ' ranger-labels';
			}
			html += '">';
			html += '<div class="ranger-track">';
			html += '<span class="ranger-handle">';
			html += '<span class="ranger-disc"></span>';
			html += '</span>';
			html += '</div>';
			html += '</div>';
			
			// Modify DOM
			$input.addClass("ranger-element")
				  .after(html);
			
			// Store plugin data
			var $ranger = $input.next(".ranger");
			var $track = $ranger.find(".ranger-track");
			var $handle = $ranger.find(".ranger-handle");
			var $output = $ranger.find(".ranger-output");
			
			if (opts.labels) {
				if (opts.vertical) {
					$ranger.prepend('<span class="ranger-label max">' + max + '</span>')
						   .append('<span class="ranger-label min">' + min + '</span>');
				} else {
					$ranger.prepend('<span class="ranger-label min">' + min + '</span>')
						   .append('<span class="ranger-label max">' + max + '</span>');
				}
			}
			
			// Check disabled
			if ($ranger.is(":disabled")) {
				$ranger.addClass("disabled");
			}
			
			var data = $.extend({
				$input: $input,
				$ranger: $ranger,
				$track: $track,
				$handle: $handle,
				$output: $output,
				min: min,
				max: max,
				step: step,
				stepDigits: step.toString().length - step.toString().indexOf(".")
			}, opts);
			
			// Bind click events
			$input.on("focus.ranger", data, _onFocus)
				  .on("blur.ranger", data, _onBlur);
			
			$ranger.on("mousedown.ranger", ".ranger-track", data, _onTrackDown)
				   .on("mousedown.ranger", ".ranger-handle", data, _onHandleDown)
				   .data("ranger", data);
			
			pub.reset.apply($input, [data]);
		}
	}
	
	function _onTrackDown(e) {
		e.preventDefault();
		e.stopPropagation();
		
		_onMouseMove(e);
		
		e.data.$ranger.addClass("focus");
		
		$("body").on("mousemove.ranger", e.data, _onMouseMove)
				 .one("mouseup.ranger", e.data, _onMouseUp);
	}
	
	function _onHandleDown(e) {
		e.preventDefault();
		e.stopPropagation();
		
		e.data.$ranger.addClass("focus");
		
		$("body").on("mousemove.ranger", e.data, _onMouseMove)
				 .one("mouseup.ranger", e.data, _onMouseUp);
	}
	
	function _onMouseMove(e) {
		var data = e.data;
		var offset = data.$track.offset();
		
		if (data.vertical == true) {
			var perc = (e.pageY - offset.top) / data.trackHeight;
		} else {
			var perc = (e.pageX - offset.left) / data.trackWidth;
		}
		_position.apply(data.$input, [data, perc]);
	}
	
	function _onMouseUp(e) {
		e.data.$ranger.removeClass("focus");
		
		$("body").off("mousemove.ranger");
	}
	
	function _onFocus(e) {
		var data = e.data;
		data.$ranger.addClass("focus");
	}
	
	function _onBlur(e) {
		var data = e.data;
		data.$ranger.removeClass("focus");
	}
	
	function _position(data, perc) {
		if (data.increment > 1) {
			if (data.vertical == true) {
				perc = (Math.round(perc * data.stepCount) * data.increment) / data.trackHeight;
			} else {
				perc = (Math.round(perc * data.stepCount) * data.increment) / data.trackWidth;
			}
		}
		if (perc < 0) perc = 0;
		if (perc > 1) perc = 1;
		
		var value = ((data.min - data.max) * perc);
		value = -parseFloat( value.toFixed(data.stepDigits) );
		
		//perc *= data.percentLimit;
		
		if (data.vertical == true) {
			data.$handle.css({ bottom: ((1 - perc) * 100) + "%" });
			value = data.min + (data.max - value);
		} else {
			data.$handle.css({ left: (perc * 100) + "%" });
			value += data.min;
		}
		
		console.log(value);
	}
	
	// Define Plugin
	$.fn.ranger = function(method) {
		if (pub[method]) {
			return pub[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return _init.apply(this, arguments);
		}
		return this;
	};
})(jQuery);