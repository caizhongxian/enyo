(function (enyo) {
	
	var kind = enyo.kind
		, inherit = enyo.inherit
		, mixin = enyo.mixin
		, getPath = enyo.getPath;
	
	var Collection = enyo.Collection
		, ModelList = enyo.ModelList;
	
	/**
		@public
		@class enyo.CollectionController
	*/
	kind(
		/** @lends enyo.CollectionController.prototype */ {
		name: "enyo.CollectionController",
		kind: Collection,
		
		/**
			@public
		*/
		collection: null,
		
		/**
			@public
		*/
		history: true,
		
		/**
			@private
		*/
		observers: [
			{path: "collection", method: "onCollectionChange"}
		],
		
		/**
			@public
			@method
		*/
		filter: function (fn, opts) {
			var options = {history: true, reset: true, silent: false}
				, len = this.length
				, models, ctx, filtered, silent, history;
			!this.history && (options.history = false);
			opts = opts? mixin({}, [options, opts]): options;
			ctx = opts.context || this;
			history = opts.history;
			reset = opts.reset;
			silent = opts.silent;
			
			this.lastFilter = {method: fn, options: opts};
			
			models = reset && history? this.reset({silent: true}).clone(): history? this.models.clone(): this.models;
			history && this.pushHistory(models);
			
			filtered = models.filter(fn, ctx);
			if (filtered.length != len) {
				filtered = this.add(filtered, {create: false, find: false, purge: true, merge: false, silent: true});
				!silent && this.notify("length", len, this.length);
				!silent && this.emit("filter", {/* for backward compatibility */ records: filtered, /* prefered */ models: filtered});
			}
			return this.models;
		},
		
		/**
			@public
			@method
		*/
		pushHistory: function (models) {
			if (models && models instanceof ModelList) {
				this._history.unshift(models);
				this.models = models;
				this.length = models.length;
			}
		},
		
		/**
			@public
			@method
		*/
		popHistory: function () {
			if (this._history.length > 1) {
				this._history.shift();
				this.models = this._history[this._history.length-1];
				this.length = this.models.length;
			}
		},
		
		/**
			@public
			@method
		*/
		reset: function (opts) {
			var options = {silent: false, index: 0, filter: false, models: null}
				, history = this._history
				, len = this.length
				, silent, index, filter, models;
			
			opts = opts? mixin({}, [options, opts]): options;
			silent = opts.silent;
			index = opts.index;
			models = opts.models;
			filter = opts.filter && this.lastFilter;
			
			if (!models) {
				isNaN(index) && (index = 0);
				index = Math.max(Math.min(index, history.length-1), 0) + 1;
				while (history.length !== index) history.shift();
				this.models = history[index-1];
			} else {
				this._history = [];
				this.pushHistory(models);
				// clear all known filters
				this.lastFilter = null;
			}
			
			this.length = this.models.length;
			
			if (filter) {
				return this.filter(filter.method, !silent? mixin({}, [filter.options, {silent: false}]): filter.options);
			} 
			
			!silent && (models = this.models.slice());
			!silent && len !== this.length && this.isObserving() && this.notify("length", len, this.length);
			!silent && !this.isSilenced() && this.emit("reset", {/* for backward compatibility */ records: models, /* prefered */ models: models})
			return this.models;
		},
		
		/**
			@private
			@method
		*/
		onCollectionChange: function (was, is) {
			if (is) {
				if (typeof is == "string") this.collection = is = getPath(is);
				if (!is || !(is instanceof Collection)) return;
				is.on("*", this.onCollectionEvent, this);
				this.reset({models: is.models.clone()});
			}
			if (was) {
				was.off("*", this.onCollectionEvent, this);
			}
		},
		
		/**
			@private
			@method
		*/
		onCollectionEvent: function (sender, e) {
			if (sender === this.collection) {
				switch (e) {
				case "add":
				case "remove":
				case "reset":
					this.reset({models: sender.models.clone(), filter: true});
					break;
				}
			}
		},
		
		/**
			@private
			@method
		*/
		constructor: inherit(function (sup) {
			return function () {
				this._history = [];
				sup.apply(this, arguments);
				if (this.collection) this.onCollectionChange(null, this.collection);
				if (this.history && !this.collection) this.pushHistory(this.models);
			};
		}),
		
		/**
			@private
			@method
		*/
		destroy: inherit(function (sup) {
			return function () {
				if (this.collection) this.collection.off("*", this.onCollectionEvent, this);
				this.collection = null;
				sup.apply(this, arguments);
			};
		})
		
	});
	
})(enyo);