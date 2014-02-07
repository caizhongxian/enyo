(function (enyo) {
	
	var kind = enyo.kind
		, inherit = enyo.inherit
		, bind = enyo.bindSafely
		, isObject = enyo.isObject
		, forEach = enyo.forEach;
		
	var LinkedList = enyo.LinkedList
		, LinkedListNode = enyo.LinkedListNode;
	
	function get (base, prop) {
		return base && isObject(base)? (
			base.get? base.get(prop): base[prop]
		): undefined;
	}
	
	/**
		@public
		@class enyo.ObserverChainNode
	*/
	var ObserverChainNode = kind(
		/** @lends enyo.ObserverChainNode.prototype */ {
		name: "enyo.ObserverChainNode",
		kind: LinkedListNode,
		noDefer: true,
		
		/**
			@private
			@method
		*/
		constructor: inherit(function (sup) {
			return function () {
				sup.apply(this, arguments);
				this.connect();
			};
		}),
		
		/**
			@private
			@method
		*/
		destroy: inherit(function (sup) {
			return function () {
				this.disconnect();
				sup.apply(this, arguments);
				this.observer = null;
				this.list = null;
				this.object = null;
			};
		}),
		
		/**
			@public
			@method
		*/
		connect: function () {
			var obj = this.object
				, obs = this.onChange
				, prop = this.property;
			obj && obj.observe && obj.observe(prop, obs, this, {noChain: true});
		},
		
		/**
			@public
			@method
		*/
		disconnect: function () {
			var obj = this.object
				, obs = this.onChange
				, prop = this.property;
			obj && obj.unobserve && obj.unobserve(prop, obs);
		},
		
		/**
			@public
			@method
		*/
		setObject: function (object) {
			var cur = this.object
				, prop = this.property
				, was, is;
			
			if (cur !== object) {
				was = get(cur, prop);
				is = get(object, prop);
				this.disconnect();
				this.object = object;
				this.connect();
				
				// @TODO: It would be better to somehow cache values
				// such that it could intelligently derive the difference
				// without needing to continuously look it up with get
				was !== is && this.list.observed(this, was, is);
			}
		},
		
		/**
			@public
		*/
		onChange: function (was, is) {
			this.list.observed(this, was, is);
		}
	});
	
	/**
		@public
		@class enyo.ObserverChain
	*/
	kind(
		/** @lends enyo.ObserverChain.prototype */ {
		name: "enyo.ObserverChain",
		kind: LinkedList,
		nodeKind: ObserverChainNode,
		
		/**
			@private
			@method
		*/
		constructor: function (path, object) {
			this.object = object;
			this.path = path;
			this.parts = path.split(".");
			this.createChain();
		},
		
		/**
			@private
			@method
		*/
		destroy: inherit(function (sup) {
			return function () {
				sup.apply(this, arguments);
				this.object = null;
				this.parts = null;
				this.path = null;
			};
		}),
		
		/**
			@private
			@method
		*/
		rebuild: function (target) {
			if (!this.rebuilding) {
				this.rebuilding = true;
				this.forward(function (node) {
					if (node !== this.head) {
						var src = node.prev.object
							, prop = node.prev.property;
						node.setObject(get(src, prop));
					}
				}, this, target);
				this.rebuilding = false;
			}
		},
		
		/**
			@private
			@method
		*/
		buildPath: function (target) {
			var str = "";
			
			this.backward(function (node) {
				str = node.property + (str? ("." + str): str);
			}, this, target);
			
			return str;
		},
		
		/**
			@private
			@method
		*/
		createChain: function () {
			var parts = this.parts
				, next = this.object
				, last = parts.length - 1
				, $ = false
				, node;
				
			forEach(parts, function (prop, idx) {
				// we create a special case for the $ hash property
				if (prop == "$") {
					$ = true;
				} else {
					// in cases where the chain has the $ property we arbitrarily
					// force it onto our current nodes property and let the special handling
					// in ObserverChainNode and ObserverSupport handle the rest
					$ && (prop = "$." + prop);
					
					node = this.createNode({property: prop, object: next, list: this});
					this.appendNode(node);
					next = get(next, prop);
					$ = false;
				}
			}, this);
		},
		
		/**
			@private
			@method
		*/
		observed: function (node, was, is) {
			this.object.stopNotifications();
			node !== this.head && was !== is && this.object.notify(this.buildPath(node), was, is);
			this.rebuild(node);			
			this.object.startNotifications();
		}
	});
	
})(enyo);