(function (enyo) {
	
	var kind = enyo.kind
		, mixin = enyo.mixin
		, clone = enyo.clone
		, oKeys = enyo.keys
		, only = enyo.only
		, getPath = enyo.getPath
		, isString = enyo.isString
		, isObject = enyo.isObject
		, forEach = enyo.forEach
		, isFunction = enyo.isFunction
		, uid = enyo.uid
		, uuid = enyo.uuid
		, json = enyo.json
		, inherit = enyo.inherit;
		
	var ProxyObject = enyo.ProxyObject
		, ObserverSupport = enyo.ObserverSupport
		, BindingSupport = enyo.BindingSupport
		, EventEmitter = enyo.EventEmitter
		, ModelList = enyo.ModelList;
		debugger
	/**
		@public
		@class enyo.Model
	*/
	var Model = kind(ProxyObject,
		/** @lends enyo.Model.prototype */ {
		name: "enyo.Model",
		kind: null,
		noDefer: true,
		
		/**
			@private
		*/
		mixins: [ObserverSupport, BindingSupport, EventEmitter],
		
		/**
			@public
		*/
		attributes: {},
		
		/**
			@public
		*/
		includeKeys: null,
		
		/**
			@public
		*/
		options: {},
		
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
			@public
			@method
		*/
		raw: function () {
			var inc = this.includeKeys
				, attrs = this.attributes
				, keys = inc || oKeys(attrs)
				, cpy = inc? only(inc, attrs): clone(attrs);
			forEach(keys, function (key) {
				var ent = this.get(key);
				if (isFunction(ent)) cpy[key] = ent.call(this);
				else if (ent && ent.raw) cpy[key] = ent.raw();
				else cpy[key] = ent;
			}, this);
			return cpy;
		},
		
		/**
			@public
			@method
		*/
		toJSON: function () {
			return json.stringify(this.raw());
		},
		
		/**
			@public
			@method
		*/
		destroy: function (opts) {
			// we flag this early so objects that receive an event and process it
			// can optionally check this to support faster cleanup in some cases
			// e.g. Collection/Store don't need to remove listeners because it will
			// be done in a much quicker way already
			this.destroyed = true;
			this.unsilence(true).emit("destroy");
			this.removeAllListeners();
			this.removeAllObservers();
			this.attributes = null;
			this.previous = null;
			this.changed = null;
			this.store = null;
			return this;
		},
		
		/**
			@public
			@method
		*/
		set: inherit(function (sup) {
			return function (path, is, force) {
				if (isObject(path)) {
					// here we want to determine if anything does actually become
					// updated so we know whether or not to issue our event
					this.changed = null;
					this.silence().stopNotifications();
					for (var key in path) this.set(key, path[key], force);
					this.unsilence().startNotifications();
					
					// if we have a changed object now we know with absolution that
					// we should emit the event
					if (this.changed && !this.isSilenced()) this.emit("change", this.changed);
				} else {
					var previous = this.previous
						, changed = this.changed
						, was = this.get(path);
					
					sup.apply(this, arguments);
					
					if (force || was !== is) {
						previous || (this.previous = previous = {});
						changed || (this.changed = changed = {});
						previous[path] = was;
						changed[path] = is;
						!this.isSilenced() && this.emit("change", changed);
					}
				}
				return this;
			};
		}),
		
		/**
			@private
			@method
		*/
		constructor: function (attrs, props, opts) {
			opts = opts? (this.options = mixin({}, [this.options, opts])): this.options;
			
			// ensure we have the requested properties
			props && mixin(this, props);
			
			// ensure we have a unique identifier that could potentially
			// be used in remote systems
			this.euid = this.euid || uid("m");

			// if necessary we need to parse the incoming attributes
			attrs = attrs? opts.parse? this.parse(attrs): attrs: null;
			
			// ensure we have the updated attributes
			this.attributes = this.attributes? clone(this.attributes): {};
			attrs && mixin(this.attributes, attrs);

			// now we need to ensure we have a store and register with it
			this.store = this.store || enyo.store;

			// @TODO: The idea here is that when batch instancing records a collection
			// should be intelligent enough to avoid doing each individually or in some
			// cases it may be useful to have a record that is never added to a store?
			if (!opts || !opts.noAdd) {
				this.store.add(this);
			}
		}
	});
	
	/**
		@private
		@static
	*/
	Model.concat = function (ctor, props) {
		var proto = ctor.prototype || ctor;
		
		if (props.options) {
			proto.options = mixin({}, [proto.options, props.options]);
			delete props.options;
		}
	};
	
	/**
		@private
	*/
	enyo.kind.features.push(function (ctor) {
		if (ctor.prototype instanceof Model) {
			!enyo.store.models[ctor.prototype.kindName] && (enyo.store.models[ctor.prototype.kindName] = new ModelList());
		}
	});

})(enyo);
