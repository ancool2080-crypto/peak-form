function renderDashboard(){
  const now=new Date();
  document.getElementById('topbar-date').textContent=now.toLocaleDateString('ja-JP',{month:'long',day:'numeric',weekday:'short'});
  const{atl,ctl,tsb,history}=computeLoad();
  document.getElementById('d-ctl').textContent=fmtInt(ctl);
  document.getElementById('d-atl').textContent=fmtInt(atl);
  document.getElementById('d-tsb').textContent=(tsb>=0?'+':'')+fmtInt(tsb);
  const sleeps=DB.arr('sleeps').slice(-7);
  const avgSleep=sleeps.length?sleeps.reduce((a,s)=>a+(s.duration||0),0)/sleeps.length:null;
  const avgWellness=sleeps.length?sleeps.reduce((a,s)=>a+(s.wellness||0),0)/sleeps.length:null;
  const sessions7=DB.arr('trainings').filter(t=>{const d=new Date(t.date);const w=new Date();w.setDate(w.getDate()-7);return d>=w}).length;
  // 改善版コンディションスコア（0〜100）
  // 根拠: 睡眠が最もパフォーマンスに影響（重み40%）、TSB 30%、ウェルネス 30%
  let scoreSleep=50,scoreTsb=50,scoreWell=50;
  // 睡眠スコア（最重要 x0.4）
  if(avgSleep){
    if(avgSleep>=8)scoreSleep=100;
    else if(avgSleep>=7)scoreSleep=85;
    else if(avgSleep>=6)scoreSleep=55;
    else if(avgSleep>=5)scoreSleep=30;
    else scoreSleep=10;
  }
  // TSBスコア（x0.3）— TSBは通常 -30〜+20の範囲
  const tsbNorm=Math.min(100,Math.max(0,Math.round((tsb+25)/45*100)));
  scoreTsb=tsbNorm; // TSBスコアは常に設定
  // ウェルネススコア（x0.3）
  if(avgWellness){
    scoreWell=Math.round((avgWellness-1)/9*100);
  }
  // 栄養スコア（本日のカロリー達成率から算出）
  const todayMealsScore=DB.arr('meals').filter(m=>m.date===today());
  const todayCalScore=todayMealsScore.reduce((a,m)=>a+(m.cal||0),0);
  const cfgScore=cfg();const calTargetScore=getCalTarget(cfgScore.goalmode||'maintain');
  const calRate=calTargetScore>0?todayCalScore/calTargetScore:0;
  const scoreNutrition=Math.round(Math.min(100,Math.max(0,(1-Math.abs(1-calRate))*100)));
  // 勤務由来疲労（シフトデータ）
  const shiftDataScore=DB.get('pf_shift_data')||{};
  const todayShiftScore=shiftDataScore[today()];
  const shiftLoad=todayShiftScore?getShiftLoad(todayShiftScore):0;
  const scoreFatigue=Math.max(0,100-Math.round(shiftLoad/8)); // 負荷800→スコア0、0→100
  // 総合スコア: 睡眠40% + TSB20% + ウェルネス25% + 栄養10% + 勤務疲労5%
  let score=Math.round(scoreSleep*0.40+scoreTsb*0.20+scoreWell*0.25+scoreNutrition*0.10+scoreFatigue*0.05);
  score=Math.max(0,Math.min(100,score));
  // 日次スコアを保存（長期トレンド用）
  const dailyScores=DB.get('pf_daily_scores')||{};
  dailyScores[today()]={
    condScore:score,
    sleepScore:Math.round(scoreSleep),
    tsb:Math.round(tsb),
    wellScore:Math.round(scoreWell),
    nutritionScore:Math.round(scoreNutrition),
    fatigue:Math.round(100-scoreFatigue),
    avgSleep:avgSleep||0,
    avgWellness:avgWellness||0
  };
  // 最大2年分のみ保持
  const cutoff=new Date();cutoff.setFullYear(cutoff.getFullYear()-2);
  const cutoffStr=cutoff.toISOString().slice(0,10);
  Object.keys(dailyScores).forEach(k=>{if(k<cutoffStr)delete dailyScores[k];});
  DB.set('pf_daily_scores',dailyScores);
  document.getElementById('d-condition').textContent=score;
  const todayMeals=DB.arr('meals').filter(m=>m.date===today());
  const todayCal=todayMeals.reduce((a,m)=>a+(m.cal||0),0);
  const c=cfg();const mode=c.goalmode||'maintain';const calT=getCalTarget(mode);const macros=getMacros(calT,c.tdeeweight||70);
  document.getElementById('d-cal-target').textContent=calT+'kcal';
  document.getElementById('d-cal-today').textContent=todayCal+'kcal';
  document.getElementById('d-cal-bar').style.width=Math.min(100,Math.round(todayCal/calT*100))+'%';
  const todayP=todayMeals.reduce((a,m)=>a+(m.protein||0),0);
  const todayC=todayMeals.reduce((a,m)=>a+(m.carb||0),0);
  const todayF=todayMeals.reduce((a,m)=>a+(m.fat||0),0);
  document.getElementById('d-macro-summary').innerHTML=`<div style="text-align:center"><div class="mono" style="font-size:14px">${todayP}/${macros.protein}g</div><div style="font-size:10px;color:var(--text3);margin-top:2px">PROTEIN</div></div><div style="text-align:center"><div class="mono" style="font-size:14px">${todayC}/${macros.carb}g</div><div style="font-size:10px;color:var(--text3);margin-top:2px">CARBS</div></div><div style="text-align:center"><div class="mono" style="font-size:14px">${todayF}/${macros.fat}g</div><div style="font-size:10px;color:var(--text3);margin-top:2px">FAT</div></div>`;
  const modeColors={maintain:'badge-blue',cut:'badge-amber',bulk:'badge-green'};const modeLabels={maintain:'維持',cut:'減量',bulk:'増量'};
  document.getElementById('d-goal-badge').innerHTML=`<span class="badge ${modeColors[mode]}">${modeLabels[mode]}</span>`;
  document.getElementById('d-avg-sleep').textContent=avgSleep?fmt1(avgSleep)+'h':'—';
  document.getElementById('d-wellness').textContent=avgWellness?fmt1(avgWellness)+'/10':'—';
  document.getElementById('d-sessions').textContent=sessions7+'回/週';
  let intensity='',ic='var(--text2)';
  if(tsb>10){intensity='高強度推奨';ic='var(--accent4)'}else if(tsb>-5){intensity='通常強度';ic='var(--accent2)'}else if(tsb>-15){intensity='やや抑えめ';ic='var(--accent3)'}else{intensity='回復優先';ic='var(--accent)'}
  document.getElementById('d-rec-intensity').innerHTML=`<span style="color:${ic};font-size:13px;font-weight:600">${intensity}</span>`;
  const alerts=document.getElementById('dash-alerts');alerts.innerHTML='';
  // シフトデータから今日・明日の予定を確認
  const shiftData=DB.get('pf_shift_data')||{};
  const todayShiftEntry=shiftData[today()];
  const todayShift=getShiftType(todayShiftEntry);
  const tomorrowD=new Date();tomorrowD.setDate(tomorrowD.getDate()+1);
  const tomorrowShiftEntry=shiftData[tomorrowD.toISOString().slice(0,10)];
  const tomorrowShift=getShiftType(tomorrowShiftEntry);
  // 特別出勤の場合は時間数と内容も取得してアラートに反映
  const todayExtraHours=typeof todayShiftEntry==='object'?todayShiftEntry.hours:null;
  const todayExtraLabel=typeof todayShiftEntry==='object'?todayShiftEntry.label||'':null;
  if(todayShift==='off-work'){
    const detail=todayExtraHours?` (${todayExtraHours}h${todayExtraLabel?' · '+todayExtraLabel:''})`:' ';
    alerts.innerHTML+=`<div class="alert alert-warn">⚡ 今日は<strong>非番出勤</strong>${detail}です。全種目RIRを+2して強度を落としてください。</div>`;
  }
  if(todayShift==='rest-work'){
    const detail=todayExtraHours?` (${todayExtraHours}h${todayExtraLabel?' · '+todayExtraLabel:''})`:' ';
    const heavy=todayExtraHours&&todayExtraHours>=6;
    alerts.innerHTML+=`<div class="alert alert-danger">🚨 今日は<strong>週休出勤</strong>${detail}です。${heavy?'長時間勤務のため筋トレ中止・完全回復を推奨します。':'筋トレは有酸素またはモビリティのみ推奨します。'}</div>`;
  }
  if(tomorrowShift==='24h')alerts.innerHTML+=`<div class="alert alert-info">🔥 明日は24h勤務です。今日のトレーニングは軽めにして翌日のパフォーマンスを確保しましょう。</div>`;
  if(tomorrowShift==='rest-work')alerts.innerHTML+=`<div class="alert alert-warn">🚨 明日は週休出勤です。今日は完全回復優先（筋トレ中止またはデロード）を推奨します。</div>`;
  if(tsb<-15)alerts.innerHTML+=`<div class="alert alert-warn">⚠ 疲労蓄積が高い状態（TSB: ${tsb}）。今日は軽負荷またはアクティブリカバリーを推奨します。</div>`;
  if(avgSleep&&avgSleep<6)alerts.innerHTML+=`<div class="alert alert-warn">⚠ 直近7日の平均睡眠が${fmt1(avgSleep)}時間です。7時間以上の確保を優先してください。</div>`;
  if(score>=80&&!todayShift?.includes('work'))alerts.innerHTML+=`<div class="alert alert-success">✓ コンディション良好（${score}/100）。高強度トレーニングに最適な状態です。</div>`;
  const pk=DB.get('peaking');
  if(pk){const startD=new Date(pk.start);const todayD=new Date(today());const weekNum=Math.floor((todayD-startD)/(7*86400000));const phase=pk.phases.find(p=>weekNum>=p.startWeek&&weekNum<p.startWeek+p.weeks);if(phase){const colors={accumulate:'badge-blue',intensify:'badge-amber',convert:'badge-red',taper:'badge-green'};const phaseNames={accumulate:'蓄積期',intensify:'強化期',convert:'変換期',taper:'テーパー期'};document.getElementById('dash-phase-badge').innerHTML=`<span class="badge ${colors[phase.type]}">${phaseNames[phase.type]} W${weekNum+1}</span>`;}}
  const recent=DB.arr('trainings').slice(-5).reverse();const rEl=document.getElementById('d-recent-trainings');
  if(!recent.length){rEl.innerHTML='<div class="muted">まだ記録がありません</div>';return}
  rEl.innerHTML='<table><thead><tr><th>日付</th><th>種別</th><th>時間</th><th>RPE</th><th>負荷</th></tr></thead><tbody>'+recent.map(t=>`<tr><td class="mono">${t.date}</td><td><span class="badge badge-blue">${typeLabel[t.type]||t.type}</span></td><td>${t.duration}分</td><td class="mono">${t.rpe}</td><td class="mono">${t.duration*t.rpe}</td></tr>`).join('')+'</tbody></table>';
  // 週間ボリューム表示
  const wv=computeWeeklyVolume();
  const wvEl=document.getElementById('d-weekly-volume');
  if(wvEl){
    if(!wv||!Object.keys(wv).length){
      wvEl.innerHTML='<div class="muted">今週のトレーニング記録がありません</div>';
    }else{
      // 部位グループ定義
      const groups=[
        {label:'下半身',parts:['四頭','ハム','臀部','脚全体','カーフ','内転筋'],color:'#22c55e'},
        {label:'上背部',parts:['背中','脊柱起立筋','僧帽筋'],color:'#4a9eff'},
        {label:'胸',parts:['胸','胸・三頭','胸下部'],color:'#ff4560'},
        {label:'肩',parts:['肩','肩後部'],color:'#f5a623'},
        {label:'腕',parts:['二頭','三頭','カーフ'],color:'#a78bfa'},
        {label:'体幹',parts:['腹'],color:'#6b7280'},
      ];
      const mev=4,sweet=10,max=20; // 目安セット数
      let html2='<div style="display:flex;flex-direction:column;gap:6px">';
      groups.forEach(g=>{
        const total=g.parts.reduce((a,p)=>a+(wv[p]||0),0);
        const rounded=Math.round(total*10)/10;
        if(rounded===0)return;
        const pct=Math.min(100,Math.round(total/max*100));
        const zone=total<mev?'(MEV未達)':total<=sweet?'(効率ゾーン)':'(高ボリューム)';
        const barCol=total<mev?'#f5a623':total<=sweet?g.color:'#ff4560';
        html2+=`<div>
          <div class="row-between" style="margin-bottom:3px">
            <span style="font-size:12px;color:var(--text)">${g.label}</span>
            <span class="mono" style="font-size:12px;color:${barCol}">${rounded}セット <span style="font-size:10px;color:var(--text3)">${zone}</span></span>
          </div>
          <div style="height:5px;background:var(--bg4);border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${barCol};border-radius:3px;transition:width 0.5s ease"></div>
          </div>
        </div>`;
      });
      html2+='</div>';
      wvEl.innerHTML=html2;
    }
  }

  const last21=history.slice(-21);if(dashChart)dashChart.destroy();
  if(last21.length){const co={color:'#5a5a78',font:{size:10}};dashChart=new Chart(document.getElementById('dash-load-chart'),{type:'line',data:{labels:last21.map(d=>d.date.slice(5)),datasets:[{label:'CTL',data:last21.map(d=>d.ctl),borderColor:'#4a9eff',tension:0.4,fill:false,borderWidth:2,pointRadius:0},{label:'ATL',data:last21.map(d=>d.atl),borderColor:'#ff4560',tension:0.4,fill:false,borderWidth:2,pointRadius:0},{label:'TSB',data:last21.map(d=>d.tsb),borderColor:'#22c55e',tension:0.4,fill:false,borderWidth:1.5,pointRadius:0,borderDash:[5,4]}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:co,grid:{color:'rgba(255,255,255,0.04)'}},y:{ticks:co,grid:{color:'rgba(255,255,255,0.04)'}}}}})}
}

function computeLoad(){
  const s=DB.arr('trainings');const days={};
  s.forEach(t=>{const l=(parseInt(t.duration)||0)*(parseInt(t.rpe)||5);days[t.date]=(days[t.date]||0)+l});
  if(!Object.keys(days).length)return{atl:0,ctl:0,tsb:0,history:[]};
  let atl=0,ctl=0;const all=[];
  const start=new Date(Object.keys(days).sort()[0]);const end=new Date(today());
  for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
    const ds=d.toISOString().slice(0,10);const load=days[ds]||0;
    atl=atl+(load-atl)*(1-Math.exp(-1/7));ctl=ctl+(load-ctl)*(1-Math.exp(-1/42));
    all.push({date:ds,atl:Math.round(atl),ctl:Math.round(ctl),tsb:Math.round(ctl-atl)});
  }
  return{atl:Math.round(atl),ctl:Math.round(ctl),tsb:Math.round(ctl-atl),history:all};
}

function computeWeeklyVolume(){
  // 今週月曜日を計算
  const now=new Date();const dow=now.getDay();const mon=new Date(now);
  mon.setDate(now.getDate()-(dow===0?6:dow-1));mon.setHours(0,0,0,0);
  const monStr=mon.toISOString().slice(0,10);
  const weekTr=DB.arr('trainings').filter(t=>t.date>=monStr);
  if(!weekTr.length)return null;

  // 部位タグ → 部位名マッピング（FBPの種目データ参照）
  // 分数カウント: コンパウンド(CF)は補助筋0.5換算
  const partVolume={}; // {部位名: セット数(実効)}
  const addVol=(part,val)=>{partVolume[part]=(partVolume[part]||0)+val;};

  // FBP種目データから部位タイプを引く
  const exTypeMap={};
  const curProg=getCurrentProgramData();Object.values(curProg.sessions).forEach(s=>{s.exercises.forEach(e=>{exTypeMap[e.name]={part:e.part,rpe:e.rpe||'I'};});});

  // コンパウンド種目の補助筋マップ
  const compoundAssist={
    'ワイドグリップチンニング（広背筋）':[['背中',1.0],['二頭',0.5]],
    'スミスマシン ハイインクラインプレス':[['胸',1.0],['三頭',0.5]],
    'ディップス':[['胸・三頭',1.0]],
    'HSプレートロードインクラインプレス':[['胸',1.0],['三頭',0.5]],
    'スミスマシン フラットプレス':[['胸',1.0],['三頭',0.5]],
    'スミスマシン JMプレス':[['三頭',1.0]],
    'ワイドグリップラットプルダウン':[['背中',1.0],['二頭',0.5]],
    'チェストサポーテッド T-BARロウ':[['背中',1.0],['二頭',0.5]],
    'ハイパーエクステンション':[['脊柱起立筋',1.0],['ハム',0.5]],
    '45°レッグプレス':[['四頭',1.0],['ハム',0.5]],
    'スミスマシン スクワット':[['四頭',1.0],['ハム',0.5]],
    'Vバーラットプルダウン':[['背中',1.0],['二頭',0.5]],
    'マシンフラットチェストプレス':[['胸',1.0],['三頭',0.5]],
    'マシンショルダープレス':[['肩',1.0],['三頭',0.3]],
    'ヒッププレス':[['臀部',1.0],['ハム',0.5]],
  };
  const defaultAssist=(name,part)=>[[part,1.0]];

  weekTr.forEach(t=>{
    if(!t.exercises||!t.exercises.length)return;
    t.exercises.forEach(e=>{
      if(!e.name)return;
      const sets=Math.max(1,parseInt(e.sets)||1);
      const pairs=compoundAssist[e.name]||defaultAssist(e.name,(exTypeMap[e.name]||{}).part||'その他');
      pairs.forEach(([part,ratio])=>addVol(part,sets*ratio));
    });
  });

  return partVolume;
}