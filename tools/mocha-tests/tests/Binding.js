describe ("Bindings", function () {
	describe("Kind", function () {
		describe("Constructor", function () {
			it ("should be a valid constructor", function () {
				expect(enyo.Binding).to.exist.and.to.be.a("function");
				expect(enyo.Binding.prototype).itself.to.have.property("kindName", "enyo.Binding");
			});
			it ("should be the enyo.defaultBindingKind static property", function () {
				expect(enyo.defaultBindingKind).to.exist.and.to.equal(enyo.Binding);
			});
			it ("should return an instance of enyo.Binding", function () {
				var bnd = new enyo.Binding();
				expect(bnd).to.be.an.instanceof(enyo.Binding);
			});
		});
		describe ("Static Methods", function () {
			describe ("~find", function () {
				var bnd = new enyo.Binding();
			
				after (function () {
					bnd.destroy();
				});
			
				it ("should respond to find", function () {
					expect(enyo.Binding).itself.to.respondTo("find");
				});
				it ("should return an instance of a binding if found by its euid", function () {
					expect(enyo.Binding.find(bnd.euid)).to.deep.equal(bnd);
				});
				it ("should return undefined when not found", function () {
					expect(enyo.Binding.find(enyo.uuid())).to.be.undefined;
				});
			});
		});
		describe ("Methods", function () {
			describe.skip("#isConnected", function () {
			});
			describe.skip("#isReady", function () {
			});
			describe.skip("#connect", function () {
			});
			describe.skip("#disconnect", function () {
			});
			describe.skip("#sync", function () {
			});
			describe.skip("#destroy", function () {
			});
		});
		describe ("Properties", function () {
			describe.skip("#oneWay", function () {
			});
			describe.skip("#connected", function () {
			});
			describe.skip("#owner", function () {
			});
			describe.skip("#autoConnect", function () {
			});
			describe.skip("#autoSync", function () {
			});
			describe.skip("#source", function () {
			});
			describe.skip("#target", function () {
			});
			describe("#from", function () {
				var bnd;
			
				beforeEach (function () {
					bnd = new enyo.Binding();
				});
			
				afterEach (function () {
					bnd.destroy();
				});
			
				it ("should always be a string", function () {
					expect(bnd.from).to.be.a("string");
					bnd.from = {};
					bnd.isReady();
					expect(bnd.from).to.be.a("string");
				});
			});
			describe("#to", function () {
				var bnd;
			
				beforeEach (function () {
					bnd = new enyo.Binding();
				});
			
				afterEach (function () {
					bnd.destroy();
				});
			
				it ("should always be a string", function () {
					expect(bnd.to).to.be.a("string");
					bnd.to = {};
					bnd.isReady();
					expect(bnd.to).to.be.a("string");
				});
			});
			describe.skip("#dirty", function () {
			});
			describe("#transform", function () {
				var bnd;
			
				afterEach (function () {
					bnd && bnd.destroy();
				});
			
				it ("should not find a transform if there isn't one provided", function () {
					bnd = new enyo.Binding();
					expect(bnd.transform).to.not.exist;
				});
				it ("should find a transform if it is a function", function () {
					bnd = new enyo.Binding({
						transform: function () {}
					});
					expect(bnd.transform).to.exist.and.to.be.a("function");
					expect(bnd.getTransform()).to.exist.and.to.be.a("function");
				});
				it ("should find a transform if it is a string-global", function () {
					window.xform = function () {};
				
					bnd = new enyo.Binding({
						transform: "xform"
					});
				
					expect(bnd.getTransform()).to.exist.and.to.be.a("function");
					expect(bnd.getTransform()).to.deep.equal(window.xform);
				
					delete window.xform;
				});
				it ("should find a transform if it is a string-owner", function () {
					var obj = new enyo.Object({
						xform: function () {}
					});
				
					bnd = new enyo.Binding({
						owner: obj,
						transform: "xform"
					});
				
					expect(bnd.getTransform()).to.exist.and.to.be.a("function");
					expect(bnd.getTransform()).to.deep.equal(obj.xform);
				
					obj.destroy();
				});
				it ("should find a transform if it is a string-bindingTransformOwner", function () {
					var obj = new enyo.Component({
						components: [
							{name: "child"}
						],
						xform: function () {}
					});
				
					bnd = new enyo.Binding({
						owner: obj.$.child,
						transform: "xform"
					});
				
					expect(bnd.getTransform()).to.exist.and.to.be.a("function");
					expect(bnd.getTransform()).to.deep.equal(obj.xform);
				
					obj.destroy();
				});
				it ("should use a transform when it exists", function () {
					var obj1, obj2;
				
					obj1 = new enyo.Object();
					obj2 = new enyo.Object();
				
					bnd = new enyo.Binding({
						source: obj1,
						target: obj2,
						from: ".testprop",
						to: ".testprop",
						transform: function (val) {
							return val? val + 1: val;
						}
					});
				
					obj1.set("testprop", 1);
				
					expect(obj1.testprop).to.equal(1);
					expect(obj2.testprop).to.equal(2);
				
					obj1.destroy();
					obj2.destroy();
				});
				it ("should supply the correct direction to the transform", function () {
					var obj1, obj2;
				
					obj1 = new enyo.Object();
					obj2 = new enyo.Object();
				
					bnd = new enyo.Binding({
						oneWay: false,
						source: obj1,
						target: obj2,
						from: ".testprop",
						to: ".testprop",
						transform: function (val, dir) {
							return dir == enyo.Binding.DIRTY.FROM
								? val? val + 1: val
								: val? val - 1: val
								;
						}
					});
				
					obj1.set("testprop", 1);
				
					expect(obj1.testprop).to.equal(1);
					expect(obj2.testprop).to.equal(2);
				
					obj2.set("testprop", 3);
				
					expect(obj2.testprop).to.equal(3);
					expect(obj1.testprop).to.equal(2);
				
					obj1.destroy();
					obj2.destroy();
				});
				it ("should stop propagation of the binding change when stop() is called", function () {
					var obj1, obj2;
				
					obj1 = new enyo.Object();
					obj2 = new enyo.Object();
				
					bnd = new enyo.Binding({
						source: obj1,
						target: obj2,
						from: ".testprop",
						to: ".testprop",
						transform: function (val, dir, binding) {
							return !val || val == 1? binding.stop(): val + 1;
						}
					});
				
					obj1.set("testprop", 1);
				
					expect(obj1.testprop).to.equal(1);
					expect(obj2.testprop).to.not.exist;
				
					obj1.set("testprop", 2);
				
					expect(obj1.testprop).to.equal(2);
					expect(obj2.testprop).to.equal(3);
				
					obj1.destroy();
					obj2.destroy();	
				});
			});
		});
		describe ("Implementation", function () {
			describe ("one-way", function () {
				it ("should always default to one-way", function () {
					var bnd = new enyo.Binding();
					expect(bnd.oneWay).to.be.true;
					bnd.destroy();
				});
				it ("should keep one way synchronization between two bindable objects", function () {
					var obj1, obj2, bnd;
				
					obj1 = new enyo.Object({
						testprop: true
					});
				
					obj2 = new enyo.Object({
						testprop: null
					});
				
					bnd = new enyo.Binding({
						source: obj1,
						target: obj2,
						from: ".testprop",
						to: ".testprop"
					});
				
					expect(obj1.testprop).to.be.true;
					expect(obj2.testprop).to.be.true;
				
					obj1.set("testprop", false);
				
					expect(obj1.testprop).to.be.false;
					expect(obj2.testprop).to.be.false;
				
					obj1.destroy();
					obj2.destroy();
					bnd.destroy();
				});
			});
			describe ("two-way", function () {
				it ("should not default to two-way", function () {
					var bnd = new enyo.Binding();
					expect(bnd.oneWay).to.be.true;
					bnd.destroy();
				});
				it ("should keep two way synchronization between two bindable objects", function () {
					var obj1, obj2, bnd;
				
					obj1 = new enyo.Object({
						testprop: true
					});
				
					obj2 = new enyo.Object({
						testprop: false
					});
				
					bnd = new enyo.Binding({
						source: obj1,
						target: obj2,
						from: ".testprop",
						to: ".testprop",
						oneWay: false
					});
				
					expect(obj1.testprop).to.be.true;
					expect(obj2.testprop).to.be.true;
				
					obj1.set("testprop", false);
				
					expect(obj1.testprop).to.be.false;
					expect(obj2.testprop).to.be.false;
				
					obj2.set("testprop", true);
				
					expect(obj1.testprop).to.be.true;
					expect(obj2.testprop).to.be.true;
				
					obj1.destroy();
					obj2.destroy();
					bnd.destroy();
				});
			});
		});
	});
	describe ("BindingSupport Mixin", function () {
		describe ("Methods", function () {
			var ctor, obj;
			
			ctor = enyo.kind({
				kind: null,
				mixins: [enyo.BindingSupport]
			});
			
			describe("#binding", function () {
				it ("should respond to binding", function () {
					expect(ctor.prototype).itself.to.respondTo("binding");
				});
				it ("should accept one or more parameters", function () {
					var loc;
					
					loc = new ctor();
					loc.binding({testprop1: true});
					loc.binding({testprop1: true}, {testprop2: false});
					
					expect(loc.bindings).to.have.length(2);
					expect(loc.bindings[0]).to.have.property("testprop1", true);
					expect(loc.bindings[1]).to.have.property("testprop2", false);
					
					loc.destroy();
				});
				it ("should append properties to bindings array if object uninitialized", function () {
					var loc;
					
					loc = enyo.singleton({
						kind: ctor,
						constructed: function () {
							this.binding({testentry: true});
							expect(this.bindings).to.have.length(1);
							expect(this.bindings[0]).to.not.be.an.instanceof(enyo.Binding);
							this.inherited(arguments);
						}
					});
					
					expect(loc.bindings).to.have.length(1);
					expect(loc.bindings[0]).to.be.instanceof(enyo.Binding);
					
					loc.destroy();
				});
			});
			describe("#clearBindings", function () {
				it ("should respond to clearBindings", function () {
					expect(ctor.prototype).itself.to.respondTo("clearBindings");
				});
				it ("should destroy and remove all bindings without a parameter", function () {
					var loc, bindings;
					
					loc = enyo.singleton({
						kind: ctor,
						bindings: [
							{name: "binding1"},
							{name: "binding2"},
							{name: "binding3"}
						]
					});
					bindings = loc.bindings.slice();
					expect(loc.bindings).to.have.length(3);
					expect(bindings).to.have.length(3);
					expect(loc.bindings[0]).to.be.instanceof(enyo.Binding);
					expect(loc.bindings[1]).to.be.instanceof(enyo.Binding);
					expect(loc.bindings[2]).to.be.instanceof(enyo.Binding);
					loc.clearBindings();
					expect(loc.bindings).to.be.empty;
					expect(bindings[0].destroyed).to.be.true;
					expect(bindings[1].destroyed).to.be.true;
					expect(bindings[2].destroyed).to.be.true;
					loc.destroy();
				});
				it ("should destroy and remove only bindings from the subset provided", function () {
					var loc, bindings;
					
					loc = enyo.singleton({
						kind: ctor,
						bindings: [
							{name: "binding1"},
							{name: "binding2"},
							{name: "binding3"}
						]
					});
					
					bindings = loc.bindings.slice(1);
					expect(loc.bindings).to.have.length(3);
					expect(bindings).to.have.length(2);
					expect(loc.bindings[0]).to.be.instanceof(enyo.Binding);
					expect(loc.bindings[1]).to.be.instanceof(enyo.Binding);
					expect(loc.bindings[2]).to.be.instanceof(enyo.Binding);
					loc.clearBindings(bindings);
					expect(loc.bindings).to.have.length(1);
					expect(loc.bindings[0]).to.have.property("name", "binding1");
					expect(bindings[0].destroyed).to.be.true;
					expect(bindings[1].destroyed).to.be.true;
					loc.destroy();
				});
			});
			describe("#removeBinding", function () {
				it ("should respond to removeBinding", function () {
					expect(ctor.prototype).itself.to.respondTo("removeBinding");
				});
				it ("should remove a binding from the bindings array", function () {
					var loc, bnd;
					
					loc = enyo.singleton({
						kind: ctor,
						bindings: [
							{name: "binding1"}
						]
					});
					
					expect(loc.bindings).to.have.length(1);
					expect(loc.bindings[0]).to.be.instanceof(enyo.Binding);
					bnd = loc.bindings[0];
					loc.removeBinding(bnd);
					expect(loc.bindings).to.be.empty;
					expect(bnd).to.exist.and.to.have.not.have.property("destroyed");
					
					loc.destroy();
				});
			});
			describe("#constructed", function () {
				it ("should properly initialize binding definitions in the bindings array", function () {
					var loc;
					
					loc = enyo.singleton({
						kind: ctor,
						bindings: [
							{name: "binding1"},
							{name: "binding2"}
						]
					});
					
					expect(loc.bindings).to.have.length(2);
					expect(loc.bindings[0]).to.be.an.instanceof(enyo.Binding);
					expect(loc.bindings[1]).to.be.an.instanceof(enyo.Binding);
					
					loc.destroy();
				})
			});
			describe("#destroy", function () {
				it ("should properly destroy and remove all bindings from an instance", function () {
					var loc, bindings;
					
					loc = enyo.singleton({
						kind: ctor,
						bindings: [
							{name: "binding1"},
							{name: "binding2"},
							{name: "binding3"}
						]
					});
					bindings = loc.bindings.slice();
					expect(loc.bindings).to.have.length(3);
					expect(bindings).to.have.length(3);
					expect(loc.bindings[0]).to.be.instanceof(enyo.Binding);
					expect(loc.bindings[1]).to.be.instanceof(enyo.Binding);
					expect(loc.bindings[2]).to.be.instanceof(enyo.Binding);
					loc.destroy();
					expect(loc.bindings).to.be.null;
					expect(bindings[0].destroyed).to.be.true;
					expect(bindings[1].destroyed).to.be.true;
					expect(bindings[2].destroyed).to.be.true;
				});
			});
		});
		describe ("Implementation", function () {
			describe ("bindings array", function () {
				it ("should be able to correctly find components when they are created", function () {
					var childCtor, loc;
					
					childCtor = enyo.kind({
						components: [
							{name: "two", testprop: "two-testprop"}
						], 
						deep1: {
							deep2: new enyo.Object({
								deep3: new enyo.Object({
									testprop: "deep3-testprop"
								})
							})
						}
					});
					
					loc = enyo.singleton({
						kind: enyo.Component,
						components: [
							{name: "one", kind: childCtor, testprop: "one-testprop"}
						],
						bindings: [
							{from: ".$.one.testprop", to: ".testprop1"},
							{from: ".$.one.$.two.testprop", to: ".testprop2"},
							{from: ".$.one.deep1.deep2.deep3.testprop", to: ".testprop3"},
							{from: ".$.late.testprop", to: ".testprop4"}
						]
					});
					
					expect(loc).to.have.property("testprop1", "one-testprop");
					expect(loc).to.have.property("testprop2", "two-testprop");
					expect(loc).to.have.property("testprop3", "deep3-testprop");
					
					loc.set("$.one.testprop", "one-testprop-two");
					loc.set("$.one.$.two.testprop", "two-testprop-three");
					loc.set("$.one.deep1.deep2.deep3.testprop", "deep3-testprop-four");
					
					expect(loc).to.have.property("testprop1", "one-testprop-two");
					expect(loc).to.have.property("testprop2", "two-testprop-three");
					expect(loc).to.have.property("testprop3", "deep3-testprop-four");
					
					loc.set("$.one.deep1.deep2.deep3", new enyo.Object({
						testprop: "new-deep3-testprop"
					}));
					
					expect(loc).to.have.property("testprop3", "new-deep3-testprop");
					loc.createComponent({name: "late", testprop: "late-testprop"});
					expect(loc).to.have.property("testprop4", "late-testprop");
					loc.destroy();
				});
			});
			describe ("nested bindings arrays", function () {
				it ("should have correct ownership when a bindings array block is in a nested component", function () {
					var loc;
					
					loc = enyo.singleton({
						kind: enyo.Component,
						components: [
							{name: "one", components: [
								{name: "two", components: [
									{name: "three", value: "three"}
								], bindings: [
									{from: ".owner.$.three.value", to: ".value"}
								]}
							], bindings: [
								{from: ".owner.$.two.value", to: ".value"}
							]}
						],
						bindings: [
							{from: ".$.one.value", to: ".linkedValue"},
							{from: ".$.three.value", to: ".value"}
						]
					});
					
					expect(loc).to.have.property("linkedValue", "three");
					expect(loc).to.have.property("value", "three");
					
					loc.destroy();
				});
			});
		});
	});
});