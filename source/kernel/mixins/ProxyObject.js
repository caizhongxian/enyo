(function (enyo) {
	
	var getPath = enyo.getPath
		, checkConstructor = enyo.checkConstructor
		, inherit = enyo.inherit
		, getLocal = enyo.getLocal
		, setLocal = enyo.setLocal
		, setPath = enyo.setPath
		, isObject = enyo.isObject;
	
	/**
		@public
		@mixin enyo.ProxyObject
	*/
	enyo.ProxyObject = {
		name: "ProxyObject",
		
		/**
			@public
		*/
		proxyObjectKey: "data",
		
		/**
			@public
			@method
		*/
		get: function (path) {
			var key = this.proxyObjectKey
				, proxy = this[key];
			
			return proxy && getPath.call(proxy, path);
		},
		
		/**
			@public
			@method
		*/
		set: function (path, is, opts) {
			var key = this.proxyObjectKey
				, proxy = this[key]
				, was, force;
			// for backwards compatibility
			force = isObject(opts)? opts.force: opts;
			
			if (proxy) {
				was = this.get(path);
				setPath.apply(proxy, arguments);
				
				if (this.notify && (force || was !== is || (opts && opts.compare && opts.compare(was, is)))) this.notify(path, was, is);
			}
		},
		
		/**
			@public
			@method
		*/
		getLocal: function (path) {
			return getPath.call(this, path);
		},
		
		/**
			@public
			@method
		*/
		setLocal: function (path, is, opts) {
			return setPath.call(this, path, is, opts);
		}
	};
	
})(enyo);