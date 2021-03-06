var myconsole, refreshReg;

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

$(document).on('dblclick', '.tab',
	function (e) {
		if ($(this).attr('id') != 'newpage') {
			var oldname = $(this).text();
			$(this).html("<input type='text' id='renameTab' value='"+oldname+"' style='width: 90px; height: 22px'/>");
			setSelectionRange($('#renameTab')[0], 0, oldname.length);
		}
		e.preventDefault();
	}
);

$(document).on('click', ':not(#renameTab)',
	function (e) {
		if ( $('#renameTab').length > 0 ) {
			if ( $('#renameTab').val().length > 0 )
				$('#renameTab').parent().text($('#renameTab').val());
			else
				$('#renameTab').parent().text('unnamed');
		}
	}
);

$(document).on('keydown', '#renameTab',
	function (e) {
		if (e.which == 13) {
			if ( $(this).val().length > 0 )
				$(this).parent().text($(this).val());
			else
				$(this).parent().text('unnamed');
		}
	}
);

$(document).on('mousedown', '.tab',
	function (e) {
		e.preventDefault();
	}
);

$(document).ready(
	function () {
		$('textarea').keydown(
			function (kv) {
				if (kv.which == 9) {
					myconsole.checkCaret();
					var selection = $(this).getSelection();
					$(this).val( $(this).val().substring(0,selection.start) + "\t" + $(this).val().substring(selection.end));
					setSelectionRange($(this)[0], selection.start+1, selection.start+1);
					kv.preventDefault();
				}
			}
		);

		// Console Box
		myconsole = (function () {
			var wall = 9;
			var module = {};
			var prevCalls = [];
			var numCalls = 0, atCall = 0;
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
			module.clear = function () {
				$('#consolebox').val('');
			};
			module.print = function(str) {
				$('#consolebox').val($('#consolebox').val() + str);
				wall = $('#consolebox').val().length;
			};
			module.println = function(str) {
				$('#consolebox').val($('#consolebox').val() + str + module.newline);
				wall = $('#consolebox').val().length;
			};
			module.error = function(str) {
				$('#consolebox').val($('#consolebox').val() + "ERROR: " + str + module.newline);
				wall = $('#consolebox').val().length;
			};
			module.runCommand = function (call) {
				prevCalls[numCalls++] = call;
				atCall = numCalls;
				call = call.trim().replace(/,[\t\s]*/g,',').replace(/\t/g, ' ');
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
		myconsole.clear();
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
						myconsole.runCommand($('#consolebox').val().substring(myconsole.getWall(),$('#consolebox').val().length));
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
		refreshReg = function () {
			$('#varbox').html('');
			for (var prop in mips.registers) {
				var used = (mips.registers[prop].used) ? '' : 'unused';
				if (prop !== '$zero')
					$('#varbox').html($('#varbox').html() + '<span class="var '+used+'"><span class="varname">' + prop + ":</span>0x" + mips.registers[prop].val().toString(16).toUpperCase() + '</span><br />');
				else
					$('#varbox').html($('#varbox').html() + '<span class="var '+used+'"><span style="padding-right:24px">' + prop + ":</span>0x" + mips.registers[prop].val().toString(16).toUpperCase() + '</span><br />');
			}
			$('#varbox').html($('#varbox').html() + '--------------------<br />');
			var dataSegment = mips.getData();
			for (var file in dataSegment) {
				$('#varbox').html($('#varbox').html() + "File "+file+" Data:<br />");
				for (var data in dataSegment[file]) {
					$('#varbox').html($('#varbox').html() + data + ":\t" + dataSegment[file][data].value + "<br />");
				}
				$('#varbox').html($('#varbox').html() + "<br />");
			}
		}
		refreshReg();
		$(document).on(
			'click',
			'.var',
			function (event) {
				$('#consolebox').val( $('#consolebox').val() + $(this).children('.varname').text().substring(0,3) );
				myconsole.endCaret();
			}
		);

		// CodeBox
		$('#runfile').click(
			function () {
				myconsole.println("\nRunning File "+$('.tabfocused').text() + "...");
				mips.runFile($('#codebox').val().split("\n"));
				myconsole.print(">");
			}
		);
		var tabs = 1, tabfocused = 1;
		var fileData = [];
		$('#newpage').before( "<div class='tab tabfocused'>1</div>" );
		$(document).on(
			'click',
			'.tab',
			function (e) {
				if ($(this).attr('id') != 'newpage') {
					fileData[tabfocused] = $('#codebox').val();
					$('.tab').removeClass('tabfocused');
					$(this).addClass('tabfocused');
					tabfocused = Number($(this).text());
					$('#codebox').val(fileData[tabfocused]);
				} else {
					if (tabs < 13) {
						$(this).before( "<div class='tab'>"+(++tabs)+"</div>" );
						fileData[tabs] = "";
						$($('#filebar').children()[tabs-1]).trigger('click');
					}
				}
			}
		);
	}
);