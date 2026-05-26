import{g as e,l as t,o as n,y as r}from"./index-nwfTB-99.js";import{A as i,B as a,C as o,F as s,M as c,O as l,P as u,U as d,a as f,b as p,d as m,h,i as g,l as _,n as v,o as y,r as b,t as x,u as S,z as C}from"./lil-gui.esm-D-Bvlpzx.js";import{t as w}from"./OrbitControls-CXIBMSoO.js";var T=t({__name:`002-globle-earth`,setup(t){let T=r(`canvas`),{width:E,height:D}=v(),O,k,A,j=0;g(()=>{j&&cancelAnimationFrame(j),k?.dispose(),O?.destroy(),A?.dispose()});let M=()=>{let e=document.createElement(`canvas`);e.width=32,e.height=32;let t=e.getContext(`2d`),n=t.createRadialGradient(16,16,0,16,16,16);return n.addColorStop(0,`rgba(255, 255, 255, 1)`),n.addColorStop(.2,`rgba(255, 255, 255, 0.8)`),n.addColorStop(.5,`rgba(255, 255, 255, 0.3)`),n.addColorStop(1,`rgba(255, 255, 255, 0)`),t.fillStyle=n,t.fillRect(0,0,32,32),new m(e)},N=({numStars:e=500})=>{let t=Math.random()*25+25,n=[];for(let r=0;r<e;r++){let e=Math.acos(Math.random()*2-1),r=Math.random()*2*Math.PI,i=t*Math.sin(e)*Math.cos(r),a=t*Math.sin(e)*Math.sin(r),o=t*Math.cos(e);n.push(i,a,o)}let r=new S;return r.setAttribute(`position`,new _(new Float32Array(n),3)),new u(r,new s({color:16777215,size:.5,map:M(),blending:2,depthWrite:!1,transparent:!0,opacity:.8,sizeAttenuation:!0}))};return b(()=>{if(!T.value)return;let e=new C,t=new c(75,E.value/D.value,.1,1e3);t.position.z=3,A=new f({canvas:T.value,antialias:!0}),A.setSize(E.value,D.value);let n=new h(16777215);n.position.set(2,-.5,1.5),e.add(n);let r=new p;r.rotation.z=-23.4*Math.PI/180,e.add(r);let s=new d,u=new o(1,32),m=new l(u,new i({map:s.load(`textures/earth-daymap-4k.jpg`),roughness:.8,metalness:.1}));r.add(m);let g=new l(u,new a({uniforms:{nightMap:{value:s.load(`textures/earth-nightmap-4k.jpg`)},sunDirection:{value:n.position.clone().normalize()}},vertexShader:`
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
  `,blending:2,transparent:!0,depthWrite:!1}));r.add(g);let _=new y(2236996,.3);e.add(_);let v=new l(u,new i({map:s.load(`textures/earth-clouds-4k.jpg`),blending:2,transparent:!0,depthWrite:!1}));v.scale.setScalar(1.003),r.add(v);let b=new l(new o(1.005,32),new a({uniforms:{sunDirection:{value:n.position.clone().normalize()}},vertexShader:`
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
  `,blending:2,transparent:!0,depthWrite:!1,side:0}));r.add(b);let S=N({numStars:5e3});e.add(S),O=new x({title:`Earth Controls`}),O.domElement.style.left=`16px`,O.domElement.style.right=`auto`,O.domElement.style.top=`16px`,O.domElement.style.zIndex=`1000`,O.domElement.style.maxHeight=`calc(100vh - 32px)`,O.domElement.style.overflow=`auto`;let M={rotation:!0,showDayMap:!0,showNightLights:!0,showClouds:!0,showAtmosphere:!0,showStars:!0,rotationSpeed:.001,ambientLightIntensity:.3},P=O.addFolder(`Visibility`);P.add(M,`showDayMap`).onChange(e=>{m.visible=e}),P.add(M,`showNightLights`).onChange(e=>{g.visible=e}),P.add(M,`showClouds`).onChange(e=>{v.visible=e}),P.add(M,`showAtmosphere`).onChange(e=>{b.visible=e}),P.add(M,`showStars`).onChange(e=>{S.visible=e});let F=O.addFolder(`Animation`);F.add(M,`rotation`).name(`Auto Rotate`),F.add(M,`rotationSpeed`,0,.02,.001).name(`Speed`),O.addFolder(`Lighting`).add(M,`ambientLightIntensity`,0,1,.01).name(`Ambient`).onChange(e=>{_.intensity=e}),k=new w(t,A.domElement),k.enableDamping=!0,k.dampingFactor=.05,k.enableZoom=!0,k.autoRotate=!1,k.rotateSpeed=.5,O.close();let I=()=>{j=requestAnimationFrame(I),M.rotation&&(m.rotation.y+=M.rotationSpeed,g.rotation.y+=M.rotationSpeed,v.rotation.y+=M.rotationSpeed+.001),k.update(),A.render(e,t)};I()}),(t,r)=>(e(),n(`canvas`,{ref_key:`canvas`,ref:T,class:`fixed inset-0 h-full w-full`},null,512))}});export{T as default};