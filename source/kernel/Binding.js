(function (enyo) {
	
	var kind = enyo.kind
		, mixin = enyo.mixin
		, uuid = enyo.uuid
		, where = enyo.where
		, isString = enyo.isString
		, isObject = enyo.isObject
		, isFunction = enyo.isFunction
		, getPath = enyo.getPath
		, remove = enyo.remove
		, bindings = enyo.bindings = [];
		
	var DIRTY = {
		TO   : 0x01,
		FROM : 0x02
	};
	
	/**
		@private
		@method
	*/
	function ready (binding) {
		var rdy = false;
		
		if (!binding.ready) {
			
			var from = binding.from || ""
				, to = binding.to || ""
				, source = binding.source
				, target = binding.target
				, owner = binding.owner;
			
			isString(from) || (from = "");
			isString(to) || (to = "");
			
			if (!source) {
				
				// the worst case scenario here is for backward compatability purposes
				// we have to at least be able to derive the source via the from string
				if (from[0] == "^") {
					
					// this means we're reaching for a global
					from = from.slice(1);
					source = getPath.call(window, from);
					
				} else {
					source = owner;
				}
				
			}
			
			if (!target) {
				
				// same worst case as above, for backwards compatability purposes
				// we have to at least be able to derive the target via the to string
				if (to[0] == "^") {
					
					// this means we're reaching for a global
					to = to.slice(1);
					target = getPath.call(window, to);
				} else {
					target = owner;
				}
			}
			
			binding.target = target;
			binding.source = source;
			binding.from = from[0] == "."? from.slice(1): from;
			binding.to = to[0] == "."? to.slice(1): to;
			
			// now our sanitization
			rdy = !! (
				(source && isObject(source)) &&
				(target && isObject(target)) &&
				(from) &&
				(to)
			);
		}
		
		return (binding.ready = rdy);
	}
	
	/**
		@public
		@class enyo.Binding
	*/
	kind(
		/** @lends enyo.Binding.prototype */ {
		name: "enyo.Binding",
		kind: null,
		noDefer: true,
		
		/**
			@public
		*/
		oneWay: true,
		
		/**
			@public
		*/
		connected: false,
		
		/**
			@public
		*/
		owner: null,
		
		/**
			@public
		*/
		autoConnect: true,
		
		/**
			@public
		*/
		autoSync: true,
		
		/**
			@public
		*/
		source: null,
		
		/**
			@public
		*/
		target: null,
		
		/**
			@public
		*/
		from: null,
		
		/**
			@public
		*/
		dirty: DIRTY.FROM,
		
		/**
			@public
		*/
		to: null,
		
		/**
			@public
		*/
		transform: null,
		
		/**
			@public
			@method
		*/
		isConnected: function () {
			return this.connected;
		},
		
		/**
			@public
			@method
		*/
		stop: function () {
			this._stop = true;
		},
		
		/**
			@public
			@method
		*/
		isReady: function () {
			return this.ready || ready(this);
		},
		
		/**
			@public
			@method
		*/
		connect: function () {
			if (!this.isConnected()) {
				if (this.isReady()) {
					this.source.observe(this.from, this.onSource, this);
					
					// for two-way bindings we register to observe changes
					// from the target
					!this.oneWay && this.target.observe(this.to, this.onTarget, this);
					
					// we flag it as having been connected
					this.connected = true;
				}
			}
			
			return this;
		},
		
		/**
			@public
			@method
		*/
		disconnect: function () {
			if (this.isConnected()) {
				this.source.unobserve(this.from, this.onSource);
				
				// for two-way bindings we unregister the observer from
				// the target as well
				!this.oneWay && this.target.unobserve(this.to, this.onTarget);
				
				this.connected = false;
			}
			
			return this;
		},
		
		/**
			@public
			@method
		*/
		sync: function () {
			if (this.isConnected()) {
				var source = this.source
					, target = this.target
					, from = this.from
					, to = this.to
					, xform = this.getTransform()
					, val;
				
				switch (this.dirty) {
				case DIRTY.FROM:
					val = source.get(from);
					xform && (val = xform(val, DIRTY.FROM, this));
					!this._stop && target.set(to, val);
					break;
				case DIRTY.TO:
					val = target.get(to);
					xform && (val = xform(val, DIRTY.TO, this));
					!this._stop && source.set(from, val);
					break;
				}
				this.dirty = null;
				this._stop = null;
			}
			return this;
		},
		
		/**
			@private
			@method
		*/
		getTransform: function () {
			return this._didInitTransform? this.transform: (function (bnd) {
				bnd._didInitTransform = true;
				
				var xform = bnd.transform
					, owner = bnd.owner
					, xformOwner = owner && owner.bindingTransformOwner;
				
				if (xform) {
					if (isString(xform)) {
						if (xformOwner && xformOwner[xform]) {
							xform = xformOwner[xform];
						} else if (owner && owner[xform]) {
							xform = owner[xform];
						} else {
							xform = getPath(xform);
						}
					}
					
					return (bnd.transform = isFunction(xform)? xform: null);
				}
			})(this);
		},
		
		/**
			@private
			@method
		*/
		constructor: function (props) {
			bindings.push(this);
			
			props && mixin(this, props);
			
			this.euid || (this.euid = uuid());
			
			this.autoConnect && this.connect();
			this.autoSync && this.sync();
		},
		
		/**
			@public
			@method
		*/
		destroy: function () {
			this.disconnect();
			this.owner = null;
			this.source = null;
			this.target = null;
			this.destroyed = true;
			remove(this, bindings);
		},
		
		/**
			@private
			@method
		*/
		onSource: function (was, is, path) {
			// @TODO: Should it...would it benefit from using these passed in values?
			this.dirty = this.dirty == DIRTY.TO? null: DIRTY.FROM;
			return this.dirty == DIRTY.FROM && this.sync();
		},
		
		/**
			@private
			@method
		*/
		onTarget: function (was, is, path) {
			// @TODO: Same question as above, it seems useful but would it affect computed
			// properties or stale values?
			this.dirty = this.dirty == DIRTY.FROM? null: DIRTY.TO;
			return this.dirty == DIRTY.TO && this.sync();
		}
		
	});
	
	/**
		@public
		@static
		@method
	*/
	enyo.Binding.find = function (euid) {
		return where(bindings, function (ln) {
			return ln.euid == euid;
		});
	};
	
	/**
		@public
		@static
	*/
	enyo.Binding.DIRTY = DIRTY;
	
	/**
		@public
		@static
	*/
	enyo.defaultBindingKind = enyo.Binding;
	
})(enyo);