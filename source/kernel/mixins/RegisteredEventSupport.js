(function (enyo) {
	
	var bind = enyo.bindSafely
		, isString = enyo.isString
		, forEach = enyo.forEach
		, indexOf = enyo.indexOf
		, toArray = enyo.toArray
		, find = enyo.find
		, filter = enyo.filter
		, uid = enyo.uid
		, eventTable = {};
	
	/**
		@private
	*/
	function addListener(e, fn, ctx) {

		this.listeners().push({
			event: e,
			fn: fn,
			ctx: ctx || this
		});
		
		return this;
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
			
			forEach(listeners, function (ln) {
				ln.fn.apply(ln.ctx, args);
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
			var listeners = this.listeners()
				, idx;
			
			if (listeners.length) {
				idx = find(listeners, function (ln) {
					return ln.fn === fn;
				});
				idx >= 0 && listeners.splice(idx, 1);
			}
			return this;
		},
		
		/**
			@public
			@method
		*/
		removeAllListeners: function (e) {
			var eid = this.eventId
				, loc = eid && eventTable[eid];
			
			if (loc) {
				if (e) {
					eventTable[eid] = filter(loc, function (ln) {
						return ln.event != e;
					});
				} else {
					eventTable[eid] = null;
				}
			}
			
			return this;
		},
		
		/**
			@public
			@method
		*/
		listeners: function (e) {
			var eid = this.eventId || (this.eventId = uid("__eventId__"))
				, loc = eventTable[eid] || (eventTable[eid] = []);
			
			return !e? loc.length? loc.slice(): loc: filter(loc, function (ln) {
				return ln.event == e;
			});
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
