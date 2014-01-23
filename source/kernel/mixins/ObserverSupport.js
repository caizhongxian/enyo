(function (enyo) {
	
	var isString = enyo.isString
		, isObject = enyo.isObject
		, isArray = enyo.isArray
		, isFunction = enyo.isFunction
		, forEach = enyo.forEach
		, keys = enyo.keys
		, find = enyo.find
		, filter = enyo.filter
		, uuid = enyo.uuid
		, observerTable = {};
		
		
	/**
		@private
	*/
	function addObserver (path, fn, ctx) {
		if (path.indexOf(".") >= 0) {
			
		} else {
			
			this.observers().push({
				path: path,
				method: fn,
				ctx: ctx || this
			});
			
		}
		
		return this;
	}
	
	/**
		@private
	*/
	function removeObserver (path, fn) {
		var observers = this.observers()
			, idx;
			
		if (observers.length) {
			idx = find(observers, function (ln) {
				return ln.path == path && ln.method === fn;
			});
			idx >= 0 && observers.splice(idx, 1);
		}
		
		return this;
	}
	
	/**
		@private
	*/
	function notifyObservers (path, was, is) {
		if (this.isObserving()) {
			
			var observers = this.observers(path);
			
			if (observers.length) {
				forEach(observers, function (ln) {					
					ln.method.call(ln.ctx || (ln.ctx = this), was, is, path);
				}, this);
			}
			
		} else {
			enqueue.call(this, path, was, is);
		}
		
		return this;
	}
	
	/**
		@private
	*/
	function enqueue (path, was, is) {
		if (this._notificationQueueEnabled) {
			var queue = this._notificationQueue || (this._notificationQueue = {})
				, ln = queue[path] || (queue[path] = {});
		
			ln.was = was;
			ln.is = is;
		}
	}
	
	/**
		@private
	*/
	function flushQueue () {
		var queue = this._notificationQueue
			, path, ln;
		
		if (queue) {
			this._notificationQueue = null;
			
			for (path in queue) {
				ln = queue[path];
				this.notify(path, ln.was, ln.is);
			}
		}
	}
		
	/**
		@public
		@mixin
	*/
	enyo.ObserverSupport = {
		name: "ObserverSupport",
		
		/**
			@private
		*/
		_observing: true,
		
		/**
			@private
		*/
		_observeCount: 0,
		
		/**
			@private
		*/
		_notificationQueue: null,
		
		/**
			@private
		*/
		_notificationQueueEnabled: true,
		
		/**
			@public
			@method
		*/
		isObserving: function () {
			return this._observing;
		},
		
		/**
			@public
			@method
		*/
		observers: function (path) {
			var euid = this.euid || (this.euid = uuid())
				, loc;
				
			loc = observerTable[euid] || (observerTable[euid] = (
				this.kindObservers? this.kindObservers.slice(): []
			));
	
			return !path? loc: filter(loc, function (ln) {
				return ln.path == path;
			});
		},
		
		/**
			@public
			@method
		*/
		addObserver: function (path, fn, ctx) {
			return addObserver.call(this, path, fn, ctx);
		},
		
		/**
			@public
			@method
			@alias addObserver
		*/
		observe: function (path, fn, ctx) {
			return addObserver.call(this, path, fn, ctx);
		},
		
		/**
			@public
			@method
		*/
		removeObserver: function (path, fn) {
			return removeObserver.call(this, path, fn);
		},
		
		/**
			@public
			@method
			@alias removeObserver
		*/
		unobserve: function (path, fn) {
			return removeObserver.call(this, path, fn);
		},
		
		/**
			@public
			@method
		*/
		removeAllObservers: function (path) {
			var euid = this.euid
				, loc = euid && observerTable[euid];
			
			if (loc) {
				if (path) {
					observerTable[euid] = filter(loc, function (ln) {
						return ln.path != path;
					});
				} else {
					observerTable[euid] = null;
				}
			}
			
			return this;
		},
		
		/**
			@public
			@method
		*/
		notifyObservers: function (path, was, is) {
			return notifyObservers.call(this, path, was, is);
		},
		
		/**
			@public
			@method
			@alias notifyObservers
		*/
		notify: function (path, was, is) {
			return notifyObservers.call(this, path, was, is);
		},
		
		/**
			@public
			@method
		*/
		stopNotifications: function (noQueue) {
			this._observing = false;
			this._observeCount++;
			noQueue && this.disableNotificationQueue();
			return this;
		},
		
		/**
			@public
			@method
		*/
		startNotifications: function (queue) {
			this._observeCount && this._observeCount--;
			this._observeCount === 0 && (this._observing = true);
			queue && this.enableNotificationQueue();
			this.isObserving() && flushQueue.call(this);
			return this;
		},
		
		/**
			@public
			@method
		*/
		enableNotificationQueue: function () {
			this._notificationQueueEnabled = true;
			return this;
		},
		
		/**
			@public
			@method
		*/
		disableNotificationQueue: function () {
			this._notificationQueueEnabled = false;
			this._notificationQueue = null;
			return this;
		}
		
	};
	
	/**
		Hijack the original so we can add additional default behavior.
	*/
	var sup = enyo.concatHandler;
	
	// @NOTE: It seems like a lot of work but it really won't happen that much and the more
	// we push to kind-time the better for initialization time
	enyo.concatHandler = function (ctor, props) {
		
		sup.call(this, ctor, props);
		
		// only matters if there are observers to manage in the properties
		if (props.observers && !isFunction(props.observers)) {
			var proto = ctor.prototype || ctor
				, observers = proto.kindObservers? proto.kindObservers.slice(): null
				, old;
			
			// the previous, still _ok_ but hopefully deprecated way of declaring
			// observers for a kind
			if (isObject(props.observers)) {
				old = props.observers;
				props.observers = [];
				forEach(keys(old), function (fn) {
					forEach(old[fn], function (dep) {
						props.observers.push({
							path: dep,
							method: props[fn] || proto[fn]
						});
					});
				});
			} else {
				var xtra;
				
				props.observers = filter(props.observers, function (ln) {
					if (isString(ln.method)) {
						ln.method = props[ln.method] || proto[ln.method];
					}
					if (isArray(ln.path)) {
						xtra || (xtra = []);
						forEach(ln.path, function (path) {
							xtra.push({
								path: path,
								method: ln.method
							});
						});
						return false;
					}
					return true;
				});
				
				xtra && (props.observers = props.observers.concat(xtra));
			}
			
			observers = observers? observers.concat(props.observers): props.observers;
		
			delete props.observers;
			proto.kindObservers = observers;
		}
	};
	
})(enyo);