import{f as e,g as t,l as n,o as r,y as i}from"./index-DMk-d4U4.js";import{A as a,E as o,G as s,I as c,O as l,a as u,d,i as f,n as p,o as m,p as h,q as g,r as _,t as v,x as y,y as b}from"./dist-DuX9UJCj.js";import{t as x}from"./OrbitControls-CfflVs6C.js";import{n as S,r as C,t as w}from"./UnrealBloomPass-BNBpT3x2.js";import{t as T}from"./lil-gui.esm-BsdZdNnU.js";var E=`uniform float uTime;
varying float vDisplacement;

vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fade(vec3 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

float noise(vec3 P) {
  vec3 Pi0 = floor(P);        // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P);        // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
  vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
  vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
  vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
  vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
  vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
  vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
  vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

  vec4 norm0 = taylorInvSqrt(
      vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(
      vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111),
                 fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}

float smoothMod(float axis, float amp, float rad) {
  float top = cos(PI * (axis / amp)) * sin(PI * (axis / amp));
  float bottom = pow(sin(PI * (axis / amp)), 2.0) + pow(rad, 2.0);
  float at = atan(top / bottom);
  return amp * (0.5 - at / PI);
}

float fit(float value, float sourceMin, float sourceMax, float targetMin,
          float targetMax) {
  float sourceRange = sourceMax - sourceMin;
  float targetRange = targetMax - targetMin;

  // Normalize the value to a 0.0 - 1.0 range
  float normalizedValue = (value - sourceMin) / sourceRange;

  // Scale and shift the normalized value to the target range
  return normalizedValue * targetRange + targetMin;
}

float wave(vec3 coords) {
  return fit(smoothMod(coords.y * 4.5, 1.0, 1.5), 0.35, 0.6, 0.0, 1.0);
}
`,D=`vec3 coords = normal;
coords.y += uTime;
vec3 noisePattern = vec3(noise(coords / 1.5));
float pattern = wave(noisePattern + uTime);

vDisplacement = pattern;

float displacement = vDisplacement / 4.5;

vec3 displacementPos = normalize(objectNormal) * displacement;
transformed += displacementPos;`,O=`uniform float uTime;
varying float vDisplacement;
uniform vec3 uGlowColor;
uniform float uGlowIntensity;

vec3 perturbNormalArb(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy,
                      float faceDirection) {

  vec3 vSigmaX = dFdx(surf_pos.xyz);
  vec3 vSigmaY = dFdy(surf_pos.xyz);
  vec3 vN = surf_norm; // normalized

  vec3 R1 = cross(vSigmaY, vN);
  vec3 R2 = cross(vN, vSigmaX);

  float fDet = dot(vSigmaX, R1) * faceDirection;

  vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);
  return normalize(abs(fDet) * surf_norm - vGrad);
}`,k=`normal = perturbNormalArb(-vViewPosition, normal,
                          vec2(dFdx(vDisplacement), dFdy(vDisplacement)),
                          faceDirection);`,A=n({__name:`006-shader`,setup(n){let A=i(`canvas`),{width:j,height:M}=p(),N,P,F,I=e(`stats`),L=0;return f(()=>{L&&cancelAnimationFrame(L),P?.dispose(),N?.destroy(),F?.dispose(),I?.reset()}),_(()=>{if(!A.value)return;let e=new c;e.background=new d(`#050816`);let t=new a(75,j.value/M.value,.1,1e3);t.position.z=5,F=new u({canvas:A.value,antialias:!0}),F.toneMapping=4,F.toneMappingExposure=1.2,F.setPixelRatio(Math.min(window.devicePixelRatio,2)),F.setSize(j.value,M.value),P=new x(t,F.domElement),P.enableDamping=!0,P.enableZoom=!0;let n=new h(`#526cff`,.6);n.position.set(2,2,2);let r=new m(`#4255ff`,.5);e.add(n,r);let i=new y(1,150),f=new l;f.onBeforeCompile=e=>{f.userData.shader=e,e.uniforms.uTime={value:0},e.uniforms.uDisplacementScale={value:.22},e.uniforms.uGlowColor={value:new d(.05,.3,.8)},e.uniforms.uGlowIntensity={value:1};let t=`#include <displacementmap_pars_vertex>`;e.vertexShader=e.vertexShader.replace(t,`\n${t}\nuniform float uDisplacementScale;\n${E}\n`);let n=`#include <displacementmap_vertex>`,r=D.replace(`vDisplacement / 4.5`,`vDisplacement * uDisplacementScale`);e.vertexShader=e.vertexShader.replace(n,`\n${n}\n${r}\n`);let i=`#include <bumpmap_pars_fragment>`;e.fragmentShader=e.fragmentShader.replace(i,`\n${i}\n${O}\n`);let a=`#include <normal_fragment_maps>`;e.fragmentShader=e.fragmentShader.replace(a,`\n${a}\n${k}\n`);let o=`#include <emissivemap_fragment>`;e.fragmentShader=e.fragmentShader.replace(o,`\n${o}\n
      // custom glow
      float peakGlow = pow(vDisplacement, 4.0) * 0.5;
      float fresnel = pow(1.0 - max(dot(normalize(vViewPosition), normal), 0.0), 4.0) * 0.1;
      totalEmissiveRadiance += uGlowColor * (peakGlow + fresnel) * uGlowIntensity;
      \n`)};let p=new o(i,f);e.add(p);let _=new g(j.value,M.value,{type:b}),R=new C(F,_),z=new S(e,t),B=new w(new s(j.value,M.value),.5,.4,.3);R.addPass(z),R.addPass(B),N=new T({title:`Shader Globe Controls`}),N.domElement.style.left=`16px`,N.domElement.style.right=`auto`,N.domElement.style.top=`16px`,N.domElement.style.zIndex=`1000`,N.domElement.style.maxHeight=`calc(100vh - 32px)`,N.domElement.style.overflow=`auto`;let V={displacementScale:.22,glowColor:`#0d4ccc`,glowIntensity:1,color:`#${f.color.getHexString()}`,roughness:f.roughness,metalness:f.metalness,wireframe:f.wireframe,flatShading:f.flatShading,dirLightColor:`#${n.color.getHexString()}`,dirLightIntensity:n.intensity,ambientColor:`#${r.color.getHexString()}`,ambientIntensity:r.intensity,bloomStrength:B.strength,bloomRadius:B.radius,bloomThreshold:B.threshold,autoRotate:P.autoRotate,autoRotateSpeed:P.autoRotateSpeed,exposure:F.toneMappingExposure},H=N.addFolder(`Shader / Globe`);H.add(V,`displacementScale`,0,1,.01).name(`Displacement`).onChange(e=>{f.userData.shader&&(f.userData.shader.uniforms.uDisplacementScale.value=e)}),H.addColor(V,`glowColor`).name(`Glow Color`).onChange(e=>{f.userData.shader&&f.userData.shader.uniforms.uGlowColor.value.set(e)}),H.add(V,`glowIntensity`,0,5,.05).name(`Glow Intensity`).onChange(e=>{f.userData.shader&&(f.userData.shader.uniforms.uGlowIntensity.value=e)});let U=N.addFolder(`Material`);U.addColor(V,`color`).name(`Base Color`).onChange(e=>{f.color.set(e)}),U.add(V,`roughness`,0,1,.01).onChange(e=>{f.roughness=e}),U.add(V,`metalness`,0,1,.01).onChange(e=>{f.metalness=e}),U.add(V,`wireframe`).onChange(e=>{f.wireframe=e}),U.add(V,`flatShading`).name(`Flat Shading`).onChange(e=>{f.flatShading=e,f.needsUpdate=!0});let W=N.addFolder(`Lighting`);W.addColor(V,`dirLightColor`).name(`Dir Light Color`).onChange(e=>{n.color.set(e)}),W.add(V,`dirLightIntensity`,0,5,.05).name(`Dir Intensity`).onChange(e=>{n.intensity=e}),W.addColor(V,`ambientColor`).name(`Ambient Color`).onChange(e=>{r.color.set(e)}),W.add(V,`ambientIntensity`,0,5,.05).name(`Ambient Intensity`).onChange(e=>{r.intensity=e});let G=N.addFolder(`Bloom Glow`);G.add(V,`bloomStrength`,0,3,.05).name(`Strength`).onChange(e=>{B.strength=e}),G.add(V,`bloomRadius`,0,2,.05).name(`Radius`).onChange(e=>{B.radius=e}),G.add(V,`bloomThreshold`,0,1,.05).name(`Threshold`).onChange(e=>{B.threshold=e});let K=N.addFolder(`Controls & Camera`);K.add(V,`autoRotate`).name(`Auto Rotate`).onChange(e=>{P.autoRotate=e}),K.add(V,`autoRotateSpeed`,0,20,.05).name(`Rotate Speed`).onChange(e=>{P.autoRotateSpeed=e}),K.add(V,`exposure`,0,3,.05).name(`Exposure`).onChange(e=>{F.toneMappingExposure=e}),N.close(),v(`resize`,()=>{t.aspect=j.value/M.value,t.updateProjectionMatrix(),F.setSize(j.value,M.value),R.setSize(j.value,M.value),F.setPixelRatio(Math.min(window.devicePixelRatio,2)),R.setPixelRatio?.(Math.min(window.devicePixelRatio,2))});let q=(e=0)=>{I?.begin(),P.update(),R.render(),I?.end(),L=requestAnimationFrame(q);let t=e/5e3;f.userData.shader&&(f.userData.shader.uniforms.uTime.value=t)};q()}),(e,n)=>(t(),r(`canvas`,{ref_key:`canvas`,ref:A,class:`fixed inset-0 h-full w-full`},null,512))}});export{A as default};