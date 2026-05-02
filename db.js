const DB={get(k){try{return JSON.parse(localStorage.getItem('pf_'+k)||'null')}catch{return null}},set(k,v){localStorage.setItem('pf_'+k,JSON.stringify(v))},arr(k){return this.get(k)||[]},push(k,v){const a=this.arr(k);a.push(v);this.set(k,a)}};
const cfg=()=>DB.get('cfg')||{tdee:2800,goalmode:'maintain',water:2500,name:''};
const today=()=>new Date().toISOString().slice(0,10);
const fmtInt=n=>isFinite(n)?Math.round(n):'—';
const fmt1=n=>isFinite(n)?Number(n).toFixed(1):'—';
const typeLabel={strength:'筋力',hiit:'HIIT',cardio:'有酸素',functional:'機能',mobility:'回復',firefighting:'消防訓練'};
const mealLabel={breakfast:'朝食',preworkout:'トレ前',postworkout:'トレ後',lunch:'昼食',dinner:'夕食',snack:'間食'};
const pageNames={dashboard:'ダッシュボード',peaking:'ピーキングプランナー',program:'今日のメニュー',training:'トレーニング記録',nutrition:'栄養管理',sleep:'睡眠・回復',shift:'シフト管理',gut:'腸内環境管理',supplement:'サプリメント',tdee:'TDEEカリキュレーター',analysis:'分析レポート',settings:'設定'};

function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const pg=document.getElementById('page-'+id);if(pg)pg.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>{if(n.textContent.trim()===pageNames[id])n.classList.add('active')});
  document.getElementById('topbar-page').textContent=pageNames[id]||id;
  closeSidebar();
  if(id==='dashboard')renderDashboard();
  if(id==='program')initProgramPage();
  if(id==='analysis'){renderAnalysis();updateWeeklyWeightPanel();updateMiniCut();initWeightTracker();renderConditionAnalysis();}
  if(id==='nutrition'){updateNutritionGoals();updateSmartNutrition();renderMealLog();updateNutritionTotals();}
  if(id==='sleep')renderSleepCharts();
  if(id==='shift')renderShiftPage();
  if(id==='gut')renderGutPage();
  if(id==='supplement')renderSupplementPage();
  if(id==='training')renderTrainingLog();
}
function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');document.getElementById('overlay').classList.toggle('show')}
function closeSidebar(){document.getElementById('sidebar').classList.remove('open');document.getElementById('overlay').classList.remove('show')}

function getCalTarget(mode){const b=parseInt(cfg().tdee)||2800;return mode==='cut'?Math.round(b*0.85):mode==='bulk'?Math.round(b*1.10):b}
function getMacros(cal,weight){const w=parseFloat(weight)||70;const p=Math.round(w*2.0);const f=Math.round(cal*0.25/9);const c=Math.max(0,Math.round((cal-p*4-f*9)/4));return{protein:p,fat:f,carb:c}}

let dashChart=null;

let pkTsbChart=null;

let exCount=0;

let sleepChart=null,wellnessChart=null;

let aWeekly=null,aWeight=null,aNutr=null,aWell=null;

// ========= プログラムデータ定義 =========
c