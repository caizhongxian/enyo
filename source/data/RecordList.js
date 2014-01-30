(function (enyo) {
	
	var kind = enyo.kind
		, forEach = enyo.forEach
		, isArray = enyo.isArray
		, isString = enyo.isString
		, indexOf = enyo.indexOf;
		
	/**
		@private
		@class enyo.RecordList
	*/
	kind(
		/** @lends enyo.RecordList.prototype */ {
		name: "enyo.RecordList",
		kind: null,
		
		/**
			@private
		*/
		length: 0,
		
		/**
			@private
			@method
		*/
		add: function (record, idx) {
			var loc = this.idTable
				, models = this.models
				, len = this.length
				, euid, id;
			
			if (isArray(record)) return forEach(record, function (model) {
				this.add(model, idx) && ++idx;
			}, this);
			
			euid = record.euid;
			id = record.attributes[record.primaryKey];
			
			id && (loc[id] = record);
			loc[euid] = record;
			if (!isNaN(idx) && idx < len) models.splice(idx, 0, record);
			else models.push(record);
			this.length = models.length;
			return this;
		},
		
		/**
			@private
			@method
		*/
		remove: function (record) {
			var loc = this.idTable
				, models = this.models
				, euid = record.euid
				, id = record.attributes[record.primaryKey]
				, idx = indexOf(record, models);
			
			delete loc[euid];
			id && (delete loc[id]);
			idx > -1 && models.splice(idx, 1);
			this.length = models.length;
			return this;
		},
		
		/**
			@public
			@method
		*/
		records: function () {
			return this.models.slice();
		},
		
		/**
			@private
			@method
		*/
		has: function (record) {
			var loc = this.idTable
				, str = isString(record) || !isNaN(record)
				, euid = !str && record.euid
				, id = !str && record.attributes[record.primaryKey]
				, model = str? loc[record]: (loc[euid] || loc[id]);
			
			return model;
		},
		
		/**
			@private
			@method
		*/
		at: function (idx) {
			return this.models[idx];
		},
		
		/**
			@private
			@method
		*/
		constructor: function () {
			this.idTable = {};
			this.models = [];
		},
		
		/**
			@private
			@method
		*/
		destroy: function () {
			this.idTable = null;
			this.models = null;
		}
			
	});
	
})(enyo);