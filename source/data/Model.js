(function (enyo) {
	
	var kind = enyo.kind
		, mixin = enyo.mixin
		, clone = enyo.clone
		// , oKeys = enyo.keys
		, only = enyo.only
		, getPath = enyo.getPath
		, isString = enyo.isString
		, isObject = enyo.isObject
		// , forEach = enyo.forEach
		, isFunction = enyo.isFunction
		, uid = enyo.uid
		, uuid = enyo.uuid
		, json = enyo.json
		, inherit = enyo.inherit;
		
	var ProxyObject = enyo.ProxyObject
		, ObserverSupport = enyo.ObserverSupport
		, ComputedSupport = enyo.ComputedSupport
		, BindingSupport = enyo.BindingSupport
		, EventEmitter = enyo.EventEmitter
		, ModelList = enyo.ModelList
		, oObject = enyo.Object;
	
	/**
		@private
	*/
	var BaseModel = kind({
		kind: null,
		mixins: [ObserverSupport, ComputedSupport, BindingSupport, EventEmitter/*, ProxyObject*/]
	});
	
	/**
		@public
		@class enyo.Model
	*/
	var Model = kind(
		/** @lends enyo.Model.prototype */ {
		name: "enyo.Model",
		kind: BaseModel,
		noDefer: true,
				
		/**
			@public
		*/
		attributes: null,
		
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
		isDirty: false,
		
		/**
			@public
		*/
		primaryKey: "id",
		
		/**
			@private
		*/
		// proxyObjectKey: "attributes",
		
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
				, keys = inc || Object.keys(attrs)
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
		get: function (path) {
			return this.isComputed(path)? this.getLocal(path): this.attributes[path];
		},
		
		/**
			@public
			@method
		*/
		set: function (path, is, opts) {
			
			var attrs = this.attributes
				, prev = this.previous
				, changed
				, incoming
				, force
				, silent
				, key
				, value;
				
			if (typeof path == "object") {
				incoming = path;
				opts || (opts = is);
			} else {
				incoming = {};
				incoming[path] = is;
			}
			
			if (opts === true) {
				force = true;
				opts = {};
			}
			
			opts || (opts = {});
			silent = opts.silent;
			force = force || opts.force;
			
			for (key in incoming) {
				value = incoming[key];
				
				if (value !== attrs[key] || force) {
					prev || (prev = this.previous = {});
					changed || (changed = this.changed = {});
					// assign previous value for reference
					prev[key] = attrs[key];
					changed[key] = attrs[key] = value;
				}
			}
			
			if (changed) {
				// must flag this model as having been updated
				this.isDirty = true;
				
				if (!silent && !this.isSilenced()) this.emit("change", changed, this);
			}
		},
		
		/**
			@private
			@method
		*/
		getLocal: ComputedSupport.get.fn(oObject.prototype.get),
		
		/**
			@private
			@method
		*/
		setLocal: ComputedSupport.set.fn(oObject.prototype.set),
		
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
			this.attributes = this.attributes? this.defaults? mixin({}, [this.defaults, this.attributes]): clone(this.attributes): this.defaults? clone(this.defaults): {};
			attrs && mixin(this.attributes, attrs);
			
			// now we need to ensure we have a store and register with it
			this.store = this.store || enyo.store;
			
			// @TODO: The idea here is that when batch instancing records a collection
			// should be intelligent enough to avoid doing each individually or in some
			// cases it may be useful to have a record that is never added to a store?
			if (!opts || !opts.noAdd) this.store.add(this, opts);
		},
		
		/**
			@private
		*/
		emit: inherit(function (sup) {
			return function (e, props) {
				if (e == "change" && props && this.isObserving()) {
					for (var key in props) this.notify(key, this.previous[key], props[key]);
				}
				return sup.apply(this, arguments);
			};
		}),
		
		/**
			@private
		*/
		triggerEvent: function () {
			return this.emit.apply(this, arguments);
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
