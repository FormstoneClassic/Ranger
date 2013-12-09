/*
 * Ranger Plugin [Formstone Library]
 * @author Ben Plum
 * @version 0.1.5
 *
 * Copyright © 2013 Ben Plum <mr@benplum.com>
 * Released under the MIT License <http://www.opensource.org/licenses/mit-license.php>
 */
 
if (jQuery) (function($) {
	
	// Default Options
	var options = {
		callback: $.noop,
		customClass: "",
		formatter: null,
		labels: true,
		labelMin: false,
		labelMax: false,
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
			return $(this).each(function(i) {
				var $input = $(this),
					$ranger = $input.next(".ranger");
				
				$input.attr("disabled", "disabled");
				$ranger.addClass("disabled");
			});
		},
		
		// Reset the layout
		reset: function(_data) {
			return $(this).each(function(i) {
				var $input = $(this),
					data = _data || $input.data("ranger");
				
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
			});
		},
		
		// Enable field
		enable: function() {
			return $(this).each(function(i) {
				var $input = $(this),
					$ranger = $input.next(".ranger");
				
				$input.attr("disabled", null);
				$ranger.removeClass("disabled");
			});
		},
		
		// Destroy ranger
		destroy: function() {
			return $(this).each(function(i) {
				var $input = $(this),
					$label = $("label[for=" + $input.attr("id") + "]"),
					$ranger = $input.next(".ranger"),
					$handle = $ranger.find(".ranger-handle");
				
				// Restore DOM / Unbind click events
				$ranger.off(".ranger")
					   .remove();
				$input.off(".ranger")
					  .removeClass("ranger-element");
			});
		}
	};
	
	// Private Methods
	
	// Initialize
	function _init(opts) {
		// Settings
		opts = $.extend({}, options, opts);
		
		// Apply to each element
		var $items = $(this);
		for (var i = 0, count = $items.length; i < count; i++) {
			_build($items.eq(i), opts);
		}
		return $items;
	}
	
	// Build
	function _build($input, opts) {
		if (!$input.data("ranger")) {
			// EXTEND OPTIONS
			$.extend(opts, $input.data("ranger-options"));
			
			if (!opts.formatter) {
				opts.formatter = _formatNumber;
			}
			
			var min = parseFloat($input.attr("min")) || 0,
				max = parseFloat($input.attr("max")) || 100,
				step = parseFloat($input.attr("step")) || 1,
				value = $input.val() || (min + ((max - min) / 2));
			
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
			var $ranger = $input.next(".ranger"),
				$track = $ranger.find(".ranger-track"),
				$handle = $ranger.find(".ranger-handle"),
				$output = $ranger.find(".ranger-output");
			
			if (opts.labels) {
				if (opts.vertical) {
					$ranger.prepend('<span class="ranger-label max">' + opts.formatter.call(this, (opts.labelMax) ? opts.labelMax : max) + '</span>')
						   .append('<span class="ranger-label min">' + opts.formatter.call(this, (opts.labelMin) ? opts.labelMin : min) + '</span>');
				} else {
					$ranger.prepend('<span class="ranger-label min">' + opts.formatter.call(this, (opts.labelMin) ? opts.labelMin : min) + '</span>')
						   .append('<span class="ranger-label max">' + opts.formatter.call(this, (opts.labelMax) ? opts.labelMax : max) + '</span>');
				}
			}
			
			// Check disabled
			if ($ranger.is(":disabled")) {
				$ranger.addClass("disabled");
			}
			
			opts = $.extend({
				$input: $input,
				$ranger: $ranger,
				$track: $track,
				$handle: $handle,
				$output: $output,
				min: min,
				max: max,
				step: step,
				stepDigits: step.toString().length - step.toString().indexOf("."),
				value: value
			}, opts);
			
			// Bind click events
			$input.on("focus.ranger", opts, _onFocus)
				  .on("blur.ranger", opts, _onBlur)
				  .on("change.ranger input.ranger", opts, _onChange);
			
			$ranger.on("mousedown.ranger", ".ranger-track", opts, _onTrackDown)
				   .on("mousedown.ranger", ".ranger-handle", opts, _onHandleDown)
				   .data("ranger", opts);
			
			pub.reset.apply($input, [opts]);
		}
	}
	
	// Handle track click
	function _onTrackDown(e) {
		e.preventDefault();
		e.stopPropagation();
		
		_onMouseMove(e);
		
		e.data.$ranger.addClass("focus");
		
		$("body").on("mousemove.ranger", e.data, _onMouseMove)
				 .one("mouseup.ranger", e.data, _onMouseUp);
	}
	
	// Handle ...handle click
	function _onHandleDown(e) {
		e.preventDefault();
		e.stopPropagation();
		
		e.data.$ranger.addClass("focus");
		
		$("body").on("mousemove.ranger", e.data, _onMouseMove)
				 .one("mouseup.ranger", e.data, _onMouseUp);
	}
	
	// Handle mouse move
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
	
	// Handle mouse up
	function _onMouseUp(e) {
		e.data.$ranger.removeClass("focus");
		
		$("body").off("mousemove.ranger");
	}
	
	// Handle focus
	function _onFocus(e) {
		var data = e.data;
		data.$ranger.addClass("focus");
	}
	
	// Handle blur
	function _onBlur(e) {
		var data = e.data;
		data.$ranger.removeClass("focus");
	}
	
	// Position handle within track
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
		
		if (data.vertical == true) {
			data.$handle.css({ bottom: ((1 - perc) * 100) + "%" });
			value = data.min + (data.max - value);
		} else {
			data.$handle.css({ left: (perc * 100) + "%" });
			value += data.min;
		}
		
		if (value != data.value) {
			data.$input.val(value)
					   .trigger("change", [ true ]);
			
			data.callback.call(data.$ranger, value);
			
			data.value = value;
		}
	}
	
	function _onChange(e, internal) {
		//console.log(e, internal);
	}
	
	function _formatNumber(number) {
		var parts = number.toString().split(".");
		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		return parts.join(".");
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