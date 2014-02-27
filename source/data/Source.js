(function (enyo) {
	
	var kind = enyo.kind
		, constructorForKind = enyo.constructorForKind
		, getPath = enyo.getPath
		, setPath = enyo.setPath
		, mixin = enyo.mixin;
		
	var sources = enyo.sources = {};
	
	/**
		@public
		@class enyo.Source
	*/
	var Source = kind(
		/** @lends enyo.Source.prototype */ {
		name: "enyo.Source",
		kind: null,
		noDefer: true,
		
		/**
			@private
			@method
		*/
		constructor: function (props) {
			if (props) mixin(this, props);
			// automatic coersion of name removing prefix
			this.name || (this.name = this.kindName.replace(/^(.*)\./, ""));
			// now add to the global registry of sources
			sources[this.name] = this;
		},
		
		/**
			@public
			@method
		*/
		fetch: function (model, opts) {
			//
		},
		
		/**
			@public
			@method
		*/
		commit: function (model, opts) {
			//
		},
		
		/**
			@public
			@method
		*/
		destroy: function (model, opts) {
			//
		},
		
		/**
			@public
			@method
		*/
		find: function (ctor, opts) {
			//
		},
		
		/**
			@public
			@method
		*/
		get: getPath,
		
		/**
			@public
			@method
		*/
		set: setPath
	});
	
	/**
		@public
		@static
	*/
	Source.create = function (props) {
		var ctor = (props && props.kind) || this;
		
		if (typeof ctor == "string") ctor = constructorForKind(ctor);
		
		return new ctor(props);
	};
	
	/**
		@private
		@static
	*/
	Source.concat = function (ctor, props) {
		ctor.create = Source.create;
	};
	
})(enyo);