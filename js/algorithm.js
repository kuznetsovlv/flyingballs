(function () {
	"use strict";

	var DIRECTION = 1;
	var INTERVAL = 10;
	var ZERO = 0.028;

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

			var dt = (Date.now() - self.now) / INTERVAL;

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

			self.handler = on(document, 'mousemove', function (event) {
				moving.call(self.e, event);
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

		on(elem, 'mouseup', function (event) {
			off(document, 'mousemove', self.handler);
			if (self.velocities) {
				var last = self.velocities[self.velocities.length - 1];
				if (Math.abs(last.x) < ZERO && Math.abs(last.y) < ZERO)
					self.velocity = {x: 0, y: 0};
				else
					self.velocity = self.velocities.reduce(function (a, b) {return {x: a.x + b.x, y: a.y + b.y};});
			}
			
			delete self.velocities;
			this.style.left = '';
			this.style.top = '';
			this.style.margin = '';
			this.style.position = '';
			this.style.zIndex = '';
			self.x = event.clientX;
			self.y = event.clientY;
			if (inTarget(self.target, {x: event.clientX, y: event.clientY}))
				self.target.dispatchEvent(new CustomEvent('drop', {detail: self}));
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
			}
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
		}
	});

	function Planet (src) {
		this.e = new Image();
		this.e.src = src;
		this.e.style.position = 'absolute';
	}

	Object.defineProperties(Planet.prototype, {
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
			set: function (coords) {console.log(this.radius);
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
				if (!this.velocity)
					this.velocity = {};
				this.velocity.x = v.x;
				this.velocity.y = v.y;
				return this;
			},
			writable: false,
			enumerable: false,
			configurable: false
		},

		go: {
			value: function (a) {
				var position = this.center;

				this.center = {
					x: position.x + a * DIRECTION * this.velocity.x,
					y: position.y + a * DIRECTION * this.velocity.y
				}
			}
		}
	});

	function Space () {
		this.e = document.getElementsByTagName('main')[0];

		this.planets = [];

		this.store = new Store().show();

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
		console.log(space);
	}
})()