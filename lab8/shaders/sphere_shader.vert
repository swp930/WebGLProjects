uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform vec3 u_EyePosition;

attribute vec4 a_Position;
varying vec3 v_reflectedVector;

void main() {

    vec3 norm = normalize(a_Position.xyz);

    vec3 eyeVector = a_Position.xyz - u_EyePosition;
    v_reflectedVector = normalize(reflect(eyeVector, norm));

    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
}
