import{c as e,h as t,o as n,v as r}from"./index-TJoTFdjQ.js";import{C as i,D as a,E as o,S as s,T as c,a as l,d as u,f as d,g as f,i as p,m,n as h,o as g,r as _,s as v,t as y,u as b,v as x,w as S,x as C,y as w}from"./lil-gui.esm-BtHmGaKo.js";var T=e({__name:`002-globle-earth`,setup(e){let T=r(`canvas`),{width:E,height:D}=h(),O,k,A,j=0;p(()=>{j&&cancelAnimationFrame(j),k?.dispose(),O?.destroy(),A?.dispose()});let M=()=>{let e=document.createElement(`canvas`);e.width=32,e.height=32;let t=e.getContext(`2d`),n=t.createRadialGradient(16,16,0,16,16,16);return n.addColorStop(0,`rgba(255, 255, 255, 1)`),n.addColorStop(.2,`rgba(255, 255, 255, 0.8)`),n.addColorStop(.5,`rgba(255, 255, 255, 0.3)`),n.addColorStop(1,`rgba(255, 255, 255, 0)`),t.fillStyle=n,t.fillRect(0,0,32,32),new d(e)},N=({numStars:e=500})=>{let t=Math.random()*25+25,n=[];for(let r=0;r<e;r++){let e=Math.acos(Math.random()*2-1),r=Math.random()*2*Math.PI,i=t*Math.sin(e)*Math.cos(r),a=t*Math.sin(e)*Math.sin(r),o=t*Math.cos(e);n.push(i,a,o)}let r=new u;return r.setAttribute(`position`,new b(new Float32Array(n),3)),new i(r,new S({color:16777215,size:.5,map:M(),blending:2,depthWrite:!1,transparent:!0,opacity:.8,sizeAttenuation:!0}))};return _(()=>{if(!T.value)return;let e=new c,t=new s(75,E.value/D.value,.1,1e3);t.position.z=3,A=new g({canvas:T.value,antialias:!0}),A.setSize(E.value,D.value);let n=new m(16777215);n.position.set(2,-.5,1.5),e.add(n);let r=new f;r.rotation.z=-23.4*Math.PI/180,e.add(r);let i=new a,u=new x(1,32),d=new w(u,new C({map:i.load(`textures/earth-daymap-4k.jpg`),roughness:.8,metalness:.1}));r.add(d);let p=new w(u,new o({uniforms:{nightMap:{value:i.load(`textures/earth-nightmap-4k.jpg`)},sunDirection:{value:n.position.clone().normalize()}},vertexShader:`
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
  `,blending:2,transparent:!0,depthWrite:!1}));r.add(p);let h=new v(2236996,.3);e.add(h);let _=new w(u,new C({map:i.load(`textures/earth-clouds-4k.jpg`),blending:2,transparent:!0,depthWrite:!1}));_.scale.setScalar(1.003),r.add(_);let b=new w(new x(1.005,32),new o({uniforms:{sunDirection:{value:n.position.clone().normalize()}},vertexShader:`
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
  `,blending:2,transparent:!0,depthWrite:!1,side:0}));r.add(b);let S=N({numStars:5e3});e.add(S),O=new y({title:`Earth Controls`}),O.domElement.style.left=`16px`,O.domElement.style.right=`auto`,O.domElement.style.top=`16px`,O.domElement.style.zIndex=`1000`,O.domElement.style.maxHeight=`calc(100vh - 32px)`,O.domElement.style.overflow=`auto`;let M={rotation:!0,showDayMap:!0,showNightLights:!0,showClouds:!0,showAtmosphere:!0,showStars:!0,rotationSpeed:.005,ambientLightIntensity:.3},P=O.addFolder(`Visibility`);P.add(M,`showDayMap`).onChange(e=>{d.visible=e}),P.add(M,`showNightLights`).onChange(e=>{p.visible=e}),P.add(M,`showClouds`).onChange(e=>{_.visible=e}),P.add(M,`showAtmosphere`).onChange(e=>{b.visible=e}),P.add(M,`showStars`).onChange(e=>{S.visible=e});let F=O.addFolder(`Animation`);F.add(M,`rotation`).name(`Auto Rotate`),F.add(M,`rotationSpeed`,0,.02,.001).name(`Speed`),O.addFolder(`Lighting`).add(M,`ambientLightIntensity`,0,1,.01).name(`Ambient`).onChange(e=>{h.intensity=e}),k=new l(t,A.domElement),k.enableDamping=!0,k.dampingFactor=.05,k.enableZoom=!0,k.autoRotate=!1,k.rotateSpeed=.5,O.close();let I=()=>{j=requestAnimationFrame(I),M.rotation&&(d.rotation.y+=M.rotationSpeed,p.rotation.y+=M.rotationSpeed,_.rotation.y+=M.rotationSpeed),k.update(),A.render(e,t)};I()}),(e,r)=>(t(),n(`canvas`,{ref_key:`canvas`,ref:T,class:`fixed inset-0 h-full w-full`},null,512))}});export{T as default};