describe ("Relational Models", function () {
	
	describe ("Kind", function () {
		
		describe ("Properties", function () {
			
		});
		
		describe ("Methods", function () {
			var ctor = enyo.RelationalModel
				, proto = ctor.prototype;
		
			describe ("#getRelation", function () {
				
				it ("should respond to the method getRelation", function () {
					expect(proto).to.itself.respondTo("getRelation");
				});
				
				it ("should return a relation instance if a relation exists for the requested key or falsy", function () {
					var ctor, model;
					
					ctor = enyo.kind({
						kind: "enyo.RelationalModel",
						relations: [{
							key: "testprop"
						}]
					});
					
					model = new ctor();
					expect(model.getRelation("testprop")).to.exist.and.to.be.an.instanceof(enyo.toOne);
					expect(model.getRelation("someotherprop")).to.not.be.ok;
					model.destroy();
				});
				
			});
			
			describe ("#isRelation", function () {
				
				it ("should respond to the method isRelation", function () {
					expect(proto).to.itself.respondTo("isRelation");
				});
				
				it ("should should return a relation instance if a relation exists for the requested key or falsy", function () {
					var ctor, model;
					
					ctor = enyo.kind({
						kind: "enyo.RelationalModel",
						relations: [{
							key: "testprop"
						}]
					});
					
					model = new ctor();
					expect(model.isRelation("testprop")).to.exist.and.to.be.an.instanceof(enyo.toOne);
					expect(model.isRelation("someotherprop")).to.not.be.ok;
					model.destroy();
				})
				
			});
			
			describe ("#get", function () {
				
				it ("should return an attribute value as expected", function () {
					var model = new enyo.RelationalModel({testprop: true});
					expect(model.get("testprop")).to.be.true;
					model.destroy();
				});
				
				it ("should return an instance of a model or collection when requesting a relation", function () {
					var ctor, model;
					
					ctor = enyo.kind({
						kind: "enyo.RelationalModel",
						relations: [{
							key: "testprop"
						}]
					});
					
					model = new ctor({testprop: {id: 0}});
					expect(model.get("testprop")).to.exist.and.to.be.an.instanceof(enyo.RelationalModel);
					model.destroy();
				});
				
			});
			
			describe ("#set", function () {
				
			});
			
			describe ("#raw", function () {
				
			});
			
			describe ("#fetchRelated", function () {
				
			});
			
			describe ("#constructor", function () {
				
			});
			
			describe ("#destroy", function () {
				
			});
		
		});
		
	});
	
	describe ("Behavior", function () {
		
		describe ("Relation properties", function () {
		
			describe ("#type", function () {
				
				it ("should accept the strings 'toOne', 'toMany', 'enyo.toOne', 'enyo.toMany'");
				it ("should accept the constructor for enyo.toOne and enyo.toMany");
				it ("should default to enyo.toOne");
				
			});
			
			describe ("#key", function () {
				
				it ("should add the key to the attributes of the model pointing to the relation instance");
				it ("should be used as the implicit inverseKey in automatic reverse relations");
				
			});
			
			describe ("#inverseKey", function () {
				
				it ("should use the key, when available, to find existing models");
				it ("should use the inverseKey as the implicit key in automatic reverse relations");
				
			});
		
			describe ("#isOwner", function () {
				
				it ("should only allow one end of a relationship to have isOwner true");
				it ("should respond to changes in child-relations as if it also changed");
				it ("should ignore events and notifications when neither relation has isOwner true");
				it ("should listen for events in child-relations when isOwner is true");
				
			});
		
			describe ("#includeInJSON", function () {
				
				it ("should not include a relation in raw output when includeInJSON is false");
				it ("should include the entire relation raw output when includeInJSON is true and isOwner is true");
				it ("should include the id of the relation by default when isOwner is false");
				it ("should include a single key when includeInJSON is a string");
				it ("should include all keys requested when includeInJSON is an array");
				it ("should include any return value when includeInJSON is a function");
				
			});
			
			describe ("#create", function () {
				
				it ("should create an instance from existing data when isOwner is true", function () {
					var ctor, model;
					
					ctor = enyo.kind({
						kind: "enyo.RelationalModel",
						relations: [{
							key: "testprop"
						}]
					});
					model = new ctor({testprop: {id: 0}});
					expect(model.attributes.testprop).to.exist.and.to.be.an.instanceof(enyo.toOne);
					expect(model.getRelation("testprop").related).to.exist.and.to.be.an.instanceof(enyo.RelationalModel);
					model.destroy();
				});
				
			});
			
			describe ("#parse", function () {
				
				it ("should parse incoming data for a relation when it exists and create is true");
				
			});
			
			describe ("#model", function () {
				
				it ("should be a string or constructor for the expected model or collection kind");
				
			});
			
			describe ("#autoFetch", function () {
				
				it ("should not be true by default");
				it ("should automatically attempt to fetch remote data when autoFetch is true");
				
			});
			
			describe ("#inverseType", function () {
				
				it ("should be ignored in explicit relations");
				it ("should be used to instance automatic reverse relations");
				
			});
			
		});
		
		describe ("toOne Relations", function () {
			
			it ("should be able to declare an explicit toOne relation");
			it ("should be able to declare an implicit toOne relation");
			it ("should find the related model when it is created later");
			it ("should find the related model when it is created before");
			it ("should create the related model when it is passed in as data");
			it ("should fetch the related model when autoFetch is true");
			it ("should be able to fetch the related model later when autoFetch is false");
			it ("should should not respond to events/notifications for related model(s) if isOwner is false");
			it ("should destroy all relations where isOwner is true and destroyed by default");
			it ("should not destroy a relation where isOwner is true and the destroy flag is false");
			
		});
		
		describe ("toMany Relations", function () {
			
			it ("should be able to declare an explicit toMany relation");
			it ("should be able to declare an implicit toMany relation");
			it ("should find related models when they are created later");
			it ("should find related models when they are created before");
			it ("should create the related models when they are passed in as data");
			it ("should fetch the related models when autoFetch is true");
			it ("should be able to fetch the related models later when autoFetch is false");
			it ("should force the reverse relation (if any) to be toOne even when set as toMany");
			it ("should force all toMany relations to isOwner false");
			
		});
		
		describe ("Events", function () {
			
			it ("should propagate change events when isOwner is true and a child-relation changes");
			
		});
		
		describe ("Bindings", function () {
			
			it ("should be able to bind to local properties of the model with local true");
			it ("should be able to bind to attributes");
			it ("should be able to bind through a toOne relation chain");
			it ("should be able to bind to a local property of the collection of a toMany relation");
			
		});
		
	});
});