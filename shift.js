const SHIFT_TYPES={
  '24h':    {label:'24h勤務',   bg:'rgba(255,69,96,0.25)',  border:'rgba(255,69,96,0.6)',  text:'#ff6b7a',icon:'🔥',load:800},
  'off':    {label:'非番',      bg:'rgba(90,90,120,0.25)',  border:'rgba(90,90,120,0.5)',  text:'var(--text2)',icon:'💤',load:100},
  'off-work':{label:'非番出勤', bg:'rgba(245,166,35,0.28)', border:'rgba(245,166,35,0.7)', text:'#fbbf24',icon:'⚡',load:600},
  'rest':   {label:'週休',      bg:'rgba(74,158,255,0.2)',  border:'rgba(74,158,255,0.5)', text:'#6baaff',icon:'🏠',load:0},
  'rest-work':{label:'週休出勤',bg:'rgba(167,139,250,0.28)',border:'rgba(167,139,250,0.7)',text:'#c4b5fd',icon:'🚨',load:700},
  'gym':    {label:'ジム',      bg:'rgba(34,197,94,0.2)',   border:'rgba(34,197,94,0.5)',  text:'#4ade80',icon:'💪',load:0},
  'cardio': {label:'有酸素',    bg:'rgba(29,158,117,0.2)',  border:'rgba(29,158,117,0.5)', text:'#34d399',icon:'🏃',load:200},
};
// 非番→非番出勤、週休→週休出勤 のサイクルマップ
const SHIFT_CYCLE={'off':'off-work','off-work':'off','rest':'rest-work','rest-work':'rest'};
function getShiftData(){return DB.get('pf_shift_data')||{};}
function getShiftType(entry){return typeof entry==='object'?entry.type:entry;}
function getShiftLoad(entry){
  if(typeof entry==='object'&&entry.load!=null)return entry.load;
  const t=SHIFT_TYPES[typeof entry==='object'?entry.type:entry];
  return t?t.load:0;
}
function setShiftMode(mode){
  currentShiftMode=mode;
  const modeLabels={'24h':'24h勤務','off':'非番','off-work':'非番出勤','rest':'週休','rest-work':'週休出勤','gym':'ジム','cardio':'有酸素','clear':'クリア'};
  const el=document.getElementById('shift-cur-mode-label');
  if(el)el.textContent='モード: '+(modeLabels[mode]||mode);
  document.querySelectorAll('[id^="shift-mode-"]').forEach(b=>b.style.opacity='0.4');
  const cur=document.getElementById('shift-mode-'+mode.replace('h',''));
  const cur2=document.getElementById('shift-mode-'+mode);
  if(cur)cur.style.opacity='1';if(cur2)cur2.style.opacity='1';
}
let extraWorkTarget=null;
function toggleShiftDay(dateStr){
  const data=getShiftData();
  if(currentShiftMode==='clear'){
    delete data[dateStr];
    DB.set('pf_shift_data',data);
    renderShiftPage();
    return;
  }
  // 特別出勤はモーダルを開く
  if(currentShiftMode==='off-work'||currentShiftMode==='rest-work'){
    openExtraWorkModal(dateStr, currentShiftMode, data[dateStr]);
    return;
  }
  // 既に特別出勤として登録済みの日に別モードで上書き
  const current=data[dateStr];
  const currentType=getShiftType(current);
  if((currentType==='off-work'||currentType==='rest-work')&&currentShiftMode!==currentType){
    if(!confirm(`${dateStr} は${SHIFT_TYPES[currentType].label}として登録済みです。${SHIFT_TYPES[currentShiftMode].label}に変更しますか？`))return;
  }
  // 通常シフト: 同じ→サイクル
  if(currentType===currentShiftMode&&SHIFT_CYCLE[currentShiftMode]){
    data[dateStr]=SHIFT_CYCLE[currentShiftMode];
  } else if(currentType===currentShiftMode){
    delete data[dateStr];
  } else {
    if(currentType==='24h'&&currentShiftMode!=='24h'){
      if(!confirm(`${dateStr} は24h勤務として登録済みです。変更しますか？`))return;
    }
    data[dateStr]=currentShiftMode;
  }
  DB.set('pf_shift_data',data);
  renderShiftPage();
}
function openExtraWorkModal(dateStr, type, existing){
  extraWorkTarget={dateStr,type};
  const title=document.getElementById('extra-work-title');
  const dateEl=document.getElementById('extra-work-date');
  if(title)title.textContent=SHIFT_TYPES[type].icon+' '+SHIFT_TYPES[type].label+' 詳細入力';
  if(dateEl)dateEl.textContent=dateStr;
  // 既存データがあれば復元
  if(existing&&typeof existing==='object'&&existing.type===type){
    document.getElementById('extra-hours').value=existing.hours||4;
    document.getElementById('extra-content').value=existing.content||'training';
    document.getElementById('extra-note').value=existing.note||'';
  } else {
    document.getElementById('extra-hours').value=4;
    document.getElementById('extra-content').value='training';
    document.getElementById('extra-note').value='';
  }
  updateExtraLoad();
  const modal=document.getElementById('extra-work-modal');
  if(modal){modal.style.display='flex';}
}
function closeExtraWorkModal(){
  const modal=document.getElementById('extra-work-modal');
  if(modal)modal.style.display='none';
  extraWorkTarget=null;
}
function updateExtraLoad(){
  const hours=parseFloat(document.getElementById('extra-hours').value)||0;
  const sel=document.getElementById('extra-content');
  const intensity=parseFloat(sel.options[sel.selectedIndex]?.dataset.intensity||2);
  const load=Math.round(hours*intensity*100);
  const el=document.getElementById('extra-load-preview');
  if(el){
    el.textContent=load;
    const color=load<200?'var(--accent4)':load<500?'var(--accent3)':'var(--accent)';
    el.style.color=color;
  }
}
function saveExtraWork(){
  if(!extraWorkTarget)return;
  const hours=parseFloat(document.getElementById('extra-hours').value)||0;
  const sel=document.getElementById('extra-content');
  const content=sel.value;
  const intensity=parseFloat(sel.options[sel.selectedIndex]?.dataset.intensity||2);
  const note=document.getElementById('extra-note').value;
  const load=Math.round(hours*intensity*100);
  const data=getShiftData();
  data[extraWorkTarget.dateStr]={
    type:extraWorkTarget.type,
    hours,content,note,load,
    label:sel.options[sel.selectedIndex]?.text||content
  };
  DB.set('pf_shift_data',data);
  closeExtraWorkModal();
  renderShiftPage();
}
function clearExtraWork(){
  if(!extraWorkTarget)return;
  const data=getShiftData();
  delete data[extraWorkTarget.dateStr];
  DB.set('pf_shift_data',data);
  closeExtraWorkModal();
  renderShiftPage();
}
function shiftMonthOffset(delta){
  if(delta===0)shiftMonthDelta=0;else shiftMonthDelta+=delta;
  renderShiftPage();
}
function renderShiftPage(){
  const now=new Date();
  const base=new Date(now.getFullYear(),now.getMonth()+shiftMonthDelta,1);
  const year=base.getFullYear(),month=base.getMonth();
  const el=document.getElementById('shift-month-label');
  if(el)el.textContent=`${year}年${month+1}月`;
  const grid=document.getElementById('shift-calendar-grid');
  if(!grid)return;
  const data=getShiftData();
  const todayStr=today();
  const firstDay=new Date(year,month,1);
  const lastDay=new Date(year,month+1,0);
  const startDow=firstDay.getDay()===0?6:firstDay.getDay()-1;// 月曜始まり
  let html2='';
  let weekHtml=`<div class="week-row"><div class="week-label"></div>`;
  // 前月の空白
  for(let i=0;i<startDow;i++){weekHtml+=`<div class="day-cell" style="opacity:0.2"></div>`;}
  let col=startDow;
  for(let d=1;d<=lastDay.getDate();d++){
    const dateStr=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const entry=data[dateStr];
    const type=getShiftType(entry);const t=SHIFT_TYPES[type];
    const isToday=dateStr===todayStr;
    const style=t?`background:${t.bg};border:1px solid ${t.border};color:${t.text}`:'background:var(--bg3);border:1px solid var(--border)';
    // 特別出勤の場合は時間数を表示
    const extraHint=(typeof entry==='object'&&entry.hours)
      ? `<span style="font-size:8px;opacity:0.9;font-family:var(--font-mono)">${entry.hours}h</span>`
      : '';
    weekHtml+=`<div class="day-cell${isToday?' today-cell':''}" style="${style};cursor:pointer;flex-direction:column;gap:1px" onclick="toggleShiftDay('${dateStr}')">
      <span style="font-size:12px">${t?t.icon:''}</span>
      <span style="font-size:9px;font-family:var(--font-mono)">${d}</span>
      ${extraHint}
    </div>`;
    col++;
    if(col===7){weekHtml+='</div>';html2+=weekHtml;weekHtml=`<div class="week-row"><div class="week-label"></div>`;col=0;}
  }
  if(col>0){for(let i=col;i<7;i++)weekHtml+=`<div class="day-cell" style="opacity:0.2"></div>`;weekHtml+='</div>';html2+=weekHtml;}
  grid.innerHTML=html2;
  // Summary
  const monthKeys=Object.keys(data).filter(k=>k.startsWith(`${year}-${String(month+1).padStart(2,'0')}`));
  const counts={};Object.values(SHIFT_TYPES).forEach(t=>counts[t.label]=0);
  monthKeys.forEach(k=>{
    const entry=data[k];const type=getShiftType(entry);const t=SHIFT_TYPES[type];
    if(t){
      counts[t.label]=(counts[t.label]||0)+1;
      // 特別出勤は時間も集計
      if((type==='off-work'||type==='rest-work')&&typeof entry==='object'&&entry.hours){
        const hKey=t.label+'_hours';counts[hKey]=(counts[hKey]||0)+entry.hours;
      }
    }
  });
  const sumEl=document.getElementById('shift-summary');
  if(sumEl){
    const rows=Object.entries(counts)
      .filter(([k,v])=>v>0&&!k.endsWith('_hours'))
      .map(([k,v])=>{
        const hKey=k+'_hours';const hrs=counts[hKey];
        const hrsStr=hrs?` <span style="font-size:11px;color:var(--text3)">(合計${hrs}h)</span>`:'';
        return`<div class="row-between" style="padding:5px 0;border-bottom:1px solid var(--border)"><span class="muted">${k}${hrsStr}</span><span class="mono">${v}日</span></div>`;
      });
    sumEl.innerHTML=rows.join('')||'<div class="muted">登録なし</div>';
  }
  // ACWR
  renderShiftACWR(data);
}
function renderShiftACWR(data){
  const el=document.getElementById('shift-acwr');if(!el)return;
  const nowD=new Date();
  let acute=0,chronic7sum=0;
  const trainings=DB.arr('trainings');
  for(let i=0;i<28;i++){
    const d=new Date(nowD);d.setDate(nowD.getDate()-i);
    const ds=d.toISOString().slice(0,10);
    const entry_acwr=data[ds];
    let load=getShiftLoad(entry_acwr);
    // 通常シフトのデフォルト負荷は SHIFT_TYPES で管理済み
    // トレーニング記録があればそれを使う
    const tr=trainings.filter(t=>t.date===ds);
    if(tr.length)load=Math.max(load,tr.reduce((a,t)=>(parseInt(t.duration)||0)*(parseInt(t.rpe)||5)+a,0));
    if(i<7)acute+=load;
    chronic7sum+=load;
  }
  const chronic=chronic7sum/4;
  const acwr=chronic>0?Math.round(acute/chronic*100)/100:0;
  const color=acwr>=0.8&&acwr<=1.3?'var(--accent4)':acwr<0.8?'var(--accent2)':'var(--accent)';
  el.innerHTML=`<div class="grid2" style="gap:8px;margin-bottom:8px">
    <div class="metric"><div class="metric-label">急性負荷(7日)</div><div class="metric-val" style="font-size:20px">${acute}</div></div>
    <div class="metric"><div class="metric-label">慢性負荷(28日平均)</div><div class="metric-val" style="font-size:20px">${Math.round(chronic)}</div></div>
  </div>
  <div style="text-align:center;padding:10px 0">
    <div style="font-size:11px;color:var(--text3);letter-spacing:2px;font-family:var(--font-mono);margin-bottom:4px">ACWR</div>
    <div style="font-size:36px;font-weight:500;font-family:var(--font-mono);color:${color}">${acwr.toFixed(2)}</div>
    <div style="font-size:12px;color:${color};margin-top:4px">${acwr>=0.8&&acwr<=1.3?'✓ スイートスポット':acwr<0.8?'低負荷ゾーン':'⚠ 過負荷リスク'}</div>
  </div>`;
}
function applyShiftPattern(){
  const start=document.getElementById('shift-pattern-start').value;
  const weeks=parseInt(document.getElementById('shift-pattern-weeks').value)||8;
  const pat=document.getElementById('shift-pattern-type').value;
  if(!start){alert('開始日を設定してください');return}
  const data=getShiftData();
  const patterns={
    tfd:['24h','off','rest'],
    tfd2:['24h','off','rest','rest'],
  };
  const cycle=patterns[pat]||['24h','off','rest'];
  let idx=0;
  const base=new Date(start);
  for(let d=0;d<weeks*7;d++){
    const cur=new Date(base);cur.setDate(base.getDate()+d);
    const ds=cur.toISOString().slice(0,10);
    data[ds]=cycle[idx%cycle.length];
    idx++;
  }
  DB.set('pf_shift_data',data);
  renderShiftPage();
  alert(`${weeks}週間分のシフトを登録しました。`);
}

// ============================================================
// PROGRAM SELECTOR + EXERCISE CUSTOMIZER
// ============================================================
// 全プログラムマスターデータ
c