(function (enyo) {
	
	var getPath = enyo.getPath
		, inherit = enyo.inherit
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
		get: function () {
			var key = this.proxyObjectKey
				, proxy = this[key];
			
			return proxy && getPath.apply(proxy, arguments);
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
				
				if (force || was !== is) this.notify(path, was, is);
			}
		},
		
		/**
			@public
			@method
		*/
		getLocal: function () {
			return getPath.apply(this, arguments);
		},
		
		/**
			@public
			@method
		*/
		setLocal: function () {
			return setPath.apply(this, arguments);
		}
	};
	
})(enyo);