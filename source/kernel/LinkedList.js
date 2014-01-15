(function (enyo) {
	var kind = enyo.kind;
	
	//*@public
	/**
		This is an abstract kind used with [linked lists](#enyo.LinkedList). This should
		be subclassed for useful implementations.
	*/
	kind({
		name: "enyo.LinkedListNode",
		//*@protected
		kind: null,
		noDefer: true,
		//* The previous node in the list
		prev: null,
		//* The next node in the list
		next: null,
		copy: function () {
			var cpy = new this.constructor();
			cpy.prev = this.prev;
			cpy.next = this.next;
			return cpy;
		},
		constructor: function (props) {
			if (props) {
				enyo.mixin(this, props);
			}
		},
		destroy: function () {
			// clear reference to previous node
			this.prev = null;
			
			// if we have a reference to our next node
			// we continue down the chain
			if (this.next) {
				this.next.destroy();
			}
			
			// clear our reference to the next node
			this.next = null;
		}
	});

	//*@public
	/**
		An abstract kind used for linkable/chainable objects. Can be subclassed for various
		purposes from the simple linked-list api.
	*/
	kind({
		name: "enyo.LinkedList",
		//*@protected
		kind: null,
		noDefer: true,
		//*@public
		nodeKind: enyo.LinkedListNode,
		head: null,
		tail: null,
		length: 0,
		//* Reset the list by destroying all nodes.
		clear: function () {
			var head = this.head;
			if (head) {
				// this will trigger a chain event down the list
				head.destroy();
			}
			this.head = null;
			this.tail = null;
			this.length = 0;			
		},
		/**
		*/
		slice: function (fromNode, toNode) {
			
			// we start from the past in node or our head
			var node = fromNode || this.head;
			
			// placeholder for node copy
			var cpy;
			
			// ensure the new list is the same type as this list
			var list = new this.constructor();
			
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
		//* Free the entire list.
		destroy: function () {
			this.clear();
			this.destroyed = true;
		},
		//* Create an instance of this list's _nodeKind_ but does not add it.
		createNode: function (props) {
			var ctor = this.nodeKind;
			return new ctor(props);
		},
		/**
		*/
		deleteNode: function (node) {
			var prev = node.prev;
			var next = node.next;
			if (prev) {
				prev.next = next;
			}
			if (next) {
				next.prev = prev;
			}
			this.length--;
			node.next = node.prev = null;

			// can't chain destruct because we removed its chain references
			node.destroy();
			return this;
		},
		/**
		*/
		appendNode: function (node, targetNode) {
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
		}
	});

})(enyo);