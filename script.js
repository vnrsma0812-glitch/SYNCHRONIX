/* SYNCHRONIX CORE ENGINE v2.4
   Self-contained demo controller for the upgraded dashboard.
   No external libraries required.
*/
(() => {
  'use strict';

  const roads = ['north','east','south','west'];
  const state = {
    traffic: { north:25, east:10, south:42, west:15 },
    priority:'north', greenTime:30, remaining:30,
    mode:'ai', running:false, emergency:'none',
    processed:0, cycle:0, exhibitionIndex:0,
    interval:null, countdown:null
  };

  const $ = id => document.getElementById(id);
  const clamp = (n,a,b) => Math.max(a, Math.min(b,n));
  const title = r => r.charAt(0).toUpperCase()+r.slice(1);

  function readInputs(){
    roads.forEach(r => { const el=$('input'+title(r)); if(el) state.traffic[r]=clamp(Number(el.value)||0,0,100); });
  }
  function writeInputs(){
    roads.forEach(r => { const el=$('input'+title(r)); if(el) el.value=state.traffic[r]; });
  }
  function density(n){ return n>=35?'HIGH':n>=15?'MEDIUM':'LOW'; }
  function greenFor(n){ return state.mode==='fixed' ? 30 : clamp(Math.round(15 + n*0.72),15,45); }
  function total(){ return roads.reduce((s,r)=>s+state.traffic[r],0); }

  function updateDensityCards(){
    roads.forEach(r=>{
      const d=density(state.traffic[r]);
      const el=$('density'+title(r)); if(el) { el.textContent=d; el.className='density-indicator density-'+d.toLowerCase(); }
    });
  }

  function updateBars(){
    roads.forEach(r=>{
      const v=state.traffic[r];
      const bar=$('bar'+title(r)), val=$('barVal'+title(r));
      if(bar) bar.style.height=Math.max(5,v)+'%';
      if(val) val.textContent=v;
    });
    if($('statTotalVehicles')) $('statTotalVehicles').textContent=total();
    const worst=roads.reduce((a,b)=>state.traffic[b]>state.traffic[a]?b:a);
    if($('statCongestedRoad')) $('statCongestedRoad').textContent=title(worst).toUpperCase();
  }

  function setLights(){
    roads.forEach(r=>{
      const housing=$('signal'+title(r)); if(!housing) return;
      housing.querySelectorAll('.light').forEach(x=>x.classList.remove('active'));
      const red=housing.querySelector('.red'), green=housing.querySelector('.green'), yellow=housing.querySelector('.yellow');
      if(r===state.priority){ if(green) green.classList.add('active'); }
      else if(r===nextRoad(state.priority)){ if(yellow) yellow.classList.add('active'); }
      else { if(red) red.classList.add('active'); }
      const timer=$('timer'+title(r));
      if(timer) timer.textContent=r===state.priority ? `${state.remaining}s` : (r===nextRoad(state.priority)?'READY':'RED');
    });
  }

  function nextRoad(r){ return roads[(roads.indexOf(r)+1)%roads.length]; }

  function updateStage(){
    const R=title(state.priority);
    if($('activeRoadTitle')) $('activeRoadTitle').textContent=R.toUpperCase()+' GREEN';
    if($('activeCountdown')) $('activeCountdown').textContent=state.remaining+'s';
    if($('stagePriority')) $('stagePriority').textContent=R.toUpperCase();
    if($('stageTimer')) $('stageTimer').textContent=state.greenTime+'s';
    if($('statCurrentGreenTime')) $('statCurrentGreenTime').textContent=state.greenTime+'s';
    if($('aiSelectedRoad')) $('aiSelectedRoad').textContent=R.toUpperCase()+' ROAD';
    if($('aiGreenTimePill')) $('aiGreenTimePill').textContent='🟢 '+state.greenTime+' SECONDS';
    if($('aiDensityPill')) $('aiDensityPill').textContent=density(state.traffic[state.priority])+' DENSITY';
    if($('aiReasonText')) $('aiReasonText').textContent=`${R} road has ${state.traffic[state.priority]} vehicles. SYNCHRONIX ${state.mode==='ai'?'AI':'fixed'} control assigned ${state.greenTime}s of green time based on current demand.`;
    if($('congestionAlert')) $('congestionAlert').classList.toggle('hidden', Math.max(...roads.map(r=>state.traffic[r]))<35);
    setLights();
  }

  function renderQueues(){
    roads.forEach(r=>{
      const box=$('queue'+title(r)); if(!box) return;
      box.innerHTML='';
      const count=Math.min(12,Math.ceil(state.traffic[r]/8));
      for(let i=0;i<count;i++){
        const car=document.createElement('span');
        car.className='queue-car '+r+'-car';
        car.textContent=['🚗','🚙','🚕','🚘'][i%4];
        car.style.setProperty('--i',i);
        box.appendChild(car);
      }
    });
  }

  function movingCar(){
    const v=$('movingVehicle'); if(!v) return;
    v.classList.remove('move-north','move-east','move-south','move-west');
    void v.offsetWidth;
    v.classList.add('move-'+state.priority);
  }

  function refresh(){
    readInputs(); updateDensityCards(); updateBars(); renderQueues(); updateStage();
  }

  window.adjustTraffic=function(road,delta){
    state.traffic[road]=clamp((Number(state.traffic[road])||0)+delta,0,100);
    writeInputs(); refresh();
    window.dispatchEvent(new CustomEvent('synchronix:traffic',{detail:{...state.traffic}}));
  };

  window.updateCustomTraffic=function(){ refresh(); };

  window.applyPreset=function(type){
    const presets={
      low:{north:8,east:5,south:12,west:7},
      medium:{north:25,east:18,south:32,west:20},
      high:{north:55,east:42,south:78,west:49},
      random:Object.fromEntries(roads.map(r=>[r,Math.floor(Math.random()*71)+5]))
    };
    state.traffic={...presets[type]}; writeInputs(); refresh();
    logEvent('Scenario loaded', `${title(type)} traffic profile applied`, type==='high'?'red':'cyan');
    runAiDecision();
  };

  window.setSignalMode=function(mode){
    state.mode=mode;
    if($('modeBadgeText')) $('modeBadgeText').textContent=mode==='ai'?'SYNCHRONIX AI':'FIXED SIGNAL';
    refresh();
    logEvent('Control mode changed', mode==='ai'?'Adaptive AI timing enabled':'Fixed 30s timing enabled', mode==='ai'?'green':'yellow');
  };

  window.runAiDecision=function(){
    readInputs();
    const emergency=$('emergencyRoadSelect')?.value || state.emergency;
    state.emergency=emergency;
    const selected=emergency!=='none' ? emergency : roads.reduce((a,b)=>state.traffic[b]>state.traffic[a]?b:a);
    state.priority=selected;
    state.greenTime=emergency!=='none'?45:greenFor(state.traffic[selected]);
    state.remaining=state.greenTime;
    state.cycle++;
    animatePipeline();
    refresh(); movingCar();
    logEvent('AI decision executed', `${title(selected)} granted ${state.greenTime}s priority`, emergency!=='none'?'red':'green');
    updateExhibition();
  };

  function animatePipeline(){
    for(let i=1;i<=5;i++){
      const el=$('step'+i); if(el) el.classList.remove('active','done');
    }
    let i=1;
    const tick=()=>{
      if(i>5) return;
      const el=$('step'+i); if(el) el.classList.add('active');
      if(i>1){const prev=$('step'+(i-1)); if(prev){prev.classList.remove('active');prev.classList.add('done');}}
      i++; setTimeout(tick,220);
    };
    tick();
  }

  window.toggleSimulation=function(){
    state.running=!state.running;
    const btn=$('simToggleBtn');
    if(state.running){
      if(btn){btn.textContent='⏸ PAUSE';btn.classList.add('running');}
      logEvent('Simulation started','Adaptive signal cycle is running','green');
      clearInterval(state.interval);
      state.interval=setInterval(simulationTick,1000);
    }else{
      if(btn){btn.textContent='▶ START';btn.classList.remove('running');}
      clearInterval(state.interval);
      logEvent('Simulation paused','Signal cycle held','yellow');
    }
  };

  function simulationTick(){
    if(state.remaining>0) state.remaining--;
    if(state.remaining<=0){
      state.processed += Math.min(12,state.traffic[state.priority]);
      state.traffic[state.priority]=Math.max(0,state.traffic[state.priority]-Math.min(12,state.traffic[state.priority]));
      const next=state.emergency!=='none' ? state.emergency : roads.reduce((a,b)=>state.traffic[b]>state.traffic[a]?b:a);
      state.priority=next;
      state.greenTime=state.emergency!=='none'?45:greenFor(state.traffic[next]);
      state.remaining=state.greenTime;
      logEvent('Signal phase changed',`${title(next)} is now green`,'green');
    }
    writeInputs(); refresh(); movingCar();
    if($('statProcessedVehicles')) $('statProcessedVehicles').textContent=state.processed;
    updateExhibition();
  }

  window.resetSimulation=function(){
    clearInterval(state.interval); state.running=false; state.processed=0; state.priority='north'; state.greenTime=30; state.remaining=30; state.emergency='none';
    state.traffic={north:25,east:10,south:42,west:15};
    if($('emergencyRoadSelect')) $('emergencyRoadSelect').value='none';
    if($('simToggleBtn')) $('simToggleBtn').textContent='▶ START';
    writeInputs(); refresh();
    if($('statProcessedVehicles')) $('statProcessedVehicles').textContent='0';
    logEvent('Simulation reset','Default traffic state restored','cyan');
  };

  window.triggerEmergency=function(){
    const road=$('emergencyRoadSelect')?.value || 'none';
    state.emergency=road;
    if(road==='none'){ logEvent('Emergency cleared','Normal priority logic restored','cyan'); runAiDecision(); return; }
    state.priority=road; state.greenTime=45; state.remaining=45;
    refresh(); movingCar();
    logEvent('EMERGENCY PRIORITY',`${title(road)} ambulance corridor opened for 45s`,'red');
    updateExhibition();
  };

  window.loadScenario=function(n){
    const scenarios={
      1:{traffic:{north:18,east:9,south:24,west:12},emergency:'none'},
      2:{traffic:{north:52,east:35,south:78,west:46},emergency:'none'},
      3:{traffic:{north:22,east:14,south:31,west:18},emergency:'east'},
      4:{traffic:{north:24,east:23,south:25,west:22},emergency:'none'}
    };
    const s=scenarios[n]; if(!s)return;
    state.traffic={...s.traffic}; state.emergency=s.emergency;
    if($('emergencyRoadSelect')) $('emergencyRoadSelect').value=s.emergency;
    writeInputs(); refresh(); runAiDecision();
  };

  window.loadNextExhibitionPreset=function(){
    state.exhibitionIndex=(state.exhibitionIndex+1)%4;
    loadScenario(state.exhibitionIndex+1);
  };

  window.toggleExhibitionMode=function(){
    const modal=$('exhibitionModal'); if(!modal)return;
    modal.classList.toggle('hidden');
    if(!modal.classList.contains('hidden')) updateExhibition();
  };

  function updateExhibition(){
    if($('exhibitionRoadTitle')) $('exhibitionRoadTitle').textContent=title(state.priority).toUpperCase()+' ROAD';
    if($('exhibitionTimer')) $('exhibitionTimer').textContent=`🟢 ${state.remaining} SECONDS GREEN`;
    if($('exhibitionReason')) $('exhibitionReason').textContent=`${title(state.priority)} has ${state.traffic[state.priority]} vehicles. ${state.emergency!=='none'?'Emergency priority is active.':'Adaptive demand analysis selected this approach.'}`;
    roads.forEach(r=>{const v=$('ex'+title(r)+'Val'); if(v)v.textContent=state.traffic[r]; const box=$('ex'+title(r)+'Box'); if(box)box.classList.toggle('active-ex-road',r===state.priority);});
  }

  function logEvent(titleText,detail,type='cyan'){
    const list=$('activityList'); if(!list)return;
    const item=document.createElement('div'); item.className='activity-item';
    item.innerHTML=`<span class="activity-dot ${type}"></span><div><b>${titleText}</b><small>${detail}</small></div><time>NOW</time>`;
    list.prepend(item); while(list.children.length>6)list.removeChild(list.lastElementChild);
  }
  window.clearActivityLog=function(){if($('activityList'))$('activityList').innerHTML='';};

  window.checkBackendStatus=async function(){
    const banner=$('backendBanner'), dot=$('statusDot'), text=$('statusText');
    try{
      const controller=new AbortController(); const t=setTimeout(()=>controller.abort(),1200);
      const r=await fetch('/health',{signal:controller.signal}); clearTimeout(t);
      if(!r.ok)throw new Error('health');
      dot?.classList.add('online'); if(text)text.textContent='C BACKEND ONLINE'; banner?.classList.add('hidden');
    }catch(e){
      dot?.classList.remove('online'); if(text)text.textContent='C DEMO MODE'; banner?.classList.remove('hidden');
    }
  };

  function updateClock(){
    const el=$('liveClock'); if(el)el.textContent=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});
  }

  // Keyboard shortcuts for exhibition demos.
  document.addEventListener('keydown',e=>{
    if(e.key===' ' && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();toggleSimulation();}
    if(e.key.toLowerCase()==='a')runAiDecision();
    if(e.key.toLowerCase()==='r')resetSimulation();
    if(e.key.toLowerCase()==='e')toggleExhibitionMode();
  });

  window.addEventListener('load',()=>{
    writeInputs(); refresh(); updateClock(); checkBackendStatus();
    setInterval(updateClock,1000);
    setInterval(()=>{
      if(!state.running) return;
      // small stochastic arrival/departure to keep the demo visually alive
      roads.forEach(r=>{ if(Math.random()<.34) state.traffic[r]=clamp(state.traffic[r]+(Math.random()<.6?1:-1),0,100); });
      writeInputs(); refresh();
    },3000);
  });
})();
