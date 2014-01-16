(function (enyo) {
	var kind = enyo.kind
		, clone = enyo.clone
		, isObject = enyo.isObject
		, isString = enyo.isString
		, forEach = enyo.forEach
		, mixin = enyo.mixin
		, inherit = enyo.inherit
		, constructorForKind = enyo.constructorForKind
		, find = enyo.find;

	/**
	*/
	var relationDefaults = {
		/**
		*/
		type: "toOne",
		
		/**
		*/
		key: null,
		
		/**
		*/
		parse: false,
		
		/**
		*/
		model: "enyo.RelationalModel",
		
		/**
		*/
		autoFetch: false,
		
		/**
		*/
		inverseKey: null,
		
		/**
		*/
		isOwner: true,
		
		/**
		*/
		includeInJSON: true
	};

	/**
	*/
	var Relation = kind({
		kind: null,
		constructor: function (instance, props) {
			// apply any of the properties to ourself for reference
			mixin(this, [clone(relationDefaults), props]);
			// store a reference to the model we're relating
			this.instance = instance;
			// ensure we have a constructor for our related model kind
			this.model = constructorForKind(this.model);
			// let the subkinds do their thing
			this.init();
		},
		
		destroy: function () {
			if (this.inverse && this.isOwner) {
				this.inverse.model.destroy();
			}
			this.inverse = null;
			this.instance = null;
		}
	});
	
	/**
	*/
	kind({
		name: "enyo.toMany",
		kind: Relation,
		noDefer: true,
		init: function () {
			var model = this.instance
				, key = this.key
				, type = this.model
				, isOwner = this.isOwner
				, autoFetch = this.autoFetch
				, inverseKey = this.inverseKey
				, proto = type.prototype
				, parse = this.parse
				, inverse = proto.relation
				, store = model.store
				, col, data;
			
			// sanity
			if (!(proto instanceof enyo.Collection)) {
				throw "The model property of a toMany relation must be an enyo.Collection";
			}
			
			if (isOwner) {
				col = new type();
				col.set("relation", this);
				// col.listen("change")
				
				if (autoFetch) {
					col.fetch();
				} else {
					data = model.get(key);
				
					if (data) {
						col.add(parse? col.parse(data): data);
					}					
				}
				
				model.attributes[key] = col;
			}
		},
		recordChanged: function (col, e, changed) {
			var model = this.instance
				, isOwner = this.isOwner
				, key = this.key;
			
			if (isOwner) {
				model.dirty = true;
				model.changed[key] = col;
				model.triggerEvent("change", changed);
				model.changed = {};
			}
		},
		recordDestroyed: function (col, e, changed) {
			var model = this.instance
				, isOwner = this.isOwner
				, key = this.key;
				
			if (isOwner) {
				model.dirty = true;
				model.changed[key] = col;
				model.triggerEvent("change", changed);
				model.changed = {};
			}
		}
	});
	
	/**
	*/
	kind({
		name: "enyo.toOne",
		kind: Relation,
		noDefer: true,
		init: function () {
			var model = this.instance
				, key = this.key
				, type = this.model
				, isOwner = this.isOwner
				, autoFetch = this.autoFetch
				, inverseKey = this.inverseKey
				, proto = type.prototype
				, parse = this.parse
				, store = model.store
				, rec, data, inverse;
			
			// sanity
			if (!(proto instanceof enyo.RelationalModel)) {
				throw "The model property of a toOne relation must be an enyo.RelationalModel";
			}
			
			if (isOwner) {
				rec = new type();
				
				if (inverseKey) {
					inverse = rec.getRelation(inverseKey);
					this.inverse = inverse;
					
					rec.attributes[inverseKey] = model;
				}
				
				data = model.get(key);
				
				if (data) {
					rec.set()
				}
			}
		}
	});

	/**
	*/
	kind({
		name: "enyo.RelationalModel",
		kind: "enyo.Model",
		noDefer: true,

		/**
		*/
		constructor: inherit(function (sup) {
			return function () {
				sup.apply(this, arguments);

				this.initRelations();
			};
		}),
		
		/**
		*/
		destroy: inherit(function (sup) {
			return function () {
				forEach(this.relations, function (rel) { rel.destroy(); });
				sup.apply(this, arguments);
				this.relations === null;
			};
		}),
		
		/**
		*/
		parse: function (data) {
			return data;
		},

		/**
		*/
		initRelations: function () {
			var relations = this.relations = this.relations.slice();
			this.silence();
			forEach(relations, function (rel, idx) {
				relations[idx] = new rel.type(this, rel);
			}, this);
			this.unsilence();
		}

	});
	
	//*@protected
	/**
		Ensure that we concatenate (sanely) the relations for any subkinds.
	*/
	enyo.RelationalModel.concat = function (ctor, props) {
		var proto = ctor.prototype || ctor
			, rels = proto.relations? clone(proto.relations): []
			, type;

		if (props.relations) {
			rels = rels.concat(props.relations);
		}

		// quickly fetch the constructor for the relation once so all instances won't
		// have to look it up later, only need to do this for the incoming props as
		// it will have already been done for any existing relations from a base kind
		forEach(props.relations, function (relation) {
			var type = relation.type;
			
			if (!(type === enyo.toMany) && !(type === enyo.toOne)) {
				relation.type = isString(type)? constructorForKind(enyo[type] || type): enyo.toOne;
			}
		});
		
		// remove this property so it will not be slammed on top of the root property
		delete props.relations
		// apply our modified relations array to the prototype
		proto.relations = rels;
	};

})(enyo);