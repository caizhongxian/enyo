(function (enyo) {
	
	var kind = enyo.kind
		, only = enyo.only;
	
	var Source = enyo.Source;
	
	/**
		@public
		@class enyo.XHRSource
	*/
	kind(
		/** @lends enyo.XHRSource.prototype */ {
		name: "enyo.XHRSource",
		kind: Source,
		noDefer: true,
		
		/**
			@public
		*/
		requestKind: null,
		
		/**
			@public
		*/
		urlRoot: "",
		
		/**
			@public
			@method
		*/
		buildUrl: function (model, opts) {
			var url = opts.url || (model.getUrl? model.getUrl(): model.url);
			
			// ensure there is a protocol defined
			if (!(/^(.*):\/\//.test(url))) url = (model.urlRoot || this.urlRoot || urlRoot()) + "/" + url;
			return normalize(url);
		},
		
		/**
			@public
			@method
		*/
		go: function (opts) {
			var ctor = this.requestKind
				, options = only(this.allowed, opts)
				, xhr = new ctor(opts);
				
			xhr.response(function (xhr, res) {
				if (opts.success) opts.success(res, xhr);
			});
			xhr.error(opts.fail);
			xhr.go(opts.params);
		},
		
		/**
			@public
			@method
		*/
		find: function (ctor, opts) {
			var proto = ctor.prototype
				, url = "/find/" + proto.kindName;
			
			opts.url = this.buildUrl(proto, opts);
			opts.method = opts.method || "POST";
			opts.postBody = opts.attributes;
			this.go(opts);
		}
	});
	
	/**
		@private
	*/
	function urlRoot () {
		var url = location.protocol
			, path = location.pathname.split("/");
			
		url += ("//" + location.host);
		// if (path.length > 1 && path[path.length-1] == ".") path.pop();
		url += ("/" + path.join("/"));
		return url;
	}
	
	/**
		@private
	*/
	function normalize (url) {
		return url.replace(/([^:]\/)(\/+)/g, "$1");
	}
	
})(enyo);