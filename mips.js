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
			var labels = {};
			var pc = 0;
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
					else if (format.charAt(i) === 'a' && typeof(labels[args[i]]) === 'undefined') {
						myconsole.println(args[i] + " is not a valid address.");
						return false;
					}
				}
				for (var i in args) {
					if (format.charAt(i) === 'r')
						module.registers[args[i]].used = true;
				}
				return true;
			}
			
			// OPS
			var ops = {
				// R-type
				add: function (args) {
					if (checkArgs(args, 'rrr'))
						module.registers[args[0]].val = module.registers[args[1]].val + module.registers[args[2]].val;
				},
				sub: function (args) {
					if (checkArgs(args, 'rrr'))
						module.registers[args[0]].val = module.registers[args[1]].val - module.registers[args[2]].val;
				},
				slt: function (args) {
					if (checkArgs(args, 'rrr'))
						module.registers[args[0]].val = (module.registers[args[1]].val < module.registers[args[2]].val) ? 1 : 0;
				},
				// I-type
				addi: function (args) {
					if (checkArgs(args, 'rri'))
						module.registers[args[0]].val = module.registers[args[1]].val + Number(args[2]);
				},
				subi: function (args) {
					if (checkArgs(args, 'rri'))
						module.registers[args[0]].val = module.registers[args[1]].val - Number(args[2]);
				},
				beq: function(args) {
					if (checkArgs(args, 'rra'))
						if (module.registers[args[0]].val == module.registers[args[1]].val);
							pc = labels[args[2]] - 1;
				},
				bne: function(args) {
					if (checkArgs(args, 'rra'))
						if (module.registers[args[0]].val != module.registers[args[1]].val)
							pc = labels[args[2]] - 1;
				},
				slti: function (args) {
					if (checkArgs(args, 'rri'))
						module.registers[args[0]].val = (module.registers[args[1]].val < Number(args[2])) ? 1 : 0;
				}
				// J-type
			};
			module.call = function (command, args) {
				//alert(command + ' | ' + args);
				if (typeof(ops[command]) !== 'undefined')
					ops[command](args);
			};
			module.runFile = function (lines) {
				for (pc = 0; pc < lines.length; ++pc) {
					lines[pc] = lines[pc].trim().replace(/,[\t\s]*/g,',').replace(/\t/g, ' ');
					var tokens = lines[pc].split(' ');
					switch(tokens.length) {
						case 1:
							if (tokens[0].charAt(tokens[0].length-1) === ':')
								labels[tokens[0].substring(0,tokens[0].length-1)] = pc;
							break;
						case 2:
							module.call(tokens[0], tokens[1].split(',').map(Function.prototype.call, String.prototype.trim));
							break;/*
						case 3:
							if (tokens[0].charAt(tokens[0].length-1) === ':') {
								labels[tokens[0].substring(0,tokens[0].length-1)] = pc;
								module.call(tokens[1], tokens[2]);
							} else {
								module.call(tokens[0], );
							}
							break;*/
						case 3:
							labels[tokens[0].substring(0,tokens[0].length-1)] = pc;
							module.call(tokens[1], tokens[2].split(',').map(Function.prototype.call, String.prototype.trim));
							break;
						default:
							// ERROR
							break;
					}
					refreshReg();
				}
			};
			return module;
		})();
	}
);
			