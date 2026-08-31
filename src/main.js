import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import URDFLoader from 'urdf-loader';
import './style.css';

const app = document.querySelector('#app');
app.innerHTML = `
  <main class="shell">
    <section class="workspace"><div id="viewport"></div><div class="hud"><span class="dot"></span> URDF 实时关节控制</div><div id="status" class="status">正在加载无人机模型…</div></section>
    <aside class="panel"><header><p class="eyebrow">TS DRONE / CONTROL</p><h1>天枢无人机控制台</h1><p class="sub">键盘与面板实时驱动模型关节</p></header>
      <section class="keyboard"><div><kbd>[</kbd><kbd>]</kbd><span>选择关节</span></div><div><kbd>←</kbd><kbd>→</kbd><span>微调运动</span></div><div><kbd>R</kbd><span>旋翼启停</span><kbd>0</kbd><span>复位</span></div></section>
      <section class="rotor-console"><div><span class="spin-mark">✦</span><div><strong>旋翼联动</strong><small id="rotor-state">等待启动</small></div><button id="rotor-toggle">启动旋翼</button></section>
      <div class="filters"><button class="filter active" data-filter="all">全部</button><button class="filter" data-filter="rotor">旋翼</button><button class="filter" data-filter="arm">机械臂</button><button class="filter" data-filter="tool">末端执行器</button></div>
      <div id="joint-list" class="joint-list"></div>
    </aside>
  </main>`;

const view = document.querySelector('#viewport'), status = document.querySelector('#status'), list = document.querySelector('#joint-list');
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x07131f);
const camera = new THREE.PerspectiveCamera(42, 1, .01, 100); camera.position.set(1.6, -1.8, 1.15);
const renderer = new THREE.WebGLRenderer({antialias:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); view.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement); controls.target.set(0,0,.22); controls.enableDamping=true; controls.dampingFactor=.06;
scene.add(new THREE.HemisphereLight(0xc6efff,0x122636,2.4)); const key = new THREE.DirectionalLight(0xffffff,2.5); key.position.set(2,-3,4); scene.add(key);
const grid = new THREE.GridHelper(4,24,0x23566c,0x133545); grid.position.z=-.08; scene.add(grid);
const ground = new THREE.Mesh(new THREE.CircleGeometry(1.7,64),new THREE.MeshStandardMaterial({color:0x0a2432,metalness:.25,roughness:.7,transparent:true,opacity:.65})); ground.rotation.x=-Math.PI/2; ground.position.z=-.085; scene.add(ground);
const clock=new THREE.Clock(); let robot, joints=[], selected=0, filter='all', rotorsRunning=false; const values={};
const assetBase = `${import.meta.env.BASE_URL}robot/`;
const loader=new URDFLoader(); loader.packages={'天枢无人机完整版(更换悬垂式绝缘子串)':assetBase};
loader.load(`${assetBase}drone.urdf`, r => {
  robot=r; robot.rotation.x=-Math.PI/2; robot.traverse(o=>{if(o.isMesh){o.material=new THREE.MeshStandardMaterial({color:o.name.includes('left')||o.name.includes('right')?0xffa11c:0x42b8e8,metalness:.55,roughness:.3}); o.castShadow=true;}}); scene.add(robot);
  joints=Object.values(robot.joints).filter(j=>j.jointType!=='fixed'); joints.forEach(j=>values[j.name]=0); status.textContent=`已加载 ${joints.length} 个可动关节 · 选择关节后直接控制`; renderList(); resize();
}, undefined, e=>status.textContent='模型加载失败：请通过本地服务器打开网站。');

const groupOf=n=>/^[1-4]$/.test(n)?'rotor':/^(left|right)/.test(n)||/^[5-7]$/.test(n)?'arm':'tool';
const label=n=>({1:'旋翼 1',2:'旋翼 2',3:'旋翼 3',4:'旋翼 4',5:'左侧关节',6:'右侧关节',7:'旋转基座',zhua:'夹爪升降'})[n]||n.replace('left','左臂 ').replace('right','右臂 ');
function bounds(j){ const l=j.limit||{}; return [Number.isFinite(l.lower)?l.lower:(j.jointType==='continuous'?-Math.PI:0),Number.isFinite(l.upper)?l.upper:(j.jointType==='continuous'?Math.PI:1)]; }
function displayValue(j,v){return j.jointType==='continuous'?THREE.MathUtils.euclideanModulo(v+Math.PI,Math.PI*2)-Math.PI:v;}
function unit(j,v){return j.jointType==='prismatic'?`${(v*1000).toFixed(0)} mm`:`${THREE.MathUtils.radToDeg(displayValue(j,v)).toFixed(1)}°`;}
function setJoint(i,v){ if(!robot) return; const j=joints[i],[lo,hi]=bounds(j); values[j.name]=j.jointType==='continuous'?v:THREE.MathUtils.clamp(v,lo,hi); j.setJointValue(values[j.name]); updateCard(i); }
function step(i,dir){const j=joints[i];setJoint(i,values[j.name]+dir*(j.jointType==='prismatic'?.005:THREE.MathUtils.degToRad(3)));}
function updateCard(i){const j=joints[i],card=list.querySelector(`[data-name="${CSS.escape(j.name)}"]`);if(!card)return;card.querySelector('input').value=displayValue(j,values[j.name]);card.querySelector('.value').textContent=unit(j,values[j.name]);list.querySelectorAll('.joint').forEach((x,k)=>x.classList.toggle('selected',k===selected));}
function renderList(){list.innerHTML=''; joints.forEach((j,i)=>{if(filter!=='all'&&groupOf(j.name)!==filter)return;const [lo,hi]=bounds(j), card=document.createElement('article');card.className='joint';card.dataset.name=j.name;card.innerHTML=`<div class="joint-top"><button class="tag">${groupOf(j.name)}</button><span class="key">${i===selected?'ACTIVE':''}</span></div><div class="joint-title"><span class="joint-icon ${groupOf(j.name)}"></span><strong>${label(j.name)}</strong><small>${j.jointType}</small></div><div class="control"><button class="nudge minus" aria-label="减小">−</button><input type="range" min="${lo}" max="${hi}" step="${j.jointType==='prismatic'?'.001':'.01'}" value="${values[j.name]||0}"><button class="nudge plus" aria-label="增大">＋</button><output class="value">${unit(j,values[j.name]||0)}</output></div>`;
  card.addEventListener('click',()=>{selected=i;renderList();});card.querySelector('input').addEventListener('input',e=>setJoint(i,+e.target.value));card.querySelector('.minus').addEventListener('click',e=>{e.stopPropagation();step(i,-1)});card.querySelector('.plus').addEventListener('click',e=>{e.stopPropagation();step(i,1)});list.appendChild(card);});}
function reset(){rotorsRunning=false; updateRotorUI(); joints.forEach((j,i)=>setJoint(i,0));}
function toggleRotors(){rotorsRunning=!rotorsRunning;updateRotorUI();}
function updateRotorUI(){document.querySelector('#rotor-toggle').textContent=rotorsRunning?'停止旋翼':'启动旋翼';document.querySelector('#rotor-state').textContent=rotorsRunning?'旋翼正在持续转动':'等待启动';document.querySelector('.rotor-console').classList.toggle('running',rotorsRunning);}
document.querySelector('#rotor-toggle').onclick=toggleRotors;
window.addEventListener('keydown',e=>{if(!joints.length)return;let used=true;if(e.key==='['||e.key==='ArrowUp'){selected=(selected-1+joints.length)%joints.length;renderList();}else if(e.key===']'||e.key==='ArrowDown'){selected=(selected+1)%joints.length;renderList();}else if(e.key==='ArrowLeft'||e.key==='-'){step(selected,-1);}else if(e.key==='ArrowRight'||e.key==='+'||e.key==='='){step(selected,1);}else if(e.key.toLowerCase()==='r'){toggleRotors();}else if(e.key==='0'){reset();}else used=false;if(used)e.preventDefault();},{capture:true});
document.querySelectorAll('.filter').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x===b));renderList();});
function resize(){const r=view.getBoundingClientRect();camera.aspect=r.width/r.height;camera.updateProjectionMatrix();renderer.setSize(r.width,r.height,false);}new ResizeObserver(resize).observe(view);
function animate(){requestAnimationFrame(animate);const dt=clock.getDelta();if(rotorsRunning&&joints.length)joints.forEach((j,i)=>{if(groupOf(j.name)==='rotor')setJoint(i,values[j.name]+dt*12);});controls.update();renderer.render(scene,camera);}animate();
