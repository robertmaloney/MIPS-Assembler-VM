var mips;
$(document).ready(
	function () {
		mips = (function() {
			// Public Module
			var module = {};
			
			// MIPS Syntax Mode
			var mipsModes = { RDATA: 0, DATA: 1, TEXT: 2 };
			Object.freeze(mipsModes);
			var currentMode = null;
			
			// Reg File
			var register = function (init) {
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
				if (typeof(init) != "undefined") {
					var tmpreg = parseBits(init);
					this.bits = tmpreg.bits;
					delete tmpreg;
				}
				this.used = false;
				this.add = function (arg0, arg1) {
					if ((arg0 instanceof register) && (arg1 instanceof register)) {
						//alert(" " + this.bits.join('') + "\n+" + arg.bits.join(''));
						var tmpreg = new register();
						for (var i = this.bits.length-1; i > -1; --i) {
							tmpreg.bits[i] += arg0.bits[i] + arg1.bits[i];
							if (tmpreg.bits[i] > 1) {
								tmpreg.bits[i] -= 2;
								if (i > 0) tmpreg.bits[i-1] += 1;
							}
						}
						this.bits = tmpreg.bits;
						delete tmpreg;
					} else {
						this.add(parseBits(arg0),parseBits(arg1));
					}
				};
				this.sub = function (arg0, arg1) {
					if ((arg0 instanceof register) && (arg1 instanceof register)) {
						var tmpreg = Object.create(arg1);
						tmpreg.bits.map(function(x) { return (parseInt(x,2) == 1) ? 0 : 1; });
						tmpreg.add(tmpreg, 1);
						this.add(arg0, tmpreg);
						delete tmpreg;
					} else {
						var tmpreg = parseBits(arg1);
						tmpreg.bits = tmpreg.bits.map(function(x) { return (x == 1) ? 0 : 1; });
						tmpreg.add(tmpreg, 1);
						this.add(arg0, tmpreg);
						delete tmpreg;
					}
				};
				this.and = function (arg0, arg1) {
					if ((arg0 instanceof register) && (arg1 instanceof register)) {
						//alert(" " + this.bits.join('') + "\n&" + arg.bits.join(''));
						for (var i = this.bits.length-1; i > -1; --i) {
							this.bits[i] = arg0.bits[i] & arg1.bits[i];
						}
						//alert(this.bits.join(''));
					} else {
						this.and(parseBits(arg0), parseBits(arg1));
					}
				};
				this.or = function (arg0, arg1){
					if ((arg0 instanceof register) && (arg1 instanceof register)) {
						for (var i = this.bits.length-1; i > -1; --i) {
							this.bits[i] = arg0.bits[i] | arg1.bits[i];
						}
					} else {
						this.or(parseBits(arg0), parseBits(arg1));
					}
				};
				this.nor = function (arg0, arg1) {
					if ((arg0 instanceof register) && (arg1 instanceof register)) {
						for (var i = this.bits.length-1; i > -1; --i) {
							this.bits[i] = ((arg0.bits[i] | arg1.bits[i]) == 1) ? 0 : 1;
						}
					} else {
						this.nor(parseBits(arg0), parseBits(arg1));
					}
				};
				this.lui = function (arg) {
					var tmpreg = parseBits(arg);
					for (var i = 0; i < 16; ++i)
						this.bits[i] = tmpreg.bits[i+16];
					delete tmpreg;
				};
				this.set = function (arg) {
					for (var i = 0; i < this.bits.length; ++i)
						this.bits[i] = 0;
					//alert(arg);
					this.bits[31] = (arg) ? 1 : 0;
				};
				this.val = function () {
					return parseInt(this.bits.join(''), 2);
				};
				this.toString = function () {
					return ""+this.val();
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
					alert("Pushed onto stack. $ra: "+data.$ra.val());
					memory[size++] = data;
				};
				stackmodule.pop = function () {
					var top = memory[size-1];
					delete memory[--size];
					alert("Popped stack. $ra: "+top.$ra.val());
					return top;
				};
				stackmodule.size = function () {
					return size;
				};
				return stackmodule;
			})();
			
			// Data Segment
			var data = function () {
				this.value = null;
				this.isGlobal = false;
				this.file = null;
			};
			var dataSegment = [];
			module.getData = function () {
				return dataSegment;
			};
			
			var pc = 0;
			var errors = {
				numArgsError: "Not the correct number of arguments."
			}
			var checkArgs = function (args, format) {
				//alert(JSON.stringify(labels,null,4));
				if (args.length != format.length) {
					myconsole.error(errors.numArgsError);
					return false;
				}
				for (var i in args) {
					if (format.charAt(i) === 'r' && typeof(module.registers[args[i]]) === 'undefined') {
						myconsole.error("REGISTER "+args[i]+" DOES NOT EXIST.");
						return false;
					}
					else if (format.charAt(i) === 'i' && !$.isNumeric(args[i])) {
						myconsole.error(args[i]+" is not a number.");
						return false;
					}
					else if (format.charAt(i) === 'a' && typeof(labels[args[i]]) === 'undefined') {
						myconsole.error(args[i] + " is not a valid address.");
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
						module.registers[args[0]].sub(module.registers[args[1]], module.registers[args[2]]);
				},
				slt: function (args) {
					if (checkArgs(args, 'rrr'))
						module.registers[args[0]].set(module.registers[args[1]].val() < module.registers[args[2]].val());
				},
				and: function (args) {
					if (checkArgs(args, 'rrr'))
						module.registers[args[0]].and(module.registers[args[1]], module.registers[args[2]]);
				},
				jr: function (args) {
					if (checkArgs(args, 'r')) {
						pc = module.registers[args[0]].val();
						if (args[0] === "$ra") {
							var retvalues = [module.registers.$v0, module.registers.$v1];
							module.registers = stack.pop();
							module.registers.$v0.bits = retvalues[0].bits;
							module.registers.$v1.bits = retvalues[1].bits;
							delete retvalues;
						}
					}
				},
				nor: function (args) {
					if (checkArgs(args, 'rrr'))
						module.registers[args[0]].nor( module.registers[args[1]], module.registers[args[2]] );
				},
				or: function (args) {
					if (checkArgs(args, 'rrr'))
						module.registers[args[0]].or( module.registers[args[1]], module.registers[args[2]] );
				},
				sll: function (args) {
					if (checkArgs(args, 'rri'))
						module.registers[args[0]].sll( module.registers[args[1]], Number(args[2]) );
				},
				srl: function (args) {
					if (checkArgs(args, 'rri'))
						module.registers[args[0]].srl( module.registers[args[1]], Number(args[2]) );
				},
				// I-type
				addi: function (args) {
					if (checkArgs(args, 'rri'))
						module.registers[args[0]].add( module.registers[args[1]], Number(args[2]) );
				},
				andi: function (args) {
					if (checkArgs(args, 'rri'))
						module.registers[args[0]].and( module.registers[args[1]], Number(args[2]) );
				},
				subi: function (args) {
					if (checkArgs(args, 'rri'))
						module.registers[args[0]].sub( module.registers[args[1]], Number(args[2]) );
				},
				beq: function(args) {
					if (checkArgs(args, 'rra'))
						if (module.registers[args[0]].val() == module.registers[args[1]].val())
							pc = labels[args[2]] - 1;
				},
				bne: function(args) {
					if (checkArgs(args, 'rra'))
						if (module.registers[args[0]].val() != module.registers[args[1]].val())
							pc = labels[args[2]] - 1;
				},
				slti: function (args) {
					if (checkArgs(args, 'rri'))
						module.registers[args[0]].set(module.registers[args[1]].val() < Number(args[2]));
				},
				lui: function (args) {
					if (checkArgs(args, 'ri'))
						module.registers[args[0]].lui( Number(args[1]) );
				},
				ori: function (args) {
					if (checkArgs(args, 'rri'))
						module.registers[args[0]].or( module.registers[args[1]], Number(args[2]) );
				},
				// J-type
				j: function (args) {
					if (checkArgs(args, 'a'))
						pc = labels[args[0]] - 1;
				},
				jal: function (args) {
					if (checkArgs(args, 'a')) {
						stack.push(Object.create(module.registers));
						delete module.registers.$ra;
						module.registers.$ra = new register(pc);
						pc = labels[args[0]] - 1;
					}
				}
			};
			var mipsClear = function () {
				dataSegment = {};
				var tmpreg = new register();
				for (var reg in module.registers) {
					module.registers[reg].bits = tmpreg.bits;
					module.registers[reg].used = tmpreg.used;
				};
				delete tmpreg;
				module.registers.$zero.used = true;
				labels = {};
			};
			module.call = function (command, args) {
				//alert(command + ' | ' + args);
				if (typeof(ops[command]) !== 'undefined')
					ops[command](args);
			};
			module.runFile = function (lines) {
				mipsClear();
				dataSegment[0] = {};
				for (pc = 0; pc < lines.length; ++pc) {
					lines[pc] = lines[pc].trim().replace(/,[\t\s]*/g,',').replace(/[\t\s]+/g, ' ');
					//alert(lines[pc]);
					var tokens = lines[pc].split(' ');
					switch (tokens.length) {
						// Assembly Directive or Label
						case 1:
							if (currentMode == mipsModes.TEXT && tokens[0].indexOf(":") > -1)
								labels[tokens[0].substring(0,tokens[0].length-1)] = pc;
							else if (tokens[0].indexOf(":") == -1 && tokens[0].indexOf(".") > -1)
								switch (tokens[0]) {
									case ".rdata": currentMode = mipsModes.RDATA; break;
									case ".data": currentMode = mipsModes.DATA; break;
									case ".text": currentMode = mipsModes.TEXT; break;
									default: myconsole.error("Misused directive " +tokens[0]); break;
								}
							break;
						// .globl
						case 2:
							if (tokens[0] === '.globl') {
								if (typeof(dataSegment[tokens[1]]) === 'undefined')
									dataSegment[0][tokens[1]] = new data();
								dataSegment[0][tokens[1]].global = true;
							}
							break;
						// Data or Label + Instruction
						case 3:
							switch (currentMode) {
								case mipsModes.TEXT:
									if (tokens[1].indexOf(".") == -1)
										labels[tokens[0].substring(0,tokens[0].length-1)] = pc;
									else
										myconsole.error("Can't initialize data in text segment: " +tokens[0].substring(0,tokens[0].length-1));
									break;
								default:
									var dataname = tokens[0].substring(0,tokens[0].length-1);
									if (typeof(dataSegment[0][dataname]) === 'undefined')
										dataSegment[0][dataname] = new data();
									dataSegment[0][dataname].file = "1";
									switch (tokens[1]) {
										case ".asciiz": case ".ascii":
											dataSegment[0][dataname].value = tokens[2];
											break;
										case ".byte": case ".word":
											dataSegment[0][dataname].value = tokens[2].split(",").map(function (el) {return new register(Number(el));});
											break;
										// ADD DOUBLE AND FLOAT SUPPORT
									}
									//alert(dataname+": "+dataSegment[0][dataname].value);
									break;
							}
							break;
						default: break;
					}
				}
				for (pc = 0; pc < lines.length; ++pc) {
					//alert(lines[pc]);
					var tokens = lines[pc].split(' ');
					//alert(tokens.length);
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
			