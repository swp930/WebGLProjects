
v_shaders = {}
f_shaders = {}
var verticesTriangle = [-0.6, 0.7, 0,
                       -0.6, 1.6, 0,
                       -0.1, 1.6, 0,
                       -0.1, 0.7, 0,
                       -0.1, 0.7, 0,
                       -0.1, 1.6, 0,
                        0.4, 1.6, 0,
                        0.4, 0.7, 0]
var indicesTriangle = [0, 1, 2, 2, 0, 3,
                       4, 5, 6, 6, 4, 7]
var uvsTriangle = [0,1.0,0,
                   0,0,0,
                   1.0,0.0,0,
                   1.0,1.0,0,
                   0,1.0,0,
                   0,0,0,
                   1.0,0.0,0,
                   1.0,1.0,0]
var currSquare = []
var currLen = 0
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

    v_shaders["cube"] = "";
    f_shaders["cube"] = "";
    v_shaders["sphere"] = "";
    f_shaders["sphere"] = "";
    v_shaders["pyramid"] = "";
    f_shaders["pyramid"] = "";

    // load shader files (calls 'setShader' when done loading)
    loadFile("shaders/cube_shader.vert", function(shader_src) {
        setShader(gl, canvas, "cube", gl.VERTEX_SHADER, shader_src);
    });

    loadFile("shaders/cube_shader.frag", function(shader_src) {
        setShader(gl, canvas, "cube", gl.FRAGMENT_SHADER, shader_src);
    });

    loadFile("shaders/cube2_shader.vert", function(shader_src) {
        setShader(gl, canvas, "cube2", gl.VERTEX_SHADER, shader_src);
    });

    loadFile("shaders/cube2_shader.frag", function(shader_src) {
        setShader(gl, canvas, "cube2", gl.FRAGMENT_SHADER, shader_src);
    });

    // load shader files (calls 'setShader' when done loading)
    loadFile("shaders/sphere_shader.vert", function(shader_src) {
        setShader(gl, canvas, "sphere", gl.VERTEX_SHADER, shader_src);
    });

    loadFile("shaders/sphere_shader.frag", function(shader_src) {
        setShader(gl, canvas, "sphere", gl.FRAGMENT_SHADER, shader_src);
    });

    // load shader files (calls 'setShader' when done loading)
    loadFile("shaders/triang_shader.vert", function(shader_src) {
        setShader(gl, canvas, "triang", gl.VERTEX_SHADER, shader_src);
    });

    loadFile("shaders/triang_shader.frag", function(shader_src) {
        setShader(gl, canvas, "triang", gl.FRAGMENT_SHADER, shader_src);
    });

    // load shader files (calls 'setShader' when done loading)
    loadFile("shaders/triang2_shader.vert", function(shader_src) {
        setShader(gl, canvas, "pyramid", gl.VERTEX_SHADER, shader_src);
    });

    loadFile("shaders/triang2_shader.frag", function(shader_src) {
        setShader(gl, canvas, "pyramid", gl.FRAGMENT_SHADER, shader_src);
    });
}

// set appropriate shader and start if both are loaded
function setShader(gl, canvas, name, shader, shader_src) {
    if (shader == gl.VERTEX_SHADER)
       v_shaders[name] = shader_src;

    if (shader == gl.FRAGMENT_SHADER)
	   f_shaders[name] = shader_src;

    vShadersLoaded = 0;
    for (var shader in v_shaders) {
       if (v_shaders.hasOwnProperty(shader) && v_shaders[shader] != "") {
           vShadersLoaded += 1;
       }
    }

    fShadersLoaded = 0;
    for (var shader in f_shaders) {
        if (f_shaders.hasOwnProperty(shader) && f_shaders[shader] != "") {
            fShadersLoaded += 1;
        }
    }

    if(vShadersLoaded == Object.keys(v_shaders).length &&
       fShadersLoaded == Object.keys(f_shaders).length) {
        start(gl, canvas);
    }
}

function start(gl, canvas) {

    // Create camera
    var camera = new PerspectiveCamera(60, 1, 1, 100);
    //camera.move(1.4,0,0,1);
    //camera.move(3.0,1,0,0);
    //camera.rotate(10,0,1,0);

    camera.move(5.0,0,0,1);
    camera.move(0,1,0,0);
    camera.rotate(0,0,1,0);
    console.log(camera.position.elements);

    // Create scene
    var scene = new Scene(gl, camera);

    // Create a cube
    var cube = new CubeGeometry(12);
    cube.setVertexShader(v_shaders["cube"]);
    cube.setFragmentShader(f_shaders["cube"]);
    cube.setRotation(new Vector3([1,0,0]));
    cube.setPosition(new Vector3([0,0.0,0.0]));
    cube.setScale(new Vector3([0.75,0.75,0.75]));
    scene.addGeometry(cube);

    var triang = new Geometry();
    triang.vertices = verticesTriangle
    triang.indices = indicesTriangle
    var uvs = uvsTriangle
    var i = 0
    triang.addAttribute("a_uv", uvs);


    triang.setVertexShader(v_shaders["triang"]);
    triang.setFragmentShader(f_shaders["triang"]);
    scene.addGeometry(triang);

    var triang2 = new Geometry();
    triang2.vertices = [1.2, 0.1-1.0, 0.0,
                        1.2, 0.1-1.0, 1.0,
                        2.2, 0.1-1.0, 1.0,
                        2.2, 0.1-1.0, 0.0, //Face 1
                        1.2, 0.1-1.0, 0.0,
                        1.7, 1.0-1.0, 0.5,
                        2.2, 0.1-1.0, 0.0, //Face 2
                        1.2, 0.1-1.0, 1.0,
                        1.7, 1.0-1.0, 0.5,
                        1.2, 0.1-1.0, 0.0, //Face 3
                        1.2, 0.1-1.0, 1.0,
                        1.7, 1.0-1.0, 0.5,
                        2.2, 0.1-1.0, 1.0, //Face 4
                        2.2, 0.1-1.0, 1.0,
                        1.7, 1.0-1.0, 0.5,
                        2.2, 0.1-1.0, 0.0  //Face 5
                        ]
    triang2.indices = [0, 1, 2, 2, 0, 3, //Face 1
                       4,5,6,            //Face 2
                       7,8,9,            //Face 3
                       10,11,12,         //Face 4
                       13,14,15          //Face 5
                       ]

    var normals = [
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0, //Face 1
       0.0,  0.5, -0.9,
       0.0,  0.5, -0.9,
       0.0,  0.5, -0.9, //Face 2
      -0.9,  0.5,  0.0,
      -0.9,  0.5,  0.0,
      -0.9,  0.5,  0.0, //Face 3
       0.0,  0.5,  0.9,
       0.0,  0.5,  0.9,
       0.0,  0.5,  0.9, //Face 4
       0.9,  0.5,  0.0,
       0.9,  0.5,  0.0,
       0.9,  0.5,  0.0  //Face 5
    ]
    //triang2.addAttribute("a_Normal", normals);
    var uvs = [0,0,0,
               0,0,0,
               0,0,0,
               0,0,0,
               0,0,0,
               0,0,0,
               0,0,0,
               0,0,0,
               0,0,0,
               0,0,0,
               0,0,0,
               0,0,0,
               0,0,0,
               0,0,0,
               0,0,0,
               0,0,0
              ]
    var i = 0
    triang2.addAttribute("a_uv", uvs);
    triang2.addAttribute("a_Normal", normals);
    triang2.addUniform("u_EyePosition", "v3", camera.position.elements);

    triang2.setVertexShader(v_shaders["pyramid"]);
    triang2.setFragmentShader(f_shaders["pyramid"]);
    scene.addGeometry(triang2);

    // Create a Sphere
    var sphere = new SphereGeometry(0.5, 32, 32);
    sphere.v_shader = v_shaders["sphere"];
    sphere.f_shader = f_shaders["sphere"];
    sphere.setPosition(new Vector3([-1.2,0.0,0.0]));
    sphere.addUniform("u_EyePosition", "v3", camera.position.elements);
    //setUniform(type, location, data)
    scene.addGeometry(sphere);
    //var eyePositionShaderLocation = gl.getUniformLocation(gl.program, 'u_EyePosition');
    //scene.setUniform("v3", eyePositionShaderLocation, camera.position.elements);
    var cube2 = new CubeGeometry(0.5);
    cube2.setVertexShader(v_shaders["cube"]);
    cube2.setFragmentShader(f_shaders["cube"]);
    cube2.setPosition(new Vector3([0.5,0.0,0.0]));
    cube2.setScale(new Vector3([0.75,0.75,0.75]));
    cube2.setRotation(new Vector3([1,45,45]));
    scene.addGeometry(cube2);

    scene.draw();

    var tex4 = new Texture3D(gl, [
        'img/beach/negx.jpg',
        'img/beach/negx.jpg',
        'img/beach/negx.jpg',
        'img/beach/negx.jpg',
        'img/beach/negx.jpg',
        'img/beach/negx.jpg'
    ], function(tex) {
        cube2.addUniform("u_cubeTex", "t3", tex);
        scene.draw();
    });

    var tex3_pyramid = new Texture3D(gl, [
        'img/beach/negx.jpg',
        'img/beach/posx.jpg',
        'img/beach/negy.jpg',
        'img/beach/posy.jpg',
        'img/beach/negz.jpg',
        'img/beach/posz.jpg'
    ], function(tex) {
        triang2.addUniform("u_cubeTex", "t3", tex);
        scene.draw();
    });

    var tex3 = new Texture3D(gl, [
        'img/beach/negx.jpg',
        'img/beach/posx.jpg',
        'img/beach/negy.jpg',
        'img/beach/posy.jpg',
        'img/beach/negz.jpg',
        'img/beach/posz.jpg'
    ], function(tex) {
        sphere.addUniform("u_cubeTex", "t3", tex);
        scene.draw();
    });

    var tex2 = new Texture2D(gl, 'img/beach/posz.jpg', function(tex) {
        console.log(tex);
        triang.addUniform("u_tex", "t2", tex);
        scene.draw();
    });

    var tex = new Texture3D(gl, [
        'img/beach/negx.jpg',
        'img/beach/posx.jpg',
        'img/beach/negy.jpg',
        'img/beach/posy.jpg',
        'img/beach/negz.jpg',
        'img/beach/posz.jpg'
    ], function(tex) {
        cube.addUniform("u_cubeTex", "t3", tex);
        scene.draw();
    });

    document.getElementById('shiftLeft').onclick = function(ev) { shiftLeft(camera, sphere, triang2, scene) }
    document.getElementById('shiftRight').onclick = function(ev) { shiftRight(camera, sphere, triang2, scene) }
    document.getElementById('moveUp').onclick = function(ev) { moveUp(camera, sphere, triang2, scene) }
    document.getElementById('moveDown').onclick = function(ev) { moveDown(camera, sphere, triang2, scene) }
    document.getElementById('moveForward').onclick = function(ev) { moveForward(camera, sphere, triang2, scene) }
    document.getElementById('moveBackward').onclick = function(ev) { moveBackward(camera, sphere, triang2, scene) }
    document.getElementById('rotateLeft').onclick = function(ev) { rotateLeft(camera, sphere, triang2, scene) }
    document.getElementById('rotateRight').onclick = function(ev) { rotateRight(camera, sphere, triang2, scene) }
}

function shiftLeft(camera, sphere, triang2, scene){
  camera.move(-0.5,1,0,0);
  sphere.addUniform("u_EyePosition", "v3", camera.position.elements);
  triang2.addUniform("u_EyePosition", "v3", camera.position.elements);
  scene.draw();
}

function shiftRight(camera, sphere, triang2, scene){
  camera.move(0.5,1,0,0);
  sphere.addUniform("u_EyePosition", "v3", camera.position.elements);
  triang2.addUniform("u_EyePosition", "v3", camera.position.elements);
  scene.draw();
}

function moveUp(camera, sphere, triang2, scene){
  camera.move(0.5,0,1,0);
  sphere.addUniform("u_EyePosition", "v3", camera.position.elements);
  triang2.addUniform("u_EyePosition", "v3", camera.position.elements);
  scene.draw();
}

function moveDown(camera, sphere, triang2, scene){
  camera.move(-0.5,0,1,0);
  sphere.addUniform("u_EyePosition", "v3", camera.position.elements);
  triang2.addUniform("u_EyePosition", "v3", camera.position.elements);
  scene.draw();
}

function moveForward(camera, sphere, triang2, scene){
  camera.move(-0.5,0,0,1);
  sphere.addUniform("u_EyePosition", "v3", camera.position.elements);
  triang2.addUniform("u_EyePosition", "v3", camera.position.elements);
  scene.draw();
}

function moveBackward(camera, sphere, triang2, scene){
  camera.move(0.5,0,0,1);
  sphere.addUniform("u_EyePosition", "v3", camera.position.elements);
  triang2.addUniform("u_EyePosition", "v3", camera.position.elements);
  scene.draw();
}

function rotateLeft(camera, sphere, triang2, scene){
  camera.rotate(30, 0,1,0)
  sphere.addUniform("u_EyePosition", "v3", camera.position.elements);
  triang2.addUniform("u_EyePosition", "v3", camera.position.elements);
  scene.draw();
}

function rotateRight(camera, sphere, triang2, scene){
  camera.rotate(-30, 0,1,0)
  sphere.addUniform("u_EyePosition", "v3", camera.position.elements);
  triang2.addUniform("u_EyePosition", "v3", camera.position.elements);
  scene.draw();
}
