(function (enyo) {
	
	var kind = enyo.kind
		, forEach = enyo.forEach
		, find = enyo.find
		, map = enyo.map
		, filter = enyo.filter
		, isArray = enyo.isArray
		, isString = enyo.isString
		, indexOf = enyo.indexOf;
		
	/**
		@public
		@class enyo.ModelList
	*/
	kind(
		/** @lends enyo.ModelList.prototype */ {
		name: "enyo.ModelList",
		kind: null,
		
		/**
			@public
		*/
		length: 0,
		
		/**
			@private
			@method
		*/
		add: function (model, idx) {
			var loc = this.idTable
				, models = this._models
				, len = this.length
				, euid, id;
			
			// loop through and do the work and ensure we still return the reference
			if (isArray(model)) return forEach(model, function (ln) {
				this.add(ln, idx) && ++idx;
			}, this) || this;
			
			euid = model.euid;
			id = model.attributes[model.primaryKey];
			
			id && (loc[id] = model);
			loc[euid] = model;
			if (!isNaN(idx) && idx < len) models.splice(idx, 0, model);
			else models.push(model);
			this.length = models.length;
			return this;
		},
		
		/**
			@private
			@method
		*/
		remove: function (model) {
			// loop through and do the work and ensure we still return the reference
			if (isArray(model)) return forEach(model, this.remove, this) || this;
			
			var loc = this.idTable
				, models = this._models
				, euid = model.euid
				, id = model.attributes[model.primaryKey]
				, idx = indexOf(model, models);
			
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
		models: function () {
			return this._models.slice();
		},
		
		/**
			@public
			@method
		*/
		has: function (model) {
			var loc = this.idTable
				, str = isString(model) || !isNaN(model)
				, euid = !str && model.euid
				, id = !str && model.attributes[model.primaryKey]
				, model = str? loc[model]: (loc[euid] || loc[id]);
			
			return model;
		},
		
		/**
			@public
			@method
		*/
		contains: function (model) {
			return this.has(model);
		},
		
		/**
			@public
			@method
		*/
		at: function (idx) {
			return this._models[idx];
		},
		
		/**
			@public
			@method
		*/
		forEach: function (fn, ctx) {
			return forEach(this.models(), fn, ctx || this);
		},
		
		/**
			@public
			@method
		*/
		map: function (fn, ctx) {
			return map(this.models(), fn, ctx || this);
		},
		
		/**
			@public
			@method
		*/
		filter: function (fn, ctx) {
			return filter(this.models(), fn, ctx || this);
		},
		
		/**
			@public
			@method
		*/
		find: function (fn, ctx) {
			return find(this.models(), fn, ctx || this);
		},
		
		/**
			@private
			@method
		*/
		constructor: function () {
			this.idTable = {};
			this._models = [];
		},
		
		/**
			@private
			@method
		*/
		destroy: function () {
			this.idTable = null;
			this._models = null;
		}
			
	});
	
})(enyo);