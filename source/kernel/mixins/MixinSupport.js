(function (enyo) {
	
	var forEach = enyo.forEach
		, extend = enyo.kind.statics.extend
		, isString = enyo.isString
		, isArray = enyo.isArray
		, clone = enyo.clone
		, indexOf = enyo.indexOf
		, inherit = enyo.inherit;
	
	/**
		Apply, with safeguards, a given mixin to an object.
		@private
	*/
	function apply (proto, props) {
		var applied = proto._mixins || (proto._mixins = [])
			, name = isString(props)? props: props.name
			, idx = indexOf(name, applied);
			
		if (idx < 0) {
			name == props && (props = getPath(name));
			
			// if we could not resolve the requested mixin (should never happen)
			// we throw a simple little error
			!props && enyo.error("Could not find the mixin " + name);
			
			applied.push(name);
			
			// we need to temporarily move the constructor if it has one so it
			// will override the correct method - this is a one-time permanent
			// runtime operation so subsequent additions of the mixin don't require
			// it again
			if (props.hasOwnProperty("constructor")) {
				props._constructor = props.constructor;
				delete props.constructor;
			}
			
			delete props.name;
			extend(props, proto);
			
			// now put it all back the way it was
			props.name = name;
		}
	}
	
	/**
		@private
	*/
	function feature (ctor, props) {
		if (props.mixins) {
			var proto = ctor.prototype || ctor
				, mixins = props.mixins;
			
			delete props.mixins;
			delete proto.mixins;
			
			proto._mixins && (proto._mixins = proto._mixins.slice());
			forEach(mixins, function (ln) { apply(proto, ln); });
		}
	}
	
	enyo.kind.features.push(feature);
	
	var sup = enyo.kind.statics.extend;
	
	/**
		@private
	*/
	extend = enyo.kind.statics.extend = function (args, target) {
		if (isArray(args)) {
			return forEach(args, function (ln) { extend.call(this, ln, target); }, this);
		}
		
		if (args.mixins) feature(target || this, args);
		else if (isString(args)) apply(target || this.prototype, args);
		else if (args.name) apply(target || this.prototype, args);
		
		
		sup.apply(this, arguments);
	};
	
	/**
		@public
		@mixin enyo.MixinSupport
	*/
	enyo.MixinSupport = {
		name: "MixinSupport",
		
		/**
			@public
			@method
		*/
		extend: function (props) {
			props && apply(this, props);
		},
		
		/**
			@private
			@method
		*/
		importProps: inherit(function (sup) {
			return function (props) {
				props && props.mixins && feature(this, props);
				
				sup.apply(this, arguments);
			};
		})
	};
	
	
	
	
	// //*@public
	// /**
	// 	An _enyo.Mixin_ is a group of properties and/or methods to apply to a kind
	// 	or instance without requiring the kind to be subclassed. There are a few
	// 	things to keep in mind when creating an _enyo.Mixin_ for use with your
	// 	kinds:
	// 
	// 	- A property on a mixin will automatically override the same property on the
	// 		kind or instance it is being applied to, should it already exist.
	// 
	// 	- A method that already exists on the kind or instance will not
	// 		automatically call the super-method. If the intention is to extend the
	// 		kind's own method, make sure that you wrap the method with _enyo.inherit_.
	// 
	// 	- Mixins must have a name so they can be identified when applied; otherwise,
	// 		the same mixin may be applied multiple times to a given kind,
	// 		potentially resulting in an infinite loop.
	// 
	// 	An _enyo.Mixin_ is _not a kind_. It is simply a named collection of methods
	// 	and properties that may be reused with multiple kinds.
	// 
	// 	To create an _enyo.Mixin_, simply create a hash of methods and properties,
	// 	and assign it to a referenceable namespace.
	// 
	// 	To apply an _enyo.Mixin_ to a kind, simply add its name or a reference to it
	// 	in the special _mixins_ property in the kind definition. Alternatively, you
	// 	may call _extend()_ on the constructor for the kind, passing in the mixin
	// 	(or an array of mixins).
	// 
	// 	To apply an _enyo.Mixin_ to an instance of a kind, call the _extend()_
	// 	method on the instance and pass it the name of (or a reference to) the mixin,
	// 	or an array of mixins.
	// */
	// 
	// //*@protected
	// /**
	// 	We add the feature that will execute last in the feature chain but will scan
	// 	for mixins and extend the kind accordingly, only applying any given mixin one time
	// 	to any kind base.
	// */
	// var applyMixin = function (proto, props) {
	// 	var mx = proto._appliedMixins,
	// 		m = props, n;
	// 	// if the mixin is a string we have to try to resolve it to an object
	// 	if (enyo.isString(m)) {
	// 		m = enyo.getPath(m);
	// 		if (!m) {
	// 			enyo.warn("could not find the requested mixin " + props);
	// 			// could not find the mixin
	// 			return;
	// 		}
	// 	}
	// 	// we can't do anything if someone attempts to extend a kind with a mixin
	// 	// that does not have a name but all internal mixins should have names
	// 	if (m.name) {
	// 		if (!~enyo.indexOf(m.name, mx)) {
	// 			mx.push(m.name);
	// 		} else {
	// 			// we will not add the same mixin twice, but we throw the warning
	// 			// to alert the developer of the attempt so it can be tracked down
	// 			enyo.warn("attempt to add the same mixin more than once, " +
	// 				m.name + " onto -> " + proto.kindName);
	// 			return;
	// 		}
	// 		n = m.name;
	// 		delete m.name;
	// 	} else {
	// 		n = null;
	// 	}
	// 	var mc = enyo.clone(m);
	// 	// rename constructor to _constructor to work around IE8/Prototype problems
	// 	if (m.hasOwnProperty("constructor")) {
	// 		mc._constructor = m.constructor;
	// 		delete mc.constructor;
	// 	}
	// 	enyo.kind.statics.extend(mc, proto);
	// 	if (n) {
	// 		m.name = n;
	// 	}
	// };
	// var mixinsFeature = function (ctor, props) {
	// 	if (props.mixins) {
	// 		var cp = ctor.prototype || ctor,
	// 			pm = props.mixins;
	// 		cp._appliedMixins = cp._appliedMixins? enyo.cloneArray(cp._appliedMixins): [],
	// 		// prevent recursion
	// 		delete props.mixins;
	// 		for (var i=0, m; (m=pm[i]); ++i) {
	// 			applyMixin(cp, m);
	// 		}
	// 	}
	// };
	// enyo.kind.features.push(mixinsFeature);
	// var fn = enyo.concatHandler;
	// enyo.concatHandler = function (ctor, props) {
	// 	if (props.mixins) {
	// 		var p = ctor.prototype || ctor;
	// 		p.mixins = (p.mixins? p.mixins.concat(props.mixins): props.mixins.slice());
	// 	}
	// 	fn.apply(this, arguments);
	// };
	// enyo.kind.extendMethods(enyo.kind.statics, {
	// 	extend: enyo.inherit(function (sup) {
	// 		return function (props, target) {
	// 			var proto = target || this.prototype;
	// 			if (props.mixins) {
	// 				// cut-out the need for concatenated properties to handle
	// 				// this (and it won't be able to because we're removing the
	// 				// new mixins array)
	// 				proto.mixins = enyo.merge(proto.mixins, props.mixins);
	// 				mixinsFeature(proto, props);
	// 			}
	// 			return sup.apply(this, arguments);
	// 		};
	// 	})
	// }, true);
	// //*@public
	// enyo.MixinSupport = {
	// 	name: "MixinSupport",
	// 	/**
	// 		Takes a single parameter--a hash of properties to apply. To be considered
	// 		a _mixin_, it must have a _name_ property that is unique, but the method
	// 		will apply even non-mixins to the kind instance.
	// 	*/
	// 	extend: function (props) {
	// 		applyMixin(this, props);
	// 	},
	// 	/**
	// 		Extend the _importProps()_ method to ensure we can handle runtime additions
	// 		of the mixins' properties since they can be added at any time, even by other
	// 		mixins. This will only be executed against mixins applied after the kind
	// 		has already been evaluated and it is being initialized as an instance.
	// 		However, if a mixin applies more mixins at runtime, it will have no effect.
	// 	*/
	// 	importProps: enyo.inherit(function (sup) {
	// 		return function (props) {
	// 			if (props) { mixinsFeature(this, props); }
	// 			sup.apply(this, arguments);
	// 		};
	// 	})
	// };
}(enyo));
