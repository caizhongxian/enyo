(function (enyo) {
	
	var kind = enyo.kind
		, inherit = enyo.inherit
		, bind = enyo.bindSafely
		, isFunction = enyo.isFunction;
		
	var EventEmitter = enyo.EventEmitter
		, ModelList = enyo.ModelList;
	
	/**
		@private
	*/
	var BaseStore = kind({
		kind: enyo.Object,
		mixins: [EventEmitter]
	});
	
	/**
		@private
		@class Store
	*/
	var Store = kind(
		/** @lends Store.prototype */ {
		name: "enyo.Store",
		kind: BaseStore,
		
		/**
		*/
		batch: false,
		
		/**
		*/
		isDirty: false,
		
		/**
		*/
		changed: null,
		
		/**
		*/
		destroyed: null,
		
		/**
		*/
		created: null,
		
		/**
		*/
		computed: [
			{method: "changeset"}
		],
		
		/**
			@public
		*/
		changeset: function () {
			return {
				changed: this.changed.models(),
				destroyed: this.destroyed.models(),
				created: this.created.models()
			};
		},
		
		/**
			@private
			@method
		*/
		on: inherit(function (sup) {
			return function (ctor, e, fn, ctx) {
				if (isFunction(ctor)) {
					this.scopeListeners().push({
						scope: ctor,
						event: e,
						method: fn,
						ctx: ctx || this
					});
					
					return this;
				}
				
				return sup.apply(this, arguments);
			};
		}),
		
		/**
			@private
			@method
		*/
		addListener: function () {
			return this.on.apply(this, arguments);
		},
		
		/**
			@private
			@method
		*/
		emit: inherit(function (sup) {
			return function (ctor, e) {
				if (isFunction(ctor)) {
					var listeners = this.scopeListeners(ctor, e);
					
					if (listeners.length) {
						var args = toArray(arguments).slice(1);
						args.unshift(this);
						forEach(listeners, function (ln) {
							ln.method.apply(ln.ctx, args);
						});
						return true;
					}
					return false;
				}
				
				return sup.apply(this, arguments);
			};
		}),
		
		/**
			@private
			@method
		*/
		triggerEvent: function () {
			return this.emit.apply(this, arguments);
		},
		
		/**
			@private
			@method
		*/
		removeListener: inherit(function (sup) {
			return function (ctor, e, fn) {
				if (isFunction(ctor)) {
					var listeners = this.scopeListeners()
						, idx;
						
					if (listeners.length) {
						idx = find(listeners, function (ln) {
							return ln.scope === ctor && ln.event == e && ln.method === fn;
						});
						idx >= 0 && listeners.splice(idx, 1);
					}
					
					return this;
				}
				
				return sup.apply(this, arguments);
			};
		}),
		
		/**
			@private
			@method
		*/
		scopeListeners: function (scope, e) {
			return !scope? this._scopeListeners: filter(this._scopeListeners, function (ln) {
				return ln.scope === scope? !e? true: ln.event === e: false; 
			});
		},
			
		/**
			@private
			@method
		*/
		add: function (model, opts) {
			// @TODO: It should be possible to have a mechanism that delays this
			// work until a timer runs out (that is reset as long as add is continuing
			// to be called) and then flushes when possible unless a synchronous flush
			// is forced?
			
			var models = this.models[model.kindName]
				, created = this.created
				, batch = this.batch;
			
			/*!this.has(model) && */models.add(model);
			if (!model.headless) {
				model.on("*", this.onModelEvent, this);
				model.isNew && batch && created.add(model);
			}
			
			if (!opts || !opts.silent) this.emit(model, "add", {model: model});
			
			this.isDirty = batch;
			return this;
		},
		
		/**
			@private
			@method
		*/
		remove: function (model) {
			
			var models = this.models[model.kindName]
				, len = models.length
				, created = this.created
				, destroyed = this.destroyed
				, batch = this.batch;
				
			models.remove(model);
			if (models.length < len) {
				batch && (model.isNew? created.remove(model): destroyed.add(model));
				// we only need to remove the listener if the model isn't being removed
				// because it was destroyed (if it is then it will remove all listeners
				// more efficiently on its own)
				!model.destroyed && model.removeListener("*", this.onModelEvent, this);
			}
			
			this.isDirty = batch;
			return this;
		},
		
		/**
			@public
			@method
		*/
		has: function (ctor, model) {
			var models = this.models[ctor.prototype.kindName];
			return models && models.has(model);
		},
		
		/**
			@public
			@method
		*/
		contains: function (ctor, model) {
			return this.has(ctor, model);
		},
		
		/**
			@private
			@method
		*/
		onModelEvent: function (model, e) {
			this.log(arguments);
			
			switch (e) {
			case "destroy":
				this.remove(model);
				break;
			case "change":
				break;
			}
		},
		
		/**
			@public
			@method
		*/
		find: function () {
			
		},
		
		/**
			@public
			@method
		*/
		findLocal: function (ctor, fn, opts) {
			
		},
			
		/**
			@private
			@method
		*/
		constructor: inherit(function (sup) {
			return function () {
				sup.apply(this, arguments);
				this.changed = new ModelList();
				this.destroyed = new ModelList();
				this.created = new ModelList();
				this.models = {"enyo.Model": new ModelList()};
				
				// our overloaded event emitter methods need storage for
				// the listeners
				this._scopeListeners = [];
			};
		})
	});
	
	enyo.store = new Store();

})(enyo);
