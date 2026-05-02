function renderAnalysis(){
  const{atl,ctl,tsb}=computeLoad();const co={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#5a5a78',font:{size:10}},grid:{color:'rgba(255,255,255,0.04)'}},y:{ticks:{color:'#5a5a78',font:{size:10}},grid:{color:'rgba(255,255,255,0.04)'}}}};
  const tr=DB.arr('trainings');const weeks={};tr.forEach(t=>{const d=new Date(t.date);const mon=new Date(d);mon.setDate(d.getDate()-(d.getDay()===0?6:d.getDay()-1));const wk=mon.toISOString().slice(0,10);weeks[wk]=(weeks[wk]||0)+(parseInt(t.duration)||0)*(parseInt(t.rpe)||5)});
  const wKeys=Object.keys(weeks).sort().slice(-8);if(aWeekly)aWeekly.destroy();if(wKeys.length){aWeekly=new Chart(document.getElementById('a-weekly-chart'),{type:'bar',data:{labels:wKeys.map(d=>d.slice(5)),datasets:[{data:wKeys.map(k=>weeks[k]),backgroundColor:'rgba(74,158,255,0.45)',borderColor:'#4a9eff',borderWidth:1,borderRadius:4}]},options:co});}
  const sleeps=DB.arr('sleeps').filter(s=>s.weight>0).slice(-30);if(aWeight)aWeight.destroy();if(sleeps.length){aWeight=new Chart(document.getElementById('a-weight-chart'),{type:'line',data:{labels:sleeps.map(s=>s.date.slice(5)),datasets:[{data:sleeps.map(s=>s.weight),borderColor:'#4a9eff',backgroundColor:'rgba(74,158,255,0.08)',tension:0.4,fill:true,borderWidth:2,pointRadius:3}]},options:co});}
  const meals=DB.arr('meals');const mbd={};meals.forEach(m=>{if(!mbd[m.date])mbd[m.date]={cal:0};mbd[m.date].cal+=m.cal||0});const mDates=Object.keys(mbd).sort().slice(-14);const calT=getCalTarget(cfg().goalmode||'maintain');if(aNutr)aNutr.destroy();if(mDates.length){aNutr=new Chart(document.getElementById('a-nutrition-chart'),{type:'bar',data:{labels:mDates.map(d=>d.slice(5)),datasets:[{data:mDates.map(d=>mbd[d].cal),backgroundColor:'rgba(245,166,35,0.45)',borderColor:'#f5a623',borderWidth:1,borderRadius:4},{data:mDates.map(()=>calT),type:'line',borderColor:'rgba(255,69,96,0.6)',borderDash:[5,3],borderWidth:1.5,pointRadius:0}]},options:co});}
  const sl14=DB.arr('sleeps').slice(-14);if(aWell)aWell.destroy();if(sl14.length){aWell=new Chart(document.getElementById('a-wellness-chart'),{type:'line',data:{labels:sl14.map(s=>s.date.slice(5)),datasets:[{data:sl14.map(s=>s.wellness||0),borderColor:'#f5a623',tension:0.4,borderWidth:2,fill:false,pointRadius:3},{data:sl14.map(s=>s.duration||0),borderColor:'#4a9eff',tension:0.4,borderWidth:1.5,fill:false,pointRadius:0,borderDash:[3,3]}]},options:{...co,scales:{...co.scales,y:{...co.scales.y,min:0,max:10}}}});}
}

function updateWeeklyWeightPanel(){
  const sleeps=DB.arr('sleeps').filter(s=>s.weight>0);
  if(sleeps.length<2){const adv=document.getElementById('wa-advice');if(adv){adv.className='alert alert-info';adv.textContent='2週間以上の体重データが揃うと自動判定が始まります。'}return;}
  const getWS=(ds)=>{const d=new Date(ds);const day=d.getDay();const mon=new Date(d);mon.setDate(d.getDate()-(day===0?6:1-day));return mon.toISOString().slice(0,10);};
  const byWeek={};sleeps.forEach(s=>{const wk=getWS(s.date);if(!byWeek[wk])byWeek[wk]=[];byWeek[wk].push(s.weight)});
  const weeks=Object.keys(byWeek).sort();if(weeks.length<2)return;
  const thisW=weeks[weeks.length-1],lastW=weeks[weeks.length-2];
  const ta=byWeek[thisW].reduce((a,b)=>a+b,0)/byWeek[thisW].length;
  const la=byWeek[lastW].reduce((a,b)=>a+b,0)/byWeek[lastW].length;
  const diff=ta-la;
  const twEl=document.getElementById('wa-this-week');if(twEl)twEl.textContent=ta.toFixed(1);
  const lwEl=document.getElementById('wa-last-week');if(lwEl)lwEl.textContent=la.toFixed(1);
  const chEl=document.getElementById('wa-change');if(chEl)chEl.textContent=(diff>=0?'+':'')+diff.toFixed(2);
  const mode=cfg().goalmode||'maintain';let pat,pc,adv,act;
  if(mode!=='bulk'){if(diff>0.1){pat='増加';pc='badge-red';adv='体重が増加しています。カロリー収支を確認してください。';act='対策: 炭水化物50〜75g減 + 有酸素15〜20分追加'}else if(diff>-0.2){pat='停滞';pc='badge-amber';adv='体重変化なし。カロリー収支の調整が必要です。';act='対策: 全体カロリーの10〜15%削減（200〜300kcal）'}else if(Math.abs(diff)<=0.75){pat='理想的';pc='badge-green';adv=`週${Math.abs(diff).toFixed(2)}kg減。理想的なペースです。現状維持してください。`;act='現在の食事・運動内容を継続'}else{pat='速すぎ';pc='badge-amber';adv=`週${Math.abs(diff).toFixed(2)}kg減は速すぎます。筋肉量が失われるリスクがあります。`;act='対策: 100〜200kcal増やす、または有酸素を減らす'}}else{if(diff<-0.1){pat='減少';pc='badge-red';adv='体重が減っています。カロリーが不足しています。';act='対策: 150〜300kcal追加'}else if(diff<0.1){pat='停滞';pc='badge-amber';adv='ほぼ変化なし。増量を狙うなら調整が必要です。';act='対策: カロリーを5%増加'}else if(diff<=0.5){pat='理想的';pc='badge-green';adv=`週${diff.toFixed(2)}kg増。リーンバルクの理想ペースです。`;act='現在の内容を維持'}else{pat='増えすぎ';pc='badge-red';adv=`週${diff.toFixed(2)}kg増は多すぎます。`;act='対策: 100〜200kcal削減。ミニカットを検討'}}
  const ptEl=document.getElementById('wa-pattern');if(ptEl)ptEl.innerHTML=`<span class="badge ${pc}">${pat}</span>`;
  const adEl=document.getElementById('wa-advice');if(adEl){adEl.className=`alert ${pc==='badge-green'?'alert-success':pc==='badge-red'?'alert-danger':'alert-warn'}`;adEl.textContent=adv;}
  const acEl=document.getElementById('wa-action');if(acEl)acEl.textContent=act;
}

function updateMiniCut(){
  const bf=parseFloat(document.getElementById('mc-bf')?.value)||null;const c=cfg();const peakCal=parseInt(c.tdee)||2800;
  const peakEl=document.getElementById('mc-peak-cal'),cutEl=document.getElementById('mc-cut-cal'),stEl=document.getElementById('mc-status-badge'),advEl=document.getElementById('mc-advice');
  if(peakEl)peakEl.textContent=peakCal;
  if(!bf){if(cutEl)cutEl.textContent='—';if(stEl)stEl.innerHTML='<span class="badge badge-gray">体脂肪率を入力</span>';if(advEl)advEl.innerHTML='<div class="alert alert-info">体脂肪率を入力するとミニカット推奨カロリーが計算されます。</div>';return;}
  let status,statusClass,cutCal,adv;
  if(bf<12){status='バルク最適';statusClass='badge-green';cutCal='不要';adv=`体脂肪率${bf}%はバルクアップ開始の理想ゾーンです。TDEE+100〜300kcalのリーンバルクを開始してください。`}
  else if(bf<=15){status='バルク継続OK';statusClass='badge-blue';cutCal='不要';adv=`体脂肪率${bf}%はバルク継続ゾーンです。15%を超えたらミニカット開始のサインです。`}
  else if(bf<=18){status='ミニカット推奨';statusClass='badge-amber';cutCal=`${peakCal-1500}〜${peakCal-1000}`;adv=`体脂肪率${bf}%。ミニカット推奨ゾーン。4〜6週間・カロリー${cutCal}kcal。タンパク質2.0〜2.2g/kgを維持して筋肉を守ってください。`}
  else{status='ミニカット必須';statusClass='badge-red';cutCal=`${peakCal-1800}〜${peakCal-1200}`;adv=`体脂肪率${bf}%。バルクアップを一旦中止。6〜8週間かけて10〜12%まで落としてからバルク再開してください。`}
  if(cutEl)cutEl.textContent=cutCal;if(stEl)stEl.innerHTML=`<span class="badge ${statusClass}">${status}</span>`;if(advEl)advEl.innerHTML=`<div class="alert ${statusClass==='badge-green'?'alert-success':statusClass==='badge-blue'?'alert-info':'alert-warn'}">${adv}</div>`;
}


function getConditionHistory(days){
  const scores=DB.get('pf_daily_scores')||{};
  const now=new Date();
  const result=[];
  for(let i=days-1;i>=0;i--){
    const d=new Date(now);d.setDate(now.getDate()-i);
    const ds=d.toISOString().slice(0,10);
    result.push({date:ds,data:scores[ds]||null});
  }
  return result;
}

function getWeekKey(dateStr){
  const d=new Date(dateStr);
  const dow=d.getDay()===0?6:d.getDay()-1;
  const mon=new Date(d);mon.setDate(d.getDate()-dow);
  return mon.toISOString().slice(0,10);
}

function renderConditionAnalysis(){
  const days=parseInt(document.getElementById('cond-range')?.value||90);
  const history=getConditionHistory(days);
  const filled=history.filter(h=>h.data);

  if(filled.length<3){
    const el=document.getElementById('cond-suggestions');
    if(el)el.innerHTML='<div class="alert alert-info">まだデータが少ないです。毎日の睡眠・回復を記録すると長期分析が表示されます。</div>';
    return;
  }

  // グラフ描画
  if(condTrendChart)condTrendChart.destroy();
  const ctx=document.getElementById('cond-trend-chart');
  if(ctx){
    // 週平均データで滑らかに
    const weekMap={};
    filled.forEach(h=>{
      const wk=getWeekKey(h.date);
      if(!weekMap[wk])weekMap[wk]={sum:0,n:0,sleep:0,tsb:0,well:0,nutr:0,fat:0};
      const d=h.data;
      weekMap[wk].sum+=d.condScore||0;
      weekMap[wk].sleep+=d.sleepScore||0;
      weekMap[wk].tsb+=Math.max(0,(d.tsb+25)/45*100)||50;
      weekMap[wk].well+=d.wellScore||50;
      weekMap[wk].nutr+=d.nutritionScore||50;
      weekMap[wk].fat+=100-(d.fatigue||0);
      weekMap[wk].n++;
    });
    const wks=Object.keys(weekMap).sort();
    const labels=wks.map(w=>w.slice(5));
    const condData=wks.map(w=>Math.round(weekMap[w].sum/weekMap[w].n));
    const sleepData=wks.map(w=>Math.round(weekMap[w].sleep/weekMap[w].n));
    const wellData=wks.map(w=>Math.round(weekMap[w].well/weekMap[w].n));

    condTrendChart=new Chart(ctx,{
      type:'line',
      data:{
        labels,
        datasets:[
          {label:'総合スコア',data:condData,borderColor:'#a78bfa',backgroundColor:'rgba(167,139,250,0.08)',tension:0.4,fill:true,borderWidth:2.5,pointRadius:3,pointBackgroundColor:'#a78bfa'},
          {label:'睡眠',data:sleepData,borderColor:'#4a9eff',backgroundColor:'transparent',tension:0.3,borderWidth:1.5,pointRadius:0,borderDash:[4,3]},
          {label:'ウェルネス',data:wellData,borderColor:'#22c55e',backgroundColor:'transparent',tension:0.3,borderWidth:1.5,pointRadius:0,borderDash:[2,2]},
        ]
      },
      options:{
        responsive:true,maintainAspectRatio:false,
        plugins:{
          legend:{display:true,position:'top',labels:{color:'#888',font:{size:10},boxWidth:12,padding:12}},
          tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${c.parsed.y}`}}
        },
        scales:{
          x:{ticks:{color:'#5a5a78',font:{size:10}},grid:{color:'rgba(255,255,255,0.04)'}},
          y:{min:0,max:100,ticks:{color:'#5a5a78',font:{size:10},callback:v=>v},grid:{color:'rgba(255,255,255,0.04)'}}
        }
      }
    });

    // 週別ヒートマップ
    renderCondHeatmap(weekMap,wks);
    // 4軸平均
    const n=filled.length;
    const avgCond=Math.round(filled.reduce((a,h)=>a+(h.data.condScore||0),0)/n);
    const avgSl=Math.round(filled.reduce((a,h)=>a+(h.data.sleepScore||0),0)/n);
    const avgTsb=Math.round(filled.reduce((a,h)=>a+((h.data.tsb+25)/45*100||50),0)/n);
    const avgWl=Math.round(filled.reduce((a,h)=>a+(h.data.wellScore||50),0)/n);
    const avgNu=Math.round(filled.reduce((a,h)=>a+(h.data.nutritionScore||50),0)/n);
    document.getElementById('ca-sleep').textContent=avgSl;
    document.getElementById('ca-tsb').textContent=avgTsb;
    document.getElementById('ca-wellness').textContent=avgWl;
    document.getElementById('ca-nutrition').textContent=avgNu;
    // 色
    ['ca-sleep','ca-tsb','ca-wellness','ca-nutrition'].forEach((id,i)=>{
      const val=[avgSl,avgTsb,avgWl,avgNu][i];
      const el=document.getElementById(id);
      if(el)el.style.color=val>=70?'var(--accent4)':val>=50?'var(--accent2)':'var(--accent)';
    });
    // 改善提案
    renderCondSuggestions(filled,{avgSl,avgTsb,avgWl,avgNu});
  }
}

function renderCondHeatmap(weekMap,wks){
  const el=document.getElementById('cond-heatmap');if(!el)return;
  const axes=[
    {key:'sleep',label:'睡眠',color:'#4a9eff'},
    {key:'tsb',label:'回復',color:'#a78bfa'},
    {key:'well',label:'WL',color:'#22c55e'},
    {key:'nutr',label:'栄養',color:'#f5a623'},
    {key:'fat',label:'勤務',color:'#ff4560'},
  ];
  const scoreColor=(v)=>{
    if(v>=75)return'rgba(34,197,94,0.7)';
    if(v>=55)return'rgba(74,158,255,0.5)';
    if(v>=40)return'rgba(245,166,35,0.5)';
    return'rgba(255,69,96,0.6)';
  };
  let html2=`<div style="display:flex;gap:2px;align-items:flex-end;min-width:${wks.length*44}px">`;
  wks.forEach(wk=>{
    const d=weekMap[wk];const n=d.n;
    const vals={
      sleep:Math.round(d.sleep/n),
      tsb:Math.round(d.tsb/n),
      well:Math.round(d.well/n),
      nutr:Math.round(d.nutr/n),
      fat:Math.round(d.fat/n),
    };
    html2+=`<div style="display:flex;flex-direction:column;gap:2px;width:40px">`;
    axes.forEach(ax=>{
      const v=vals[ax.key];
      html2+=`<div title="${ax.label}: ${v}" style="height:18px;border-radius:3px;background:${scoreColor(v)};display:flex;align-items:center;justify-content:center"><span style="font-size:9px;color:#fff;font-family:var(--font-mono)">${v}</span></div>`;
    });
    html2+=`<div style="font-size:9px;color:var(--text3);text-align:center;margin-top:2px">${wk.slice(5)}</div>`;
    html2+='</div>';
  });
  html2+='</div>';
  html2+=`<div style="display:flex;gap:12px;margin-top:8px;flex-wrap:wrap">${axes.map(a=>`<span style="font-size:10px;color:var(--text2);display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:2px;background:${a.color};display:inline-block"></span>${a.label}</span>`).join('')}</div>`;
  el.innerHTML=html2;
}

function renderCondSuggestions(history,avgs){
  const el=document.getElementById('cond-suggestions');if(!el)return;
  const suggestions=[];

  // 直近2週間と全期間の比較でトレンド判定
  const recent=history.slice(-14).filter(h=>h.data);
  const older=history.slice(0,-14).filter(h=>h.data);
  const recentAvg=recent.length?Math.round(recent.reduce((a,h)=>a+(h.data.condScore||0),0)/recent.length):null;
  const olderAvg=older.length?Math.round(older.reduce((a,h)=>a+(h.data.condScore||0),0)/older.length):null;

  // トレンド判定
  if(recentAvg&&olderAvg){
    const diff=recentAvg-olderAvg;
    if(diff<=-10)suggestions.push({type:'warn',icon:'📉',title:`直近2週間のコンディションが${Math.abs(diff)}pt低下しています`,body:'睡眠・勤務パターン・トレーニング強度のどれが変化したか確認してください。'});
    else if(diff>=10)suggestions.push({type:'good',icon:'📈',title:`直近2週間で${diff}pt改善しています`,body:'この調子を維持しましょう。'});
  }

  // 軸別の弱点分析
  if(avgs.avgSl<55)suggestions.push({type:'danger',icon:'😴',title:'睡眠スコアが低い（平均'+avgs.avgSl+'）',body:'就寝時間を30分早めることが最も即効性のある改善策です。マグネシウム（就寝前200mg）・スクリーンオフ（就寝1時間前）・就寝前のアルコール禁止（REM睡眠を抑制）を試してください。'});
  else if(avgs.avgSl<70)suggestions.push({type:'warn',icon:'😴',title:'睡眠スコアが改善の余地あり（平均'+avgs.avgSl+'）',body:'7〜8時間の確保を目標に。勤務明けは仮眠（90分サイクル）を優先してください。'});

  if(avgs.avgTsb<40)suggestions.push({type:'danger',icon:'🔋',title:'慢性的な疲労蓄積（TSBスコア平均'+avgs.avgTsb+'）',body:'トレーニング負荷を1〜2週間削減（ボリューム40%カット）してください。ATL>CTLが続いており、怪我・免疫低下のリスクが高い状態です。'});
  else if(avgs.avgTsb<55)suggestions.push({type:'warn',icon:'🔋',title:'回復が追いついていない可能性（TSBスコア平均'+avgs.avgTsb+'）',body:'週1回の完全休養日を必ず設けてください。高RPEセッションの頻度を減らすことを検討してください。'});

  if(avgs.avgWl<50)suggestions.push({type:'danger',icon:'🧠',title:'ウェルネス指標が低水準（平均'+avgs.avgWl+'）',body:'疲労・筋肉痛・モチベーション・気分の複合スコアが低い状態が続いています。ストレス源の特定、社会的サポートの確保、必要に応じて一時的な負荷削減を検討してください。'});

  if(avgs.avgNu<50)suggestions.push({type:'warn',icon:'🍽️',title:'栄養達成率が低い（平均'+avgs.avgNu+'）',body:'カロリー目標の達成が安定していません。食品プリセットを活用してトレ後の食事を事前に準備することで改善できます。タンパク質が特に不足している場合はプロテインで補助してください。'});

  // 24h勤務パターン分析
  const shiftData=DB.get('pf_shift_data')||{};
  const recentShifts=history.filter(h=>shiftData[h.date]);
  const duty24count=recentShifts.filter(h=>getShiftType(shiftData[h.date])==='24h').length;
  if(duty24count>=6){
    suggestions.push({type:'info',icon:'🚒',title:`分析期間中に${duty24count}回の24h勤務があります`,body:'24h勤務後2日間のコンディションスコアを確認してください。回復に72時間以上かかるパターンが見られる場合は、非番の活動量を減らすことが必要です。'});
  }

  if(!suggestions.length){
    suggestions.push({type:'good',icon:'✓',title:'全軸でバランスが取れています',body:'この状態を維持することが最優先です。変化を感じたら早めにデータを確認してください。'});
  }

  const typeStyle={
    danger:{bg:'rgba(255,69,96,0.06)',border:'rgba(255,69,96,0.3)',color:'var(--accent)'},
    warn:{bg:'rgba(245,166,35,0.06)',border:'rgba(245,166,35,0.3)',color:'var(--accent3)'},
    good:{bg:'rgba(34,197,94,0.06)',border:'rgba(34,197,94,0.3)',color:'var(--accent4)'},
    info:{bg:'rgba(74,158,255,0.06)',border:'rgba(74,158,255,0.3)',color:'var(--accent2)'},
  };

  el.innerHTML=`<div class="label" style="margin-bottom:10px">改善提案（データに基づく自動分析）</div>`+
    suggestions.map(s=>{
      const st=typeStyle[s.type]||typeStyle.info;
      return`<div style="padding:10px 14px;background:${st.bg};border:1px solid ${st.border};border-radius:var(--rs);margin-bottom:8px">
        <div style="font-size:13px;font-weight:600;color:${st.color};margin-bottom:4px">${s.icon} ${s.title}</div>
        <div class="muted" style="font-size:12px;line-height:1.6">${s.body}</div>
      </div>`;
    }).join('');
}

f