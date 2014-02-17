(function (enyo, scope) {
	
	/**
		@private
	*/
	enyo.global = scope;
	
	
	// ----------------------------------
	// ARRAY FUNCTIONS
	// ----------------------------------
	
	/**
		Because our older API parameters are not consistent with other array API methods
		and also because only IE8 doesn't have integrated support for this method we ensure
		it is defined (only IE8) and advise, moving forward, that the built-in method be
		used. But to preserve our original API it will simply call this method knowing
		it exists.
	
		@private
	*/
	Array.prototype.indexOf = Array.prototype.indexOf || function (el, offset) {
		var len = this.length >>> 0;
		
		offset = +offset || 0;
		
		if (Math.abs(offset) === Infinity) offset = 0;
		if (offset < 0) offset += len;
		if (offset < 0) offset = 0;
		
		for (; offset < len; ++offset) {
			if (this[offset] === el) return offset;
		}
		
		return -1;
	};
	
	/**
		Because our older API parameters are not consistent with other array API methods
		and also because only IE8 doesn't have integrated support for this method we ensure
		it is defined (only IE8) and advise, moving forward, that the built-in method be
		used. But to preserve our original API it will simply call this method knowing
		it exists.
	
		@private
	*/
	Array.prototype.lastIndexOf = Array.prototype.lastIndexOf || function (el, offset) {
		var array = Object(this)
			, len = array.length >>> 0;
			
		if (len === 0) return -1;
		
		if (offset !== undefined) {
			offset = Number(offset);
			if (Math.abs(offset) > len) offset = len;
			if (offset === Infinity || offset === -Infinity) offset = len;
			if (offset < 0) offset += len;
		} else offset = len;
		
		for (; offset > -1; --offset) {
			if (array[offset] === el) return offset;
		}
		
		return -1;
	};
	
	/**
		@private
	*/
	Array.prototype.findIndex = Array.prototype.findIndex || function (fn, ctx) {
		for (var i=0, len=this.length >>> 0; i<len; ++i) {
			if (fn.call(ctx, this[i], i, this)) return i;
		}
		return -1;
	};
	
	/**
		@private
	*/
	Array.prototype.find = Array.prototype.find || function (fn, ctx) {
		for (var i=0, len=this.length >>> 0; i<len; ++i) {
			if (fn.call(ctx, this[i], i, this)) return this[i];
		}
	};
	
	/**
		@private
	*/
	Array.prototype.forEach = Array.prototype.forEach || function (fn, ctx) {
		for (var i=0, len=this.length >>> 0; i<len; ++i) fn.call(ctx, this[i], this);
	};
	
	/**
		@private
	*/
	Array.prototype.map = Array.prototype.map || function (fn, ctx) {
		var ret = [];
		for (var i=0, len=this.length >>> 0; i<len; ++i) {
			ret.push(fn.call(ctx, this[i], i, this));
		}
		return ret;
	};
	
	/**
		@private
	*/
	Array.prototype.filter = Array.prototype.filter || function (fn, ctx) {
		var ret = [];
		for (var i=0, len=this.length >>> 0; i<len; ++i) {
			fn.call(ctx, this[i], i, this) && ret.push(this[i]);
		}
		return ret;
	};
	
	/**
		ECMA 5.1 (ECMA-262) draft implementation of Array.prototype.indexOf. Will use the
		browser supplied method when available.
		
		@public
		@method enyo.indexOf
	*/
	enyo.indexOf = function(array, el, offset) {
		if (!enyo.isArray(array)) return el.indexOf(array, offset);
		return array.indexOf(el, offset);
	};
	
	/**
		ECMA 5.1 (ECMA-262) draft implementation of Array.prototype.lastIndexOf.
	*/
	enyo.lastIndexOf = function (array, el, offset) {
		if (!enyo.isArray(array)) return el.lastIndexOf(array, offset);
		return array.lastIndexOf(el, offset);
	};
	
	/**
		ECMA6 (ECMA-262) draft implementation of Array.prototype.findIndex.
	
		@public
		@method enyo.findIndex
	*/
	enyo.findIndex = function (array, fn, ctx) {
		return array.findIndex(fn, ctx);
	};
	
	/**
		ECMA 6 (ECMA-262) draft implementation of Array.prototype.find.
	
		@public
		@method enyo.find
	*/
	enyo.find = function (array, fn, ctx) {
		return array.find(fn, ctx);
	};
	
	/**
		ECMA 5.1 (ECMA-262) draft implementation of Array.prototype.forEach.
	
		@public
		@method enyo.forEach
	*/
	enyo.forEach = function (array, fn, ctx) {
		return array.forEach(fn, ctx);
	};
	
	/**
		@public
		@method enyo.map
	*/
	enyo.map = function (array, fn, ctx) {
		return array.map(fn, ctx);
	};
	
	/**
		@public
		@method enyo.filter
	*/
	enyo.filter = function (array, fn, ctx) {
		return array.filter(fn, ctx);
	};
	
	/**
		@public
		@method enyo.pluck
	*/
	enyo.pluck = function (array, prop) {
		if (!enyo.isArray(array)) {
			array = prop;
			prop = arguments[1];
		}
		
		var ret = [];
		for (var i=0, len=array.length >>> 0; i<len; ++i) {
			ret.push(array[i]? array[i][prop]: undefined);
		}
		return ret;
	};
	
	/**
		@public
		@method enyo.union
	*/
	enyo.union = function () {
		var ret = [];
		for (var i=0, len=arguments.length; i<len; ++i) {
			
		}
	};
	
})(enyo, this);