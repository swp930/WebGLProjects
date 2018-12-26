// drawing a single quad (rectangular polygon) with two triangles

var FSIZE = (new Float32Array()).BYTES_PER_ELEMENT; // size of a vertex coordinate (32-bit float)
var VSHADER_SOURCE = null; // vertex shader program
var FSHADER_SOURCE = null; // fragment shader program

var g_points = []; // array of mouse presses
var open = false
var numSides = 14
var radius = 0.1
var volume = 0
var surfaceArea = 0
var cylinderInd = 0

// called when page is loaded
function main() {
    // retrieve <canvas> element
    var canvas = document.getElementById('webgl');
    // get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl) {
	console.log('Failed to get the rendering context for WebGL');
	return;
    }
    // load shader files (calls 'setShader' when done loading)
    loadFile("shader.vert", function(shader_src) {
	setShader(gl, canvas, gl.VERTEX_SHADER, shader_src); });
    loadFile("shader.frag", function(shader_src) {
	setShader(gl, canvas, gl.FRAGMENT_SHADER, shader_src); });
}

// set appropriate shader and start if both are loaded
function setShader(gl, canvas, shader, shader_src) {
    if (shader == gl.VERTEX_SHADER)
	VSHADER_SOURCE = shader_src;
    if (shader == gl.FRAGMENT_SHADER)
	FSHADER_SOURCE = shader_src;
    if (VSHADER_SOURCE && FSHADER_SOURCE)
	start(gl, canvas);
}

// called by 'setShader' when shaders are done loading
function start(gl, canvas) {
    // initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
	console.log('Failed to intialize shaders.');
	return;
    }
    // initialize buffers/attributes/uniforms
    var success = initVertexBuffer(gl);
    success = success && initIndexBuffer(gl);
    success = success && initAttributes(gl);
    success = success && initUniforms(gl);
    // check success
    if (!success) {
	console.log('Failed to initialize buffers.');
	return;
    }
    // specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);
    // clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    var center =  [0,0]
    var center2 = [0.5,0]
    //var center3 = [0.7,0.1]
    //var center4 = [0.4,-0.5]
    //drawCylinder(center, center2, gl)

    // Register function event handlers
    canvas.onmousedown = function(ev){ click(ev, gl, canvas); };
    canvas.onmousemove = function(ev){ move(ev, gl, canvas) }
    //window.onkeypress = function(ev){ keypress(ev, gl); };
    canvas.oncontextmenu = function() {return false;}
    document.getElementById('update_screen').onclick = function(){ updateScreen(canvas, gl); };
    document.getElementById('save_canvas').onclick = function(){ saveCanvas(); };
    document.getElementById('reset_canvas').onclick = function(){ resetCanvas(canvas, gl); };
    var slider = document.getElementById("myRange");
    slider.oninput = function(ev) { analyzeInput(this,gl) }
    var slider2 = document.getElementById("myRange2");
    slider2.oninput = function(ev) { analyzeInput2(this,gl)}
     //setup SOR object reading/writing
    setupIOSOR("fileinput");
}

function analyzeInput(ev,gl){
  volume = 0
  surfaceArea = 0
  numSides = ev.value
  drawCylinderLines(gl)
}

function analyzeInput2(ev,gl){
  volume = 0
  surfaceArea = 0
  radius = (ev.value/15)
  drawCylinderLines(gl)
}
// initialize vertex buffer
function initVertexBuffer(gl) {
    // create buffer object
    var vertex_buffer = gl.createBuffer();
    if (!vertex_buffer) {
	console.log("failed to create vertex buffer");
	return false;
    }
    // bind buffer objects to targets
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    return true;
}

// initialize index buffer
function initIndexBuffer(gl) {
    // create buffer object
    var index_buffer = gl.createBuffer();
    if (!index_buffer) {
	console.log("failed to create index buffer");
	return false;
    }
    // bind buffer objects to targets
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    return true;
}

// set data in vertex buffer (given typed float32 array)
function setVertexBuffer(gl, vertices) {
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
}

// set data in index buffer (given typed uint16 array)
function setIndexBuffer(gl, indices) {
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
}

// initializes attributes
function initAttributes(gl) {
    // assign buffer to a_Position and enable assignment
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
    if (a_Position < 0 || a_PointSize < 0) {
	console.log("failed to get storage location of attribute");
	return false;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 3, 0);
    gl.enableVertexAttribArray(a_Position);
    //gl.vertexAttribPointer(a_PointSize, 1, gl.FLOAT, false, FSIZE * 4, FSIZE * 3);
    //gl.enableVertexAttribArray(a_PointSize);
    return true;
}

// uniform variable locations: made global for easy access and modification
var u_Invert; // invert colors globally (int (used as bool))
var u_Flip;   // flip all vertices over specified 2D dir (within xy-plane z=0) (int (used as bool))
var u_FlipDir; // direction to flip points over origin (float vec2)

// initializes uniforms
function initUniforms(gl) {
    u_Invert = gl.getUniformLocation(gl.program, 'u_Invert');
    u_Flip = gl.getUniformLocation(gl.program, 'u_Flip');
    u_FlipDir = gl.getUniformLocation(gl.program, 'u_FlipDir');
    if (!u_Invert || !u_Flip) {
	console.log("failed to get storage location of uniform");
	return false;
    }
    // set default values
    gl.uniform1i(u_Invert, 0); // no invert
    gl.uniform1i(u_Flip, 0); // no flip
    gl.uniform2f(u_FlipDir, 1, 1); // diagonal
    return true;
}

// Called when user presses a key
function keypress(ev, gl) {
    if (ev.which == "q".charCodeAt(0)) gl.uniform1i(u_Invert, 0); // Set invert variable to false
    if (ev.which == "w".charCodeAt(0)) gl.uniform1i(u_Invert, 1); // Set invert variable to true
    if (ev.which == "a".charCodeAt(0)) gl.uniform1i(u_Flip, 0); // Set flip variable to false
    if (ev.which == "s".charCodeAt(0)) gl.uniform1i(u_Flip, 1); // Set flip variable to true
    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
    // Draw polyline
    //drawPolyline(gl);
}

function move(ev, gl, canvas) {
    if(!open)
      return
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();
    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
    // Store the vertex information to g_points array
    g_points = g_points.splice(0,g_points.length-3)
    g_points.push(x); // x-coordinate
    g_points.push(y); // y-coordinate
    g_points.push(0); // z-coordinate is 0; polyline lines in xy-plane z=0

    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
    // Draw polyline
    drawPolyline(gl);

    // If user right clicks, finish polyline and draw cylinder
    if (ev.button == 2) {
	// Clear canvas
	gl.clear(gl.COLOR_BUFFER_BIT);
	/* PUT CODE TO GENERATE VERTICES/INDICES OF CYLINDER AND DRAW HERE */
	drawRectangles(gl); // EXAMPLE: Generates rectangles whose corners are connected
	// drawPolyline(gl); // EXAMPLE: Draw polyline
	// Remove click handle
	canvas.onmousedown = null;
    }
}

// Called when user clicks on canvas
function click(ev, gl, canvas) {
    open = true
    move(ev,gl,canvas)
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();
    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
    // Store the vertex information to g_points array
    g_points.push(x); // x-coordinate
    g_points.push(y); // y-coordinate
    g_points.push(0); // z-coordinate is 0; polyline lines in xy-plane z=0
    //g_points.push(1); // point size; make size increase with number of points

    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
    // Draw polyline
    drawPolyline(gl);

    // If user right clicks, finish polyline and draw cylinder
    if (ev.button == 2) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      open = false
      drawCylinderLines(gl)
	   canvas.onmousedown = null;
    }
}

function drawCylinderLines(gl){
  gl.clear(gl.COLOR_BUFFER_BIT);
   var i = 0
   var last = []
   var arr = []
   for(i = 0; i+2 < g_points.length; i+=3){
     arr.push(g_points[i])
     arr.push(g_points[i+1])
   }
   var index = 0
   for(i = 0; i+1 < arr.length; i+=2){
     var point = [arr[i], arr[i+1]]
     //console.log(point)
     if( last.length == 0){
         last.push(arr[i])
         last.push(arr[i+1])
     }
     else {
       index++;
       drawCylinder(last, point, gl, numSides, radius, index)
       last = []
       last = point
     }
   }
   console.log("Total volume: "+ volume)
   console.log("Total surface area: "+ surfaceArea)
}

function drawCylinder(point1, point2, gl, numSides, radius, index){
  var arr = getCirclePoint(point1, numSides, radius)
  var arr2 = getCirclePoint(point2, numSides, radius)
  var angle = toDegrees(Math.atan((point2[0]-point1[0])/(point2[1]-point1[1])))
  var arr = rotatePoint(arr, angle, point1)
  var arr2 = rotatePoint(arr2, angle, point2)

  var vertices = new Float32Array(arr)
  var vertices2 = new Float32Array(arr2)

  var indiceArr = []
  var i = 0
  for(i = 0; i < numSides; i++)
    indiceArr.push(i)
  indiceArr.push(0)
  //var indices = new Int16Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0   // bottom right triangle
  //])
  var indices = new Int16Array(indiceArr)

  setIndexBuffer(gl, indices);

  setVertexBuffer(gl, vertices)
  gl.drawElements(gl.LINE_STRIP, indices.length, gl.UNSIGNED_SHORT, 0);

  setVertexBuffer(gl, vertices2)
  gl.drawElements(gl.LINE_STRIP, indices.length, gl.UNSIGNED_SHORT, 0);

  connectSquares(arr, arr2, gl)
  var dist = Math.sqrt(Math.pow((point2[1]-point1[1]),2) + Math.pow((point2[0]-point1[0]),2))
  var tempVol = dist*area(numSides, radius)
  var deg = 360/numSides
  var tempSurfArea = 2*area(numSides, radius) + numSides*dist*(2*radius*Math.sin(toRadians(deg/2)))
  if(tempVol>0){
      cylinderInd++
      console.log("Volume of cylinder " + index + " is: " + tempVol)
      console.log("Surface Area of cylinder " + index + " is: " + tempSurfArea)
  }
  volume += tempVol
  surfaceArea += tempSurfArea
}

function area(n, r){
  var deg = 360/n
  var inp = deg/2
  var num = n * r * r * Math.sin(toRadians(inp)) * Math.cos(toRadians(inp))
  return num
}

function connectSquares(arr, arr2, gl){
  var sqArr = []
  for(i = 0; i+5 < arr.length; i+=6){
    sqArr = []
    var j = 0
    for(j = 0; j<3; j++)
      sqArr.push(arr2[i+j])
    for(j = 0; j<3; j++)
      sqArr.push(arr[i+j])
    for(j = 3; j<6; j++)
      sqArr.push(arr[i+j])
    for(j = 3; j<6; j++)
      sqArr.push(arr2[i+j])
    drawSquare(sqArr, gl)
  }
}

function drawSquare(vertices, gl){
  if(vertices.length != 12)
    return
  var dVertices = new Float32Array(vertices)
  setVertexBuffer(gl, dVertices)
  var dIndices = new Int16Array([0, 1, 2, 0, 0, 2, 3, 0])
  setIndexBuffer(gl, dIndices)
  gl.drawElements(gl.LINE_STRIP, dIndices.length, gl.UNSIGNED_SHORT, 0)
}

//Rotates around origin
function rotate(arr, deg){
  var rArr = []
  if(arr.length%3 != 0)
    return
  var i = 0
  for(i = 0; i+2 < arr.length; i+=3){
    var x = arr[i]
    var y = arr[i+1]
    rArr.push(x*Math.cos(toRadians(deg)) - y*Math.sin(toRadians(deg)))
    rArr.push(x*Math.sin(toRadians(deg)) + y*Math.cos(toRadians(deg)))
    rArr.push(arr[i+1])
  }
  return rArr
}

function getCirclePoint(center, numSides, radius){
  var arr = []
  var degree = 360/numSides
  var i = 0
  for(i = 1; i <= numSides; i++){
    arr.push(radius*Math.cos(toRadians(i*degree))+center[0])
    arr.push(center[1])
    arr.push(radius*Math.sin(toRadians(i*degree)))
  }
  return arr
}

function rotatePoint(arr, deg, point){
  deg = -deg
  if(point.length != 2)
    return
  var a = point[0]
  var b = point[1]
  var rArr = []
  if(arr.length%3 != 0)
    return
  var i = 0
  for(i = 0; i+2 < arr.length; i+=3){
    var x = arr[i]
    var y = arr[i+1]
    rArr.push((x-a)*Math.cos(toRadians(deg)) - (y-b)*Math.sin(toRadians(deg))+a)
    rArr.push((x-a)*Math.sin(toRadians(deg)) + (y-b)*Math.cos(toRadians(deg))+b)
    rArr.push(arr[i+1])
  }
  return rArr
}

function toRadians (angle) {
  return angle * (Math.PI / 180);
}

function toDegrees (angle) {
  return angle * (180 / Math.PI)
}

// Draws the polyline based on clicked points
function drawPolyline(gl) {
    // Set vertices
    setVertexBuffer(gl, new Float32Array(g_points));
    var n = Math.floor(g_points.length/3);
    // Set indices (just an array of the numbers 0 to (n-1), which connects them one by one)
    var ind = [];
    for (i = 0; i < n; ++i)
	ind.push(i);
    setIndexBuffer(gl, new Uint16Array(ind));
    // Draw points and lines
    //gl.drawElements(gl.POINTS, n, gl.UNSIGNED_SHORT, 0);
    gl.drawElements(gl.LINE_STRIP, n, gl.UNSIGNED_SHORT, 0);
}

// Draws connected rectangles between clicked points
function drawRectangles(gl) {
  //  var n = g_points.length - 1; // Number of rectangles
  //  var vert = [];
  //  var ind = [];
  //   Draw each individual rectangle separately
  //  /* NOTE: You can also draw them all at once (single call to 'drawElements') if you want */
  //  for (i = 0; i < n; ++i) {
	// First corner of rectangle
	//vert.push(g_points[i*4]); // x coord
	//vert.push(g_points[i*4 + 1]); // y coord
	//vert.push(0); // z coord
	//vert.push(1); // Point size
	//ind.push(0);
	//// Second corner of rectangle
	//vert.push(g_points[i*4]);
	//vert.push(g_points[(i+1)*4 + 1]);
	//vert.push(0);
	//vert.push(1);
	//ind.push(1);
	//// Third corner of rectangle
	//vert.push(g_points[(i+1)*4]);
	//vert.push(g_points[(i+1)*4 + 1]);
	//vert.push(0);
	//vert.push(1);
	//ind.push(2);
	//// Fourth corner of rectangle
	//vert.push(g_points[(i+1)*4]);
	//vert.push(g_points[i*4 + 1]);
	//vert.push(0);
	//vert.push(1);
	//ind.push(3);
	//// Connect First corner again to wrap lines around
	//ind.push(0);
	//// Set vertices
	//setVertexBuffer(gl, new Float32Array(vert));
	//var n = ind.length;
	//// Set indices
	//setIndexBuffer(gl, new Uint16Array(ind));
  //// Draw rectangle
	//gl.drawElements(gl.LINE_STRIP, n, gl.UNSIGNED_SHORT, 0);
	//// Reset vertices and indices
	//vert = [];
	//ind = [];
//}
}

// loads SOR file and draws object
function updateScreen(canvas, gl) {
    canvas.onmousedown = null; // disable mouse
    var sor = readFile();      // get SOR from file
    //setVertexBuffer(gl, new Float32Array(sor.vertices));
    //setIndexBuffer(gl, new Uint16Array(sor.indexes));
    // clear canvas
    g_points = sor.vertices
    drawCylinderLines(gl)
    /*gl.clear(gl.COLOR_BUFFER_BIT);
    // draw model
    //gl.drawElements(gl.LINE_STRIP, sor.indexes.length, gl.UNSIGNED_SHORT, 0);
    g_points = sor.vertices
    var i = 0
    var last = []
    var arr = []
    for(i = 0; i+2 < g_points.length; i+=3){
      arr.push(g_points[i])
      arr.push(g_points[i+1])
    }
    for(i = 0; i+1 < arr.length; i+=2){
      var point = [arr[i], arr[i+1]]
      //console.log(point)
      if( last.length == 0){
          last.push(arr[i])
          last.push(arr[i+1])
      }
      else {
        console.log(last)
        console.log(point)
        drawCylinder(last, point, gl)
        console.log("Break")
        last = []
        last = point
      }
    }*/
}

// saves polyline displayed on canvas to file
function saveCanvas() {
    var sor = new SOR();
    sor.objName = "model";
    sor.vertices = g_points;
    sor.indexes = [];
    for (i = 0; i < g_points.length/3; i++)
	sor.indexes.push(i);
    console.log(sor.indexes);
    saveFile(sor);
}

// clears canvas and allows for drawing new cylinders
function resetCanvas(canvas, gl) {
    canvas.onmousedown = function(ev){ click(ev, gl, canvas); };
    g_points = [];
    gl.clear(gl.COLOR_BUFFER_BIT);
}
