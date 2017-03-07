// Class for creating & handling the dat.gui controls 
// as well as creating a common interface for all modes to use

var GUI = (function (scope) {
	//Constructor 
	function GUI(){
		// Colors to use throughout 
		this.colors = {
			'viewing':'#e59a1c', // For the line/place of intersection
			'data':'#3090FF' // For the actual shape/data
		}

		// These are all the possible parameters to keep track of 
		this.params = {
			// Shape Properties
			'source':'cartesian',
			'equation':'',
			'points':'', // For convex hull 
			'param_a':'', // These are the ranges the parameters take 
			'param_b':'',
			'param_c':'',
			'param_d':'',
			'param_eq_x':'', // This is the parametric equation
			'param_eq_y':'',
			'param_eq_z':'',
			'param_eq_w':'',
			'render_shape':true,
			'resolution':60, // For the marching squares/cubes 

			// Viewing Controls
			'axis_value':0,
			'axis':'Y',
			'samples':200,
			'thickness':'medium'
		};
		this.gui = null;
		this.mode = "";
		this.last_source = this.params.source;

		// 2D defaults 
		this.defaults = {}
		this.defaults['2D'] = {
			'equation':'x^2+y^2 = 10', // Circle
			'points':'(5,5),(5,-5),(-5,-5),(-5,5)', // Square
			'param_eq_x':'cos(a) * b', // butterfly wings
			'param_eq_y':'cos(a * 2) * b',
			'param_a':'0 < a < 2 * PI',
			'param_b':'0 < b < 1'
		}
		// 3D defaults 
		this.defaults['3D'] = {
			'equation':'x^2+y^2+z^2 = 100', // Sphere
			'points':'(5,0,5),(5,0,-5),(-5,0,-5),(-5,0,5),(5,5,5),(5,5,-5),(-5,5,-5),(-5,5,5)', // Cube
			'param_eq_x':'b * cos(a) - c * sin(a)', // Spiral tube
			'param_eq_y':'b * sin(a) + c * cos(a)',
			'param_eq_z':'a/3',
			'param_a':'-4 * PI < a < 4 * PI',
			'param_b':'0 < b < 1',
			'param_c':'0 < c < 1'
		}
	}

	GUI.prototype.init = function(mode){
		// Creates the scene and everything
		this.gui = new dat.GUI();
		this.mode = mode;
		// Create the two folders
		var shapeProperties = this.gui.addFolder('Shape Properties');
	    var viewingControls = this.gui.addFolder('Viewing Controls');
	    this.shapeProperties = shapeProperties; this.viewingControls = viewingControls;
	    var current_scope = this;
	    var params = this.params;

	    // Load defaults 
	    for(var key in params){
	    	if(this.defaults[mode][key]){
	    		params[key] = this.defaults[mode][key]
	    	}
	    }

	    shapeProperties.add(params, 'source',['cartesian','parametric','convex-hull']).onChange(function(val){
	    	if(val == 'cartesian' && current_scope.last_source != 'cartesian'){
	    		current_scope.destroyConvexSource();
	    		current_scope.destroyParamSource();
	    		current_scope.initCartesianSource();
	    	}
	    	if(val == 'parametric' && current_scope.last_source != 'parametric'){
	    		current_scope.destroyConvexSource();
	    		current_scope.destroyCartesianSource();
	    		current_scope.initParamSource();
	    	}
	    	if(val == 'convex-hull' && current_scope.last_source != 'convex-hull'){
	    		current_scope.destroyCartesianSource();
	    		current_scope.destroyParamSource();
	    		current_scope.initConvexSource();
	    	}
	    	current_scope.last_source = val
	    });

	    shapeProperties.add(params, 'render_shape').name("Render Shape");

	    // Init cartesian by default 
	    this.initCartesianSource();

	    // Now the viewing controls 
	    var axis_value_control = this.viewingControls.add(params, 'axis_value').min(-10).max(10).step(0.01).name('Y = ').listen();
	    var axes_list = ['X','Y'];
	    if(mode == "3D" || mode == "4D") axes_list.push("Z");
	    if(mode == "4D") axes_list.push("W");
	    this.viewingControls.add(params, 'axis', axes_list ).onChange(function(val){
	    	axis_value_control.name(val + " = ")
	    	params.axis_value = 0;
	    });

	    this.viewingControls.add(params, 'samples', 200, 10000).name('Samples');
	    this.viewingControls.add(params, 'thickness', ['thin','medium','thick']).name('Thickness');

	    // Turn all sliders orange after the first one (the first one is the resolution one)
	    var sliders = document.querySelectorAll(".slider-fg")
	    for(var i=1;i<sliders.length;i++){ //notice i=1
	    	var slider = sliders[i]
	    	slider.style.background = this.colors.viewing
		    slider.parentNode.parentNode.querySelector(".dg .cr.number input[type='text']").style.color = this.colors.viewing
	    	slider.parentNode.parentNode.parentNode.parentNode.style['border-left'] = "3px solid " + this.colors.viewing
	    }
	}

	// Functions for creating the controls for the 3 different inputs (cartesian, parametric and convex hull)
	GUI.prototype.initCartesianSource = function(){
		var arr = [];
		

		arr.push(this.shapeProperties.add(this.params, 'equation').name('Equation'));
		arr.push(this.shapeProperties.add(this.params, 'resolution', 20, 200).name('Resolution').step(1));

		this.cartesianSourceItems = arr;
	}
	GUI.prototype.destroyCartesianSource = function(){
		if(!this.cartesianSourceItems) return;
		for(var i=0;i<this.cartesianSourceItems.length;i++){
			this.shapeProperties.remove(this.cartesianSourceItems[i])
		}
		this.cartesianSourceItems = [];
	}
	GUI.prototype.initParamSource = function(){
		var arr = [];

		arr.push(this.shapeProperties.add(this.params, 'param_eq_x').name('x = '));
		arr.push(this.shapeProperties.add(this.params, 'param_eq_x').name('y = '));
		arr.push(this.shapeProperties.add(this.params, 'param_a').name('a = '));
		arr.push(this.shapeProperties.add(this.params, 'param_b').name('b = '));
		if(this.mode == "3D" || this.mode  == "4D"){
			arr.push(this.shapeProperties.add(this.params, 'param_eq_z').name('z = '));
			arr.push(this.shapeProperties.add(this.params, 'param_c').name('c = '));
		}
		if(this.mode == "4D"){
			arr.push(this.shapeProperties.add(this.params, 'param_eq_w').name('w = '));
			arr.push(this.shapeProperties.add(this.params, 'param_d').name('d = '));
		}

		this.paramSourceItems = arr;
	}
	GUI.prototype.destroyParamSource = function(){
		if(!this.paramSourceItems) return;
		for(var i=0;i<this.paramSourceItems.length;i++){
			this.shapeProperties.remove(this.paramSourceItems[i])
		}
		this.paramSourceItems = [];
	}
	GUI.prototype.initConvexSource = function(){
		var arr = [];
		
		arr.push(this.shapeProperties.add(this.params, 'points'));

		this.convexSourceItems = arr;
	}
	GUI.prototype.destroyConvexSource = function(){
		if(!this.convexSourceItems) return;
		for(var i=0;i<this.convexSourceItems.length;i++){
			this.shapeProperties.remove(this.convexSourceItems[i])
		}
		this.convexSourceItems = [];
	}


	GUI.prototype.cleanup = function(){
		//Destroys everything created
		this.gui.destroy();
	}


	scope.GUI = GUI;
	return GUI;
})(typeof exports === 'undefined' ? {} : exports);
