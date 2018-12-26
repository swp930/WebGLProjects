// HelloTriangle_LINE_STRIP.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '}\n';

var red = '(1.0, 0.0, 0.0, 1.0)'
var green = '(0.0, 1.0, 0.0, 1.0)'
var blue = '(0.0, 0.0, 1.0, 1.0)'
var colors = [red, green, blue]
var colorIndex = 0
// Fragment shader program
var FSHADER_SOURCE =
  'void main() {\n' +
  '  gl_FragColor = vec4'+green+';\n' +
  '}\n';

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');
  var lineButton = document.getElementById('lineButton');
  var colorButton = document.getElementById('colorButton');
  var shiftButton = document.getElementById('shiftButton');
  var input = document.getElementById('input');
  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }



  // Specify the color for clearing <canvas>
  gl.clearColor(0, 0, 0, 1);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
  //arr = arr1
  var i =0;
  drawArray(arr, gl, arr.length/2)
  drawTotalArrays(gl)

  canvas.onmousedown = function(ev){ click(ev, gl, canvas); };
  canvas.onmousemove = function(ev) { move(ev, gl, canvas); };
  canvas.oncontextmenu = function() {return false;}
  lineButton.onmousedown = function(ev) { lineButtonClick(ev, gl) }
  colorButton.onmousedown = function(ev) { changeColors(gl)}
  shiftButton.onmousedown = function(ev) { shiftPositions(gl) }
  input.oninput = function(ev) { inputChange(ev) }
}

var arr = []
var arr1 = [0.3,0.3, 0.5,0.5]
var arr2 = [0.51,-0.51, 0.015,-0.275, 0.4,0.15, -0.32,0.275, -0.565,-0.225, -0.63,0.585, -0.45,0.78, -0.45,0.78]
var totalArr = []
var n = 8
var rclick = 0
var arrOpen = false
var first = false
var inputVal = 0

function inputChange(ev) {
  inputVal = parseInt(ev.target.value)
}

function lineButtonClick(ev, gl) {
  if(totalArr.length == 0){
    alert("Please draw a line first")
    return
  }

  if(inputVal-1>=0 && inputVal-1 < totalArr.length)
    totalArr.splice(inputVal-1, 1)
  else{
    alert("Please enter a value in the range [1," + totalArr.length + "]")
  }

  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  drawTotalArrays(gl)
}

function click(ev, gl, canvas) {
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect()
  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  if(ev.button == 0){
      if(!arrOpen)
        arrOpen = !arrOpen
      console.log("x: "+x+" y: "+y+" left click")
      first = true
      arr.push(x)
      arr.push(y)
      n++
      drawArray(arr, gl, arr.length/2)
      drawTotalArrays(gl)
  }
  else if(ev.button ==2){
    if(!arrOpen){
        drawArray(arr, gl, arr.length/2)
        drawTotalArrays(gl)
        return
    }
    else {
        console.log("x: "+x+" y: "+y+" right click")
        console.log("You have finished drawing")
        var i = 0
        var word = ""
        for(i = 0; i < arr.length-1; i+=2)
          word += "(" + arr[i] + "," + arr[i+1] + ") "
        console.log("Your Polyline: "+word)
        if(arr.length > 0){
          totalArr.push(arr)
          arr = []
        }
        drawTotalArrays(gl)
    }
    arrOpen = !arrOpen
  }
}

function move(ev, gl, canvas) {
  if(!arrOpen)
    return
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect()
  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  if(arr.length >= 2){
    if(!first)
      arr.splice(arr.length-2)
    else
      first = false
    arr.push(x)
    arr.push(y)
    var num = arr.length/2
    initVertexBuffers(gl, arr)
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if(!first){
      gl.drawArrays(gl.LINE_STRIP, 0, num);
      gl.drawArrays(gl.POINTS, 0, num-1);
    }
    drawTotalArrays(gl)
  }
}

function drawArray(dArr, gl, end){
  initVertexBuffers(gl, dArr)
  gl.drawArrays(gl.LINE_STRIP, 0, end)
  gl.drawArrays(gl.POINTS, 0, end)
}

function drawTotalArrays(gl){
  for(i = 0; i < totalArr.length; i++)
      drawArray(totalArr[i], gl, totalArr[i].length/2)
}

function changeColors(gl){
  var color = colors[colorIndex]
  if(colorIndex == 2)
    colorIndex = 0
  else
    colorIndex++
  FSHADER_SOURCE =
  'void main() {\n' +
  '  gl_FragColor = vec4'+color+';\n' +
  '}\n';
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  drawTotalArrays(gl)
}

function shiftPositions(gl){
  var i = 0
  var j = 0
  for(i = 0; i < totalArr.length; i++){
    var shiftArray = totalArr[i]
    for(j = 0; j < shiftArray.length; j++){
      if(j % 2 == 0)
        shiftArray[j] += 0.1
    }
  }
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  drawTotalArrays(gl)
}

function initVertexBuffers(gl, dArr) {
   // The number of vertices

  var vertices = new Float32Array(
    dArr
  )
  //x = 357, 0.785 y = 269, 0.345

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  return n;
}
