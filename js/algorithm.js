(function () {
	"use strict";

	var DIRECTION = 1; //Pseudoconstant to simple iverse velosities
	var STEP_PERIOD = 40;
	var CRON_PERIOD = 40;
	var ZERO = 0.028; //Half-width of the zero interval to pushing resting balls

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

		this.target = document.getElementsByTagName('main')[0];

		var self = this;

		function moving (event) {
			this.style.left = [event.clientX - this.width / 2, 'px'].join('');
			this.style.top = [event.clientY - this.height / 2, 'px'].join('');

				this.style.cursor = inTarget(self.target, {x: event.clientX, y: event.clientY}) ? 'move' : '';

			var dt = (Date.now() - self.now) / STEP_PERIOD;

			if (dt) {
				var dx = event.clientX - self.x,
				    dy = event.clientY - self.y;
				if (!self.velocities)
					self.velocities = [{x: dx / dt, y: dy / dt}];
				else
					self.velocities.push({x: dx / dt, y: dy / dt});
				self.x = event.clientX;
				self.y = event.clientY;
				while(self.velocities.length > 20)
					self.velocities.shift();
			}
		}

		on(elem, 'mousedown', function (event) {
			this.style.left = [event.clientX - this.width / 2, 'px'].join('');
			this.style.top = [event.clientY - this.height / 2, 'px'].join('');
			this.style.margin = 0;
			this.style.position = 'fixed';
			this.style.zIndex = 10000;

			self.velocity = {x: 0, y:0};

			var handler = on(document, 'mousemove', function (event) {
				moving.call(self.e, event);
			});

			var handler2 = on(document, 'mouseup', function (event) {
				off(document, 'mousemove', handler);
				off(document, 'mouseup', handler2);
				if (self.velocities) {
					var last = self.velocities[self.velocities.length - 1];
					if (Math.abs(last.x) < ZERO && Math.abs(last.y) < ZERO) {
						self.velocity = {x: 0, y: 0};
					} else {
						self.velocity = self.velocities.reduce(function (a, b) {return {x: a.x + b.x, y: a.y + b.y};});
						self.velocity.x *= DIRECTION; //Consider current DIRECTION
						self.velocity.y *= DIRECTION;
					}
				}
			
				delete self.velocities;
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
		show: {
			value: function () {
				this.e.style.display = '';
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},
		hide: {
			value: function () {
				this.e.style.display = 'none';
				return this;
			},
			writable: false,
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

		setVelocity: {
			value: function (v) {
				this.velocity = clone(v);
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		go: {
			value: function (a) {
				var position = this.center;
				for (var key in this.velocity)
					position[key] = position[key] ? position[key] + a * DIRECTION * this.velocity[key] : a * DIRECTION * this.velocity[key];
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
		}
	});

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
					this.tasks.when.push(task);
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		complete: {
			value: function () {
				var self = this;
				this.interval = setInterval(function () {
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
				return this.complete(	);
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		stop: {
			value: function () {
				if (this.interval) {
					clearInterval(this.interval);
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

	function Space () {
		this.e = document.getElementsByTagName('main')[0];

		this.cron = new Cron (CRON_PERIOD).start();

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
	}

	Object.defineProperties(Space.prototype, {
		addPlanet: {
			value: function (obj, coords) {
				var p = new Planet(obj.e.src).bind(this),
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

		left: {
			get: function () {
				return this.e.getBoundingClientRect().left;
			},
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

		restart: {
			value: function () {
				while (this.planets.length)
					this.e.removeChild(this.planets.shift().e);
				this.store.restart();
				this.gravitation.restart();
				DIRECTION = 1;
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
		}
	});

	window.onload = function () {
		var space = new Space().ondropped(function(ball) {
			if (!this.store.reload)
				ball.hide();
			return this.addPlanet(ball, {x: ball.x - this.left, y: ball.y - this.top});
		});
	}
})()