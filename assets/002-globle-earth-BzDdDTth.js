import{g as e,l as t,o as n,y as r}from"./index-DbiqctCp.js";import{D as i,N as a,P as o,R as s,S as c,U as l,a as u,c as d,i as f,j as p,k as m,l as h,m as g,n as _,r as v,t as y,u as b,y as x,z as S}from"./dist-jvr-fpff.js";import{t as C}from"./OrbitControls-BcmmInZc.js";import{t as w}from"./lil-gui.esm-BsdZdNnU.js";var T=()=>{let e=document.createElement(`canvas`);e.width=32,e.height=32;let t=e.getContext(`2d`),n=t.createRadialGradient(16,16,0,16,16,16);return n.addColorStop(0,`rgba(255, 255, 255, 1)`),n.addColorStop(.2,`rgba(255, 255, 255, 0.8)`),n.addColorStop(.5,`rgba(255, 255, 255, 0.3)`),n.addColorStop(1,`rgba(255, 255, 255, 0)`),t.fillStyle=n,t.fillRect(0,0,32,32),new b(e)},E=({numStars:e=500}={})=>{let t=Math.random()*25+25,n=[];for(let r=0;r<e;r++){let e=Math.acos(Math.random()*2-1),r=Math.random()*2*Math.PI,i=t*Math.sin(e)*Math.cos(r),a=t*Math.sin(e)*Math.sin(r),o=t*Math.cos(e);n.push(i,a,o)}let r=new h;return r.setAttribute(`position`,new d(new Float32Array(n),3)),new a(r,new o({color:16777215,size:.5,map:T(),blending:2,depthWrite:!1,transparent:!0,opacity:.8,sizeAttenuation:!0}))},D=t({__name:`002-globle-earth`,setup(t){let a=r(`canvas`),{width:o,height:d}=y(),h,b,T,D=0;return v(()=>{D&&cancelAnimationFrame(D),b?.dispose(),h?.destroy(),T?.dispose()}),_(()=>{if(!a.value)return;let e=new s,t=new p(75,o.value/d.value,.1,1e3);t.position.z=3,T=new f({canvas:a.value,antialias:!0}),T.setSize(o.value,d.value);let n=new g(16777215);n.position.set(2,-.5,1.5),e.add(n);let r=new x;r.rotation.z=-23.4*Math.PI/180,e.add(r);let _=new l,v=new c(1,32),y=new i(v,new m({map:_.load(`textures/earth-daymap-4k.jpg`),roughness:.8,metalness:.1}));r.add(y);let O=new i(v,new S({uniforms:{nightMap:{value:_.load(`textures/earth-nightmap-4k.jpg`)},sunDirection:{value:n.position.clone().normalize()}},vertexShader:`
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
  `,blending:2,transparent:!0,depthWrite:!1}));r.add(O);let k=new u(2236996,.3);e.add(k);let A=new i(v,new m({map:_.load(`textures/earth-clouds-4k.jpg`),blending:2,transparent:!0,depthWrite:!1}));A.scale.setScalar(1.003),r.add(A);let j=new i(new c(1.005,32),new S({uniforms:{sunDirection:{value:n.position.clone().normalize()}},vertexShader:`
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
  `,blending:2,transparent:!0,depthWrite:!1,side:0}));r.add(j);let M=E({numStars:5e3});e.add(M),h=new w({title:`Earth Controls`}),h.domElement.style.left=`16px`,h.domElement.style.right=`auto`,h.domElement.style.top=`16px`,h.domElement.style.zIndex=`1000`,h.domElement.style.maxHeight=`calc(100vh - 32px)`,h.domElement.style.overflow=`auto`;let N={rotation:!0,showDayMap:!0,showNightLights:!0,showClouds:!0,showAtmosphere:!0,showStars:!0,rotationSpeed:.001,ambientLightIntensity:.3},P=h.addFolder(`Visibility`);P.add(N,`showDayMap`).onChange(e=>{y.visible=e}),P.add(N,`showNightLights`).onChange(e=>{O.visible=e}),P.add(N,`showClouds`).onChange(e=>{A.visible=e}),P.add(N,`showAtmosphere`).onChange(e=>{j.visible=e}),P.add(N,`showStars`).onChange(e=>{M.visible=e});let F=h.addFolder(`Animation`);F.add(N,`rotation`).name(`Auto Rotate`),F.add(N,`rotationSpeed`,0,.02,.001).name(`Speed`),h.addFolder(`Lighting`).add(N,`ambientLightIntensity`,0,1,.01).name(`Ambient`).onChange(e=>{k.intensity=e}),b=new C(t,T.domElement),b.enableDamping=!0,b.dampingFactor=.05,b.enableZoom=!0,b.autoRotate=!1,b.rotateSpeed=.5,h.close();let I=()=>{D=requestAnimationFrame(I),N.rotation&&(y.rotation.y+=N.rotationSpeed,O.rotation.y+=N.rotationSpeed,A.rotation.y+=N.rotationSpeed+.001),b.update(),T.render(e,t)};I()}),(t,r)=>(e(),n(`canvas`,{ref_key:`canvas`,ref:a,class:`fixed inset-0 h-full w-full`},null,512))}});export{D as default};