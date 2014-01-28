(function (enyo) {
	
	var kind = enyo.kind
		, mixin = enyo.mixin
		, clone = enyo.clone
		, getPath = enyo.getPath
		, isString = enyo.isString
		, uuid = enyo.uuid;
		
	var ProxyObject = enyo.ProxyObject
		, ObserverSupport = enyo.ObserverSupport
		, BindingSupport = enyo.BindingSupport
		, EventEmitter = enyo.EventEmitter;

	/**
		@public
		@class enyo.Model
	*/
	kind(
		/** @lends enyo.Model.prototype */ {
		name: "enyo.Model",
		kind: null,
		noDefer: true,
		
		/**
			@private
		*/
		mixins: [ProxyObject, ObserverSupport, BindingSupport, EventEmitter],
		
		/**
			@public
		*/
		isNew: true,
		
		/**
			@public
		*/
		primaryKey: "id",
		
		/**
			@private
		*/
		proxyObjectKey: "attributes",
		
		/**
			@public
			@method
		*/
		parse: function (data) {
			return data;
		},
		
		/**
			@private
			@method
		*/
		constructor: function (attrs, props, opts) {
			// ensure we have the requested properties
			props && mixin(this, props);
			
			// ensure we have a unique identifier that could potentially
			// be used in remote systems
			this.euid = uuid();

			// if necessary we need to parse the incoming attributes
			attrs = attrs? this.parse(attrs): null;
			
			// ensure we have the updated attributes
			this.attributes = this.attributes? clone(this.attributes): {};
			attrs && mixin(this.attributes, attrs);

			// now we need to ensure we have a store and register with it
			// this.store = isString(this.store)? getPath(this.store): this.store || enyo.store;
			this.store = this.store || enyo.store;

			// @TODO: The idea here is that when batch instancing records a collection
			// should be intelligent enough to avoid doing each individually or in some
			// cases it may be useful to have a record that is never added to a store?
			if (!opts || !opts.noAdd) {
				this.store.add(this);
			}
		}
	});

})(enyo);
