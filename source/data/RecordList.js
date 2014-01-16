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
		add: function (record) {
			var loc = this.euidTable
				, euid = record.euid
				, node = this.createNode({model: record});

			this.appendNode((loc[euid] = node));
			return this;
		},
		
		/**
			@private
			@method
		*/
		remove: function (record) {
			var loc = this.euidTable
				, node = this.has(record)
				, euid = record.euid;
			
			node && this.deleteNode(node);
			
			delete loc[euid];
			return this;
		},
		
		/**
			@public
			@method
		*/
		records: function () {
			var ret = [];
			this.forward(function (node) {
				ret.push(node.model);
			});
			return ret;
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