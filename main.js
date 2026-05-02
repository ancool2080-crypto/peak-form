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