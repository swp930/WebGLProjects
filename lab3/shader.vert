attribute vec4 a_Position;
attribute vec4 a_Color;
attribute vec3 a_Normal;

uniform float val;
uniform vec3 uniformGreen;
varying vec4 v_Color;

void main() {
  gl_Position = a_Position;
  vec3 normal = normalize(vec3(a_Normal));
  vec3 test = vec3(0,1,0);
  vec3 normal2 = a_Normal;
  float dotTest = dot(test, normal2);
  float dotFNL = dot(a_Normal.xyz, uniformGreen);
  vec3 finalColor = a_Color.rgb;
  if(dotTest == 1.0)
    finalColor = uniformGreen;
  v_Color = vec4(finalColor, a_Color.a);
}
