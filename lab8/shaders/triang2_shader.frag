#ifdef GL_ES
precision mediump float;
#endif

uniform samplerCube u_cubeTex;

varying vec2 v_uv;
varying vec3 v_Normal;
varying vec4 v_Position;

uniform vec3 u_EyePosition;

void main() {
    vec3 norm = normalize(v_Normal);
    vec3 position = v_Position.xyz;
    vec3 eyepos = u_EyePosition;
    vec3 eyeVector = eyepos - position;
    vec3 reflectVector = normalize(reflect(-eyeVector, norm));

    //gl_FragColor = vec4(1.0,0.4,0.4,1.0);
    gl_FragColor = textureCube(u_cubeTex, reflectVector);
}
