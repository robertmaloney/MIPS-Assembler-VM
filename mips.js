var mips;
$(document).ready(
	function () {
		mips = (function() {
			var module = {};
			module.registers = {
				$zero:	{ val: 0, used: true },
				$v0:	{ val: 0, used: false },
				$v1:	{ val: 0, used: false },
				$a0:	{ val: 0, used: false }, // Preserved
				$a1:	{ val: 0, used: false }, // Preserved
				$a2:	{ val: 0, used: false }, // Preserved
				$a3:	{ val: 0, used: false }, // Preserved
				$t0:	{ val: 0, used: false },
				$t1:	{ val: 0, used: false },
				$t2:	{ val: 0, used: false },
				$t3:	{ val: 0, used: false },
				$t4:	{ val: 0, used: false },
				$t5:	{ val: 0, used: false },
				$t6:	{ val: 0, used: false },
				$t7:	{ val: 0, used: false },
				$s0:	{ val: 0, used: false }, // Preserved
				$s1:	{ val: 0, used: false }, // Preserved
				$s2:	{ val: 0, used: false }, // Preserved
				$s3:	{ val: 0, used: false }, // Preserved
				$s4:	{ val: 0, used: false }, // Preserved
				$s5:	{ val: 0, used: false }, // Preserved
				$s6:	{ val: 0, used: false }, // Preserved
				$s7:	{ val: 0, used: false }, // Preserved
				$t8:	{ val: 0, used: false },
				$t9:	{ val: 0, used: false },
				$gp:	{ val: 0, used: false }, // Preserved
				$sp:	{ val: 0, used: false }, // Preserved
				$fp:	{ val: 0, used: false }, // Preserved
				$ra:	{ val: 0, used: false }  // Preserved
			};
			var errors = {
				numArgsError: "Not the correct number of arguments."
			}
			var checkArgs = function (args, format) {
				if (args.length != 3) {
					myconsole.println(errors.numArgsError);
					return false;
				}
				for (var i in args) {
					if (format.charAt(i) === 'r' && typeof(module.registers[args[i]]) === 'undefined') {
						myconsole.println("REGISTER "+args[i]+" DOES NOT EXIST.");
						return false;
					}
					else if (format.charAt(i) === 'i' && !$.isNumeric(args[i])) {
						myconsole.println(args[i]+" is not a number.");
						return false;
					}
				}
				for (var i in args) {
					if (format.charAt(i) === 'r')
						module.registers[args[i]].used = true;
				}
				return true;
			}
			var add = function (args) {
				if (checkArgs(args, 'rrr'))
					module.registers[args[0]].val = module.registers[args[1]].val + module.registers[args[2]].val;
			};
			var sub = function (args) {
				if (checkArgs(args, 'rrr'))
					module.registers[args[0]].val = module.registers[args[1]].val - module.registers[args[2]].val;
			};
			var addi = function (args) {
				if (checkArgs(args, 'rri'))
					module.registers[args[0]].val = module.registers[args[1]].val + Number(args[2]);
			};
			var subi = function (args) {
				if (checkArgs(args, 'rri'))
					module.registers[args[0]].val = module.registers[args[1]].val - Number(args[2]);
			};
			var commands = ['add', 'sub', 'addi', 'subi'];
			var functions = [add, sub, addi, subi];
			module.call = function (command, args) {
				var i = $.inArray(command, commands);
				if (i != -1)
					functions[i](args);
			};
			return module;
		})();
	}
);
			