// LightedCube_ambient.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = null
var FSHADER_SOURCE = null

var g_points_vertices = []; // array of mouse presses
var g_points_colors = [];
var g_points_normals = [];
var cylinderPoints = []
var yDegree = 0
var open = true
var numSides = 20
var radius = 0.2
var volume = 0
var surfaceArea = 0
var cylinderInd = 0
var percent = 0.4;
var showNormals = false
var projection = true
var picked = false
var enteredDrag = false
var enteredDrag2 = false
var lastDragPoint = []
var yAngle = 0.0
var xAngle = 0.0
var zAngle = 0.0
var squareDegree = 0
var frontY = true
var frontX = true
var zShift = 0
var zKey = false
var lastPoint=[0,0]

var ambientlight = [0,0,0.2]

var light = [1,1,1]
var light2 = [1,1,1]
var icol = [1,1,1]

var first1 = true
var first2 = true
var draw = false
var cylinderShift = 0

function setShader(gl, canvas, shader, shader_src) {
    if (shader == gl.VERTEX_SHADER)
        VSHADER_SOURCE = shader_src;
    if (shader == gl.FRAGMENT_SHADER)
        FSHADER_SOURCE = shader_src;
    if (VSHADER_SOURCE && FSHADER_SOURCE)
        start(gl, canvas);
}

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  loadFile("shader.vert", function(shader_src) { setShader(gl, canvas, gl.VERTEX_SHADER, shader_src); });
  loadFile("shader.frag", function(shader_src) { setShader(gl, canvas, gl.FRAGMENT_SHADER, shader_src); });
}

function start(gl, canvas){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Set the clear color and enable the depth test
  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST);

  // Get the storage locations of uniform variables and so on
  var u_DiffuseLight = gl.getUniformLocation(gl.program, 'u_DiffuseLight');
  var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
  var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
  var u_UniformGreen = gl.getUniformLocation(gl.program, 'u_UniformGreen');
  var u_ViewDirection = gl.getUniformLocation(gl.program, 'u_ViewDirection');
  var u_SpecularLight = gl.getUniformLocation(gl.program, 'u_SpecularLight');
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var p = gl.getUniformLocation(gl.program, 'p');
  if (!u_DiffuseLight || !u_LightDirection || !u_AmbientLight) {
    console.log('Failed to get the storage location');
    return;
  }

  var viewMatrix = new Matrix4();　// The view matrix
  var projMatrix = new Matrix4();  // The projection matrix
  var modelMatrix = new Matrix4();

  var ANGLE = 0.0; // The rotation angle
  modelMatrix.setRotate(ANGLE, 0, 1, 0);  // Set rotation matrix
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  // calculate the view matrix and projection matrix
  viewMatrix.setLookAt(0, 0, 5, 0, 0, -100, 0, 1, 0);
  //projMatrix.setPerspective(40, canvas.width/canvas.height, 1, 100);
  projMatrix.setOrtho(-2, 2, -2, 2, 3, 100)
  // Pass the view and projection matrix to u_ViewMatrix, u_ProjMatrix
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

  gl.uniform3f(u_UniformGreen, 0.0, 1.0, 0.0);
  // Set the light color (white)
  gl.uniform3f(u_DiffuseLight, 1.0, 0.0, 0.0);
  // Set the light direction (in the world coordinate)
  var lightDirection = new Vector3([1.0, 1.0, 1.0]);
  lightDirection.normalize();     // Normalize
  gl.uniform3fv(u_LightDirection, lightDirection.elements);
  // Set the ambient light
  gl.uniform3f(u_AmbientLight, 0.0, 0.0, 0.2);

  gl.uniform3f(u_ViewDirection, 0.0, 0.0, -1.0);

  gl.uniform3f(u_SpecularLight, 0.2, 1.0, 0.0);

  gl.uniform1f(p, 80.0);


  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //cylinderPoints = [0,0,0.9,0]
  //drawAllCylinders(cylinderPoints, gl)
  document.getElementById('shiftLightLeft').onclick = function(){ shiftLight(canvas, gl, -1, 0); };
  document.getElementById('shiftLightRight').onclick = function(){ shiftLight(canvas, gl, 1, 0); };
  document.getElementById('toggleProjection').onclick = function(){ toggleProjection(canvas, gl); };
  document.getElementById('scaleLarger').onclick = function(ev){ scale(ev, gl, 1.1); };
  document.getElementById('scaleSmaller').onclick = function(ev){ scale(ev, gl, 0.9); };
  document.getElementById('zReset').onclick = function(ev){ zReset(gl) }
  document.getElementById('yInfiniteRotate').onclick = function(ev){ yRotate(gl, canvas) }
  document.getElementById('scaleAnimate').onclick = function(ev){ scaleAnimate(gl, canvas) }

  canvas.onmousedown = function(ev){ click(ev, gl, canvas); };
  canvas.onmousemove = function(ev){ move(ev, gl, canvas)}
  canvas.onmouseup = function(ev){ released(ev, gl, canvas)}
  window.onkeydown = function(ev){ keydown(ev, canvas) }
  window.onkeyup = function(ev){ keyup(ev) }
  canvas.oncontextmenu = function() {return false;}
}

function scaleAnimate(gl, canvas){
  var before = Date.now()
  var i = 0
  var count = 0
  var tick = function(){
    var now = Date.now()
    if((now - before) >= 100){
      i+=1
      if(i <= 5){
        translate(gl, 0.1, 0)
      }
      else if(i > 5 && i <= 10){
        translate(gl, 0, -0.1)
      }
      else if(i > 10 && i <= 15){
        translate(gl, -0.1, 0)
      }
      else if(i > 15 && i <= 20){
        translate(gl, 0, 0.1)
      }
      else if(i == 21)
        i =0
      before = now
    }
    requestAnimationFrame(tick, canvas)
  }
  tick()
}

function yRotate(gl, canvas){
  var before = Date.now()
  var tick = function(){
    var now = Date.now()
    if((now - before) >= 100){
      atomicRotation(gl, 0)
      before = now
    }
    requestAnimationFrame(tick, canvas)
  }
  tick()
}

function zReset(gl){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');

  zAngle = 0
  zShift = 0

  var modelMatrix = new Matrix4();
  modelMatrix.rotate(yAngle, 0, 1, 0);  // Set rotation matrix
  modelMatrix.rotate(xAngle, 1, 0, 0);  // Set rotation matrix
  modelMatrix.rotate(zAngle, 0, 0, 1);  // Set rotation matrix
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  drawAllCylinders(cylinderPoints, gl)
}

function keydown(ev, canvas){
  if(ev.key === "z")
    zKey = true
  var x1 = ev.clientX; // x coordinate of a mouse pointer
  var y1 = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();
  var x = ((x1 - rect.left) - canvas.width/2)/(canvas.width/2);
  x*=2
  var y = (canvas.height/2 - (y1 - rect.top))/(canvas.height/2);
  y*=2
  lastPoint = [x,y]
}

function keyup(ev){
  if(ev.key == "z")
    zKey = false
  lastPoint = []
}

//1 means positive shift
//-1 means negative shift
function shiftZAxis(gl, choice){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  var increment = 0.1
  zShift += choice * increment
  drawAllCylinders(cylinderPoints, gl)
}

function checkValues(){
  console.log("frontY: " + frontY)
  console.log("frontX: " + frontX)
  console.log("YAngle: " + yAngle)
  console.log("Xangle: " + xAngle)
}

//0 Positive Y rotation
//1 Positive X rotation
//2 Negative Y rotation
//3 Negative X rotation
//4 Positive Z rotation
//5 Negative Z rotation
function atomicRotation(gl, choice){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var increment = 10
  switch(choice){
    case 0: //console.log("Positive y atomic rotation")
            yAngle += increment
            if(yAngle < 0)
              yAngle += 360
            if(yAngle == 360)
              yAngle = 0
            if(yAngle > 90 && yAngle <= 270)
              frontY = false
            else
              frontY = true
            break
    case 1: //console.log("Positive x atomic rotation")
            xAngle += increment
            if(xAngle < 0)
              xAngle += 360
            if(xAngle == 360)
              xAngle = 0
            if(xAngle > 90 && xAngle <= 270)
              frontX = false
            else
              frontX = true
            break;
    case 2: //console.log("Negative y atomic rotation")
            yAngle -= increment
            if(yAngle < 0)
              yAngle += 360
            if(yAngle == 360)
              yAngle = 0
            if(yAngle > 90 && yAngle <= 270)
              frontY = false
            else
              frontY = true
            break
    case 3: //console.log("Negative x atomic rotation")
            xAngle -= increment
            if(xAngle < 0)
              xAngle += 360
            if(xAngle == 360)
              xAngle = 0
            if(xAngle > 90 && xAngle <= 270)
              frontX = false
            else
              frontX = true
            break;
    case 4: zAngle += increment
            break;
    case 5: zAngle -= increment
            break;
  }

  var modelMatrix = new Matrix4();
  modelMatrix.rotate(yAngle, 0, 1, 0);  // Set rotation matrix
  modelMatrix.rotate(xAngle, 1, 0, 0);  // Set rotation matrix
  modelMatrix.rotate(zAngle, 0, 0, 1);  // Set rotation matrix
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  drawAllCylinders(cylinderPoints, gl)
}

function rotateSquare(ev, gl){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  squareDegree += 20

  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var modelMatrix = new Matrix4();
  modelMatrix.setRotate(squareDegree, 0, 1, 0);  // Set rotation matrix
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  var vert = [0,0,0, 0,0.5,0, 0.5,0.5,0, 0.5,0,0]
  console.log(vert)
  var col = [1,0,0, 1,0,0, 1,0,0, 1,0,0]
  var norm = [0,0,1, 0,0,1, 0,0,1, 0,0,1]
  for(i = 0; i+2 < norm.length; i+=3){
    var x = norm[i]
    var y = norm[i+1]
    var z = norm[i+2]
    norm[i] = x*Math.cos(toRadians(squareDegree)) - z*Math.sin(toRadians(squareDegree))
    norm[i+2] = x*Math.sin(toRadians(squareDegree)) + z*Math.cos(toRadians(squareDegree))
  }
  var n = initVertexBuffers2(gl, vert, col, norm)
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

function rotateAxis(ev, gl, axes){

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  switch(axes){
    case 0: console.log("Rotate around x axis")
            xAngle += 20
            if(xAngle == 360)
              xAngle = 0
            if(xAngle > 90 && xAngle <= 270)
              frontX = false
            else
              frontX = true
            break;
    case 1: console.log("Rotate around y axis")
            yAngle += 20
            if(yAngle == 360)
              yAngle = 0
            if(yAngle > 90 && yAngle <= 270)
              frontY = false
            else
              frontY = true
            break
  }
  var modelMatrix = new Matrix4();
  modelMatrix.rotate(yAngle, 0, 1, 0);  // Set rotation matrix
  modelMatrix.rotate(xAngle, 1, 0, 0);  // Set rotation matrix
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  drawAllCylinders(cylinderPoints, gl)
}

function scale(ev, gl, s){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  for(i = 0; i+1 < cylinderPoints.length; i+=2){
    cylinderPoints[i] *= s
    cylinderPoints[i+1] *= s
  }
  radius *= s
  drawAllCylinders(cylinderPoints, gl)
}

function translate(gl, x, y){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  if(!frontY)
    x = -x
  if(!frontX)
    y = -y
  for(i = 0; i+1 < cylinderPoints.length; i+=2){
    cylinderPoints[i] += x
    cylinderPoints[i+1] += y
  }
  drawAllCylinders(cylinderPoints, gl)
}

function inputr(ev, gl){
  var r = parseFloat(ev.target.value)
  ambientlight[0] = r
  var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
  gl.uniform3f(u_AmbientLight, ambientlight[0], ambientlight[1], ambientlight[2]);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  drawAllCylinders(cylinderPoints, gl)
}

function inputg(ev, gl){
  var g = parseFloat(ev.target.value)
  ambientlight[1] = g
  var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
  gl.uniform3f(u_AmbientLight, ambientlight[0], ambientlight[1], ambientlight[2]);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  drawAllCylinders(cylinderPoints, gl)
}

function inputb(ev, gl){
  var b = parseFloat(ev.target.value)
  ambientlight[2] = b
  var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
  gl.uniform3f(u_AmbientLight, ambientlight[0], ambientlight[1], ambientlight[2]);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  drawAllCylinders(cylinderPoints, gl)
}

function toggleProjection(canvas, gl){
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');

  var viewMatrix = new Matrix4();　// The view matrix
  var projMatrix = new Matrix4();  // The projection matrix

  // calculate the view matrix and projection matrix
  viewMatrix.setLookAt(0, 0, 5, 0, 0, -100, 0, 1, 0);
  if(projection){
      projMatrix.setPerspective(40, canvas.width/canvas.height, 1, 100);
      projection = false
  } else {
      projMatrix.setOrtho(-2, 2, -2, 2, 3, 100)
      projection = true
  }

  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  drawAllCylinders(cylinderPoints, gl)
}

function drawAllCylinders(arr, gl){
  var point1 = []
  var point2 = []
  point1 = [arr[0], arr[1]]
  point2 = [arr[2], arr[3]]
  drawCylinder(point1, point2, gl, numSides, radius, 0)
  var i = 0
  for(i = 4; i+1 < arr.length; i+=2){
    point1 = point2
    point2 = [arr[i], arr[i+1]]
    drawCylinder(point1, point2, gl, numSides, radius, 0)
  }
}

function released(ev, gl, canvas){
  if(enteredDrag){
    enteredDrag = false
    picked = false
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawAllCylinders(cylinderPoints, gl)
    lastPoint = []
  } else if(enteredDrag2){
    enteredDrag2 = false
    picked = false
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawAllCylinders(cylinderPoints, gl)
    lastPoint = []
  }
}

function click(ev, gl, canvas){
  var x1 = ev.clientX; // x coordinate of a mouse pointer
  var y1 = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();
  var x = ((x1 - rect.left) - canvas.width/2)/(canvas.width/2);
  x*=2
  var y = (canvas.height/2 - (y1 - rect.top))/(canvas.height/2);
  y*=2
  if(open){
    cylinderPoints.push(x)
    cylinderPoints.push(y)
    var vertices = []
    var i = 0
    for(i = 0; i+1 < cylinderPoints.length; i+=2){
      vertices.push(cylinderPoints[i])
      vertices.push(cylinderPoints[i+1])
      vertices.push(1)
    }
    drawLine(vertices, gl)
    if(ev.button == 2){
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      drawAllCylinders(cylinderPoints, gl)
      open = false
    }
  } else {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);     // Clear buffers
    if(rect.left <= x1 && x1 < rect.right && rect.top <= y1 && y1 < rect.bottom) {
      var x_in_canvas = x1 - rect.left, y_in_canvas = rect.bottom - y1
      var pixels = new Uint8Array(4);
      drawAllCylinders(cylinderPoints, gl)
      gl.readPixels(x_in_canvas, y_in_canvas, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      if(!((pixels[0] + pixels[1] + pixels[2]) <= 0)){
        if(ev.button == 0){
          enteredDrag = true
          picked = true
          lastPoint = [x, y]
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          drawAllCylinders(cylinderPoints, gl)
        } else if (ev.button == 2){
          enteredDrag2 = true
          picked = true
          lastPoint = [x, y]
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          drawAllCylinders(cylinderPoints, gl)
        }
      } else {
        picked = false
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        drawAllCylinders(cylinderPoints, gl)
      }
      console.log(pixels)
    }
  }
}

function move(ev, gl, canvas){
  if(enteredDrag){
    var x1 = ev.clientX; // x coordinate of a mouse pointer
    var y1 = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();
    var x = ((x1 - rect.left) - canvas.width/2)/(canvas.width/2);
    x*=2
    var y = (canvas.height/2 - (y1 - rect.top))/(canvas.height/2);
    y*=2
    var xShift = x-lastPoint[0]
    var yShift = y-lastPoint[1]
    translate(gl, xShift, yShift)
    lastPoint = [x,y]
  } else if(enteredDrag2){
    var x1 = ev.clientX; // x coordinate of a mouse pointer
    var y1 = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();
    var x = ((x1 - rect.left) - canvas.width/2)/(canvas.width/2);
    x*=2
    var y = (canvas.height/2 - (y1 - rect.top))/(canvas.height/2);
    y*=2
    var xShift = x-lastPoint[0]
    var yShift = y-lastPoint[1]
    if(yShift > 0){
        if(frontY)
          atomicRotation(gl, 3)
        else
          atomicRotation(gl, 1)
    }
    else if(yShift < 0){
        if(frontY)
          atomicRotation(gl, 1)
        else
          atomicRotation(gl, 3)
    }
    if(xShift > 0)
      atomicRotation(gl, 0)
    else if(xShift < 0)
      atomicRotation(gl, 2)
    lastPoint = [x,y]
  } else if(zKey){
    var x1 = ev.clientX; // x coordinate of a mouse pointer
    var y1 = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();
    var x = ((x1 - rect.left) - canvas.width/2)/(canvas.width/2);
    x*=2
    var y = (canvas.height/2 - (y1 - rect.top))/(canvas.height/2);
    y*=2
    var xShift = x-lastPoint[0]
    var yShift = y-lastPoint[1]
    if(xShift > 0)
      atomicRotation(gl, 4)
    else if(xShift < 0)
      atomicRotation(gl, 5)
    if(yShift > 0)
      shiftZAxis(gl, 1)
    else if(yShift < 0)
      shiftZAxis(gl, -1)
    lastPoint = [x,y]
  }
}

function click2(ev, gl) {
  var x = ev.clientX, y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();
  if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
    var x_in_canvas = x - rect.left, y_in_canvas = rect.bottom - y;
    var pixels = new Uint8Array(4);
    test2(gl)
    gl.readPixels(x_in_canvas, y_in_canvas, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    console.log(pixels);
  }
}

function test(gl){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);     // Clear buffers
  var point1 = [0,0]
  var point2 = [0.5,0]
  drawCylinder(point1, point2, gl, numSides, radius, 0)
}

function test2(gl){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  cylinderPoints = [0,0,0.5,0,0.5,0.5,-1.0,1.0]
  drawAllCylinders(cylinderPoints, gl)
}

function initVertexBuffers(gl, vert) {
  var vertices = new Float32Array(vert);

  var col = []
  var norm = []
  var ind = []
  var i = 0
  for(i = 0; i < vert.length/3; i++){
    col.push(1)
    col.push(1)
    col.push(1)
    norm.push(-7.0)
    norm.push(-7.0)
    norm.push(-7.0)
    ind.push(i)
  }

  var colors = new Float32Array(col);
  var normals = new Float32Array(norm);
  var indices = new Uint8Array(ind)

  if (!initArrayBuffer(gl, 'a_Position', vertices, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3)) return -1;

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initVertexBuffers2(gl, vert, col, norm) {
  var vertices = new Float32Array(vert);
  var ind = [0,1,3,3,1,2]

  var colors = new Float32Array(col);
  var normals = new Float32Array(norm);
  var indices = new Uint8Array(ind)

  if (!initArrayBuffer(gl, 'a_Position', vertices, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3)) return -1;

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function drawLine(vert, gl){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  var n = initVertexBuffers(gl, vert)
  gl.drawElements(gl.LINE_STRIP, n, gl.UNSIGNED_BYTE, 0);
}

function shiftLight(canvas, gl, disp, shift){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
  light2[0] += disp*0.4
  cylinderShift += shift
  var lightDirection = new Vector3(light2);
  lightDirection.normalize();     // Normalize
  gl.uniform3fv(u_LightDirection, lightDirection.elements);
  var i = 0
  for(i = 0; i+1 < cylinderPoints.length; i+=2){
    cylinderPoints[i] += shift
  }
  drawAllCylinders(cylinderPoints, gl)
}

function drawSquares(vertices, colors, normals, gl){
  if (!initArrayBuffer(gl, 'a_Position', new Float32Array(vertices), 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', new Float32Array(colors), 4)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', new Float32Array(normals), 3)) return -1;
  var indices = new Uint8Array([
    0,1,2,
    3,0,2
  ])
  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);
}

function initArrayBuffer(gl, attribute, data, num) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, gl.FLOAT, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}

function drawCylinder(point1, point2, gl, numSides, radius, index){
  var centerCylinder = [(point1[0]+point2[0])/2, (point1[1]+point2[1])/2]
  var arr = getCirclePoint(point1, numSides, radius)
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
  connectSquares(arr, arr2, point1, point2, gl, centerCylinder)
}

function connectSquares(arr, arr2, point1, point2, gl, centerCylinder){
  var points = []
  var points2 = []
  var a = 0

  for(a = 0; a+2 < arr.length; a+=3){
      var point = []
      var point2 = []
      var b = a
      for(b = a; b <= a+2; b++){
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
  drawSquare(squares2[19], centerCylinder, 0, point1, point2, gl)
  drawSquare(squares2[18], centerCylinder, 0, point1, point2, gl)
  drawSquare(squares2[17], centerCylinder, 0, point1, point2, gl)
  drawSquare(squares2[16], centerCylinder, 0, point1, point2, gl)
  drawSquare(squares2[15], centerCylinder, 0, point1, point2, gl)
  drawSquare(squares2[14], centerCylinder, 0, point1, point2, gl)
  drawSquare(squares2[13], centerCylinder, 0, point1, point2, gl)
  drawSquare(squares2[12], centerCylinder, 0, point1, point2, gl)
  drawSquare(squares2[11], centerCylinder, 0, point1, point2, gl)
  drawSquare(squares2[10], centerCylinder, 0, point1, point2, gl)
  drawSquare(squares2[9], centerCylinder, 0, point1, point2, gl)
  drawSquare(squares2[8], centerCylinder, 0, point1, point2, gl)
  drawSquare(squares2[7], centerCylinder, 0, point1, point2, gl)
  drawSquare(squares2[6], centerCylinder, 0, point1, point2, gl)
  drawSquare(squares2[5], centerCylinder, 0, point1, point2, gl)
  drawSquare(squares2[4], centerCylinder, 0, point1, point2, gl)
  drawSquare(squares2[3], centerCylinder, 0, point1, point2, gl)
  drawSquare(squares2[2], centerCylinder, 0, point1, point2, gl)
  drawSquare(squares2[1], centerCylinder, 0, point1, point2, gl)
  drawSquare(squares2[0], centerCylinder, 0, point1, point2, gl)
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

function drawSquare(vertices, centerCylinder, index, point1, point2, gl){
  var colors = []
  var normals = []

  var arr = []
  var coordinate = []
  var i = 0
  for(i = 0; i+2 < vertices.length; i+=3) {
    var point = []
    var x = vertices[i]
    var y = vertices[i+1]
    var z = vertices[i+2]
    //vertices[i] = x*Math.cos(toRadians(yDegree)) - z*Math.sin(toRadians(yDegree))
    //vertices[i+2] = x*Math.sin(toRadians(yDegree)) + z*Math.cos(toRadians(yDegree))
    vertices[i+2] += zShift
    point.push(vertices[i]) //x
    point.push(vertices[i+1]) //y
    point.push(vertices[i+2]) //z
    coordinate.push(point)
  }




  var vec1 = [coordinate[0][0]-point1[0], coordinate[0][1]-point1[1],coordinate[0][2]]
  var vec2 = [coordinate[1][0]-point2[0], coordinate[1][1]-point2[1],coordinate[1][2]]
  var vec3 = [coordinate[2][0]-point2[0], coordinate[2][1]-point2[1],coordinate[2][2]]
  var vec4 = [coordinate[3][0]-point1[0], coordinate[3][1]-point1[1],coordinate[3][2]]
  var normalArr2 = [vec1, vec2, vec3, vec4]
  var normalArray = [normalize(vec1), normalize(vec2), normalize(vec3), normalize(vec4)]

  var center = []
  center.push((coordinate[0][0] + coordinate[3][0])/2)
  center.push((coordinate[0][1] + coordinate[3][1])/2)
  center.push((coordinate[0][2] + coordinate[3][2])/2)

  var centerOpposite = []
  centerOpposite.push((coordinate[1][0] + coordinate[2][0])/2)
  centerOpposite.push((coordinate[1][1] + coordinate[2][1])/2)
  centerOpposite.push((coordinate[1][2] + coordinate[2][2])/2)

  var vectorLine = [centerOpposite[0] - center[0], centerOpposite[1] - center[1], centerOpposite[2] - center[2]]

  var n = findNormal(coordinate[0], coordinate[1], coordinate[2])
  var vectorCenter = [centerCylinder[0]-center[0], centerCylinder[1]-center[1], 0-center[2]]
  var dotprod = n[0]*vectorCenter[0] + n[1]*vectorCenter[1] + n[2]*vectorCenter[2]
  if(dotprod >= 0)
   n = [-n[0], -n[1], -n[2]]

  var col = shading(n)
  for(i = 0; i < 4; i++){
    colors.push(1)
    colors.push(0)
    colors.push(0)
    if(picked)
      colors.push(0.8)
    else
      colors.push(1)
  }

  var i = 0;
  for(i = 0; i < normalArray.length; i++){
    normals.push(normalArray[i][0])
    normals.push(normalArray[i][1])
    normals.push(normalArray[i][2])
  }

  for(i = 0; i+2 < normals.length; i+=3){
    var x = normals[i]
    var y = normals[i+1]
    var z = normals[i+2]
    normals[i] = x*Math.cos(toRadians(yAngle)) - z*Math.sin(toRadians(yAngle))
    normals[i+2] = x*Math.sin(toRadians(yAngle)) + z*Math.cos(toRadians(yAngle))

    x = normals[i]
    y = normals[i+1]
    z = normals[i+2]
    normals[i+1] = y*Math.cos(toRadians(xAngle)) - z*Math.sin(toRadians(xAngle))
    normals[i+2] = y*Math.sin(toRadians(xAngle)) + z*Math.cos(toRadians(xAngle))

    x = normals[i]
    y = normals[i+1]
    z = normals[i+2]
    normals[i] = x*Math.cos(toRadians(zAngle)) - y*Math.sin(toRadians(zAngle))
    normals[i+1] = x*Math.sin(toRadians(zAngle)) + y*Math.cos(toRadians(zAngle))
  }

  var vert = []
  vert.push(point1[0])
  vert.push(point1[1])
  vert.push(0)
  vert.push(coordinate[0][0])
  vert.push(coordinate[0][1])
  vert.push(coordinate[0][2])
  /*for(i = 0; i < 4; i++){
    colors.push(col[0])
    colors.push(col[1])
    colors.push(col[2])
    colors.push(col[3])
  }*/

  if (!initArrayBuffer(gl, 'a_Position', new Float32Array(vertices), 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', new Float32Array(colors), 4)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', new Float32Array(normals), 3)) return -1;
  var indices = new Uint8Array([
    0,1,2,
    3,0,2
  ])

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);
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

function rotatePoint(arr, deg, point){
  deg = -deg
  if(point.length != 2)
    return
  var a = point[0]
  var b = point[1]
  var rArr = []
  if(arr.length%numSides != 0)
    return
  var i = 0

  for(i = 0; i+2 < arr.length; i+=3){
    var x = arr[i]
    var y = arr[i+1]
    rArr.push((x-a)*Math.cos(toRadians(deg)) - (y-b)*Math.sin(toRadians(deg))+a)
    rArr.push((x-a)*Math.sin(toRadians(deg)) + (y-b)*Math.cos(toRadians(deg))+b)
    rArr.push(arr[i+2])
  }
  return rArr
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

function toRadians (angle) {
  return angle * (Math.PI / 180);
}

function toDegrees (angle) {
  return angle * (180 / Math.PI)
}
