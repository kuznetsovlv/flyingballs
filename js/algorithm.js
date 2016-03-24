(function () {
	"use strict";

	function Cron (period) {
		this.period = period || CRON_PERIOD;
		this.tasks = {};
	}

	Object.defineProperties(Cron.prototype, {
		addTask: {
			value: function (action /*function*/, when /*ms*/, args /*Array*/, context) {
				var task = {
					action: action,
					args: args || [],
					context: context || this
				};

				when += Date.now();

				if (!this.tasks)
					this.tasks = {};

				if (!this.tasks[when])
					this.tasks[when] = [task];
				else
					this.tasks[when].push(task);
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		complete: {
			value: function () {
				var self = this;
				this.interval = setTimeout(function () {
					if (!self.tasks)
						self.tasks = {};

					for (var key in self.tasks) {
						if (parseInt(key) <= Date.now()) {
							var tasks = self.tasks[key];
							for (var i = 0, l = tasks.length; i < l; ++i) {
								var task = tasks[i];
								task.action.apply(task.context, task.args);
							}
							delete self.tasks[key];
						} else {
							break;
						}
					}
					self.complete();
				}, this.nexIntrval);
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		nexIntrval: {
			get: function () {
				var next;
				for (var key in this.tasks) {
					next = parseInt(key);
					break;
				}
				
				return next ? this.period : Math.min(Math.max(next - Date.now(), 0), this.period);
			},
			enumerable: false,
			configurable: false
		},

		removeTask: {
			value: function (action) {
				if (this.tasks) {
					for (var key in this.tasks) {
						var tasks = this.tasks[key];

						for (var i = 0; i < tasks.length; ++i) {
							if (action === tasks[i].action) {
								tasks.splice(i--, 1);
							}
						}
					}
				}

				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		shift: {
			value: function (shift) {
				var tasks = {};
				for (var key in this.tasks)
					tasks[parseInt(key) + shift] = this.tasks[key];
				this.tasks = tasks;
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		start: {
			value: function () {
				if (this.stoped)
					this.shift(Date.now() - this.stoped);
				return this.complete();
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		stop: {
			value: function () {
				if (this.interval) {
					clearTimeout(this.interval);
					delete this.interval;
					this.stoped = Date.now();
				}
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		}
	});

	var DIRECTION = 1; //Pseudoconstant to simple iverse velosities
	var STEP_PERIOD = 40;
	var CRON_PERIOD = 10;
	var ZERO = 0.028; //Half-width of the zero interval to pushing resting balls

	var CRON = new Cron(CRON_PERIOD);

	try {
		new CustomEvent("IE has CustomEvent, but doesn't support constructor");
	} catch (e) {

		window.CustomEvent = function(event, params) {
			var evt;
			params = params || {
				bubbles: false,
				cancelable: false,
				detail: undefined
			};

			params = params || {};

			if (!params.bubbles)
				params.bubbles = false;
			if (!params.cancelable)
				params.cancelable = false;
			evt = document.createEvent("CustomEvent");
			evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
			return evt;
		};

		CustomEvent.prototype = Object.create(window.Event.prototype);
	}

	function clone (o, keys, def) {
		if (!o || typeof o !== 'object')
			return o;
		var c = o instanceof Array? [] : {};
		if (keys) {
			keys = keys.split(',');
			for (var i = 0, length = keys.length; i < length; ++i) {
				var key = keys[i];
				if (key in o)
					c[key] = clone(o[key]);
				else if (def)
					c[key] = clone(def.value);
			}
		} else {
			for (var p in o) {
				if (o.hasOwnProperty(p)) {
					var v = o[p];
					if (v && typeof v === 'object')
						c[p] = clone(v);
					else
						c[p] = v;
				}
			}
		}
		return c;
	}

	function round (value, n) {
		return Math.round(value * Math.pow(10, n)) / Math.pow(10, n);
	}

	function on (target, type, handler) {
		function h (event) {
			event = event || window.event;
			return handler.call(target, event);
		}
		try {
			target.addEventListener(type, h, false);
		} catch (e) {
			target.attachEvent(['on', type].join(''), h);
		}
		return h;
	}

	function off (target, type, handler) {
		try {
			target.removeEventListener(type, handler, false);
		} catch (e) {
			target.detachEvent(['on', type].join(''), handler);
		}
	}

	function inTarget (target, coords) {
		var rect = target.getBoundingClientRect();
		return coords.x > rect.left && coords.x < rect.right && coords.y > rect.top &&  coords.y < rect.bottom;
	}

	function Ball (elem) {
		this.e = elem;

		this.velocity = {x: 0, y: 0};

		this.cron = CRON;

		this.target = document.getElementsByTagName('main')[0];

		var self = this;

		function moving (event) {
			this.style.left = [event.clientX - this.width / 2, 'px'].join('');
			this.style.top = [event.clientY - this.height / 2, 'px'].join('');

			this.style.cursor = inTarget(self.target, {x: event.clientX, y: event.clientY}) ? 'move' : '';
		}

		on(elem, 'mousedown', function (event) {
			this.style.left = [event.clientX - this.width / 2, 'px'].join('');
			this.style.top = [event.clientY - this.height / 2, 'px'].join('');
			this.style.margin = 0;
			this.style.position = 'fixed';
			this.style.zIndex = 10000;

			self.messureVelocity();

			var handler = on(document, 'mousemove', function (event) {
				moving.call(self.e, event);
			});

			var handler2 = on(document, 'mouseup', function (event) {
				off(document, 'mousemove', handler);
				off(document, 'mouseup', handler2);
				
				self.cron.removeTask(self.messureVelocity);

				for (var key in self.velocity)
					self.velocity[key] *= 50;

				elem.style.left = '';
				elem.style.top = '';
				elem.style.margin = '';
				elem.style.position = '';
				elem.style.zIndex = '';
				self.x = event.clientX;
				self.y = event.clientY;
				if (inTarget(self.target, {x: event.clientX, y: event.clientY}))
					self.target.dispatchEvent(new CustomEvent('drop', {detail: self}));
			});
		});

		on(elem, 'dragstart', function (event) {
			self.now = Date.now();
			self.x = event.clientX;
			self.y = event.clientY;
			if (event.preventDefault)
				event.preventDefault();
			else
				event.returnValue = false;
		});
	}

	Object.defineProperties(Ball.prototype, {
		hide: {
			value: function () {
				this.e.classList.add('hidden');
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		messureVelocity: {
			value: (function () {
				var x, y, t;

				function velocity () {
					var rect = this.e.getBoundingClientRect(),
					    now = Date.now();

					if (x !== undefined && y !== undefined && t !== undefined) {
						var dt = now - t;

						this.velocity = {
							x: (rect.left - x) / dt,
							y: (rect.top - y) / dt
						}
					}

					x = rect.left;
					y = rect.top;
					t = now;

					return this;
				};

				return function () {
					velocity.apply(this, []).cron.addTask(this.messureVelocity, 40, [], this);
					return this;
				};
			})(),
			writable: false,
			enumerable: false,
			configurable: false
		},

		show: {
			value: function () {
				this.e.classList.remove('hidden');
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		figure: {
			get: function () {
				return {
					src: this.e.src,
					hidden: this.e.classList.contains('hidden')
				}
			},
			enumerable: false,
			configurable: false
		}
		
	});

	function Store () {
		this.e = document.getElementsByClassName('ballstore')[0];
		this.r = document.getElementById('reload');

		this.balls = [];

		var imgs = this.e.getElementsByTagName('img');

		for (var i = 0, l = imgs.length; i < l; ++i) {
			var ball = new Ball (imgs[i]);
			ball.store = this;
			this.balls.push(ball);
		}

		var self = this;

		on(this.r, 'change', function (event) {
			if (this.checked)
				self.show();
		});
	}

	Object.defineProperties(Store.prototype, {
		reload: {
			get: function () {
				return this.r.checked;
			},
			set: function (v) {
				this.r.checked = !!v;
			},
			configurable: false
		},

		show: {
			value: function () {
				for (var i = 0, l = this.balls.length; i < l; ++i)
					this.balls[i].show();
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		restart: {
			value: function () {
				this.show().reload = false;
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		}
	});

	function Planet (src) {
		this.e = new Image();
		this.e.src = src;
		this.e.style.position = 'absolute';
		this.dens = 1;
		this.events = {
			impact: []
		};

		var self = this;

		on(this.e, 'impact', function (event) {
			var handlers = self.events[event.type];

			if (!handlers)
				return;

			for (var i = 0, l = handlers.length; i < l; ++i)
				handlers[i].call(self, event.detail);
		});
	}

	Object.defineProperties(Planet.prototype, {
		accelerate: {
			value: function (a) {
				if (!this.velocity)
					this.velocity = clone(a);
				else
					for (var key in a)
						this.velocity[key] = this.velocity[key] ? this.velocity[key] + a[key] : a[key];
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		bind: {
			value: function (parent) {
				this.parent = parent;
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		center: {
			get: function () {
				var coords = this.e.getBoundingClientRect();
				return {
					x: (coords.left + coords.right) / 2 - this.parent.left,
					y: (coords.top + coords.bottom) / 2 - this.parent.top
				};
			},
			set: function (coords) {
				this.e.style.left = [coords.x - this.radius, 'px'].join('');
				this.e.style.top = [coords.y - this.radius, 'px'].join('');
			},
			enumerable: false,
			configurable: false
		},

		emmit: {
			value: function (type, value) {
				this.e.dispatchEvent(new CustomEvent(type, {detail: value}));
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		inverse: {
			value: function (component) {
				this.velocity[component] *= -1;
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		mass: {
			get: function () {
				return Math.pow(this.radius, 3) * this.dens;
			},
			enumerable: false,
			configurable: false
		},

		on: {
			value: function (type, handler) {
				var handlers = this.events[type];
				if (handlers) {
					handlers.push(handler);
				} else {
					var self = this;
					this.events[type] = [handler];

					on(this.e, type, function (event) {
						var handlers = self.events[event.type];

						if ('detail' in event)
							event = event.detail;

					for (var i = 0, l = handlers.length; i < l; ++i)
						handlers[i].call(self, event);
					});
				}

				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		radius: {
			get: function () {
				return +this.e.width / 2;
			},
			set: function (r) {
				this.e.width = this.e.height = 2 * r;
			},
			enumerable: false,
			configurable: false
		},

		rectangle: {
			get: function () {
				return this.e.getBoundingClientRect();
			},
			enumerable: false,
			configurable: false
		},

		setVelocity: {
			value: function (v) {
				this.velocity = clone(v);

				for (var key in this.velocity)
					this.velocity[key] *= DIRECTION;

				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		figure: {
			get: function () {
				return {
					center: this.center,
					radius: this.radius,
					dens: this.dens,
					src: this.e.src,
					velocity: this.velocity
				};
			},
			enumerable: false,
			configurable: false
		},

		go: {
			value: function (a) {
				var position = this.center;
				for (var key in this.velocity) {
					position[key] = position[key] ? position[key] + a * this.velocity[key] : a * this.velocity[key];
				}
				this.center = position;
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		}
	});

	function Range (elem) {
		this.e = elem;

		this.slider = elem.getElementsByClassName('slider')[0];

		this.setValue(0);

		this.events = {
			change: []
		};

		var self = this;

		function move (event) {
			var rect = this.getBoundingClientRect(),
			    parentRect = this.parentNode.getBoundingClientRect(),
			    w = rect.right - rect.left,
			    l = parentRect.right - parentRect.left - w,
			    x = event.clientX - parentRect.left - w / 2;
			if (x < 0)
				x = 0;
			if (x > l)
				x = l;
			this.style.left = [x, 'px'].join('');

			self.value = x * 2 / l - 1;

			self.emmit('change', self.value);
		}

		on(elem, 'change', function (event) {
			var handlers = self.events[event.type];

			if (!handlers)
				return;

			for (var i = 0, l = handlers.length; i < l; ++i)
				handlers[i].call(self, event.detail);
		});

		on(this.slider, 'mousedown', function (event) {
			this.style.margin = 0;
			move.call(this, event);

			var handler = on(document, 'mousemove', function (event) {
				move.call(self.slider, event);
			});

			var handler2 = on(document, 'mouseup', function (event) {
				off(document, 'mousemove', handler);
				off(document, 'mousemove', handler2);
			});
		});

		on(this.slider, 'dragstart', function (event) {
			if (event.preventDefault)
				event.preventDefault();
			else
				event.returnValue = false;
		});

		on(window, 'resize', function (event) {
			self.setValue(self.value);
		});

	}

	Object.defineProperties(Range.prototype, {
		emmit: {
			value: function (type, value) {
				this.e.dispatchEvent(new CustomEvent(type, {detail: value}));
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		on: {
			value: function (type, handler) {
				var handlers = this.events[type];
				if (handlers) {
					handlers.push(handler);
				} else {
					var self = this;
					this.events[type] = [handler];

					on(this.e, type, function (event) {
						var handlers = self.events[event.type];

						if ('detail' in event)
							event = event.detail;

					for (var i = 0, l = handlers.length; i < l; ++i)
						handlers[i].call(self, event);
					});
				}

				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		setValue: {
			value: function (v) {
				this.value = v;
				this.slider.style.margin = 0;
				var slider = this.slider.getBoundingClientRect(),
				    e = this.e.getBoundingClientRect(),
				    w = slider.right - slider.left,
				    l = e.right - e.left - w;
				this.slider.style.left = [l * (v + 1) / 2, 'px'].join('');

				return this.emmit('change', v);
			},
			writable: false,
			enumerable: false,
			configurable: false
		}
	});

	function Gravitation () {

		var self = this;

		this.e = document.getElementById('gravitation');

		this.covers = this.e.getElementsByClassName('cover');

		this.switcher = this.e.getElementsByTagName('input')[0];

		this.display = this.e.getElementsByClassName('gvalue')[0];

		this.range = new Range (this.e.getElementsByClassName('guide')[0])
			.on('change', function (value) {
				self.G = self.MAX * value;
				self.display.textContent = round(self.G, 3);
			})
			.on('enabled', function (enabled) {this.emmit('change', (enabled && this.value || 0));});

		on(this.switcher, 'change', function (event) {
			self.range.emmit('enabled', this.checked);
			self.enable(this.checked);
		});
	}

	Object.defineProperties(Gravitation.prototype, {
		MAX: {
			value: 30,
			writable: false,
			enumerable: true,
			configurable: false
		},

		enable: {
			value: function (enable) {
				if (!arguments.length)
					enable = true;
				this.display.style.color = enable && '#00e6ec' || '';
				for (var i = 0, l = this.covers.length; i < l; ++i)
					this.covers[i].style.display = enable && 'none' || '';
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		restart: {
			value: function () {
				this.enable(false).switcher.checked = false;

				this.range.setValue(0).emmit('enabled', false);

				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		setValue: {
			value: function (v) {
				this.enable(v || this.switcher.checked).range.setValue(v / this.MAX);
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		}
	});

	function Space () {
		this.e = document.getElementsByTagName('main')[0];

		this.cron = CRON;

		this.planets = [];

		this.store = new Store().show();

		this.gravitation = new Gravitation();

		this.dropped = [];

		var self = this;

		on(this.e, 'drop', function (event) {
			if (event.preventDefault)
				event.preventDefault()
			else
				event.returnValue = true;

			for (var i = 0, l = self.dropped.length; i < l; ++i)
				self.dropped[i].call(self, event.detail);
		});

		on(document.getElementById('inverse'), 'click', function (event) {DIRECTION *= -1;}); // Change moving direction

		on(document.getElementById('slidebtn'), 'click', function (event) {
			var classList = document.body.classList;

			if (classList.contains('expanded'))
				classList.remove('expanded');
			else
				classList.add('expanded');
		});

		on(document.getElementById('restart'), 'click', function (event) {
			self.restart();
		});

		// on(window, 'unload', function (event) {
		// 	self.save();
		// });
	}

	Object.defineProperties(Space.prototype, {
		addPlanet: {
			value: function (obj, coords) {
				var p = new Planet(obj.e.src).bind(this).on('impact', function (values) {
				    	function _shift(o1, o2) {
				    		var res = {};
				    		for (var key in center)
				    			res[key] = (o1[key] || 0) - o2[key];
				    		return res;
				    	}
				    	var center = this.center,
				    	    delta = _shift(values.center, center);
				    	values.velocity = _shift(values.velocity, this.velocity);

				    	var d = 0;
				    	for (var key in delta)
				    		d += Math.pow(delta[key], 2);
				    	d = Math.sqrt(d);

				    	var dv = 0;

				    	for (var key in values.velocity)
						dv += Math.pow(values.velocity[key], 2);
				    	dv = Math.sqrt(dv);

				    	dv *= (values.velocity.x / dv) * (delta.x / d) + (values.velocity.y / dv) * (delta.y / d);

				    	if (dv * DIRECTION >= 0)
				    		return;

				    	dv *= 2 * values.mass / (this.mass + values.mass);

				    	for (var key in delta)
				    		this.velocity[key] = (this.velocity[key] || 0) + dv * delta[key] / d;

				    }),
				    self = this;
				this.e.appendChild(p.e);
				p.e.onload = function (event) {
					p.center = {x: coords.x, y: coords.y};
					p.setVelocity(obj.velocity);
					self.planets.push(p);
				}
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		bounds: {
			value: function () {
				var zone = this.rectangle;

				for (var i = 0, l = this.planets.length; i < l; ++i) {
					var planet = this.planets[i],
					    p = planet.rectangle,
					    center = planet.center;

					if (p.right >= zone.right) {
						center.x = zone.right - zone.left - planet.radius;
						center.changed = true;
						if (planet.velocity.x * DIRECTION > 0)
							planet.inverse('x');
					} else if (p.left <= zone.left) {
						center.x = planet.radius;
						center.changed = true;
						if (planet.velocity.x * DIRECTION < 0)
							planet.inverse('x');
					}

					if (p.bottom >= zone.bottom) {
						center.y = zone.bottom - zone.top - planet.radius;
						center.changed = true;
						if (planet.velocity.y * DIRECTION > 0)
							planet.inverse('y');
					} else if (p.top <= zone.top) {
						center.y = planet.radius;
						center.changed = true;
						if (planet.velocity.y * DIRECTION < 0)
							planet.inverse('y');
					}

					if (center.changed) {
						delete center.changed;
						planet.center = center;
					}
				} 

				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		configure: {
			value: function (data) {
				var state = data.state,
				    store = data.store,
				    zone = data.zone;

				DIRECTION = data.direction || DIRECTION;

				if (state) {
					var inputs = document.getElementsByTagName('input');

					for (var i = 0, l = inputs.length; i < l; ++i) {
						var field = inputs[i],
						    fieldState = state[field.id];
						    if (!fieldState)
						    	continue;
						    for (var key in fieldState)
						    	field[key] = fieldState[key];
					}

					if ('gravitation' in state)
						this.gravitation.setValue(+state.gravitation);
				}

				if (store) {
					for (var i = 0, l = this.store.balls.length; i < l; ++i) {
						var ball = this.store.balls[i],
						    src = ball.figure.src;

						for (var j = 0, l = store.length; j < l; ++j) {
							var fig = store[j];

							if (fig.src === src) {
								if (fig.hidden)
									ball.hide();
								break;
							}
						}

					}
				}

				if (zone) {
					if (zone.expanded)
						document.body.classList.add('expanded');

					var self = this;

					setTimeout(function () {
						for (var i = 0, l = zone.planets.length; i < l; ++i) {
							var planet = zone.planets[i];
							self.addPlanet({
								velocity: planet.velocity,
								e: {src: planet.src}
							}, planet.center);
						}
					}, 1000);
				}
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		grav: {
			value: function (planet) {

				function _accelerate (position, planet) {
					var center = planet.center,
					    delta = {};

					for (var key in center)
						delta[key] = center[key] - (position[key] || 0);

					var rr = 0, r;

					for (var key in delta)
						rr += Math.pow(delta[key], 2);
					r = Math.sqrt(rr, 2);

					var a = this.gravitation.G * planet.mass / rr;

					for (var key in delta)
						delta[key] *= a / r;

					return delta;
				}

				function _step (position, planet, h, dv, k) {
					var tmp = {};
					for (var key in position)
						tmp[key] = position[key] + h;

					tmp = _accelerate.call(this, tmp, planet);
					
					for (var key in tmp)
						dv[key] = (dv[key] || 0) + tmp[key] * k * DIRECTION;
				}

				function _rungeKutta(position, planet) {
					var p = planet.center,
					    r = 0;

					for (var key in position)
						r += Math.pow(position[key] - p[key], 2);
					var r = Math.sqrt(r),
					    h = 1 - Math.exp(-r / 10000),
					    dv = {};

					_step.call(this, position, planet, 0, dv, h);
					_step.call(this, position, planet, h / 2, dv, 4 * h);
					_step.call(this, position, planet, h, dv, h);

					return dv;
				}

				if (this.gravitation.G) {
					var n = this.planets.length;

					for (var i = 0; i < n; ++i) {
						var planet = this.planets[i];
						for (var j = 0; j < n; ++j) {
							if (i === j)
								continue;
							planet.accelerate(_rungeKutta.call(this, planet.center, this.planets[j]));
						}
					}
				}

				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		findImpacts: {
			value: function () {
				function _img (p) {
					return {
						center: p.center,
						velocity: clone(p.velocity),
						radius: p.radius,
						mass: p.mass
					};
				}
				var n = this.planets.length;

				for (var i = 0; i < n - 1; ) {
					var p1 = this.planets[i],
					    _p1 = _img(p1);

					for (var j = ++i; j < n; ++j) {
						var p2 =this.planets[j],
						    _p2 = _img(p2);

						if (Math.pow(_p1.center.x - _p2.center.x, 2) + Math.pow(_p1.center.y - _p2.center.y, 2) <= Math.pow(_p1.radius + _p2.radius, 2)) {
							p1.emmit('impact', _p2);
							p2.emmit('impact', _p1);
						}
					}
				}
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		impact: {
			value: function (a, b) {
				var a_c = a.center,
				    b_c = b.center,
				    k0 = - Math.pow((a.radius + b.radius) * 0.9, 2), //Multiplier 0.9 is to fix rounding problem
				    k1, k2;

				k1 = k2 = 0;

				for (var key in a_c) {

					var dx = (a_c[key] || 0) - (b_c[key] || 0),
					    dv = ((a.velocity[key] || 0) - (b.velocity[key] || 0)) * DIRECTION;

					k0 += dx * dx;
					k1 += dx * dv;
					k2 += dv * dv;
				}


				var d = k1 * k1 - k0 * k2;

				return d < 0 ? undefined : (- k1 - Math.sqrt(d)) / k2;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		impactForecast: {
			value: function () {
				this.step = 1;
				var n = this.planets.length,
				    tmp;
				for (var i = 0; i < n;) {

					var p = this.planets[i];

					if ((tmp = this.toWall(p)) > 0 && tmp < this.step)
						this.step = tmp;

					for (var j = ++i; j < n; ++j) {
						if ((tmp = this.impact(p, this.planets[j]) || 0) > 0 && tmp < this.step)
							this.step = tmp;
					}
				}
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		left: {
			get: function () {
				return this.e.getBoundingClientRect().left;
			},
			enumerable: false,
			configurable: false
		},

		move: {
			value: function () {
				for (var i = 0, l = this.planets.length; i < l; ++i)
					this.planets[i].go(this.step * DIRECTION);
				return this
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		ondropped: {
			value: function (handler) {
				this.dropped.push(handler);
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		rectangle: {
			get: function () {
				return this.e.getBoundingClientRect();
			},
			enumerable: false,
			configurable: false
		},

		restart: {
			value: function () {
				while (this.planets.length)
					this.e.removeChild(this.planets.shift().e);
				this.store.restart();
				this.gravitation.restart();
				this.cron.stop().start();
				DIRECTION = 1;
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		save: {
			value: function () {
				var data = {
					direction: DIRECTION,
					zone: {
						planets: [],
						expanded: document.body.classList.contains('expanded')
					},
					store: [],
					state: {}
				};

				var inputs = document.getElementsByTagName('input'),
				     props = 'disabled,value,checked'.split(',');

				for (var i = 0, l = inputs.length; i < l; ++i) {
					var field = inputs[i],
					    state = data.state[field.id] = {};
					for (var j = 0, n = props.length; j < n; ++j) {
						var p = props[j];
						state[p] = field[p];
					}
				}

				data.state.gravitation = this.gravitation.G;

				for (var i = 0, l = this.store.balls.length; i < l; ++i)
					data.store.push(this.store.balls[i].figure);

				for (var i = 0, l = this.planets.length; i < l; ++i)
					data.zone.planets.push(this.planets[i].figure);

				localStorage.setItem('data', JSON.stringify(data));
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		setTask: {
			value: function () {
				this.cron.addTask(function () {
					this.move()
						.bounds()
						.grav()
						.findImpacts()
						.impactForecast()
						.setTask().save();
				}, this.step * STEP_PERIOD, [], this);

				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		start: {
			value: function () {

				this.step = 1;

				var data = JSON.parse(localStorage.getItem('data'));

				if (data)
					this.configure(data);

				this.cron.start();

				return this.setTask();
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		stop: {
			value: function () {
				this.cron.stop();
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		top: {
			get: function () {
				return this.e.getBoundingClientRect().top;
			},
			enumerable: false,
			configurable: false
		},

		toWall: {
			value: function (o) {
				function _t (v, f, t) {
					return (t - f) / v;
				}
				var zone = this.rectangle,
				    planet = o.rectangle,
				    t;
				return Math.min(
					_t.apply(this, o.velocity.x * DIRECTION > 0 ? [o.velocity.x * DIRECTION, planet.right, zone.right] : [o.velocity.x * DIRECTION, planet.left, zone.left]),
					_t.apply(this, o.velocity.y * DIRECTION > 0 ? [o.velocity.y * DIRECTION, planet.bottom, zone.bottom] : [o.velocity.y * DIRECTION, planet.top, zone.top])
					);
			},
			writable: false,
			enumerable: false,
			configurable: false
		}
	});

	window.onload = function () {
		new Space()
			.ondropped(function(ball) {
				ball.hide();
				if (this.store.reload)
					setTimeout(function () {ball.show();}, 0);
				return this.addPlanet(ball, {x: ball.x - this.left, y: ball.y - this.top});
			})
			.start();
	}
})()