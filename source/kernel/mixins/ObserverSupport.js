(function (enyo) {
	
	var isString = enyo.isString
		, isObject = enyo.isObject
		, isArray = enyo.isArray
		, isFunction = enyo.isFunction
		// , forEach = enyo.forEach
		// , map = enyo.map
		, clone = enyo.clone
		// , keys = enyo.keys
		// , findIndex = enyo.findIndex
		// , filter = enyo.filter
		, uid = enyo.uid
		, inherit = enyo.inherit
		// , isInherited = enyo.isInherited
		, nop = enyo.nop
		, observerTable = {};
		
	var ObserverChain = enyo.ObserverChain
		, ObserverSupport;
		
	/**
		@private
	*/
	function addObserver (path, fn, ctx, opts) {
		
		var observers = this.observers();
		
		(observers[path] || (observers[path] = [])).push({
			method: fn,
			ctx: ctx || this
		});
		
		if ((!opts || !opts.noChain) && path.indexOf(".") > 0) {
			this.chains().push(new ObserverChain(path, this));
		}
		
		return this;
	}
	
	/**
		@private
	*/
	function removeObserver (obj, path, fn, ctx) {
		var observers = obj.observers(path)
			, chains = obj.chains()
			, idx, chain;
			
		if (observers && observers.length) {
			idx = observers.findIndex(function (ln) {
				return ln.method === fn && (ctx? ln.ctx === ctx: true);
			});
			idx > -1 && observers.splice(idx, 1);
		}
		
		if (chains.length && path.indexOf(".") > 0) {
			for (idx=chains.length-1; (chain=chains[idx]); --idx) {
				if (chain.path == path) {
					chains.splice(idx, 1);
					chain.destroy();
				}
			}
		}
		
		return obj;
	}
	
	/**
		@private
	*/
	function notifyObservers (obj, path, was, is) {
		if (obj.isObserving()) {
			
			var observers = obj.observers(path);
			
			if (observers && observers.length) for (var i=0, ln; (ln=observers[i]); ++i) {
				if (typeof ln.method == "string") obj[ln.method](was, is, path);
				else ln.method.call(ln.ctx || obj, was, is, path);
			}
			
		} else enqueue(obj, path, was, is);
		
		return obj;
	}
	
	/**
		@private
	*/
	function enqueue (obj, path, was, is) {
		if (obj._notificationQueueEnabled) {
			var queue = obj._notificationQueue || (obj._notificationQueue = {})
				, ln = queue[path] || (queue[path] = {});
		
			ln.was = was;
			ln.is = is;
		}
	}
	
	/**
		@private
	*/
	function flushQueue (obj) {
		var queue = obj._notificationQueue
			, path, ln;
		
		if (queue) {
			obj._notificationQueue = null;
			
			for (path in queue) {
				ln = queue[path];
				obj.notify(path, ln.was, ln.is);
			}
		}
	}
		
	/**
		@public
		@mixin
	*/
	ObserverSupport = enyo.ObserverSupport = {
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
			var euid = this.euid || (this.euid = uid("o"))
				, loc;
				
			loc = observerTable[euid] || (observerTable[euid] = (
				this._observers? clone(this._observers): {}
			));
			
			return path? loc[path]: loc;
		},
		
		/**
			@private
			@method
		*/
		chains: function () {
			return this._observerChains || (this._observerChains = []);
		},
		
		/**
			@public
			@method
		*/
		addObserver: function () {
			// @NOTE: In this case we use apply because of internal variable use of parameters
			return addObserver.apply(this, arguments);
		},
		
		/**
			@public
			@method
			@alias addObserver
		*/
		observe: function () {
			// @NOTE: In this case we use apply because of internal variable use of parameters
			return addObserver.apply(this, arguments);
		},
		
		/**
			@public
			@method
		*/
		removeObserver: function (path, fn, ctx) {
			return removeObserver(this, path, fn);
		},
		
		/**
			@public
			@method
			@alias removeObserver
		*/
		unobserve: function (path, fn, ctx) {
			return removeObserver(this, path, fn, ctx);
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
					loc[path] = null;
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
			return notifyObservers(this, path, was, is);
		},
		
		/**
			@public
			@method
			@alias notifyObservers
		*/
		notify: function (path, was, is) {
			return notifyObservers(this, path, was, is);
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
			this.isObserving() && flushQueue(this);
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
		},
		
		/**
			@private
			@method
		*/
		constructor: inherit(function (sup) {
			return function () {
				var chains, chain;
				
				// if there are any observers that need to create dynamic chains
				// we look for and instance those now
				if (this._observerChains) {
					chains = this._observerChains.slice();
					this._observerChains = [];
					for (var i=0; (chain=chains[i]); ++i) this.observe(chain.path, chain.method);
				}
				
				sup.apply(this, arguments);
			};
		}),
		
		/**
			@private
			@method
		*/
		destroy: inherit(function (sup) {
			return function () {
				sup.apply(this, arguments);
				
				if (this._observerChains) {
					for (var i=0, chain; (chain=this._observerChains[i]); ++i) chain.destroy();
					this._observerChains = null;
				}
			};
		})
		
	};
	
	/**
		Hijack the original so we can add additional default behavior.
	*/
	var sup = enyo.concatHandler;
	
	// @NOTE: It seems like a lot of work but it really won't happen that much and the more
	// we push to kind-time the better for initialization time
	enyo.concatHandler = function (ctor, props) {
		
		sup.call(this, ctor, props);
		
		if (props === ObserverSupport) return;

		var proto = ctor.prototype || ctor
			, observers = proto._observers? clone(proto._observers): {}
			, incoming = props.observers
			, chains;
			
		if (incoming && !isArray(incoming)) {
			(function () {
				var tmp = [], deps, name;
				// here is the slow iteration over the properties...
				for (name in props.observers) {
					// points to the dependencies of the computed method
					deps = props.observers[name];
					// create a single entry now for the method/computed with all dependencies
					tmp.push({method: name, path: deps});
				}
				incoming = tmp;
			}());
		}
		
		// this scan is required to figure out what auto-observers might be present
		for (var key in props) {
			if (key.slice(-7) == "Changed") {
				incoming || (incoming = []);
				incoming.push({method: key, path: key.slice(0, -7)});
			}
		}
		
		var addObserverEntry = function (path, method) {
			// we have to make sure that the path isn't a chain because if it is we add it
			// to the chains instead
			if (path.indexOf(".") > -1) (chains || (chains = [])).push({path: path, method: method});
			else {
				(observers[path] || (observers[path] = [])).push({method: method});
			}
		};
		
		if (incoming) incoming.forEach(function (ln) {
			// first we determine if the path itself is an array of paths to observe
			if (isArray(ln.path)) ln.path.forEach(function (en) { addObserverEntry(en, ln.method); });
			else addObserverEntry(ln.path, ln.method);
		});
		
		// we clear the key so it will not be added to the prototype
		delete props.observers;
		// we update the properties to whatever their new values may be
		proto._observers = observers;
		proto._observerChains = chains;
	};
	
})(enyo);