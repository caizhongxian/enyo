(function (enyo) {
	
	var kind = enyo.kind
		, inherit = enyo.inherit
		, isArray = enyo.isArray
		, isObject = enyo.isObject
		, isString = enyo.isString
		, constructorForKind = enyo.constructorForKind
		// , forEach = enyo.forEach
		// , map = enyo.map
		// , where = enyo.where
		// , find = enyo.find
		// , filter = enyo.filter
		, store = enyo.store
		, uid = enyo.uid
		, mixin = enyo.mixin
		, json = enyo.json;
	
	var Component = enyo.Component
		, EventEmitter = enyo.EventEmitter
		, Model = enyo.Model
		, ModelList = enyo.ModelList;
	
	/**
		@public
		@class enyo.Collection
	*/
	var Collection = kind(
		/** @lends enyo.Collection.prototype */ {
		name: "enyo.Collection",
		kind: Component,
		noDefer: true,
		
		/**
			@public
		*/
		model: Model,
		
		/**
			@public
		*/
		options: {},
		
		/**
			@private
		*/
		mixins: [EventEmitter],
		
		/**
			@public
			@method
		*/
		parse: function (data) {
			return data;
		},
		
		/**
			@public
			@method
		*/
		add: function (models, opts) {
			var loc = this.models
				, len = this.length
				, ctor = this.model
				, options = {merge: true, silent: false, purge: false, parse: false, create: true, find: true}
				, pkey = ctor.prototype.primaryKey
				, idx = len
				, added, keep, removed, model, attrs, found, id;
				
			// for backwards compatibility with earlier api standards we allow the
			// second paramter to be the index and third param options when
			// necessary
			!isNaN(opts) && (idx = opts);
			arguments.length > 2 && (opts = arguments[2]);
			
			// normalize options so we have values
			opts = opts? mixin({}, [options, opts]): options;
			
			// our flags
			var merge = opts.merge
				, purge = opts.purge
				, silent = opts.silent
				, parse = opts.parse
				, find = opts.find
				, create = opts.create !== false;
				
			// for a special case purge to remove records that aren't in the current
			// set being added
				
			// we treat all additions as an array of additions
			!isArray(models) && (models = [models]);
			
			for (var i=0, end=models.length; i<end; ++i) {
				model = models[i];
				
				if (!model) continue;
				
				// first determine if the model is an instance of model since
				// everything else hinges on this
				if (!(model instanceof Model)) {
					// we need to determine how to handle this
					attrs = model;
				}
				
				id = attrs? attrs[pkey]: model;
				
				// see if we have an existing entry for this model/hash
				found = loc.has(id);
				
				// if it already existed...
				if (found) {
					if (merge) {
						attrs || (attrs = model.attributes);
						parse && (attrs = found.parse(attrs));
						found.set(attrs, opts);
					}
					// with the purge flag we endeavor on the expensive track of removing
					// those models currently in the collection that aren't in the incoming
					// dataset and aren't being created
					if (purge) {
						keep || (keep = {length: 0});
						// we simply need the euid the value doesn't matter and null is fastest
						// assignment
						keep[found.euid] = null;
						keep.length++;
					}
				} else if (attrs && find && (found = this.store.has(ctor, id))) {
					// in this case we were asked to search our store for an existing record
					// and we found one but we didn't previously have it so we are technically
					// adding it
					// @NOTE: Setting the _find_ option always assumes _merge_
					attrs || (attrs = model.attributes);
					parse && (attrs = found.parse(attrs));
					added || (added = []);
					added.push(found);
					this.prepareModel(found);
					found.set(attrs, opts);
				} else if (!attrs) {
					added || (added = []);
					added.push(model);
					this.prepareModel(model);
				} else if (create) {
					model = this.prepareModel(attrs || model);
					added || (added = []);
					added.push(model);
				}
			}
			
			// here we process those models to be removed if purge was true
			// the other guard is just in case we actually get to keep everything
			// so we don't do this unnecessary pass
			if (purge && keep && keep.length < len) {
				removed || (removed = []);
				for (i=0; i<len; ++i) !keep[(model = loc.at(i)).euid] && removed.push(model);
				// if we removed any we process that now
				removed.length && this.remove(removed, options);
			}
			
			added && loc.add(added, idx);
			
			this.length = loc.length;
			
			if (!silent) {
				// notify observers of the length change
				len != this.length && this.notify("length", len, this.length);
				// notify listeners of the addition of records
				added && this.emit("add", {/* for backward compatibility */ records: added, /* prefered */ models: added});
			}
			return added;
		},
		
		/**
			@public
			@method
		*/
		remove: function (models, opts) {
			var loc = this.models
				, len = loc.length
				, ctor = this.model
				, options = {silent: false, destroy: false, complete: false}
				, removed, model, idx;
			
			// normalize options so we have values
			opts = opts? mixin({}, [options, opts]): options;
			
			// our flags
			var silent = opts.silent
				, destroy = opts.destroy
				, complete = opts.complete;
			
			// we treat all additions as an array of additions
			!isArray(models) && (models = [models]);
			
			// most features dependent on notification of this action can and should
			// avoid needing the original indices of the models being removed
			for (var i=0, end=models.length; i<end; ++i) {
				model = models[i];
				loc.remove(model);
				// we know if it successfully removed the model because the length was
				// updated accordingly
				if (loc.length != len) {
					removed || (removed = []);
					removed.push(model);
					
					// if destroy is true then we call that now and it won't have duplicate remove
					// requests because the event responder only calls remove if the model isn't
					// destroyed and we can ignore the complete flag because it will automatically
					// be removed from the store when it is destroyed
					if (destroy) model.destroy(opts);
					// we need to also remove it from the store if we can
					else if (complete) this.store.remove(ctor, model);
					// update our internal length because it was decremented
					len = loc.length;
				}
			}
			
			// we have to update this value regardless so ensure we know the original in case
			// we need to provide an update
			len = this.length;
			this.length = loc.length;
			
			if (!silent) {
				len != this.length && this.notify("length", len, this.length);
				removed && this.emit("remove", {/* for partial backward compatibility */records: removed, /* prefered */models: removed});
			}
			return removed;
		},
		
		/**
			@public
			@method
		*/
		at: function (idx) {
			return this.models.at(idx);
		},
		
		/**
			@public
			@method
		*/
		raw: function () {
			return this.models.map(function (model) {
				return model.raw();
			});
		},
		
		/**
			@public
			@method
		*/
		has: function (model) {
			return this.models.has(model);
		},
		
		/**
			@public
			@method
		*/
		contains: function (model) {
			return this.has(model);
		},
		
		/**
			@public
			@method
		*/
		forEach: function (fn, ctx) {
			return this.models.forEach(fn, ctx || this);
		},
		
		/**
			@public
			@method
		*/
		filter: function (fn, ctx) {
			return this.models.filter(fn, ctx || this);
		},
		
		/**
			@public
			@method
		*/
		find: function (fn, ctx) {
			return this.models.find(fn, ctx || this);
		},
		
		/**
			@public
			@method
		*/
		map: function (fn, ctx) {
			return this.models.map(fn, ctx || this);
		},
		
		/**
			@public
			@method
		*/
		indexOf: function (model, offset) {
			return this.models.indexOf(model, offset);
		},
		
		/**
			@public
			@method
		*/
		toJSON: function () {
			return json.stringify(this.raw());
		},
		
		/**
			@public
			@method
		*/
		sort: function (fn) {
			this.models.sort(fn || this.comparator);
			this.emit("sort", fn || this.comparator);
			return this;
		},
		
		/**
			@public
			@method
		*/
		comparator: function () {},
		
		/**
			@private
			@method
		*/
		prepareModel: function (attrs, opts) {
			var ctor = this.model
				, options = {owner: this, silent: true}
				, model;
			
			opts = opts? mixin({}, [options, opts]): options;
			
			attrs instanceof ctor && (model = attrs);
			if (!model) model = new ctor(attrs, opts);
			
			model.on("*", this.onModelEvent, this);
			
			return model;
		},
		
		/**
			@private
			@method
		*/
		onModelEvent: function (model, e) {
			// this.log(arguments);
			
			switch (e) {
			case "destroy":
				this.remove(model);
				break;
			case "change":
				break;
			}
		},
		
		/**
			@private
			@method
		*/
		constructor: inherit(function (sup) {
			return function (recs, props, opts) {
				opts = opts? (this.options = mixin({}, [this.options, opts])): this.options;
				
				// if properties were passed in but not a records array
				props = recs && !isArray(recs)? recs: props;
				if (props === recs) recs = null;
				// initialize our core records
				this.models = new ModelList();
				
				if (props && props.records) {
					recs = recs? recs.concat(props.records): props.records.slice();
					delete props.records;
				}
				
				this.length = this.models.length;
				this.euid = uid("c");
				
				sup.call(this, props);
				
				recs && recs.length && this.add(recs, opts);
				this.store = this.store || store;
				isString(this.model) && (this.model = constructorForKind(this.model));
			};
		})
	});
	
	/**
		@private
		@static
	*/
	Collection.concat = function (ctor, props) {
		var proto = ctor.prototype || ctor;
		
		if (props.options) {
			proto.options = mixin({}, [proto.options, props.options]);
			delete props.options;
		}
	};
	
})(enyo);


// //*@public
// /**
// 	_enyo.Collection_ is an array-like structure that houses collections of
// 	[enyo.Model](#enyo.Model) instances. Collections are read-only entities in
// 	terms of retrieving and setting data via an [enyo.Source](#enyo.Source).
// 	Like _enyo.Model_, _enyo.Collection_ has a separate and distinct non-
// 	bubbling notification API.  Collection objects generate _add_, _remove_,
// 	_reset_ and _destroy_ events that may be listened for using the
// 	_addListener()_ method.
// 
// 	A collection lazily instantiates records when they are requested. This is
// 	important to keep in mind with respect to the order of operations.
// */
// enyo.kind({
// 	name: "enyo.Collection",
// 	//*@protected
// 	kind: enyo.Component,
// 	noDefer: true,
// 	mixins: [enyo.RegisteredEventSupport],
// 	//*@public
// 	/**
// 		The kind of records the collection will house. By default, it is simply
// 		_enyo.Model_, but it may be set to any kind of model.
// 	*/
// 	model: enyo.Model,
// 	/**
// 		The correct URL for requesting data for this collection.
// 	*/
// 	url: "",
// 	/**
// 		By default, collections instantiate records only as needed; set this flag to
// 		true if you want records to be created as soon as as they are added to the
// 		collection
// 	*/
// 	instanceAllRecords: false,
// 	/**
// 		The default source for requests made by this collection
// 	*/
// 	defaultSource: "ajax",
// 	/**
// 		The underlying array that stores the records for this collection. Modifying
// 		this array may have undesirable effects.
// 	*/
// 	records: null,
// 	/**
// 		True if the collection is currently facading data as a filtered dataset;
// 		otherwise, false.
// 	*/
// 	filtered: false,
// 	/**
// 		Collections that need to temporarily filter their data based on events or
// 		other criteria may use this object to map a filter name to a filter method
// 		on the collection that will be called in the context of the collection when
// 		the filter name is set as the _activeFilter_ property. These methods should
// 		return the array they wish to have the collection reset to, true to force
// 		a reset, or any falsey value to do nothing. Note that you can call _reset()_
// 		within the filter, but no _reset_ event will be emitted.
// 	*/
// 	filters: null,
// 	/**
// 		This is an array or space-delimited string of properties that, when updated from
// 		bindings or via the _set()_ method, will trigger a _filter_ event on the
// 		collection automatically if an _activeFilter_ is active.
// 	*/
// 	filterProps: "",
// 	/**
// 		A string that names the current filter from the _filters_ property to apply
// 		(or that is being applied) to the collection. Setting this value will
// 		automatically trigger the filter method. If a filter is set, it will be run
// 		any time new records are added to the collection. You can also force the
// 		collection to filter its content according to the _activeFilter_ by calling
// 		_triggerEvent("filter")_.
// 	*/
// 	activeFilter: "",
// 	/**
// 		Preserve records generated by this collection, even if the collection is
// 		destroyed. By default, they will also be destroyed.
// 	*/
// 	preserveRecords: false,
// 	/**
// 		All collections have a store reference. You may set this to a specific
// 		store instance in your application or use the default (the _enyo.store_
// 		global).
// 	*/
// 	store: null,
// 	/**
// 		The number of records in the collection
// 	*/
// 	length: 0,
// 	/**
// 		Fetches the data for this collection. Accepts options with optional
// 		callbacks, _success_ and _fail_, the _source_ (if not specified, the
// 		_defaultSource_ for the kind will be used), and the _replace_ flag. If
// 		_replace_ is true, all current records in the collection will be removed
// 		(though not	destroyed) before adding any results. If this is the case, the
// 		method will return an array of any records that were removed. If the _destroy_
// 		or _destroyLocal_ flags are set to `true` they will trigger the correct
// 		method to remove the records and also destroy them locally or remotely
// 		depending on which feature is set. Note that if a model's _readOnly_ flag
// 		is set to `true` calling _destroy()_ will have the same effect as _destroyLocal()_.
// 
// 		The options	may include a _strategy_ for how received data is added to the
// 		collection. The _"add"_ strategy (the default) is most efficient; it places
// 		each incoming record at the end of the collection. The _"merge"_ strategy
// 		will make the collection attempt to identify existing records with the same
// 		_primaryKey_ as the incoming one, updating any matching records. When using
// 		the _add_ strategy, if incoming data from _fetch()_ belongs to a record
// 		already in the collection, this record will be duplicated and have a unique
// 		_euid_.
// 
// 		This method will call _reset()_ if any filters have been applied to the
// 		collection.
// 	*/
// 	fetch: function (opts) {
// 		if (this.filtered) { this.reset(); }
// 		var o = opts? enyo.clone(opts): {};
// 		// ensure there is a strategy for the _didFetch_ method
// 		(opts = opts || {}) && (opts.strategy = opts.strategy || "add");
// 		o.success = enyo.bindSafely(this, "didFetch", this, opts);
// 		o.fail = enyo.bindSafely(this, "didFail", "fetch", this, opts);
// 		// now if we need to lets remove the records and attempt to do this
// 		// while any possible asynchronous remote (not always remote...) calls
// 		// are made for efficiency
// 		enyo.asyncMethod(this, function () { this.store.fetchRecord(this, o); });
// 	},
// 	/**
// 		Convenience method that does not require the callee to set the _replace_
// 		parameter in the passed-in options.
// 	*/
// 	fetchAndReplace: function (opts) {
// 		var o = opts || {};
// 		o.replace = true;
// 		return this.fetch(o);
// 	},
// 	/**
// 		Convenience method that does not require the callee to set the _destroy_
// 		parameter in the passed-in options.
// 	*/
// 	fetchAndDestroy: function (opts) {
// 		var o = opts || {};
// 		o.destroy = true;
// 		return this.fetch(o);
// 	},
// 	/**
// 		Convenience method that does not require the callee to set the _destroyLocal_
// 		parameter in the passed-in options.
// 	*/
// 	fetchAndDestroyLocal: function (opts) {
// 		var o = opts || {};
// 		o.destroyLocal = true;
// 		return this.fetch(o);
// 	},
// 	/**
// 		This method is executed after a successful fetch, asynchronously. Any new
// 		data either replaces or is merged with the existing data (as determined by
// 		the _replace_ option for _fetch()_). Receives the collection, the options,
// 		and the result (_res_).
// 	*/
// 	didFetch: function (rec, opts, res) {
// 		// empty the collection accordingly, if needed
// 		if (opts.replace && !opts.destroy) {
// 			this.removeAll();
// 		} else if (opts.destroy && !opts.destroyLocal) {
// 			this.destroyAll();
// 		} else if (opts.destroyLocal) {
// 			this.destroyAllLocal();
// 		}
// 		// the parsed result
// 		var rr = this.parse(res),
// 			s  = opts.strategy, fn;
// 		if (rr) {
// 			// unfortunately we have to mark this all as having been fetched so when they
// 			// are instantiated they won't have their _isNew_ flag set to true
// 			for (var i=0, data; (data=rr[i]); ++i) {
// 				if (data) {
// 					data.isNew = false;
// 				}
// 			}
// 			// even if replace was requested it will have already taken place so we
// 			// need only evaluate the strategy for merging the new results
// 			if ((fn=this[s]) && enyo.isFunction(fn)) {
// 				fn.call(this, rr);
// 			}
// 		}
// 		if (opts) {
// 			if (opts.success) { opts.success(rec, opts, res); }
// 		}
// 	},
// 	/**
// 		When a record fails during a request, this method is executed with the name
// 		of the command that failed, followed by a reference to the record, the
// 		original options, and the result (if any).
// 	*/
// 	didFail: function (which, rec, opts, res) {
// 		if (opts && opts.fail) {
// 			opts.fail(rec, opts, res);
// 		}
// 	},
// 	/**
// 		Overload this method to process incoming data before _didFetch()_ attempts
// 		to merge it. This method should _always_ return an array of record hashes.
// 	*/
// 	parse: function (data) {
// 		return data;
// 	},
// 	/**
// 		Produces an immutable hash of the contents of the collection as a
// 		JSON-parseable array. If the collection is currently filtered, it will
// 		produce only the raw output for the filtered dataset.
// 	*/
// 	raw: function () {
// 		// since we use our own _map_ method we are sure all records will be resolved
// 		return this.map(function (rec) { return rec.raw(); });
// 	},
// 	/**
// 		Returns the output of _raw()_ for this record as a JSON string.
// 	*/
// 	toJSON: function () {
// 		return enyo.json.stringify(this.raw());
// 	},
// 	/**
// 		This strategy accepts a single record (data-hash or _enyo.Model_ instance),
// 		or an array of records (data-hashes or _enyo.Model_ instances) to be merged
// 		with the current collection. This strategy may be executed directly (much
// 		like the _add()_ method) or specified as the strategy to employ with data
// 		retrieved via	the _fetch()_ method. The default behavior is to find and
// 		merge records by their _primaryKey_ value when present, but _merge_ will
// 		also rely on any _mergeKeys_ set on the model kind for this collection. If
// 		the record(s) passed into this method are object-literals, they will be
// 		passed through the _parse()_ method of the model kind before being merged
// 		with existing records or being instanced as new records. Any records passed
// 		to this method that cannot be merged with existing records will be added to
// 		the collection at the end. This method will work with instanced and
// 		non-instanced records in the collection and merges without forcing records
// 		to be instanced.
// 	*/
// 	merge: function (records) {
// 		if (records) {
// 			var proto  = this.model.prototype,
// 				pk     = proto.primaryKey,
// 				mk     = proto.mergeKeys,
// 				// the array (if any) of records to add that could not be merged
// 				add    = [],
// 				// the copy of our internal records so we can remove indices already
// 				// merged and not need to iterate over them again
// 				local  = this.models.slice(),
// 				// flag used during iterations to help break the loop for an incoming
// 				// record if it was successfully merged
// 				merged = false,
// 				// flag used when comparing merge keys
// 				match  = false;
// 			// ensure we're working with an array of something
// 			records = (enyo.isArray(records)? records: [records]);
// 			for (var i=0, r; (r=records[i]); ++i) {
// 				// reset our flag
// 				merged = false;
// 				// if there is a value for the primary key or any merge keys were
// 				// provided we can continue
// 				var v = (r.get? r.get(pk): r[pk]);
// 				if (mk || (v !== null && v !== undefined)) {
// 					for (var j=0, c; (!merged && (c=local[j])); ++j) {
// 						// compare the primary key value if it exists
// 						if ((v !== null && v !== undefined) && v === (c.get? c.get(pk): c[pk])) {
// 							// update the flag so that the inner loop won't continue
// 							merged = true;
// 							// remove the index from the array copy so we won't check
// 							// this index again
// 							local.splice(j, 1);
// 						// otherwise we check to see if there were merge keys to check against
// 						} else if (mk) {
// 							// reset our test flag
// 							match = false;
// 							// iterate over any merge keys and compare their values if even
// 							// one doesn't match then we know the whole thing won't match
// 							// so we break the loop
// 							for (var k=0, m; (m=mk[k]); ++k) {
// 								v = (r.get? r.get(m): r[m]);
// 								if (v === (c.get? c.get(m): c[m])) {
// 									match = true;
// 								} else {
// 									match = false;
// 									break;
// 								}
// 							}
// 							// if they matched
// 							if (match) {
// 								// update the flag so that the inner loop won't continue
// 								merged = true;
// 								// remove the index from the array copy so we won't check
// 								// this index again
// 								local.splice(j, 1);
// 							}
// 						}
// 					}
// 					if (merged) {
// 						// if the current record is instanced we use the _setObject()_ method otherwise
// 						// we simply mixin the properties so it will be up to date whenever it is
// 						// instanced
// 						if (c.setObject) {
// 							c.setObject(r.raw? r.raw(): c.parse(r));
// 						} else {
// 							enyo.mixin(c, r.raw? r.raw(): r);
// 						}
// 					} else {
// 						// if we checked the record data against all existing records and didn't merge it
// 						// we need to add it to the array that will be added at the end
// 						add.push(r);
// 					}
// 				} else { add.push(r); }
// 			}
// 			// if there were any records that needed to be added at the end of the collection
// 			// we do that now
// 			if (add.length) {
// 				this.add(add);
// 			}
// 		}
// 	},
// 	/**
// 		Adds a passed-in record, or array of records, to the collection. Optionally,
// 		you may provide the index at which to insert the record(s). Records are
// 		added at the end by default. If additions are made successfully, an _add_
// 		event is fired with the array of the indices of any records successfully
// 		added. The method also returns this array of indices.
// 
// 		Records can only be added to an unfiltered dataset. If this method is called
// 		while a filter is applied, the collection will be reset prior to adding the
// 		records.
// 	*/
// 	add: function (records, i) {
// 		// since we can't add records to a filtered collection we will reset it to
// 		// unfiltered if necessary
// 		if (this.filtered) { this.reset(); }
// 			// the actual records array for the collection
// 		var local = this.models,
// 			// the array of indices of any records added to the collection
// 			add   = [],
// 			// the existing length prior to adding any records
// 			len   = this.length;
// 		// normalize the requested index to the appropriate starting index for
// 		// our operation
// 		i = (i !== null && !isNaN(i))? Math.max(0, Math.min(len, i)) : len;
// 		// ensure we're working with an array of incoming records/data hashes
// 		records = (enyo.isArray(records)? records: [records]);
// 		// if there aren't really any records to add we just return an empty array
// 		if (!records.length) { return add; }
// 		// we want to lazily instantiate records (unless the instanceAllRecords flag is true)
// 		for (var j=0, r; (r=records[j]); ++j) {
// 			if (!(r instanceof enyo.Model)) {
// 				// if the instanceAllRecords flag is true we have to instance it now
// 				if (this.instanceAllRecords) {
// 					records[j] = this.createRecord(r, null, false);
// 				}
// 			} else if (r.destroyed) {
// 				throw "enyo.Collection.add: cannot add a record that has already been destroyed";
// 			} else {
// 				// adding an instantiated model so start listening for events
// 				r.addListener("change", this._recordChanged);
// 				r.addListener("destroy", this._recordDestroyed);
// 			}
// 			// add the current index + the index offset determined by the index
// 			// passed in to the method
// 			add.push(j+i);
// 		}
// 		// here we just simply use built-ins to shortcut otherwise taxing routines
// 		records.unshift.apply(records, [i, 0]);
// 		// we add these records to our own records array at the correct index
// 		local.splice.apply(local, records);
// 		// we have to return the passed-in array to its original state
// 		records.splice(0, 2);
// 		// update our new length property
// 		this.length = local.length;
// 		// if the current length is different than the original length we need to
// 		// notify any observers of this change
// 		if (len !== this.length) {
// 			this.notifyObservers("length", len, this.length);
// 		}
// 		// if necessary, trigger the `add` event for listeners
// 		if (add.length) {
// 			this.triggerEvent("add", {records: add});
// 		}
// 		// return the array of added indices
// 		return add;
// 	},
// 	/**
// 		Accepts a record, or an array of records, to be removed from the collection.
// 		Returns a hash of any records that were successfully removed (along with
// 		their former indices). Emits the _remove_ event, which specifies the records
// 		that were removed. Unlike the _add_ event, which contains only indices, the
// 		_remove_ event has references to the actual records.
// 
// 		Records can only be removed from the unfiltered dataset. If this method is
// 		called while a filter is applied, the collection will be reset prior to
// 		removing the records.
// 	*/
// 	remove: function (rec) {
// 		if (this.filtered) { this.reset(); }
// 		// in order to do this as efficiently as possible we have to find any
// 		// record(s) that exist that we actually can remove and ensure that they
// 		// are ordered so, in reverse order, we can remove them without the need
// 		// to lookup their indices more than once or make copies of any arrays beyond
// 		// the ordering array, unfortunately we have to make two passes against the
// 		// records being removed
// 		// TODO: there may be even faster ways...
// 		var rr = [],
// 			d  = {},
// 			l  = this.length, x, m;
// 		// if not an array, make it one
// 		rec = (enyo.isArray(rec) && rec) || [rec];
// 		for (var j=0, r, i, k; (r=rec[j]); ++j) {
// 			if ((i=this.indexOf(r)) > -1) {
// 				if (m === undefined || i <= m) {
// 					m=i;
// 					rr.unshift(i);
// 				}
// 				else if (x === undefined || i >= x) {
// 					x=i;
// 					rr.push(i);
// 				}
// 				else if (x !== i && m !== i) {
// 					k=0;
// 					while (rr[k] < i) { ++k; }
// 					rr.splice(k, 0, i);
// 				}
// 				d[i] = r;
// 			}
// 		}
// 		// now we iterate over any indices we know we'll remove in reverse
// 		// order safely being able to use the index we just found for both the
// 		// splice and the return index
// 		for (j=rr.length-1; !isNaN((i=rr[j])); --j) {
// 			this.models.splice(i, 1);
// 			if (d[i] instanceof this.model) {
// 				d[i].removeListener("change", this._recordChanged);
// 				d[i].removeListener("destroy", this._recordDestroyed);
// 			}
// 		}
// 		// fix up our new length
// 		this.length = this.models.length;
// 		// now alert any observers of the length change
// 		if (l != this.length) { this.notifyObservers("length", l, this.length); }
// 		// trigger the event with the instances
// 		if (rr.length) { this.triggerEvent("remove", {records: d}); }
// 		return d;
// 	},
// 	/**
// 		This method takes an array of records to replace its current records.
// 		Unlike the _add()_ method, this method emits a _reset_ event and does not
// 		emit _add_ or _remove_, even for new records. If a filter has been applied
// 		to the collection, and _reset()_ is called without a parameter, the
// 		unfiltered dataset will be restored with the exception of any removed
// 		records that existed in the filtered and original datasets; the _filtered_
// 		flag will be reset to false. Returns a reference to the collection for
// 		chaining.
// 	*/
// 	reset: function (records) {
// 		var ch = false,
// 			l;
// 		// if the collection is filtered and this was called with no parameters
// 		if (!records && this.filtered) {
// 			var rr = this._uRecords;
// 			l = this.models.length;
// 			this._uRecords = this.models;
// 			this._uRecords = null;
// 			this.models = rr;
// 			this.length = this.models.length;
// 			this.filtered = false;
// 			ch = true;
// 		} else if (records && enyo.isArray(records)) {
// 			// if we're resetting the dataset but we're also filtering we need to
// 			// ensure we preserve the original dataset
// 			if (this.filtering) {
// 				// of course if we have already been filtered we don't reset the
// 				// original
// 				if (!this.filtered) {
// 					this._uRecords = this.models.slice();
// 				}
// 			}
// 			l = this.models.length;
// 			this.models = records.slice();
// 			this.length = this.models.length;
// 			ch = true;
// 		}
// 		if (ch) {
// 			if (l !== this.length) { this.notifyObservers("length", l, this.length); }
// 			this.triggerEvent("reset", {records: this.models});
// 		}
// 		return this;
// 	},
// 	/**
// 		If there is an _activeFilter_, this removes it and calls _reset()_ to
// 		restore the collection to an unfiltered state. Returns a reference to the
// 		collection for chaining.
// 	*/
// 	clearFilter: function () {
// 		return (this.activeFilter? this.set("activeFilter", ""): this);
// 	},
// 	/**
// 		Removes all records from the collection. This action _does not_ destroy the
// 		records; they will simply no longer belong to this collection. If the
// 		desired action is to remove and destroy all records, use _destroyAll()_
// 		instead. This method returns an array of all of the removed records.
// 
// 		If _removeAll()_ is called while the collection is in a filtered state, it
// 		will reset the collection, clearing any filters, before removing all
// 		records.
// 	*/
// 	removeAll: function () {
// 		// no need to call reset prior to remove since it already checks
// 		// for the filtered state and calls reset
// 		return this.reset().remove(this.models);
// 	},
// 	/**
// 		Removes all records from the collection and destroys them. This will still
// 		emit the _remove_ event, and any records being destroyed will also emit
// 		their own _destroy_ events. If the _local_ parameter is `true` it will call
// 		the record's _destroyLocal()_ method instead of _destroy()_.
// 
// 		If _destroyAll()_ is called while the collection is in a filtered state, it
// 		will reset the collection, clearing any filters, before destroying all
// 		records.
// 	*/
// 	destroyAll: function (local) {
// 		// all of the removed records that we know need to be destroyed
// 		var records = this.removeAll(),
// 			fn = local === true? "destroyLocal": "destroy",
// 			rec;
// 		this._destroyAll = true;
// 		for (var k in records) {
// 			rec = records[k];
// 			if (rec && rec instanceof enyo.Model) {
// 				rec[fn]();
// 			}
// 		}
// 		this._destroyAll = false;
// 	},
// 	/**
// 		Same as _destroyAll()_ except that it will call the model's _destroyLocal()_
// 		method.
// 	*/
// 	destroyAllLocal: function () {
// 		this.destroyAll(true);
// 	},
// 	/**
// 		Returns the index of the given record if it exists in this collection;
// 		otherwise, returns _-1_. Supply an optional offset to begin searching at a
// 		non-zero index.
// 
// 		Note that when _indexOf()_ is used within an active filter,	each subsequent
// 		call to _indexOf()_ will only iterate over the current filtered data unless
// 		a _reset()_ call is made to restore the entire dataset.
// 	*/
// 	indexOf: function (rec, offset) {
// 		return enyo.indexOf(rec, this.models, offset);
// 	},
// 	/**
// 		Iterates over all the records in this collection, accepting the
// 		return value of _fn_ (under optional context _ctx_), and returning the
// 		immutable array of that result. If no context is provided, the function is
// 		executed in the context of the collection.
// 
// 		Note that when _map()_ is used within an active filter, each subsequent call
// 		to _map()_ will only iterate over the current filtered data unless a
// 		_reset()_ call is made to restore the entire dataset.
// 	*/
// 	map: function (fn, ctx) {
// 		ctx = ctx || this;
// 		var fs = [];
// 		for (var i=0, l=this.length, r; i<l && (r=this.at(i)); ++i) {
// 			fs.push(fn.call(ctx, r, i));
// 		}
// 		return fs;
// 	},
// 	/**
// 		Iterates over all the records in this collection, filtering them out of the
// 		result set if _fn_ returns false. You may pass in an optional context	_ctx_;
// 		otherwise, the function will be executed in the context of this collection.
// 		Returns an array of all the records that caused _fn_ to return true.
// 
// 		Note that when _filter()_ is used within an active filter, each subsequent
// 		call to _filter()_ will only iterate over the current filtered data unless a
// 		_reset()_ call is made to restore the entire dataset.
// 	
// 		If _filter()_ is called without any parameters it will apply the _activeFilter_
// 		to the dataset if it exists and is not already applied. It will return an immutable
// 		array of the filtered records if there was an _activeFilter_ or a copy of the
// 		entire unfiltered dataset.
// 	*/
// 	filter: function (fn, ctx) {
// 		var fs = [];
// 		if (fn) {
// 			ctx = ctx || this;
// 			for (var i=0, l=this.length, r; i<l && (r=this.at(i)); ++i) {
// 				if (fn.call(ctx, r, i)) { fs.push(r); }
// 			}
// 		} else {
// 			this._activeFilterChanged();
// 			fs = this.models.slice();
// 		}
// 		return fs;
// 	},
// 	/**
// 		Returns the record at the requested index, or _undefined_ if there is none.
// 		Since records may be stored or malformed, this method resolves them as they
// 		are requested (lazily).
// 	*/
// 	at: function (i) {
// 		var r = this.models[i];
// 		if (r && !(r instanceof this.model)) {
// 			r = this.models[i] = this.createRecord(r, null, false);
// 		}
// 		return r;
// 	},
// 	/**
// 		Creates an instance of a record immediately in this collection. This method
// 		is used internally when instantiating records according to the _model_
// 		property. Accepts the attributes (_attrs_) to be used, the properties
// 		(_props_) to apply, and an optional index at which to insert the record into
// 		the _collection_. If the index is false, the record will not be added to the
// 		collection at all. Returns the newly created record instance. Note that
// 		records created by a collection have their _owner_ property set to the
// 		collection and will be added to the _store_ set on the collection. If a
// 		collection is destroyed, any records it owns will also be destroyed unless
// 		the _preserveRecords_ flag is true.
// 	*/
// 	createRecord: function (attrs, props, i) {
// 		var defaults = {owner: this},
// 			rec;
// 		// we have to check to see if we marked these attributes as being fetched
// 		// by their isNew flag and propagate that properly if so
// 		if (attrs && attrs.isNew === false) {
// 			(props || defaults).isNew = false;
// 			// remove the flag so that it doesn't show up as an attribute of the
// 			// the record
// 			delete attrs.isNew;
// 		}
// 		rec = this.store.createRecord(this.model, attrs, (props? enyo.mixin(defaults, props): defaults));
// 		// normalize the index we're adding this record at knowing that a false
// 		// indicates we don't insert the record (because it probably already is) and
// 		// we don't update the entry here because it will be handled in the caller
// 		// if that is the case
// 		i = (false === i? -1: (i !== null && i >= 0? i: this.length));
// 		rec.addListener("change",  this._recordChanged);
// 		rec.addListener("destroy", this._recordDestroyed);
// 		if (i >= 0) { this.add(rec, i); }
// 		return rec;
// 	},
// 	/**
// 		Implement a method called _recordChanged()_ that receives the record, the
// 		event, and any additional properties passed along when any record in the
// 		collection emits its _change_ event.
// 	*/
// 	recordChanged: null,
// 	/**
// 		When creating a new collection, you may pass it an array of records	(either
// 		instances or hashes to be converted) and an optional hash of properties to
// 		be applied to the collection. Both are optional, meaning that you can supply
// 		neither, either one, or both. If both options and data are present, options
// 		will be applied first. If the _data_ array is present, it will be passed
// 		through the _parse_ method of the collection.
// 	*/
// 	constructor: enyo.inherit(function (sup) {
// 		return function (data, opts) {
// 			var d  = enyo.isArray(data)? data.slice(): null,
// 				o  = opts || (data && !d? data: null);
// 			if (o) { this.importProps(o); }
// 			this.models = (this.models || []).concat(d? this.parse(d): []);
// 			// initialized our length property
// 			this.length = this.models.length;
// 			// we bind this method to our collection so it can be reused as an event listener
// 			// for many records
// 			this._recordChanged   = enyo.bindSafely(this, this._recordChanged);
// 			this._recordDestroyed = enyo.bindSafely(this, this._recordDestroyed);
// 			this.euid = enyo.uuid();
// 			// attempt to resolve the kind of model if it is a string and not a constructor
// 			// for the kind
// 			var m = this.model;
// 			if (m && enyo.isString(m)) {
// 				this.model = enyo.getPath(m);
// 			} else {
// 				this.model = enyo.checkConstructor(m);
// 			}
// 			// initialize the store
// 			this.storeChanged();
// 			this.filters = this.filters || {};
// 			// if there are any properties designated for filtering we set those observers
// 			if (this.filterProps.length) {
// 				var fn = enyo.bindSafely(this, function () { this.triggerEvent("filter"); });
// 				for (var j=0, ps=this.filterProps.split(" "), fp; (fp=ps[j]); ++j) {
// 					this.addObserver(fp, fn);
// 				}
// 			}
// 			this.addListener("filter", this._filterContent, this);
// 			this.addObserver("activeFilter", this._activeFilterChanged, this);
// 			data = opts = undefined;
// 			sup.apply(this, arguments);
// 		};
// 	}),
// 	/**
// 		Destroys the collection and removes all records. This does not destroy the
// 		records unless they were created by this collection's _createRecord()_
// 		method.	To avoid destroying records that are owned by this collection, set
// 		the _preserveRecords_ flag to true.
// 	*/
// 	destroy: enyo.inherit(function (sup) {
// 		return function () {
// 			var rr = this.removeAll(), r;
// 			for (var k in rr) {
// 				r = rr[k];
// 				if (r.owner === this) {
// 					if (this.preserveRecords) { r.owner = null; }
// 					else { r.destroy(); }
// 				}
// 			}
// 			this.triggerEvent("destroy");
// 			this.store = null;
// 			this.removeAllListeners();
// 			sup.apply(this, arguments);
// 		};
// 	}),
// 	//*@protected
// 	importProps: function (p) {
// 		if (p) {
// 			if (p.records) {
// 				this.models = this.models? this.models.concat(p.records): p.records;
// 				delete p.records;
// 			}
// 			enyo.kind.statics.extend(p, this);
// 		}
// 	},
// 	storeChanged: function () {
// 		var s = this.store || enyo.store;
// 		if (s) {
// 			if (enyo.isString(s)) {
// 				s = enyo.getPath(s);
// 				if (!s) {
// 					enyo.warn("enyo.Collection: could not find the requested store -> ", this.store, ", using" +
// 						"the default store");
// 				}
// 			}
// 		}
// 		s = this.store = s || enyo.store;
// 		s.addCollection(this);
// 	},
// 	observers: {
// 		_relationChanged: ["relation"]	
// 	},
// 	_relationChanged: function () {
// 		var relation = this.relation;
// 		
// 		if (relation && this.length && (!relation.isOwner || relation.inverseKey)) {
// 			enyo.forEach(this.models, function (rec) {
// 				// @TODO!
// 			}, this);
// 		}
// 	},
// 	_activeFilterChanged: function () {
// 		var fn = this.activeFilter,
// 			m  = this.filters;
// 		// we do this so any other registered listeners will know this event
// 		// was fired instead of calling it directly
// 		if (fn && m && m[fn]) {
// 			this.triggerEvent("filter");
// 		} else { this.reset(); }
// 	},
// 	_filterContent: function () {
// 		if (!this.filtering && (this.length || (this._uRecords && this._uRecords.length))) {
// 			var fn = this.filters[this.activeFilter];
// 			if (fn && this[fn]) {
// 				this.filtering = true;
// 				this.silence();
// 				var r = this[fn]();
// 				this.unsilence();
// 				if (r) {
// 					this.reset(true === r? undefined: r);
// 				}
// 				this.filtering = false;
// 				if (this._uRecords && this._uRecords.length) { this.filtered = true; }
// 			}
// 		}
// 	},
// 	_recordChanged: function (rec, e, changed) {
// 		var relation = this.relation;
// 
// 		if (relation) {
// 			changed = changed || {};
// 			changed.record = rec;
// 			changed.event = e;
// 			relation.recordChanged(this, e, changed);
// 		}
// 
// 		if (this.recordChanged) {
// 			this.recordChanged(rec, e, changed);
// 		}
// 	},
// 	_recordDestroyed: function (rec, e, changed) {
// 		var relation = this.relation
// 			, destroyAll = this._destroyAll;
// 		
// 		if (relation) {
// 			changed = changed || {};
// 			changed.record = rec;
// 			changed.event = e;
// 			relation.recordDestroyed(this, e, changed);
// 		}
// 		
// 		// if we're destroying all records we ignore this as the record
// 		// will have already been removed, otherwise we remove the record
// 		// from the collection
// 		if (!destroyAll) {
// 			this.remove(rec);
// 		}
// 	}
// });
// 
// enyo.Collection.concat = function (ctor, props) {
// 	var p = ctor.prototype || ctor;
// 	if (props.filters) {
// 		if (p.filters) {
// 			p.filters = enyo.mixin(enyo.clone(p.filters), props.filters);
// 			delete props.filters;
// 		}
// 	}
// 	if (props.filterProps) {
// 		// for the incoming props to a string
// 		if (enyo.isArray(props.filterProps)) {
// 			props.filterProps = props.filterProps.join(" ");
// 		}
// 		// if there isn't already one it will be assigned from the string
// 		// in the normal import props otherwise we concatenate the strings...
// 		if (p.filterProps) {
// 			p.filterProps += (" " + props.filterProps);
// 			delete props.filterProps;
// 		}
// 	}
// };
>>>>>>> interim commit
