attribute vec4 a_Position;
attribute vec4 a_Color;
attribute vec3 a_Normal; // Normal
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjMatrix;
uniform vec3 u_DiffuseLight;  // Diffuse light color
uniform vec3 u_LightDirection; // Diffuse light direction (in the world coordinate, normalized)
uniform vec3 u_AmbientLight; // Color of an ambient light
uniform vec3 u_ViewDirection;
uniform vec3 u_SpecularLight;
uniform vec3 u_UniformGreen; // Color of an ambient light
uniform float p;
varying vec4 v_Color;

void main() {

  gl_Position = u_ProjMatrix * u_ViewMatrix * a_Position;
  // Make the length of the normal 1.0

  vec3 normal = normalize(a_Normal.xyz);
  // The dot product of the light direction and the normal (the orientation of a surface)

  vec3 u_LightDirectionNew = normalize(u_LightDirection - a_Position.xyz);

  float nDotL = max(dot(u_LightDirectionNew, normal), 0.0);
  // Calculate the color due to diffuse reflection

  vec3 diffuse = u_DiffuseLight * a_Color.rgb * nDotL;
  // Calculate the color due to ambient reflection

  vec3 ambient = u_AmbientLight;
  vec3 reflectVector = 2.0*dot(u_LightDirectionNew, normal)*normal - u_LightDirectionNew;

  vec3 specular = u_SpecularLight * a_Color.rgb * pow(max(dot(reflectVector,u_ViewDirection), 0.0), p);

  vec3 total = diffuse + ambient + specular;
  //vec3 total = diffuse + ambient;
  // Add the surface colors due to diffuse reflection and ambient reflection

  vec3 u_UniformGreenTest = u_UniformGreen * 0.5;
  vec3 test = vec3(0,1,0);
  float dotTest = dot(test, a_Normal);
  if(dotTest == 1.0)
    u_UniformGreenTest = u_UniformGreen * 1.0;
  float dotTest2 = dot(test, a_Normal.xyz);
  if(dotTest2 == -3.0)
    total = vec3(1,0,0);
  //v_Color = vec4(diffuse + ambient, a_Color.a);
  v_Color = vec4(total, a_Color.a);
}
