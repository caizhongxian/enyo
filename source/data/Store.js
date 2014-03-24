(function (enyo) {
	
	var kind = enyo.kind
		, inherit = enyo.inherit
		, toArray = enyo.toArray
		, mixin = enyo.mixin
		
	var EventEmitter = enyo.EventEmitter
		, ModelList = enyo.ModelList
		, Runloop = enyo.Runloop;
		
	var runloop = new Runloop({
		interval: 15,
		
		preprocess: {
			add: function (props, added, queue) {
				added[props.model.euid] = props;
			},
			remove: function (props, removed, queue) {
				var added = queue.add
					, euid = props.model.euid;
					
				if (added && added[euid]) delete added[euid];
				removed[euid] = props;
			}
		},
		
		
		flush: function () {
			/**
				@NOTE: Processing order is prioritized as follows...
			
				1. add
				2. remove
				3. event
				4. remote
				5. findLocal
			*/
			
			// grab the existing queue and replace it...
			var queue = this.reset()
				, added = queue.add
				, removed = queue.remove
				
				// @NOTE: Events for current adding/removing will not be until second pass!
				, events = queue.event
				, remotes = queue.remote
				, findLocals = queue.findLocals
				, i, ln, store, model, opts, models;
			
			// handling any models that were added...
			if (added) for (i in added) {
				ln = added[i];
				model = ln.model;
				opts = ln.options;
				store = model.store;
				models = store.models[model.kindName];
				
				if (!model.destroyed) {
					// models.add(model);
					
					// if the model isn't headless/redundant
					if (!model.headless) model.on("*", store.onModelEvent, store);
					if (!opts || !opts.silent) store.emit("add", {model: model});
				}
			}
			
			// handling any models that were removed...
			if (removed) for (i in removed) {
				ln = removed[i];
				model = ln.model;
				opts = ln.options;
				store = model.store;
				
				// if the model isn't destroyed we need to remove the listener otherwise
				// the model will remove it on its own more efficiently
				!model.destroyed && model.off("*", store.onModelEvent, store);
			}
			
			// handling any events for this particular pass...
			if (events) for (i=0; (ln=events[i]); ++i) ln();
			
			// handling for remote requests
			if (remotes) for (i=0; (ln=remotes[i]); ++i) ln();
			
			// handling for findLocal requests
			if (findLocals) for (i=0; (ln=findLocals[i]); ++i) ln();
			
			this.done();
		}
	});
	
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
			@private
			@method
		*/
		on: inherit(function (sup) {
			return function (ctor, e, fn, ctx) {
				if (typeof ctor == "function") {
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
				var dit = this;
				
				runloop.add("event", function () {
					if (typeof ctor == "function") {
						var listeners = dit.scopeListeners(ctor, e);
					
						if (listeners.length) {
							var args = toArray(arguments).slice(1);
							args.unshift(dit);
							listeners.forEach(function (ln) {
								ln.method.apply(ln.ctx, args);
							});
							// return true;
						}
						// return false;
					}
				
					return sup.apply(dit, arguments);
				});
				
				// @TODO: This will incorrectly indicate that we had listeners for an event
				// even if we didn't need to fix
				return true;
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
		off: inherit(function (sup) {
			return function (ctor, e, fn) {
				if (typeof ctor == "function") {
					var listeners = this.scopeListeners()
						, idx;
						
					if (listeners.length) {
						idx = listeners.findIndex(function (ln) {
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
		removeListener: function () {
			return this.off.apply(this, arguments);
		},
		
		/**
			@private
			@method
		*/
		scopeListeners: function (scope, e) {
			return !scope? this._scopeListeners: this._scopeListeners.filter(function (ln) {
				return ln.scope === scope? !e? true: ln.event === e: false; 
			});
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
		add: function (model, opts) {			
			var models = this.models[model.kindName];
			models.add(model);
			runloop.add("add", {model: model, options: opts});
			return this;
		},
		
		/**
			@private
			@method
		*/
		remove: function (model, opts) {
			var models = this.models[model.kindName];
			models.remove(model);
			
			runloop.add("remove", {model: model, options: opts});
			return this;
		},
		
		/**
			@private
			@method
		*/
		onModelEvent: function (model, e) {
			// this.log(arguments);
			
			switch (e) {
			case "destroy":
				this.remove(model, model.options.syncStore);
				break;
			case "change":
				// @TODO: PrimaryKey/id change..
				break;
			}
		},
		
		/**
			@public
			@method
		*/
		remote: function (action, model, opts) {
			runloop.add("remote", function () {
				var source = opts.source || model.source
					, name;
			
				if (source) {
					if (source === true) for (name in enyo.sources) {
						source = enyo.sources[name];
						if (source[action]) source[action](model, opts);
					} else if (source instanceof Array) {
						source.forEach(function (name) {
							var src = enyo.sources[name];
							if (src && src[action]) src[action](models, opts);
						});
					} else if ((source = enyo.sources[source]) && source[action]) source[action](model, opts);
				}
			
				// @TODO: Should this throw an error??
			});
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
		findLocal: function (ctor, fn, ctx, opts, cb) {
			runloop.add("findLocal", function () {
			
				var models = this.models[ctor.prototype.kindName]
					, options = {all: true}
					, fin = cb || opts.success || opts.callback
					, found, method, ctx;
			
				// in cases where the request was merely passing a constructor
				// we assume it was asking for all of the models for that type
				if (arguments.length == 1) return models;
			
				// since we allow either a context and/or options hash as the
				// third parameter we have to check to see if we have either
				// and which is which
				if (ctx && !ctx.kindName) opts = ctx;
				opts = opts? mixin({}, [options, opts]): options;
			
				// and now the final check to make sure we have a context to run
				// the method from
				if (!ctx) ctx = opts.context || this;
			
				method = models && (opts.all? models.filter: models.where);
			
				// otherwise we attempt to iterate over the models if they exist
				// applying the function and passing the options along
				found = method && method.call(models, function (ln) {
					return fn.call(ctx, ln, opts);
				});
			
				// return the found model/models if any
				// return found;
				fin(found);
			});
			
			return this;
		},
			
		/**
			@private
			@method
		*/
		constructor: inherit(function (sup) {
			return function () {
				this.euid = "store";
				
				sup.apply(this, arguments);
				this.models = {"enyo.Model": new ModelList()};
				
				// our overloaded event emitter methods need storage for
				// the listeners
				this._scopeListeners = [];
			};
		})
	});
	
	enyo.store = new Store();

})(enyo);
