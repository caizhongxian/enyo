(function (enyo) {
	
	var bind = enyo.bindSafely
		, isString = enyo.isString
		, isFunction = enyo.isFunction
		, forEach = enyo.forEach
		, indexOf = enyo.indexOf
		, toArray = enyo.toArray
		, uid = enyo.uid
		, eventTable = {};
	
	/**
		@private
	*/
	function addListener(e, fn, ctx) {
		var listeners = this.listeners(e);
		
		if (isString(fn)) {
			if (!ctx) {
				throw "enyo.RegisteredEventSupport.addListener: must supply a valid function " +
					"or if a string must supply a context"
			}
			
			fn = ctx[fn];
		}
		
		if (!isFunction(fn)) {
			throw "enyo.EventEmitter.addListener: could not find or use supplied method";
		}
		
		fn = ctx? bind(ctx, fn): fn;
		
		if (!listeners.length || indexOf(fn, listeners) < 0) {
			listeners.push(fn);
		}
		
		return fn;
	}
	
	/**
		@private
	*/
	function emit(e) {
		var len = arguments.length
			, listeners = this.listeners(e)
			, dit = this
			, args;
			
		if (listeners.length) {
			if (len > 1) {
				args = toArray(arguments);
				args.unshift(this);
			} else {
				args = [this, e];
			}
			
			forEach(listeners, function (fn) {
				fn.apply(dit, args);
			});
			
			return true;
		}
		
		return false;
	}
	
	/**
		@public
		@mixin
	*/
	enyo.EventEmitter = {
		name: "EventEmitter",
		
		/**
			@private
		*/
		_silenced: false,
		
		/**
			@private
		*/
		_silenceCount: 0,
		
		/**
			@public
			@method
		*/
		silence: function () {
			this._silenced = true;
			this._silenceCount++;
		},
		
		/**
			@public
			@method
		*/
		unsilence: function () {
			this._silenceCount && this._silenceCount--;
			this._silenceCount === 0 && (this._silenced = false);
		},
		
		/**
			@public
			@method
		*/
		isSilenced: function () {
			return this._silenced;
		},
		
		/**
			@public
			@method
		*/
		addListener: function () {			
			return addListener.apply(this, arguments);
		},
		
		/**
			@public
			@method
			@alias addListener
		*/
		on: function (e, fn, ctx) {
			return addListener.apply(this, arguments);
		},
		
		/**
			@public
			@method
		*/
		removeListener: function (e, fn) {
			var listeners = this.listeners(e)
				, idx;
			
			if (listeners.length) {
				idx = indexOf(fn, listeners);
				idx >= 0 && listeners.splice(idx, 1);
			}
			return this;
		},
		
		/**
			@public
			@method
		*/
		removeAllListeners: function (e) {
			var eid;
			
			if (e) {
				this.listeners(e).length = 0;
			} else {
				 eid = this.eventId || (this.eventId = uid("__eventId__"))
				 eventTable[eid] = null;
			}
			
			return this;
		},
		
		/**
			@public
			@method
		*/
		listeners: function (e) {
			var eid = this.eventId
				, loc;
			
			// ensure we have an event id for the object instance
			eid || (eid = this.eventId = uid("__eventId__"));
			
			// we will create an entry in the map if it doesn't exist
			// so we won't have to do this again later or create an
			// array for no reason
			loc = eventTable[eid] || (eventTable[eid] = {});
			
			// ensure we will always return an array and if we don't have
			// listeners we will store the array in case we need it again
			// later
			return loc[e] || (loc[e] = []);
		},
		
		/**
			@public
			@method
			@alias emit
		*/
		triggerEvent: function () {
			return emit.apply(this, arguments);
		},
		
		/**
			@public
			@method
		*/
		emit: function () {
			return emit.apply(this, arguments);
		}
	};
	
	/**
		@public
		@mixin
	*/
	enyo.RegisteredEventSupport = enyo.EventEmitter;
	
})(enyo);
