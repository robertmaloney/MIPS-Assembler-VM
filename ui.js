var myconsole;
$(document).ready(
	function () {
		// Console Box
		myconsole = (function () {
			var wall = 9;
			var module = {};
			var prevCalls = [];
			var numCalls = 0, atCall = 0;
			function setSelectionRange(input, selectionStart, selectionEnd) {
				if (input.setSelectionRange) {
					input.focus();
					input.setSelectionRange(selectionStart, selectionEnd);
				}
				else if (input.createTextRange) {
					var range = input.createTextRange();
					range.collapse(true);
					range.moveEnd('character', selectionEnd);
					range.moveStart('character', selectionStart);
					range.select();
				}
			}
			module.newline = String.fromCharCode(13);
			module.checkCaret = function (event) {
				if ($('#consolebox').getSelection().start < wall)
					setSelectionRange(document.getElementById('consolebox'),wall,wall);
			};
			module.endCaret = function () {
				var cons = document.getElementById('consolebox');
				setSelectionRange(cons,cons.value.length,cons.value.length);
			};
			module.canDelete = function () {
				return $('#consolebox').getSelection().start > wall;
			};
			module.getWall = function () {
				return wall;
			};
			module.advanceWall = function (offset) {
				wall += offset;
			};
			module.print = function(str) {
				$('#consolebox').val($('#consolebox').val() + str);
				wall = $('#consolebox').val().length;
			};
			module.println = function(str) {
				$('#consolebox').val($('#consolebox').val() + str + module.newline);
				wall = $('#consolebox').val().length;
			};
			module.runCommand = function () {
				var call = $('#consolebox').val().substring(wall,$('#consolebox').getSelection().start);
				prevCalls[numCalls++] = call;
				atCall = numCalls;
				var command = call.substring(0, call.indexOf(' '));
				var args = call.substring(call.indexOf(' ')).split(',').map(Function.prototype.call, String.prototype.trim);
				module.println('');
				mips.call(command, args);
				refreshReg();
				module.print('>');
			};
			module.prevCall = function () {
				if (--atCall < 0) atCall = 0;
				if (atCall > -1 && atCall < numCalls) $('#consolebox').val($('#consolebox').val().substring(0,wall) + prevCalls[atCall]);
			}
			module.nextCall = function () {
				if (++atCall >= numCalls) {
					atCall = numCalls;
					$('#consolebox').val($('#consolebox').val().substring(0,wall));
				}
				if (atCall > -1 && atCall < numCalls) $('#consolebox').val($('#consolebox').val().substring(0,wall) + prevCalls[atCall]);
			}
			return module;
		})();
		
		myconsole.println('MIPS VM Console v0.0.1');
		myconsole.print('>');
		
		$("#consolebox").on(
			'keydown',
			function (kv) {
				//alert(kv.which);
				switch( kv.which ) {
					case 8:
						if (!myconsole.canDelete())
							kv.preventDefault();
						break;
					case 13:
						myconsole.runCommand();
						kv.preventDefault();
						break;
					case 38:
						myconsole.prevCall();
						kv.preventDefault();
						break;
					case 40:
						myconsole.nextCall();
						kv.preventDefault();
						break;
					case 37:
						if (!myconsole.canDelete())
							kv.preventDefault();
						break;
					default:
						break;
				}
			}
		);
		$("#consolebox").click(myconsole.checkCaret);
		
		// VarBox
		function refreshReg() {
			$('#varbox').html('');
			for (var prop in mips.registers) {
				var used = (mips.registers[prop].used) ? '' : 'unused';
				if (prop !== '$zero')
					$('#varbox').html($('#varbox').html() + '<span class="var '+used+'"><span class="varname">' + prop + ":</span>" + mips.registers[prop].val + '</span><br />');
				else
					$('#varbox').html($('#varbox').html() + '<span class="var '+used+'"><span style="padding-right:24px">' + prop + ":</span>" + mips.registers[prop].val + '</span><br />');

			}
		}
		$(document).on(
			'click',
			'.var',
			function (event) {
				$('#consolebox').val( $('#consolebox').val() + $(this).children('.varname').text().substring(0,3) );
				myconsole.endCaret();
			}
		);
		refreshReg();
	}
);