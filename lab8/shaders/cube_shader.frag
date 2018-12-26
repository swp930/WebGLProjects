#ifdef GL_ES
precision mediump float;
#endif

uniform samplerCube u_cubeTex;

varying vec3 v_pos;
varying vec4 v_color;

void main() {
    //vec4 color = textureCube(u_cubeTex, v_pos);
    //color = color + vec4(0.0, 0,0.5,0);
    //gl_FragColor = color;
    gl_FragColor = textureCube(u_cubeTex, v_pos);
}
