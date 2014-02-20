(function (enyo) {
	
	var kind = enyo.kind
		, clone = enyo.clone
		, exists = enyo.exists;
		
	var Model = enyo.Model;
		
	/**
		@public
		@class enyo.ModelList
	*/
	kind(
		/** @lends enyo.ModelList.prototype */ {
		name: "enyo.ModelList",
		kind: null,
		noDefer: true,
		
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
			if (model instanceof Array) return model.forEach(function (ln) {
				this.add(ln, idx) && ++idx;
			}, this) || this;
			
			euid = model.euid;
			id = model.attributes[model.primaryKey];
			
			// @TODO: Absolutely must come back to this as this does not seem to be the
			// best solution to this issue...
			if (id !== null && id !== undefined) {
				if (loc[id]) model.headless = true;
				else loc[id] = model;
			}
			
			loc[euid] = model;
			if (!model.headless) {
				if (!isNaN(idx) && idx < len) models.splice(idx, 0, model);
				else models.push(model);
				this.length = models.length;
			}
			return this;
		},
		
		/**
			@private
			@method
		*/
		remove: function (model) {
			// loop through and do the work and ensure we still return the reference
			if (model instanceof Array) return model.forEach(this.remove, this) || this;
			
			var loc = this.idTable
				, models = this._models
				, euid = model.euid
				, id = model.attributes[model.primaryKey]
				, idx = models.indexOf(model);
			
			loc[euid] = null;
			if (!model.headless) {
				if (id !== null && id !== undefined) loc[id] = null;
				idx > -1 && models.splice(idx, 1);
				this.length = models.length;
			}
			return this;
		},
		
		/**
			@public
			@method
		*/
		slice: function (from, to) {
			return this._models.slice(from, to);
		},
		
		/**
			@public
			@method
		*/
		has: function (model) {
			if (model === undefined || model === null) return;
			
			var loc = this.idTable
				, id, euid;
				
			if (typeof model == "object") {
				id = model.attributes[model.primaryKey];
				euid = model.euid;
			} else {
				id = euid = model;
			}
			
			model = loc[euid] || loc[id];
			
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
		indexOf: function (model, offset) {
			return this._models.indexOf(model, offset);
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
			return this._models.forEach(fn, ctx || this);
		},
		
		/**
			@public
			@method
		*/
		map: function (fn, ctx) {
			return this._models.map(fn, ctx || this);
		},
		
		/**
			@public
			@method
		*/
		filter: function (fn, ctx) {
			return this._models.filter(fn, ctx || this);
		},
		
		/**
			@public
			@method
		*/
		find: function (fn, ctx) {
			return this._models.find(fn, ctx || this);
		},
		
		/**
			@public
			@method
		*/
		findIndex: function (fn, ctx) {
			return this._models.findIndex(fn, ctx || this);
		},
		
		/**
			@public
			@method
		*/
		where: function (fn, ctx) {
			return this._models.find(fn, ctx || this);
		},
		
		/**
			@public
			@method
		*/
		sort: function (fn) {
			this._models.sort(fn);
			return this.slice();
		},
		
		/**
			@public
			@method
		*/
		clone: function () {
			var cpy = new this.ctor();
			cpy.idTable = clone(this.idTable);
			cpy._models = this._models.slice();
			cpy.length = this.length;
			return cpy;
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