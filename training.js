function addExRow(){
  exCount++;const id='ex'+exCount;
  const div=document.createElement('div');div.className='input-row';div.id=id;
  div.style.cssText='margin-bottom:10px;flex-wrap:wrap;gap:6px;align-items:center';
  div.innerHTML=`<input type="text" placeholder="種目名" style="flex:2;min-width:140px" oninput="fillPrevOnNameInput(this,'${id}')"><input type="number" placeholder="セット" min="1" max="30" style="max-width:65px"><input type="number" placeholder="回数" min="1" max="100" style="max-width:65px"><input type="number" placeholder="kg" min="0" max="500" step="0.5" style="max-width:75px"><span id="${id}-prev" style="font-size:10px;color:var(--text3)"></span><button class="btn btn-sm btn-ghost" onclick="document.getElementById('${id}').remove()">✕</button>`;
  document.getElementById('exercise-list').appendChild(div);
}

function fillPrevOnNameInput(nameInput,rowId){
  const name=nameInput.value.trim();
  if(!name)return;
  const prev=getPrevRecord(name);
  const row=document.getElementById(rowId);if(!row)return;
  const ins=row.querySelectorAll('input');
  const sp=document.getElementById(rowId+'-prev');
  if(prev){
    if(!ins[2].value)ins[2].value=prev.reps;
    if(!ins[3].value)ins[3].value=prev.weight;
    if(sp)sp.innerHTML=`<span style="padding:2px 6px;background:rgba(34,197,94,0.12);color:var(--accent4);border-radius:4px">前回:${prev.weight}kg×${prev.reps}rep (${prev.date.slice(5)})</span>`;
  }else{
    if(sp)sp.innerHTML='<span style="padding:2px 5px;background:var(--bg4);color:var(--text3);border-radius:4px">初回</span>';
  }
}

function saveTraining(){
  const date=document.getElementById('t-date').value;
  const dur=parseInt(document.getElementById('t-duration').value)||0;
  const rpe=parseInt(document.getElementById('t-rpe').value)||5;
  const type=document.getElementById('t-type').value;
  if(!date||!dur){alert('日付と時間は必須です');return}
  const isCardio=type==='cardio'||type==='hiit';
  let cardioData=null;
  if(isCardio){
    cardioData={
      cardioType:document.getElementById('t-cardio-type')?.value||'crosstrainer',
      zone:document.getElementById('t-cardio-zone')?.value||'2',
      distance:parseFloat(document.getElementById('t-cardio-distance')?.value)||0,
      hr:parseInt(document.getElementById('t-cardio-hr')?.value)||0,
      kcal:parseInt(document.getElementById('t-cardio-kcal')?.value)||0,
    };
  }
  const exercises=[];
  if(!isCardio){
    document.querySelectorAll('#exercise-list .input-row').forEach(row=>{
      const ins=row.querySelectorAll('input');
      if(ins[0].value)exercises.push({name:ins[0].value,sets:ins[1].value,reps:ins[2].value,weight:ins[3].value});
    });
  }
  DB.push('trainings',{date,type,duration:dur,rpe,
    water:parseInt(document.getElementById('t-water').value)||0,
    notes:document.getElementById('t-notes').value,
    exercises,cardioData,id:Date.now()});
  ['t-duration','t-rpe','t-water','t-notes','t-cardio-distance','t-cardio-hr','t-cardio-kcal'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.value='';
  });
  document.getElementById('exercise-list').innerHTML='';
  renderTrainingLog();
  alert('記録しました！');
}

function renderTrainingLog(){
  const log=DB.arr('trainings').slice(-20).reverse();
  const el=document.getElementById('training-log-table');
  if(!log.length){el.innerHTML='<div class="muted">まだ記録がありません</div>';return}
  // 前セッション比較用: key=種目名, val=最新記録
  const prevMap={};
  DB.arr('trainings').forEach(t=>{if(t.exercises)t.exercises.forEach(e=>{if(e.name&&parseFloat(e.weight))prevMap[e.name]={w:parseFloat(e.weight),r:parseInt(e.reps),date:t.date}});});

  let html='<div style="display:flex;flex-direction:column;gap:12px">';
  log.forEach((t,ti)=>{
    // Double Progression check: 各種目で前回より重量or回数が上がっているか
    let dpCount=0,exCount2=0;
    const prevSession=DB.arr('trainings').slice().reverse().find(s=>s.date<t.date&&s.exercises&&s.exercises.length>0);
    if(t.exercises&&t.exercises.length){
      t.exercises.forEach(e=>{
        if(!e.name||!parseFloat(e.weight))return;
        exCount2++;
        // 同種目の直前記録
        const prev2=DB.arr('trainings').slice().reverse().find(s=>s.date<t.date&&s.exercises&&s.exercises.find(ex=>ex.name===e.name&&parseFloat(ex.weight)>0));
        if(prev2){const prevEx=prev2.exercises.find(ex=>ex.name===e.name);if(prevEx&&(parseFloat(e.weight)>parseFloat(prevEx.weight)||parseInt(e.reps)>parseInt(prevEx.reps)))dpCount++;}
      });
    }
    const dpRate=exCount2>0?Math.round(dpCount/exCount2*100):null;
    const dpBadge=dpRate!==null?`<span class="badge ${dpRate>=70?'badge-green':dpRate>=40?'badge-amber':'badge-gray'}" style="font-size:10px">${dpRate>=70?'↑PO':''}${dpRate}%達成</span>`:''
    html+=`<div class="card-sm" style="padding:12px">
      <div class="row-between" style="margin-bottom:8px">
        <div class="row" style="gap:8px;flex-wrap:wrap">
          <span class="mono" style="font-size:13px;font-weight:500">${t.date}</span>
          <span class="badge badge-blue" style="font-size:10px">${typeLabel[t.type]||t.type}</span>
          <span class="muted" style="font-size:12px">${t.duration}分 / RPE ${t.rpe} / 負荷 ${t.duration*t.rpe}</span>
        </div>
        ${dpBadge}
      </div>`;
    if(t.exercises&&t.exercises.length){
      html+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:4px">';
      t.exercises.forEach(e=>{
        if(!e.name)return;
        const kg=parseFloat(e.weight)||0;const reps=parseInt(e.reps)||0;
        // 前回比較
        const prev2=DB.arr('trainings').slice().reverse().find(s=>s.date<t.date&&s.exercises&&s.exercises.find(ex=>ex.name===e.name&&parseFloat(ex.weight)>0));
        let diff='';
        if(prev2&&kg>0){const prevEx=prev2.exercises.find(ex=>ex.name===e.name);if(prevEx){const dw=kg-parseFloat(prevEx.weight);const dr=reps-(parseInt(prevEx.reps)||0);if(dw>0)diff=`<span style="color:var(--accent4);font-size:10px">+${dw}kg</span>`;else if(dr>0)diff=`<span style="color:var(--accent4);font-size:10px">+${dr}rep</span>`;else if(dw<0||dr<0)diff=`<span style="color:var(--accent3);font-size:10px">${dw<0?dw+'kg':dr+'rep'}</span>`;}}
        html+=`<div style="font-size:11px;color:var(--text2);padding:3px 6px;background:var(--bg3);border-radius:4px;display:flex;justify-content:space-between;gap:4px"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${e.name}</span><span class="mono" style="color:var(--text);white-space:nowrap">${kg?kg+'kg':'—'}×${reps||e.reps} ${diff}</span></div>`;
      });
      html+='</div>';
    }
    // 有酸素詳細
    if(t.cardioData&&t.cardioData.cardioType){
      const cd=t.cardioData;
      const ctLabel=CARDIO_TYPES[cd.cardioType]?.label||cd.cardioType;
      const zoneLabel={1:'Z1',2:'Z2',3:'Z3',4:'Z4',hiit:'HIIT'}[cd.zone]||cd.zone;
      const zoneCol={1:'var(--text2)',2:'var(--accent4)',3:'var(--accent2)',4:'var(--accent3)',hiit:'var(--accent)'}[cd.zone]||'var(--text2)';
      let cdInfo=`<span style="font-weight:500">${ctLabel}</span> / <span style="color:${zoneCol};font-weight:600">${zoneLabel}</span>`;
      if(cd.distance)cdInfo+=` / ${cd.distance}km`;
      if(cd.hr)cdInfo+=` / 平均${cd.hr}bpm`;
      if(cd.kcal)cdInfo+=` / ${cd.kcal}kcal`;
      html+=`<div style="font-size:12px;color:var(--text2);margin-top:6px;padding:5px 8px;background:rgba(34,197,94,0.08);border-radius:4px;border-left:2px solid var(--accent4)">🏃 ${cdInfo}</div>`;
    }
    if(t.notes)html+=`<div class="muted" style="font-size:11px;margin-top:6px;padding-top:6px;border-top:1px solid var(--border)">📝 ${t.notes}</div>`;
    html+='</div>';
  });
  html+='</div>';
  el.innerHTML=html;
}

const CARDIO_TYPES={
  crosstrainer:{label:'クロストレーナー',kcalPerMin:8},
  bike:{label:'バイク',kcalPerMin:7},
  treadmill_walk:{label:'傾斜ウォーク',kcalPerMin:5},
  treadmill_run:{label:'ランニング',kcalPerMin:10},
  rowing:{label:'ローイング',kcalPerMin:9},
  stairmaster:{label:'ステアマスター',kcalPerMin:9},
  swim:{label:'水泳',kcalPerMin:8},
  outdoor_run:{label:'屋外ランニング',kcalPerMin:10},
  cycling:{label:'サイクリング',kcalPerMin:7},
  walk:{label:'ウォーキング',kcalPerMin:4},
};
const ZONE_HINTS={
  '1':'ゾーン1（〜60%）: アクティブリカバリー。筋肉痛の軽減・血流促進が目的。翌日の筋トレへの影響なし。',
  '2':'ゾーン2（60〜70%）: 脂肪燃焼効率が最高・ミトコンドリア増加。クロストレーナー推奨。Pelland et al.が基本として推奨する強度。',
  '3':'ゾーン3（70〜80%）: 有酸素能力強化。週1〜2回まで。消防での持久力向上に有効。筋トレ後に配置すること。',
  '4':'ゾーン4（80〜90%）: 閾値トレーニング。週1回まで。筋トレと同日は避ける。翌日の筋トレパフォーマンスに影響が出やすい。',
  'hiit':'HIIT（90%以上）: 短時間で高い負荷。週1回まで。必ず筋トレとは別日に実施。神経疲労が48時間持続する点に注意。',
};
function onTrainingTypeChange(){
  const type=document.getElementById('t-type').value;
  const isCardio=type==='cardio'||type==='hiit';
  const cf=document.getElementById('cardio-fields');
  const sf=document.getElementById('strength-fields');
  if(cf)cf.style.display=isCardio?'block':'none';
  if(sf)sf.style.display=isCardio?'none':'block';
  if(isCardio&&type==='hiit'){
    const zoneEl=document.getElementById('t-cardio-zone');
    if(zoneEl)zoneEl.value='hiit';
    updateCardioZoneHint();
  }
}
function updateCardioZoneHint(){
  const zone=document.getElementById('t-cardio-zone').value;
  const el=document.getElementById('cardio-zone-hint');
  if(el){
    el.textContent=ZONE_HINTS[zone]||'';
    el.className='alert '+(zone==='1'||zone==='2'?'alert-success':zone==='3'?'alert-info':'alert-warn');
  }
}

// ============================================================
// 重量推移トラッカー
// ============================================================
let trackerChart=null;
let trackerCurrentEx=null;

function getAllExerciseNames(){
  const names=new Set();
  DB.arr('trainings').forEach(t=>{
    if(t.exercises)t.exercises.forEach(e=>{if(e.name&&parseFloat(e.weight)>0)names.add(e.name);});
  });
  return [...names].sort();
}

function searchTrackerExercises(){
  const q=(document.getElementById('tracker-search').value||'').trim().toLowerCase();
  const all=getAllExerciseNames();
  const filtered=q?all.filter(n=>n.toLowerCase().includes(q)):all.slice(0,12);
  const el=document.getElementById('tracker-suggestions');
  if(!el)return;
  el.innerHTML=filtered.map(n=>`<span class="badge badge-gray" style="cursor:pointer;font-size:11px" onclick="selectTrackerEx('${n.replace(/'/g,"\\'")}')">
    ${n==='trackerCurrentEx'?'✓ ':''} ${n}
  </span>`).join('');
  if(filtered.length===0)el.innerHTML='<span class="muted">記録がありません</span>';
}

function selectTrackerEx(name){
  trackerCurrentEx=name;
  document.getElementById('tracker-search').value=name;
  const el=document.getElementById('tracker-selected-ex');
  if(el)el.textContent='表示中：'+name;
  searchTrackerExercises();
  renderWeightTracker();
}

function calc1RM(weight,reps){
  // Epley式: 1RM = weight × (1 + reps/30)
  if(reps<=0||weight<=0)return weight;
  if(reps===1)return weight;
  return Math.round(weight*(1+reps/30)*10)/10;
}

function renderWeightTracker(){
  if(!trackerCurrentEx)return;
  const use1RM=document.getElementById('tracker-use-1rm')?.checked||false;
  const rangeDays=parseInt(document.getElementById('tracker-range')?.value||60);
  const trainings=DB.arr('trainings');
  const cutoff=rangeDays>0?new Date(Date.now()-rangeDays*86400000):new Date(0);
  // 種目ごとのセッション最大重量を収集
  const dataPoints=[];
  trainings.forEach(t=>{
    if(!t.exercises||!t.date)return;
    const d=new Date(t.date);
    if(d<cutoff)return;
    t.exercises.forEach(e=>{
      if(e.name!==trackerCurrentEx)return;
      const w=parseFloat(e.weight)||0;
      const r=parseInt(e.reps)||1;
      if(w<=0)return;
      const val=use1RM?calc1RM(w,r):w;
      // 同日の場合は最大値を使う
      const existing=dataPoints.find(p=>p.date===t.date);
      if(existing){if(val>existing.val)existing.val=val;}
      else dataPoints.push({date:t.date,val,weight:w,reps:r});
    });
  });
  dataPoints.sort((a,b)=>a.date.localeCompare(b.date));
  if(!dataPoints.length){
    const el=document.getElementById('tracker-selected-ex');
    if(el)el.textContent=`"${trackerCurrentEx}" の記録が見つかりません`;
    return;
  }
  // グラフ描画
  if(trackerChart)trackerChart.destroy();
  const co={color:'#5a5a78',font:{size:10}};
  const ctx=document.getElementById('tracker-chart');
  if(!ctx)return;
  trackerChart=new Chart(ctx,{
    type:'line',
    data:{
      labels:dataPoints.map(p=>p.date.slice(5)),
      datasets:[{
        label:use1RM?'推定1RM (kg)':'最高重量 (kg)',
        data:dataPoints.map(p=>p.val),
        borderColor:'#ff4560',
        backgroundColor:'rgba(255,69,96,0.08)',
        tension:0.3,fill:true,borderWidth:2,
        pointRadius:4,pointBackgroundColor:'#ff4560',
        pointHoverRadius:6,
      }]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${ctx.parsed.y}kg`}}},
      scales:{
        x:{ticks:{...co},grid:{color:'rgba(255,255,255,0.04)'}},
        y:{ticks:{...co,callback:v=>v+'kg'},grid:{color:'rgba(255,255,255,0.04)'}},
      }
    }
  });
  // 統計表示
  const vals=dataPoints.map(p=>p.val);
  const first=vals[0],last=vals[vals.length-1];
  const max=Math.max(...vals),min=Math.min(...vals);
  const change=Math.round((last-first)*10)/10;
  const pct=first>0?Math.round((last-first)/first*100):0;
  const statsEl=document.getElementById('tracker-stats');
  if(statsEl){
    const statCard=(label,val,sub,col)=>`<div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--rs);padding:10px;text-align:center">
      <div style="font-size:10px;color:var(--text3);letter-spacing:1px;margin-bottom:4px">${label}</div>
      <div style="font-size:20px;font-weight:500;font-family:var(--font-mono);color:${col||'var(--text)'}">${val}</div>
      <div style="font-size:10px;color:var(--text3);margin-top:2px">${sub}</div>
    </div>`;
    statsEl.innerHTML=
      statCard('最高記録',max+'kg',use1RM?'推定1RM':'実重量','var(--accent)')+
      statCard('現在',last+'kg',dataPoints[dataPoints.length-1].date.slice(5),'var(--accent2)')+
      statCard('変化量',(change>=0?'+':'')+change+'kg','全期間',change>=0?'var(--accent4)':'var(--accent)')+
      statCard('進捗率',(pct>=0?'+':'')+pct+'%',dataPoints.length+'セッション',pct>=0?'var(--accent4)':'var(--accent)');
  }
}

function initWeightTracker(){
  // よく使う種目を自動提案
  const all=getAllExerciseNames();
  const el=document.getElementById('tracker-suggestions');
  if(el&&all.length>0){
    el.innerHTML=all.slice(0,10).map(n=>`<span class="badge badge-gray" style="cursor:pointer;font-size:11px" onclick="selectTrackerEx('${n.replace(/'/g,"\\'")}')"> ${n}</span>`).join('');
  }
}

// ============================================================
// 長期コンディション分析エンジン
// ============================================================
let condTrendChart=null;
