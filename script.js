/* ---------------- Nav active state + smooth scroll ---------------- */
const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link=>{
  link.addEventListener('click', e=>{
    e.preventDefault();
    document.getElementById(link.dataset.target).scrollIntoView({behavior:'smooth'});
  });
});
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', ()=>{
  let current = sections[0].id;
  sections.forEach(sec=>{
    if(window.scrollY >= sec.offsetTop - 100) current = sec.id;
  });
  navLinks.forEach(l=> l.classList.toggle('active', l.dataset.target === current));
});

/* ---------------- Project data ---------------- */
const projects = [
{
name:"Riverline Tower",
type:"commercial",
loc:"Riverside District",
floors:9,
seed:0,
image:"https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=800"
},

{
name:"Atrium Pavilion",
type:"civic",
loc:"Museum Quarter",
floors:3,
seed:1,
image:"https://images.unsplash.com/photo-1460317442991-0ec209397118?w=800"
},

{
name:"Civic Hall",
type:"civic",
loc:"Old Town Square",
floors:4,
seed:2,
image:"https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=800"
},

{
name:"Terrace Residence",
type:"residential",
loc:"Hillside Row",
floors:5,
seed:3,
image:"https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800"
}
];

const grid = document.getElementById('project-grid');
function renderProjects(filter){
  grid.innerHTML='';
  projects.forEach((p,i)=>{
    if(filter!=='all' && p.type!==filter) return;
    const card = document.createElement('div');
    card.className='project-card';
    card.innerHTML = `
      <div class="p-thumb">

<img src="${p.image}" alt="${p.name}">

<div class="overlay">
MODEL ${String(i+1).padStart(2,'0')}
</div>

</div>
      <div class="p-type">${p.type}</div>
      <div class="p-title">${p.name}</div>
      <div class="p-loc">${p.loc} · ${p.floors} floors</div>
    `;
    card.addEventListener('click', ()=>{
      document.getElementById('modelview').scrollIntoView({behavior:'smooth'});
      document.getElementById('model-select').value = i;
      loadModel(i);
    });
    grid.appendChild(card);
  });
}
renderProjects('all');
document.querySelectorAll('.filter-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    renderProjects(btn.dataset.filter);
  });
});

/* ---------------- Three.js building generator ----------------
   Twin-tone residential tower: a white/grey block on one side and
   a brick-red block on the other, each floor with a projecting
   balcony slab and a dark railing line — same overall language as
   a typical apartment-tower elevation (white facade + brick accent
   + banded balconies), built entirely from primitive geometry.
------------------------------------------------------------------ */
function buildBuilding(seed, floors){
  const group = new THREE.Group();
  const floorMeshes = [];
  const floorH = 0.42;
  const totalW = 2.6 + (seed%2)*0.5;
  const depth  = 1.5 + (seed%3)*0.2;
  const whiteW = totalW*0.52;
  const brickW = totalW*0.48;

  const whiteMat = new THREE.MeshStandardMaterial({color:0xEFEAE0, roughness:0.85, metalness:0.02});
  const brickMat = new THREE.MeshStandardMaterial({color:0x9A4A32, roughness:0.9, metalness:0.02});
  const railMat  = new THREE.MeshStandardMaterial({color:0x2A2A28, roughness:0.6, metalness:0.3});
  const glassMat = new THREE.MeshStandardMaterial({color:0x2E4D66, roughness:0.25, metalness:0.4});
  const balconyFloorMat = new THREE.MeshStandardMaterial({color:0xD9D4C6, roughness:0.8});

  for(let f=0; f<floors; f++){
    const y = f*floorH;
    const floorGroup = new THREE.Group();
    floorGroup.userData.floorIndex = f;

    // --- white block (left half of facade) ---
    const wGeo = new THREE.BoxGeometry(whiteW, floorH*0.92, depth);
    const wMesh = new THREE.Mesh(wGeo, whiteMat.clone());
    wMesh.position.set(-brickW/2, y+floorH/2, 0);
    wMesh.castShadow = true; wMesh.receiveShadow = true;
    wMesh.userData.floorIndex = f;
    floorGroup.add(wMesh); floorMeshes.push(wMesh);

    // --- brick block (right half of facade) ---
    const bGeo = new THREE.BoxGeometry(brickW, floorH*0.92, depth);
    const bMesh = new THREE.Mesh(bGeo, brickMat.clone());
    bMesh.position.set(whiteW/2, y+floorH/2, 0);
    bMesh.castShadow = true; bMesh.receiveShadow = true;
    bMesh.userData.floorIndex = f;
    floorGroup.add(bMesh); floorMeshes.push(bMesh);

    // window strip (glass) on the white side
    const winGeo = new THREE.BoxGeometry(whiteW*0.55, floorH*0.5, 0.04);
    const winMesh = new THREE.Mesh(winGeo, glassMat);
    winMesh.position.set(-brickW/2, y+floorH*0.55, depth/2+0.02);
    winMesh.userData.floorIndex = f;
    floorGroup.add(winMesh); floorMeshes.push(winMesh);

    // balcony slab projecting from the brick side
    const balW = brickW*0.85;
    const balD = 0.42;
    const balGeo = new THREE.BoxGeometry(balW, 0.04, balD);
    const balMesh = new THREE.Mesh(balGeo, balconyFloorMat);
    balMesh.position.set(whiteW/2, y+0.02, depth/2 + balD/2);
    balMesh.castShadow = true; balMesh.receiveShadow = true;
    balMesh.userData.floorIndex = f;
    floorGroup.add(balMesh); floorMeshes.push(balMesh);

    // railing (three thin bars) on the balcony edge
    const railGeo = new THREE.BoxGeometry(balW, 0.16, 0.02);
    const rail = new THREE.Mesh(railGeo, railMat);
    rail.position.set(whiteW/2, y+0.12, depth/2 + balD);
    rail.userData.floorIndex = f;
    floorGroup.add(rail); floorMeshes.push(rail);
    for(let p=-2; p<=2; p++){
      const postGeo = new THREE.BoxGeometry(0.03, 0.2, 0.03);
      const post = new THREE.Mesh(postGeo, railMat);
      post.position.set(whiteW/2 + p*(balW/5), y+0.1, depth/2 + balD);
      post.userData.floorIndex = f;
      floorGroup.add(post); floorMeshes.push(post);
    }

    // edge outline for a clean wireframe read
    const outlineGeo = new THREE.BoxGeometry(totalW, floorH*0.92, depth);
    const edges = new THREE.EdgesGeometry(outlineGeo);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color:0x14304a}));
    line.position.set((whiteW-brickW)/4, y+floorH/2, 0);
    line.userData.isEdge = true;
    line.userData.floorIndex = f;
    floorGroup.add(line);

    group.add(floorGroup);
  }

  // small rooftop water-tank block, echoing the setback tower top
  const tankGeo = new THREE.BoxGeometry(totalW*0.3, 0.3, depth*0.5);
  const tank = new THREE.Mesh(tankGeo, whiteMat.clone());
  tank.position.y = floors*floorH + 0.15;
  tank.castShadow = true;
  group.add(tank);

  // ground plate
  const plateGeo = new THREE.CylinderGeometry(3.2,3.2,0.06,32);
  const plateMat = new THREE.MeshStandardMaterial({color:0x1b2a3f, roughness:0.9});
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.position.y = -0.03;
  plate.receiveShadow = true;
  group.add(plate);

  group.userData.floorMeshes = floorMeshes;
  return group;
}

/* ---------------- Reusable scene factory ---------------- */
function makeScene(container, opts={}){
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(opts.bg || 0x12203A);

  const camera = new THREE.PerspectiveCamera(45, container.clientWidth/container.clientHeight, 0.1, 100);
  camera.position.set(4.5, 3.2, 5.5);
  camera.lookAt(0,1.2,0);

  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffffff, 1.0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024,1024);
  scene.add(sun);
  scene.add(sun.target);

  function setSunAngle(deg){
    const rad = deg * Math.PI/180;
    const dist = 8;
    sun.position.set(Math.cos(rad)*dist, Math.sin(rad)*dist + 1, 3);
    sun.target.position.set(0,1,0);
  }
  setSunAngle(45);

  let target = new THREE.Group();
  scene.add(target);

  // drag to rotate
  let dragging=false, lastX=0, lastY=0;
  let rotY = 0.6, rotX = -0.15;
  let autoRotate = false;
  container.style.touchAction='none';
  container.addEventListener('pointerdown', e=>{dragging=true; lastX=e.clientX; lastY=e.clientY;});
  window.addEventListener('pointerup', ()=>dragging=false);
  window.addEventListener('pointermove', e=>{
    if(!dragging) return;
    rotY += (e.clientX-lastX)*0.008;
    rotX += (e.clientY-lastY)*0.005;
    rotX = Math.max(-0.6, Math.min(0.6, rotX));
    lastX=e.clientX; lastY=e.clientY;
  });
  container.addEventListener('wheel', e=>{
    e.preventDefault();
    camera.position.multiplyScalar(1 + e.deltaY*0.0006);
  }, {passive:false});

  function animate(){
    requestAnimationFrame(animate);
    if(autoRotate) rotY += 0.006;
    target.rotation.y = rotY;
    target.rotation.x = rotX;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', ()=>{
    camera.aspect = container.clientWidth/container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  return {
    scene, camera, renderer, target,
    setSunAngle,
    setAutoRotate:(v)=>autoRotate=v,
    setModel:(group)=>{
      target.clear();
      target.add(group);
    }
  };
}

/* ---------------- Hero viewer ---------------- */
const heroWrap = document.getElementById('canvas-wrap');
const heroScene = makeScene(heroWrap, {bg:0x12203A});
let heroBuilding = buildBuilding(0, 9);
heroScene.setModel(heroBuilding);
heroScene.setAutoRotate(true);

let heroWireOn=false;
document.getElementById('hero-wire-btn').addEventListener('click', e=>{
  heroWireOn=!heroWireOn;
  e.target.classList.toggle('on', heroWireOn);
  heroBuilding.traverse(o=>{ if(o.isMesh && !o.userData.isEdge) o.visible = !heroWireOn; });
});
let heroSpinOn=true;
document.getElementById('hero-spin-btn').addEventListener('click', e=>{
  heroSpinOn=!heroSpinOn;
  e.target.classList.toggle('on', heroSpinOn);
  heroScene.setAutoRotate(heroSpinOn);
});
document.getElementById('hero-spin-btn').classList.add('on');

/* ---------------- Model view (advanced controls) ---------------- */
const bigWrap = document.getElementById('big-canvas-wrap');
const bigScene = makeScene(bigWrap, {bg:0x0c1626});
let currentGroup = null;
let currentFloorFilter = 'all';

function loadModel(index){
  const p = projects[index];
  currentGroup = buildBuilding(p.seed, p.floors);
  bigScene.setModel(currentGroup);
  wireOn = false;
  document.getElementById('wire-switch').classList.remove('on');
  currentFloorFilter = 'all';
  renderFloorChips(p.floors);
  applyWire();
  applyFloorFilter();
}

function renderFloorChips(floors){
  const wrap = document.getElementById('floor-chips');
  wrap.innerHTML = '';
  const allChip = document.createElement('button');
  allChip.className='floor-chip on';
  allChip.textContent='All';
  allChip.addEventListener('click', ()=>{ currentFloorFilter='all'; refreshChips(); applyFloorFilter(); document.getElementById('floor-val').textContent='All floors'; });
  wrap.appendChild(allChip);
  for(let f=0; f<floors; f++){
    const chip = document.createElement('button');
    chip.className='floor-chip';
    chip.textContent = 'F'+(f+1);
    chip.addEventListener('click', ()=>{
      currentFloorFilter = f;
      refreshChips();
      applyFloorFilter();
      document.getElementById('floor-val').textContent = 'Floor '+(f+1)+' isolated';
    });
    wrap.appendChild(chip);
  }
  function refreshChips(){
    Array.from(wrap.children).forEach((c,i)=>{
      c.classList.toggle('on', (i===0 && currentFloorFilter==='all') || (i>0 && currentFloorFilter===i-1));
    });
  }
}

function applyFloorFilter(){
  if(!currentGroup) return;
  currentGroup.traverse(o=>{
    if(o.userData.floorIndex !== undefined){
      o.visible = currentFloorFilter==='all' ? true : o.userData.floorIndex===currentFloorFilter;
    }
  });
}

let wireOn=false;
function applyWire(){
  if(!currentGroup) return;
  currentGroup.traverse(o=>{
    if(o.isMesh && !o.userData.isEdge) o.visible = !wireOn;
  });
}
document.getElementById('wire-switch').addEventListener('click', e=>{
  wireOn = !wireOn;
  e.target.classList.toggle('on', wireOn);
  applyWire();
});

document.getElementById('sun-slider').addEventListener('input', e=>{
  document.getElementById('sun-val').textContent = e.target.value+'°';
  bigScene.setSunAngle(Number(e.target.value));
});

document.getElementById('model-select').addEventListener('change', e=>{
  loadModel(Number(e.target.value));
});

loadModel(0);

/* ---------------- Inquiry form ---------------- */
document.getElementById('inquiry-form').addEventListener('submit', e=>{
  e.preventDefault();
  const name = document.getElementById('f-name').value;
  document.getElementById('form-msg').textContent = `Thanks, ${name}. Your inquiry has been noted — we'll reply within two working days.`;
  e.target.reset();
});
/* ===== Animated Counter ===== */

const counters=document.querySelectorAll(".counter");

const speed=120;

counters.forEach(counter=>{

const update=()=>{

const target=+counter.getAttribute("data-target");

const count=+counter.innerText;

const inc=Math.ceil(target/speed);

if(count<target){

counter.innerText=count+inc;

setTimeout(update,20);

}
else{

counter.innerText=target;

}

}

update();

});/* ==========================
   Loading Screen
========================== */

window.addEventListener("load",()=>{

setTimeout(()=>{

document.getElementById("loader").style.opacity="0";

setTimeout(()=>{

document.getElementById("loader").style.display="none";

},800);

},1200);

});


/* ==========================
   Scroll Reveal
========================== */

const reveals=document.querySelectorAll(".reveal");

function revealSections(){

reveals.forEach(section=>{

const top=section.getBoundingClientRect().top;

const visible=window.innerHeight-120;

if(top<visible){

section.classList.add("active");

}

});

}

window.addEventListener("scroll",revealSections);

revealSections();/* ==========================
   Scroll To Top
========================== */

const scrollBtn=document.getElementById("scrollTopBtn");

window.addEventListener("scroll",()=>{

if(window.scrollY>400){

scrollBtn.style.display="block";

}else{

scrollBtn.style.display="none";

}

});

scrollBtn.onclick=()=>{

window.scrollTo({

top:0,

behavior:"smooth"

});

};

/* ==========================
   Dark Mode
========================== */

const themeBtn=document.getElementById("themeToggle");

themeBtn.onclick=()=>{

document.body.classList.toggle("dark-mode");

if(document.body.classList.contains("dark-mode")){

themeBtn.innerHTML="☀️";

}else{

themeBtn.innerHTML="🌙";

}

};