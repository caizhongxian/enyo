(function (enyo) {
	
	var kind = enyo.kind
		, inherit = enyo.inherit
		, bind = enyo.bindSafely;
		
	/**
		@private
		@class Store
	*/
	var Store = kind(
		/** @lends Store.prototype */ {
		
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
		add: function (record) {
			// @TODO: It should be possible to have a mechanism that delays this
			// work until a timer runs out (that is reset as long as add is continuing
			// to be called) and then flushes when possible unless a synchronous flush
			// is forced?
			
			var records = this.records
				, created = this.created;
			
			!this.has(record) && records.add(record);
			
			record.on("change", this.onChange);
			record.on("destroy", this.onDestroy);
			
			if (record.isNew) {
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
				, destroyed = this.destroyed;
				
			if (this.has(record)) {
				records.remove(record);
				
				if (record.isNew) {
					created.remove(record);
				} else {
					destroyed.add(record);
				}
				
				record.removeListener("change", this.onChange);
				record.removeListener("destroy", this.onDestroy);
				this.length = records.length;
			}
			
			return this;
		},
		
		/**
			@private
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
				this.onChange = bind(this, this.onChange);
				this.onDestroy = bind(this, this.onDestroy);
			};
		}),
		
		/**
			@public
		*/
		kind: enyo.Object
	});
	
	enyo.store = new Store();

})(enyo);
