var FSIZE = 4; // size of a vertex coordinate (32-bit float)
var VSHADER_SOURCE = null; // vertex shader program
var FSHADER_SOURCE = null; // fragment shader program

var g_points = []; // array of mouse presses
var open = false
var numSides = 10
var radius = 0.1
var volume = 0
var surfaceArea = 0
var cylinderInd = 0
var percent = 0.4;
var showNormals = false

var light = [1,1,1]
var icol = [1,1,1]

var first1 = true
var first2 = true
var draw = false

function main() {
    // retrieve <canvas> element
    var canvas = document.getElementById('webgl');
    // get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    // load shader files
    loadFile("shader.vert", function(shader_src) { setShader(gl, canvas, gl.VERTEX_SHADER, shader_src); });
    loadFile("shader.frag", function(shader_src) { setShader(gl, canvas, gl.FRAGMENT_SHADER, shader_src); });
}

function setShader(gl, canvas, shader, shader_src) {
    if (shader == gl.VERTEX_SHADER)
        VSHADER_SOURCE = shader_src;
    if (shader == gl.FRAGMENT_SHADER)
        FSHADER_SOURCE = shader_src;
    if (VSHADER_SOURCE && FSHADER_SOURCE)
        start(gl, canvas);
}

function start(gl, canvas) {
    // initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }
    // initialize buffers
    var success = initVertexBuffer(gl);
    success = success && initIndexBuffer(gl);
    success = success && initAttributes(gl);
    if (!success) {
        console.log('Failed to initialize buffers.');
        return;
    }
    // specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);
    // clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
    var val = gl.getUniformLocation(gl.program, 'val');
    var uniformGreen = gl.getUniformLocation(gl.program, 'uniformGreen');
    gl.uniform1f(val, 1.0);
    gl.uniform3f(uniformGreen, 1.0, 0.0, 0.0);
    //Sanity Check!!
    var vertices = [0.09, 0.5, 0.5, 0, 1, 0, 1, 1, 1, 1,
                    0.09, 0, 0.5,     0, 1, 0, 1, 1, 1, 1,
                    0.06, 0, 0,       0, 1, 0, 1, 1, 1, 1,
                    0.06, 0.5, 0,     0, 1, 0, 1, 1, 1, 1]

    //drawSquare(vertices,gl, 0 , 0)
    var point1 = [0,0]
    var point2 = [0.5,0.5]
    drawCylinder(point1, point2, gl, numSides, radius, 0)
    //drawCylinder(point1, point2, gl, numSides, radius, 0)
    //drawCylinder(point3, point2, gl, numSides, radius, 0)
    //Sanity Check!!

   document.getElementById('shift').onclick = function(){ shiftCylinder(canvas, gl); };
   document.getElementById('shiftLightLeft').onclick = function(){ shiftLight(canvas, gl, -1); };
   document.getElementById('shiftLightRight').onclick = function(){ shiftLight(canvas, gl, 1); };
   document.getElementById('normal').onclick = function(ev){ drawNormals(ev, gl)}
   canvas.onmousedown = function(ev){ click(ev, gl, canvas); };
   canvas.onmousemove = function(ev){ move(ev, gl, canvas) }
}

function drawNormals(ev, gl){
  if(ev.target.checked)
    showNormals = true
  else
    showNormals = false
  drawCylinderLines(gl)
}

function shiftCylinder(canvas, gl){
   var i = 0
   for(i = 0; i+9 < g_points.length; i+=10){
     g_points[i] += 0.01
   }
   drawCylinderLines(gl)
}

function shiftLight(canvas, gl, dir){
  light = [light[0]+dir*0.1, light[1], light[2]]
  drawCylinderLines(gl)
}

function findNormal(a, b, c, gl){
  var v1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  var v2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
  var vert = [b, a, c, a]
  var n = getCross(v1, v2)
  n = normalize(n)
  return n
}

function getCross(v1, v2){
  if(v1.length != 3 || v2.length != 3)
    return
  var x = v1[1]*v2[2] - v1[2]*v2[1]
  var y = -(v1[0]*v2[2] - v2[0]*v1[2])
  var z = v1[0]*v2[1] - v2[0]*v1[1]
  var n = [x, y, z]
  return n
}

function normalize(v1){
  var dist = Math.sqrt(Math.pow(v1[0], 2) + Math.pow(v1[1], 2) + Math.pow(v1[2], 2))
  var n = [v1[0]/dist, v1[1]/dist, v1[2]/dist]
  return n
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
    // assign buffers and enable assignment
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (a_Position < 0) {
        console.log("failed to get storage location of a_Position");
        return false;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 10, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, FSIZE * 10, FSIZE * 3);
    gl.enableVertexAttribArray(a_Color);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * 10, 0);
    gl.enableVertexAttribArray(a_Normal);
    return true;
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
    g_points.push(0);
    g_points.push(1);
    g_points.push(0);
    g_points.push(1);

    g_points.push(1);
    g_points.push(1);
    g_points.push(1);

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

function move(ev, gl, canvas) {
    if(!open)
      return
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();
    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
    // Store the vertex information to g_points array
    g_points = g_points.splice(0,g_points.length-10)
    g_points.push(x); // x-coordinate
    g_points.push(y); // y-coordinate
    g_points.push(0); // z-coordinate is 0; polyline lines in xy-plane z=0
    g_points.push(0);
    g_points.push(1);
    g_points.push(0);
    g_points.push(1);

    g_points.push(1);
    g_points.push(1);
    g_points.push(1);

    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
    // Draw polyline
    drawPolyline(gl);

    // If user right clicks, finish polyline and draw cylinder
    if (ev.button == 2) {
	// Clear canvas
	gl.clear(gl.COLOR_BUFFER_BIT);
	/* PUT CODE TO GENERATE VERTICES/INDICES OF CYLINDER AND DRAW HERE */
	//drawRectangles(gl); // EXAMPLE: Generates rectangles whose corners are connected
	// drawPolyline(gl); // EXAMPLE: Draw polyline
	// Remove click handle
	canvas.onmousedown = null;
    }
}

function drawPolyline(gl) {
    // Set vertices
    setVertexBuffer(gl, new Float32Array(g_points));
    var n = Math.floor(g_points.length/10);
    // Set indices (just an array of the numbers 0 to (n-1), which connects them one by one)
    var ind = [];
    for (i = 0; i < n; ++i)
	    ind.push(i);
    setIndexBuffer(gl, new Uint16Array(ind));
    // Draw points and lines
    //gl.drawElements(gl.POINTS, n, gl.UNSIGNED_SHORT, 0);
    gl.drawElements(gl.LINE_STRIP, n, gl.UNSIGNED_SHORT, 0);
}

/// CYLINDER CODE
function drawCylinderLines(gl){
  gl.clear(gl.COLOR_BUFFER_BIT);
   var i = 0
   var last = []
   var arr = []
   /*for(i = 0; i+6 < g_points.length; i+=7){
     arr.push(g_points[i])
     arr.push(g_points[i+1])
   }*/
   for(i = 0; i+9 < g_points.length; i+=10){
     arr.push(g_points[i])
     arr.push(g_points[i+1])
   }

   var index = 0
   for(i = 0; i+1 < arr.length; i+=2){
     var point = [arr[i], arr[i+1]]
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
}

function drawCylinder(point1, point2, gl, numSides, radius, index){
  var centerCylinder = [(point1[0]+point2[0])/2, (point1[1]+point2[1])/2]
  var arr = getCirclePoint(point1, numSides, radius)
  var k = 0
  var newArray = []
  for(k = 0; k < 28; k++){
    newArray.push[arr[k]]
  }
  var arr2 = getCirclePoint(point2, numSides, radius)
  var angle = toDegrees(Math.atan((point2[0]-point1[0])/(point2[1]-point1[1])))
  arr = rotatePoint(arr, angle, point1)
  arr2 = rotatePoint(arr2, angle, point2)

  var vertices = new Float32Array(arr)
  var vertices2 = new Float32Array(arr2)

  var indiceArr = []
  var i = 0
  for(i = 0; i < numSides; i++)
    indiceArr.push(i)
  indiceArr.push(0)
  var indices = new Int16Array(indiceArr)

  //setIndexBuffer(gl, indices);
  //setVertexBuffer(gl, vertices)
  //gl.drawElements(gl.LINE_STRIP, indices.length, gl.UNSIGNED_SHORT, 0);
  //setVertexBuffer(gl, vertices2)
  //gl.drawElements(gl.LINE_STRIP, indices.length, gl.UNSIGNED_SHORT, 0);

  connectSquares(arr, arr2, gl, centerCylinder)
  var dist = Math.sqrt(Math.pow((point2[1]-point1[1]),2) + Math.pow((point2[0]-point1[0]),2))
  var tempVol = dist*area(numSides, radius)
  var deg = 360/numSides
  var tempSurfArea = 2*area(numSides, radius) + numSides*dist*(2*radius*Math.sin(toRadians(deg/2)))
  if(tempVol>0){
      cylinderInd++
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

function getCirclePoint(center, numSides, radius){
  var arr = []
  var degree = 360/numSides
  var i = 0
  for(i = 1; i <= numSides; i++){
    arr.push(radius*Math.cos(toRadians(i*degree))+center[0])
    arr.push(center[1])
    arr.push(radius*Math.sin(toRadians(i*degree)))
    arr.push(0)
    arr.push(1)
    arr.push(0)
    arr.push(1)

    arr.push(1)
    arr.push(1)
    arr.push(1)
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
  if(arr.length%10 != 0)
    return
  var i = 0

  for(i = 0; i+9 < arr.length; i+=10){
    var x = arr[i]
    var y = arr[i+1]
    rArr.push((x-a)*Math.cos(toRadians(deg)) - (y-b)*Math.sin(toRadians(deg))+a)
    rArr.push((x-a)*Math.sin(toRadians(deg)) + (y-b)*Math.cos(toRadians(deg))+b)
    rArr.push(arr[i+2])
    rArr.push(0)
    rArr.push(1)
    rArr.push(0)
    rArr.push(1)

    rArr.push(0)
    rArr.push(0)
    rArr.push(0)
  }
  return rArr
}

function toRadians (angle) {
  return angle * (Math.PI / 180);
}

function toDegrees (angle) {
  return angle * (180 / Math.PI)
}

function connectSquares(arr, arr2, gl, centerCylinder){
  var points = []
  var points2 = []
  var a = 0

  for(a = 0; a+9 < arr.length; a+=10){
      var point = []
      var point2 = []
      var b = a
      for(b = a; b <= a+9; b++){
            point.push(arr[b])
            point2.push(arr2[b])
      }
      points.push(point)
      points2.push(point2)
  }

  var squares2 = []

  var last = []
  var last2 = []
  for(a = 0; a < points.length; a++){
    if(last.length == 0){
      last = points[a]
      last2 = points2[a]
    } else {
      var sqArr = []
      var c = 0
      for(c = 0; c < last.length; c++)
        sqArr.push(last[c])
      for(c = 0; c < last2.length; c++)
        sqArr.push(last2[c])
      for(c = 0; c < points2[a].length; c++)
        sqArr.push(points2[a][c])
      for(c = 0; c < points[a].length; c++)
        sqArr.push(points[a][c])
      squares2.push(sqArr)
      last = points[a]
      last2 = points2[a]
    }
  }
  var p1 = points[points.length-1]
  var p2 = points2[points2.length-1]
  var p3 = points2[0]
  var p4 = points[0]
  var lastPoint = [p1, p2, p3, p4]

  var d = 0
  var sqArr = []
  for(d = 0; d < lastPoint.length; d++){
    var e = 0
    for(e = 0; e < lastPoint[d].length; e++){
      sqArr.push(lastPoint[d][e])
    }
  }

  squares2.push(sqArr)
  var r = 0
  //13 12 11 3 2 1 0
  for(r = squares2.length-1; r >= 0; r--)
    drawSquare(squares2[r], gl, r, centerCylinder)
}

function shading(norm){
  var vlt = light
  var vlt = normalize(vlt)
  var dotprod = norm[0]*vlt[0] + norm[1]*vlt[1] + norm[2]*vlt[2]
  if(dotprod < 0)
    dotprod = 0
  var col = [0, 1*dotprod, 0, 1]
  return col
}

function drawSquare(vertices, gl, index, centerCylinder){
  if(vertices.length != 40)
    return
  var arr = []
  var coordinate = []
  var i = 0

  for(i = 0; i+9 < vertices.length; i+=10) {
    var point = []
    point.push(vertices[i])
    point.push(vertices[i+1])
    point.push(vertices[i+2])
    coordinate.push(point)
  }

  var center = []
  center.push((coordinate[0][0] + coordinate[3][0])/2)
  center.push((coordinate[0][1] + coordinate[3][1])/2)
  center.push((coordinate[0][2] + coordinate[3][2])/2)

  var centerOpposite = []
  centerOpposite.push((coordinate[1][0] + coordinate[2][0])/2)
  centerOpposite.push((coordinate[1][1] + coordinate[2][1])/2)
  centerOpposite.push((coordinate[1][2] + coordinate[2][2])/2)

  var vectorLine = [centerOpposite[0] - center[0], centerOpposite[1] - center[1], centerOpposite[2] - center[2]]

  var pos = (index+1)/numSides
  var midPoint = [center[0]+pos*vectorLine[0], center[1]+pos*vectorLine[1], center[2]+pos*vectorLine[2]]
  center = midPoint

  var n = findNormal(coordinate[0], coordinate[1], coordinate[2])
  var ind2 = [0,1]
  var vectorCenter = [centerCylinder[0]-center[0], centerCylinder[1]-center[1], 0-center[2]]
  var dotprod = n[0]*vectorCenter[0] + n[1]*vectorCenter[1] + n[2]*vectorCenter[2]
  if(dotprod > 0)
   n = [-n[0], -n[1], -n[2]]

  var col = shading(n)
  var center2 = [center[0]+n[0], center[1]+n[1], center[2]+n[2]]
  var ray = [center[0], center[1], center[2], 1, 0, 0, 1,
             center2[0], center2[1], center2[2], 1, 0, 0, 1]
  for(i = 0; i+9 < vertices.length; i+=10) {
    arr.push(vertices[i])
    arr.push(vertices[i+1])
    arr.push(vertices[i+2])
    arr.push(col[0])
    arr.push(col[1])
    arr.push(col[2])
    arr.push(col[3])

    arr.push(-1)
    arr.push(10000000)
    arr.push(-1)
  }
  var ind = [0,1,2,
             3,0,2]

    setVertexBuffer(gl, new Float32Array(arr));
    setIndexBuffer(gl, new Uint16Array(ind));
    gl.drawElements(gl.TRIANGLES, ind.length, gl.UNSIGNED_SHORT, 0);

  if(showNormals){
    setVertexBuffer(gl, new Float32Array(ray));
    setIndexBuffer(gl, new Uint16Array(ind2));
    gl.drawElements(gl.LINES, ind2.length, gl.UNSIGNED_SHORT, 0)
  }
}
