(function (enyo) {
	
	var bind = enyo.bindSafely
		, isString = enyo.isString
		, isObject = enyo.isObject
		, isArray = enyo.isArray
		, isFunction = enyo.isFunction
		, where = enyo.where
		, forEach = enyo.forEach
		, indexOf = enyo.indexOf
		, toArray = enyo.toArray
		, clone = enyo.clone
		, keys = enyo.keys
		, map = enyo.map
		, find = enyo.find
		, filter = enyo.filter
		, inherit = enyo.inherit
		, uuid = enyo.uuid;
		
	var defaultConfig = {};
	
	/**
		@private
	*/
	function getComputed (path, fn) {
		var conf = getConfig.call(this, path)
			, ret;
		
		if (conf.cached) {
			ret = loc.dirty? (conf.value = fn.call(this)): conf.value;
			conf.dirty = false;
		} else {
			ret = fn.call(this);
		}
		
		return ret;
	}
	
	/**
		@private
	*/
	function getConfig (path) {
		var configs = this._computedConfig || (this._computedConfig = {})
			, loc = configs[path];
			
		return loc || ((loc = where(this.computed(), function (ln) {
			return ln.path == path;
		})) && (configs[path] = clone(loc))) || (configs[path] = defaultConfig);
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
			return 0 <= find(this.computed(), function (ln) {
				return ln.method === match || ln.path === match;
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
						return getComputed.call(this, path, ret);
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
		notifyObservers: inherit(function (sup) {
			return function (path, was, is) {
				if (this.isComputed(path)) {
					
				}
				
				sup.apply(this, arguments);
				
				
			};
		}),
		
		/**
			@private
			@method
		*/
		notify: inherit(function (sup) {
			return function (path, was, is) {
				if (this.isComputed(path)) {
					
				}
				
				sup.apply(this, arguments);
				
				
			};
		}),
		
		/**
			@private
			@method
		*/
		computed: function () {
			return this.kindComputed || (this.kindComputed = []);
		}
	};
	

	/**
		Hijack the original so we can add additional default behavior.
	*/
	var sup = enyo.concatHandler;

	enyo.concatHandler = function (ctor, props) {
	
		sup.call(this, ctor, props);
	
		// only matters if there are observers to manage in the properties
		if (props.computed && !isFunction(props.computed)) {
			var proto = ctor.prototype || ctor
				, computed = proto.kindComputed? proto.kindComputed.slice(): null
				, old;
		
			// the previous, still _ok_ but hopefully deprecated way of declaring
			// computed for a kind
			if (isObject(props.computed)) {
				// enyo.warn(
				// 	"enyo.ComputedSupport: see documentation on declaring computed properties to improve initialization time " +
				// 	"for kind `" + (props.kindName || proto.kindName) + "`"
				// );

				old = props.computed;
				props.computed = [];
				forEach(keys(old), function (fn) {
					var conf;
					old[fn] = filter(old[fn], function (ln) {
						return isString(ln)? true: (conf = ln && false);
					});
					
					forEach(old[fn], function (path) {
						props.computed.push({
							path: path,
							method: props[fn] || proto[fn],
							config: conf
						});
					});
				});
			}
		
			if (isArray(props.computed)) {
				computed = computed? computed.concat(props.computed): map(props.computed, function (ln) {
					isString(ln.method) && (ln.method = props[ln.method] || proto[ln.method]);
					return ln;
				});
			}
	
			delete props.computed;
			proto.kindComputed = computed;
		}
	};
	
})(enyo);