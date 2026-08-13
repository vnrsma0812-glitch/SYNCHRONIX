
(() => {
"use strict";
const configs={
normal:{name:"NORMAL TRAFFIC",desc:"Adaptive timing with balanced traffic demand.",tags:["BASELINE","AI CONTROL","SAFE MODE"],score:92,pred:18,aqi:42,traffic:[12,9,16,8],weather:94,safety:97,env:90},
rush:{name:"RUSH HOUR",desc:"High commuter demand. AI extends green time for the busiest approach.",tags:["HIGH DEMAND","QUEUE CONTROL","AI ADAPTIVE"],score:87,pred:71,aqi:78,traffic:[44,37,51,29],weather:92,safety:92,env:74},
rain:{name:"HEAVY RAIN",desc:"Reduced visibility and slower vehicle movement. Safety margins increase.",tags:["LOW VISIBILITY","SLOW FLOW","SAFETY FIRST"],score:84,pred:63,aqi:51,traffic:[25,21,31,18],weather:88,safety:95,env:82},
accident:{name:"ACCIDENT RESPONSE",desc:"One approach is partially blocked. AI diverts flow and protects emergency access.",tags:["INCIDENT","DIVERSION","EMERGENCY AI"],score:79,pred:82,aqi:69,traffic:[19,48,27,14],weather:91,safety:86,env:78},
school:{name:"SCHOOL ZONE",desc:"Pedestrian safety mode creates protected crossing windows and lower-speed operation.",tags:["PEDESTRIAN","SAFETY PRIORITY","LOW SPEED"],score:95,pred:38,aqi:46,traffic:[14,18,23,11],weather:95,safety:100,env:88},
pollution:{name:"POLLUTION ALERT",desc:"Emission-aware control reduces idling and prioritizes smoother traffic flow.",tags:["AIR QUALITY","ECO ROUTING","EMISSION AWARE"],score:89,pred:54,aqi:126,traffic:[31,28,36,25],weather:93,safety:94,env:98}
};
let current="normal",running=false;
const $=id=>document.getElementById(id);
const txt=(id,v)=>{const e=$(id);if(e)e.textContent=v};
function grade(s){return s>=95?"A+":s>=90?"A":s>=80?"B":s>=70?"C":"D"}
function pollution(a){return a<=50?["GOOD","green"]:a<=100?["MODERATE","yellow"]:a<=150?["UNHEALTHY","red"]:["POOR","red"]}
function setInputs(v){
["North","East","South","West"].forEach((r,i)=>{const e=$("input"+r);if(e)e.value=v[i]});
try{if(typeof updateCounterVisuals==="function")updateCounterVisuals();if(typeof updateTrafficStats==="function")updateTrafficStats()}catch(e){}
}
function render(){
const c=configs[current];
document.querySelectorAll(".scenario-card").forEach(x=>x.classList.toggle("active",x.dataset.scenario===current));
txt("scenarioName",c.name);txt("scenarioDescription",c.desc);txt("simulationScore",c.score);
txt("scenarioTags","");const tags=$("scenarioTags");if(tags)tags.innerHTML=c.tags.map(t=>`<span>${t}</span>`).join("");
if($("scoreBar"))$("scoreBar").style.width=c.score+"%";
txt("predictionValue",c.pred+"%");txt("pred5",Math.max(5,c.pred-4)+"%");txt("pred15",Math.min(99,c.pred+6)+"%");txt("pred30",Math.min(99,c.pred+13)+"%");txt("predPeak",Math.min(99,c.pred+24)+"%");
if($("predictionBar"))$("predictionBar").style.width=c.pred+"%";
txt("aqiValue",c.aqi);const [label,color]=pollution(c.aqi);const pill=$("aqiPill");if(pill){pill.textContent=label;pill.style.color=`var(--${color})`}
if($("pollutionGauge")){$("pollutionGauge").style.width=Math.min(100,c.aqi/2)+"%";$("pollutionGauge").style.background=`var(--${color})`}
txt("co2Value",Math.round(12+c.aqi*.12));txt("no2Value",Math.round(11+c.aqi*.08));txt("pmValue",Math.round(7+c.aqi*.05));
txt("schoolSafety",(current==="school"?100:Math.max(88,c.safety))+"%");txt("emergencySafety",(current==="accident"?100:Math.max(91,c.safety))+"%");txt("incidentSafety",(current==="accident"?Math.max(92,c.safety):96)+"%");txt("weatherSafety",(current==="rain"?100:Math.max(90,c.weather))+"%");
const vals=[Math.min(99,c.score+2),c.safety,c.env,Math.min(99,c.score+1),Math.max(68,c.score-1)];
["scoreEfficiency","scoreSafety","scoreEnvironment","scorePrediction","scoreWaiting"].forEach((id,i)=>txt(id,vals[i]));
document.querySelectorAll(".score-components em").forEach((e,i)=>e.style.width=vals[i]+"%");
txt("gradeBadge",grade(c.score));txt("scoreSummary",c.desc);
setInputs(c.traffic);
}
window.selectScenario=(name)=>{if(configs[name]){current=name;render();if(typeof addActivity==="function")addActivity("Scenario selected",configs[name].name+" loaded","cyan")}};
window.runScenarioSimulation=()=>{
if(running)return;running=true;const c=configs[current],btn=document.querySelector(".scenario-run");
if(btn){btn.textContent="⟳ SIMULATING...";btn.disabled=true}
if(typeof addActivity==="function")addActivity("Simulation started",c.name+" — AI evaluation running","green");
let n=0;const t=setInterval(()=>{n++;txt("predictionValue",Math.max(5,Math.min(99,c.pred+Math.round(Math.sin(n)*4)))+"%");if(n>=7){clearInterval(t);running=false;if(btn){btn.textContent="▶ RUN SCENARIO";btn.disabled=false}txt("simulationScore",Math.min(99,c.score+Math.floor(Math.random()*4)));if(typeof addActivity==="function")addActivity("Simulation complete","AI score updated","green")}},500)
};
window.resetSimulationScore=()=>{current="normal";render();if(typeof addActivity==="function")addActivity("Simulation reset","Normal baseline restored","yellow")};
setTimeout(render,350);
})();
