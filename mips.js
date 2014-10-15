var mips;
$(document).ready(
	function () {
		mips = (function() {
			var module = {};
			// NEED TO RESTRICT REGISTERS TO 32 BITS
			// CURRENTLY CANT REACH SIGN BIT FOR AND, OR, LUI
			var register = function () {
				this.bits = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0,
							 0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
				var parseBits = function (arg) {
					var tmpreg;
					if (arg instanceof register) {
						tmpreg = Object.create(arg);
					} else {
						var tmp = '0000000000000000000000000000000' + Number(arg).toString(2);
						tmp = tmp.substring(tmp.length-32,tmp.length);
						tmpreg = new register();
						tmpreg.bits = tmp.split('').map(function(x) { return parseInt(x,2); });
					}
					return tmpreg;
				};
				this.used = false;
				this.add = function (arg0, arg1) {
					if ((arg0 instanceof register) && (arg1 instanceof register)) {
						//alert(" " + this.bits.join('') + "\n+" + arg.bits.join(''));
						for (var i = this.bits.length-1; i > -1; --i) {
							this.bits[i] = arg0.bits[i] + arg1.bits[i];
							if (this.bits[i] > 1) {
								this.bits[i] -= 2;
								if (i > 0) this.bits[i-1] += 1;
							}
						}
						//alert(this.bits.join(''));
					} else {
						this.add(parseBits(arg0));
					}
				};
				this.sub = function (arg) {
					if (arg instanceof register) {
						var tmpreg = Object.create(arg);
						tmpreg.bits.map(function(x) { return (parseInt(x,2) == 1) ? 0 : 1; });
						tmpreg.add(1);
						this.add(tmpreg);
					} else {
						var tmpreg = parseBits(arg);
						tmpreg.bits = tmpreg.bits.map(function(x) { return (x == 1) ? 0 : 1; });
						tmpreg.add(1);
						this.add(tmpreg);
					}
				};
				this.and = function (arg) {
					if (arg instanceof register) {
						//alert(" " + this.bits.join('') + "\n&" + arg.bits.join(''));
						for (var i = this.bits.length-1; i > -1; --i) {
							this.bits[i] = this.bits[i] & arg.bits[i];
						}
						//alert(this.bits.join(''));
					} else {
						this.and(parseBits(arg));
					}
				};
				this.or = function (arg){
					if (arg instanceof register) {
						for (var i = this.bits.length-1; i > -1; --i) {
							this.bits[i] = this.bits[i] | arg.bits[i];
						}
					} else {
						this.or(parseBits(arg));
					}
				};
				this.nor = function (arg) {
					if (arg instanceof register) {
						for (var i = this.bits.length-1; i > -1; --i) {
							this.bits[i] = ((this.bits[i] | arg.bits[i]) == 1) ? 0 : 1;
						}
					} else {
						this.nor(parseBits(arg));
					}
				};
				this.val = function () {
					return parseInt(this.bits.join(''), 2);
				};
			};
			module.registers = {
				$zero:	new register(),
				$v0:	new register(),
				$v1:	new register(),
				$a0:	new register(), // Preserved
				$a1:	new register(), // Preserved
				$a2:	new register(), // Preserved
				$a3:	new register(), // Preserved
				$t0:	new register(),
				$t1:	new register(),
				$t2:	new register(),
				$t3:	new register(),
				$t4:	new register(),
				$t5:	new register(),
				$t6:	new register(),
				$t7:	new register(),
				$s0:	new register(), // Preserved
				$s1:	new register(), // Preserved
				$s2:	new register(), // Preserved
				$s3:	new register(), // Preserved
				$s4:	new register(), // Preserved
				$s5:	new register(), // Preserved
				$s6:	new register(), // Preserved
				$s7:	new register(), // Preserved
				$t8:	new register(),
				$t9:	new register(),
				$gp:	new register(), // Preserved
				$sp:	new register(), // Preserved
				$fp:	new register(), // Preserved
				$ra:	new register()  // Preserved
			};
			module.registers.$zero.used = true;
			var labels = {};
			var stack = (function () {
				var memory = [];
				var size = 0;
				var stackmodule = {};
				stackmodule.push = function (data) {
					memory[size++] = data;
				};
				stackmodule.pop = function () {
					var top = memory[size-1];
					delete memory[--size];
					return top;
				};
				stackmodule.size = function () {
					return size;
				};
				return stackmodule;
			})();
			var pc = 0;
			var errors = {
				numArgsError: "Not the correct number of arguments."
			}
			var checkArgs = function (args, format) {
				if (args.length != format.length) {
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
						module.registers[args[0]].add(module.registers[args[1]], module.registers[args[2]]);
				},
				sub: function (args) {
					if (checkArgs(args, 'rrr'))
						module.registers[args[0]].val = module.registers[args[1]].val - module.registers[args[2]].val;
				},
				slt: function (args) {
					if (checkArgs(args, 'rrr'))
						module.registers[args[0]].val = (module.registers[args[1]].val < module.registers[args[2]].val) ? 1 : 0;
				},
				and: function (args) {
					if (checkArgs(args, 'rrr'))
						module.registers[args[0]].val = module.registers[args[1]].val & module.registers[args[2]].val;
				},
				jr: function (args) {
					if (checkArgs(args, 'r'))
						pc = module.registers[args[0]].val;
				},
				nor: function (args) {
					if (checkArgs(args, 'rrr'))
						module.registers[args[0]].val = ~(module.registers[args[1]].val | module.registers[args[2]].val);
				},
				or: function (args) {
					if (checkArgs(args, 'rrr'))
						module.registers[args[0]].val = module.registers[args[1]].val | module.registers[args[2]].val;
				},
				sll: function (args) {
					if (checkArgs(args, 'rri'))
						module.registers[args[0]].val = module.registers[args[1]].val << Number(args[2]);
				},
				srl: function (args) {
					if (checkArgs(args, 'rri'))
						module.registers[args[0]].val = module.registers[args[1]].val >> Number(args[2]);
				},
				// I-type
				addi: function (args) {
					if (checkArgs(args, 'rri'))
						module.registers[args[0]].add( module.registers[args[1]], Number(args[2]) );
				},
				andi: function (args) {
					alert(module.registers[args[0]].val.toString(2));
					alert((Number(args[2]) | 0x00000000).toString(2));
					alert((0xFFFF0000).toString(2));
					if (checkArgs(args, 'rri'))
						module.registers[args[0]].val = module.registers[args[1]].val & (Number(args[2]) | 0xFFFF0000);
					alert(module.registers[args[0]].val.toString(2));
				},
				subi: function (args) {
					if (checkArgs(args, 'rri'))
						module.registers[args[0]].val = module.registers[args[1]].val - Number(args[2]);
				},
				beq: function(args) {
					if (checkArgs(args, 'rra'))
						if (module.registers[args[0]].val == module.registers[args[1]].val)
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
				},
				lui: function (args) {
					alert(module.registers[args[0]].val.toString(2));
					alert((Number(args[1]) << 16).toString(2));
					if (checkArgs(args, 'ri'))
						module.registers[args[0]].val = (module.registers[args[0]].val & 0x0000FFFF) | (Number(args[1]) << 16);
					alert(module.registers[args[0]].val.toString(2));
				},
				ori: function (args) {
					alert(module.registers[args[0]].val.toString(2));
					alert((Number(args[2]) & 0x0000FFFF).toString(2));
					if (checkArgs(args, 'rri'))
						module.registers[args[0]].val = module.registers[args[1]].val | (Number(args[2]) & 0x0000FFFF);
					alert(module.registers[args[0]].val.toString(2));
				},
				// J-type
				j: function (args) {
					if (checkArgs(args, 'a'))
						pc = labels[args[0]] - 1;
				}
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
					if (tokens.length == 1 || tokens.length == 3) {
						//alert(tokens[0]);
						labels[tokens[0].substring(0,tokens[0].length-1)] = pc;
					}
				}
				for (pc = 0; pc < lines.length; ++pc) {
					//alert("On line "+pc);
					var tokens = lines[pc].split(' ');
					switch(tokens.length) {
						case 1:
							//if (tokens[0].charAt(tokens[0].length-1) === ':')
								//labels[tokens[0].substring(0,tokens[0].length-1)] = pc;
							break;
						case 2:
							module.call(tokens[0], tokens[1].split(',').map(Function.prototype.call, String.prototype.trim));
							break;
						case 3:
							//labels[tokens[0].substring(0,tokens[0].length-1)] = pc;
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
			