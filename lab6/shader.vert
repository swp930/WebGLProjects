attribute vec4 a_Position;
attribute vec4 a_Color;
attribute vec3 a_Normal; // Normal

uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjMatrix;
uniform mat4 u_ModelMatrix;

varying vec4 v_Color;
varying vec3 v_Normal;
varying vec3 v_Position;

void main() {

  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;

  v_Position = a_Position.xyz;

  v_Normal = a_Normal.xyz;

  v_Color = a_Color;
}
