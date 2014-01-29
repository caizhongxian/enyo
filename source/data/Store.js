(function (enyo) {
	
	var kind = enyo.kind
		, inherit = enyo.inherit
		, bind = enyo.bindSafely
		, isFunction = enyo.isFunction;
		
	var EventEmitter = enyo.EventEmitter;
		
	/**
		@private
		@class Store
	*/
	var Store = kind(
		/** @lends Store.prototype */ {
		kind: enyo.Object,
		
		/**
			@private
		*/
		mixins: [EventEmitter],
		
		/**
		*/
		batch: false,
		
		/**
		*/
		isDirty: false,
		
		/**
		*/
		length: 0,
		
		/**
		*/
		records: null,
		
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
			{method: "changeSet"}
		],
		
		/**
			@public
		*/
		changeSet: function () {
			return {
				changed: this.changed.records(),
				destroyed: this.destroyed.records(),
				created: this.created.records()
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
		add: function (record) {
			// @TODO: It should be possible to have a mechanism that delays this
			// work until a timer runs out (that is reset as long as add is continuing
			// to be called) and then flushes when possible unless a synchronous flush
			// is forced?
			
			var records = this.records
				, created = this.created
				, batch = this.batch;
			
			/*!this.has(record) && */records.add(record);
			
			record.on("change", this.onChange, this);
			record.on("destroy", this.onDestroy, this);
			
			if (record.isNew && batch) {
				created.add(record);
				this.isDirty = true;
			}
			
			this.length = records.length;
			return this;
		},
		
		/**
			@private
			@method
		*/
		remove: function (record) {
			
			var records = this.records
				, created = this.created
				, destroyed = this.destroyed
				, batch = this.batch;
				
			if (this.has(record)) {
				records.remove(record);
				
				if (batch) {
					record.isNew? created.remove(record): destroyed.add(record);
				}
				
				record.removeListener("change", this.onChange, this);
				record.removeListener("destroy", this.onDestroy, this);
				this.length = records.length;
			}
			
			return this;
		},
		
		/**
			@public
			@method
		*/
		has: function (record) {
			return this.records.has(record);
		},
		
		/**
			@private
			@method
		*/
		onChange: function () {
			this.log(arguments);
		},
		
		/**
			@private
			@method
		*/
		onDestroy: function () {
			this.log(arguments);
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
				this.changed = new enyo.RecordList();
				this.destroyed = new enyo.RecordList();
				this.created = new enyo.RecordList();
				this.records = new enyo.RecordList();
				
				// our overloaded event emitter methods need storage for
				// the listeners
				this._scopeListeners = [];
			};
		})
	});
	
	enyo.store = new Store();

})(enyo);
