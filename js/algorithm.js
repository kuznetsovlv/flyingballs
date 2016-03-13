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

			event.dataTransfer.setData("text", event.target.src);

			this.style.margin = 0;
			this.style.left = [self.x, 'px'].join('');
			this.style.top = [self.y, 'px'].join('');
			this.style.zIndex = 10000;
		});

		on(elem, 'drag' , function (event) {
			var dx = event.clientX - self.cursor.x,
			    dy = event.clientY - self.cursor.y,
			    now = Date.now(),
			    dt = (now - self.now) / INTERVAL;
			self.x += dx;
			self.y += dy;
			self.cursor = {
				x: event.clientX,
				y: event.clientY
			};

			if (dt) {
				self.now = now;
				self.velocity = {
					x: dx / dt,
					y: dy / dt
				};
			}

			this.style.left = [self.x, 'px'].join('');
			this.style.top = [self.y, 'px'].join('');
			console.log(self.velocity);
		});

		on(elem, 'dragend', function (event) {
			this.style.margin = '';
			this.style.left = '';
			this.style.top = '';
			this.style.zindex = '';
		});
	}

	function Planet (src) {
		this.e = new Image();
		this.e.src = src;
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
				this.style.left = [coords.x - this.radius, 'px'].join('');
				this.style.top = [coords.y - this.radius, 'px'].join('');
			},
			enumerable: false,
			configurable: false
		},

		radius: {
			get: function () {
				return +this.width / 2;
			},
			set: function (r) {
				this.width = this.height = 2 * r;
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
	}

	Object.defineProperties(Space.prototype, {
		addPlanet: {
			value: function (obj, coords) {
				var p = new Planet(obj.e.src).bind(this)
				this.e.appendChild(p.e);
				p.center = {x: coords.x - this.left, y: coords.y - this.top};
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

		top: {
			get: function () {
				return this.e.getBoundingClientRect().top;
			},
			enumerable: false,
			configurable: false
		}
	});

	window.onload = function () {
		var space = new Space();

		var images = document.getElementsByClassName('ballstore')[0].getElementsByTagName('img');

		for (var i = 0, l = images.length; i < l; ++i)
			new Ball(images[i]);
	}
})()