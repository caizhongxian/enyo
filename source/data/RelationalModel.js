(function (enyo) {
	var kind = enyo.kind
		, clone = enyo.clone
		, isObject = enyo.isObject
		, isString = enyo.isString
		, forEach = enyo.forEach
		, where = enyo.where
		, mixin = enyo.mixin
		, inherit = enyo.inherit
		, constructorForKind = enyo.constructorForKind
		, find = enyo.find
		, map = enyo.map
		, store = enyo.store;
		
	var Collection = enyo.Collection
		, Model = enyo.Model;

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
		create: true,
		
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
		@private
		@abstract Relation
	*/
	var Relation = kind({
		kind: null,
		
		/**
			@private
		*/
		options: {},
		
		/**
			@private
			@method
		*/
		constructor: function (instance, props) {
			// apply any of the properties to ourself for reference
			mixin(this, [relationDefaults, this.options, props]);
			// store a reference to the model we're relating
			this.instance = instance;
			// ensure we have a constructor for our related model kind
			this.model = constructorForKind(this.model);
			// let the subkinds do their thing
			this.init();
		},
		
		/**
			@private
			@method
		*/
		destroy: function () {
			this.instance = null;
		}
	});
	
	/**
		@public
		@class enyo.toMany
	*/
	kind(
		/** @lends enyo.toMany.prototype */ {
		name: "enyo.toMany",
		kind: Relation,
		noDefer: true,
		
		/**
			@public
		*/
		options: {
			/**
			*/
			collection: Collection,
			
			/**
			*/
			collectionOptions: {}
		},
		
		/**
			@private
			@method
		*/
		init: function () {
			var inst = this.instance
				, key = this.key
				, isOwner = this.isOwner
				, autoFetch = this.autoFetch
				, parse = this.parse
				, inverseKey = this.inverseKey
				, collection = this.collection
				, collectionOpts = this.collectionOptions
				, create = this.create
				, model = this.model
				, data;
			
			isString(collection) && (collection = constructorForKind(collection));
			isString(model) && (model = constructorForKind(model));
			
			// if the model property is used for the collection constructor then we
			// use the model of this collection
			if (model.prototype instanceof Collection) {
				collection = model;
				model = collection.prototype.model;
			}
			if (!model) {
				model = collection.prototype.model;
			}
			
			if (!model || !collection) {
				return enyo.error("Cannot resolve defined relation for " + inst.kindName + " with key " + key +
					" without a valid model and/or collection property");
			} else {
				collection = this.collection = new collection(collectionOpts);
				this.model = model;
			}
			
			collection.on("add", this.onChange, this);
			collection.on("remove", this.onChange, this);
			
			// special overload of store allows us to more narrowly listen to particular events
			// for associated kinds
			store.on(model, "add", this.onChange, this);
			
			// create means we assume all data fetching will be done arbitrarily and we will not
			// be fetching separately from the owner
			if (create) {
				data = inst.get(key);
				parse && (data = collection.parse(data));
				data && collection.add(data);
			} else {
				
				// if the autoFetch flag is truthy we will execute the (assumably) asynchronous
				// request now ensuring we pass in any options that might have been available
				if (autoFetch) {
					this.fetchRelated();
				}
				
				// without an inverse key we won't be able to find the related records
				inverseKey && this.findRelated();
			}
			
			inst.attributes[key] = this;
		},
		
		/**
			@public
			@method
		*/
		fetchRelated: function () {
			
		},
		
		/**
			@public
			@method
		*/
		findRelated: function () {
			
		},
		
		/**
			@public
			@method
		*/
		getRelated: function () {
			return this.collection;
		},
		
		/**
			@public
			@method
		*/
		setRelated: function () {
			
		},
		
		/**
			@private
			@method
		*/
		onChange: function () {
			console.log("onChange", this, arguments);
		},
		
		/**
			@private
			@method
		*/
		destroy: inherit(function (sup) {
			return function () {
				sup.apply(this, arguments);
				
				// @TODO: !!!
			};
		})
	});
	
	/**
		@public
		@class enyo.toOne
	*/
	kind(
		/** @lends enyo.toOne.prototype */ {
		name: "enyo.toOne",
		kind: Relation,
		noDefer: true,
		
		/**
			@private
			@method
		*/
		init: function () {
			var inst = this.instance
				, key = this.key
				, isOwner = this.isOwner
				, autoFetch = this.autoFetch
				, parse = this.parse
				, inverseKey = this.inverseKey
				, create = this.create
				, model = this.model
				, data;
				
			isString(model) && (model = constructorForKind(model));
			
			
		},
		
		/**
			@public
			@method
		*/
		fetchRelated: function () {
			
		},
		
		/**
			@public
			@method
		*/
		findRelated: function () {
			
		},
		
		/**
			@public
			@method
		*/
		getRelated: function () {
			
		},
		
		/**
			@public
			@method
		*/
		setRelated: function () {
			
		},
		
		/**
			@private
			@method
		*/
		onChange: function () {
			console.log("onChange", this, arguments);
		}
	});

	/**
		@public
		@class enyo.RelationalModel
	*/
	kind({
		name: "enyo.RelationalModel",
		kind: Model,
		noDefer: true,
		
		/**
			@public
			@method
		*/
		getRelation: function (name) {
			return where(this.relations, function (ln) {
				return ln instanceof Relation && ln.key == name;
			});
		},
		
		/**
			@public
			@method
		*/
		isRelation: function (name) {
			return this.getRelation(name);
		},
		
		/**
			@private
			@method
		*/
		get: inherit(function (sup) {
			return function (path) {
				var prop = path
					, rel, parts;
				
				if (path.indexOf(".") >= 0) {
					parts = path.split(".");
					prop = parts.shift();
				}
				
				rel = this.isRelation(prop);
				
				return !rel? sup.apply(this, arguments):
					parts? rel.getRelated().get(parts.join(".")):
					rel.getRelated();
			};
		}),
		
		/**
			@private
			@method
		*/
		set: inherit(function (sup) {
			return function (path, is, force) {
				var prop = path
					, rel, parts;
					
				if (path.indexOf(".") >= 0) {
					parts = path.split(".");
					prop = parts.shift();
				}
				
				rel = this.isRelation(prop);
				
				return !rel? sup.apply(this, arguments):
					parts? rel.getRelated().set(parts.join("."), is, force):
					rel.setRelated(is);
			};
		}),
		
		/**
			@private
			@method
		*/
		constructor: inherit(function (sup) {
			return function () {
				sup.apply(this, arguments);

				this.initRelations();
			};
		}),
		
		/**
			@private
			@method
		*/
		destroy: inherit(function (sup) {
			return function () {
				forEach(this.relations, function (rel) { rel.destroy(); });
				sup.apply(this, arguments);
				this.relations = null;
			};
		}),
		
		/**
			@private
			@method
		*/
		initRelations: function () {
			var rels = this.relations;
			
			if (rels) {
				this.relations = map(rels, function (rel) {
					return new rel.type(this, rel);
				}, this);
			}
		}

	});
	
	//*@protected
	/**
		Ensure that we concatenate (sanely) the relations for any subkinds.
	*/
	enyo.RelationalModel.concat = function (ctor, props) {
		var proto = ctor.prototype || ctor
			, rels = proto.relations && proto.relations.slice()
			, type;

		if (props.relations) {
			rels = (rels && rels.concat(props.relations)) || props.relations;
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