(function (enyo) {
	var kind = enyo.kind
		, clone = enyo.clone
		, isObject = enyo.isObject
		, isString = enyo.isString
		, isFunction = enyo.isFunction
		, forEach = enyo.forEach
		, where = enyo.where
		, mixin = enyo.mixin
		, inherit = enyo.inherit
		, constructorForKind = enyo.constructorForKind
		, find = enyo.find
		, map = enyo.map
		, exists = enyo.exists
		, oKeys = enyo.keys
		, only = enyo.only
		, store = enyo.store
		, getPath = enyo.getPath;
		
	var Model = enyo.Model
		, Collection;
		
	/**
		Private class for a collection that defaults its model kind to enyo.RelationalModel
		as oppossed to enyo.Model.
		
		@private
		@class
	*/
	Collection = kind({kind: enyo.Collection, model: "enyo.RelationalModel"});

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
		inverseType: null,
		
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
			
			// unless explicitly set by the user-definition we alter the default value
			// here to "id" in non-owner relations
			this.includeInJSON = !props.includeInJSON && !this.isOwner? (this.model.prototype.primaryKey || "id"): this.includeInJSON;
			
			// let the subkinds do their thing
			this.init();
		},
		
		/**
			@public
			@method
		*/
		getRelated: function () {
			return this.related;
		},
		
		/**
			@public
			@method
		*/
		setRelated: function (related) {
			var inst = this.instance
				, key = this.key
				, was = this.related
				, changed = inst.changed || (inst.changed = {})
				, prev = inst.previous || (inst.previous = {});
			changed[key] = this.related = related;
			prev[key] = was;
			if (was !== related) {
				inst.notify(key, was, related);
				!inst.isSilenced() && inst.emit("change", changed);
			}
			return this;
		},
		
		/**
			@private
			@method
		*/
		destroy: function () {
			this.destroyed = true;
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
				, related = exists(this.related)? this.related: inst.attributes[key];
			
			isString(collection) && (collection = getPath(collection));
			isString(model) && (model = constructorForKind(model));
			
			// if the model property is used for the collection constructor then we
			// use the model of this collection
			if (model.prototype instanceof enyo.Collection) {
				collection = model;
				model = collection.prototype.model;
			}
			if (!model) model = collection.prototype.model;
			
			if (!model || !collection) {
				return enyo.error("Cannot resolve defined relation for " + inst.kindName + " with key " + key +
					" without a valid model and/or collection property");
			} else {
				this.collection = collection instanceof Collection? collection.ctor: collection;
				this.model = model;
				collection = collection instanceof Collection? collection: new collection(collectionOpts);
			}
			
			// special overload of store allows us to more narrowly listen to particular events
			// for associated kinds
			// @NOTE: We only register for this if we have an inverseKey otherwise we have no
			// way of knowing the reverse relationship
			if (inverseKey) store.on(model, "add", this.onChange, this);
			
			// create means we assume all data fetching will be done arbitrarily and we will not
			// be fetching separately from the owner
			if (create) {
				exists(related) && parse && (related = collection.parse(related));
				// we can avoid subsequent exists call because it needs to be an object
				related && collection.add(related);
			} else {
				
				// if the autoFetch flag is truthy we will execute the (assumably) asynchronous
				// request now ensuring we pass in any options that might have been available
				if (autoFetch) this.fetchRelated();
			}
			
			inst.attributes[key] = this;
			
			// we need to detect these changes to propagate them onward
			collection.on("add", this.onChange, this);
			collection.on("remove", this.onChange, this);
			
			// ensure we store our related collection now
			this.related = collection;
			// we need to look for related models
			this.findRelated();
		},
		
		/**
			@public
			@method
		*/
		fetchRelated: function () {
			
		},
		
		/**
			@private
			@method
		*/
		setRelated: inherit(function (sup) {
			return function (related) {
				// this should be safe because all models should pass this test
				// and we've already scoped the reference to the constructor for
				// quicker lookup
				if (related && related instanceof Model) {
					this.related.add(related);
					return this.related;
				} else return sup.apply(this, arguments);
			};
		}),
		
		/**
			@public
			@method
		*/
		findRelated: function () {
			var ctor = this.model
				, related = this.related
				, inverseKey = this.inverseKey
				, isOwner = this.isOwner
				, inst = this.instance
				, id = inst.get(inst.primaryKey)
				, found;
			
			if (inverseKey) {
				found = store.findLocal(ctor, this.checkRelation, this);
				
				// we shouldn't need to update any records already present so we'll ignore
				// duplicates for efficiency
				if (found.length) related.add(found, {merge: false});
			}
		},
		
		/**
			@public
			@method
		*/
		checkRelation: function (model) {
			var ctor = this.model
				, inst = this.instance
				, key = this.key
				, inverseKey = this.inverseKey
				, related = inverseKey && model.get(inverseKey)
				, rel = model.getRelation(inverseKey)
				, id = inst.get(inst.primaryKey)
				, isOwner = this.isOwner;
				
			if (exists(related) && (related === inst || related == id)) {
				
				// if the relation isn't found it probably wasn't defined and we need
				// to automatically generate it based on what we know
				if (!rel) model.relations.push((rel = new enyo.toOne(model, {
					key: inverseKey,
					inverseKey: key,
					parse: false,
					create: false,
					isOwner: !isOwner,
					model: ctor,
					related: inst
				})));
				
				if (rel.related !== inst) rel.setRelated(inst);
				return true;
			}
			
			return false;
		},
		
		/**
			@private
			@method
		*/
		raw: function () {
			var iJson = this.includeInJSON
				, raw;
			if (iJson === true) raw = this.related.raw();
			else if (isString(iJson)) raw = this.related.map(function (model) {
				return model.get(iJson);
			});
			else if (isArray(iJson)) raw = this.related.map(function (model) {
				return only(iJson, model.raw());
			});
			else if (isFunction(iJson)) raw = iJson.call(this.instance, this.key, this);
			return raw;
		},
		
		/**
			@private
			@method
		*/
		onChange: function (sender, e, props) {
			// console.log("enyo.toMany.onChange: ", arguments);
			
			if (sender === store) {
				if (e == "add") {
					if (this.checkRelation(props.model)) this.related.add(props.model, {merge: false});
				}
			}
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
		
		options: {
			inverseType: "enyo.toOne"
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
				, inverseType = this.inverseType
				, create = this.create
				, model = this.model
				, modelOpts = this.modelOptions
				, related = exists(this.related)? this.related: inst.attributes[key];
				
			isString(model) && (model = constructorForKind(model));
			isString(inverseType) && (inverseType = constructorForKind(inverseType));
			
			// ensure we have the correct model constructor
			this.model = model;
			this.related = related;
			this.inverseType = inverseType;
			
			if (isOwner) {
				if (create) {
					model = new model(null, null, modelOpts);
					exists(related) && parse && (related = model.parse(related));
					related && model.set(related);
					related = model;
					model = this.model;
				} else {
					
					// in cases where we are the owner but aren't supposed to create the
					// other end of the relation we wait for it to appear
					store.on(model, this.onChange, this);
				}
			}
			// ensure that the property points to us as the value
			inst.attributes[key] = this;
			// we need to know about all future changes
			inst.on("change", this.onChange, this);
			// attempt to find and or setup any related value that we can at this time
			this.findRelated();
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
			var related = this.related
				, inst = this.instance
				, ctor = this.model
				, key = this.key
				, inverseKey = this.inverseKey
				, inverseType = this.inverseType
				, isOwner = this.isOwner
				, found, rel;
			if (related && related instanceof ctor) {
				found = related;
			} else if (exists(related) || inverseKey) {
				
				// in cases where some value of some sort was supplied to try loose comparison
				// for euid and primaryKey to find it in the store
				found = store.findLocal(ctor, this.checkRelation, this, {all: false});
			}
			
			if (found) {
				// remove our listener on the store if it's there because
				// we don't need it anymore
				isOwner && store.off(ctor, this.onChange, this);
				// we also establish this found entity as our related model
				this.related = found;
				// we try and establish the relation when possible
				if (inverseKey) {
					rel = found.getRelation(inverseKey);
					
					if (!rel) found.relations.push((rel = new inverseType(found, {
						isOwner: !isOwner,
						key: inverseKey,
						inverseKey: key,
						parse: false,
						create: false,
						model: inst.ctor,
						related: inst
					})));
					
					switch (rel.kindName) {
					case "enyo.toOne":
						if (rel.related !== inst) rel.setRelated(inst);
						break;
					case "enyo.toMany":
						// its unfortunate but we will allow this to attempt the add to avoid the
						// double lookup hit - if it is already present on the next pass (via the
						// store's add event) it will do hardly anything
						rel.related.add(inst, {merge: false});
						break;
					}
				}
			}
		},
		
		/**
			@private
			@method
		*/
		checkRelation: function (model) {
			var related = this.related
				, inst = this.instance
				, id = inst.get(inst.primaryKey)
				, inverseKey = this.inverseKey;
			return model.euid == related || model.get(model.primaryKey) == related || (exists(id) && model.get(inverseKey) == id);
		},
		
		/**
			@private
			@method
		*/
		raw: function () {
			var iJson = this.includeInJSON
				, raw;
			if (iJson === true) raw = this.related.raw();
			else if (isString(iJson)) raw = this.related.get(iJson);
			else if (isArray(iJson)) raw = only(iJson, this.related.raw());
			else if (isFunction(iJson)) raw = iJson.call(this.instance, this.key, this);
			return raw;
		},
		
		/**
			@private
			@method
		*/
		onChange: function (sender, e, props) {
			var key = this.key;
			
			// console.log("enyo.toOne.onChange", arguments);
			
			if (sender === this.instance) {
				if (e == "change") {
					if (key in props) {
						this.findRelated();
					}
				}
			}
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
			@public
			@method
		*/
		fetchRelated: function () {
			
		},
		
		/**
			@private
			@method
		*/
		get: inherit(function (sup) {
			return function (path) {
				path || (path = "");
				
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
				path || (path = "");
				
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
		raw: function () {
			var inc = this.includeKeys
				, attrs = this.attributes
				, keys = inc || oKeys(attrs)
				, cpy = inc? only(inc, attrs): clone(attrs);
				
			forEach(keys, function (key) {
				var rel = this.isRelation(key)
					, ent = rel? rel.getRelated(): this.get(key);
				if (!rel) {
					if (isFunction(ent)) ent.call(this);
					else if (ent && ent.raw) cpy[key] = ent.raw();
					else cpy[key] = ent;
				} else {
					var iJson = rel.includeInJSON;
					// special handling for relations as we need to ensure that
					// they are indeed supposed to be included

					// if it is a falsy value then we do nothing
					if (!iJson) delete cpy[key];
					// otherwise we leave it up to the relation to return the correct
					// value for its settings
					else cpy[key] = rel.raw();
				}
			}, this);
			
			return cpy;
		},
		
		/**
			@private
			@method
		*/
		constructor: inherit(function (sup) {
			return function (attrs, props, opts) {
				opts = opts || {};
				// we need to postpone the addition of the record to the store
				opts.noAdd = true;
				sup.call(this, attrs, props, opts);
				this.initRelations();
				this.store.add(this, opts);
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
			var rels = this.relations || (this.relations = []);
			
			if (rels.length) {
				this.relations = map(rels, function (rel) {
					return new rel.type(this, rel);
				}, this);
			}
		}

	});
	
	/**
		Ensure that we concatenate (sanely) the relations for any subkinds.
	
		@private
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