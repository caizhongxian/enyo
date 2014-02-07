(function (enyo) {
	
	var getPath = enyo.getPath
		, checkConstructor = enyo.checkConstructor
		, inherit = enyo.inherit
		, getLocal = enyo.getLocal
		, setLocal = enyo.setLocal
		, setPath = enyo.setPath;
	
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
		set: function (path, is, force) {
			var key = this.proxyObjectKey
				, proxy = this[key]
				, was;
			
			if (proxy) {
				was = this.get(path);
				setPath.apply(proxy, arguments);
				
				if ((force || was !== is) && this.notify) this.notify(path, was, is);
			}
		},
		
		/**
			@public
			@method
		*/
		getLocal: function (path) {
			return getLocal.call(this, path);
		},
		
		/**
			@public
			@method
		*/
		setLocal: function (path, is, force) {
			return setLocal.call(this, path, is, force);
		}
	};
	
})(enyo);