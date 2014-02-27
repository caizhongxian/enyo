(function (enyo, localStorage) {
	
	if (localStorage) {
		var kind = enyo.kind
			, json = enyo.json;
	
		var Source = enyo.Source
			, MixinSupport = enyo.MixinSupport
			, ObserverSupport = enyo.ObserverSupport;
	
		/**
			@public
			@class enyo.LocalStorageSource
		*/
		var LocalStorageSource = kind(
			/** @lends enyo.LocalStorageSource.prototype */ {
			name: "enyo.LocalStorageSource",
			kind: Source,
			noDefer: true,
			
			/**
				@private
			*/
			mixins: [MixinSupport, ObserverSupport],
			
			/**
				@private
			*/
			observers: [
				{path: "prefix", method: "onPrefixChange"}
			],
			
			/**
				@private
			*/
			computed: [
				{path: "prefix", method: "storage", cached: true}
			],
			
			/**
				@public
			*/
			prefix: "enyo-app",
			
			/**
				@private
			*/
			storage: function () {
				var storage = localStorage.getItem(this.prefix);
				
				if (typeof storage == "string") storage = json.parse(storage);
				
				return this._storage = storage || {};
			},
		
			/**
				@public
				@method
			*/
			fetch: function (model, opts) {
				var storage = this.get("storage")
					, res = storage[model.euid];
				
				if (typeof res == "string") res = json.parse(res);
				
				if (opts.success) opts.success(res);
			},
		
			/**
				@public
				@method
			*/
			commit: function (model, opts) {
				var storage = this.get("storage");
				
				storage[model.euid] = model.raw();
				localStorage.setItem(this.prefix, json.stringify(storage));
				
				if (opts.success) opts.success();
			},
		
			/**
				@public
				@method
			*/
			destroy: function (model, opts) {
				var storage = this.get("storage");
				
				delete storage[model.euid];
				localStorage.setItem(this.prefix, json.stringify(storage));
				
				if (opts.success) opts.success();
			},
		
			/**
				@public
				@method
			*/
			find: function (ctor, opts) {
			
			},
			
			/**
				@private
				@method
			*/
			onPrefixChange: function (was, is) {
				var storage = this.get("storage");
				
				localStorage.removeItem(was);
				localStorage.setItem(is, json.stringify(storage));
			}
		});
	
		new LocalStorageSource();
	}
	
})(enyo, localStorage);