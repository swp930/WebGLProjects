// Specular.js 2013 (c) matsuda
// Vertex shader program
var VSHADER_SOURCE = null

// Fragment shader program
var FSHADER_SOURCE = null

// Gloval variables
var g_perspectiveMatrix = new Matrix4();
var g_modelMatrix = new Matrix4();
var g_viewMatrix = new Matrix4();

var g_vertexPositionBuffer;
var g_vertexNormalBuffer;
var g_vertexIndexBuffer;

var xShift = 0;
var yShift = 0;
var zShift = 0;
var lightShift = 0
var yVal = 0;
var fovy = 70;
var angle2 = 0
var zangle = 0
var stretchVal = 0

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
  gl.enable(gl.DEPTH_TEST);

  gl.clearColor(0, 0, 0, 1);
  sendCubeVertexBuffers(gl);

  document.getElementById('shiftRight').onclick = function(ev){ shiftRight(gl, canvas) }
  document.getElementById('shiftLeft').onclick = function(ev){ shiftLeft(gl, canvas) }
  document.getElementById('shiftUp').onclick = function(ev) { shiftUp(gl, canvas) }
  document.getElementById('shiftDown').onclick = function(ev) { shiftDown(gl, canvas) }
  document.getElementById('shiftForward').onclick = function(ev) { shiftForward(gl, canvas) }
  document.getElementById('shiftBackward').onclick = function(ev) { shiftBackward(gl, canvas) }
  document.getElementById('zoomIn').onclick = function(ev) { zoomIn(gl, canvas) }
  document.getElementById('zoomOut').onclick = function(ev) { zoomOut(gl, canvas) }
  document.getElementById('rotateLeft').onclick = function(ev) { rotateLeft(gl, canvas) }
  document.getElementById('rotateRight').onclick = function(ev) { rotateRight(gl, canvas) }
  document.getElementById('rotateZPos').onclick = function(ev) { rotateZNeg(gl, canvas) }
  document.getElementById('rotateZNeg').onclick = function(ev) { rotateZPos(gl, canvas) }
  document.getElementById('stretch').onclick = function(ev) { stretch(gl, canvas) }
  document.getElementById('animateAroundZ').onclick = function(ev) { animateAroundZ(gl, canvas) }
  document.getElementById('shiftLightLeft').onclick = function(ev) { shiftLightLeft(gl, canvas) }
  document.getElementById('shiftLightRight').onclick = function(ev) { shiftLightRight(gl, canvas) }
  document.getElementById('shake').onclick = function(ev) { shake(gl, canvas) }
  constructCube(gl, canvas);
}

function shake(gl, canvas){
  var i = 0
  var before = Date.now()
  var tick = function(){
    var now = Date.now()
    if((now - before) >= 40){
      if(i % 4 == 0)
        xShift = .1
      else if((i-1) % 4 == 0)
        yShift = .1
      else if((i-2) % 4 == 0)
        xShift = -.1
      else
        yShift = -.1
      constructCube(gl,canvas)
      i+=1
      before = now
    }
    requestAnimationFrame(tick, canvas)
  }
  tick()
}

function shiftLightLeft(gl, canvas){
  lightShift -= 0.2
  constructCube(gl, canvas)
}

function shiftLightRight(gl, canvas){
  lightShift += 0.2
  constructCube(gl, canvas)
}

function animateAroundZ(gl, canvas){
  var before = Date.now()
  var tick = function(){
    var now = Date.now()
    if((now - before) >= 100){
      before = now
      angle2+=5
      if(angle2 == 360)
        angle2 = 0
      constructCube(gl,canvas)
    }
    requestAnimationFrame(tick, canvas)
  }
  tick()
}

function stretch(gl, canvas){
  stretchVal += 20;
  constructCube(gl,canvas)
}

function rotateZNeg(gl, canvas){
  zangle -= 15
  if(zangle < 0)
    zangle += 360
  constructCube(gl,canvas)
}

function rotateZPos(gl, canvas){
  zangle += 15
  if(zangle == 360)
    zangle = 0
  constructCube(gl, canvas)
}

function rotateLeft(gl, canvas){
  yVal -= 0.2
  constructCube(gl, canvas)
}

function rotateRight(gl, canvas){
  yVal += 0.2
  constructCube(gl, canvas)
}

function zoomIn(gl, canvas){
  fovy -= 5
  constructCube(gl, canvas)
}

function zoomOut(gl, canvas){
  fovy += 5
  constructCube(gl, canvas)
}

function shiftForward(gl, canvas){
  zShift -= 0.4
  constructCube(gl, canvas)
}

function shiftBackward(gl, canvas){
  zShift += 0.4
  constructCube(gl, canvas)
}

function shiftUp(gl, canvas){
  yShift += 0.4
  constructCube(gl, canvas)
}

function shiftDown(gl, canvas){
  yShift -= 0.4
  constructCube(gl, canvas)
}

function shiftLeft(gl, canvas){
  xShift -= 0.4
  constructCube(gl, canvas)
}

function shiftRight(gl, canvas){
  xShift += 0.4
  constructCube(gl, canvas)
}

function constructCube(gl, canvas){
  var angle = 0
  drawCommon(gl, canvas, angle);
  drawCube(gl, canvas, angle);
}

function toRadians (angle) {
  return angle * (Math.PI / 180);
}

function drawCommon(gl, canvas, angle) {

  var perspectiveMatrixShaderLocation = gl.getUniformLocation(gl.program, 'u_perspectiveMatrix');
  var viewMatrixShaderLocation = gl.getUniformLocation(gl.program, 'u_viewMatrix');
  var lightPositionShaderLocation = gl.getUniformLocation(gl.program, 'u_lightPosition');
  var f_viewMatrixShaderLocation = gl.getUniformLocation(gl.program, 'u_fViewMatrix');
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);    // Clear canvas
  g_perspectiveMatrix.setPerspective(fovy, (canvas.width+stretchVal)/canvas.height, 1, 10000);
  var x = 0
  var y = 1
  var z = 0
  x = x*Math.cos(toRadians(zangle)) - y*Math.sin(toRadians(zangle))
  y = x*Math.sin(toRadians(zangle)) + y*Math.cos(toRadians(zangle))

  var xpos = 0 + xShift
  var ypos = 0 + yShift
  var zpos = 5 + zShift
  var xfpos = 0 + xShift + yVal
  var yfpos = 0 + yShift
  var zfpos = 0 + zShift
  xpos = xpos*Math.cos(toRadians(angle2)) - zpos*Math.sin(toRadians(angle2))
  zpos = xpos*Math.sin(toRadians(angle2)) + zpos*Math.cos(toRadians(angle2))
  g_viewMatrix.setLookAt(xpos, ypos, zpos,   xfpos, yfpos, zfpos,    x, y, 0);   // eyePos - focusPos - upVector
  //g_viewMatrix.setLookAt(0, 2, 5,   0, 0, 0,    0, 1, 0);   // eyePos - focusPos - upVector
  //g_viewMatrix.setLookAt(0, 0, 5,   yVal, 0, 0,    0, 1, 0);   // eyePos - focusPos - upVector

  gl.uniformMatrix4fv(perspectiveMatrixShaderLocation, false, g_perspectiveMatrix.elements);
  gl.uniformMatrix4fv(viewMatrixShaderLocation, false, g_viewMatrix.elements);

  gl.uniformMatrix4fv(f_viewMatrixShaderLocation, false, g_viewMatrix.elements);

  //var lightPosition = new Float32Array([2.0, 0.0, 2.0]);
  var lightPosition = new Float32Array([0.0+lightShift, 0.0, 2.0]);
  gl.uniform3fv(lightPositionShaderLocation, lightPosition);
}

function drawCube(gl, canvas, angle) {

  var perspectiveMatrixShaderLocation = gl.getUniformLocation(gl.program, 'u_perspectiveMatrix');
  var modelMatrixShaderLocation = gl.getUniformLocation(gl.program, 'u_modelMatrix');
  var lightPositionShaderLocation = gl.getUniformLocation(gl.program, 'u_lightPosition');
  gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexPositionBuffer);
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexNormalBuffer);
  var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g_vertexIndexBuffer);

  g_modelMatrix.setTranslate(0, 0, 0);
  g_modelMatrix.rotate(angle, 1, 0, 0);
  g_modelMatrix.scale(1.0, 1.0, 1.0);

  gl.uniformMatrix4fv(modelMatrixShaderLocation, false, g_modelMatrix.elements);
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0);
}

function sendCubeVertexBuffers(gl) {
  var cubeVertices = new Float32Array([
     1, 1, 1,  -1, 1, 1,  -1,-1, 1,   1,-1, 1,  // v0-v1-v2-v3 front
     1, 1, 1,   1,-1, 1,   1,-1,-1,   1, 1,-1,  // v0-v3-v4-v5 right
     1, 1, 1,   1, 1,-1,  -1, 1,-1,  -1, 1, 1,  // v0-v5-v6-v1 top
    -1, 1, 1,  -1, 1,-1,  -1,-1,-1,  -1,-1, 1,  // v1-v6-v7-v2 left
    -1,-1,-1,   1,-1,-1,   1,-1, 1,  -1,-1, 1,  // v7-v4-v3-v2 bottom
     1,-1,-1,  -1,-1,-1,  -1, 1,-1,   1, 1,-1   // v4-v7-v6-v5 back
  ]);

  var cubeNormals = new Float32Array([
    0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,     // v0-v1-v2-v3 front
    1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,     // v0-v3-v4-v5 right
    0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,     // v0-v5-v6-v1 top
   -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,     // v1-v6-v7-v2 left
    0,-1, 0,   0,-1, 0,   0,-1, 0,   0,-1, 0,     // v7-v4-v3-v2 bottom
    0, 0,-1,   0, 0,-1,   0, 0,-1,   0, 0,-1      // v4-v7-v6-v5 back
	]);

  var indices = new Uint8Array([
     0,  1,  2,   0,  2,  3,    // front
     4,  5,  6,   4,  6,  7,    // right
     8,  9, 10,   8, 10, 11,    // top
    12, 13, 14,  12, 14, 15,    // left
    16, 17, 18,  16, 18, 19,    // bottom
    20, 21, 22,  20, 22, 23     // back
  ]);

  g_vertexPositionBuffer = gl.createBuffer();
  g_vertexNormalBuffer = gl.createBuffer();
  g_vertexIndexBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeNormals, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g_vertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return true;
}
