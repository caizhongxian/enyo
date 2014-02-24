(function (enyo) {
	
	var kind = enyo.kind
		, inherit = enyo.inherit
		, mixin = enyo.mixin
		, getPath = enyo.getPath;
	
	var Collection = enyo.Collection
		, ModelList = enyo.ModelList;
	
	/**
		@public
		@class enyo.FilterCollection
	*/
	var FilterCollection = kind(
		/** @lends enyo.FilterCollection.prototype */ {
		name: "enyo.FilterCollection",
		kind: Collection,
		noDefer: true,
		
		/**
			@public
		*/
		collection: null,
		
		/**
			@private
		*/
		activeCollection: null,
		
		/**
			@private
		*/
		isChildFilter: false,
		
		/**
			@public
		*/
		filters: null,
		
		/**
			@public
		*/
		activeFilter: null,
		
		/**
			@public
		*/
		defaultFilter: "default",
		
		/**
			@public
		*/
		filterDefaults: {
			kind: "enyo.FilterCollection"
		},
		
		/**
			@public
		*/
		options: {
			// @TODO: Left off here...persisting to an underlying collection when necessary
			persist: false
		},
		
		/**
			@private
		*/
		observers: [
			{path: "collection", method: "onCollectionChange"},
			{path: "activeCollection", method: "onActiveCollectionChange"},
			{path: "activeFilter", method: "onActiveFilterChange"}
		],
		
		/**
			@public
			@method
		*/
		filter: function (fn, opts) {
			
			// we break this down into separate paths, the first is the case that this is
			// a child filter
			if (this.isChildFilter) {
				var models, filtered;
				
				if (!fn || !(typeof fn == "function")) {
					models = fn;
					fn = this.method;
				}
				
				if (!models) models = this.models;

				if (fn) filtered = models.filter(fn);
				else filtered = models;
				
				if (models === this.models) this.set("models", filtered);
				return filtered;
				
			} else {
				
			}
			
			
			// @TODO: There is so much more that needs to be done here...
		},
		
		// filter: function (fn, opts) {
		// 	var options = {history: true, reset: true, silent: false}
		// 		, len = this.length
		// 		, models, ctx, filtered, silent, history;
		// 	!this.history && (options.history = false);
		// 	opts = opts? mixin({}, [options, opts]): options;
		// 	ctx = opts.context || this;
		// 	history = opts.history;
		// 	reset = opts.reset;
		// 	silent = opts.silent;
		// 	
		// 	this.lastFilter = {method: fn, options: opts};
		// 	
		// 	models = reset && history? this.reset({silent: true}).clone(): history? this.models.clone(): this.models;
		// 	history && this.pushHistory(models);
		// 	
		// 	filtered = models.filter(fn, ctx);
		// 	if (filtered.length != len) {
		// 		filtered = this.add(filtered, {create: false, find: false, purge: true, merge: false, silent: true});
		// 		!silent && this.notify("length", len, this.length);
		// 		!silent && this.emit("filter", {/* for backward compatibility */ records: filtered, /* prefered */ models: filtered});
		// 	}
		// 	return this.models;
		// },
		
		/**
			@public
			@method
		*/
		reset: function (opts) {
			// var options = {silent: false, index: 0, filter: false, models: null}
			// 	, history = this._history
			// 	, len = this.length
			// 	, silent, index, filter, models;
			// 
			// opts = opts? mixin({}, [options, opts]): options;
			// silent = opts.silent;
			// index = opts.index;
			// models = opts.models;
			// filter = opts.filter && this.lastFilter;
			// 
			// if (!models) {
			// 	isNaN(index) && (index = 0);
			// 	index = Math.max(Math.min(index, history.length-1), 0) + 1;
			// 	while (history.length !== index) history.shift();
			// 	this.models = history[index-1];
			// } else {
			// 	this._history = [];
			// 	this.pushHistory(models);
			// 	// clear all known filters
			// 	this.lastFilter = null;
			// }
			// 
			// this.length = this.models.length;
			// 
			// if (filter) {
			// 	return this.filter(filter.method, !silent? mixin({}, [filter.options, {silent: false}]): filter.options);
			// } 
			// 
			// !silent && (models = this.models.slice());
			// !silent && len !== this.length && this.isObserving() && this.notify("length", len, this.length);
			// !silent && !this.isSilenced() && this.emit("reset", {/* for backward compatibility */ records: models, /* prefered */ models: models})
			// return this.models;
		},
		
		/**
			@private
			@method
		*/
		onCollectionChange: function (was, is) {
			if (is) {
				if (typeof is == "string") this.collection = is = getPath(is);
				if (!is || !(is instanceof Collection)) return;
				if (is === this) return this.collection = this;
				is.on("*", this.onCollectionEvent, this);
				
				// @TODO: Need to reset filters and update their internal content
				// to any/all records from this new dataset?
			}
			if (was) was.off("*", this.onCollectionEvent, this);
			
			if (!is) this.onCollectionChange(null, this);
		},
		
		/**
			@private
			@method
		*/
		onActiveCollectionChange: function (was, is) {
			// @TODO: What to do...?
			this.log(was, is);
			if (was) was.off("*", this.onCollectionEvent, this);
			if (is) {
				is.on("*", this.onCollectionEvent, this);
				this.set("models", is);
			}
		},
		
		/**
			@private
			@method
		*/
		onActiveFilterChange: function (was, is) {
			// @TODO: What to do...?
			this.log(this.euid || this.id, was, is);
			
			var filter = this.$[is];
			
			if (filter) this.set("activeCollection", filter);
		},
		
		/**
			@private
			@method
		*/
		onCollectionEvent: function (sender, e) {
			switch (e) {
			case "add":
			case "remove":
			case "reset":
				// this.reset({models: sender.models.clone(), filter: true});
				this.set("models", sender);
				break;
			}
		},
		
		/**
			@private
			@method
		*/
		onOwnerEvent: function (sender, e, props) {
			var filtered;
			
			
			this.log(sender, e, props);
			
			switch (e) {
			case "add":
				filtered = this.filter(props.models);
				filtered.length && this.add(filtered);
				break;
			case "remove":
				break;
			case "change":
				filtered = this.filter([props.model]);
				if (filtered.length) this.add(filtered);
				else this.remove(props.model);
				break;
			}
		},
		
		/**
			@private
			@method
		*/
		ownerChanged: inherit(function (sup) {
			return function (was) {
				sup.apply(this, arguments);
				
				if (was && this.isChildFilter) was.off("*", this.onOwnerEvent, this);
				
				var owner = this.owner;
				
				if (owner && owner instanceof FilterCollection) {
					this.isChildFilter = true;
					
					owner.on("*", this.onOwnerEvent, this);
					
					// @TODO: Should this always happen automagically?
					this.set("models", owner.models.clone(), {silent: true});
					this.filter();
				}
			};
		}),
		
		/**
			@private
			@method
		*/
		constructor: inherit(function (sup) {
			return function () {
				sup.apply(this, arguments);
				
				// if there is a collection set now we go ahead and initialize it
				// and yes...it fucks with the mind but we can be our own collection 0.x
				this.onCollectionChange(null, this.collection || this);
			};
		}),
		
		/**
			@private
			@method
		*/
		initFilters: function () {
			if (this.filters) {
				this.createComponents(this.filters.map(function (ln) {
					typeof ln == "string" && (ln = {name: ln});
					ln = mixin({}, [this.filterDefaults, ln]);
					ln.name || (ln.name = "default");
					ln.model || (ln.model = this.model);
					ln.method = (typeof ln.method == "function"? ln.method: (this[ln.method] || this[ln.name]));
					ln.public = true;
					
					// if the method was on the owner it will be replaced with the instance
				
					if (ln.name == "default" || ln.default) this.defaultFilter = ln.name;
				
					return ln;
				}, this), {owner: this});
			}
		},
		
		/**
			@private
			@method
		*/
		create: inherit(function (sup) {
			return function () {
				sup.apply(this, arguments);
				
				// now we initialize any filters that were declared for the
				// kind
				// @TODO: Originally this functionality was embedded in here but
				// I broke it out so it was, possibly, overridable in behavior but
				// have currently marked it as an internal/private method as it could
				// really break features if not overloaded correctly
				this.initFilters();
				if (!this.isChildFilter) {
					if (!this.filterMethod) this.filterMethod = this.name;
					if (this.defaultFilter) this.set("activeFilter", this.defaultFilter);
				}
			};
		}),
		
		/**
			@private
			@method
		*/
		destroy: inherit(function (sup) {
			return function () {
				if (this.collection && this.collection !== this) this.collection.off("*", this.onCollectionEvent, this);
				if (this.owner && this.isChildFilter) this.owner.off("*", this.onOwnerEvent, this);
				sup.apply(this, arguments);
			};
		})
		
	});
	
	FilterCollection.concat = function (ctor, props) {
		if (props.filterDefaults) {
			var proto = ctor.prototype || ctor
				, defaults = proto.filterDefaults;
				
			proto.filterDefaults = mixin({}, [defaults, props.filterDefaults]);
			delete props.filterDefaults;
		}
	};
	
})(enyo);