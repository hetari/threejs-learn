import{E as e,K as t,L as n,O as r,v as i,x as a}from"./dist-DoCbJx1k.js";function o(o,s={}){let{radius:c=1,sunDirection:l=new t(2,-.5,1.5).normalize(),showNightMap:u=!0}=s,d=new i;d.rotation.z=-23.4*Math.PI/180;let f=new a(c,32),p=new e(f,new r({map:o.load(`textures/earth-daymap-4k.jpg`),roughness:.8,metalness:.1}));d.add(p);let m,h;u&&(h=new n({uniforms:{nightMap:{value:o.load(`textures/earth-nightmap-4k.jpg`)},sunDirection:{value:l}},vertexShader:`
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      
      void main() {
        vUv = uv;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      uniform sampler2D nightMap;
      uniform vec3 sunDirection;
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      
      void main() {
        float lightIntensity = dot(vWorldNormal, sunDirection);
        float nightVisibility = smoothstep(0.2, -0.2, lightIntensity);
        vec4 nightColor = texture2D(nightMap, vUv);
        gl_FragColor = vec4(nightColor.rgb, nightColor.a * nightVisibility);
      }
    `,blending:2,transparent:!0,depthWrite:!1}),m=new e(f,h),d.add(m));let g=new e(f,new r({map:o.load(`textures/earth-clouds-4k.jpg`),blending:2,transparent:!0,depthWrite:!1}));g.scale.setScalar(1.003),d.add(g);let _=new a(c*1.005,32),v=new n({uniforms:{sunDirection:{value:l}},vertexShader:`
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
      vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
      float fresnel = 1.0 - abs(dot(viewDirection, vWorldNormal));
      fresnel = pow(fresnel, 3.0);
      vec3 atmosphereColor = vec3(0.3, 0.6, 1.0);
      float alpha = fresnel * 0.3;
      gl_FragColor = vec4(atmosphereColor, alpha);
    }
  `,blending:2,transparent:!0,depthWrite:!1,side:0}),y=new e(_,v);return d.add(y),{earthGroup:d,earthMesh:p,nightLightMesh:m,cloudMesh:g,atmosphereMesh:y,updateSunDirection:e=>{h&&h.uniforms.sunDirection.value.copy(e),v.uniforms.sunDirection.value.copy(e)}}}export{o as t};