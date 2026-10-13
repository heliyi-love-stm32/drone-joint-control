import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import URDFLoader from 'urdf-loader';
import './style.css';

const app=document.querySelector('#app');
app.innerHTML=`<main class="console"><header><div class="brand">✦ <b>天枢</b><small>TS DRONE · DIGITAL TWIN</small></div><div class="pills"><i>● 遥测在线</i><button class="mode active" id="simMode">仿真模式</button><i>GPS RTK FIX</i><i id="clock">--:--:--</i></div><button class="danger" id="stop">紧急停止</button></header><div class="board"><aside class="health"><p class="eyebrow">FLIGHT HEALTH</p><h2>设备状态</h2><section class="card battery"><div class="title">智能电池 <b>NORMAL</b></div><div class="batteryTop"><strong id="soc">86<small>%</small></strong><div><b id="remain">32:40</b><span>预计剩余续航</span><em><i id="socbar"></i></em></div></div><div class="grid"><div>总电压<b id="volt">50.2 V</b></div><div>电流<b id="amp">8.4 A</b></div><div>温度<b id="temp">31.6 °C</b></div><div>健康度<b>98 %</b></div></div><p class="cell">单体压差 <b id="delta">0.012 V</b></p></section><section class="card"><div class="title">飞行与通信 <b>HEALTHY</b></div><dl><dt>● 飞控状态</dt><dd>定点悬停</dd><dt>姿态角</dt><dd id="attitude">+1.2° / -0.8°</dd><dt>高度 / 速度</dt><dd>12.4 m · 0.0 m/s</dd><dt>卫星 / 精度</dt><dd>19 · 0.03 m</dd><dt>链路延迟</dt><dd id="latency">28 ms</dd></dl></section><div class="motors"><div>M1<b id="m1">0</b><small>RPM</small></div><div>M2<b id="m2">0</b><small>RPM</small></div><div>M3<b id="m3">0</b><small>RPM</small></div><div>M4<b id="m4">0</b><small>RPM</small></div></div><section class="card alert"><div class="title">实时告警 <b id="alerts">0 条</b></div><p id="alertText">当前没有待处理告警</p></section></aside><section class="twin"><div id="viewport"></div><div class="hud">● 三维数字孪生 <small>点击视窗接管键盘 · Esc 退出</small></div><div id="status">正在加载无人机模型…</div><div class="overlay"><span>当前任务 <b id="missionName">待命</b></span><span>执行进度 <b id="missionPct">—</b></span><span>机械臂 <b>可控</b></span></div><div class="timeline"><div><p>MISSION TIMELINE</p><b id="timelineName">未选择任务</b><span id="timelineState">STANDBY</span></div><em><i id="progress"></i></em><small>起始　　航点 01　　作业点　　返航</small></div></section><aside class="control"><section class="card camera"><div class="title">云台相机 <b class="live">● LIVE</b></div><div class="feed"><i></i><b>CAM-01 · 4K / 30</b><span id="zoomLabel">1.0×</span><small>N 30.53428°　E 114.36621°</small></div><div class="gimbal"><label>云台水平<input id="pan" type="range" min="-180" max="180" value="0"></label><label>云台俯仰<input id="tilt" type="range" min="-90" max="30" value="-12"></label><label>光学变焦<input id="zoom" type="range" min="10" max="40" value="10"></label></div><div class="buttons"><button id="home">回中</button><button id="photo">拍照</button><button id="record">开始录像</button></div></section><nav><button class="tab active" data-tab="task">任务执行</button><button class="tab" data-tab="joint">关节控制</button></nav><div class="page active" data-page="task"><section class="card"><div class="title">预定轨迹 <b>SIMULATION</b></div><select id="route"><option>巡检航线 A · 8 个航点</option><option>悬垂绝缘子作业 · 机械臂协同</option><option>定点扫描 · 云台巡航</option></select><p class="meta">预计 <b>03:20</b>　安全校验 <b>通过</b></p><div class="buttons"><button id="preview">三维预览</button><button class="primary" id="run">执行轨迹</button></div><button class="wide" id="cancel">停止当前任务</button></section><section class="card"><div class="title">机械臂轨迹记忆 <b id="trackCount">0 条</b></div><p class="hint">记录当前关节关键点，保存后可在仿真环境回放。</p><div class="buttons"><button id="recordArm">开始记录</button><button id="keyframe">记忆关键点</button><button id="saveTrack">保存轨迹</button></div><div id="tracks" class="tracks">尚未保存机械臂轨迹</div></section><section class="position-card"><div><span>相对电线杆位置</span><small>电线杆固定 · 单位 m</small></div><label>X 横向 <input id="droneX" type="range" min="-8" max="8" step="0.1" value="0"><b id="droneXValue">0.00</b></label><label>Y 纵向 <input id="droneY" type="range" min="-8" max="8" step="0.1" value="0"><b id="droneYValue">0.00</b></label><label>Z 高度 <input id="droneZ" type="range" min="-2" max="8" step="0.1" value="0"><b id="droneZValue">0.00</b></label><div class="position-actions"><button id="resetPosition">回到电线杆参考点</button></div><small class="move-help">键盘：W/S → Y 轴 · A/D → Z 轴 · Q/E → X 轴</small></section><section class="rotor-card"><div><span>✦ 旋翼联动</span><small id="rotorRpm">待机 · 0 RPM</small></div><button id="rotors">一键启动旋翼</button><label>转速 <input id="rotorSpeed" type="range" min="10" max="100" value="60"><b id="rotorSpeedValue">60%</b></label></section><div class="quick"><button id="reset">↺<small>关节复位</small></button><button id="stow">⌁<small>机械臂收纳</small></button></div></div><div class="page" data-page="joint"><div class="keys">[ ] 选择关节　← → 微调　0 复位</div><div class="filters"><button data-filter="all" class="active">全部</button><button data-filter="rotor">旋翼</button><button data-filter="arm">机械臂</button><button data-filter="tool">末端</button></div><div id="jointList"></div></div></aside></div><footer>EVENT LOG　<span id="event">系统已初始化，等待模型加载。</span><small>所有任务均处于仿真演示模式</small></footer></main>`;
const $=s=>document.querySelector(s),event=t=>$('#event').textContent=new Date().toLocaleTimeString('zh-CN',{hour12:false})+' · '+t;
$('.hud small').id='keyboardHint';
$('.hud').insertAdjacentHTML('beforeend','<small id="keyboardDebug">键盘诊断：等待 W/S/A/D/Q/E</small>');
$('.move-help').textContent='键盘控制已启用 · W/S → Y · A/D → Z · Q/E → X';
let lastKeyDownAt=0;
const movementByCode={KeyW:['Y',1],KeyS:['Y',-1],KeyA:['Z',1],KeyD:['Z',-1],KeyQ:['X',1],KeyE:['X',-1]};
const movementByKey={w:movementByCode.KeyW,s:movementByCode.KeyS,a:movementByCode.KeyA,d:movementByCode.KeyD,q:movementByCode.KeyQ,e:movementByCode.KeyE};
const heldMovementKeys=new Map();
const heldKeyTimes=new Map(),heldKeyTimers=new Map();
let heldMotionSteps=0;
queueMicrotask(()=>{
  $('#keyboardHint').textContent='键盘控制已启用 · W/S 纵向 · A/D 高度 · Q/E 横向';
  const handleMovementKey=e=>{
    if(e.code==='Escape'){
      heldMovementKeys.clear();
      $('#keyboardHint').textContent='键盘控制已启用 · W/S 纵向 · A/D 高度 · Q/E 横向';
      return;
    }
    if(e.__droneKeyboardHandled)return;
    const movement=movementByCode[e.code]||movementByKey[e.key?.toLowerCase()];
    if(!movement)return;
    if(e.ctrlKey||e.altKey||e.metaKey)return;
    if(e.target instanceof HTMLTextAreaElement||e.target instanceof HTMLSelectElement||e.target instanceof HTMLInputElement&&e.target.type!=='range')return;
    e.__droneKeyboardHandled=true;
    e.preventDefault();
    e.stopImmediatePropagation();
    const keyId=e.code||e.key;
    if(e.type==='keydown'){
      const oldTimer=heldKeyTimers.get(keyId);
      if(oldTimer)clearTimeout(oldTimer);
      heldKeyTimers.delete(keyId);
      if(!heldMovementKeys.has(keyId))moveDrone(movement[0],movement[1]*.035);
      heldMovementKeys.set(keyId,movement);
      heldKeyTimes.set(keyId,performance.now());
      heldMotionSteps=0;
      lastKeyDownAt=performance.now();
      $('#keyboardHint').textContent=`持续移动中 · ${e.code||e.key} · 松开停止`;
      $('#keyboardDebug').textContent=`诊断：收到 keydown ${keyId} · 持续状态已建立`;
    }else{
      const wasHeld=heldMovementKeys.delete(keyId);
      const heldFor=performance.now()-(heldKeyTimes.get(keyId)||0);
      heldKeyTimes.delete(keyId);
      if(wasHeld&&heldFor<40){
        // Some embedded browsers emit keyup immediately after keydown. Keep a
        // short, slow motion window so a real physical hold remains visible.
        heldMovementKeys.set(keyId,movement);
        heldKeyTimers.set(keyId,setTimeout(()=>{
          heldMovementKeys.delete(keyId);
          heldKeyTimers.delete(keyId);
        },1200));
      }else if(!wasHeld&&performance.now()-lastKeyDownAt>=120){
        // Fallback for browsers that only forward keyup events.
        heldMovementKeys.set(keyId,movement);
        heldKeyTimers.set(keyId,setTimeout(()=>{
          heldMovementKeys.delete(keyId);
          heldKeyTimers.delete(keyId);
        },700));
      }
      if(!heldMovementKeys.size)$('#keyboardHint').textContent='键盘控制已启用 · W/S 纵向 · A/D 高度 · Q/E 横向';
      $('#keyboardDebug').textContent=`诊断：收到 keyup ${keyId} · 按下 ${heldFor.toFixed(0)} ms · 连续步数 ${heldMotionSteps} · Y ${$('#droneYValue').textContent} m`;
    }
  };
  // The in-app browser may forward keys to window, document, or canvas.
  // All three use one deduplicated handler, so a key moves exactly once.
  [window,document,renderer.domElement].forEach(target=>{
    target.addEventListener('keydown',handleMovementKey,true);
    target.addEventListener('keyup',handleMovementKey,true);
    // Embedded-browser key forwarding can bypass capture phase. Register the
    // same deduplicated handler in the normal bubbling phase as a fallback.
    target.addEventListener('keydown',handleMovementKey);
    target.addEventListener('keyup',handleMovementKey);
  });
  document.body.tabIndex=-1;
  const focusKeyboard=()=>{window.focus();renderer.domElement.focus({preventScroll:true});};
  focusKeyboard();
  setTimeout(focusKeyboard,250);
  // Panel coordinates use Z for height; Three.js uses Y for height and Z for depth.
  const sceneAxisForRelativeAxis={X:'x',Y:'z',Z:'y'};
  updateDronePosition=()=>{
    const nextPosition=new THREE.Vector3();
    ['X','Y','Z'].forEach(axis=>{
      const value=+$('#drone'+axis).value;
      $('#drone'+axis+'Value').textContent=value.toFixed(2);
      nextPosition[sceneAxisForRelativeAxis[axis]]=value;
    });
    if(!droneAnchor)return;
    const cameraDelta=nextPosition.clone().sub(droneAnchor.position);
    droneAnchor.position.copy(nextPosition);
    camera.position.add(cameraDelta);
    orbit.target.add(cameraDelta);
    event('无人机相对电线杆位置已更新。');
  };
  ['X','Y','Z'].forEach(axis=>{
    $('#drone'+axis).oninput=updateDronePosition;
    $('#drone'+axis).step='any';
  });
  // Keep held-key motion independent from the WebGL render loop. Some embedded
  // browsers throttle animation frames while still forwarding one key press.
  setInterval(()=>{
    if(droneAnchor&&heldMovementKeys.size){
      for(const [axis,direction] of heldMovementKeys.values())moveDrone(axis,direction*.28/30);
      heldMotionSteps++;
      if(heldMotionSteps%15===0)$('#keyboardDebug').textContent=`诊断：连续移动中 · 步数 ${heldMotionSteps} · Y ${$('#droneYValue').textContent} m`;
    }
  },1000/30);
  const setReferenceCamera=()=>{
    if(!droneAnchor){requestAnimationFrame(setReferenceCamera);return;}
    // Match the requested pole-centred, elevated near view.
    camera.position.set(4.2,5.6,4.9);
    orbit.target.set(0,1.6,0);
    camera.updateProjectionMatrix();
    orbit.update();
  };
  setReferenceCamera();
});
const scene=new THREE.Scene();scene.background=new THREE.Color(0x07131f);const camera=new THREE.PerspectiveCamera(42,1,.01,100);camera.position.set(1.6,-1.8,1.15);const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));$('#viewport').append(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','无人机仿真视窗');const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,0,.22);orbit.enableDamping=true;scene.add(new THREE.HemisphereLight(0xc6efff,0x122636,2.4));const light=new THREE.DirectionalLight(0xffffff,2.5);light.position.set(2,-3,4);scene.add(light);const grid=new THREE.GridHelper(4,24,0x23566c,0x133545);grid.position.z=-.08;scene.add(grid);
let robot,droneAnchor,pole,joints=[],selected=0,filter='all',rotor=false,running=false,pct=0,recording=false,recordTimer=null,rotorSpeed=60;const values={},tracks=[],frames=[];const loader=new URDFLoader(),base=`${import.meta.env.BASE_URL}robot/`;loader.packages={'天枢无人机完整版(更换悬垂式绝缘子串)':base};loader.load(base+'drone.urdf',r=>{robot=r;robot.rotation.x=-Math.PI/2;robot.traverse(o=>{if(o.isMesh)o.material=new THREE.MeshStandardMaterial({color:o.name.includes('left')||o.name.includes('right')?0xffa11c:0x42b8e8,metalness:.55,roughness:.3})});droneAnchor=new THREE.Group();scene.add(droneAnchor);droneAnchor.add(robot);scene.updateMatrixWorld(true);pole=robot.links?.dianxiangan;if(pole){scene.attach(pole);pole.traverse(o=>{if(o.isMesh)o.material=new THREE.MeshStandardMaterial({color:0x8997a0,metalness:.7,roughness:.42})})}joints=Object.values(robot.joints).filter(j=>j.jointType!=='fixed');joints.forEach(j=>values[j.name]=0);$('#status').textContent=`已加载 ${joints.length} 个可动关节 · 仿真控制就绪`;renderJoints();resize();event('无人机模型已加载。')},undefined,()=>$('#status').textContent='模型加载失败，请通过本地服务器打开网站。');
const group=n=>/^[1-4]$/.test(n)?'rotor':/^(left|right)/.test(n)||/^[5-7]$/.test(n)?'arm':'tool',name=n=>({1:'旋翼 1',2:'旋翼 2',3:'旋翼 3',4:'旋翼 4',5:'左侧关节',6:'右侧关节',7:'旋转基座',zhua:'夹爪升降'})[n]||n;
function bounds(j){let l=j.limit||{};return[Number.isFinite(l.lower)?l.lower:j.jointType==='continuous'?-Math.PI:0,Number.isFinite(l.upper)?l.upper:j.jointType==='continuous'?Math.PI:1]}function setJoint(i,v){if(!robot)return;let j=joints[i],[lo,hi]=bounds(j);values[j.name]=j.jointType==='continuous'?v:THREE.MathUtils.clamp(v,lo,hi);j.setJointValue(values[j.name])}function renderJoints(){let el=$('#jointList');el.innerHTML='';joints.forEach((j,i)=>{if(filter!=='all'&&group(j.name)!==filter)return;let [lo,hi]=bounds(j),a=document.createElement('article');a.className='joint';a.innerHTML=`<b>${name(j.name)} <small>${group(j.name)}</small></b><div><button>−</button><input type="range" min="${lo}" max="${hi}" step=".01" value="${values[j.name]||0}"><button>＋</button><span>0.0°</span></div>`;a.onclick=()=>selected=i;a.querySelector('input').oninput=e=>setJoint(i,+e.target.value);a.querySelectorAll('button')[0].onclick=e=>{e.stopPropagation();setJoint(i,values[j.name]-.05)};a.querySelectorAll('button')[1].onclick=e=>{e.stopPropagation();setJoint(i,values[j.name]+.05)};el.append(a)})}function reset(){rotor=false;joints.forEach((j,i)=>setJoint(i,0));event('所有关节已复位，旋翼已停止。')}function update(){let soc=Math.max(62,86-(running?pct*.07:0)-(rotor?.5:0));$('#soc').textContent=soc.toFixed(0);$('#socbar').style.width=soc+'%';$('#remain').textContent=String(Math.floor(soc*.38)).padStart(2,'0')+':'+String(Math.floor(Math.random()*59)).padStart(2,'0');$('#volt').textContent=(44+soc*.072).toFixed(1)+' V';$('#amp').textContent=(rotor?18+Math.random()*3:8+Math.random()).toFixed(1)+' A';$('#temp').textContent=(31+Math.random()*2+(rotor?3:0)).toFixed(1)+' °C';$('#delta').textContent=(.008+Math.random()*.01).toFixed(3)+' V';$('#latency').textContent=24+Math.floor(Math.random()*12)+' ms';$('#attitude').textContent=(Math.random()*2-1).toFixed(1)+'° / '+(Math.random()*2-1).toFixed(1)+'°';for(let i=1;i<5;i++)$('#m'+i).textContent=rotor?Math.floor(1000+rotorSpeed*55+Math.random()*160):0;$('#rotorRpm').textContent=rotor?'运行中 · '+Math.floor(1000+rotorSpeed*55)+' RPM':'待机 · 0 RPM';$('#clock').textContent=new Date().toLocaleTimeString('zh-CN',{hour12:false})}setInterval(update,1000);update();
function updateDronePosition(){if(!droneAnchor)return;['X','Y','Z'].forEach(axis=>{const value=+$('#drone'+axis).value;droneAnchor.position[axis.toLowerCase()]=value;$('#drone'+axis+'Value').textContent=value.toFixed(2)});event('无人机相对电线杆位置已更新。')}function moveDrone(axis,delta){const input=$('#drone'+axis);if(!input)return;input.value=Math.max(+input.min,Math.min(+input.max,+input.value+delta));updateDronePosition()}function mission(start){if(start){running=true;pct=0;let n=$('#route').value;$('#missionName').textContent=n;$('#timelineName').textContent=n;$('#timelineState').textContent='RUNNING';event('开始执行「'+n+'」（仿真）。')}else{running=false;$('#timelineState').textContent='STOPPED';$('#missionName').textContent='待命';event('当前任务已停止。')}}['X','Y','Z'].forEach(axis=>$('#drone'+axis).oninput=updateDronePosition);$('#resetPosition').onclick=()=>{['X','Y','Z'].forEach(axis=>$('#drone'+axis).value=0);updateDronePosition();event('无人机已回到电线杆参考点。')};$('#run').onclick=()=>mission(true);$('#cancel').onclick=()=>mission(false);$('#preview').onclick=()=>{let n=$('#route').value;$('#timelineName').textContent=n+' · 路径预览';$('#timelineState').textContent='PREVIEW';event('正在预览「'+n+'」。')};$('#stop').onclick=()=>{rotor=false;mission(false);$('#alerts').textContent='1 条';$('#alertText').textContent='紧急停止已触发，请确认设备状态。';event('紧急停止已触发（仿真）。')};$('#reset').onclick=reset;$('#stow').onclick=()=>{joints.forEach((j,i)=>{if(group(j.name)!=='rotor')setJoint(i,0)});event('机械臂已收纳至安全姿态。')};$('#rotors').onclick=()=>{rotor=!rotor;$('#rotors').textContent=rotor?'一键停止旋翼':'一键启动旋翼';$('#rotors').classList.toggle('running',rotor);event(rotor?'旋翼已一键启动（仿真）。':'旋翼已停止。')};$('#rotorSpeed').oninput=e=>{rotorSpeed=+e.target.value;$('#rotorSpeedValue').textContent=rotorSpeed+'%';if(rotor)event('旋翼转速已调至 '+rotorSpeed+'%。')};
$('#recordArm').onclick=()=>{recording=!recording;$('#recordArm').textContent=recording?'结束记录':'开始记录';event(recording?'开始记录机械臂关键点。':'结束记录。')};$('#keyframe').onclick=()=>{if(!recording)return event('请先开始记录。');frames.push(Object.fromEntries(joints.filter(j=>group(j.name)!=='rotor').map(j=>[j.name,values[j.name]])));event('已记忆第 '+frames.length+' 个关键点。')};$('#saveTrack').onclick=()=>{if(!frames.length)return event('没有可保存的关键点。');tracks.unshift({name:'机械臂轨迹 '+String(tracks.length+1).padStart(2,'0'),frames:[...frames]});frames.length=0;recording=false;$('#recordArm').textContent='开始记录';$('#trackCount').textContent=tracks.length+' 条';$('#tracks').innerHTML=tracks.map((t,i)=>`<p>${t.name}<button data-i="${i}">回放</button></p>`).join('');$('#tracks').querySelectorAll('button').forEach(b=>b.onclick=()=>play(tracks[b.dataset.i]));event('轨迹已保存。')};function play(t){let i=0,eventId=setInterval(()=>{Object.entries(t.frames[i++]).forEach(([n,v])=>setJoint(joints.findIndex(j=>j.name===n),v));if(i>=t.frames.length){clearInterval(eventId);event('轨迹回放完成。')}},500);event('开始回放「'+t.name+'」。')}
$('#home').onclick=()=>{$('#pan').value=0;$('#tilt').value=-12;event('云台已回中。')};$('#photo').onclick=()=>event('已采集云台相机快照（演示）。');$('#record').onclick=()=>{let a=$('#record').classList.toggle('on');$('#record').textContent=a?'停止录像':'开始录像';event(a?'云台相机开始录像。':'云台相机录像已停止。')};$('#zoom').oninput=e=>$('#zoomLabel').textContent=(e.target.value/10).toFixed(1)+'×';document.querySelectorAll('.tab').forEach(x=>x.onclick=()=>{document.querySelectorAll('.tab,.page').forEach(y=>y.classList.remove('active'));x.classList.add('active');document.querySelector(`[data-page="${x.dataset.tab}"]`).classList.add('active')});document.querySelectorAll('.filters button').forEach(x=>x.onclick=()=>{filter=x.dataset.filter;document.querySelectorAll('.filters button').forEach(y=>y.classList.toggle('active',y===x));renderJoints()});window.addEventListener('keydown',e=>{const key=e.key.toLowerCase();console.warn('[keyboard received]',key,e.code);const map={w:['Y',.5],s:['Y',-.5],a:['Z',.5],d:['Z',-.5],q:['X',.5],e:['X',-.5]};if(map[key]){moveDrone(map[key][0],map[key][1]);e.preventDefault()}});function resize(){let r=$('#viewport').getBoundingClientRect();camera.aspect=r.width/r.height;camera.updateProjectionMatrix();renderer.setSize(r.width,r.height,false)}new ResizeObserver(resize).observe($('#viewport'));const clock=new THREE.Clock();function loop(){requestAnimationFrame(loop);const dt=clock.getDelta();if(rotor)joints.forEach((j,i)=>{if(group(j.name)==='rotor')setJoint(i,values[j.name]+dt*(2+rotorSpeed*.18))});if(running){pct=Math.min(100,pct+.18);$('#missionPct').textContent=pct.toFixed(0)+'%';$('#progress').style.width=pct+'%';if(pct===100){running=false;$('#timelineState').textContent='COMPLETE';event('预定轨迹已完成。')}}orbit.update();renderer.render(scene,camera)}loop();























