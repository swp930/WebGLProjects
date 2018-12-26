// ===========================
// GEOMETRY
// ===========================
class Geometry {
    constructor() {
        this.vertices = [];
        this.indices  = [];
        this.attributes = {};
        this.uniforms = {};
        this.texture = null;

        this.v_shader = "";
        this.f_shader = "";

        this.position = new Vector3();
        this.rotation = new Vector3();
        this.scale = new Vector3([1,1,1]);

        this.translation_matrix = new Matrix4();
        this.rotation_matrix = new Matrix4();
        this.scaling_matrix = new Matrix4();
    }

    addAttribute(name, data) {
        this.attributes[name] = data;
    }

    addUniform(name, type, data) {
        this.uniforms[name] = {type: type, data: data};
    }

    setVertexShader(v_shader) {
        this.v_shader = v_shader;
    }

    setFragmentShader(f_shader) {
        this.f_shader = f_shader;
    }

    setPosition(position) {
        this.position = position;
    }

    setRotation(rotation) {
        this.rotation = rotation;
    }

    setScale(scale) {
        this.scale = scale;
    }
}

// CUBE GEOMETRY
class CubeGeometry extends Geometry {
    constructor(size) {
        super();

        size = size || 1

        this.vertices = [
            size, size, size,  -size, size, size,  -size,-size, size,   size,-size, size, // v0-v1-v2-v3 front
            size, size, size,   size,-size, size,   size,-size,-size,   size, size,-size, // v0-v3-v4-v5 right
            size, size, size,   size, size,-size,  -size, size,-size,  -size, size, size, // v0-v5-v6-v1 up
           -size, size, size,  -size, size,-size,  -size,-size,-size,  -size,-size, size, // v1-v6-v7-v2 left
           -size,-size,-size,   size,-size,-size,   size,-size, size,  -size,-size, size, // v7-v4-v3-v2 down
            size,-size,-size,  -size,-size,-size,  -size, size,-size,   size, size,-size  // v4-v7-v6-v5 back
        ];

        this.indices = [
            0, 1, 2,   0, 2, 3,     // front
            4, 5, 6,   4, 6, 7,     // right
            8, 9,10,   8,10,11,     // up
            12,13,14,  12,14,15,    // left
            16,17,18,  16,18,19,    // down
            20,21,22,  20,22,23     // back
        ];
    }
}

// SPHERE GEOMETRY
class SphereGeometry extends Geometry {
    constructor(radius, widthSegments, heightSegments) {
        super();

        radius = radius || 1;

        widthSegments = Math.max( 3, Math.floor( widthSegments ) || 8 );
    	heightSegments = Math.max( 2, Math.floor( heightSegments ) || 6 );

        var phiStart = 0;
        var phiLength = Math.PI * 2;

        var thetaStart = 0;
        var thetaLength = Math.PI;

        var thetaEnd = thetaStart + thetaLength;

        var ix, iy;

    	var index = 0;
    	var grid = [];

        for (iy = 0; iy <= heightSegments; iy++) {
            var verticesRow = [];
            var v = iy / heightSegments;

            for (ix = 0; ix <= widthSegments; ix ++) {
                var u = ix / widthSegments;

                var x = -radius * Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);
                var y = radius * Math.cos(thetaStart + v * thetaLength );
                var z = radius * Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);
                this.vertices.push(x, y, z);

                verticesRow.push(index++);
            }

            grid.push(verticesRow);
        }

        // indices
        for (iy = 0; iy < heightSegments; iy++) {
            for (ix = 0; ix < widthSegments; ix++) {
                var a = grid[iy][ix + 1];
                var b = grid[iy][ix];
                var c = grid[iy + 1][ix];
                var d = grid[iy + 1][ix + 1];

                if (iy !== 0 || thetaStart > 0)
                    this.indices.push(a, b, d);

                if (iy !== heightSegments - 1 || thetaEnd < Math.PI)
                    this.indices.push(b, c, d);
            }
        }
    }
}

// ===========================
// SCENE
// ===========================
class Scene {
    constructor(gl, camera) {
        this.gl = gl;
        this.geometries = [];
        this.index_buffers = [];
        this.vertex_buffers = [];
        this.attribute_buffers = [];
        this.uniforms = {};
        this.camera = camera;

        this.gl.clearColor(0, 0, 0, 1);
        this.gl.enable(gl.DEPTH_TEST);
    }

    addGeometry(geometry) {
        var index_buffer = this.gl.createBuffer();
        if (!index_buffer) {
            console.log("failed to create index buffer");
            return false;
        }

        this.index_buffers.push(index_buffer);

        var vertex_buffer = this.gl.createBuffer();
        if (!vertex_buffer) {
            console.log("failed to create index buffer");
            return false;
        }

        this.vertex_buffers.push(vertex_buffer);

        this.attribute_buffers.push({});
        for (var attribute in geometry.attributes) {
           if (geometry.attributes.hasOwnProperty(attribute)) {
               var attribute_buffer = this.gl.createBuffer();
               if (!attribute_buffer) {
                   console.log("failed to create buffer object!");
                   return false;
               }

               var last = this.attribute_buffers.length - 1;
               this.attribute_buffers[last][attribute] = attribute_buffer;
           }
        }

        this.geometries.push(geometry);
        return true;
    }

    initAttributeBuffer(geometry_index, data, num, type, attribute) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.attribute_buffers[geometry_index][attribute]);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);

        var a_attribute = this.gl.getAttribLocation(this.gl.program, attribute);
        if (a_attribute < 0) {
            console.log('Failed to get the storage location of ' + attribute);
            return false;
         }

         this.gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
         this.gl.enableVertexAttribArray(a_attribute);

         return true;
    }

    initIndexBuffer(geometry_index) {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.index_buffers[geometry_index]);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.geometries[geometry_index].indices), this.gl.STATIC_DRAW);
    }

    initVertexBuffer(geometry_index, data) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertex_buffers[geometry_index]);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);

        var a_attribute = this.gl.getAttribLocation(this.gl.program, 'a_Position');
        if (a_attribute < 0) {
            console.log('Failed to get the storage location of ' + attribute);
            return false;
         }

         this.gl.vertexAttribPointer(a_attribute, 3, this.gl.FLOAT, false, 0, 0);
         this.gl.enableVertexAttribArray(a_attribute);

         return true;
    }

    initUniforms(geometry_index) {
        var u_ModelMatrix = this.gl.getUniformLocation(this.gl.program, 'u_ModelMatrix');
        if (!u_ModelMatrix) {
            console.log('Failed to get the storage locations of u_ModelMatrix');
            return false;
        }

        this.uniforms['u_ModelMatrix'] = u_ModelMatrix;

        var u_ViewMatrix = this.gl.getUniformLocation(this.gl.program, 'u_ViewMatrix');
        if (!u_ViewMatrix) {
            console.log('Failed to get the storage locations of u_ViewMatrix');
            return false;
        }

        this.uniforms['u_ViewMatrix'] = u_ViewMatrix;

        var u_ProjectionMatrix = this.gl.getUniformLocation(this.gl.program, 'u_ProjectionMatrix');
        if (!u_ProjectionMatrix) {
            console.log('Failed to get the storage locations of u_ProjectionMatrix');
            return false;
        }

        this.uniforms['u_ProjectionMatrix'] = u_ProjectionMatrix;

        return true;
    }

    setUniform(type, location, data) {
        switch (type) {
            case "i":
                this.gl.uniform1i(location, data);
                break;
            case "f":
                this.gl.uniform1f(location, data);
                break;
            case "v2":
                this.gl.uniform2fv(location, data);
                break;
            case "v3":
                this.gl.uniform3fv(location, data);
                break;
            case "v4":
                this.gl.uniform4fv(location, data);
                break;
            case "m2":
                this.gl.uniformMatrix2fv(location, false, data);
                break;
            case "m3":
                this.gl.uniformMatrix3fv(location, false, data);
                break;
            case "m4":
                this.gl.uniformMatrix4fv(location, false, data);
                break;
            case "t2":
                this.gl.uniform1i(location, data);
                break;
            case "t3":
                this.gl.uniform1i(location, data);
                break;
            default:
                return false;
        }

        return true;
    }

    initModelMatrix(geometry_index) {
        // Translation
        var p_x = this.geometries[geometry_index].position.elements[0];
        var p_y = this.geometries[geometry_index].position.elements[1];
        var p_z = this.geometries[geometry_index].position.elements[2];

        this.geometries[geometry_index].translation_matrix.translate(p_x, p_y, p_z);

        // Rotation
        var r_x = this.geometries[geometry_index].rotation.elements[0];
        var r_y = this.geometries[geometry_index].rotation.elements[1];
        var r_z = this.geometries[geometry_index].rotation.elements[2];

        this.geometries[geometry_index].rotation_matrix.rotate(r_x, 1, 0, 0);
        this.geometries[geometry_index].rotation_matrix.rotate(r_y, 0, 1, 0);
        this.geometries[geometry_index].rotation_matrix.rotate(r_z, 0, 0, 1);

        // Scaling
        var s_x = this.geometries[geometry_index].scale.elements[0];
        var s_y = this.geometries[geometry_index].scale.elements[1];
        var s_z = this.geometries[geometry_index].scale.elements[2];

        this.geometries[geometry_index].scaling_matrix.scale(s_x, s_y, s_z);

        var modelMatrix = new Matrix4;
        modelMatrix.multiply(this.geometries[geometry_index].translation_matrix);
        modelMatrix.multiply(this.geometries[geometry_index].rotation_matrix);
        modelMatrix.multiply(this.geometries[geometry_index].scaling_matrix);

        this.setUniform("m4", this.uniforms['u_ModelMatrix'],
            modelMatrix.elements);

        this.geometries[geometry_index].translation_matrix.setIdentity();
        this.geometries[geometry_index].rotation_matrix.setIdentity();
        this.geometries[geometry_index].scaling_matrix.setIdentity();
    }

    initProjectionViewMatrix() {
        this.setUniform("m4", this.uniforms['u_ProjectionMatrix'],
            this.camera.projectionMatrix.elements);

        this.setUniform("m4", this.uniforms['u_ViewMatrix'],
            this.camera.viewMatrix.elements);
    }

    draw() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.camera.update();

        for(var i = 0; i < this.geometries.length; i++) {
            if (!initShaders(this.gl, this.geometries[i].v_shader, this.geometries[i].f_shader)) {
                console.log('Failed to intialize shaders.');
                return;
            }

            if (!this.initUniforms()) {
                console.log('Failed to intialize uniforms.');
                return;
            }

            this.initIndexBuffer(i);
            this.initVertexBuffer(i, this.geometries[i].vertices);

            this.initProjectionViewMatrix();
            this.initModelMatrix(i);

            for (var uniform in this.geometries[i].uniforms) {
               if (this.geometries[i].uniforms.hasOwnProperty(uniform)) {

                   var type = this.geometries[i].uniforms[uniform].type;
                   var location = this.gl.getUniformLocation(this.gl.program, uniform);
                   var data = this.geometries[i].uniforms[uniform].data;

                   this.setUniform(type, location, data);

                   if(type == "t2") {
                       this.gl.bindTexture(this.gl.TEXTURE_2D, this.geometries[i].uniforms[uniform].data);
                   }
                   else if(type == "t3") {
                       this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.geometries[i].uniforms[uniform].data);
                   }
               }
            }

            for (var attribute in this.geometries[i].attributes) {
               if (this.geometries[i].attributes.hasOwnProperty(attribute)) {
                   var data = this.geometries[i].attributes[attribute];
                   this.initAttributeBuffer(i, data, 3, this.gl.FLOAT, attribute);
               }
            }

            this.gl.drawElements(this.gl.TRIANGLES, this.geometries[i].indices.length, this.gl.UNSIGNED_SHORT, 0);

            var count = 1;
            for (var attribute in this.geometries[i].attributes) {
               if (this.geometries[i].attributes.hasOwnProperty(attribute)) {
                   this.gl.disableVertexAttribArray(count);
                   count += 1;
               }
            }

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);

            this.gl.bindTexture(this.gl.TEXTURE_2D, null);
            this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, null);
        }
    }
}

// ===========================
// CAMERA
// ===========================
class PerspectiveCamera {
    constructor(fov, aspect, near, far) {
        this.position = new Vector3([0, 0, 0]);
        this.center = new Vector3([0, 0, -1]);
        this.up = new Vector3([0, 1, 0]);

        this.projectionMatrix = new Matrix4();
        this.projectionMatrix.setPerspective(fov, aspect, near, far);

        this.viewMatrix = new Matrix4();
    }

    rotate(angle, x, y, z) {
       // Calculate the n camera axis
       var n = new Vector3(this.position.elements);
       n.sub(this.center);
       n.normalize();

       var c = new Vector3(this.center.elements);
       c.sub(this.position);

       // Create a rotation transform about u
       var m = new Matrix4();
       m.setRotate(angle, x, y, z);

       // Rotate the center point. Since this is a vector that has no location,
       // we only need to multiply by the rotation part of the transform.
       c = m.multiplyVector3(c);

       // Translate the center point back to the location of the camera.
       this.center = c.add(this.position);

       // If the angle between the line-of-sight and the "up vector" is less
       // than 10 degrees or greater than 170 degrees, then rotate the
       // "up_vector" about the u axis.
       // cos(10 degrees) = 0.985; cos(170 degrees) = -0.985
       if (Math.abs(n.dot(this.up)) >= 0.985) {
           this.up = m.multiplyVector3(this.up);
       }
    }

    move(distance, x, y, z) {
        var v = new Vector3([x, y, z]);
        v.mul(distance);

        this.position.add(v);
        this.center.add(v);
    };

    update() {
        this.viewMatrix.setLookAt(
            this.position.elements[0],
            this.position.elements[1],
            this.position.elements[2],
            this.center.elements[0],
            this.center.elements[1],
            this.center.elements[2],
            this.up.elements[0],
            this.up.elements[1],
            this.up.elements[2]);
    }
}

// ===========================
// TEXTURE
// ===========================
class Texture2D {
    constructor(gl, texture_path, callback) {
        this.load(gl, texture_path, callback);
    }

    load(gl, url, callback) {
        var img = new Image();

        img.onload = function(tex) {
            var tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
            gl.generateMipmap(gl.TEXTURE_2D);
            console.log("texture loaded.");
            console.log(tex);
            callback(tex);
        }

        img.onerror = function(e,f) {
        }

        img.src = url;
    }
}

class Texture3D {
    constructor(gl, texture_paths, callback) {
        this.neg_x = texture_paths[0];
        this.pos_x = texture_paths[1];
        this.neg_y = texture_paths[2];
        this.pos_y = texture_paths[3];
        this.neg_z = texture_paths[4];
        this.pos_z = texture_paths[5];

        this.load(gl, callback);
    }

    load(gl, callback) {
        var tex = gl.createTexture();
        var image_count = 0;  // Number of images that have finished loading.

        loadTexture(this.neg_x, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, callback);
        loadTexture(this.pos_x, gl.TEXTURE_CUBE_MAP_POSITIVE_X, callback);
        loadTexture(this.neg_y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, callback);
        loadTexture(this.pos_y, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, callback);
        loadTexture(this.neg_z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, callback);
        loadTexture(this.pos_z, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, callback);

        function loadTexture(url, target, callback) {
            var img = new Image();
            img.onload = function() {
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
                gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

                image_count += 1;
                if (image_count == 6) {
                    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                    callback(tex);
                }
            }

            img.onerror = function() {
                console.log("Unable to load texture.");
            }

            img.src = url;
        }
    }
}
