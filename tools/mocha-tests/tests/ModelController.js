describe ("ModelController", function () {
	var ModelController = enyo.ModelController;
	
	
	describe ("Methods", function () {
		
		describe ("#set", function () {
			var model, controller;
			
			afterEach (function () {
				model && model.destroy();
				controller && controller.destroy();
			});
			
			it ("should properly detect properties that are hasOwnProperty true and use setLocal instead", function () {
				controller = new ModelController({someProp: "incorrect"});
				model = new enyo.Model({someProp: "incorrect"});
				controller.set("model", model);
				controller.set("someProp", "correct");
				var spy = sinon.spy(controller, "get");
				controller.get("someProp");
				expect(spy).to.have.returned("correct");
			});
			
			it ("should properly call set on the model when it exists", function () {
				controller = new ModelController();
				model = new enyo.Model({someProp: "incorrect"});
				controller.set("model", model);
				controller.set("someProp", "correct");
				var spy = sinon.spy(controller, "get");
				controller.get("someProp");
				expect(spy).to.have.returned("correct");
				spy = sinon.spy(model, "get");
				model.get("someProp");
				expect(spy).to.have.returned("correct");
			});
			
			it ("should gracefully fail when no model exists and it was not an own property", function () {
				controller = new ModelController();
				var spy = sinon.spy(controller, "set");
				controller.set("someProp", "someValue");
				expect(spy).to.have.returned(controller);
			});
			
		});
		
		describe ("#setLocal", function () {
			var model, controller;
			
			afterEach (function () {
				model && model.destroy();
				controller && controller.destroy();
			});
			
			it ("should properly adhere to the ComputedSupport setter for computed properties", function () {
				var spy = sinon.spy(), ctor;
				ctor = enyo.kind({
					kind: ModelController,
					computed: [
						{method: "someProp"}
					],
					someProp: spy
				});
				controller = new ctor();
				controller.setLocal("someProp", "someValue");
				expect(spy).to.not.have.been.called;
			});
			
			it ("should properly signal updates to own property changes", function () {
				var spy = sinon.spy();
				controller = new ModelController({someProp: null});
				controller.observe("someProp", spy);
				controller.set("someProp", "someValue1");
				controller.setLocal("someProp", "someValue2");
				expect(spy).to.have.been.calledTwice;
			});
			
		});
		
		describe ("#get", function () {
			var model, controller;
			
			afterEach (function () {
				model && model.destroy();
				controller && controller.destroy();
			});
			
			it ("should properly detect properties that are hasOwnProperty true and use getLocal instead", function () {
				controller = new ModelController({someProp: "correct"});
				model = new enyo.Model({someProp: "incorrect"});
				controller.set("model", model);
				var spy = sinon.spy(controller, "get");
				controller.get("someProp");
				expect(spy).to.have.returned("correct");
			});
			
			it ("should properly call get on the model when it exists", function () {
				controller = new ModelController({model: new enyo.Model({someProp: "correct"})});
				expect(controller.get("someProp")).to.equal("correct");
			});
			
			it ("should gracefully fail when no model exists and it was not an own property", function () {
				controller = new ModelController();
				var spy = sinon.spy(controller, "get");
				controller.get("someProp");
				expect(spy).to.have.returned(undefined);
			});
			
		});
		
		describe ("#getLocal", function () {
			var model, controller;
			
			afterEach (function () {
				model && model.destroy();
				controller && controller.destroy();
			});
			
			it ("should properly adhere to the ComputedSupport getter for computed properties", function () {
				var spy = sinon.spy(), ctor;
				ctor = enyo.kind({
					kind: ModelController,
					computed: [
						{method: "someProp"}
					],
					someProp: spy
				});
				controller = new ctor();
				controller.getLocal("someProp");
				expect(spy).to.have.been.called;
			});
			
			it ("should properly return the current value of an own property", function () {
				controller = new ModelController({someProp: "correct"});
				var spy = sinon.spy(controller, "get");
				controller.get("someProp");
				expect(spy).to.have.returned("correct");
			});
			
		});
		
	});
	
	describe ("Events", function () {
		var model, controller;
		
		afterEach (function () {
			model && model.destroy();
			controller && controller.destroy();
		});
		
		it ("should emit a change event when its model emits a change event", function () {
			controller = new ModelController();
			model = new enyo.Model();
			controller.set("model", model);
			var spy = sinon.spy();
			controller.on("change", spy);
			model.set("someProp", "someValue");
			expect(spy).to.have.been.called;
		});
		
		it ("should emit a destroy event when its model emits a destroy event", function () {
			
		});
		
	});
	
	describe ("Notifications", function () {
		
		it ("should notify for each property changed on a model and trigger binding updated");
		it ("should allow bindings to chain through to child attributes and update properly when the model instance changes");
		
	});
	
});