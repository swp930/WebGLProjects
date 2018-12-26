
uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;

attribute vec4 a_Position;
attribute vec4 a_Color;

varying vec3 v_pos;
varying vec4 v_color;

void main() {
    v_pos = a_Position.xyz;
    vec3 total = vec3(1,0,0);
    //vec3 total = a_Color.rgb + vec3(0.1,0,0);
    //v_color = a_Color;
    v_color = vec4(total, a_Color.a);
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
}
