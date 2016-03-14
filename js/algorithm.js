(function () {
	"use strict";

	var DIRECTION = 1;
	var INTERVAL = 10;

	function on (target, type, handler) {
		try {
			target.addEventListener(type, handler, false);
		} catch (e) {
			target.attachEvent(['on', type].join(''), function (event) {
				event = event || window.event;
				return handler.call(target, event);
			});
		}
	}

	function Ball (elem) {
		this.e = elem;

		this.velocity = {x: 0, y: 0};

		var self = this;

		on(elem, 'dragstart', function (event) {
			var coords = this.getBoundingClientRect(),
			    parentPos = this.parentNode.getBoundingClientRect();

			self.x = coords.left - parentPos.left;
			self.y = coords.top - parentPos.top;
			self.now = Date.now();
			self.cursor = {
				x: event.clientX,
				y: event.clientY
			};

			self.velocities = [];

			event.dataTransfer.setData("text", this.src);
			event.dataTransfer.effectAllowed = 'move';

			try {
				event.dataTransfer.setDragImage(this, (coords.right - coords.left) / 2, (coords.bottom - coords.top) / 2);
			} catch (e) {

			}

			self.store.dropped = self;
		});

		on(elem, 'drag' , function (event) {
			var now = Date.now(),
			    dt = (now - self.now) / INTERVAL;

			if (dt < 2)
				return;
			var dx = event.clientX - self.cursor.x,
			    dy = event.clientY - self.cursor.y;
			self.x += dx;
			self.y += dy;
			self.cursor = {
				x: event.clientX,
				y: event.clientY
			};

			
			self.now = now;
			self.velocities.push({
				x: dx / dt,
				y: dy / dt
			});

			self.velocity = {x: 0, y: 0};
			var l = self.velocities.length;

			if (l > 1) {
				var i = 2,
				    v = self.velocities[l - i];
				if (v.x || v.y)
					do {
						self.velocity.x += v.x;
						self.velocity.y += v.y;
						v = self.velocities[l - (++i)];
					} while (v && i <= 10)

				self.velocity.x /= (l - i);
				self.velocity.y /= (l - i);
			}
		});

		on(elem, 'dragend', function (event) {
			if (!/safari/i.test(window.navigator.userAgent) || /chrome/i.test(window.navigator.userAgent))
				return;
			var zone = document.getElementsByTagName('main')[0].getBoundingClientRect();
			console.log(window.navigator.userAgent);
			console.log(zone, event.clientX, event.clientY);
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

		on(this.e, 'dragover', function (event) {
			if (event.preventDefault)
				event.preventDefault()
			else
				event.returnValue = true;
			event.dataTransfer.dropEffect = 'move';
		});

		on(this.e, 'drop', function (event) {
			if (event.preventDefault)
				event.preventDefault()
			else
				event.returnValue = true;

			for (var i = 0, l = self.dropped.length; i < l; ++i)
				self.dropped[i].call(self, self.store.dropped, {x: event.clientX, y: event.clientY});
		});
	}

	Object.defineProperties(Space.prototype, {
		addPlanet: {
			value: function (obj, coords) {
				var p = new Planet(obj.e.src).bind(this)
				this.e.appendChild(p.e);
				p.center = {x: coords.x, y: coords.y};
				p.setVelocity(obj.velocity);
				this.planets.push(p);

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
		var space = new Space().ondropped(function(ball, coords) {
			if (!this.store.reload)
				ball.hide();
			return this.addPlanet(ball, {x: coords.x - this.left, y: coords.y - this.top});
		});
		console.log(space);
	}
})()