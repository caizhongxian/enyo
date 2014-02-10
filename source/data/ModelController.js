(function (enyo) {
	
	var kind = enyo.kind
		, inherit = enyo.inherit
		, isObject = enyo.isObject
		, mixin = enyo.mixin;
	
	var ProxyObject = enyo.ProxyObject
		, ObserverSupport = enyo.ObserverSupport
		, ComputedSupport = enyo.ComputedSupport
		, BindingSupport = enyo.BindingSupport
		, EventEmitter = enyo.EventEmitter
		, oObject = enyo.Object;
	
	/**
		@private
	*/
	var BaseModelController = kind({
		kind: null,
		mixins: [ObserverSupport, ComputedSupport, BindingSupport, EventEmitter, ProxyObject]
	});
	
	/**
		Model instance proxy.
	
		The _model_ property is a reserved word and will conflict with the controller if it is an attribute
		of the model instance being proxied.
	
		@NOTE: Rules of property resolution - if the controller can call hasOwnProperty -> true it will look
		locally or if the property is resolved to be a computed property otherwise assume the proxy.
	
		@public
		@class enyo.ModelController
	*/
	kind(
		/** @lends enyo.ModelController.prototype */ {
		name: "enyo.ModelController",
		kind: BaseModelController,
		
		/**
			@public
		*/
		model: null,
		
		/**
			@private
		*/
		proxyObjectKey: "model",
		
		/**
			@private
		*/
		observers: [
			{method: "onChange", path: "model"}
		],
		
		/**
			@private
			@method
		*/
		get: inherit(function (sup) {
			return function (path) {
				return this.hasOwnProperty(path) || this.isComputed(path)? this.getLocal(path): sup.apply(this, arguments);
			};
		}),
		
		/**
			@private
			@method
		*/
		set: inherit(function (sup) {
			return function (path) {
				return isObject(path) || (!this.hasOwnProperty(path) && !this.isComputed(path))? sup.apply(this, arguments): this.setLocal.apply(this, arguments);
			};
		}),
		
		/**
			@private
			@method
		*/
		getLocal: function () {
			return this._computedGet.apply(this, arguments);
		},
		
		/**
			@private
			@method
		*/
		setLocal: function () {
			return this._computedSet.apply(this, arguments);
		},
		
		/**
			@private
			@method
		*/
		onChange: function (was, is, path) {
			// unregister previous model if any
			was && was.off("*", this.onModelEvent, this);
			// register for events on new model if any
			is && is.on("*", this.onModelEvent, this);
		},
		
		/**
			@private
			@method
		*/
		onModelEvent: function (model, e, props) {
			switch (e) {
			case "change":
				this.emit(e, props, model);
				if (props) for (var key in props) this.notify(key, model.previous[key], props[key]);
				break;
			}
		},
		
		/**
			@private
			@method
		*/
		constructor: function (props) {
			// ensure we have our own model property
			this.model = null;
			// ensure we have access to the inheritable ComputedSupport get/set
			// as they are completely replaced by the ProxyObject mixin
			this._computedGet = ComputedSupport.get.fn(oObject.prototype.get);
			this._computedSet = ComputedSupport.set.fn(oObject.prototype.set);
			
			// adhere to normal approach to constructor properties hash
			props && mixin(this, props);
		},
		
		/**
			@public
			@method
		*/
		destroy: inherit(function (sup) {
			return function () {
				sup.apply(this, arguments);
				this.model && this.model.off("*", this.onModelEvent, this);
			};
		})
		
	});
	
})(enyo);