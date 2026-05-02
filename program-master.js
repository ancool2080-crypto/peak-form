const PROGRAMS_MASTER={
  FBS:{
    name:'FULL BODY SPLIT',label:'フルボディ',desc:'週3〜4回・全身法。各セッションで全部位を刺激。',
    color:'#4a9eff',icon:'◈',
    sessions:{
      FBA:{name:'FULL BODY A',focus:'プレスフォーカス',color:'#4a9eff',exercises:[
        {name:'ワイドグリップチンニング（広背筋）',reps:'6-10',part:'背中',rpe:'C'},
        {name:'オーバーグリップマシンロウ（上背部）',reps:'8-12',part:'背中',rpe:'M'},
        {name:'S/Aケーブルプルダウン',reps:'10-15',part:'背中',rpe:'M'},
        {name:'スミスマシン ハイインクラインプレス',reps:'8-12',part:'胸',rpe:'M'},
        {name:'HSマシンペックフライ',reps:'10-15',part:'胸',rpe:'I'},
        {name:'ディップス',reps:'8-12',part:'胸・三頭',rpe:'C'},
        {name:'ワンレッグレッグエクステンション',reps:'10-15',part:'四頭',rpe:'I'},
        {name:'レッグカール',reps:'10-15',part:'ハム',rpe:'M'},
        {name:'マシンアダクター',reps:'12-15',part:'内転筋',rpe:'I'},
        {name:'クロスボディケーブルエクステンション',reps:'12-15',part:'三頭',rpe:'I'},
        {name:'S/A DBプリチャーカール',reps:'10-15',part:'二頭',rpe:'I'},
        {name:'マシン サイドレイズ',reps:'12-20',part:'肩',rpe:'I'},
        {name:'カーフレイズ',reps:'15-20',part:'カーフ',rpe:'I'},
        {name:'マシンアブクランチ',reps:'AMRAP',part:'腹',rpe:'I'}]},
      FBB:{name:'FULL BODY B',focus:'プルフォーカス',color:'#f5a623',exercises:[
        {name:'ケーブルYレイズ',reps:'12-15',part:'肩後部',rpe:'I'},
        {name:'HSプレートロードインクラインプレス',reps:'8-12',part:'胸',rpe:'C'},
        {name:'スミスマシン フラットプレス',reps:'8-12',part:'胸',rpe:'C'},
        {name:'スミスマシン JMプレス',reps:'10-15',part:'三頭',rpe:'M'},
        {name:'ワイドグリップラットプルダウン',reps:'8-12',part:'背中',rpe:'M'},
        {name:'チェストサポーテッド T-BARロウ',reps:'8-12',part:'背中',rpe:'M'},
        {name:'S/Aケーブルプルダウン',reps:'10-15',part:'背中',rpe:'I'},
        {name:'ハイパーエクステンション',reps:'10-15',part:'脊柱起立筋',rpe:'C'},
        {name:'45°レッグプレス',reps:'10-15',part:'脚全体',rpe:'M'},
        {name:'ワンレッグレッグカール',reps:'10-15',part:'ハム',rpe:'I'},
        {name:'オルタネイトDBカール（スピネイト）',reps:'10-12',part:'二頭',rpe:'I'},
        {name:'ケーブルトライセプスプッシュダウン',reps:'12-15',part:'三頭',rpe:'I'},
        {name:'カーフレイズ',reps:'15-20',part:'カーフ',rpe:'I'},
        {name:'マシンアブクランチ',reps:'AMRAP',part:'腹',rpe:'I'}]},
      FBC:{name:'FULL BODY C',focus:'スクワットパターンフォーカス',color:'#22c55e',exercises:[
        {name:'レッグカール',reps:'10-15',part:'ハム',rpe:'M'},
        {name:'スミスマシン スクワット',reps:'8-12',part:'四頭',rpe:'C'},
        {name:'マシンヒッププレス',reps:'10-15',part:'臀部',rpe:'M'},
        {name:'レッグエクステンション',reps:'10-15',part:'四頭',rpe:'I'},
        {name:'Vバーラットプルダウン',reps:'8-12',part:'背中',rpe:'M'},
        {name:'ケルソーシュラッグ',reps:'10-15',part:'僧帽筋',rpe:'M'},
        {name:'リバースペックフライ',reps:'12-15',part:'肩後部',rpe:'I'},
        {name:'マシンフラットチェストプレス',reps:'8-12',part:'胸',rpe:'M'},
        {name:'マシンショルダープレス',reps:'8-12',part:'肩',rpe:'M'},
        {name:'ケーブルデクラインフライ',reps:'12-15',part:'胸下部',rpe:'I'},
        {name:'EZバープッシュダウン',reps:'12-15',part:'三頭',rpe:'I'},
        {name:'インクラインDBカール',reps:'10-12',part:'二頭',rpe:'I'},
        {name:'ハンマーカール',reps:'10-12',part:'二頭',rpe:'I'},
        {name:'DBサイドレイズ',reps:'12-20',part:'肩',rpe:'I'},
        {name:'ハンギングレッグレイズ',reps:'AMRAP',part:'腹',rpe:'I'},
        {name:'カーフレイズ',reps:'15-20',part:'カーフ',rpe:'I'}]}},
    cycle:['FBA','FBB','FBC'],schedule:{3:'A・休・B・休・C・有酸素・休',4:'A・休・B・C・休・A・有酸素'}},
  PPL:{
    name:'PUSH PULL LEGS',label:'PPL',desc:'週3〜6回・プッシュ/プル/レッグスの3分割。',
    color:'#f5a623',icon:'▶',
    sessions:{
      PUSH:{name:'PUSH（胸・肩・三頭）',focus:'プレス系・押す動作',color:'#ff4560',exercises:[
        {name:'スミスマシン インクラインプレス',reps:'6-10',part:'胸',rpe:'C'},
        {name:'マシンフラットチェストプレス',reps:'8-12',part:'胸',rpe:'M'},
        {name:'ケーブルデクラインフライ',reps:'12-15',part:'胸下部',rpe:'I'},
        {name:'HSマシンペックフライ',reps:'12-15',part:'胸',rpe:'I'},
        {name:'マシンショルダープレス',reps:'8-12',part:'肩',rpe:'M'},
        {name:'マシン サイドレイズ',reps:'12-20',part:'肩',rpe:'I'},
        {name:'ケーブルリアレイズ',reps:'12-15',part:'肩後部',rpe:'I'},
        {name:'ケーブルトライセプスプッシュダウン',reps:'12-15',part:'三頭',rpe:'I'},
        {name:'EZバープッシュダウン',reps:'10-15',part:'三頭',rpe:'I'},
        {name:'マシンアブクランチ',reps:'AMRAP',part:'腹',rpe:'I'}]},
      PULL:{name:'PULL（背中・二頭）',focus:'プル系・引く動作',color:'#4a9eff',exercises:[
        {name:'ワイドグリップチンニング（広背筋）',reps:'6-10',part:'背中',rpe:'C'},
        {name:'チェストサポーテッド T-BARロウ',reps:'8-12',part:'背中',rpe:'M'},
        {name:'ワイドグリップラットプルダウン',reps:'8-12',part:'背中',rpe:'M'},
        {name:'S/Aケーブルプルダウン',reps:'10-15',part:'背中',rpe:'I'},
        {name:'ケーブルYレイズ',reps:'12-15',part:'肩後部',rpe:'I'},
        {name:'オーバーグリップマシンロウ（上背部）',reps:'10-15',part:'背中',rpe:'M'},
        {name:'ケルソーシュラッグ',reps:'12-15',part:'僧帽筋',rpe:'M'},
        {name:'S/A DBプリチャーカール',reps:'10-15',part:'二頭',rpe:'I'},
        {name:'インクラインDBカール',reps:'10-12',part:'二頭',rpe:'I'},
        {name:'ハンマーカール',reps:'10-12',part:'二頭',rpe:'I'}]},
      LEGS:{name:'LEGS（脚・腹）',focus:'下半身・コア',color:'#22c55e',exercises:[
        {name:'スミスマシン スクワット',reps:'8-12',part:'四頭',rpe:'C'},
        {name:'45°レッグプレス',reps:'10-15',part:'脚全体',rpe:'M'},
        {name:'レッグエクステンション',reps:'12-15',part:'四頭',rpe:'I'},
        {name:'ワンレッグレッグエクステンション',reps:'12-15',part:'四頭',rpe:'I'},
        {name:'レッグカール',reps:'10-15',part:'ハム',rpe:'M'},
        {name:'ワンレッグレッグカール',reps:'12-15',part:'ハム',rpe:'I'},
        {name:'マシンヒッププレス',reps:'10-15',part:'臀部',rpe:'M'},
        {name:'マシンアダクター',reps:'12-15',part:'内転筋',rpe:'I'},
        {name:'カーフレイズ',reps:'15-20',part:'カーフ',rpe:'I'},
        {name:'ハンギングレッグレイズ',reps:'AMRAP',part:'腹',rpe:'I'},
        {name:'マシンアブクランチ',reps:'AMRAP',part:'腹',rpe:'I'}]}},
    cycle:['PUSH','PULL','LEGS'],schedule:{3:'PUSH・休・PULL・休・LEGS・休・休',6:'PUSH・PULL・LEGS・PUSH・PULL・LEGS・休'}},
  PPL_LU:{
    name:'PPL + UPPER/LOWER',label:'PPL+UL',desc:'週5〜6回・PPLとアッパー/ロアーのハイブリッド。',
    color:'#a78bfa',icon:'◎',
    sessions:{
      PUSH:{name:'PUSH',focus:'胸・肩・三頭',color:'#ff4560',exercises:[
        {name:'スミスマシン インクラインプレス',reps:'6-10',part:'胸',rpe:'C'},
        {name:'マシンフラットチェストプレス',reps:'8-12',part:'胸',rpe:'M'},
        {name:'ケーブルデクラインフライ',reps:'12-15',part:'胸下部',rpe:'I'},
        {name:'マシンショルダープレス',reps:'8-12',part:'肩',rpe:'M'},
        {name:'マシン サイドレイズ',reps:'12-20',part:'肩',rpe:'I'},
        {name:'EZバープッシュダウン',reps:'12-15',part:'三頭',rpe:'I'}]},
      PULL:{name:'PULL',focus:'背中・二頭',color:'#4a9eff',exercises:[
        {name:'ワイドグリップチンニング（広背筋）',reps:'6-10',part:'背中',rpe:'C'},
        {name:'チェストサポーテッド T-BARロウ',reps:'8-12',part:'背中',rpe:'M'},
        {name:'ワイドグリップラットプルダウン',reps:'8-12',part:'背中',rpe:'M'},
        {name:'S/A DBプリチャーカール',reps:'10-15',part:'二頭',rpe:'I'},
        {name:'ハンマーカール',reps:'10-12',part:'二頭',rpe:'I'}]},
      LEGS:{name:'LEGS',focus:'下半身',color:'#22c55e',exercises:[
        {name:'スミスマシン スクワット',reps:'8-12',part:'四頭',rpe:'C'},
        {name:'45°レッグプレス',reps:'10-15',part:'脚全体',rpe:'M'},
        {name:'レッグカール',reps:'10-15',part:'ハム',rpe:'M'},
        {name:'マシンヒッププレス',reps:'10-15',part:'臀部',rpe:'M'},
        {name:'カーフレイズ',reps:'15-20',part:'カーフ',rpe:'I'}]},
      UPPER:{name:'UPPER',focus:'上半身補強',color:'#f5a623',exercises:[
        {name:'HSプレートロードインクラインプレス',reps:'8-12',part:'胸',rpe:'C'},
        {name:'HSマシンペックフライ',reps:'10-15',part:'胸',rpe:'I'},
        {name:'S/Aケーブルプルダウン',reps:'10-15',part:'背中',rpe:'I'},
        {name:'ケーブルYレイズ',reps:'12-15',part:'肩後部',rpe:'I'},
        {name:'インクラインDBカール',reps:'10-12',part:'二頭',rpe:'I'},
        {name:'ケーブルトライセプスプッシュダウン',reps:'12-15',part:'三頭',rpe:'I'}]},
      LOWER:{name:'LOWER',focus:'下半身補強',color:'#1D9E75',exercises:[
        {name:'レッグエクステンション',reps:'12-15',part:'四頭',rpe:'I'},
        {name:'ワンレッグレッグカール',reps:'12-15',part:'ハム',rpe:'I'},
        {name:'マシンアダクター',reps:'12-15',part:'内転筋',rpe:'I'},
        {name:'ハイパーエクステンション',reps:'12-15',part:'脊柱起立筋',rpe:'C'},
        {name:'ハンギングレッグレイズ',reps:'AMRAP',part:'腹',rpe:'I'},
        {name:'マシンアブクランチ',reps:'AMRAP',part:'腹',rpe:'I'}]}},
    cycle:['PUSH','PULL','LEGS','UPPER','LOWER'],schedule:{5:'PUSH・PULL・LEGS・UPPER・LOWER・休・休',6:'PUSH・PULL・LEGS・UPPER・LOWER・PUSH・休'}},
  UL:{
    name:'UPPER / LOWER',label:'UL',desc:'週4回・上半身/下半身の2分割。各部位週2回。',
    color:'#22c55e',icon:'▲',
    sessions:{
      UPPER_A:{name:'UPPER A',focus:'プレス優先・上半身',color:'#ff4560',exercises:[
        {name:'スミスマシン インクラインプレス',reps:'6-10',part:'胸',rpe:'C'},
        {name:'マシンフラットチェストプレス',reps:'8-12',part:'胸',rpe:'M'},
        {name:'ワイドグリップラットプルダウン',reps:'8-12',part:'背中',rpe:'M'},
        {name:'チェストサポーテッド T-BARロウ',reps:'8-12',part:'背中',rpe:'M'},
        {name:'マシンショルダープレス',reps:'8-12',part:'肩',rpe:'M'},
        {name:'マシン サイドレイズ',reps:'12-20',part:'肩',rpe:'I'},
        {name:'S/A DBプリチャーカール',reps:'10-15',part:'二頭',rpe:'I'},
        {name:'ケーブルトライセプスプッシュダウン',reps:'12-15',part:'三頭',rpe:'I'}]},
      LOWER_A:{name:'LOWER A',focus:'スクワット優先・下半身',color:'#22c55e',exercises:[
        {name:'スミスマシン スクワット',reps:'8-12',part:'四頭',rpe:'C'},
        {name:'45°レッグプレス',reps:'10-15',part:'脚全体',rpe:'M'},
        {name:'レッグエクステンション',reps:'12-15',part:'四頭',rpe:'I'},
        {name:'レッグカール',reps:'10-15',part:'ハム',rpe:'M'},
        {name:'マシンヒッププレス',reps:'10-15',part:'臀部',rpe:'M'},
        {name:'カーフレイズ',reps:'15-20',part:'カーフ',rpe:'I'},
        {name:'ハンギングレッグレイズ',reps:'AMRAP',part:'腹',rpe:'I'}]},
      UPPER_B:{name:'UPPER B',focus:'プル優先・上半身',color:'#4a9eff',exercises:[
        {name:'ワイドグリップチンニング（広背筋）',reps:'6-10',part:'背中',rpe:'C'},
        {name:'S/Aケーブルプルダウン',reps:'10-15',part:'背中',rpe:'I'},
        {name:'ケーブルYレイズ',reps:'12-15',part:'肩後部',rpe:'I'},
        {name:'HSプレートロードインクラインプレス',reps:'8-12',part:'胸',rpe:'C'},
        {name:'HSマシンペックフライ',reps:'10-15',part:'胸',rpe:'I'},
        {name:'インクラインDBカール',reps:'10-12',part:'二頭',rpe:'I'},
        {name:'ハンマーカール',reps:'10-12',part:'二頭',rpe:'I'},
        {name:'EZバープッシュダウン',reps:'12-15',part:'三頭',rpe:'I'}]},
      LOWER_B:{name:'LOWER B',focus:'ヒンジ優先・下半身',color:'#1D9E75',exercises:[
        {name:'ハイパーエクステンション',reps:'10-15',part:'脊柱起立筋',rpe:'C'},
        {name:'マシンヒッププレス',reps:'10-15',part:'臀部',rpe:'M'},
        {name:'ワンレッグレッグカール',reps:'12-15',part:'ハム',rpe:'I'},
        {name:'マシンアダクター',reps:'12-15',part:'内転筋',rpe:'I'},
        {name:'ワンレッグレッグエクステンション',reps:'12-15',part:'四頭',rpe:'I'},
        {name:'カーフレイズ',reps:'15-20',part:'カーフ',rpe:'I'},
        {name:'マシンアブクランチ',reps:'AMRAP',part:'腹',rpe:'I'}]}},
    cycle:['UPPER_A','LOWER_A','UPPER_B','LOWER_B'],schedule:{4:'UA・LA・休・UB・LB・休・休'}},
};

function getCurrentProgram(){return DB.get('pf_current_program')||'FBS';}
function getCurrentProgramData(){
  const pid=getCurrentProgram();
  const prog=PROGRAMS_MASTER[pid];
  if(!prog)return PROGRAMS_MASTER['FBS'];
  // カスタム種目上書きをマージ
  const custom=DB.get('pf_custom_exercises')||{};
  const merged=JSON.parse(JSON.stringify(prog));
  Object.keys(merged.sessions).forEach(sid=>{
    const key=`${pid}_${sid}`;
    if(custom[key])merged.sessions[sid].exercises=custom[key];
  });
  return merged;
}

function showProgramSelector(){
  const el=document.getElementById('prog-selector');
  if(!el)return;
  el.style.display=el.style.display==='none'?'block':'none';
  if(el.style.display==='none')return;
  const cur=getCurrentProgram();
  const grid=document.getElementById('prog-selector-grid');
  if(!grid)return;
  grid.innerHTML=Object.entries(PROGRAMS_MASTER).map(([id,p])=>`
    <div onclick="selectProgram('${id}')" style="cursor:pointer;padding:14px;border-radius:var(--rs);border:2px solid ${id===cur?p.color:'var(--border)'};background:${id===cur?p.color+'15':'var(--bg3)'};transition:all 0.15s">
      <div style="font-size:20px;margin-bottom:6px;font-family:var(--font-display)">${p.icon}</div>
      <div style="font-weight:700;font-size:13px;color:${id===cur?p.color:'var(--text)'};margin-bottom:3px">${p.label}</div>
      <div style="font-size:11px;color:var(--text3);line-height:1.5">${p.desc}</div>
      ${id===cur?'<div style="font-size:10px;color:'+p.color+';margin-top:6px;font-weight:500">✓ 現在選択中</div>':''}
    </div>`).join('');
}
function selectProgram(id){
  DB.set('pf_current_program',id);
  document.getElementById('prog-selector').style.display='none';
  initProgramPage();
}

function initProgramPage(){
  const prog=getCurrentProgramData();
  const pid=getCurrentProgram();
  const p=PROGRAMS_MASTER[pid];
  // ラベル更新
  const lbl=document.getElementById('prog-program-label');
  if(lbl)lbl.textContent=prog.name+' — '+Object.keys(prog.sessions).length+'セッション';
  // セッションボタン描画
  const sgrid=document.getElementById('prog-session-grid');
  if(!sgrid)return;
  const last=DB.get('lastSession');
  const nextMap={};const cycle=prog.cycle||Object.keys(prog.sessions);
  cycle.forEach((s,i)=>nextMap[s]=cycle[(i+1)%cycle.length]);
  const recommended=last&&nextMap[last]?nextMap[last]:cycle[0];
  // サイクルヒント
  const hint=document.getElementById('prog-cycle-hint');
  if(hint&&last){const lname=(prog.sessions[last]||{}).name||last;const rname=(prog.sessions[recommended]||{}).name||recommended;hint.textContent=`前回: ${lname} → 次回推奨: ${rname}`;}
  else if(hint){hint.textContent='最初のセッションを選択してください';}
  sgrid.innerHTML=Object.entries(prog.sessions).map(([sid,s])=>{
    const isRec=sid===recommended;
    return`<div id="prog-btn-${sid}" onclick="selectSession('${sid}')" style="cursor:pointer;padding:16px 12px;border-radius:var(--rs);border:2px solid ${isRec?s.color:'var(--border)'};background:${isRec?s.color+'18':'var(--bg3)'};transition:all 0.2s;text-align:center">
      <div style="font-weight:700;color:${s.color};font-size:15px;margin-bottom:4px">${s.name.replace(/FULL BODY |UPPER |LOWER /,'')}</div>
      <div style="font-size:11px;color:var(--text2)">${s.focus}</div>
      ${isRec?'<div style="font-size:10px;color:'+s.color+';margin-top:5px;font-weight:600">← 次回推奨</div>':''}
      <div style="font-size:10px;color:var(--text3);margin-top:4px">${s.exercises.length}種目</div>
    </div>`;
  }).join('');
  // 週次スケジュール更新
  updateWeeklyScheduleTable(prog);
  // 前回セッションがあれば自動で選択
  if(recommended)selectSession(recommended);
}

function updateWeeklyScheduleTable(prog){
  const tbl=document.querySelector('#page-program .card:last-child table tbody');
  if(!tbl||!prog.schedule)return;
  tbl.innerHTML=Object.entries(prog.schedule).map(([days,sched])=>
    `<tr><td class="muted">週${days}回</td><td colspan="7" style="font-size:12px;color:var(--text2)">${sched}</td></tr>`
  ).join('');
}

// Exercise Customizer
let customizerSession=null;
let customizerDraft=[];

function openExerciseCustomizer(){
  if(!currentSession)return;
  const prog=getCurrentProgramData();
  const pid=getCurrentProgram();
  customizerSession=currentSession;
  customizerDraft=JSON.parse(JSON.stringify(prog.sessions[currentSession]?.exercises||[]));
  renderCustomizerList();
  renderPartFilterRow();
  populateExDatalist();
  document.getElementById('exercise-customizer').style.display='block';
  document.getElementById('exercise-customizer').scrollIntoView({behavior:'smooth'});
}
function closeExerciseCustomizer(){
  document.getElementById('exercise-customizer').style.display='none';
}
function renderPartFilterRow(){
  const parts=[...new Set(customizerDraft.map(e=>e.part))];
  const el=document.getElementById('part-filter-row');
  if(!el)return;
  el.innerHTML=`<span class="badge badge-blue" style="cursor:pointer" onclick="renderCustomizerList('')">全て</span>`+
    parts.map(p=>`<span class="badge badge-gray" style="cursor:pointer" onclick="renderCustomizerList('${p}')">${p}</span>`).join('');
}
function renderCustomizerList(filterPart=''){
  const el=document.getElementById('customizer-ex-list');if(!el)return;
  const list=filterPart?customizerDraft.filter(e=>e.part===filterPart):customizerDraft;
  const typeBg={C:'rgba(255,69,96,0.12)',M:'rgba(74,158,255,0.12)',I:'rgba(167,139,250,0.12)'};
  const typeCol={C:'#ff4560',M:'#4a9eff',I:'#a78bfa'};
  const typeShort={C:'CF',M:'CM',I:'ISO'};
  el.innerHTML=list.map((e,i)=>{
    const realIdx=customizerDraft.indexOf(e);
    return`<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border)">
      <span style="font-size:10px;padding:2px 6px;border-radius:4px;background:${typeBg[e.rpe||'I']};color:${typeCol[e.rpe||'I']}">${typeShort[e.rpe||'I']}</span>
      <span style="flex:1;font-size:13px">${e.name}</span>
      <span style="font-size:11px;color:var(--text3)">${e.part}</span>
      <span class="mono" style="font-size:11px;color:var(--text3)">${e.reps}</span>
      <button class="btn btn-sm btn-danger" style="padding:3px 8px;font-size:11px" onclick="removeCustomEx(${realIdx})">削除</button>
    </div>`;
  }).join('')||'<div class="muted">種目がありません。下から追加してください。</div>';
}
function removeCustomEx(idx){
  customizerDraft.splice(idx,1);
  renderCustomizerList();
  renderPartFilterRow();
}
function addCustomExercise(){
  const name=document.getElementById('custom-ex-name').value.trim();
  const part=document.getElementById('custom-ex-part').value;
  const reps=document.getElementById('custom-ex-reps').value||'8-12';
  const rpe=document.getElementById('custom-ex-type').value;
  if(!name){alert('種目名を入力してください');return}
  customizerDraft.push({name,part,reps,rpe});
  document.getElementById('custom-ex-name').value='';
  renderCustomizerList();
  renderPartFilterRow();
}
function saveCustomExercises(){
  const pid=getCurrentProgram();
  const key=`${pid}_${customizerSession}`;
  const custom=DB.get('pf_custom_exercises')||{};
  custom[key]=customizerDraft;
  DB.set('pf_custom_exercises',custom);
  closeExerciseCustomizer();
  selectSession(customizerSession);
  alert('種目構成を保存しました。');
}
function populateExDatalist(){
  const dl=document.getElementById('ex-datalist');if(!dl)return;
  const allEx=new Set();
  Object.values(PROGRAMS_MASTER).forEach(p=>Object.values(p.sessions).forEach(s=>s.exercises.forEach(e=>allEx.add(e.name))));
  dl.innerHTML=[...allEx].map(n=>`<option value="${n}">`).join('');
}

// ============================================================
// 有酸素フィールド切替
// ============================================================