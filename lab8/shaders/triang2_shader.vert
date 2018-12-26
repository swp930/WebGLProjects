uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;

attribute vec4 a_Position;
attribute vec3 a_Normal;
attribute vec2 a_uv;
varying vec2 v_uv;
varying vec3 v_Normal;
varying vec4 v_Position;

void main() {
    v_uv = a_uv;
    v_Normal = a_Normal;
    // Getting position in the world coordinate system
    v_Position = a_Position * u_ModelMatrix;
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
}
