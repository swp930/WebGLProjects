#ifdef GL_ES
precision mediump float;
#endif

varying vec3 v_reflectedVector;
uniform samplerCube u_cubeTex;

void main() {

  gl_FragColor = textureCube(u_cubeTex, v_reflectedVector);
}
