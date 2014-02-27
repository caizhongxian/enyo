(function (enyo) {
	
	var kind = enyo.kind
		, inherit = enyo.inherit
		, nop = enyo.nop
		, remove = enyo.remove
		, constructorForKind = enyo.constructorForKind;
	
	var Collection = enyo.Collection;
	
	/**
		@public
		@class enyo.Filter
	*/
	var Filter = kind(
		/** @lends enyo.Filter.prototype */ {
		name: "enyo.Filter",
		kind: Collection,
		noDefer: true,
		
		/**
			@public
		*/
		collection: null,
		
		/**
			@private
		*/
		defaultProps: {
			kind: "enyo.Filter"
		},
		
		/**
			@private
		*/
		adjustComponentProps: inherit(function (sup) {
			return function (props) {
				// all filters are public...always...except when they aren't...
				props.public !== false && (props.public = true);
				sup.apply(this, arguments);
				if (typeof props.kind == "string") props.kind = constructorForKind(props.kind);
				if (props.kind.prototype instanceof Filter) {
					if (!props.name) throw "enyo.Filter.adjustComponentProps: All child filters must have a name";
					if (!props.method) props.method = props.name;
					if (typeof props.method == "string") props.method = this[props.method];
					if (typeof props.method != "function") props.method = function () { return true; };
				}
			};
		}),
		
		/**
			@private
		*/
		observers: [
			{path: "collection", method: "onCollectionChange"}
		],
		
		/**
			@public
		*/
		reset: nop,
		
		/**
			@private
		*/
		constructed: inherit(function (sup) {
			return function () {
				var owner;
				
				sup.apply(this, arguments);
				
				// we allow filters to be nested...so it gets confusing
				if ((owner = this.owner) && owner instanceof Filter) owner.on("sync", this.onOwnerEvent, this);
				
				// will be public for internal reference but is not a public property by declaration
				// and thus still reserved for internal purposes
				this.createChrome([{name: "_collection", kind: /*SubFilter*/ Collection}]);
				this.set("collection", this.collection || this._collection);
			};
		}),
		
		/**
			@private
		*/
		onCollectionChange: function (was, is) {
			if (was) was.off("*", this.onCollectionEvent, this);
			if (is) {
				is.on("*", this.onCollectionEvent, this);
				
				// this is tricky at first - if as a filter we have no child filters then
				// we want to share state with our subfilter, otherwise, we don't and will
				// let the subkind manage the state of our models separately
				if (!this.listeners("sync").length) this.set("models", is.models);
				
				// children filters can't listen for the reset event because their content would
				// incorrectly update according to filter-changes but here we need them to sync
				// to new data so we emit a special event call sync
				this.emit("sync", {models: this.models});
			}
			if (!is) this.set("collection", this._collection);
		},
		
		/**
			@private
		*/
		onCollectionEvent: function (sender, e, props) {
			// the child filters need to sync but to maintain ordered sets they
			// must re-scan the entirety of the base
			this.emit("sync", {models: sender.models});
			
			// we always re-emit the event as our own to ensure that anyone interested
			// is updated accordingly
			this.emit(e, props);
		},
		
		/**
			Subkinds need to implement this method according to their needs.
		
			@private
			@method
		*/
		onOwnerEvent: nop,
		
		/**
			@private
		*/
		add: inherit(function (sup) {
			return function (models, opts) {
				this.collection.add(models, opts);
				return this;
			};
		}),
		
		/**
			@private
		*/
		remove: inherit(function (sup) {
			return function (models, opts) {
				this.collection.remove(models, opts);
				return this;
			};
		})
	});
	
})(enyo);