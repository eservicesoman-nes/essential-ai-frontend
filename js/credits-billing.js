// credits-billing.js — extracted from index.html, NES Locale Phase 0
// 16 functions, zero logic changes

async function showApiCredits(){
  if(userRole!=='nesadmin')return;
  const mc=document.getElementById('mainContent');
  mc.style.overflow='auto';
  mc.innerHTML=`
    <div style="padding:11px 204px 11px 60px;border-bottom:1px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:space-between;" class="an-hdr">
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
  ];
  let thresholds={};
  try{const{data}=await sb.from('api_credits').select('*');if(data)data.forEach(r=>{thresholds[r.service_name?.toLowerCase().replace(/[^a-z]/g,'')]=r;});}catch(e){}
  const alertCount=Object.values(thresholds).filter(t=>t.status==='low'||t.status==='critical').length;
  let html='';
  if(alertCount>0){html+=`<div style="background:rgba(248,81,73,.1);border:1px solid rgba(248,81,73,.3);border-radius:8px;padding:10px 14px;margin-bottom:16px;display:flex;align-items:center;gap:8px;font-size:.78rem;font-weight:600;color:#f85149;"><i class="ti ti-alert-triangle" style="font-size:16px;"></i>${alertCount} API${alertCount>1?'s':''} below threshold</div>`;}
  html+=`<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;">
    <div style="background:var(--surface);border-radius:8px;padding:12px;border:1px solid var(--border);"><div style="font-size:.7rem;color:var(--muted);margin-bottom:4px;font-family:var(--mono);">${t('apiCreditsLabel.apisMonitored')}</div><div style="font-size:1.4rem;font-weight:700;color:var(--text);">${apis.length}</div></div>
    <div style="background:var(--surface);border-radius:8px;padding:12px;border:1px solid var(--border);"><div style="font-size:.7rem;color:var(--muted);margin-bottom:4px;font-family:var(--mono);">${t('apiCreditsLabel.alertsActive')}</div><div style="font-size:1.4rem;font-weight:700;color:${alertCount>0?'#f85149':'#3fb950'};">${alertCount}</div></div>
    <div style="background:var(--surface);border-radius:8px;padding:12px;border:1px solid var(--border);"><div style="font-size:.7rem;color:var(--muted);margin-bottom:4px;font-family:var(--mono);">${t('apiCreditsLabel.autoRecharge')}</div><div style="font-size:1.4rem;font-weight:700;color:#7f77dd;">${Object.values(thresholds).filter(t=>t.recharge_amount>0).length}</div></div>
    <div style="background:var(--surface);border-radius:8px;padding:12px;border:1px solid var(--border);"><div style="font-size:.7rem;color:var(--muted);margin-bottom:4px;font-family:var(--mono);">${t('apiCreditsLabel.estMonthly')}</div><div style="font-size:1.4rem;font-weight:700;color:var(--nes-blue);">~$25</div></div>
  </div>`;
  html+=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;">API Credit Status</div><div style="display:flex;gap:8px;"><button onclick="saveAllThresholds()" style="background:var(--nes-btn-grad);border:none;border-radius:6px;padding:4px 12px;color:#fff;font-size:.72rem;font-weight:700;cursor:pointer;font-family:var(--mono);"><i class="ti ti-device-floppy"></i> Save Thresholds</button><button onclick="addApiService()" style="background:none;border:1px solid var(--border);border-radius:6px;padding:4px 10px;color:var(--muted);cursor:pointer;font-size:.72rem;font-family:var(--mono);"><i class="ti ti-plus"></i> Add API</button></div></div>`;
  html+=`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px;margin-bottom:20px;">`;
  apis.forEach(function(api){
    const th=thresholds[api.id]||{};
    const balance=th.current_balance||0;const threshold=th.alert_threshold||5;const rechargeAt=th.recharge_at||5;const rechargeAmt=th.recharge_amount||20;const usage=th.monthly_usage||0;
    const status=balance===0?'unknown':balance<threshold?'low':'healthy';
    const statusColor=status==='healthy'?'#3fb950':status==='low'?'#f85149':'#d29922';
    const statusBg=status==='healthy'?'#0d2818':status==='low'?'#2d0e0e':'#2d1f00';
    const pct=balance+usage>0?Math.round((usage/(balance+usage))*100):0;
    const barColor=pct>80?'#f85149':pct>60?'#d29922':'#409cff';
    html+=`<div style="background:var(--surface);border:1px solid ${status==='low'?'rgba(248,81,73,.3)':'var(--border)'};border-radius:12px;padding:14px 16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;"><div style="display:flex;align-items:center;gap:8px;"><i class="ti ${api.icon}" style="font-size:16px;color:${api.color};"></i><span style="font-size:.82rem;font-weight:600;color:var(--text);">${api.name}</span></div><span style="font-size:.65rem;padding:2px 8px;border-radius:20px;font-weight:600;background:${statusBg};color:${statusColor};">${status==='unknown'?t('pricingPage.notSet'):status==='healthy'?t('pricingPage.healthy'):t('pricingPage.low')}</span></div>
      <div style="font-size:.68rem;color:var(--muted);font-family:var(--mono);margin-bottom:10px;">${api.note}</div>
      <div style="font-size:1.5rem;font-weight:700;color:${status==='low'?'#f85149':'var(--text)'};margin-bottom:3px;">${balance===0?'—':'$'+balance.toFixed(2)}</div>
      <div style="font-size:.68rem;color:var(--muted);font-family:var(--mono);margin-bottom:10px;">${t('apiCreditsLabel.currentBalance')}</div>
      <div style="display:flex;justify-content:space-between;font-size:.65rem;color:var(--muted);font-family:var(--mono);margin-bottom:4px;"><span>${t('apiCreditsLabel.usedThisMonth')}</span><span>$${usage.toFixed(2)}</span></div>
      <div style="height:4px;background:var(--border);border-radius:4px;overflow:hidden;margin-bottom:10px;"><div style="height:100%;width:${pct}%;background:${barColor};border-radius:4px;"></div></div>
      <div style="border-top:1px solid var(--border);padding-top:10px;display:flex;align-items:center;justify-content:space-between;"><span style="font-size:.65rem;color:var(--muted);">Balance $</span><input id="bal_${api.id}" type="number" value="${balance}" step="0.01" min="0" style="background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:3px 7px;color:var(--text);font-family:var(--mono);font-size:.7rem;width:80px;text-align:right;"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;"><span style="font-size:.65rem;color:var(--muted);">Alert at $</span><input id="thr_${api.id}" type="number" value="${threshold}" min="0" style="background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:3px 7px;color:var(--text);font-family:var(--mono);font-size:.7rem;width:80px;text-align:right;"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;"><span style="font-size:.65rem;color:var(--muted);">Recharge at $</span><input id="rat_${api.id}" type="number" value="${rechargeAt}" min="0" style="background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:3px 7px;color:var(--text);font-family:var(--mono);font-size:.7rem;width:80px;text-align:right;"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;"><span style="font-size:.65rem;color:var(--muted);">Add $</span><input id="ram_${api.id}" type="number" value="${rechargeAmt}" min="0" style="background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:3px 7px;color:var(--text);font-family:var(--mono);font-size:.7rem;width:80px;text-align:right;"></div>
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
  try{await sb.from('api_credits').insert([{service_name:name,current_balance:balance,alert_threshold:threshold,notes,status:balance<threshold?'low':'healthy'}]);showToast(t('pricingPage.apiAdded'));document.getElementById('addApiForm').style.display='none';await loadApiCredits();}catch(e){showToast('Error: '+e.message);}
}

async function updateApiBalance(id,val){
  const balance=parseFloat(val)||0;const threshold=parseFloat(document.getElementById('thr_'+id)?.value)||5;
  try{await sb.from('api_credits').upsert({service_name:id,current_balance:balance,status:balance<threshold?'low':'healthy'},{onConflict:'service_name'});}catch(e){}
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
      const rechargeAmt=parseFloat(document.getElementById('ram_'+api.id)?.value)||20;
      await sb.from('api_credits').upsert({service_name:api.id,current_balance:balance,alert_threshold:threshold,recharge_at:rechargeAt,recharge_amount:rechargeAmt,status:balance===0?'unknown':balance<threshold?'low':'healthy'},{onConflict:'service_name'});
    }
    showToast(t('toast.thresholdsSaved'));await loadApiCredits();
  }catch(e){showToast('Error: '+e.message);}
  finally{if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-device-floppy"></i> Save Thresholds';}}
}

function showUpgradePopup(){ showPricing(); }

function showPricing(){
  const mc=document.getElementById('mainContent');
  mc.style.overflow='auto';
  mc.innerHTML=`
    <div class="pricing-wrap">
      <a href="#" onclick="showView('chat');return false;" style="color:var(--nes-blue);text-decoration:none;display:inline-block;margin-bottom:22px;font-family:var(--mono);font-size:.8rem;">← Back</a>
      <div style="text-align:center;margin-bottom:8px;"><h1 style="font-size:1.7rem;font-weight:700;font-family:'Syne',sans-serif;">${t('pricingPage.chooseYourPlan')}</h1></div>
      <div style="text-align:center;margin-bottom:6px;font-family:var(--mono);font-size:.75rem;color:var(--muted);">NES AI — Unified Business Platform · Oman Pricing</div>
      <div style="text-align:center;margin-bottom:16px;font-family:var(--mono);font-size:.68rem;color:var(--muted);">All plans include a 7-day trial · Cancel anytime</div>
      <div style="background:#0c1f3a;border:1px solid #1a3a5e;border-radius:10px;padding:11px 20px;display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
        <div><div style="font-family:'Syne',sans-serif;font-size:.78rem;color:var(--nes-blue);font-weight:700;">${t('pricingPage.founderPricingTitle')}</div><div style="font-size:.65rem;color:var(--muted);margin-top:2px;">${t('pricingPage.founderPricingDetail')}</div></div>
        <div style="font-family:var(--mono);font-size:.68rem;color:#3fb950;display:flex;align-items:center;gap:5px;"><div style="width:6px;height:6px;border-radius:50%;background:#3fb950;"></div>38 spots remaining</div>
      </div>

      <div class="plan-grid">

        <div class="plan-card">
          <div style="font-family:'Syne',sans-serif;font-size:.65rem;color:var(--nes-blue);text-transform:uppercase;letter-spacing:.1em;text-align:center;margin-bottom:4px;">${t('plan.aiPresence')}</div>
          <div style="text-align:center;font-size:.72rem;color:var(--red);text-decoration:line-through;font-family:var(--mono);margin-bottom:2px;">OMR 59/mo (~$153)</div>
          <div class="plan-price">OMR 29</div>
          <div class="plan-period">per month · ~$75 USD · founder price for first quarter</div>
          <ul class="plan-features-list">
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>150 AI messages/day</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>AI Chatbot (24/7)</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>Lead Capture + WhatsApp alerts</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i><b style="color:var(--nes-blue);">Sara AI — 30 calls/mo</b></li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>Email notifications</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>3 team users</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>Deen NES AI — free globally</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>7-day trial</li>
          </ul>
          <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);margin-bottom:8px;padding:6px 8px;background:var(--accent-lo);border-radius:6px;">
            + Apex Connect upgrade OMR 15/mo
          </div>
          <button class="plan-action-btn" onclick="window.open('https://nes-ai.com/register.html?plan=presence','_blank')">${t('pricingCta.getStarted')}</button>
        </div>

        <div class="plan-card" style="border-color:var(--nes-blue);position:relative;">
          <div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--nes-btn-grad);color:#fff;font-size:.65rem;font-weight:700;padding:3px 12px;border-radius:20px;font-family:'Syne',sans-serif;">${t('pricingPage.popular')}</div>
          <div style="font-family:'Syne',sans-serif;font-size:.65rem;color:var(--nes-blue);text-transform:uppercase;letter-spacing:.1em;text-align:center;margin-bottom:4px;">${t('plan.aiOperations')}</div>
          <div style="text-align:center;font-size:.72rem;color:var(--red);text-decoration:line-through;font-family:var(--mono);margin-bottom:2px;">OMR 159/mo (~$413)</div>
          <div class="plan-price">OMR 79</div>
          <div class="plan-period">per month · ~$205 USD · founder price for first quarter</div>
          <div style="font-family:var(--mono);font-size:.62rem;color:var(--muted);text-align:center;margin-bottom:4px;">Standard: OMR 159/mo after first quarter</div>
          <ul class="plan-features-list">
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>500 AI messages/day</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>Everything in AI Presence</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>CEO Dashboard + NES Pulse</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i><b style="color:var(--nes-blue);">Sara AI — 60 calls/mo</b></li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>Social Media — 3x/day</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>WhatsApp Alerts — leads + team</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>Sales Portal (CRM)</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>10 team users</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>Priority email support</li>
          </ul>
          <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);margin-bottom:8px;padding:6px 8px;background:var(--accent-lo);border-radius:6px;">
            + Apex Outreach OMR 15/mo
          </div>
          <button class="plan-action-btn" onclick="window.open('https://nes-ai.com/register.html?plan=operations','_blank')">${t('pricingCta.upgradeToOperations')}</button>
        </div>

        <div class="plan-card" style="border-color:#3fb950;position:relative;">
          <div style="font-family:'Syne',sans-serif;font-size:.65rem;color:#3fb950;text-transform:uppercase;letter-spacing:.1em;text-align:center;margin-bottom:4px;">${t('plan.aiWorkforce')}</div>
          <div style="text-align:center;font-size:.72rem;color:var(--red);text-decoration:line-through;font-family:var(--mono);margin-bottom:2px;">OMR 299/mo (~$777)</div>
          <div class="plan-price" style="color:#3fb950;">OMR 149</div>
          <div class="plan-period">per month · ~$387 USD · founder price for first quarter</div>
          <div style="font-family:var(--mono);font-size:.62rem;color:var(--muted);text-align:center;margin-bottom:4px;">Standard: OMR 299/mo after first quarter</div>
          <ul class="plan-features-list">
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>1,500 AI messages/day</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>Everything in AI Operations</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i><b style="color:#3fb950;">Sara AI — 150 calls/mo</b></li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>Apex Outreach — Layla AI</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>Social Media — 3x/day</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>25 team users</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>WhatsApp support</li>
          </ul>
          <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);margin-bottom:8px;padding:6px 8px;background:rgba(63,185,80,.08);border-radius:6px;">
            + Apex Advisory OMR 20/mo<br>+ Extra social posts OMR 8/mo
          </div>
          <button class="plan-action-btn" style="background:linear-gradient(135deg,#1a7f37,#3fb950);" onclick="window.open('https://nes-ai.com/register.html?plan=workforce','_blank')">${t('pricingCta.upgradeToWorkforce')}</button>
        </div>

        <div class="plan-card" style="border-color:#d29922;position:relative;">
          <div style="font-family:var(--mono);font-size:.65rem;color:#d29922;text-transform:uppercase;letter-spacing:.1em;text-align:center;margin-bottom:4px;">AI Infrastructure</div>
          <div class="plan-price" style="color:#d29922;">Custom</div>
          <div class="plan-period">OMR 599–1000+ / month</div>
          <ul class="plan-features-list">
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>Unlimited everything</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>Full Apex Suite included</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>Real-time alerts (2hrs)</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>Multiple social posts/day</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>White label branding</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>Custom AI agents</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>90 days lead history</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>SLA guarantee</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>Dedicated account manager</li>
            <li><i class="ti ti-check" style="color:#3fb950;font-size:13px;flex-shrink:0"></i>Custom integrations</li>
          </ul>
          <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);margin-bottom:8px;padding:6px 8px;background:rgba(210,153,34,.08);border-radius:6px;">
            Tailored to your requirements
          </div>
          <button class="plan-action-btn" style="background:linear-gradient(135deg,#92610a,#d29922);" onclick="window.open('https://nes-ai.com/register.html?plan=infrastructure','_blank')">${t('pricingCta.contactUs')}</button>
        </div>

      </div>

      <div style="text-align:center;margin-top:16px;font-family:var(--mono);font-size:.68rem;color:var(--muted);">Annual prepay available — 15% discount · Setup fee OMR 99 waived for first 50 clients</div>
        <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:16px;">Apex Suite — AI Voice Agents</div>
        <div class="ph-tiers" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:700px;margin:0 auto;">
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <i class="ti ti-phone" style="font-size:24px;color:#3fb950;display:block;margin-bottom:8px;"></i>
            <div style="font-weight:700;margin-bottom:4px;">Apex Connect</div>
            <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);margin-bottom:8px;">60-sec callback on every lead</div>
            <div style="font-size:1.1rem;font-weight:700;color:#3fb950;">+OMR 15/mo</div>
          </div>
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <i class="ti ti-headset" style="font-size:24px;color:#7f77dd;display:block;margin-bottom:8px;"></i>
            <div style="font-weight:700;margin-bottom:4px;">Apex Outreach</div>
            <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);margin-bottom:8px;">3-day follow-up re-engagement</div>
            <div style="font-size:1.1rem;font-weight:700;color:#7f77dd;">+OMR 15/mo</div>
          </div>
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;">
            <i class="ti ti-phone-call" style="font-size:24px;color:#f0883e;display:block;margin-bottom:8px;"></i>
            <div style="font-weight:700;margin-bottom:4px;">Apex Advisory</div>
            <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);margin-bottom:8px;">Enterprise voice consultant</div>
            <div style="font-size:1.1rem;font-weight:700;color:#f0883e;">+OMR 20/mo</div>
          </div>
        </div>
      </div>

      <div style="text-align:center;margin-top:28px;font-family:var(--mono);font-size:.72rem;color:var(--muted);">
        All prices in Omani Rial (OMR) · 1 USD ≈ 0.385 OMR · UAE/KSA/EU pricing available on request<br>
        <a href="mailto:office@essential-services.org" style="color:var(--nes-blue);text-decoration:none;">office@essential-services.org</a>
      </div>
    </div>`;
}

async function payWithPayPal(amountOMR,description){
  const btn=event.target;
  btn.disabled=true;btn.textContent=t('pricingPage.processing');
  const totalOMR=Math.round(amountOMR*1.05*1000)/1000;
  const amountUSD=Math.round((totalOMR/0.385)*100)/100;
  try{
    const res=await fetch(API_URL+'/api/paypal/create-order',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({amount:amountUSD,currency:'USD',description})
    });
    const data=await res.json();
    if(data.checkout_url){
      window.location.href=data.checkout_url;
    } else {
      alert('Payment error: '+(data.error||'Unknown error'));
      btn.disabled=false;btn.textContent='PayPal';
    }
  }catch(e){
    alert('Connection error. Please try again.');
    btn.disabled=false;btn.textContent='PayPal';
  }
}
function openVoiceTopupModal(){
  const packs=[
    {min:50,p:18,label:t('pricingPage.starterBundle')},
    {min:150,p:45,label:t('pricingPage.standardBundle')},
    {min:400,p:99,label:t('pricingPage.powerBundle')}
  ];
  const packsHtml=packs.map(pk=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;">
    <div><div style="font-weight:700;font-size:.85rem;">${pk.label}</div><div style="font-size:.75rem;color:var(--muted);">${pk.min} minutes · never expire</div><div style="font-size:.7rem;color:var(--muted);">OMR ${pk.p} + 5% VAT = OMR ${(pk.p*1.05).toFixed(3)}</div></div>
    <button class="act-btn" onclick="buyVoiceTopup(${pk.min},${pk.p},'${pk.label}')">Buy Now</button>
    <button class="act-btn" style="margin-left:6px;background:#003087;" onclick="payWithPayPal(${pk.p},'Sara Top-up ${pk.min}min')">PayPal</button>
  </div>`).join('');
  const html=`<div style="padding:4px 0;">
    <p style="color:var(--muted);font-size:.85rem;margin-bottom:14px;">Top up Sara's call allowance when your monthly limit runs low. Minutes are added instantly and never expire.</p>
    ${packsHtml}
    <p style="color:var(--muted);font-size:.75rem;margin-top:10px;">Payments processed securely via Thawani. Minutes added to your account automatically after payment.</p>
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
      alert('Payment error: '+(data.error||'Unknown error'));
      btn.disabled=false;btn.textContent='Buy Now';
    }
  }catch(e){
    alert('Connection error. Please try again.');
    btn.disabled=false;btn.textContent='Buy Now';
  }
}

function openAdamTopupModal(){
  const packs=[
    {credits:5,p:8,label:'Starter Bundle'},
    {credits:10,p:15,label:'Standard Bundle'},
    {credits:25,p:35,label:'Power Bundle'}
  ];
  const packsHtml=packs.map(pk=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;">
    <div><div style="font-weight:700;font-size:.85rem;">${pk.label}</div><div style="font-size:.75rem;color:var(--muted);">${pk.credits} consultations · never expire</div><div style="font-size:.7rem;color:var(--muted);">OMR ${pk.p} + 5% VAT = OMR ${(pk.p*1.05).toFixed(3)}</div></div>
    <button class="act-btn" onclick="buyAdamTopup(${pk.credits},${pk.p},'${pk.label}')">Buy Now</button>
    <button class="act-btn" style="margin-left:6px;background:#003087;" onclick="payWithPayPal(${pk.p},'Adam Top-up ${pk.credits} credits')">PayPal</button>
  </div>`).join('');
  const html=`<div style="padding:4px 0;">
    <p style="color:var(--muted);font-size:.85rem;margin-bottom:14px;">Top up Adam's consultation allowance when your monthly 20 included consultations run out. Credits are added instantly and never expire.</p>
    ${packsHtml}
    <p style="color:var(--muted);font-size:.75rem;margin-top:10px;">Payments processed securely via Thawani. Credits added to your account automatically after payment.</p>
  </div>`;
  showModal('Adam Consultation Top-up',html);
}

async function buyAdamTopup(credits,price,label){
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
        description:`Adam Top-up ${credits} credits`,
        metadata:{type:'adam_topup',credits,clientId:userClientId}
      })
    });
    const data=await res.json();
    if(data.checkout_url){
      window.location.href=data.checkout_url;
    } else {
      alert('Payment error: '+(data.error||'Unknown error'));
      btn.disabled=false;btn.textContent='Buy Now';
    }
  }catch(e){
    alert('Connection error. Please try again.');
    btn.disabled=false;btn.textContent='Buy Now';
  }
}

function openBriefcaseTopupModal(){
  const packs=[
    {gb:20,p:8,label:'Starter Bundle'},
    {gb:50,p:18,label:'Standard Bundle'},
    {gb:100,p:30,label:'Power Bundle'}
  ];
  const packsHtml=packs.map(pk=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;">
    <div><div style="font-weight:700;font-size:.85rem;">${pk.label}</div><div style="font-size:.75rem;color:var(--muted);">${pk.gb}GB extra storage</div><div style="font-size:.7rem;color:var(--muted);">OMR ${pk.p} + 5% VAT = OMR ${(pk.p*1.05).toFixed(3)}/mo</div></div>
    <button class="act-btn" onclick="buyBriefcaseTopup(${pk.gb},${pk.p},'${pk.label}')">Buy Now</button>
    <button class="act-btn" style="margin-left:6px;background:#003087;" onclick="payWithPayPal(${pk.p},'Briefcase Top-up ${pk.gb}GB')">PayPal</button>
  </div>`).join('');
  const html=`<div style="padding:4px 0;">
    <p style="color:var(--muted);font-size:.85rem;margin-bottom:14px;">Top up your Briefcase storage when your plan's free allowance runs low. Storage is added instantly.</p>
    ${packsHtml}
    <p style="color:var(--muted);font-size:.75rem;margin-top:10px;">Payments processed securely via Thawani. Storage added to your account automatically after payment.</p>
  </div>`;
  showModal('Briefcase Storage Top-up',html);
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
      alert('Payment error: '+(data.error||'Unknown error'));
      btn.disabled=false;btn.textContent='Buy Now';
    }
  }catch(e){
    alert('Connection error. Please try again.');
    btn.disabled=false;btn.textContent='Buy Now';
  }
}

function openCreditsModal(){
  const packs=[{n:50,p:5,label:'Starter'},{n:200,p:18,label:'Standard'},{n:500,p:40,label:'Value'}];
  const packsHtml=packs.map(pk=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;">
    <div><div style="font-weight:700;font-size:.85rem;">${pk.label}</div><div style="font-size:.75rem;color:var(--muted);">${pk.n} credits · never expire</div><div style="font-size:.7rem;color:var(--muted);">OMR ${pk.p} + 5% VAT = OMR ${(pk.p*1.05).toFixed(3)}</div></div>
    <button class="act-btn" onclick="buyImageCredits(${pk.n},${pk.p},'${pk.label}')">Buy Now</button>
    <button class="act-btn" style="margin-left:6px;background:#003087;" onclick="payWithPayPal(${pk.p},'Image Credits ${pk.n}cr')">PayPal</button>
  </div>`).join('');
  const trialEnded=imageCredits.freeAllowanceActive===false;
  const statusHtml=trialEnded
    ? `<p style="font-size:.8rem;margin-bottom:14px;color:#f85149;"><b>Your free trial has ended.</b> ${imageCredits.balance>0?`You have <b>${imageCredits.balance}</b> credits remaining in your balance.`:'Top up with a credit pack below to keep generating images.'}</p>`
    : `<p style="font-size:.8rem;margin-bottom:14px;">You currently have <b>${imageCredits.dailyFreeRemaining}</b> free images left today${imageCredits.balance>0?` and <b>${imageCredits.balance}</b> credits in your balance`:''}.</p>`;
  const html=`<div style="padding:4px 0;">
    <p style="color:var(--muted);font-size:.85rem;margin-bottom:14px;">Every plan includes 3 free images per day during your trial. Need more? Top up with a credit pack — each credit generates one extra image, and credits never expire.</p>
    ${statusHtml}
    ${packsHtml}
    <p style="color:var(--muted);font-size:.75rem;margin-top:10px;">Payments processed securely via Thawani. Credits added to your account automatically after payment.</p>
  </div>`;
  showModal('Image Credits',html);
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
      alert('Payment error: '+(data.error||'Unknown error'));
      btn.disabled=false;btn.textContent='Buy Now';
    }
  }catch(e){
    alert('Connection error. Please try again.');
    btn.disabled=false;btn.textContent='Buy Now';
  }
}
