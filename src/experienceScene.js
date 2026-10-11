import * as THREE from 'three';

export function createExperienceScene(host, onLost) {
  const mobile = matchMedia('(max-width:800px)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1 : 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0xedece6, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-6,6,6,-6,.1,100);
  const world = new THREE.Group(); scene.add(world);
  const textures = [];
  function noiseTexture() {
    const c=document.createElement('canvas'); c.width=c.height=256;
    const ctx=c.getContext('2d');const img=ctx.createImageData(256,256);let seed=93;
    for(let i=0;i<img.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const v=155+(seed%75);img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=255;}
    ctx.putImageData(img,0,0);const texture=new THREE.CanvasTexture(c);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(3,3);textures.push(texture);return texture;
  }
  const concreteTexture=noiseTexture();
  const concrete=new THREE.MeshStandardMaterial({color:0xc9c6bb,roughness:.92,map:concreteTexture,bumpMap:concreteTexture,bumpScale:.025});
  const lightConcrete=new THREE.MeshStandardMaterial({color:0xe0ddd0,roughness:.9,map:concreteTexture,bumpMap:concreteTexture,bumpScale:.012});
  const darkConcrete=new THREE.MeshStandardMaterial({color:0x7e8279,roughness:1});
  const wood=new THREE.MeshStandardMaterial({color:0x886342,roughness:.72});
  const black=new THREE.MeshStandardMaterial({color:0x252e2b,roughness:.58});
  const glass=new THREE.MeshStandardMaterial({color:0x547171,metalness:.35,roughness:.15,transparent:true,opacity:.38,depthWrite:false});
  const membrane=new THREE.MeshStandardMaterial({color:0xefbd06,roughness:.6});
  const soil=new THREE.MeshStandardMaterial({color:0x4e5140,roughness:1});
  const leaf=new THREE.MeshStandardMaterial({color:0x727c51,roughness:1,flatShading:false});
  const cream=new THREE.MeshStandardMaterial({color:0xd6c9ae,roughness:1});
  const box=(w,h,d,x,y,z,mat=concrete,parent=world)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  // A compact two-storey architectural study, constructed at illustrative scale.
  box(6.8,.38,5.5,0,-.2,0,lightConcrete);
  box(5.1,.16,3.7,.25,.08,-.25,lightConcrete);
  box(5.1,3.25,.18,.25,1.7,-2,concrete);
  box(.18,3.25,3.5,2.72,1.7,-.25,concrete);
  box(.18,3.25,3.5,-2.22,1.7,-.25,lightConcrete);
  box(5.35,.2,3.95,.25,1.72,-.25,concrete);
  // Warm interiors behind a finely divided glass facade.
  for(const y of [.9,2.55]){
    box(4.75,1.5,.035,.25,y,1.46,glass);
    for(let i=0;i<7;i++)box(.035,1.55,.05,-2.1+i*.79,y,1.48,black);
    box(4.85,.035,.055,.25,y-.76,1.48,black);
    box(4.85,.035,.055,.25,y+.76,1.48,black);
    for(let i=0;i<13;i++)box(.035,1.45,.09,1.2+i*.105,y,1.55,wood);
    for(let i=0;i<9;i++)box(.035,1.45,.09,-2.05+i*.10,y,1.55,wood);
    box(1.25,.23,.56,.2,y-.49,.68,cream);
    box(1.25,.4,.12,.2,y-.3,.4,cream);
    box(.6,.055,.45,.2,y-.6,1.13,wood);
    for(const x of [-.03,.43])box(.035,.22,.035,x,y-.74,1.13,black);
  }
  // Entry steps and paving joints.
  for(let i=0;i<3;i++)box(2.3,.06+i*.04,.24,.25,-.06+i*.045,2.35-i*.24,lightConcrete);
  for(let i=0;i<8;i++)box(.01,.002,1.0,-2.8+i*.8,.002,2.1,darkConcrete);
  box(1.0,.22,3.55,-2.84,.01,-.25,lightConcrete);box(.86,.03,3.4,-2.84,.14,-.25,soil);
  box(.8,.18,1.6,2.9,.01,1.05,lightConcrete);box(.7,.025,1.48,2.9,.12,1.05,soil);
  const sphereGeometry=new THREE.IcosahedronGeometry(1,2);
  function tree(x,z,scale=1){
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.035,.065,1.25*scale,8),wood);trunk.position.set(x,.67*scale,z);trunk.castShadow=true;world.add(trunk);
    for(let i=0;i<18;i++){const angle=i*2.399;const radius=.17+Math.sqrt(i/18)*.37;const mesh=new THREE.Mesh(sphereGeometry,leaf);mesh.position.set(x+Math.cos(angle)*radius*scale,1.1*scale+Math.sin(i*3.1)*.28*scale,z+Math.sin(angle)*radius*scale);mesh.scale.set(.23*scale,.24*scale,.25*scale);mesh.castShadow=true;world.add(mesh);}
  }
  tree(-2.85,.55,1.15);tree(2.9,.95,.68);
  for(let i=0;i<13;i++){const m=new THREE.Mesh(sphereGeometry,leaf);m.position.set(-2.85,.21,-1.8+i*.23);m.scale.set(.19,.2+(i%3)*.045,.2);m.castShadow=true;world.add(m);}
  const structure=new THREE.Group(),barrier=new THREE.Group(),finish=new THREE.Group();world.add(structure,barrier,finish);
  box(5.4,.24,4.0,.25,3.4,-.25,concrete,structure);
  box(5.34,.055,3.94,.25,3.55,-.25,membrane,barrier);
  box(5.4,.11,4.0,.25,3.65,-.25,lightConcrete,finish);
  for(const z of [-2.2,1.7])box(5.4,.18,.09,.25,3.78,z,concrete,finish);
  for(const x of [-2.4,2.9])box(.09,.18,3.8,x,3.78,-.25,concrete,finish);
  // Fine roof joints reinforce scale without a distracting texture map.
  for(let i=0;i<6;i++)box(.008,.002,3.75,-2+i*.9,3.707,-.25,darkConcrete,finish);
  box(.6,.2,.55,1.98,3.82,-1.35,lightConcrete,finish);box(.32,.025,.28,1.98,3.935,-1.35,black,finish);
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.15}));plane.rotation.x=-Math.PI/2;plane.position.y=-.4;plane.receiveShadow=true;scene.add(plane);
  scene.add(new THREE.HemisphereLight(0xfffaf0,0x797e75,2.9));
  const sun=new THREE.DirectionalLight(0xfff1d8,3.4);sun.position.set(-3,9,6);sun.castShadow=true;sun.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.1,far:25});sun.shadow.normalBias=.03;scene.add(sun);
  // Rain is an illustrative exposure cue, never a product performance simulation.
  const count=mobile?100:230;const rainPositions=new Float32Array(count*6);const rainSeeds=Array.from({length:count},(_,i)=>({x:Math.sin(i*127.1)*2.5+.25,z:Math.sin(i*311.7)*1.85-.25,phase:((i*0.618)%1)}));
  const rainGeometry=new THREE.BufferGeometry();rainGeometry.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));
  const rainMaterial=new THREE.LineBasicMaterial({color:0x789b9f,transparent:true,opacity:0});const rain=new THREE.LineSegments(rainGeometry,rainMaterial);world.add(rain);
  let p=0,target=0,still=false,frame=0,last=0,time=0,visible=true,disposed=false;
  function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);const aspect=w/h;const height=mobile?10:8.7;camera.left=-height*aspect/2;camera.right=height*aspect/2;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();request();}
  function draw(now){frame=0;if(disposed||!visible||document.hidden)return;const dt=Math.min((now-last)/1000||0,.05);last=now;time+=still?0:dt;
    p=still?target:THREE.MathUtils.damp(p,target,8,dt||.016);
    const lift=Math.sin(Math.min(1,Math.max(0,(p-.13)/.73))*Math.PI);const expansion=Math.pow(Math.max(0,lift),1.4);
    structure.position.y=expansion*.14;barrier.position.y=expansion*.88;finish.position.y=expansion*1.75;
    world.rotation.y=-.17+(still?0:p*.14);
    camera.position.set(7.8,6.8+expansion*.7,9);camera.lookAt(.05,1.85+expansion*.45,0);
    rainMaterial.opacity=p>.74?(p-.74)/.26*.4:0;
    rain.visible=rainMaterial.opacity>.01&&!still;
    if(rain.visible){for(let i=0;i<count;i++){const q=rainSeeds[i];const y=3.91+((q.phase-time*.65)%1+1)%1*3.8;const offset=i*6;rainPositions[offset]=q.x;rainPositions[offset+1]=y;rainPositions[offset+2]=q.z;rainPositions[offset+3]=q.x+.02;rainPositions[offset+4]=y+.16;rainPositions[offset+5]=q.z; }rainGeometry.attributes.position.needsUpdate=true;}
    renderer.render(scene,camera);
    if(Math.abs(p-target)>.0005||rain.visible)request();
  }
  function request(){if(!frame&&!disposed&&visible&&!document.hidden)frame=requestAnimationFrame(draw);}
  const observer=new ResizeObserver(resize);observer.observe(host);
  const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible){last=performance.now();request();}else{cancelAnimationFrame(frame);frame=0;}},{threshold:0});intersection.observe(host);
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{last=performance.now();request();}};document.addEventListener('visibilitychange',visibility);
  const lost=e=>{e.preventDefault();cancelAnimationFrame(frame);disposed=true;onLost();};renderer.domElement.addEventListener('webglcontextlost',lost);
  resize();
  return {set(value,staticMode){target=value;still=staticMode;if(still)p=target;request();},dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',visibility);renderer.domElement.removeEventListener('webglcontextlost',lost);const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();}};
}
