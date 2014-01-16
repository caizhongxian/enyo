(function (enyo) {
	
	var kind = enyo.kind
		, inherit = enyo.inherit
		, forEach = enyo.forEach
		, isArray = enyo.isArray;
		
	/**
		@private
		@class
	*/
	kind(
		/** @lends enyo.RecordList.prototype */ {
	
		name: "enyo.RecordList",
		kind: "enyo.LinkedList",
		
		/**
			@private
			@method
		*/
		add: function (records) {
			var loc = this.euidTable
				, added = []
				, dit = this
				, euid, node;
			
			var fn = function (rec) {
				if (!dit.has(rec)) {
					euid = rec.euid;
					node = dit.createNode({model: rec});
					dit.appendNode(node);
					loc[euid] = node;
					added.push(rec);
				}
			};
						
			isArray(records)? forEach(records, fn): fn(records);
			
			return added;
		},
		
		/**
			@private
			@method
		*/
		remove: function (records) {
			var loc = this.euidTable
				, len = this.length
				, dit = this
				, removed = []
				, node, euid;
			
			var fn = function (rec) {
				if ((node = dit.has(rec))) {
					euid = rec.euid;
					dit.deleteNode(node);
					delete loc[euid];
					removed.push(rec);
				}
			};
			
			isArray(records)? forEach(records, fn): fn(records);
			
			return removed;
		},
		
		/**
			@public
			@method
		*/
		records: function () {
			var recs = [];
			this.forward(function (node) {
				recs.push(node.model);
			});
			return recs;
		},
		
		/**
			@private
			@method
		*/
		has: function (record) {
			// faster than find node anyways
			return this.euidTable[record.euid];
		},
		
		/**
			@private
			@method
		*/
		constructor: function () {
			this.euidTable = {};
		},
		
		/**
			@private
			@method
		*/
		destroy: inherit(function (sup) {
			return function () {
				sup.apply(this, arguments);
				
				// free all nodes associated with this list
				this.euidTable = null;
			}
		})
			
	});
	
})(enyo);