import{g as e,l as t,o as n,y as r}from"./index-CdTLFziR.js";import{A as i,B as a,E as o,F as s,I as c,O as l,P as u,a as d,i as f,n as p,o as m,p as h,r as g,t as _,v,x as y}from"./dist-BWrj0Hxq.js";import{t as b}from"./OrbitControls-DMv4FJm8.js";import{t as x}from"./lil-gui.esm-BsdZdNnU.js";var S=t({__name:`002-globle-earth`,setup(t){let S=r(`canvas`),{width:C,height:w}=p(),T,E,D,O=0;return f(()=>{O&&cancelAnimationFrame(O),E?.dispose(),T?.destroy(),D?.dispose()}),g(()=>{if(!S.value)return;let e=new s,t=new i(75,C.value/w.value,.1,1e3);t.position.z=3,D=new d({canvas:S.value,antialias:!0}),D.setSize(C.value,w.value);let n=new h(16777215);n.position.set(2,-.5,1.5),e.add(n);let r=new v;r.rotation.z=-23.4*Math.PI/180,e.add(r);let f=new a,p=new y(1,32),g=new o(p,new l({map:f.load(`textures/earth-daymap-4k.jpg`),roughness:.8,metalness:.1}));r.add(g);let k=new o(p,new c({uniforms:{nightMap:{value:f.load(`textures/earth-nightmap-4k.jpg`)},sunDirection:{value:n.position.clone().normalize()}},vertexShader:`
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    
    void main() {
      vUv = uv;
      // Transform normal to world space
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,fragmentShader:`
    uniform sampler2D nightMap;
    uniform vec3 sunDirection;
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    
    void main() {
      // Dot product with world space sun direction
      float lightIntensity = dot(vWorldNormal, sunDirection);
      
      // Smooth transition on the dark side
      float nightVisibility = smoothstep(0.2, -0.2, lightIntensity);
      
      vec4 nightColor = texture2D(nightMap, vUv);
      gl_FragColor = vec4(nightColor.rgb, nightColor.a * nightVisibility);
    }
  `,blending:2,transparent:!0,depthWrite:!1}));r.add(k);let A=new m(2236996,.3);e.add(A);let j=new o(p,new l({map:f.load(`textures/earth-clouds-4k.jpg`),blending:2,transparent:!0,depthWrite:!1}));j.scale.setScalar(1.003),r.add(j);let M=new o(new y(1.005,32),new c({uniforms:{sunDirection:{value:n.position.clone().normalize()}},vertexShader:`
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,fragmentShader:`
    uniform vec3 sunDirection;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    
    void main() {
      // Calculate view direction
      vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
      
      // Fresnel effect - stronger glow at edges
      float fresnel = 1.0 - abs(dot(viewDirection, vWorldNormal));
      fresnel = pow(fresnel, 3.0);
      
      // Atmosphere color (blue)
      vec3 atmosphereColor = vec3(0.3, 0.6, 1.0);
      
      // Mix with transparency based on fresnel
      float alpha = fresnel * 0.3;
      
      gl_FragColor = vec4(atmosphereColor, alpha);
    }
  `,blending:2,transparent:!0,depthWrite:!1,side:0}));r.add(M);let N=f.load(`textures/stars-milky-way-8k.jpg`);N.mapping=303,N.colorSpace=u,e.background=N,T=new x({title:`Earth Controls`}),T.domElement.style.left=`16px`,T.domElement.style.right=`auto`,T.domElement.style.top=`16px`,T.domElement.style.zIndex=`1000`,T.domElement.style.maxHeight=`calc(100vh - 32px)`,T.domElement.style.overflow=`auto`;let P={rotation:!0,showDayMap:!0,showNightLights:!0,showClouds:!0,showAtmosphere:!0,showStars:!0,rotationSpeed:.001,ambientLightIntensity:.3},F=T.addFolder(`Visibility`);F.add(P,`showDayMap`).onChange(e=>{g.visible=e}),F.add(P,`showNightLights`).onChange(e=>{k.visible=e}),F.add(P,`showClouds`).onChange(e=>{j.visible=e}),F.add(P,`showAtmosphere`).onChange(e=>{M.visible=e}),F.add(P,`showStars`).onChange(t=>{e.background=t?N:null});let I=T.addFolder(`Animation`);I.add(P,`rotation`).name(`Auto Rotate`),I.add(P,`rotationSpeed`,0,.02,.001).name(`Speed`),T.addFolder(`Lighting`).add(P,`ambientLightIntensity`,0,1,.01).name(`Ambient`).onChange(e=>{A.intensity=e}),E=new b(t,D.domElement),E.enableDamping=!0,E.dampingFactor=.05,E.enableZoom=!0,E.autoRotate=!1,E.rotateSpeed=.5,T.close(),_(`resize`,()=>{t.aspect=C.value/w.value,t.updateProjectionMatrix(),D.setSize(C.value,w.value)});let L=()=>{O=requestAnimationFrame(L),P.rotation&&(g.rotation.y+=P.rotationSpeed,k.rotation.y+=P.rotationSpeed,j.rotation.y+=P.rotationSpeed+.001),E.update(),D.render(e,t)};L()}),(t,r)=>(e(),n(`canvas`,{ref_key:`canvas`,ref:S,class:`fixed inset-0 h-full w-full`},null,512))}});export{S as default};