
$(document).ready(
	function () {
		var myconsole = (function () {
			var wall = 9;
			var module = {};
			module.newline = String.fromCharCode(13);
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
				module.println('');
				myconsole.println(call);
				module.print('>');
			};
			return module;
		})();
		
		myconsole.println('MIPS VM Console v0.0.1');
		myconsole.print('>');
		
		$("#consolebox").on(
			'keydown',
			function (kv) {
				$('#varbox').html($('#varbox').html() + 'Pressed ' + kv.which + '&#13;&#10;');
				switch( kv.which ) {
					case 8:
						if (!myconsole.canDelete())
							kv.preventDefault();
						break;
					case 13:
						$('#varbox').html($('#varbox').html() + 'Calling runCommand.' + myconsole.newline);
						myconsole.runCommand();
						$('#varbox').html($('#varbox').html() + 'Called runCommand.' + myconsole.newline);
						kv.preventDefault();
						break;
					default:
						break;
				}
			}
		);
		
	}
);