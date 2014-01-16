(function (enyo) {
	
	var kind = enyo.kind
		, mixin = enyo.mixin
		, constructorForKind = enyo.constructorForKind
		, isObject = enyo.isObject;
	
	/**
		@public
		@class
	*/
	kind({
		
		name: "enyo.LinkedListNode",
		kind: null,
		noDefer: true,
		
		/**
			@private
		*/
		prev: null,
		
		/**
			@private
		*/
		next: null,
		
		/**
			@public
			@method
		*/
		copy: function () {
			var cpy = new this.ctor();
			cpy.prev = this.prev;
			cpy.next = this.next;
			return cpy;
		},
		
		/**
			@private
			@method
		*/
		constructor: function (props) {
			props && mixin(this, props);
		},
		
		/**
			@private
			@method
		*/
		destroy: function () {
			// clear reference to previous node
			this.prev = null;
			
			// if we have a reference to our next node
			// we continue down the chain
			this.next && this.next.destroy();
			
			// clear our reference to the next node
			this.next = null;
		}
	});

	/**
		@public
		@class
	*/
	kind({
		
		name: "enyo.LinkedList",
		kind: null,
		noDefer: true,
		
		/**
			@public
		*/
		nodeKind: enyo.LinkedListNode,
		
		/**
			@private
		*/
		head: null,
		
		/**
			@private
		*/
		tail: null,
		
		/**
			@public
		*/
		length: 0,
		
		/**
			@public
			@method
		*/
		clear: function () {
			if (this.head) {
				// this will trigger a chain event down the list
				this.head.destroy();
			}
			this.head = null;
			this.tail = null;
			this.length = 0;			
		},
		
		/**
			@public
			@method
		*/
		slice: function (fromNode, toNode) {
			var node = fromNode || this.head
				, list = new this.ctor()
				, cpy;
			
			// ensure we have a final node or our tail
			toNode = toNode || this.tail;
			
			if (node && node !== toNode) {
				do {
					cpy = node.copy();
					list.appendNode(cpy);
				} while ((node = node.next) && node !== toNode);
			}
			
			return list;
		},
		
		/**
			@public
			@method
		*/
		destroy: function () {
			this.clear();
			this.destroyed = true;
		},
		
		/**
			@public
			@method
		*/
		createNode: function (props) {
			return new this.nodeKind(props);
		},
		
		/**
			@public
			@method
		*/
		deleteNode: function (node) {
			this.removeNode(node);
			
			// can't chain destruct because we removed its chain references
			node.destroy();
			return this;
		},
		
		/**
			@public
			@method
		*/
		removeNode: function (node) {
			var prev = node.prev
				, next = node.next;
				
			prev && prev.next = next;
			next && next.prev = prev;
			this.length--;
			node.next = node.prev = null;
			return this;
		},
		
		/**
			@public
			@method
		*/
		appendNode: function (node, targetNode) {
			isObject(node) && (node = this.createNode(node));
			
			targetNode = targetNode || this.tail;
			
			if (targetNode) {
				
				// if we're injecting in the middle we need to update the
				// next reference of the new node
				if (targetNode.next) {
					node.next = targetNode.next;
				}
				
				// now point the next from target to the new injected node
				targetNode.next = node;
				
				// now update the prev reference node to the target node from
				// the new node
				node.prev = targetNode;
				
				// in cases where the target node was the end of the list
				// we update our tail
				if (targetNode === this.tail) {
					this.tail = node;
				}
				
				// and of course update our length
				this.length++;
			} else {
				
				// we had no nodes so the head is the tail
				this.head = this.tail = node;
				
				// clear these references as its possible to have a node from
				// another list
				node.prev = node.next = null;
				
				// we have a fixed length in this case
				this.length = 1;
			}
			return this;
		},
		
		/**
			@public
			@method
		*/
		findNode: function (fn, ctx, targetNode) {
			var node = targetNode || this.head;
			if (node) {
				do {
					if (fn.call(ctx || this, node, this)) {
						return node;
					}
				} while ((node = node.next))
			}
			// if no node qualified it returns false
			return false;
		},
		
		/**
			@public
			@method
		*/
		forward: function (fn, ctx, targetNode) {
			var node = targetNode || this.head;
			if (node) {
				do {
					if (fn.call(ctx || this, node, this)) {
						break;
					}
				} while ((node = node.next));
			}
			// returns the last node (if any) that was processed in the chain
			return node;
		},
		
		/**
			@public
			@method
		*/
		backward: function (fn, ctx, targetNode) {
			var node = targetNode || this.tail;
			if (node) {
				do {
					if (fn.call(ctx || this, node, this)) {
						break;
					}
				} while ((node = node.prev));
			}
			// returns the last node (if any) that was processed in the chain
			return node;
		},
		
		/**
			@private
			@method
		*/
		constructor: function () {
			this.nodeType = constructorForKind(this.nodeType);
		}
	});

})(enyo);