
// ===== db.js =====
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

// ===== data-programs.js =====
const PROGRAMS={
  FBS:{id:'FBS',name:'FULL BODY SPLIT',abbr:'FBS',desc:'SGIR HQ PREMIUM準拠・全身3分割',color:'#4a9eff',freq:'週3〜4回',
    sessions:{FBA:{name:'FULL BODY A',focus:'プレスフォーカス',color:'#4a9eff',letter:'A'},FBB:{name:'FULL BODY B',focus:'プルフォーカス',color:'#f5a623',letter:'B'},FBC:{name:'FULL BODY C',focus:'スクワットフォーカス',color:'#22c55e',letter:'C'}},
    cycle:['FBA','FBB','FBC'],scheduleHint:'A→B→C→休養のサイクル'},
  PPL:{id:'PPL',name:'PPL SPLIT',abbr:'PPL',desc:'Push・Pull・Legs 3分割',color:'#f5a623',freq:'週3〜6回',
    sessions:{PUSH:{name:'PUSH DAY',focus:'胸・肩・三頭筋',color:'#ff4560',letter:'P'},PULL:{name:'PULL DAY',focus:'背中・二頭筋',color:'#4a9eff',letter:'L'},LEGS:{name:'LEGS DAY',focus:'脚・臀部・腹',color:'#22c55e',letter:'L'}},
    cycle:['PUSH','PULL','LEGS'],scheduleHint:'Push→Pull→Legs→休養のサイクル'},
  PPL_LU:{id:'PPL_LU',name:'PPL + LOWER/UPPER',abbr:'PPL+LU',desc:'PPLにLower・Upperを組み合わせた5分割',color:'#a78bfa',freq:'週5回',
    sessions:{PUSH:{name:'PUSH DAY',focus:'胸・肩・三頭',color:'#ff4560',letter:'P'},PULL:{name:'PULL DAY',focus:'背中・二頭',color:'#4a9eff',letter:'P'},LEGS:{name:'LEGS DAY',focus:'脚全体',color:'#22c55e',letter:'L'},UPPER:{name:'UPPER DAY',focus:'上半身',color:'#f5a623',letter:'U'},LOWER:{name:'LOWER DAY',focus:'下半身',color:'#6b7280',letter:'L'}},
    cycle:['PUSH','PULL','LEGS','UPPER','LOWER'],scheduleHint:'Push→Pull→Legs→Upper→Lower の5日サイクル'},
  LU:{id:'LU',name:'LOWER / UPPER',abbr:'L/U',desc:'上半身・下半身の2分割',color:'#22c55e',freq:'週2〜4回',
    sessions:{UPPER:{name:'UPPER DAY',focus:'胸・背中・肩・腕',color:'#4a9eff',letter:'U'},LOWER:{name:'LOWER DAY',focus:'脚・臀部・ハム・腹',color:'#22c55e',letter:'L'}},
    cycle:['UPPER','LOWER'],scheduleHint:'Upper→Lower→休養 または Upper→Lower×2'}
};

const DEFAULT_EXERCISES={
  FBS_FBA:[{name:'ワイドグリップチンニング（広背筋）',reps:'6-10',part:'背中',rpe:'C'},{name:'オーバーグリップマシンロウ（上背部）',reps:'8-12',part:'背中',rpe:'M'},{name:'S/Aケーブルプルダウン',reps:'10-15',part:'背中',rpe:'I'},{name:'スミスマシン ハイインクラインプレス',reps:'8-12',part:'胸',rpe:'M'},{name:'HSマシンペックフライ',reps:'10-15',part:'胸',rpe:'I'},{name:'ディップス',reps:'8-12',part:'胸・三頭',rpe:'C'},{name:'ワンレッグレッグエクステンション',reps:'10-15',part:'四頭',rpe:'I'},{name:'レッグカール',reps:'10-15',part:'ハム',rpe:'M'},{name:'マシンアダクター',reps:'12-15',part:'内転筋',rpe:'I'},{name:'クロスボディケーブルエクステンション',reps:'12-15',part:'三頭',rpe:'I'},{name:'S/A DBプリチャーカール',reps:'10-15',part:'二頭',rpe:'I'},{name:'マシン サイドレイズ',reps:'12-20',part:'肩',rpe:'I'},{name:'カーフレイズ',reps:'15-20',part:'カーフ',rpe:'I'},{name:'マシンアブクランチ',reps:'AMRAP',part:'腹',rpe:'I'}],
  FBS_FBB:[{name:'ケーブルYレイズ',reps:'12-15',part:'肩後部',rpe:'I'},{name:'HSプレートロードインクラインプレス',reps:'8-12',part:'胸',rpe:'M'},{name:'スミスマシン フラットプレス',reps:'8-12',part:'胸',rpe:'M'},{name:'スミスマシン JMプレス',reps:'10-15',part:'三頭',rpe:'M'},{name:'ワイドグリップラットプルダウン',reps:'8-12',part:'背中',rpe:'M'},{name:'チェストサポーテッド T-BARロウ',reps:'8-12',part:'背中',rpe:'M'},{name:'S/Aケーブルプルダウン',reps:'10-15',part:'背中',rpe:'I'},{name:'ハイパーエクステンション',reps:'10-15',part:'脊柱起立筋',rpe:'C'},{name:'45°レッグプレス',reps:'10-15',part:'脚全体',rpe:'M'},{name:'ワンレッグレッグカール',reps:'10-15',part:'ハム',rpe:'I'},{name:'オルタネイトDBカール（スピネイト）',reps:'10-12',part:'二頭',rpe:'I'},{name:'ケーブルトライセプスプッシュダウン',reps:'12-15',part:'三頭',rpe:'I'},{name:'カーフレイズ',reps:'15-20',part:'カーフ',rpe:'I'},{name:'マシンアブクランチ',reps:'AMRAP',part:'腹',rpe:'I'}],
  FBS_FBC:[{name:'レッグカール',reps:'10-15',part:'ハム',rpe:'M'},{name:'スミスマシン スクワット',reps:'8-12',part:'四頭',rpe:'C'},{name:'マシンヒッププレス',reps:'10-15',part:'臀部',rpe:'M'},{name:'レッグエクステンション',reps:'10-15',part:'四頭',rpe:'I'},{name:'Vバーラットプルダウン',reps:'8-12',part:'背中',rpe:'M'},{name:'ケルソーシュラッグ',reps:'10-15',part:'僧帽筋',rpe:'M'},{name:'リバースペックフライ',reps:'12-15',part:'肩後部',rpe:'I'},{name:'マシンフラットチェストプレス',reps:'8-12',part:'胸',rpe:'M'},{name:'マシンショルダープレス',reps:'8-12',part:'肩',rpe:'M'},{name:'ケーブルデクラインフライ',reps:'12-15',part:'胸下部',rpe:'I'},{name:'EZバープッシュダウン',reps:'12-15',part:'三頭',rpe:'I'},{name:'インクラインDBカール',reps:'10-12',part:'二頭',rpe:'I'},{name:'ハンマーカール',reps:'10-12',part:'二頭',rpe:'I'},{name:'DBサイドレイズ',reps:'12-20',part:'肩',rpe:'I'},{name:'ハンギングレッグレイズ',reps:'AMRAP',part:'腹',rpe:'I'},{name:'カーフレイズ',reps:'15-20',part:'カーフ',rpe:'I'}],
  PPL_PUSH:[{name:'バーベルベンチプレス',reps:'6-10',part:'胸',rpe:'C'},{name:'インクラインDBプレス',reps:'8-12',part:'胸',rpe:'M'},{name:'ケーブルフライ',reps:'12-15',part:'胸',rpe:'I'},{name:'バーベルOHプレス',reps:'6-10',part:'肩',rpe:'C'},{name:'DBサイドレイズ',reps:'12-20',part:'肩',rpe:'I'},{name:'トライセプスプッシュダウン',reps:'12-15',part:'三頭',rpe:'I'},{name:'OHトライセプスエクステンション',reps:'10-15',part:'三頭',rpe:'I'},{name:'カーフレイズ',reps:'15-20',part:'カーフ',rpe:'I'}],
  PPL_PULL:[{name:'デッドリフト',reps:'3-6',part:'背中',rpe:'C'},{name:'バーベルロウ',reps:'6-10',part:'背中',rpe:'C'},{name:'ラットプルダウン',reps:'8-12',part:'背中',rpe:'M'},{name:'ケーブルロウ',reps:'10-15',part:'背中',rpe:'M'},{name:'フェイスプル',reps:'15-20',part:'肩後部',rpe:'I'},{name:'リバースペックフライ',reps:'12-15',part:'肩後部',rpe:'I'},{name:'バーベルカール',reps:'8-12',part:'二頭',rpe:'C'},{name:'ハンマーカール',reps:'10-12',part:'二頭',rpe:'I'}],
  PPL_LEGS:[{name:'バーベルスクワット',reps:'4-8',part:'四頭',rpe:'C'},{name:'レッグプレス',reps:'8-12',part:'四頭',rpe:'M'},{name:'レッグエクステンション',reps:'12-15',part:'四頭',rpe:'I'},{name:'ルーマニアンデッドリフト',reps:'6-10',part:'ハム',rpe:'C'},{name:'レッグカール',reps:'10-15',part:'ハム',rpe:'M'},{name:'ヒップスラスト',reps:'8-12',part:'臀部',rpe:'M'},{name:'カーフレイズ',reps:'12-20',part:'カーフ',rpe:'I'},{name:'ハンギングレッグレイズ',reps:'AMRAP',part:'腹',rpe:'I'}],
  PPL_LU_PUSH:'PPL_PUSH',PPL_LU_PULL:'PPL_PULL',PPL_LU_LEGS:'PPL_LEGS',
  PPL_LU_UPPER:[{name:'インクラインDBプレス',reps:'8-12',part:'胸',rpe:'M'},{name:'ケーブルフライ',reps:'12-15',part:'胸',rpe:'I'},{name:'ラットプルダウン',reps:'8-12',part:'背中',rpe:'M'},{name:'ケーブルロウ',reps:'10-15',part:'背中',rpe:'M'},{name:'DBショルダープレス',reps:'8-12',part:'肩',rpe:'M'},{name:'DBサイドレイズ',reps:'15-20',part:'肩',rpe:'I'},{name:'トライセプスプッシュダウン',reps:'12-15',part:'三頭',rpe:'I'},{name:'バーベルカール',reps:'8-12',part:'二頭',rpe:'C'}],
  PPL_LU_LOWER:[{name:'バーベルスクワット',reps:'4-8',part:'四頭',rpe:'C'},{name:'レッグプレス',reps:'8-12',part:'四頭',rpe:'M'},{name:'ルーマニアンデッドリフト',reps:'6-10',part:'ハム',rpe:'C'},{name:'レッグカール',reps:'10-15',part:'ハム',rpe:'M'},{name:'ヒップスラスト',reps:'8-12',part:'臀部',rpe:'M'},{name:'カーフレイズ',reps:'12-20',part:'カーフ',rpe:'I'},{name:'アブクランチ',reps:'AMRAP',part:'腹',rpe:'I'}],
  LU_UPPER:[{name:'バーベルベンチプレス',reps:'6-10',part:'胸',rpe:'C'},{name:'インクラインDBプレス',reps:'8-12',part:'胸',rpe:'M'},{name:'バーベルロウ',reps:'6-10',part:'背中',rpe:'C'},{name:'ラットプルダウン',reps:'8-12',part:'背中',rpe:'M'},{name:'バーベルOHプレス',reps:'6-10',part:'肩',rpe:'C'},{name:'DBサイドレイズ',reps:'15-20',part:'肩',rpe:'I'},{name:'トライセプスプッシュダウン',reps:'12-15',part:'三頭',rpe:'I'},{name:'バーベルカール',reps:'8-12',part:'二頭',rpe:'C'}],
  LU_LOWER:[{name:'バーベルスクワット',reps:'4-8',part:'四頭',rpe:'C'},{name:'レッグプレス',reps:'8-12',part:'四頭',rpe:'M'},{name:'レッグエクステンション',reps:'12-15',part:'四頭',rpe:'I'},{name:'ルーマニアンデッドリフト',reps:'6-10',part:'ハム',rpe:'C'},{name:'レッグカール',reps:'10-15',part:'ハム',rpe:'M'},{name:'ヒップスラスト',reps:'8-12',part:'臀部',rpe:'M'},{name:'カーフレイズ',reps:'12-20',part:'カーフ',rpe:'I'},{name:'ハンギングレッグレイズ',reps:'AMRAP',part:'腹',rpe:'I'}]
};

let custPid='',custSid='',custExArr=[];
function moveEx(i,dir){if(i+dir<0||i+dir>=custExArr.length)return;[custExArr[i],custExArr[i+dir]]=[custExArr[i+dir],custExArr[i]];renderCustomizerList();}
function removeEx(i){custExArr.splice(i,1);renderCustomizerList();}

// ===== data-food.js =====
// ============================================================
// 食品プリセットデータベース（SGIR HQ PREMIUM + 日本食品標準成分表2020）
// ============================================================
const FOOD_PRESETS={
  // docx第4.3節データ + 日本食品標準成分表2020準拠
  protein:[
    {name:'鶏むね肉（皮なし）',unit:'g',cal:108,p:24.4,c:0,f:1.5,
     highlight:'アンセリン・カルノシン（抗疲労）・L-カルニチン豊富',
     note:'消防士の筋肥大と抗疲労のベース。100gで体重60kgの人の約40%のタンパク質目標をカバー。'},
    {name:'鶏もも肉（皮なし）',unit:'g',cal:116,p:18.8,c:0,f:3.9,
     highlight:'鉄分・ビタミンB6・B3豊富',
     note:'むね肉より風味があり継続しやすい。発汗による鉄喪失の補充に有効。'},
    {name:'鶏ささみ',unit:'g',cal:98,p:23.0,c:0,f:0.8,
     highlight:'最低脂質・減量期最強のタンパク源',
     note:'むね肉より低脂質。レンチン調理で手軽に高タンパク摂取。'},
    {name:'全卵（Lサイズ）',unit:'個(60g)',per:60,cal:91,p:7.4,c:0.2,f:6.2,
     highlight:'卵黄の脂質がMPSシグナルを強化・コリン・ロイシン豊富',
     note:'卵白より全卵の方が筋タンパク質合成が高い（Vliet et al.）。毎日3〜6個推奨。'},
    {name:'牛モモ赤身',unit:'g',cal:117,p:21.3,c:0.5,f:3.8,
     highlight:'ヘム鉄・亜鉛・B12・クレアチン（天然）',
     note:'消防士の欠乏しやすいミネラルの宝庫。週2〜3回で免疫・ホルモン維持。'},
    {name:'サーモン',unit:'g',cal:139,p:22.5,c:0.1,f:4.5,
     highlight:'EPA+DHA約1,000mg・ビタミンD・EIMD抑制',
     note:'火災現場活動後の筋損傷（EIMD）を抑制。週2回以上が理想。'},
    {name:'サバ（生）',unit:'g',cal:202,p:18.0,c:0.3,f:14.0,
     highlight:'EPA+DHA約1,800mg（最強クラス）・ビタミンD同時補給',
     note:'コスパ最高の青魚。缶詰も可（水煮缶推奨）。'},
    {name:'イワシ（生）',unit:'g',cal:156,p:19.8,c:0.2,f:8.8,
     highlight:'EPA+DHA約2,000mg・カルシウム・セレン',
     note:'骨ごと食べるとカルシウム吸収率大幅UP。骨密度維持に重要。'},
    {name:'マグロ赤身',unit:'g',cal:125,p:26.4,c:0.1,f:1.4,
     highlight:'高タンパク低脂質・鉄・B12・セレン',
     note:'刺身で手軽に高タンパク摂取。鉄欠乏の補充にも有効。'},
    {name:'納豆（1パック）',unit:'パック(45g)',per:45,cal:86,p:7.4,c:5.4,f:4.5,
     highlight:'ビタミンK2・プロバイオティクス・ナットウキナーゼ',
     note:'骨密度・血管柔軟性を維持。日本人の心疾患リスク低減に寄与（docx第1.1.2節）。'},
    {name:'木綿豆腐',unit:'g',cal:72,p:6.6,c:1.6,f:4.2,
     highlight:'植物性タンパク・酸化ストレス軽減・カルシウム',
     note:'動物性と組み合わせてタンパク源を多様化。腸内環境多様性向上。'},
    {name:'ギリシャヨーグルト（無糖）',unit:'g',cal:67,p:10.0,c:4.0,f:0.4,
     highlight:'カゼイン型・就寝中のMPS維持・プロバイオティクス',
     note:'就寝前30gで一晩中の筋肉保護。腸活も兼ねる。（docx第1.1.1節）'},
    {name:'ホエイプロテイン（WPI）',unit:'g',cal:110,p:25.0,c:2.0,f:1.0,
     highlight:'最速吸収・出動直後の急速アミノ酸補給',
     note:'トレ後・出動直後に25〜40g。食事で補えない時の緊急補給源。'},
  ],
  carb:[
    {name:'白米（炊飯）',unit:'g',cal:168,p:2.5,c:37.1,f:0.3,
     highlight:'グリコーゲン急速補充・消化良好',
     note:'勤務明けの枯渇グリコーゲンを最短で回復。トレ後の主力炭水化物。'},
    {name:'玄米（炊飯）',unit:'g',cal:165,p:2.8,c:35.6,f:1.0,
     highlight:'食物繊維・マグネシウム・B1・低GI',
     note:'訓練前2hに最適。GIは白米より低く持続的エネルギー供給。'},
    {name:'さつまいも（蒸し）',unit:'g',cal:131,p:1.2,c:31.2,f:0.2,
     highlight:'低GI・カリウム（発汗補充）・食物繊維',
     note:'現場活動前の持続燃料。カリウムが発汗時の筋痙攣を防ぐ（消防士は発汗量が多くリスク高）。'},
    {name:'じゃがいも（茹で）',unit:'g',cal:76,p:1.8,c:17.6,f:0.1,
     highlight:'カリウム豊富・電解質補充',
     note:'冷やすとレジスタントスターチ増加→腸活効果UP。グリコーゲン回復にも有効。'},
    {name:'バナナ',unit:'本(100g)',per:100,cal:86,p:1.1,c:22.5,f:0.2,
     highlight:'即効エネルギー・カリウム・マグネシウム',
     note:'トレ中の血糖維持・電解質補給に最適。携帯性も高い。'},
    {name:'オートミール（乾燥）',unit:'g',cal:380,p:13.7,c:69.1,f:5.7,
     highlight:'β-グルカン・腸内炎症抑制・Mg豊富',
     note:'40g(152kcal)が1食分。食物繊維がシフト勤務による腸の乱れを抑制（docx第1.2.2節）。'},
    {name:'そば（茹で）',unit:'g',cal:130,p:4.8,c:26.0,f:1.0,
     highlight:'ルチン（抗酸化・血管保護）・亜鉛含有',
     note:'GI低め。消防士の血管への負荷を軽減するルチンが特徴。'},
    {name:'キウイ',unit:'個(100g)',per:100,cal:53,p:1.0,c:13.5,f:0.1,
     highlight:'ビタミンC・K・睡眠改善効果（RCTあり）',
     note:'就寝前摂取で睡眠の質向上（セロトニン前駆体）。夜勤明けの回復に。'},
  ],
  veggie:[
    {name:'ブロッコリー（茹で）',unit:'g',cal:33,p:3.9,c:4.3,f:0.4,
     highlight:'スルフォラファン（解毒酵素誘導）・ビタミンC・K・葉酸',
     note:'火災ガス暴露による解毒をサポート。最強の抗酸化野菜。毎日推奨。'},
    {name:'ほうれん草（茹で）',unit:'g',cal:25,p:2.6,c:3.6,f:0.5,
     highlight:'鉄・葉酸・マグネシウム・K1',
     note:'消防士のMg不足リスク（発汗消耗）の食事対策。鉄はビタミンCと同時摂取で吸収率2〜3倍。'},
    {name:'小松菜（生）',unit:'g',cal:14,p:1.5,c:2.4,f:0.2,
     highlight:'カルシウム（ほうれん草の約3倍）・鉄・ビタミンK',
     note:'疲労骨折リスクが高い消防士の骨密度維持に重要。毎日摂取推奨。'},
    {name:'パプリカ（赤）',unit:'g',cal:30,p:1.0,c:7.2,f:0.2,
     highlight:'ビタミンC（ブロッコリーの2倍）・βカロテン・抗酸化',
     note:'高熱環境下での粘膜保護と免疫維持。炎症マーカー低下効果あり。'},
    {name:'トマト',unit:'g',cal:19,p:0.7,c:4.7,f:0.1,
     highlight:'リコピン（活性酸素除去）・カリウム',
     note:'加熱するとリコピン吸収率UP。缶詰も可。火災現場の酸化ストレスに対抗。'},
    {name:'ブルーベリー（冷凍）',unit:'g',cal:49,p:0.5,c:12.9,f:0.1,
     highlight:'アントシアニン・活性酸素（ROS）早期正常化',
     note:'最強のリカバリーフード。毎日欠かさず摂取すべき（docx第1.3節RCT）。'},
    {name:'アボカド',unit:'半個(80g)',per:80,cal:149,p:2.1,c:3.2,f:14.8,
     highlight:'オレイン酸・カリウム（最高含有）・葉酸',
     note:'消防士の電解質補充（カリウム豊富）に有効。良質な一価不飽和脂肪酸。'},
    {name:'かぼちゃ（茹で）',unit:'g',cal:60,p:1.6,c:15.1,f:0.3,
     highlight:'ビタミンA（β-カロテン）・C・高熱環境での粘膜保護',
     note:'高熱環境下での粘膜保護・免疫維持。持続的な炭水化物源としても優秀。'},
  ],
  fermented:[
    {name:'ヨーグルト（無糖）',unit:'g',cal:62,p:3.6,c:4.9,f:3.0,
     highlight:'プロバイオティクス・カルシウム・ビタミンB2',
     note:'毎日100〜200g。シフト勤務による腸内フローラの乱れを修正。'},
    {name:'味噌（天然醸造）',unit:'大さじ1(18g)',per:18,cal:35,p:2.3,c:4.7,f:1.1,
     highlight:'プロバイオティクス・大豆イソフラボン・腸内環境改善',
     note:'沸騰後に溶かすと菌が生きた状態で摂取可能。毎日の味噌汁で腸活。'},
    {name:'キムチ（無添加）',unit:'g',cal:29,p:2.1,c:4.3,f:0.5,
     highlight:'乳酸菌・カプサイシン・ビタミンC',
     note:'腸内多様性向上。週3〜4回推奨（腸内環境ガイド準拠）。'},
    {name:'ぬか漬け（きゅうり）',unit:'g',cal:14,p:1.1,c:2.4,f:0.1,
     highlight:'植物性乳酸菌・腸内フローラ改善',
     note:'日本の伝統的発酵食品。腸内細菌の多様性向上に有効。'},
  ],
  fat:[
    {name:'アーモンド',unit:'g',cal:598,p:19.6,c:19.7,f:51.8,
     highlight:'ビタミンE・マグネシウム・食物繊維・抗酸化',
     note:'28g(約20粒)が1食分。抗酸化作用で火災ガス暴露の酸化ストレスに対抗（docx第1.3節）。'},
    {name:'くるみ',unit:'g',cal:674,p:14.6,c:11.7,f:68.8,
     highlight:'ALA（植物性オメガ3）・抗酸化物質・脳機能保護',
     note:'30g=1食分。脳機能・炎症抑制に有効。'},
    {name:'カボチャの種',unit:'g',cal:590,p:26.5,c:12.6,f:51.8,
     highlight:'マグネシウム（最高含有クラス）・亜鉛・セレン',
     note:'消防士のMg・亜鉛を同時補給できる優秀なスナック。おやつとして最適。'},
    {name:'オリーブオイル（EV）',unit:'大さじ1(12g)',per:12,cal:111,p:0,c:0,f:12.0,
     highlight:'オレイン酸・ポリフェノール・心血管保護（PREDIMED試験）',
     note:'加熱調理の基本油。慢性炎症抑制効果が確認されている。'},
    {name:'アボカドオイル',unit:'大さじ1(12g)',per:12,cal:111,p:0,c:0,f:12.0,
     highlight:'高煙点・オレイン酸・ビタミンE',
     note:'高温調理に適した油。心血管保護とホルモン生成をサポート。'},
  ],
  custom:[]
};

let selectedPreset=null;
let selectedPresetAmount=100;

function showPresetCategory(cat){
  const grid=document.getElementById('preset-grid');
  if(!grid)return;
  let foods=FOOD_PRESETS[cat]||[];
  // マイプリセット
  if(cat==='custom'){
    foods=DB.get('pf_custom_presets')||[];
  }
  if(!foods.length){
    grid.innerHTML='<div class="muted" style="font-size:12px;padding:8px">まだマイプリセットがありません。食品を入力して「⭐ 保存」ボタンで登録できます。</div>';
    return;
  }
  grid.innerHTML=foods.map((f,i)=>`
    <div onclick="selectPreset(${JSON.stringify({...f,_cat:cat,_idx:i}).replace(/"/g,'&quot;')})" style="cursor:pointer;padding:8px 10px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--rs);transition:all 0.15s" onmouseover="this.style.borderColor='var(--accent2)'" onmouseout="this.style.borderColor='var(--border)'">
      <div style="font-size:12px;font-weight:500;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.name}</div>
      <div style="font-size:10px;color:var(--text3);font-family:var(--font-mono)">${f.cal}kcal / P${f.p}g / C${f.c}g / F${f.f}g</div>
      ${f.highlight?`<div style="font-size:10px;color:var(--accent2);margin-top:2px">${f.highlight}</div>`:''}
    </div>`).join('');
  // datalistも更新
  const dl=document.getElementById('food-datalist');
  if(dl)dl.innerHTML=foods.map(f=>`<option value="${f.name}">`).join('');
}

function selectPreset(f){
  selectedPreset=f;
  selectedPresetAmount=f.per||100;
  const row=document.getElementById('preset-amount-row');
  const nameEl=document.getElementById('preset-selected-name');
  const slider=document.getElementById('preset-amount-slider');
  if(row)row.style.display='block';
  if(nameEl)nameEl.textContent=f.name;
  if(slider){
    slider.min=f.per?Math.round(f.per/4):25;
    slider.max=f.per?f.per*8:400;
    slider.step=f.per||25;
    slider.value=f.per||100;
  }
  updatePresetAmount(f.per||100);
}

function updatePresetAmount(amount){
  if(!selectedPreset)return;
  selectedPresetAmount=parseFloat(amount);
  const base=selectedPreset.per||100;
  const ratio=selectedPresetAmount/base;
  const cal=Math.round(selectedPreset.cal*ratio);
  const p=Math.round(selectedPreset.p*ratio*10)/10;
  const c=Math.round(selectedPreset.c*ratio*10)/10;
  const f=Math.round(selectedPreset.f*ratio*10)/10;
  const disp=document.getElementById('preset-amount-display');
  const prev=document.getElementById('preset-macro-preview');
  const unitLabel=selectedPreset.per?`${selectedPresetAmount}${selectedPreset.unit}`:`${selectedPresetAmount}g`;
  if(disp)disp.textContent=unitLabel;
  if(prev)prev.innerHTML=`<span class="mono">${cal}kcal / P${p}g / C${c}g / F${f}g</span>${selectedPreset.note?` <span style="color:var(--text3)">— ${selectedPreset.note}</span>`:''}`;
}

function applyPreset(){
  if(!selectedPreset)return;
  const base=selectedPreset.per||100;
  const ratio=selectedPresetAmount/base;
  const unitLabel=selectedPreset.per?`${selectedPresetAmount}${selectedPreset.unit}`:`${selectedPresetAmount}g`;
  document.getElementById('n-food').value=`${selectedPreset.name} ${unitLabel}`;
  document.getElementById('n-cal').value=Math.round(selectedPreset.cal*ratio);
  document.getElementById('n-protein').value=Math.round(selectedPreset.p*ratio*10)/10;
  document.getElementById('n-carb').value=Math.round(selectedPreset.c*ratio*10)/10;
  document.getElementById('n-fat').value=Math.round(selectedPreset.f*ratio*10)/10;
  clearPreset();
}

function clearPreset(){
  selectedPreset=null;
  const row=document.getElementById('preset-amount-row');
  if(row)row.style.display='none';
}

function saveCustomPreset(){
  const name=document.getElementById('n-food').value.trim();
  const cal=parseFloat(document.getElementById('n-cal').value)||0;
  const p=parseFloat(document.getElementById('n-protein').value)||0;
  const c=parseFloat(document.getElementById('n-carb').value)||0;
  const f=parseFloat(document.getElementById('n-fat').value)||0;
  if(!name||!cal){alert('食品名とカロリーを入力してください');return}
  const custom=DB.get('pf_custom_presets')||[];
  if(custom.find(x=>x.name===name)){alert('同名のプリセットがすでに存在します');return}
  custom.push({name,unit:'g',cal,p,c,f,highlight:'マイプリセット',note:''});
  DB.set('pf_custom_presets',custom);
  alert(`「${name}」をマイプリセットに保存しました`);
}

// ============================================================
// サプリメントデータベース（SGIR HQ + 最新エビデンス統合）
// ============================================================
c

// ===== data-supps.js =====
const SUPPS={
  tier1:[
    {id:'creatine',
     name:'クレアチンモノハイドレート',
     dose:'5g/日（ローディング不要）',
     timing:'トレ後 or いつでも（毎日継続が最重要）',
     effect:'筋力↑ / 筋肥大↑ / 認知機能・短期記憶↑ / 無酸素パワー↑ / TBI神経保護',
     evidence:'Lanhers 2017 / Rawson 2011 / Firefighter Nation 2024',
     firefighter:'睡眠不足・低酸素下での認知機能維持が火災現場の判断力に直結。頭部外傷（TBI）への神経保護作用も確認済み（docx第3.1.1節）。緊急出動・重量物搬送の瞬発力に直結。腎機能正常者での長期摂取は安全。',
     foodAlt:'赤身肉1kgに約5g含有→毎日1kg摂取は非現実的。サプリが唯一の実用的手段。'},
    {id:'vitd3',
     name:'ビタミンD3 + K2',
     dose:'D3: 2,000〜4,000IU / K2: 100〜200µg',
     timing:'脂質を含む食事と一緒（吸収率最大化）',
     effect:'免疫機能↑ / 筋力↑ / 骨密度↑ / 炎症抑制 / 疲労骨折リスク↓',
     evidence:'Endocrine Society 2024 / Nutrients 2025（最多引用論文）',
     firefighter:'消防士のビタミンD欠乏リスク高（屋内・夜勤が多い職種で75〜80%が不足水準：Colorado消防士研究）。血中25(OH)D目標値40〜60ng/mL。日本DRI 340IUは推奨値の10分の1以下で完全に不十分。屋内活動・夜勤で日光不足→疲労骨折・筋力低下・免疫低下の主因。K2はカルシウムを骨に沈着させ血管石灰化を防ぐ（必須の同時摂取）。',
     foodAlt:'サーモン100g≈400IU。食事だけで2,000〜4,000IUは事実上不可能→サプリ必須。'},
    {id:'omega3',
     name:'オメガ3（EPA + DHA）',
     dose:'EPA+DHA合計 1,500〜2,000mg/日',
     timing:'食事と一緒（酸化防止・吸収率向上）',
     effect:'慢性炎症抑制 / 筋損傷（EIMD）回復↑ / 心血管保護 / 脳機能↑',
     evidence:'ISSFAL 2019 / Smith 2011 / docx第3.1.3節',
     firefighter:'火災ガス（アクロレイン等）暴露による酸化ストレスへの化学的バリア。日本人約半数のALDH2不活性型（rs671）は脂質過酸化物の解毒能力が低い→オメガ3+ビタミンEの積極摂取が特に重要（docx第3.1.3節）。',
     foodAlt:'サバ100g≈1,800mg / イワシ100g≈2,000mg。週3〜4回の青魚でサプリ不要になる場合あり。'},
  ],
  tier2:[
    {id:'magnesium',
     name:'マグネシウム（グリシン酸塩）',
     dose:'200〜400mg/日',
     timing:'就寝30〜60分前',
     effect:'睡眠の質↑ / 筋痙攣↓ / 神経機能↑ / インスリン感受性↑',
     evidence:'Nielsen 2010 / Abbasi 2012 / docx引用',
     firefighter:'消防士のMg欠乏リスク高（発汗で需要10〜20%増：Volpe 2013）。24時間勤務・発汗でMg急速消耗。形態は酸化Mgよりグリシン酸塩を推奨（吸収率3〜4倍）。現場での筋痙攣は命取り→予防最優先。',
     foodAlt:'カボチャの種28g≈Mg150mg / アーモンド28g≈Mg80mg。食事から200〜300mgまで補給可能。'},
    {id:'citrulline',
     name:'L-シトルリン',
     dose:'6〜8g（トレ前60〜90分）',
     timing:'トレーニング60〜90分前',
     effect:'血流改善↑ / 筋持久力↑ / 疲労回復↑',
     evidence:'Pérez-Guisado 2010 / Suzuki 2016',
     firefighter:'長時間の消防活動・救助訓練での持久力向上に有効（docx第3.2節）。スイカが天然源だが有効量の補給は現実的でない。',
     foodAlt:'スイカ2kgで約6g→食事での補給は現実的でない。'},
    {id:'probiotic',
     name:'プロバイオティクス（マルチストレイン）',
     dose:'100億〜1,000億CFU/日',
     timing:'食事と一緒（or 製品に従う）',
     effect:'腸内環境↑ / 免疫機能↑ / シフトワーカーのストレス反応軽減',
     evidence:'Cryan 2019 / Griffith University 2021（夜勤者対象）',
     firefighter:'シフト勤務者は腸内フローラが乱れやすい。Lactobacillus rhamnosus GG等のマルチストレインがシフトワーカーのストレス反応を軽減（docx第3.2節）。腸内環境ガイドのSTEP2「環境整備後に投入」原則に従う。',
     foodAlt:'納豆・ぬか漬け・ヨーグルト・キムチを毎日摂取すればサプリは補助的でOK。'},
    {id:'curcumin',
     name:'クルクミン（高吸収型 BCM-95）',
     dose:'500〜1,000mg/日',
     timing:'食後（脂質と一緒）',
     effect:'炎症↓ / DOMS軽減 / 酸化ストレス↓ / 関節保護',
     evidence:'Drobnic 2014 / Hewlings 2017',
     firefighter:'職業性の慢性炎症（火災ガス暴露・重装備負荷）を日常的に抑制。標準ウコン粉末の6〜7倍の吸収率（BCM-95形態）（docx第1.3節）。',
     foodAlt:'ターメリック小さじ1≈クルクミン60mg。有効量500mgの補給にはサプリが現実的。'},
  ],
  tier3:[
    {id:'vitaminc',
     name:'ビタミンC',
     dose:'500〜1,000mg/日（分割摂取）',
     timing:'食事と一緒（複数回）',
     effect:'免疫機能↑ / 抗酸化 / 鉄吸収促進（非ヘム鉄を2〜3倍に）',
     evidence:'Hemilä 2017 / Shaw 2017（コラーゲン合成）',
     firefighter:'煙暴露後の免疫サポート。鉄欠乏が多い消防士では非ヘム鉄の吸収率向上が特に重要。コラーゲン合成目的でトレ前30分摂取も有効（docx第1.3節）。',
     foodAlt:'赤パプリカ100g≈VC170mg / ブロッコリー100g≈VC120mg。食事から300〜500mgは補給可能。'},
    {id:'collagen',
     name:'コラーゲンペプチド + ビタミンC',
     dose:'コラーゲン15g + VC 50mg（セット摂取）',
     timing:'トレーニング前30〜60分',
     effect:'腱・靱帯強化 / 関節保護 / 怪我予防',
     evidence:'Shaw et al. 2017 JAP',
     firefighter:'重装備着用・急激な動作が多い消防士の関節・腱保護に有効。骨スープ（コラーゲン・グリシン・プロリン）も同等効果あり（docx第1.3節）。',
     foodAlt:'骨スープ（ボーンブロス）を毎日1杯の習慣でコラーゲン・グリシンを自然補給。'},
    {id:'caffeine',
     name:'カフェイン',
     dose:'3〜6mg/体重kg（上限400mg/日）',
     timing:'トレーニング30〜60分前（就寝6時間前まで厳守）',
     effect:'筋力↑ / 持久力↑ / 認知機能↑ / 脂肪燃焼促進',
     evidence:'Grgic et al. 2018 BJSM',
     firefighter:'夜勤・24h勤務明けのトレーニング時に有効。ただし半減期5〜7時間のため就寝6時間前以降は厳禁。慢性使用で耐性形成あり→週末はカフェインオフを推奨。',
     foodAlt:'コーヒー1杯≈80〜100mg。体重70kgで必要量は2〜4杯相当→食事から補給可能。'},
  ]
}

function renderSupplementPage(){
  const suppData=DB.get('pf_supp_checks')||{};
  const todayStr=today();
  const todayChecks=suppData[todayStr]||[];

  ['tier1','tier2','tier3'].forEach(tier=>{
    const el=document.getElementById('supp-'+tier);
    if(!el)return;
    el.innerHTML=SUPPS[tier].map(s=>`
      <div style="padding:12px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:flex-start;gap:10px">
          <div style="flex:1">
            <div style="font-size:13px;font-weight:600;margin-bottom:3px">${s.name}</div>
            <div style="font-size:11px;color:var(--accent2);margin-bottom:4px">📍 ${s.dose} / ${s.timing}</div>
            <div style="font-size:12px;color:var(--text2);margin-bottom:4px">${s.effect}</div>
            <div style="font-size:11px;color:var(--accent3);margin-bottom:3px">🔥 消防士特記：${s.firefighter}</div>
            <div style="font-size:11px;color:var(--accent4)">🥗 食事での代替：${s.foodAlt}</div>
          </div>
        </div>
        <div style="font-size:10px;color:var(--text3);margin-top:4px">根拠：${s.evidence}</div>
      </div>`).join('');
  });

  // 今日の摂取チェック
  const dailyEl=document.getElementById('supp-daily-check');
  if(dailyEl){
    const allSupps=[...SUPPS.tier1,...SUPPS.tier2,...SUPPS.tier3];
    dailyEl.innerHTML=allSupps.map(s=>{
      const checked=todayChecks.includes(s.id);
      return`<label style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer">
        <input type="checkbox" id="supp-chk-${s.id}" ${checked?'checked':''} style="width:18px;height:18px">
        <span style="font-size:13px">${s.name}</span>
        <span style="font-size:11px;color:var(--text3)">${s.dose}</span>
      </label>`;
    }).join('');
  }

  // 継続ストリーク
  const streakEl=document.getElementById('supp-streak');
  if(streakEl){
    const days=7;const now=new Date();
    let streak=0,html2='<div style="display:flex;gap:4px;flex-wrap:wrap">';
    for(let i=days-1;i>=0;i--){
      const d=new Date(now);d.setDate(now.getDate()-i);
      const ds=d.toISOString().slice(0,10);
      const chks=(suppData[ds]||[]).length;
      const isToday=ds===todayStr;
      const col=chks>=3?'var(--accent4)':chks>=1?'var(--accent3)':'var(--bg4)';
      if(chks>=1&&!isToday)streak++;
      html2+=`<div style="text-align:center">
        <div style="width:32px;height:32px;border-radius:6px;background:${col};border:1px solid var(--border);display:flex;align-items:center;justify-content:center;${isToday?'box-shadow:0 0 0 2px var(--accent2)':''}">
          <span style="font-size:10px;font-family:var(--font-mono);color:${chks>0?'var(--bg)':'var(--text3)'}">${chks}</span>
        </div>
        <div style="font-size:9px;color:var(--text3);margin-top:2px">${d.getDate()}</div>
      </div>`;
    }
    html2+='</div>';
    html2+=`<div style="font-size:12px;color:var(--text2);margin-top:8px">継続ストリーク：<span style="color:var(--accent4);font-weight:600;font-family:var(--font-mono)">${streak}</span>日 / 数字は当日の摂取サプリ数</div>`;
    streakEl.innerHTML=html2;
  }

  // バッジ
  const todayCount=todayChecks.length;
  const badge=document.getElementById('supp-overall-badge');
  if(badge){
    const t=todayCount>=6?{c:'badge-green',l:'完璧'}:todayCount>=3?{c:'badge-blue',l:'良好'}:todayCount>=1?{c:'badge-amber',l:'一部'}:{c:'badge-gray',l:'未記録'};
    badge.innerHTML=`<span class="badge ${t.c}">本日：${t.l}（${todayCount}種）</span>`;
  }
}

function saveSuppCheck(){
  const suppData=DB.get('pf_supp_checks')||{};
  const todayStr=today();
  const allSupps=[...SUPPS.tier1,...SUPPS.tier2,...SUPPS.tier3];
  const checked=allSupps.filter(s=>document.getElementById('supp-chk-'+s.id)?.checked).map(s=>s.id);
  suppData[todayStr]=checked;
  DB.set('pf_supp_checks',suppData);
  renderSupplementPage();
  alert(`${checked.length}種のサプリ摂取を記録しました。`);
}

f

// ===== dashboard.js =====
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

// ===== peaking.js =====
function generatePeakingPlan(){
  const w1=parseInt(document.getElementById('pk-w1').value)||4,w2=parseInt(document.getElementById('pk-w2').value)||4,w3=parseInt(document.getElementById('pk-w3').value)||3,w4=parseInt(document.getElementById('pk-w4').value)||1;
  const startStr=document.getElementById('pk-start').value||today();
  const phases=[{type:'accumulate',label:'蓄積期',weeks:w1,startWeek:0,color:'#4a9eff',note:'高ボリューム・低強度。筋肉・有酸素基盤を構築。タンパク質高め、炭水化物多め。'},{type:'intensify',label:'強化期',weeks:w2,startWeek:w1,color:'#f5a623',note:'中ボリューム・中〜高強度。力を高める。栄養は維持〜やや増量。'},{type:'convert',label:'変換期',weeks:w3,startWeek:w1+w2,color:'#ff4560',note:'低ボリューム・高強度。スピード・爆発力に変換。カロリーを絞り始める。'},{type:'taper',label:'テーパー期',weeks:w4,startWeek:w1+w2+w3,color:'#22c55e',note:'ボリューム大幅削減・強度維持。TSBを最大化。炭水化物を増やしグリコーゲン充填。'}];
  const totalWeeks=w1+w2+w3+w4;
  DB.set('peaking',{start:startStr,phases,totalWeeks,event:document.getElementById('pk-event').value});
  document.getElementById('phase-bar').innerHTML=phases.map(p=>`<div class="phase-block phase-${p.type}" style="flex:${p.weeks}"><span>${p.label}</span><span style="font-size:9px">${p.weeks}W</span></div>`).join('');
  document.getElementById('phase-legend').innerHTML=phases.map(p=>`<span><span class="phase-dot" style="background:${p.color}40;border:1px solid ${p.color}60"></span><span style="font-size:12px;color:var(--text2)">${p.label} ${p.weeks}週</span></span>`).join('');
  document.getElementById('phase-descriptions').innerHTML='<div class="grid2" style="margin-top:12px">'+phases.map(p=>`<div class="card-sm" style="border-color:${p.color}40"><div style="font-size:12px;font-weight:700;color:${p.color};margin-bottom:6px">${p.label} — ${p.weeks}週間</div><div class="muted">${p.note}</div></div>`).join('')+'</div>';
  const cal=document.getElementById('peaking-calendar');cal.innerHTML='';
  const start=new Date(startStr);const dow=start.getDay();const monday=new Date(start);monday.setDate(start.getDate()-(dow===0?6:dow-1));const todayStr=today();
  const sched={accumulate:['strength','cardio','rest','strength','cardio','strength','rest'],intensify:['strength','hiit','rest','strength','cardio','strength','rest'],convert:['hiit','strength','rest','hiit','cardio','strength','rest'],taper:['strength','cardio','rest','strength','rest','mobility','rest']};
  for(let w=0;w<Math.min(totalWeeks,16);w++){
    const ws=new Date(monday);ws.setDate(monday.getDate()+w*7);const ph=phases.find(p=>w>=p.startWeek&&w<p.startWeek+p.weeks);const sc=sched[ph?.type||'accumulate'];
    let rowHTML=`<div class="week-label" style="font-size:10px">W${w+1}${ph?` <span style="color:${ph.color};font-size:9px">${ph.label.slice(0,2)}</span>`:''}</div>`;
    const icons={strength:'▲',hiit:'◆',cardio:'●',mobility:'◎',rest:'—'};
    for(let d=0;d<7;d++){const dt=new Date(ws);dt.setDate(ws.getDate()+d);const ds=dt.toISOString().slice(0,10);const tp=sc[d]||'rest';rowHTML+=`<div class="day-cell ${tp}${ds===todayStr?' today-cell':''}" title="${ds}"><span style="font-size:11px">${icons[tp]||'—'}</span><span style="font-size:9px;opacity:0.7">${dt.getDate()}</span></div>`;}
    const row=document.createElement('div');row.className='week-row';row.innerHTML=rowHTML;cal.appendChild(row);
  }
  const ns={accumulate:{cal:'+5〜10%',protein:'2.0〜2.2g/kg',carb:'4〜6g/kg',timing:'トレ後30分以内に高P・高C食'},intensify:{cal:'維持〜+5%',protein:'2.0g/kg',carb:'3〜5g/kg',timing:'トレ前2hに中GI炭水化物'},convert:{cal:'維持〜-5%',protein:'2.2〜2.4g/kg',carb:'3〜4g/kg',timing:'トレ後のプロテイン窓を厳守'},taper:{cal:'+5〜10%（炭水化物増）',protein:'1.8〜2.0g/kg',carb:'6〜8g/kg（充填）',timing:'毎日こまめに摂取、空腹を避ける'}};
  document.getElementById('phase-nutrition-table').innerHTML='<table><thead><tr><th>フェーズ</th><th>カロリー</th><th>タンパク質</th><th>炭水化物</th><th>タイミング戦略</th></tr></thead><tbody>'+phases.map(p=>`<tr><td><span class="badge" style="background:${p.color}20;color:${p.color};border:1px solid ${p.color}40">${p.label}</span></td><td class="muted">${ns[p.type].cal}</td><td class="muted">${ns[p.type].protein}</td><td class="muted">${ns[p.type].carb}</td><td class="muted">${ns[p.type].timing}</td></tr>`).join('')+'</tbody></table>';
  const tsbData=[];const labels=[];let sAtl=0,sCtl=0;const lbp={accumulate:350,intensify:420,convert:480,taper:120};
  for(let w=0;w<totalWeeks;w++){const ph=phases.find(p=>w>=p.startWeek&&w<p.startWeek+p.weeks);const wl=ph?lbp[ph.type]:0;for(let d=0;d<7;d++){const dl=wl/7;sAtl=sAtl+(dl-sAtl)*(1-Math.exp(-1/7));sCtl=sCtl+(dl-sCtl)*(1-Math.exp(-1/42));}tsbData.push(Math.round(sCtl-sAtl));labels.push('W'+(w+1));}
  if(pkTsbChart)pkTsbChart.destroy();
  pkTsbChart=new Chart(document.getElementById('pk-tsb-chart'),{type:'line',data:{labels,datasets:[{data:tsbData,borderColor:'#22c55e',backgroundColor:'rgba(34,197,94,0.08)',tension:0.4,fill:true,borderWidth:2,pointRadius:3,pointBackgroundColor:tsbData.map(v=>v>0?'#22c55e':'#ff4560')},{data:labels.map(()=>0),borderColor:'rgba(255,255,255,0.15)',borderDash:[4,4],borderWidth:1,pointRadius:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#5a5a78',font:{size:11}},grid:{color:'rgba(255,255,255,0.04)'}},y:{ticks:{color:'#5a5a78',font:{size:11}},grid:{color:'rgba(255,255,255,0.04)'}}}}});
  document.getElementById('peaking-result').style.display='block';
}

// ===== program-master.js =====
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

// ===== program.js =====
function getPrevRecord(exName){
  const all=DB.arr('trainings').slice().reverse();
  for(const t of all){
    if(!t.exercises)continue;
    const ex=t.exercises.find(e=>e.name===exName&&(parseFloat(e.weight)||0)>0);
    if(ex)return{date:t.date,sets:ex.sets,reps:ex.reps,weight:ex.weight};
  }
  return null;
}

function selectSession(id){
  currentSession=id;
  const prog=getCurrentProgramData();
  const s=prog.sessions[id];if(!s)return;
  document.querySelectorAll('[id^="prog-btn-"]').forEach(b=>b.style.opacity=b.id==='prog-btn-'+id?'1':'0.45');
  document.getElementById('prog-session-name').textContent=s.name;
  document.getElementById('prog-session-focus').textContent=s.focus;
  const pk=DB.get('peaking');let phaseType=null,phaseText='フェーズ未設定',phaseClass='badge-gray';
  if(pk){const sD=new Date(pk.start);const tD=new Date(today());const wN=Math.floor((tD-sD)/(7*86400000));const ph=pk.phases.find(p=>wN>=p.startWeek&&wN<p.startWeek+p.weeks);if(ph){phaseType=ph.type;const n={accumulate:'蓄積期',intensify:'強化期',convert:'変換期 6〜8rep',taper:'テーパー期'};const cl={accumulate:'badge-blue',intensify:'badge-amber',convert:'badge-red',taper:'badge-green'};phaseText=n[ph.type];phaseClass=cl[ph.type];}}
  document.getElementById('prog-phase-advice').className='badge '+phaseClass;
  document.getElementById('prog-phase-advice').textContent=phaseText;
  const rirTable={accumulate:['RIR3〜4','RIR2〜3','RIR1〜2'],intensify:['RIR2〜3','RIR1〜2','RIR0〜1'],convert:['RIR1〜2','RIR1〜2','RIR0〜1'],taper:['RIR3〜4','RIR3〜4','RIR2〜3'],none:['RIR2〜3','RIR1〜2','RIR0〜1']};
  const rirColTable={accumulate:['#4a9eff','#4a9eff','#f5a623'],intensify:['#4a9eff','#f5a623','#ff4560'],convert:['#f5a623','#f5a623','#ff4560'],taper:['#4a9eff','#4a9eff','#4a9eff'],none:['#4a9eff','#f5a623','#ff4560']};
  const rirArr=rirTable[phaseType||'none'];const rirColArr=rirColTable[phaseType||'none'];
  const typeIdx={C:0,M:1,I:2};
  const typeBg={C:'rgba(255,69,96,0.12)',M:'rgba(74,158,255,0.12)',I:'rgba(167,139,250,0.12)'};
  const typeCol={C:'#ff4560',M:'#4a9eff',I:'#a78bfa'};
  const typeShort={C:'CF',M:'CM',I:'ISO'};
  const pc={'背中':'#4a9eff','胸':'#ff4560','胸・三頭':'#ff4560','四頭':'#22c55e','ハム':'#22c55e','腹':'#888','肩':'#f5a623','肩後部':'#f5a623','三頭':'#a78bfa','二頭':'#a78bfa','カーフ':'#6b7280','内転筋':'#22c55e','臀部':'#22c55e','脚全体':'#22c55e','脊柱起立筋':'#4a9eff','僧帽筋':'#4a9eff','胸下部':'#ff4560'};
  document.getElementById('prog-exercise-list').innerHTML=
    '<table><thead><tr><th>#</th><th>種目</th><th>部位</th><th>タイプ</th><th>推奨rep</th><th style="color:var(--accent)">今日のRIR</th></tr></thead><tbody>'+
    s.exercises.map((e,i)=>{
      const col=pc[e.part]||'#888';const t=e.rpe||'I';const ti=typeIdx[t]??2;
      const rirVal=rirArr[ti];const rirCol=rirColArr[ti];
      return`<tr><td class="mono" style="color:var(--text3);font-size:12px">${i+1}</td><td style="font-size:13px">${e.name}</td><td><span style="font-size:10px;padding:2px 7px;border-radius:10px;background:${col}20;color:${col};border:1px solid ${col}40">${e.part}</span></td><td><span style="font-size:10px;padding:2px 6px;border-radius:4px;background:${typeBg[t]};color:${typeCol[t]};font-weight:500">${typeShort[t]}</span></td><td class="mono" style="font-size:12px">${e.reps}</td><td class="mono" style="color:${rirCol};font-weight:600">${rirVal}</td></tr>`;
    }).join('')+'</tbody></table>'+
    '<div style="display:flex;gap:12px;margin-top:10px;flex-wrap:wrap;font-size:11px;color:var(--text2)">'+
    '<span><span style="padding:1px 6px;border-radius:3px;background:rgba(255,69,96,0.12);color:#ff4560;font-weight:500">CF</span> コンパウンド（フリー重量）</span>'+
    '<span><span style="padding:1px 6px;border-radius:3px;background:rgba(74,158,255,0.12);color:#4a9eff;font-weight:500">CM</span> コンパウンド（マシン）</span>'+
    '<span><span style="padding:1px 6px;border-radius:3px;background:rgba(167,139,250,0.12);color:#a78bfa;font-weight:500">ISO</span> アイソレーション</span></div>';
  document.getElementById('program-detail').style.display='block';
  DB.set('lastSession',id);
}

function loadProgramToTraining(){
  if(!currentSession)return;
  const prog=getCurrentProgramData();
  const s=prog.sessions[currentSession];if(!s)return;
  document.getElementById('t-type').value='strength';
  document.getElementById('t-date').value=today();
  document.getElementById('exercise-list').innerHTML='';
  exCount=0;
  s.exercises.forEach(e=>{
    exCount++;
    const did='ex'+exCount;
    const prev=getPrevRecord(e.name);
    const prevKg=prev?parseFloat(prev.weight):null;
    const prevReps=prev?parseInt(prev.reps):null;
    const prevHint=prev
      ? `<span style="font-size:10px;color:var(--accent4);padding:2px 6px;background:rgba(34,197,94,0.12);border-radius:4px;white-space:nowrap">前回:${prevKg}kg×${prevReps}rep (${prev.date.slice(5)})</span>`
      : `<span style="font-size:10px;color:var(--text3);padding:2px 6px;background:var(--bg4);border-radius:4px">初回</span>`;
    const div=document.createElement('div');
    div.className='input-row';div.id=did;
    div.style.cssText='margin-bottom:10px;flex-wrap:wrap;gap:6px;align-items:center';
    div.innerHTML=`<input type="text" value="${e.name}" style="flex:2;min-width:140px"><input type="number" value="1" min="1" max="30" style="max-width:65px" placeholder="セット"><input type="number" value="${prevReps||''}" min="1" max="100" style="max-width:65px" placeholder="回数"><input type="number" value="${prevKg||''}" min="0" max="500" step="0.5" style="max-width:75px" placeholder="kg">${prevHint}<button class="btn btn-sm btn-ghost" onclick="document.getElementById('${did}').remove()">✕</button>`;
    document.getElementById('exercise-list').appendChild(div);
  });
  showPage('training');
}


// ============================================================
// SHIFT MANAGEMENT
// ============================================================
let shiftMonthDelta=0,currentShiftMode='24h';
c

// ===== training.js =====
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


// ===== nutrition-core.js =====
function updateNutritionGoals(){const mode=document.getElementById('n-goal-mode')?.value||'maintain';const c=cfg();const calT=getCalTarget(mode);const macros=getMacros(calT,c.tdeeweight||70);['n-cal-target','n-protein-t','n-carb-t','n-fat-t'].forEach((id,i)=>{const el=document.getElementById(id);if(el)el.textContent=[calT,macros.protein,macros.carb,macros.fat][i];});const hintEl=document.getElementById('n-mode-hint');if(hintEl)hintEl.textContent={maintain:'維持: TDEEと同等。筋肉量を保ちながら体組成を安定させます',cut:'減量: TDEE-15%。週0.4〜0.5kg減が目安。タンパク質は高めを維持',bulk:'増量: TDEE+10%。リーンバルクで週0.25〜0.5kg増が目標'}[mode]||'';}

function saveMeal(){const food=document.getElementById('n-food').value;const cal=parseInt(document.getElementById('n-cal').value)||0;if(!food||!cal){alert('食品名とカロリーは必須です');return}DB.push('meals',{date:document.getElementById('n-date').value,meal:document.getElementById('n-meal').value,food,cal,protein:parseInt(document.getElementById('n-protein').value)||0,carb:parseInt(document.getElementById('n-carb').value)||0,fat:parseInt(document.getElementById('n-fat').value)||0,id:Date.now()});['n-food','n-cal','n-protein','n-carb','n-fat'].forEach(id=>document.getElementById(id).value='');renderMealLog();updateNutritionTotals();}

function updateNutritionTotals(){const meals=DB.arr('meals').filter(m=>m.date===today());const cal=meals.reduce((a,m)=>a+(m.cal||0),0),p=meals.reduce((a,m)=>a+(m.protein||0),0),c2=meals.reduce((a,m)=>a+(m.carb||0),0),f=meals.reduce((a,m)=>a+(m.fat||0),0);document.getElementById('n-today-cal').textContent=cal;document.getElementById('n-today-p').textContent=p;document.getElementById('n-today-c').textContent=c2;document.getElementById('n-today-f').textContent=f;const mode=document.getElementById('n-goal-mode')?.value||'maintain';const target=getCalTarget(mode);const rem=target-cal;const remEl=document.getElementById('n-remaining-alert');if(rem>0)remEl.innerHTML=`<div class="alert alert-info">あと <strong>${rem}kcal</strong> 摂取可能（達成率 ${Math.round(cal/target*100)}%）</div>`;else if(rem===0)remEl.innerHTML=`<div class="alert alert-success">目標カロリーに到達しました！</div>`;else remEl.innerHTML=`<div class="alert alert-warn">目標を <strong>${Math.abs(rem)}kcal</strong> オーバーしています</div>`;}

function renderMealLog(){const meals=DB.arr('meals').filter(m=>m.date===today()).reverse();const el=document.getElementById('n-meal-list');if(!meals.length){el.innerHTML='<div class="muted">今日の食事記録がありません</div>';return}el.innerHTML='<table><thead><tr><th>タイミング</th><th>食品</th><th>kcal</th><th>P</th><th>C</th><th>F</th></tr></thead><tbody>'+meals.map(m=>`<tr><td>${mealLabel[m.meal]||m.meal}</td><td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.food}</td><td class="mono">${m.cal}</td><td class="mono">${m.protein}g</td><td class="mono">${m.carb}g</td><td class="mono">${m.fat}g</td></tr>`).join('')+'</tbody></table>';}

function updateSmartNutrition(){const c=cfg();const isTr=document.getElementById('today-training')?.checked??true;const bf=parseFloat(document.getElementById('n-bodyfat')?.value)||null;const mode=document.getElementById('n-goal-mode')?.value||c.goalmode||'maintain';let autoMode=mode;let bfAlert=null;if(bf){if(bf>=18){autoMode='cut';bfAlert={t:'alert-danger',m:`体脂肪率${bf}% → ミニカット推奨。`};}else if(bf>=15){autoMode='cut';bfAlert={t:'alert-warn',m:`体脂肪率${bf}% → ミニカット検討ゾーン。`};}else if(bf<=12){bfAlert={t:'alert-success',m:`体脂肪率${bf}% → バルクアップ最適ゾーン。`};}}const baseT=getCalTarget(autoMode);const offCal=isTr?baseT:Math.round(baseT*0.93);const macros=getMacros(offCal,c.tdeeweight||70);const carbT=Math.round(macros.carb*(isTr?1.0:0.80));const fatT=Math.round(macros.fat*(isTr?1.0:1.10));['n-cal-target','n-protein-t','n-carb-t','n-fat-t'].forEach((id,i)=>{const el=document.getElementById(id);if(el)el.textContent=[offCal,macros.protein,carbT,fatT][i];});const w=parseFloat(c.tdeeweight)||70;const tEl=document.getElementById('smart-targets');if(tEl)tEl.innerHTML=`<div class="card-sm"><div class="label">トレ前目安</div><div style="font-size:13px">炭水化物: <strong>${Math.round(w*1.15)}g</strong></div><div style="font-size:13px">タンパク質: <strong>${Math.round(w*0.6)}g</strong></div><div class="muted" style="font-size:11px;margin-top:5px">脂質0〜15g・2〜3h前</div></div><div class="card-sm"><div class="label">トレ後（最重要）</div><div style="font-size:13px">炭水化物: <strong style="color:var(--accent4)">${Math.round(w*2.0)}g</strong></div><div style="font-size:13px">タンパク質: <strong>20g以上</strong></div><div class="muted" style="font-size:11px;margin-top:5px">脂質最小・2h以内</div></div><div class="card-sm"><div class="label">${isTr?'トレ日':'オフ日'}合計</div><div style="font-size:13px">カロリー: <strong>${offCal}kcal</strong></div><div style="font-size:13px">炭水化物: <strong>${carbT}g</strong>${isTr?'':' <span style="font-size:11px;color:var(--accent3)">(-20%)</span>'}</div></div>`;
  const bEl=document.getElementById('smart-badges');if(bEl){const mc={maintain:'badge-blue',cut:'badge-amber',bulk:'badge-green'};const ml={maintain:'維持',cut:'減量',bulk:'増量'};bEl.innerHTML=`<span class="badge ${mc[autoMode]}">${ml[autoMode]}モード</span>${isTr?'<span class="badge badge-blue">トレ日</span>':'<span class="badge badge-gray">オフ日</span>'}`;}
  const aEl=document.getElementById('smart-advice-box');if(aEl&&bfAlert)aEl.innerHTML=`<div class="alert ${bfAlert.t}">${bfAlert.m}</div>`;else if(aEl)aEl.innerHTML='';
  updateNutritionTotals();}

// ===== sleep.js =====
function saveSleep(){const bed=document.getElementById('s-bed').value;const wake=document.getElementById('s-wake').value;let dur=0;if(bed&&wake){const[bh,bm]=bed.split(':').map(Number);const[wh,wm]=wake.split(':').map(Number);let m=(wh*60+wm)-(bh*60+bm);if(m<0)m+=1440;dur=Math.round(m/60*10)/10}const fat=parseInt(document.getElementById('s-fatigue').value)||7,sor=parseInt(document.getElementById('s-soreness').value)||7,mot=parseInt(document.getElementById('s-motivation').value)||7,mood=parseInt(document.getElementById('s-mood').value)||7;const wellness=Math.round((fat+sor+mot+mood)/4*10)/10;DB.push('sleeps',{date:document.getElementById('s-date').value,bedtime:bed,waketime:wake,duration:dur,quality:parseInt(document.getElementById('s-quality').value)||3,fatigue:fat,soreness:sor,motivation:mot,mood,wellness,weight:parseFloat(document.getElementById('s-weight').value)||0,id:Date.now()});alert('記録しました！睡眠: '+dur+'h / ウェルネス: '+wellness+'/10');renderSleepCharts();}

function renderSleepCharts(){const sl=DB.arr('sleeps').slice(-7);if(!sl.length)return;const labels=sl.map(s=>s.date.slice(5));const co={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#5a5a78',font:{size:10}},grid:{color:'rgba(255,255,255,0.04)'}},y:{ticks:{color:'#5a5a78',font:{size:10}},grid:{color:'rgba(255,255,255,0.04)'}}}};if(sleepChart)sleepChart.destroy();sleepChart=new Chart(document.getElementById('sleep-chart'),{type:'bar',data:{labels,datasets:[{data:sl.map(s=>s.duration||0),backgroundColor:'rgba(74,158,255,0.45)',borderColor:'#4a9eff',borderWidth:1,borderRadius:4}]},options:{...co,scales:{...co.scales,y:{...co.scales.y,min:0,max:12}}}});if(wellnessChart)wellnessChart.destroy();wellnessChart=new Chart(document.getElementById('wellness-chart'),{type:'line',data:{labels,datasets:[{data:sl.map(s=>s.wellness||0),borderColor:'#f5a623',tension:0.4,borderWidth:2,fill:false,pointRadius:5,pointBackgroundColor:'#f5a623'}]},options:{...co,scales:{...co.scales,y:{...co.scales.y,min:0,max:10}}}});}

// ===== shift.js =====
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

// ===== analysis.js =====
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

// ===== tdee.js =====
function calcTDEE(){const sex=document.getElementById('td-sex').value;const age=parseInt(document.getElementById('td-age').value)||30;const h=parseFloat(document.getElementById('td-height').value)||175;const w=parseFloat(document.getElementById('td-weight').value)||70;const act=parseFloat(document.getElementById('td-act').value)||1.55;const shift=parseInt(document.getElementById('td-shift').value)||300;let bmr=sex==='male'?10*w+6.25*h-5*age+5:10*w+6.25*h-5*age-161;const tdee=Math.round(bmr*act)+Math.round(shift*3/7)+Math.round(parseInt(document.getElementById('td-tdays').value||4)*30/7);const neat=Math.round(tdee-bmr);document.getElementById('td-bmr').textContent=Math.round(bmr);document.getElementById('td-tdee').textContent=tdee;document.getElementById('td-neat').textContent=neat;const goals=[{l:'減量（-15%）',c:Math.round(tdee*0.85)},{l:'維持',c:tdee},{l:'増量（+10%）',c:Math.round(tdee*1.10)}];document.getElementById('tdee-goal-table').innerHTML='<table><thead><tr><th>モード</th><th>目標kcal</th></tr></thead><tbody>'+goals.map(g=>`<tr><td>${g.l}</td><td class="mono" style="color:var(--accent)">${g.c}</td></tr>`).join('')+'</tbody></table>';const macros=getMacros(tdee,w);document.getElementById('tdee-macro-table').innerHTML='<table><thead><tr><th>栄養素</th><th>量</th><th>根拠</th></tr></thead><tbody>'+`<tr><td>タンパク質</td><td class="mono">${macros.protein}g</td><td class="muted">2.0g/kg (Morton 2018)</td></tr><tr><td>脂質</td><td class="mono">${macros.fat}g</td><td class="muted">総kcalの25%</td></tr><tr><td>炭水化物</td><td class="mono">${macros.carb}g</td><td class="muted">残余から算出</td></tr>`+'</tbody></table>';document.getElementById('tdee-result').style.display='block';const c=cfg();c.tdeeCalc=tdee;c.tdeeweight=w;DB.set('cfg',c);}

function applyTDEE(){const tdee=parseInt(document.getElementById('td-tdee').textContent);if(!tdee){alert('先に算出してください');return}const c=cfg();c.tdee=tdee;DB.set('cfg',c);document.getElementById('cfg-tdee').value=tdee;alert('TDEEを'+tdee+'kcalに設定しました。');}

// ===== settings.js =====
function saveSettings(){const c={name:document.getElementById('cfg-name').value,dept:document.getElementById('cfg-dept').value,goalweight:parseFloat(document.getElementById('cfg-goalweight').value)||0,goalmode:document.getElementById('cfg-goalmode').value,tdee:parseInt(document.getElementById('cfg-tdee').value)||2800,water:parseInt(document.getElementById('cfg-water').value)||2500};DB.set('cfg',c);alert('設定を保存しました');}

function loadSettings(){const c=cfg();['cfg-name','cfg-dept','cfg-tdee','cfg-water'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=c[id.replace('cfg-','')]||''});if(document.getElementById('cfg-goalmode'))document.getElementById('cfg-goalmode').value=c.goalmode||'maintain';if(document.getElementById('cfg-goalweight'))document.getElementById('cfg-goalweight').value=c.goalweight||'';}

function exportData(){const data={trainings:DB.arr('trainings'),meals:DB.arr('meals'),sleeps:DB.arr('sleeps'),peaking:DB.get('peaking'),cfg:DB.get('cfg'),gut:DB.get('gutData'),bristolLog:DB.arr('bristolLog'),exported:new Date().toISOString()};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='peakform_'+today()+'.json';a.click();URL.revokeObjectURL(url);}

function clearAll(){if(confirm('全データを削除しますか？')){['trainings','meals','sleeps','peaking','cfg','gutData','bristolLog'].forEach(k=>localStorage.removeItem('pf_'+k));location.reload();}}

function autoCleanOldData(){
  // 古いデータを自動削除（パフォーマンス保護）
  const trainings=DB.arr('trainings');
  if(trainings.length>500){DB.set('trainings',trainings.slice(-400));console.log('trainings auto-cleaned');}
  const meals=DB.arr('meals');
  if(meals.length>1000){DB.set('meals',meals.slice(-800));console.log('meals auto-cleaned');}
  const sleeps=DB.arr('sleeps');
  if(sleeps.length>365){DB.set('sleeps',sleeps.slice(-300));console.log('sleeps auto-cleaned');}
  const bristolLog=DB.arr('bristolLog');
  if(bristolLog.length>180){DB.set('bristolLog',bristolLog.slice(-150));console.log('bristolLog auto-cleaned');}
}

// ===== main.js =====
function init(){
  const t=today();['t-date','n-date','s-date'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=t});
  document.getElementById('topbar-date').textContent=new Date().toLocaleDateString('ja-JP',{month:'long',day:'numeric',weekday:'short'});
  loadSettings();renderDashboard();renderTrainingLog();
  const c=cfg();if(document.getElementById('n-goal-mode'))document.getElementById('n-goal-mode').value=c.goalmode||'maintain';
  if(document.getElementById('pk-start'))document.getElementById('pk-start').value=t;
  const existing=DB.get('peaking');if(existing)document.getElementById('peaking-result').style.display='block';
  updateNutritionGoals();updateSmartNutrition();
  autoCleanOldData();
  onTrainingTypeChange();
}
init();
