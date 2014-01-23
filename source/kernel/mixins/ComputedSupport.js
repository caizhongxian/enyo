(function (enyo) {
	
	var isString = enyo.isString
		, isObject = enyo.isObject
		, isArray = enyo.isArray
		, isFunction = enyo.isFunction
		, where = enyo.where
		, remove = enyo.remove
		, forEach = enyo.forEach
		, indexOf = enyo.indexOf
		, clone = enyo.clone
		, keys = enyo.keys
		, nar = enyo.nar
		, filter = enyo.filter
		, inherit = enyo.inherit;
		
	var defaultConfig = {};
	
	/**
		@private
	*/
	function getComputedValue (name, fn) {
		var conf = getConfig.call(this, name);
		
		if (conf.cached) {
			if (conf.dirty) {
				conf.dirty = false;
				conf.prev = conf.value;
				conf.value = fn.call(this);
			}
		} else {
			conf.prev = conf.value;
			conf.value = fn.call(this);
		}
		
		return conf.value;
	}
	
	/**
		@private
	*/
	function getConfig (name) {
		var configs = this._computedConfig || (this._computedConfig = {})
			, loc = configs[name];
		
		// to have a config entry for the given method we only need to access its
		// original configuration in one of them (there could be many) because it
		// is shared
		if (!loc) {
			loc = where(this.computed(), function (ln) {
				return ln.name == name;
			});
			
			configs[name] = loc = loc.config? clone(loc.config): defaultConfig;
		}
		
		return loc;
	}
	
	/**
		@private
	*/
	function queueComputed (path) {
		var queue = this._computedQueue || (this._computedQueue = [])
			, deps = filter(this.computed(), function (ln) {
				return ln.path == path;
			});
		
		forEach(deps, function (dep) {
			if (!queue.length || -1 == indexOf(dep, queue)) {
				queue.push(dep);
			}
		});
	}
	
	/**
		@private
	*/
	function flushComputed () {
		var queue = this._computedQueue
			, conf;
		
		this._computedQueue = null;
		queue && forEach(queue, function (ln) {
			conf = getConfig.call(this, ln.name);
			
			this.notify(ln.name, conf.prev, getComputedValue.call(this, ln.name, ln.method));
		}, this);
	}
	
	/**
		@public
		@mixin
	*/
	enyo.ComputedSupport = {
		name: "ComputedSupport",
		
		/**
			@public
			@method
		*/
		isComputed: function (match) {
			return !! where(this.computed(), function (ln) {
				return ln.method === match || ln.name == match;
			});
		},
		
		/**
			@public
			@method
		*/
		isComputedDependency: function (path) {
			return !! where(this.computed(), function (ln) {
				ln.path == path;
			});
		},
		
		/**
			@private
			@method
		*/
		get: inherit(function (sup) {
			return function (path) {
				var ret = sup.apply(this, arguments);
				
				// we only care to add to the workload if the return value is actually
				// a function - which is the most likely scenario to find a computed method
				if (isFunction(ret)) {
					if (this.isComputed(ret)) {
						ret = getComputedValue.call(this, path, ret);
					}
				}
				
				return ret;
			};
		}),
		
		/**
			@private
			@method
		*/
		set: inherit(function (sup) {
			return function (path) {
				return this.isComputed(this[path])? this: sup.apply(this, arguments);
			};
		}),
		
		/**
			@private
			@method
		*/
		notifyObservers: function () {
			return this.notify.apply(this, arguments);
		},
		
		/**
			@private
			@method
		*/
		notify: inherit(function (sup) {
			return function (path, was, is) {
				this.isComputedDependency(path) && queueComputed.call(this, path);
				sup.apply(this, arguments);
				this._computedQueue && flushComputed.call(this);
			};
		}),
		
		/**
			@private
			@method
		*/
		computed: function (match) {
			var computed = this.kindComputed || (this.kindComputed = nar);
			
			return !name? computed: filter(computed, function (ln) {
				return ln.method === match || ln.name == match;
			});
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
	
		// only matters if there are computed properties to manage
		if (props.computed && !isFunction(props.computed)) {
			var proto = ctor.prototype || ctor
				, computed = proto.kindComputed? proto.kindComputed.slice(): null
				, old;
		
			// the previous, still _ok_ but hopefully deprecated way of declaring
			// computed for a kind
			if (isObject(props.computed)) {
				old = props.computed;
				props.computed = [];
				forEach(keys(old), function (fn) {
					var deps = old[fn]
						, conf;
						
					conf = where(deps, function (ln) {
						if (isObject(ln)) {
							
							// deliberate modification of the array because we won't
							// be iterating any further
							remove(ln, deps);
							return true;
						}
					});
					
					forEach(deps, function (dep) {
						props.computed.push({
							method: props[fn] || proto[fn],
							name: fn,
							path: dep,
							config: conf
						});
					});
				});
			} else {
				var xtra;
				
				props.computed = filter(props.computed, function (ln) {
					if (isString(ln.method)) {
						ln.name = ln.method;
						ln.method = props[ln.method] || proto[ln.method];
					}
					if (isArray(ln.path)) {
						xtra || (xtra = []);
						forEach(ln.path, function (path) {
							xtra.push({
								path: path,
								name: ln.name,
								method: ln.method,
								config: ln.config
							});
						});
						return false;
					}
					return true;
				});
				
				xtra && (props.computed = props.computed.concat(xtra));
			}
			
			computed = computed? computed.concat(props.computed): props.computed;
			
			delete props.computed;
			proto.kindComputed = computed;
		}
	};
	
})(enyo);