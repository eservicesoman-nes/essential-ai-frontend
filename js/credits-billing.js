// credits-billing.js — extracted from index.html, NES Locale Phase 0
// 16 functions, zero logic changes

async function showApiCredits(){
  if(userRole!=='nesadmin')return;
  const mc=document.getElementById('mainContent');
  mc.style.overflow='auto';
  mc.innerHTML=`
    <div style="padding-block:11px;padding-inline-end:var(--header-clearance);padding-inline-start:60px;border-bottom:1px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:space-between;" class="an-hdr">
      <div>
        <div style="font-family:var(--mono);font-size:.8rem;color:#7f77dd;font-weight:800;">API CREDITS</div>
        <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);">${t('pageSubtitle.apiCredits')}</div>
      </div>
    </div>
    <div class="page" id="apiCreditsContent" style="overflow-y:auto;flex:1;">
      <div style="color:var(--muted);font-family:var(--mono);font-size:.8rem;padding:20px 0;">Loading API credits...</div>
    </div>`;
  await loadApiCredits();
}

async function loadApiCredits(){
  const el=document.getElementById('apiCreditsContent');
  if(!el)return;
  const apis=[
    {id:'anthropic',name:'Anthropic (Claude)',icon:'ti-brain',color:'#d29922',note:'n8n workflows + fallback chat'},
    {id:'gemini',name:'Google Gemini',icon:'ti-sparkles',color:'#409cff',note:'Primary chat model'},
    {id:'openai',name:'OpenAI (DALL-E)',icon:'ti-photo-ai',color:'#3fb950',note:'Image generation fallback'},
    {id:'deepseek',name:'DeepSeek',icon:'ti-robot',color:'#7f77dd',note:'Chat fallback 2'},
    {id:'fal',name:'Flux (FAL)',icon:'ti-wand',color:'#f0883e',note:'Primary image generation'},
    {id:'tavily',name:'Tavily Search',icon:'ti-search',color:'#8b949e',note:'Retired Jun 2026 — replaced by Gemini grounding',retired:true},
    {id:'apex_connect',name:'Apex Connect (Sara)',icon:'ti-phone',color:'#3fb950',note:'60-sec callback — Apex Connect'},
    {id:'apex_outreach',name:'Apex Outreach (Layla)',icon:'ti-headset',color:'#7f77dd',note:'3-day follow-up — Apex Outreach'},
    {id:'apex_advisory',name:'Apex Advisory (Adam)',icon:'ti-phone-call',color:'#f0883e',note:'Enterprise consultant — Apex Advisory'},
    {id:'twilio',name:'Twilio',icon:'ti-message-dots',color:'#f85149',note:'WhatsApp & SMS'},
    {id:'vapi',name:'Vapi (voice calls)',icon:'ti-phone',color:'#409cff',note:'Sara / Adam / Layla calls'},
  ];
  let thresholds={};
  try{const{data}=await sb.from('api_credits').select('*');if(data)data.forEach(r=>{thresholds[r.service_name?.toLowerCase().replace(/[^a-z]/g,'')]=r;});}catch(e){}
  // Fix 318: real usage this month (calls + AI) from admin_cost_overview()
  let _cost=null;try{const{data:_c,error:_ce}=await sb.rpc('admin_cost_overview');if(!_ce)_cost=_c;}catch(e){}
  const _aiRe={gemini:/^gemini/i,anthropic:/^claude/i,deepseek:/^deepseek/i,openai:/^(gpt|o\d|text-embedding|dall)/i,fal:/^(flux|fal)/i};
  const _usedOf=function(id){if(!_cost)return null;const c=_cost.calls_mtd||{};if(id==='vapi')return parseFloat(c.vapi_usd)||0;if(id==='twilio')return parseFloat(c.twilio_usd)||0;if(_aiRe[id])return((_cost.ai_mtd||{}).by_model||[]).filter(m=>_aiRe[id].test(m.model)).reduce((a,m)=>a+(parseFloat(m.usd)||0),0);return null;};
  const _spendMtd=_cost?((parseFloat((_cost.calls_mtd||{}).vapi_usd)||0)+(parseFloat((_cost.calls_mtd||{}).twilio_usd)||0)+(parseFloat((_cost.ai_mtd||{}).usd)||0)):null;
  const _fmt=function(v){return '$'+v.toFixed(v>0&&v<0.01?4:2);};
  const _d=function(x){return x?new Date(x).toLocaleDateString(getDateLocale('en-GB'),{day:'2-digit',month:'short'}):'';};
  window._apiLoaded={};
  const alertCount=Object.values(thresholds).filter(t=>t.status==='low'||t.status==='critical').length;
  let html='';
  if(alertCount>0){html+=`<div style="background:rgba(248,81,73,.1);border:1px solid rgba(248,81,73,.3);border-radius:8px;padding:10px 14px;margin-bottom:16px;display:flex;align-items:center;gap:8px;font-size:.78rem;font-weight:600;color:#f85149;"><i class="ti ti-alert-triangle" style="font-size:16px;"></i>${alertCount} API${alertCount>1?'s':''} below threshold</div>`;}
  html+=`<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;">
    <div style="background:var(--surface);border-radius:8px;padding:12px;border:1px solid var(--border);"><div style="font-size:.7rem;color:var(--muted);margin-bottom:4px;font-family:var(--mono);">${t('apiCreditsLabel.apisMonitored')}</div><div style="font-size:1.4rem;font-weight:700;color:var(--text);">${apis.length}</div></div>
    <div style="background:var(--surface);border-radius:8px;padding:12px;border:1px solid var(--border);"><div style="font-size:.7rem;color:var(--muted);margin-bottom:4px;font-family:var(--mono);">${t('apiCreditsLabel.alertsActive')}</div><div style="font-size:1.4rem;font-weight:700;color:${alertCount>0?'#f85149':'#3fb950'};">${alertCount}</div></div>
    <div style="background:var(--surface);border-radius:8px;padding:12px;border:1px solid var(--border);"><div style="font-size:.7rem;color:var(--muted);margin-bottom:4px;font-family:var(--mono);">${t('apiCreditsLabel.liveOrComputed','Live / computed')}</div><div style="font-size:1.4rem;font-weight:700;color:#7f77dd;">${Object.values(thresholds).filter(x=>x.balance_source==='api'||x.balance_source==='computed').length}</div></div>
    <div style="background:var(--surface);border-radius:8px;padding:12px;border:1px solid var(--border);"><div style="font-size:.7rem;color:var(--muted);margin-bottom:4px;font-family:var(--mono);">${t('apiCreditsLabel.spendMonth','Spend this month')}</div><div style="font-size:1.4rem;font-weight:700;color:var(--nes-blue);">${_spendMtd===null?'—':_fmt(_spendMtd)}</div></div>
  </div>`;
  html+=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;">API Credit Status</div><div style="display:flex;gap:8px;"><button onclick="saveAllThresholds()" style="background:var(--nes-btn-grad);border:none;border-radius:6px;padding:4px 12px;color:#fff;font-size:.72rem;font-weight:700;cursor:pointer;font-family:var(--mono);"><i class="ti ti-device-floppy"></i> Save Thresholds</button><button onclick="addApiService()" style="background:none;border:1px solid var(--border);border-radius:6px;padding:4px 10px;color:var(--muted);cursor:pointer;font-size:.72rem;font-family:var(--mono);"><i class="ti ti-plus"></i> Add API</button></div></div>`;
  html+=`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px;margin-bottom:20px;">`;
  apis.forEach(function(api){
    const th=thresholds[api.id]||{};
    const balance=th.current_balance||0;const threshold=th.alert_threshold||5;const rechargeAt=th.recharge_at||5;const _u=_usedOf(api.id);const usage=_u===null?0:_u;window._apiLoaded[api.id]=balance;
    const _src=th.balance_source||'manual';
    const _srcTxt=_src==='api'?t('apiCreditsLabel.srcLive','live from provider'):_src==='computed'?t('apiCreditsLabel.srcComputed','computed')+' · '+t('apiCreditsLabel.since','since')+' '+_d(th.base_at):t('apiCreditsLabel.srcManual','manual');
    const _topTxt=th.last_topup_at?t('apiCreditsLabel.lastTopup','Last top-up')+': '+_d(th.last_topup_at)+' · $'+(parseFloat(th.last_topup_amount)||0).toFixed(2):t('apiCreditsLabel.noTopup','No top-up recorded');
    const status=balance===0?'unknown':balance<threshold?'low':'healthy';
    const statusColor=status==='healthy'?'#3fb950':status==='low'?'#f85149':'#d29922';
    const statusBg=status==='healthy'?'#0d2818':status==='low'?'#2d0e0e':'#2d1f00';
    const pct=balance+usage>0?Math.round((usage/(balance+usage))*100):0;
    const barColor=pct>80?'#f85149':pct>60?'#d29922':'#409cff';
    html+=`<div style="background:var(--surface);border:1px solid ${status==='low'?'rgba(248,81,73,.3)':'var(--border)'};border-radius:12px;padding:14px 16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;"><div style="display:flex;align-items:center;gap:8px;"><i class="ti ${api.icon}" style="font-size:16px;color:${api.color};"></i><span style="font-size:.82rem;font-weight:600;color:var(--text);">${api.name}</span></div><span style="font-size:.65rem;padding:2px 8px;border-radius:20px;font-weight:600;background:${statusBg};color:${statusColor};">${status==='unknown'?t('pricingPage.notSet'):status==='healthy'?t('pricingPage.healthy'):t('pricingPage.low')}</span></div>
      <div style="font-size:.68rem;color:var(--muted);font-family:var(--mono);margin-bottom:10px;">${api.note}</div>
      <div style="font-size:1.5rem;font-weight:700;color:${status==='low'?'#f85149':'var(--text)'};margin-bottom:3px;">${balance===0?'—':'$'+balance.toFixed(2)}</div>
      <div style="font-size:.68rem;color:var(--muted);font-family:var(--mono);margin-bottom:2px;">${t('apiCreditsLabel.currentBalance')} · <span style="color:${_src==='manual'?'#d29922':'#3fb950'};">${_srcTxt}</span></div>
      <div style="font-size:.62rem;color:var(--muted);font-family:var(--mono);margin-bottom:10px;">${_topTxt}</div>
      <div style="display:flex;justify-content:space-between;font-size:.65rem;color:var(--muted);font-family:var(--mono);margin-bottom:4px;"><span>${t('apiCreditsLabel.usedThisMonth')}</span><span>${_u===null?'—':_fmt(usage)}</span></div>
      <div style="height:4px;background:var(--border);border-radius:4px;overflow:hidden;margin-bottom:10px;"><div style="height:100%;width:${pct}%;background:${barColor};border-radius:4px;"></div></div>
      <div style="border-top:1px solid var(--border);padding-top:10px;display:flex;align-items:center;justify-content:space-between;"><span style="font-size:.65rem;color:var(--muted);">Balance $</span><input id="bal_${api.id}" type="number" value="${balance}" step="0.01" min="0" style="background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:3px 7px;color:var(--text);font-family:var(--mono);font-size:.7rem;width:80px;text-align:right;"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;"><span style="font-size:.65rem;color:var(--muted);">Alert at $</span><input id="thr_${api.id}" type="number" value="${threshold}" min="0" style="background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:3px 7px;color:var(--text);font-family:var(--mono);font-size:.7rem;width:80px;text-align:right;"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;"><span style="font-size:.65rem;color:var(--muted);">Recharge at $</span><input id="rat_${api.id}" type="number" value="${rechargeAt}" min="0" style="background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:3px 7px;color:var(--text);font-family:var(--mono);font-size:.7rem;width:80px;text-align:right;"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;gap:6px;"><span style="font-size:.65rem;color:var(--muted);">${t('apiCreditsLabel.topup','Top-up $')}</span><span style="display:flex;gap:6px;align-items:center;"><input id="top_${api.id}" type="number" value="0" step="0.01" min="0" style="background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:3px 7px;color:var(--text);font-family:var(--mono);font-size:.7rem;width:80px;text-align:right;"><button onclick="recordApiTopup('${api.id}')" style="background:var(--nes-btn-grad);border:none;border-radius:5px;padding:3px 8px;color:#fff;font-size:.62rem;font-weight:700;cursor:pointer;font-family:var(--mono);white-space:nowrap;">${t('apiCreditsLabel.recordTopup','Record top-up')}</button></span></div>
    </div>`;
  });
  html+='</div>';
  html+=`<div id="addApiForm" style="display:none;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:20px;"><div style="font-family:var(--mono);font-size:.72rem;color:var(--nes-blue);font-weight:700;margin-bottom:12px;">Add New API</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;"><div><div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);margin-bottom:4px;">Service name</div><input id="new_api_name" class="form-input" placeholder="e.g. Stripe" style="font-size:.78rem;"></div><div><div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);margin-bottom:4px;">Balance ($)</div><input id="new_api_balance" class="form-input" type="number" placeholder="0.00" style="font-size:.78rem;"></div><div><div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);margin-bottom:4px;">Alert threshold ($)</div><input id="new_api_threshold" class="form-input" type="number" placeholder="5" style="font-size:.78rem;"></div><div><div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);margin-bottom:4px;">Notes</div><input id="new_api_notes" class="form-input" placeholder="What it is used for" style="font-size:.78rem;"></div></div><div style="display:flex;gap:8px;margin-top:10px;"><button onclick="saveNewApiService()" style="background:var(--nes-btn-grad);border:none;border-radius:7px;padding:7px 16px;color:#fff;font-size:.75rem;font-weight:700;cursor:pointer;"><i class="ti ti-plus"></i>${t('common.add')}</button><button onclick="document.getElementById('addApiForm').style.display='none'" style="background:none;border:1px solid var(--border);border-radius:7px;padding:7px 14px;color:var(--muted);cursor:pointer;font-size:.75rem;">${t('common.cancel')}</button></div></div>`;
  el.innerHTML=html;
  window._apisList=apis;
}

function addApiService(){const f=document.getElementById('addApiForm');if(f)f.style.display=f.style.display==='none'?'block':'none';}

async function saveNewApiService(){
  const name=document.getElementById('new_api_name')?.value.trim();
  const balance=parseFloat(document.getElementById('new_api_balance')?.value)||0;
  const threshold=parseFloat(document.getElementById('new_api_threshold')?.value)||5;
  const notes=document.getElementById('new_api_notes')?.value.trim();
  if(!name){showToast(t('toast.serviceNameRequired'));return;}
  try{{const{error:_e}=await sb.from('api_credits').insert([{service_name:name,current_balance:balance,alert_threshold:threshold,notes,status:balance<threshold?'low':'healthy'}]);if(_e)throw _e;}showToast(t('pricingPage.apiAdded'));document.getElementById('addApiForm').style.display='none';await loadApiCredits();}catch(e){showToast(t('popup.error')+': '+e.message);}
}

async function updateApiBalance(id,val){
  const balance=parseFloat(val)||0;const threshold=parseFloat(document.getElementById('thr_'+id)?.value)||5;
  try{{const{error:_e}=await sb.from('api_credits').upsert({service_name:id,current_balance:balance,status:balance<threshold?'low':'healthy'},{onConflict:'service_name'});if(_e)throw _e;}}catch(e){showToast(t('popup.error')+': '+e.message);}
}

async function saveAllThresholds(){
  const apis=window._apisList||[];
  const btn=document.querySelector('[onclick="saveAllThresholds()"]');
  if(btn){btn.disabled=true;btn.textContent=t('pricingPage.saving');}
  try{
    for(const api of apis){
      const balance=parseFloat(document.getElementById('bal_'+api.id)?.value)||0;
      const threshold=parseFloat(document.getElementById('thr_'+api.id)?.value)||5;
      const rechargeAt=parseFloat(document.getElementById('rat_'+api.id)?.value)||5;
      const _orig=(window._apiLoaded||{})[api.id];
      const _row={service_name:api.id,alert_threshold:threshold,recharge_at:rechargeAt,status:balance===0?'unknown':balance<threshold?'low':'healthy'};
      if(_orig===undefined||Math.abs(balance-_orig)>0.000001)_row.current_balance=balance; // edited -> becomes new starting point (DB trigger)
      {const{error:_e}=await sb.from('api_credits').upsert(_row,{onConflict:'service_name'});if(_e)throw _e;}
    }
    showToast(t('toast.thresholdsSaved'));await loadApiCredits();
  }catch(e){showToast(t('popup.error')+': '+e.message);}
  finally{if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-device-floppy"></i> Save Thresholds';}}
}

// Fix 318: record a top-up -> adds to the (computed) balance, stamps the date, resets the field to 0
async function recordApiTopup(id){
  const inp=document.getElementById('top_'+id);
  const amt=parseFloat(inp?.value);
  if(!(amt>0)){showToast(t('apiCreditsLabel.enterTopup','Enter the top-up amount first'));return;}
  if(!confirm(t('apiCreditsLabel.confirmTopup','Record a top-up of')+' $'+amt.toFixed(2)+' — '+id+'?'))return;
  try{
    const{data,error}=await sb.rpc('record_api_topup',{p_service:id,p_amount:amt});
    if(error)throw error;
    if(inp)inp.value='0';
    showToast(t('apiCreditsLabel.topupSaved','Top-up recorded')+' · $'+(parseFloat(data&&data.balance)||0).toFixed(2));
    await loadApiCredits();
  }catch(e){showToast(t('popup.error')+': '+e.message);}
}

function showUpgradePopup(){ showPricing(); }

function openSubscribeModal(plan,planLabel){
  const _pk={presence:'plan.aiPresence',operations:'plan.aiOperations',workforce:'plan.aiWorkforce'};if(_pk[plan])planLabel=t(_pk[plan],planLabel);
  const html=`<div style="padding:4px 0;">
    <p style="color:var(--muted);font-size:.85rem;margin-bottom:16px;">${t('ui.bill.chooseCycle').replace('{plan}',planLabel)}</p>
    <button class="act-btn" style="width:100%;margin-bottom:8px;background:#003087;" onclick="startSubscription('${plan}','monthly')">${t('ui.bill.monthlyPaypal')}</button>
    <button class="act-btn" style="width:100%;background:linear-gradient(135deg,#1a7f37,#3fb950);" onclick="startSubscription('${plan}','annual')">${t('ui.bill.annualPaypal').replace('{pct}',annualDiscountPct()??15)}</button>
    <p style="color:var(--muted);font-size:.68rem;margin-top:10px;text-align:center;">${t('ui.bill.redirectPaypal')}</p>
  </div>`;
  showModal(t('ui.bill.subscribeTo').replace('{plan}',planLabel),html);
}
async function startSubscription(plan,cycle){
  const btn=event.target;
  btn.disabled=true;btn.textContent=t('pricingPage.processing');
  try{
    const res=await fetch(API_URL+'/api/paypal/create-subscription',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({plan,cycle})
    });
    const data=await res.json();
    if(data.checkout_url){
      window.location.href=data.checkout_url;
    } else {
      alert(t('popup.subscriptionError')+': '+(data.error||t('popup.unknownError')));
      btn.disabled=false;btn.textContent=cycle==='monthly'?t('ui.bill.monthly'):t('ui.bill.annual15').replace('{pct}',annualDiscountPct()??15);
    }
  }catch(e){
    alert(t('popup.connectionError'));
    btn.disabled=false;btn.textContent=cycle==='monthly'?t('ui.bill.monthly'):t('ui.bill.annual15').replace('{pct}',annualDiscountPct()??15);
  }
}
// Phase 4: plan cards rendered from the catalogue (public plans only). Numbers come from the DB;
// the non-numeric feature lines are the existing claims per plan. Posts/day is not shown until the
// posting counter is enforced (Phase 5). Team Hub is shown as "coming soon" when flagged.
const PLAN_STYLE={
  presence:{i18n:'plan.aiPresence',label:'AI Presence',color:'var(--nes-blue)',border:'',btn:''},
  operations:{i18n:'plan.aiOperations',label:'AI Operations',color:'var(--nes-blue)',border:'var(--nes-blue)',btn:'',popular:true},
  workforce:{i18n:'plan.aiWorkforce',label:'AI Workforce',color:'#3fb950',border:'#3fb950',btn:'linear-gradient(135deg,#1a7f37,#3fb950)'},
  infrastructure:{i18n:'plan.aiInfrastructure',label:'AI Infrastructure',color:'#d29922',border:'#d29922',btn:'linear-gradient(135deg,#92610a,#d29922)'}
};
const PLAN_FEATURE_KEYS={
  presence:['ui.bill.fChatbot','ui.bill.fLeadCapture','ui.bill.fEmailNotif'],
  operations:['ui.bill.fCeoPulse','ui.bill.fWaAlerts','ui.bill.fCrm','ui.bill.fPriority'],
  workforce:['ui.bill.fLayla','ui.bill.fWaSupport'],
  infrastructure:['ui.bill.fCustomAllow','ui.bill.fApexContract','ui.bill.fWhiteLabel','ui.bill.fCustomAgents','ui.bill.fAccountMgr']
};
const PLAN_EVERYTHING_IN={operations:'plan.aiPresence',workforce:'plan.aiOperations'};
const OMR_PER_USD=0.385;
function renderPlanCards(){
  const c=window.NES_CATALOGUE;
  const plans=(c&&Array.isArray(c.plans))?c.plans:[];
  if(!plans.length)return `<div style="grid-column:1/-1;text-align:center;color:var(--muted);font-size:.85rem;padding:24px;">${t('ui.bill.packsUnavailable')}</div>`;
  const li=(html,muted)=>`<li><i class="ti ${muted?'ti-clock':'ti-check'}" style="color:${muted?'var(--muted)':'#3fb950'};font-size:13px;flex-shrink:0"></i>${html}</li>`;
  const num=n=>(Number(n)).toLocaleString(getDateLocale('en-GB'));
  return plans.map(p=>{
    const st=PLAN_STYLE[p.plan]||{i18n:'',label:(p.display_name&&p.display_name.en)||p.plan,color:'var(--nes-blue)',border:'',btn:''};
    const label=st.i18n?t(st.i18n,st.label):st.label;
    const price=p.price_omr!=null?parseFloat(p.price_omr):null;
    const custom=price==null;
    const eur=(window.clientCurrency==='EUR'&&p.price_eur!=null)?parseFloat(p.price_eur):null;
    const f=[];
    if(!custom){
    if(PLAN_EVERYTHING_IN[p.plan])f.push(li(t('ui.bill.everythingIn').replace('{plan}',t(PLAN_EVERYTHING_IN[p.plan]))));
    if(Number(p.daily_ai_messages)>0)f.push(li(t('ui.bill.aiMsgsDay').replace('{n}',num(p.daily_ai_messages))));
    if(Number(p.sara_minutes_per_month)>0)f.push(li(`<b style="color:${st.color};">Sara AI — ${t('ui.bill.minsMo').replace('{n}',num(p.sara_minutes_per_month))}</b>`));
    if(Number(p.team_user_limit)>0)f.push(li(t('ui.bill.teamUsers').replace('{n}',num(p.team_user_limit))));
    }
    (PLAN_FEATURE_KEYS[p.plan]||[]).forEach(k=>f.push(li(t(k))));
    if(p.plan==='presence')f.push(li('Deen NES AI — '+t('ui.bill.freeGlobally')));
    if(!custom&&p.features&&p.features.team_hub==='coming_soon')f.push(li(t('ui.bill.teamHubSoon'),true));
    if(!custom)f.push(li(t('ui.bill.fTrial7').replace('{n}',trialDefaultDays())));
    const priceHtml=custom
      ?`<div class="plan-price" style="color:${st.color};">${t('ui.bill.custom')}</div><div class="plan-period">&nbsp;</div>`
      :`<div class="plan-price"${st.border&&p.plan!=='operations'?` style="color:${st.color};"`:''}${eur!=null?' data-local-set="1"':''}>OMR ${price}</div>`
        +(eur!=null?`<div style="font-family:var(--mono);font-size:.7rem;color:var(--muted);margin-top:2px;">EUR ${eur}</div>`:'')
        +`<div class="plan-period">${t('ui.bill.perMonthUsd').replace('{usd}','$'+Math.round(price/OMR_PER_USD))}</div>`;
    const btn=custom
      ?`<button class="plan-action-btn" style="background:${st.btn||'var(--nes-btn-grad)'};" onclick="window.open('https://nes-ai.com/register.html?plan=${encodeURIComponent(p.plan)}','_blank')">${t('pricingCta.contactUs')}</button>`
      :`<button class="plan-action-btn"${st.btn?` style="background:${st.btn};"`:''} onclick="openSubscribeModal('${esc(p.plan)}','${esc(st.label)}')">${t('ui.bill.subscribePaypal')}</button>`;
    return `<div class="plan-card"${st.border?` style="border-color:${st.border};position:relative;"`:''}>
      ${st.popular?`<div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--nes-btn-grad);color:#fff;font-size:.65rem;font-weight:700;padding:3px 12px;border-radius:20px;font-family:'Syne',sans-serif;">${t('pricingPage.popular')}</div>`:''}
      <div style="font-family:'Syne',sans-serif;font-size:.65rem;color:${st.color};text-transform:uppercase;letter-spacing:.1em;text-align:center;margin-bottom:4px;">${label}</div>
      ${priceHtml}
      <ul class="plan-features-list">${f.join('')}</ul>
      ${custom?`<div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);margin-bottom:8px;padding:6px 8px;background:rgba(210,153,34,.08);border-radius:6px;">${t('ui.bill.tailored')}</div>`:''}
      ${btn}
    </div>`;
  }).join('');
}
// Trial caps line, from the catalogue only; hidden if the catalogue does not send them (no unverified claim).
function trialCapsLine(){
  const c=window.NES_CATALOGUE;const p=(c&&Array.isArray(c.plans)?c.plans:[]).find(x=>x.trial_daily_ai_messages!=null&&x.trial_daily_sara_minutes!=null)||(c&&c.current_plan);
  if(!p||p.trial_daily_ai_messages==null||p.trial_daily_sara_minutes==null)return '';
  return `<div style="text-align:center;margin:-10px 0 16px;font-family:var(--mono);font-size:.68rem;color:var(--muted);">${t('ui.bill.trialCaps').replace('{m}',Number(p.trial_daily_ai_messages)).replace('{s}',Number(p.trial_daily_sara_minutes))}</div>`;
}
function showPricing(){
  const mc=document.getElementById('mainContent');
  mc.style.overflow='auto';
  mc.innerHTML=`
    <div class="pricing-wrap">
      <a href="#" onclick="showView('chat');return false;" style="color:var(--nes-blue);text-decoration:none;display:inline-block;margin-bottom:22px;font-family:var(--mono);font-size:.8rem;">← ${t('common.back','Back')}</a>
      <div style="text-align:center;margin-bottom:8px;"><h1 style="font-size:1.7rem;font-weight:700;font-family:'Syne',sans-serif;">${t('pricingPage.chooseYourPlan')}</h1></div>
      <div style="text-align:center;margin-bottom:6px;font-family:var(--mono);font-size:.75rem;color:var(--muted);">${t('ui.bill.header')}</div>
      <div style="text-align:center;margin-bottom:16px;font-family:var(--mono);font-size:.68rem;color:var(--muted);">${t('ui.bill.trialCancel').replace('{n}',trialDefaultDays())}</div>
      ${trialCapsLine()}
      <div id="customQuoteCard"></div>

      <div class="plan-grid">${renderPlanCards()}</div>

      ${annualDiscountPct()!=null?`<div style="text-align:center;margin-top:16px;font-family:var(--mono);font-size:.68rem;color:var(--muted);">${t('ui.bill.annualNote').replace('{pct}',annualDiscountPct())}</div>`:''}
        <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:16px;">${t('ui.bill.apexSuite')}</div>
        <div class="ph-tiers" style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;max-width:480px;margin:0 auto;">
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <i class="ti ti-headset" style="font-size:24px;color:#7f77dd;display:block;margin-bottom:8px;"></i>
            <div style="font-weight:700;margin-bottom:4px;">Apex Outreach</div>
            <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);margin-bottom:8px;">${t('ui.bill.apexOutreachDesc')}</div>
            <div style="font-size:1.1rem;font-weight:700;color:#7f77dd;">+OMR 15${t('ui.bill.perMo')}</div>
          </div>
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <i class="ti ti-phone-call" style="font-size:24px;color:#f0883e;display:block;margin-bottom:8px;"></i>
            <div style="font-weight:700;margin-bottom:4px;">Apex Advisory</div>
            <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);margin-bottom:8px;">${t('ui.bill.apexAdvisoryDesc')}</div>
            <div style="font-size:1.1rem;font-weight:700;color:#f0883e;">+OMR 40${t('ui.bill.perMo')}</div>
          </div>
        </div>
      </div>

      <div style="text-align:center;margin-top:28px;font-family:var(--mono);font-size:.72rem;color:var(--muted);">
        ${t('ui.bill.pricesNote')}<br>
        <a href="mailto:office@essential-services.org" style="color:var(--nes-blue);text-decoration:none;">office@essential-services.org</a>
      </div>
    </div>`;
  addLocalCurrencyToPricing();
  if(typeof loadCustomQuoteCard==='function')loadCustomQuoteCard();
}

// Purely additive: for non-Oman clients, appends a small local-currency equivalent
// under each OMR price. Never modifies the existing OMR/USD text. No-ops silently
// on any error or for OMR clients, so it can never break pricing display.
async function addLocalCurrencyToPricing(){
  try{
    if(!window.clientCurrency || window.clientCurrency==='OMR') return;
    const {data:rates} = await sb.from('currency_rates').select('currency_code,rate_to_omr');
    if(!rates) return;
    const rateRow = rates.find(r=>r.currency_code===window.clientCurrency);
    if(!rateRow) return;
    document.querySelectorAll('.plan-price').forEach(el=>{
      if(el.dataset.localSet) return;
      const match = el.textContent.match(/OMR\s*([\d.]+)/);
      if(!match) return;
      const omr = parseFloat(match[1]);
      const converted = (omr*rateRow.rate_to_omr).toFixed(2);
      const note=document.createElement('div');
      note.style.cssText='font-family:var(--mono);font-size:.65rem;color:var(--muted);margin-top:2px;';
      note.textContent=`≈ ${window.clientCurrency} ${converted}`;
      el.insertAdjacentElement('afterend', note);
    });
  }catch(e){ console.error('addLocalCurrencyToPricing error:', e.message); }
}

async function payWithPayPal(amountOMR,description,metadata){
  const btn=event.target;
  btn.disabled=true;btn.textContent=t('pricingPage.processing');
  const totalOMR=Math.round(amountOMR*1.05*1000)/1000;
  const amountUSD=Math.round((totalOMR/0.385)*100)/100;
  try{
    const res=await fetch(API_URL+'/api/paypal/create-order',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({amount:amountUSD,currency:'USD',description,metadata})
    });
    const data=await res.json();
    if(data.checkout_url){
      window.location.href=data.checkout_url;
    } else {
      alert(t('popup.paymentError')+': '+(data.error||t('popup.unknownError')));
      btn.disabled=false;btn.textContent='PayPal';
    }
  }catch(e){
    alert(t('popup.connectionError'));
    btn.disabled=false;btn.textContent='PayPal';
  }
}
// Phase 4: top-up packs come from the catalogue (public plan_addons). Labels by position.
const PACK_LABEL_KEYS=['pricingPage.starterBundle','pricingPage.standardBundle','pricingPage.powerBundle'];
function packsFor(kind,qtyField){
  return cataloguePacks(kind).map((a,i)=>({[qtyField]:a.q,p:a.p,label:t(PACK_LABEL_KEYS[Math.min(i,2)])}));
}
function packsUnavailableHtml(){return `<p style="color:var(--muted);font-size:.85rem;">${t('ui.bill.packsUnavailable')}</p>`;}
function openVoiceTopupModal(){
  const packs=packsFor('sara_minutes','min');
  const packsHtml=packs.map(pk=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;">
    <div><div style="font-weight:700;font-size:.85rem;">${pk.label}</div><div style="font-size:.75rem;color:var(--muted);">${pk.min} ${t('topup.minutes')} · ${t('topup.neverExpire')}</div><div style="font-size:.7rem;color:var(--muted);">OMR ${pk.p} + 5% VAT = OMR ${(pk.p*1.05).toFixed(3)}</div></div>
    <button class="act-btn" onclick="buyVoiceTopup(${pk.min},${pk.p},'${pk.label}')">${t('topup.buyNow')}</button>
    <button class="act-btn" style="margin-inline-start:6px;background:#003087;" onclick="payWithPayPal(${pk.p},'Sara Top-up ${pk.min}min',{type:'voice_topup',minutes:${pk.min}})">PayPal</button>
  </div>`).join('');
  const html=`<div style="padding:4px 0;">
    <p style="color:var(--muted);font-size:.85rem;margin-bottom:14px;">${t('topup.saraIntro')}</p>
    ${packsHtml||packsUnavailableHtml()}
    <p style="color:var(--muted);font-size:.75rem;margin-top:10px;">${t('topup.payNoteMinutes')}</p>
  </div>`;
  showModal(t('pricingPage.saraVoiceTopup'),html);
}

async function buyVoiceTopup(minutes,price,label){
  const btn=event.target;
  btn.disabled=true;btn.textContent=t('pricingPage.processing');
  const vatAmount=Math.round(price*0.05*100)/100;
  const totalAmount=Math.round((price+vatAmount)*100)/100;
  try{
    const res=await fetch(API_URL+'/api/thawani/create-session',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({
        amount:totalAmount,
        clientName:document.getElementById('userEmail')?.textContent||'Client',
        clientId:userClientId,
        description:`Sara Top-up ${minutes}min`,
        metadata:{type:'voice_topup',minutes,clientId:userClientId}
      })
    });
    const data=await res.json();
    if(data.checkout_url){
      window.location.href=data.checkout_url;
    } else {
      alert(t('popup.paymentError')+': '+(data.error||t('popup.unknownError')));
      btn.disabled=false;btn.textContent=t('topup.buyNow');
    }
  }catch(e){
    alert(t('popup.connectionError'));
    btn.disabled=false;btn.textContent=t('topup.buyNow');
  }
}

// Adam minute top-ups are purchasable; clients on Apex Advisory ask NES first, then buy (backend packs + credit path wired for minutes).
const ADAM_TOPUP_LIVE=true;
function openAdamTopupModal(){
  const packs=packsFor('sara_minutes','min');
  const packsHtml=packs.map(pk=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;">
    <div><div style="font-weight:700;font-size:.85rem;">${pk.label}</div><div style="font-size:.75rem;color:var(--muted);">${pk.min} ${t('topup.minutes')} · ${t('topup.neverExpire')}</div><div style="font-size:.7rem;color:var(--muted);">OMR ${pk.p} + 5% VAT = OMR ${(pk.p*1.05).toFixed(3)}</div></div>
    ${ADAM_TOPUP_LIVE?`<button class="act-btn" onclick="buyAdamTopup(${pk.min},${pk.p},'${pk.label}')">${t('topup.buyNow')}</button>
    <button class="act-btn" style="margin-inline-start:6px;background:#003087;" onclick="payWithPayPal(${pk.p},'Adam Top-up ${pk.min}min',{type:'adam_topup',minutes:${pk.min}})">PayPal</button>`:`<span style="font-size:.75rem;color:var(--muted);">${t('ui.mail.comingSoon')}</span>`}
  </div>`).join('');
  const html=`<div style="padding:4px 0;">
    <p style="color:var(--muted);font-size:.85rem;margin-bottom:14px;">${t('topup.adamIntro').replace('{n}',catalogueSetting('adam_minutes_per_month')??'')}</p>
    ${packsHtml||packsUnavailableHtml()}
    <p style="color:var(--muted);font-size:.75rem;margin-top:10px;">${t('topup.payNoteMinutes')}</p>
  </div>`;
  showModal(t('topup.adamTitle'),html);
}

async function buyAdamTopup(minutes,price,label){
  const btn=event.target;
  btn.disabled=true;btn.textContent=t('pricingPage.processing');
  const vatAmount=Math.round(price*0.05*100)/100;
  const totalAmount=Math.round((price+vatAmount)*100)/100;
  try{
    const res=await fetch(API_URL+'/api/thawani/create-session',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({
        amount:totalAmount,
        clientName:document.getElementById('userEmail')?.textContent||'Client',
        clientId:userClientId,
        description:`Adam Top-up ${minutes} min`,
        metadata:{type:'adam_topup',minutes,clientId:userClientId}
      })
    });
    const data=await res.json();
    if(data.checkout_url){
      window.location.href=data.checkout_url;
    } else {
      alert(t('popup.paymentError')+': '+(data.error||t('popup.unknownError')));
      btn.disabled=false;btn.textContent=t('topup.buyNow');
    }
  }catch(e){
    alert(t('popup.connectionError'));
    btn.disabled=false;btn.textContent=t('topup.buyNow');
  }
}

function openBriefcaseTopupModal(){
  const packs=packsFor('storage_gb','gb');
  const packsHtml=packs.map(pk=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;">
    <div><div style="font-weight:700;font-size:.85rem;">${pk.label}</div><div style="font-size:.75rem;color:var(--muted);">${pk.gb}GB ${t('topup.extraStorage')}</div><div style="font-size:.7rem;color:var(--muted);">OMR ${pk.p} + 5% VAT = OMR ${(pk.p*1.05).toFixed(3)}/mo</div></div>
    <button class="act-btn" onclick="buyBriefcaseTopup(${pk.gb},${pk.p},'${pk.label}')">${t('topup.buyNow')}</button>
    <button class="act-btn" style="margin-inline-start:6px;background:#003087;" onclick="payWithPayPal(${pk.p},'Briefcase Top-up ${pk.gb}GB',{type:'storage_topup',gb:${pk.gb}})">PayPal</button>
  </div>`).join('');
  const html=`<div style="padding:4px 0;">
    <p style="color:var(--muted);font-size:.85rem;margin-bottom:14px;">${t('topup.storageIntro')}</p>
    ${packsHtml||packsUnavailableHtml()}
    <p style="color:var(--muted);font-size:.75rem;margin-top:10px;">${t('topup.payNoteStorage')}</p>
  </div>`;
  showModal(t('topup.storageTitle'),html);
}

async function buyBriefcaseTopup(gb,price,label){
  const btn=event.target;
  btn.disabled=true;btn.textContent=t('pricingPage.processing');
  const vatAmount=Math.round(price*0.05*100)/100;
  const totalAmount=Math.round((price+vatAmount)*100)/100;
  try{
    const res=await fetch(API_URL+'/api/thawani/create-session',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({
        amount:totalAmount,
        clientName:document.getElementById('userEmail')?.textContent||'Client',
        clientId:userClientId,
        description:`Briefcase Top-up ${gb}GB`,
        metadata:{type:'storage_topup',gb,clientId:userClientId}
      })
    });
    const data=await res.json();
    if(data.checkout_url){
      window.location.href=data.checkout_url;
    } else {
      alert(t('popup.paymentError')+': '+(data.error||t('popup.unknownError')));
      btn.disabled=false;btn.textContent=t('topup.buyNow');
    }
  }catch(e){
    alert(t('popup.connectionError'));
    btn.disabled=false;btn.textContent=t('topup.buyNow');
  }
}

function openCreditsModal(){
  const packs=packsFor('image_credits','n');
  const packsHtml=packs.map(pk=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;">
    <div><div style="font-weight:700;font-size:.85rem;">${pk.label}</div><div style="font-size:.75rem;color:var(--muted);">${pk.n} ${t('topup.credits')} · ${t('topup.neverExpire')}</div><div style="font-size:.7rem;color:var(--muted);">OMR ${pk.p} + 5% VAT = OMR ${(pk.p*1.05).toFixed(3)}</div></div>
    <button class="act-btn" onclick="buyImageCredits(${pk.n},${pk.p},'${pk.label}')">${t('topup.buyNow')}</button>
    <button class="act-btn" style="margin-inline-start:6px;background:#003087;" onclick="payWithPayPal(${pk.p},'Image Credits ${pk.n}cr',{type:'image_credits',credits:${pk.n}})">PayPal</button>
  </div>`).join('');
  const trialEnded=imageCredits.freeAllowanceActive===false;
  const statusHtml=trialEnded
    ? `<p style="font-size:.8rem;margin-bottom:14px;color:#f85149;"><b>${t('topup.trialEnded')}</b> ${imageCredits.balance>0?`${t('topup.youHave')} <b>${imageCredits.balance}</b> ${t('topup.creditsRemaining')}`:t('topup.topUpBelow')}</p>`
    : `<p style="font-size:.8rem;margin-bottom:14px;">${t('topup.youHave')} <b>${imageCredits.dailyFreeRemaining}</b> ${t('topup.freeImagesLeft')}${imageCredits.balance>0?` ${t('topup.and')} <b>${imageCredits.balance}</b> ${t('topup.creditsInBalance')}`:''}.</p>`;
  const html=`<div style="padding:4px 0;">
    <p style="color:var(--muted);font-size:.85rem;margin-bottom:14px;">${t('topup.imageIntro')}</p>
    ${statusHtml}
    ${packsHtml||packsUnavailableHtml()}
    <p style="color:var(--muted);font-size:.75rem;margin-top:10px;">${t('topup.payNoteCredits')}</p>
  </div>`;
  showModal(t('topup.imageTitle'),html);
}

async function buyImageCredits(credits,price,label){
  const btn=event.target;
  btn.disabled=true;btn.textContent=t('pricingPage.processing');
  const vatAmount=Math.round(price*0.05*100)/100;
  const totalAmount=Math.round((price+vatAmount)*100)/100;
  try{
    const res=await fetch(API_URL+'/api/thawani/create-session',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({
        amount:totalAmount,
        clientName:document.getElementById('userEmail')?.textContent||'Client',
        clientId:userClientId,
        description:`Image Credits ${credits}cr`,
        metadata:{type:'image_credits',credits,clientId:userClientId}
      })
    });
    const data=await res.json();
    if(data.checkout_url){
      window.location.href=data.checkout_url;
    } else {
      alert(t('popup.paymentError')+': '+(data.error||t('popup.unknownError')));
      btn.disabled=false;btn.textContent=t('topup.buyNow');
    }
  }catch(e){
    alert(t('popup.connectionError'));
    btn.disabled=false;btn.textContent=t('topup.buyNow');
  }
}
