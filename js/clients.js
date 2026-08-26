// clients.js — extracted from index.html, NES Locale Phase 0
// 31 functions, zero logic changes

async function onboardClient(clientId, clientName){
  const btn = document.getElementById('onboard-btn-'+clientId);
  if(btn){btn.disabled=true;btn.innerHTML='<i class="ti ti-loader-2 ti-spin" style="font-size:12px"></i> Onboarding...';}

  try{
    const{data:client,error:ce}=await sb.from('clients').select('*').eq('id',clientId).single();
    if(ce||!client)throw new Error('Client not found');

    const r_so=await fetch(API_URL+'/api/admin/update-client/'+clientId,{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},body:JSON.stringify({status:'active',trial_start:new Date().toISOString()})});
    if(!r_so.ok)throw new Error('Status update failed');

    let loginInfo='';
    if(!client.user_id){
      try{
        const loginRes=await fetch(`${API_URL}/api/clients/${clientId}/create-login`,{
          method:'POST',
          headers:{'Authorization':'Bearer '+session.access_token}
        });
        const loginData=await loginRes.json();
        if(loginRes.ok&&loginData.success){
          loginInfo=`\n\nLogin created: ${loginData.email} / ${loginData.temp_password}\n(Share this with the client and ask them to change it after first login.)`;
        }else{
          loginInfo=`\n\nNote: could not auto-create a login (${loginData.error||'unknown error'}). You may need to create one manually.`;
        }
      }catch(le){
        loginInfo='\n\nNote: could not auto-create a login (network error). You may need to create one manually.';
      }
    }

    const webhookUrl='https://n8n.essential-services.org/webhook/nes-client-onboard';
    const payload={
      client_id:clientId,
      client_name:clientName,
      plan:client.plan||'presence',
      industry:client.industry||'General Business',
      region:client.region||'Oman',
      email:client.email||'',
      language:client.language||'English',
      modules:client.modules||{},
      onboarded_at:new Date().toISOString()
    };

    try{
      await fetch(webhookUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    }catch(we){
      console.warn('n8n webhook failed (non-blocking):',we);
    }

    showToast(clientName+' onboarded successfully ✓');
    if(loginInfo){alert(clientName+' onboarded.'+loginInfo);}
    setTimeout(()=>showClientManager(),800);

  }catch(e){
    showToast('Onboarding failed: '+e.message);
    if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-rocket" style="font-size:12px"></i> Onboard';}
  }
}

function hideAdminCMTabs(){
  if(userRole !== 'nesadmin'){
    document.querySelectorAll('.cm-tab').forEach(tab => {
      const oc = tab.getAttribute('onclick') || '';
      if(oc.includes("'creds'") || oc.includes("'branding'") || oc.includes("'email'") || oc.includes("'users'")){
        tab.style.display='none';
      }
    });
  }
}

async function showClientManager(){
  if(userRole!=='nesadmin'){addAiMsg('Access denied.');return;}
  const mc=document.getElementById('mainContent');
  mc.style.overflow='hidden';
  mc.innerHTML=`
    <div style="padding-block:11px;padding-inline-end:var(--header-clearance);padding-inline-start:60px;border-bottom:1px solid var(--border);flex-shrink:0;">
      <div style="font-family:var(--mono);font-size:.8rem;color:var(--nes-blue);font-weight:800;">${t('sectionTitle.clientManager')}</div>
      <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);">${t('pageSubtitle.clientManager')}</div>
    </div>
    <div class="page" id="cmContent"><div style="text-align:center;padding:40px;color:var(--muted);font-family:var(--mono);font-size:.8rem;">${t('loading.clients')}</div></div>`;
  await loadClientsFromDB();
}

async function loadClientsFromDB(){
  try{
    const{data:clients,error}=await sb.from('clients').select('*').order('created_at',{ascending:false});
    if(error)throw error;
    window._clients=clients||[];
    renderClientManagerFull(clients||[],window._activeClientId||null);
    document.getElementById('clientCount').textContent=clients?.length||0;
  }catch(e){
    const el=document.getElementById('cmContent');
    if(el)el.innerHTML=`<div style="text-align:center;padding:40px;color:#f85149;font-family:var(--mono);">Error: ${e.message}</div>`;
  }
}

function renderClientManagerFull(clients,activeId=null){
  const active=clients.find(c=>c.id===activeId)||clients[0]||null;
  window._activeClientId=active?.id||null;
  setTimeout(()=>{
    if(window._activeTab&&window._activeTab!=='modules'){
      const tabEl=document.querySelector('.cm-tab[onclick*="\'' +window._activeTab+ '\'"]');
      if(tabEl){['modules','creds','branding','agents','billing','users'].forEach(t=>{const e=document.getElementById('cm-'+t);if(e)e.style.display=t===window._activeTab?'block':'none';});document.querySelectorAll('.cm-tab').forEach(t=>t.classList.remove('active'));tabEl.classList.add('active');if(window._activeTab==='users'&&window._activeClientId)loadClientUsers(window._activeClientId);if(window._activeTab==='billing'&&window._activeClientId)loadPaymentHistory(window._activeClientId);}
    }
  },50);
  const colors=['#1a3a6e','#2d1f00','#0d2818','#2d0e0e','#1a2332'];
  const textColors=['#409cff','#d29922','#3fb950','#f85149','#8b949e'];
  document.getElementById('cmContent').innerHTML=`
    <div style="margin-bottom:9px;">
      <input type="text" id="clientSearch" placeholder="${t('placeholder.searchClients')}" onkeyup="searchClients(this.value)"
        style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:7px;padding:7px 12px;color:var(--text);font-family:var(--mono);font-size:.78rem;outline:none;">
    </div>
    <div class="cm-layout">
      <div class="client-list" id="clientListEl">
        <div class="cl-header">
          <span>Clients (${clients.length})</span>
          <button class="cl-add-btn" onclick="showAddClientForm()">${t('clientListUi.addBtn')}</button>
        </div>
        ${clients.length===0
          ?`<div style="padding:18px 11px;text-align:center;color:var(--muted);font-family:var(--mono);font-size:.72rem;line-height:1.6;">${t('clientListUi.noClientsYet')}<br>Click <strong style="color:var(--nes-blue);">${t('clientListUi.addBtn')}</strong> ${t('clientListUi.clickToCreate')}</div>`
          :clients.map((c,i)=>`
          <div class="client-item ${c.id===active?.id?'active':''}" onclick="selectClientDB('${c.id}')">
            <div class="ci-av" style="background:${colors[i%5]};color:${textColors[i%5]};">${(c.name||'?').substring(0,2).toUpperCase()}</div>
            <div class="ci-name">${c.name}</div>
            <div class="ci-dot" style="background:${c.status==='active'?'#3fb950':'#d29922'}"></div>
          </div>`).join('')}
      </div>
      ${active
        ?renderClientDetail(active,colors,textColors,clients.findIndex(c=>c.id===active.id))
        :'<div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--muted);font-family:var(--mono);font-size:.8rem;flex-direction:column;gap:8px;"><i class="ti ti-building" style="font-size:2rem;opacity:.3"></i><span>Select or add a client</span></div>'}
    </div>`;
}

function renderClientDetail(c,colors,textColors,idx){
  const modules=c.modules||{};
  const moduleList=[
    ['ti-robot','ai_chatbot','AI Chatbot','24/7 website assistant'],
    ['ti-users','lead_capture','Lead Capture','Form → Supabase → alerts'],
    ['ti-brand-instagram','social_media','Social Media','FB · LinkedIn · Instagram'],
    ['ti-chart-bar','ceo_dashboard','CEO Dashboard','KPIs · pipeline · intel'],
    ['ti-terminal-2','nes_command','Team Hub','Team communications'],
    ['ti-news','intel_feed','NES Pulse','Daily market briefing'],
    ['ti-phone','apex_connect','Apex Connect','60-sec callback on new lead'],
    ['ti-brand-whatsapp','whatsapp_alerts','WhatsApp Alerts','Lead + team alerts'],
    ['ti-mail','email_notifications','Email Notifications','Lead emails to team'],
    ['ti-phone-call','apex_advisory','Apex Advisory','Enterprise voice consultant'],
    ['ti-headset','apex_outreach','Apex Outreach','3-day follow-up calls'],
    ['deen-custom','islam360','Deen NES AI','Islamic companion · Quran · Hadith'],
  ];
  return`
    <div class="cm-detail">
      <div class="cm-top">
        <div class="cm-client-info">
          <div class="cm-av" style="background:${colors[idx%5]};color:${textColors[idx%5]};">${(c.name||'?').substring(0,2).toUpperCase()}</div>
          <div>
            <div class="cm-name">${c.name}</div>
            <span class="cm-plan ${c.plan==='operations'?'plan-g':c.plan==='workforce'?'plan-e':'plan-s'}">${c.plan||'presence'}</span>
          </div>
        </div>
        <div class="cm-actions">
          <button class="cm-btn" onclick="showEditClientForm('${c.id}')"><i class="ti ti-edit" style="font-size:12px"></i> Edit</button>
          <button class="cm-btn" onclick="window._activeClientId='${c.id}';window._activeTab='billing';showClientManager()"><i class="ti ti-credit-card" style="font-size:12px"></i> Billing</button>
          <button class="cm-btn" style="background:rgba(64,156,255,0.1);color:#409cff;border:1px solid rgba(64,156,255,0.3);" onclick="showSignoff('${c.id}','${(c.name||'').replace(/'/g,'')}','${c.plan||''}','${c.monthly_fee||''}','${c.trial_start||''}','${c.trial_duration_days||7}')"><i class="ti ti-file-text" style="font-size:12px"></i> ${t('button.signOff')}</button>
          <button class="cm-btn" style="background:rgba(210,153,34,0.15);color:#d29922;border:1px solid rgba(210,153,34,0.3);" onclick="requestCancellation('${c.id}','${(c.name||'').replace(/'/g,'')}')"><i class="ti ti-x" style="font-size:12px"></i> ${t('button.cancelSub')}</button>
          <button class="cm-btn danger" onclick="deleteClient('${c.id}')"><i class="ti ti-trash" style="font-size:12px"></i> Delete</button>
          <button class="cm-btn primary" onclick="saveClientModules('${c.id}')"><i class="ti ti-device-floppy" style="font-size:12px"></i> Save</button>
          ${c.status==='onboarding'?`<button class="cm-btn" style="background:linear-gradient(135deg,#1a7f37,#3fb950);color:#fff;border:none;" onclick="onboardClient('${c.id}','${(c.name||'').replace(/'/g,'')}')" id="onboard-btn-${c.id}"><i class="ti ti-rocket" style="font-size:12px"></i> Onboard</button>`:''}
          ${c.status==='active'?`<span style="font-size:.65rem;font-family:var(--mono);color:#3fb950;display:flex;align-items:center;gap:4px;"><i class="ti ti-circle-check"></i> Active</span>`:''}
        </div>
      </div>
      <div class="cm-stats">
        <div class="cm-stat"><div class="cs-lbl">Plan</div><div class="cs-val" style="font-size:.85rem;text-transform:capitalize;">${c.plan||'presence'}</div></div>
        <div class="cm-stat"><div class="cs-lbl">Status</div><div class="cs-val" style="font-size:.85rem;color:${c.status==='active'?'#3fb950':'#d29922'}">${c.status||'active'}</div></div>
        <div class="cm-stat"><div class="cs-lbl">Industry</div><div class="cs-val" style="font-size:.85rem;">${c.industry||'—'}</div></div>
        <div class="cm-stat"><div class="cs-lbl">Region</div><div class="cs-val" style="font-size:.85rem;">${c.region||'—'}</div></div>
      </div>
      <div class="cm-tabs">
        <div class="cm-tab ${(!window._activeTab||window._activeTab==='modules')?'active':''}" onclick="cmTab('modules',this)">${t('clientTab.modules')}</div>
        <div class="cm-tab ${window._activeTab==='creds'?'active':''}" onclick="cmTab('creds',this)">${t('clientTab.credentials')}</div>
        <div class="cm-tab ${window._activeTab==='branding'?'active':''}" onclick="cmTab('branding',this)">${t('clientTab.branding')}</div>
        <div class="cm-tab ${window._activeTab==='agents'?'active':''}" onclick="cmTab('agents',this)">${t('clientTab.aiAgents')}</div>
        <div class="cm-tab ${window._activeTab==='billing'?'active':''}" onclick="cmTab('billing',this)">${t('clientTab.billing')}</div>
        <div class="cm-tab ${window._activeTab==='users'?'active':''}" onclick="cmTab('users',this)"><i class="ti ti-users" style="margin-right:4px;font-size:11px;"></i>${t('clientTab.users')}</div>
        <div class="cm-tab ${window._activeTab==='email'?'active':''}" onclick="cmTab('email',this)"><i class="ti ti-mail" style="margin-right:4px;font-size:11px;"></i>${t('clientTab.email')}</div>
      </div>
      <div class="cm-content">

        <div id="cm-modules">
          <div class="modules-grid">
            ${moduleList.map(([icon,key,name,desc])=>{
              const tierDerived = key==='ceo_dashboard' || key==='intel_feed' || key==='social_media';
              const apexPaidUntilMap = {'apex_connect':'apex_connect_paid_until','apex_outreach':'apex_outreach_paid_until','apex_advisory':'apex_advisory_paid_until'};
              if(!tierDerived){
                const paidField = apexPaidUntilMap[key];
                const dateInput = paidField ? `<input type="date" id="field_${paidField}" value="${c[paidField]||''}" title="Paid through date" style="font-size:.68rem;padding:3px 6px;border-radius:5px;border:1px solid var(--border);background:var(--card);color:var(--text);margin-right:8px;">` : '';
                return `
              <div class="mod">
                <i class="ti ${icon} mod-icon"></i>
                <div style="flex:1;"><div class="mod-name">${name}</div><div class="mod-desc">${desc}</div></div>
                ${dateInput}
                <button class="toggle ${modules[key]?'on':'off'}" data-module="${key}" onclick="this.classList.toggle('on');this.classList.toggle('off')"><div class="toggle-knob"></div></button>
              </div>`;
              }
              const tierOk = c.full_access_override===true || ['operations','workforce','infrastructure'].includes((c.plan||'').toLowerCase());
              const statusLabel = c.full_access_override===true ? 'Enabled — Custom access override' : (tierOk ? 'Included — Operations plan or higher' : 'Not included — upgrade to Operations+');
              const statusColor = tierOk ? '#3fb950' : '#8b949e';
              return `
              <div class="mod">
                <i class="ti ${icon} mod-icon"></i>
                <div style="flex:1;"><div class="mod-name">${name}</div><div class="mod-desc" style="color:${statusColor};">${statusLabel}</div></div>
                <button class="toggle ${tierOk?'on':'off'}" disabled style="opacity:0.5;cursor:not-allowed;" title="Auto-set by plan tier — not manually editable"><div class="toggle-knob"></div></button>
              </div>`;
            }).join('')}
          </div>
        </div>

        <div id="cm-creds" style="display:none;">
          <div class="creds-grid">
            ${[
              ['Facebook Token','facebook_token'],
              ['Facebook Page ID','facebook_page_id'],
              ['Instagram Business ID','instagram_business_id'],
              ['Instagram User Token','instagram_user_token'],
              ['LinkedIn Token','linkedin_token'],
              ['WhatsApp Phone ID','whatsapp_phone_id'],
              ['WhatsApp Token','whatsapp_token'],
              ['WhatsApp Business ID','whatsapp_business_id'],
              ['Vapi Phone Number','vapi_phone_number'],
              ['Appointment Booking Link','calcom_link'],
              ['Lead Email','email'],
              ['Website URL','website'],
              ['Telegram Bot Token','telegram_bot_token'],
              ['Telegram Chat ID','telegram_chat_id'],
            ].map(([lbl,key])=>`
              <div class="cred-field">
                <div class="cf-lbl">${lbl}</div>
                <input class="cf-input" type="text" value="${esc((window._clientCreds&&window._clientCreds[c.id]&&window._clientCreds[c.id][key])||'')} " placeholder="Not configured" data-field="${key}">
              </div>`).join('')}
          </div>
          <div style="display:flex;gap:8px;margin-top:10px;">
            <button class="form-submit" style="flex:1;" onclick="saveClientCreds('${c.id}')"><i class="ti ti-device-floppy"></i> ${t('clientTab.saveCredentials')}</button>
            <button onclick="addCustomCredField('${c.id}')" style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 14px;color:var(--muted);cursor:pointer;font-size:.8rem;white-space:nowrap;"><i class="ti ti-plus"></i> Add Field</button>
          </div>
          <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;margin-top:20px;">Website Chat Widget</div>
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;">
            <div style="font-size:.75rem;color:var(--muted);margin-bottom:10px;">Embed snippet for this client's website widget - pull this anytime without needing the client to log in.</div>
            <div style="display:flex;align-items:center;gap:8px;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-family:var(--mono);font-size:.68rem;color:#409cff;word-break:break-all;">
              <span id="cm-widget-snippet-${c.id}">&lt;script src=\"https://api.essential-services.org/widget.js?client_id=${c.id}\"&gt;&lt;/script&gt;</span>
              <button onclick="copyWidgetSnippet(this, '${c.id}')" style="background:var(--nes-btn-grad);border:none;border-radius:6px;padding:4px 12px;color:#fff;font-size:.68rem;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0;">${t('chatUi.copy')}</button>
            </div>
          </div>
        </div>

        <div id="cm-branding" style="display:none;">
          <div class="creds-grid">
            ${[
              ['Company Name','name'],
              ['Primary Colour','primary_color'],
              ['Region','region'],
              ['Industry','industry'],
              ['Website','website'],
              ['Logo URL','logo_url'],
              ['Language','language'],
              ['Brand Voice','brand_voice'],
              ['Post Style','post_style'],
            ].map(([lbl,key])=>`
              <div class="cred-field">
                <div class="cf-lbl">${lbl}</div>
                <input class="cf-input" type="text" value="${esc(c[key]||'')} " placeholder="Not set" data-field="${key}">
              </div>`).join('')}
            <div class="cred-field" style="grid-column:1/-1;">
              <div class="cf-lbl">Company Description (for AI posts)</div>
              <textarea class="cf-input" rows="3" placeholder="Describe the company for social media posts..." data-field="company_description" style="resize:vertical;">${esc(c.company_description||'')} </textarea>
            </div>
          </div>
          <button class="form-submit" style="margin-top:10px;" onclick="saveClientBranding('${c.id}')"><i class="ti ti-device-floppy"></i> ${t('clientTab.saveBranding')}</button>
        </div>

        <div id="cm-agents" style="display:none;">
          <div style="font-family:var(--mono);font-size:.65rem;color:var(--nes-blue);font-weight:800;margin-bottom:8px;padding:6px 10px;background:#0c1f35;border-radius:6px;border:1px solid #1a3a6e;"><i class="ti ti-lock" style="margin-right:5px;"></i>NES MANAGED — Admin only</div>
          <div class="creds-grid">
            ${[
              ['AI Voice Number (Twilio)','twilio_number'],
              ['AI Voice Assistant (Sara)','sara_assistant_id'],
              ['AI Voice Assistant (Layla)','layla_assistant_id'],
              ['AI Voice Assistant (Adam)','adam_assistant_id'],
              ['Appointment Booking Link','calcom_link'],
              ['Agent Language','agent_language'],
              ['Callback Delay (mins)','callback_delay'],
            ].map(([lbl,key])=>`
              <div class="cred-field">
                <div class="cf-lbl">${lbl}</div>
                <input class="cf-input" type="text" value="${esc(String((window._clientCreds&&window._clientCreds[c.id]&&window._clientCreds[c.id][key])||c[key]||'')||'')}" placeholder="Not configured" data-field="${key}">
              </div>`).join('')}
          </div>
          <button class="form-submit" style="margin-top:10px;" onclick="saveClientAgents('${c.id}')"><i class="ti ti-device-floppy"></i> Save Agent Settings</button>
        </div>

        <div id="cm-billing" style="display:none;">
          ${(()=>{
            const trialStart=c.trial_start?new Date(c.trial_start):null;
            const trialDays=c.trial_duration_days||7;
            const trialEnd=trialStart?new Date(trialStart.getTime()+trialDays*86400000):null;
            const now=new Date();
            const daysLeft=trialEnd?Math.ceil((trialEnd-now)/86400000):null;
            const trialActive=daysLeft!==null&&daysLeft>0;
            const trialExpired=daysLeft!==null&&daysLeft<=0;
            return trialStart?`
              <div style="padding:10px 14px;border-radius:8px;margin-bottom:12px;background:${trialActive?(daysLeft<=2?'#2d0e0e':'#0d2818'):'#1a1a2e'};border:1px solid ${trialActive?(daysLeft<=2?'#f8514940':'#3fb95040'):'#409cff40'};">
                <div style="font-family:var(--mono);font-size:.68rem;font-weight:800;color:${trialActive?(daysLeft<=2?'#f85149':'#3fb950'):'#409cff'};margin-bottom:3px;">
                  ${trialExpired?'TRIAL EXPIRED':'TRIAL ACTIVE'}
                </div>
                <div style="font-size:.75rem;color:var(--muted);">
                  ${trialActive?'<i class="ti ti-clock" style="margin-right:4px;"></i>'+daysLeft+' day'+( daysLeft===1?'':'s')+' remaining — ends '+trialEnd.toLocaleDateString():(trialExpired?'Expired '+trialEnd.toLocaleDateString():'No trial set')}
                </div>
              </div>`:''
          })()}
          <div class="creds-grid">
            ${[
              ['Monthly Fee (OMR)','monthly_fee'],
              ['Billing Date (day of month)','billing_date'],
              ['Contract Start','contract_start'],
              ['Contract End','contract_end'],
              ['Trial Start Date','trial_start'],
              ['Trial Duration (days)','trial_duration_days'],
              ['Custom Discount % (SME deals)','discount_percent'],
            ].map(([lbl,key])=>`
              <div class="cred-field">
                <div class="cf-lbl">${lbl}</div>
                <input class="cf-input" type="text" value="${esc(String(c[key]||'')||'')}" placeholder="Not set" data-field="${key}">
              </div>`).join('')}
            ${(()=>{
              const today=new Date();
              const minDate=today.toISOString().split('T')[0];
              const maxD=new Date(today);maxD.setFullYear(maxD.getFullYear()+50);
              const maxDate=maxD.toISOString().split('T')[0];
              return [['Founder Discount Expires','founder_discount_expires_at'],['Custom Discount Expires','discount_expires_at']].map(([lbl,key])=>`
              <div class="cred-field">
                <div class="cf-lbl">${lbl}</div>
                <input class="cf-input" type="date" value="${esc(String(c[key]||'')||'')}" min="${minDate}" max="${maxDate}" data-field="${key}">
              </div>`).join('');
            })()}
            <div class="cred-field">
              <div class="cf-lbl">Billing Cycle</div>
              <select class="cf-input" data-field="billing_cycle" id="billingCycle_${c.id}">
                <option value="monthly" ${(c.billing_cycle||'monthly')==='monthly'?'selected':''}>Monthly</option>
                <option value="annual" ${c.billing_cycle==='annual'?'selected':''}>Annual (15% off)</option>
              </select>
            </div>
            <div class="cred-field" style="display:flex;align-items:center;gap:8px;padding-top:18px;">
              <input type="checkbox" data-field="annual_discount_eligible" id="annualEligible_${c.id}" ${c.annual_discount_eligible!==false?'checked':''} style="width:16px;height:16px;">
              <label for="annualEligible_${c.id}" class="cf-lbl" style="margin:0;">Annual discount applies to custom rate</label>
            </div>
            <div class="cred-field" style="grid-column:1/-1;">
              <div class="cf-lbl">Billing Notes</div>
              <textarea class="cf-input" rows="2" placeholder="Notes..." data-field="billing_notes" style="resize:vertical;">${esc(c.billing_notes||'')} </textarea>
            </div>
          </div>
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px;margin:10px 0;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div class="cf-lbl" style="margin:0;">Effective Rate Preview</div>
              <div style="display:flex;gap:6px;">
                <button class="act-btn" style="padding:4px 10px;font-size:.68rem;" onclick="previewEffectiveRate('${c.id}','${c.plan}')"><i class="ti ti-calculator"></i> Preview</button>
                <button class="act-btn" style="padding:4px 10px;font-size:.68rem;background:rgba(63,185,80,.1);color:#3fb950;border-color:rgba(63,185,80,.3);" onclick="generatePaymentLink('${c.id}','${(c.name||'').replace(/\x27/g,'')}','${c.plan}')"><i class="ti ti-link"></i> Generate Payment Link</button>
              </div>
            </div>
            <div id="effectiveRatePreview_${c.id}" style="font-size:.8rem;margin-top:8px;color:var(--muted);">Click Preview to calculate based on current field values.</div>
          </div>
          <button class="form-submit" style="margin-top:10px;" onclick="saveClientBilling('${c.id}')"><i class="ti ti-device-floppy"></i> Save Billing</button>

          <div style="border-top:1px solid var(--border);margin-top:20px;padding-top:16px;">
            <div style="font-family:var(--mono);font-size:.65rem;color:var(--nes-blue);font-weight:800;margin-bottom:10px;">PAYMENT HISTORY</div>
            <div id="paymentLifetimeTotal_${c.id}" style="font-size:.8rem;color:var(--muted);margin-bottom:12px;">${t('common.loading')}</div>

            <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:14px;">
              <div style="font-size:.75rem;font-weight:700;margin-bottom:8px;">Record a payment or adjustment</div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px;">
                <select id="payType_${c.id}" class="form-select" onchange="togglePayReverses('${c.id}')">
                  <option value="payment">Payment</option>
                  <option value="adjustment">Rebate / credit</option>
                </select>
                <select id="payMethod_${c.id}" class="form-select">
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                  <option value="rebate">Rebate</option>
                  <option value="other">Other</option>
                </select>
                <input id="payAmount_${c.id}" type="number" placeholder="${t('placeholder.amountOmr')}" class="form-input">
              </div>
              <select id="payReverses_${c.id}" class="form-select" style="display:none;margin-bottom:8px;width:100%;">
                <option value="">Reverses which payment? (optional)</option>
              </select>
              <input id="payNote_${c.id}" type="text" placeholder="${t('placeholder.paymentNote')}" class="form-input" style="margin-bottom:8px;">
              <button class="act-btn" onclick="recordClientPayment('${c.id}')" style="width:100%;"><i class="ti ti-check"></i> Record entry</button>
            </div>

            <div id="paymentHistoryList_${c.id}" style="font-size:.75rem;color:var(--muted);">${t('loading.history')}</div>
          </div>
        </div>

        <div id="cm-email" style="display:none;">
          <div style="margin-bottom:12px;">
            <div style="font-family:var(--mono);font-size:.65rem;color:var(--nes-blue);font-weight:800;margin-bottom:8px;padding:6px 10px;background:#0c1f35;border-radius:6px;border:1px solid #1a3a6e;">
              <i class="ti ti-mail" style="margin-right:5px;"></i>IMAP EMAIL ACCOUNTS
            </div>
            <div id="cm-email-accounts" style="margin-bottom:12px;">
              <div style="color:var(--muted);font-family:var(--mono);font-size:.75rem;">${t('empty.noEmailAccounts')}</div>
            </div>
            <div style="background:var(--card2);border:1px solid var(--border);border-radius:8px;padding:12px;">
              <div style="font-family:var(--mono);font-size:.68rem;color:var(--nes-blue);margin-bottom:10px;font-weight:700;">+ Connect Email Account</div>
              <div class="creds-grid">
                <div class="cred-field">
                  <div class="cf-lbl">Email Address</div>
                  <input class="cf-input" type="email" id="em_address" placeholder="info@company.com">
                </div>
                <div class="cred-field">
                  <div class="cf-lbl">App Password</div>
                  <input class="cf-input" type="password" id="em_password" placeholder="${t('placeholder.appPassword')}">
                </div>
                <div class="cred-field">
                  <div class="cf-lbl">Provider</div>
                  <select class="cf-input" id="em_provider" onchange="autoFillImapSettings(this.value)">
                    <option value="gmail">Gmail</option>
                    <option value="outlook">Outlook / Microsoft 365</option>
                    <option value="yahoo">Yahoo</option>
                    <option value="cpanel">cPanel / Company email</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div class="cred-field">
                  <div class="cf-lbl">Label (friendly name)</div>
                  <input class="cf-input" type="text" id="em_label" placeholder="${t('placeholder.salesInbox')}">
                </div>
                <div class="cred-field">
                  <div class="cf-lbl">IMAP Server</div>
                  <input class="cf-input" type="text" id="em_imap" placeholder="imap.gmail.com">
                </div>
                <div class="cred-field">
                  <div class="cf-lbl">IMAP Port</div>
                  <input class="cf-input" type="number" id="em_imap_port" value="993">
                </div>
                <div class="cred-field">
                  <div class="cf-lbl">SMTP Server</div>
                  <input class="cf-input" type="text" id="em_smtp" placeholder="smtp.gmail.com">
                </div>
                <div class="cred-field">
                  <div class="cf-lbl">SMTP Port</div>
                  <input class="cf-input" type="number" id="em_smtp_port" value="587">
                </div>
              </div>
              <div style="display:flex;gap:8px;margin-top:10px;">
                <button class="form-submit" style="flex:1;" onclick="connectEmailAccount()"><i class="ti ti-plug"></i> Test & Connect</button>
              </div>
              <div id="em_status" style="font-family:var(--mono);font-size:.7rem;margin-top:8px;min-height:16px;"></div>
            </div>
            <div id="em_extra_forms"></div>
            <button id="em_add_btn" onclick="addEmailForm()" style="width:100%;background:none;border:1px dashed var(--border);border-radius:8px;padding:8px;color:var(--muted);cursor:pointer;font-size:.75rem;margin-top:8px;display:flex;align-items:center;justify-content:center;gap:5px;"><i class="ti ti-plus"></i> Add Another Email Account</button>
            <div id="em_plan_limit" style="font-family:var(--mono);font-size:.65rem;color:var(--muted);text-align:center;margin-top:6px;"></div>
            </div>
          </div>
        </div>

        <div id="cm-users" style="display:none;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
            <div style="font-family:var(--mono);font-size:.72rem;color:var(--muted);">Users linked to this client</div>
            <button onclick="showInviteUserForm('${c.id}')" style="background:var(--nes-btn-grad);border:none;border-radius:7px;padding:5px 12px;color:#fff;font-size:.72rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px;"><i class="ti ti-user-plus"></i> Invite User</button>
          </div>
          <div id="cm-users-list-${c.id}" style="min-height:40px;">
            <div style="color:var(--muted);font-family:var(--mono);font-size:.75rem;">${t('loading.users')}</div>
          </div>
        </div>

      </div>
    </div>`;
}

async function saveClientCreds(id){
  const creds={};
  document.querySelectorAll('#cm-creds [data-field]').forEach(el=>{
    if(el.dataset.field) creds[el.dataset.field]=el.value.trim();
  });
  const btn=document.querySelector('#cm-creds .form-submit');
  if(btn){btn.disabled=true;btn.textContent='Saving...';}
  try{
    const res=await fetch(API_URL+'/api/client/'+id+'/credentials',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({credentials:creds})
    });
    if(!res.ok){const e=await res.json();throw new Error(e.error||'Save failed');}
    showToast(t('toast.credentialsSaved'));
    if(window._clientCreds && window._clientCreds[id]) {
      window._clientCreds[id] = {...window._clientCreds[id], ...creds};
    }
    await loadClientsFromDB();
  }catch(e){alert('Error saving credentials: '+e.message);}
  finally{if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-device-floppy"></i> Save Credentials';}}
}

async function saveClientBranding(id){
  const data={};
  document.querySelectorAll('#cm-branding [data-field]').forEach(el=>{data[el.dataset.field]=el.value.trim();});
  try{const r=await fetch(API_URL+'/api/admin/client/'+id+'/branding',{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},body:JSON.stringify(data)});if(!r.ok)throw new Error((await r.json()).error);showToast('Branding saved');}catch(e){alert('Error: '+e.message);}
}

async function saveClientAgents(id){
  const settings={};
  document.querySelectorAll('#cm-agents [data-field]').forEach(el=>{settings[el.dataset.field]=el.value.trim();});
  const btn=document.querySelector('#cm-agents .form-submit');
  if(btn){btn.disabled=true;btn.textContent='Saving...';}
  try{
    const res=await fetch(API_URL+'/api/client/'+id+'/credentials',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({settings})
    });
    if(!res.ok){const e=await res.json();throw new Error(e.error||'Save failed');}
    showToast(t('toast.agentSettingsSaved'));
    await loadClientsFromDB();
  }catch(e){alert('Error: '+e.message);}
  finally{if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-device-floppy"></i> Save Agent Settings';}}
}

function previewEffectiveRate(id,plan){
  const el=document.getElementById('effectiveRatePreview_'+id);
  if(!el)return;
  el.textContent='Calculating...';
  const data={plan};
  document.querySelectorAll('#cm-billing [data-field]').forEach(f=>{
    data[f.dataset.field]=(f.type==='checkbox')?f.checked:f.value.trim();
  });
  fetch(API_URL+'/api/admin/billing/preview-rate',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
    body:JSON.stringify(data)
  }).then(r=>r.json()).then(res=>{
    if(res.error){el.innerHTML='<span style="color:#f85149;">'+res.error+'</span>';return;}
    const basisLabels={
      monthly:'Monthly billing — current fee, no annual discount',
      standard_annual:'Annual — 15% off standard rate',
      founder_bypassed_standard_annual:'Annual — founder discount bypassed, 15% off standard rate',
      sme_discount_with_annual:'Annual — 15% off negotiated rate (stacked, as enabled)',
      sme_discount_no_annual:'Annual — negotiated rate, no extra discount (not enabled for this client)',
      infrastructure_custom_no_discount:'Annual — custom plan, no fixed standard price to discount against'
    };
    el.innerHTML='<b style="color:var(--text);font-size:1rem;">OMR '+res.rate.toFixed(3)+'</b><div style="font-size:.68rem;color:var(--muted);margin-top:2px;">'+(basisLabels[res.basis]||res.basis)+'</div>';
  }).catch(()=>{el.innerHTML='<span style="color:#f85149;">Could not calculate.</span>';});
}

async function generatePaymentLink(clientId,clientName,plan){
  const el=document.getElementById('effectiveRatePreview_'+clientId);
  if(!el)return;
  el.textContent='Calculating amount...';
  const data={plan};
  document.querySelectorAll('#cm-billing [data-field]').forEach(f=>{
    data[f.dataset.field]=(f.type==='checkbox')?f.checked:f.value.trim();
  });
  try{
    const rateRes=await fetch(API_URL+'/api/admin/billing/preview-rate',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify(data)
    });
    const rateData=await rateRes.json();
    if(rateData.error||!rateData.rate){el.innerHTML='<span style="color:#f85149;">Could not calculate amount.</span>';return;}
    const netAmount=rateData.rate;
    const vatAmount=parseFloat((netAmount*0.05).toFixed(3));
    const grossAmount=parseFloat((netAmount+vatAmount).toFixed(3));
    el.textContent='Generating payment link...';
    const linkRes=await fetch(API_URL+'/api/thawani/create-session',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({
        amount:grossAmount,
        clientName,
        clientId,
        description:`NES AI Platform — ${plan} (${data.billing_cycle||'monthly'})`,
        metadata:{type:'plan_payment',clientId,net_amount:netAmount,vat_amount:vatAmount,gross_amount:grossAmount,billing_cycle:data.billing_cycle||'monthly'}
      })
    });
    const linkData=await linkRes.json();
    if(!linkData.success||!linkData.checkout_url){el.innerHTML='<span style="color:#f85149;">'+(linkData.error||'Could not generate link')+'</span>';return;}
    el.innerHTML='<div style="margin-bottom:6px;"><b style="color:var(--text);">OMR '+grossAmount.toFixed(3)+'</b> <span style="color:var(--muted);font-size:.68rem;">(incl. VAT OMR '+vatAmount.toFixed(3)+')</span></div>'+
      '<div style="background:var(--card2);border:1px solid var(--border);border-radius:6px;padding:8px;font-size:.7rem;word-break:break-all;margin-bottom:6px;font-family:var(--mono);">'+linkData.checkout_url+'</div>'+
      '<button class="act-btn" style="padding:4px 10px;font-size:.68rem;" onclick="navigator.clipboard.writeText(\''+linkData.checkout_url+'\');showToast(\'Link copied\')"><i class="ti ti-copy"></i> Copy Link</button>';
  }catch(e){
    el.innerHTML='<span style="color:#f85149;">Error: '+e.message+'</span>';
  }
}

async function saveClientBilling(id){
  const data={};
  document.querySelectorAll('#cm-billing [data-field]').forEach(el=>{
    data[el.dataset.field]=(el.type==='checkbox')?el.checked:el.value.trim();
  });
  try{const r=await fetch(API_URL+'/api/admin/client/'+id+'/billing',{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},body:JSON.stringify(data)});if(!r.ok)throw new Error((await r.json()).error);showToast('Billing saved');}catch(e){alert('Error: '+e.message);}
}

function togglePayReverses(clientId){
  const type=document.getElementById('payType_'+clientId).value;
  const el=document.getElementById('payReverses_'+clientId);
  if(el)el.style.display=type==='adjustment'?'block':'none';
}

async function recordClientPayment(clientId){
  const type=document.getElementById('payType_'+clientId).value;
  const method=document.getElementById('payMethod_'+clientId).value;
  const amount=document.getElementById('payAmount_'+clientId).value;
  const note=document.getElementById('payNote_'+clientId).value.trim();
  const reversesEl=document.getElementById('payReverses_'+clientId);
  const reverses_payment_id=(type==='adjustment'&&reversesEl&&reversesEl.value)?reversesEl.value:undefined;

  if(!amount||parseFloat(amount)<=0){showToast(t('toast.enterValidAmount'));return;}
  if(!note){showToast(t('toast.noteRequired'));return;}

  const label=type==='adjustment'?'rebate/credit of':'payment of';
  if(!confirm(`Record a ${label} OMR ${amount} (${method})?`))return;

  try{
    const res=await fetch(`${API_URL}/api/clients/${clientId}/payments`,{
      method:'POST',
      headers:{'Authorization':'Bearer '+session.access_token,'Content-Type':'application/json'},
      body:JSON.stringify({type,method,amount,note,reverses_payment_id})
    });
    const data=await res.json();
    if(res.ok&&data.success){
      showToast(data.warning?data.warning:'Entry recorded');
      document.getElementById('payAmount_'+clientId).value='';
      document.getElementById('payNote_'+clientId).value='';
      loadPaymentHistory(clientId);
    }else{
      showToast('Failed: '+(data.error||'unknown error'));
    }
  }catch(e){
    showToast(t('toast.failedNetworkError'));
  }
}

async function loadPaymentHistory(clientId){
  const totalEl=document.getElementById('paymentLifetimeTotal_'+clientId);
  const listEl=document.getElementById('paymentHistoryList_'+clientId);
  if(!totalEl||!listEl)return;
  try{
    const res=await fetch(`${API_URL}/api/clients/${clientId}/payments`,{
      headers:{'Authorization':'Bearer '+session.access_token}
    });
    const data=await res.json();
    if(!res.ok){totalEl.textContent='Could not load payment history';listEl.textContent='';return;}

    totalEl.innerHTML=`<b style="color:var(--text);font-size:1rem;">OMR ${data.lifetimeTotalOMR.toFixed(2)}</b> lifetime plan payments`+(data.creditPurchases.length?` · ${data.creditPurchases.length} image credit purchase(s) (tracked separately, not included in OMR total)`:'');

    const reversesEl=document.getElementById('payReverses_'+clientId);
    if(reversesEl){
      const paymentEntries=(data.payments||[]).filter(p=>p.type==='payment');
      reversesEl.innerHTML='<option value="">Reverses which payment? (optional)</option>'+paymentEntries.map(p=>{
        const d=new Date(p.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
        return `<option value="${p.id}">${d} · OMR ${parseFloat(p.gross_amount||p.amount).toFixed(3)}${p.invoice_number?' · '+p.invoice_number:''}</option>`;
      }).join('');
    }

    if(!data.payments.length){
      listEl.textContent=t('empty.noPayments');
      return;
    }
    const reversalMap={};
    (data.payments||[]).forEach(p=>{ if(p.reverses_payment_id) reversalMap[p.reverses_payment_id]=p; });
    listEl.innerHTML=data.payments.map(p=>{
      const sign=p.type==='adjustment'?'-':'+';
      const color=p.type==='adjustment'?'#f85149':'#3fb950';
      const date=new Date(p.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
      const vatLine=p.vat_amount>0?`<span style="color:var(--muted);font-size:.7rem;"> (incl. VAT OMR ${parseFloat(p.vat_amount).toFixed(3)})</span>`:'';
      const invoiceBtn=p.type==='payment'&&p.invoice_number?`<a href="${API_URL}/api/clients/${clientId}/payments/${p.id}/invoice?token=${session.access_token}" target="_blank" style="font-size:.65rem;padding:2px 8px;border-radius:4px;border:1px solid var(--border);color:var(--nes-blue);text-decoration:none;margin-left:8px;white-space:nowrap;"><i class='ti ti-file-invoice'></i> ${p.invoice_number}</a>`:'';
      const reversedBadge=(p.type==='payment'&&reversalMap[p.id])?`<span style="font-size:.6rem;padding:2px 6px;border-radius:4px;background:#2d1300;color:#f85149;margin-left:6px;">REVERSED</span>`:'';
      const reversesNote=(p.type==='adjustment'&&p.reverses_payment_id)?`<div style="color:#f85149;font-size:.68rem;padding-bottom:2px;">↩ Reverses payment from ${(data.payments.find(x=>x.id===p.reverses_payment_id)||{}).invoice_number||'earlier entry'}</div>`:'';
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);">
        <span style="display:flex;align-items:center;gap:4px;">${date} · ${p.method}${p.source==='auto'?' (auto)':''}${invoiceBtn}${reversedBadge}</span>
        <span style="color:${color};font-weight:700;white-space:nowrap;">${sign}OMR ${Math.abs(p.gross_amount||p.amount).toFixed(3)}${vatLine}</span>
      </div>${reversesNote}${p.note?`<div style="color:var(--muted);font-size:.7rem;padding-bottom:6px;">${esc(p.note)}</div>`:''}`;
    }).join('');
  }catch(e){
    totalEl.textContent='Could not load payment history';
  }
}

async function saveClientModules(clientId){
  const toggles=document.querySelectorAll('.toggle[data-module]');
  const modules={};toggles.forEach(t=>{modules[t.dataset.module]=t.classList.contains('on');});
  const payload={modules};
  ['apex_connect_paid_until','apex_outreach_paid_until','apex_advisory_paid_until'].forEach(f=>{
    const el=document.getElementById('field_'+f);
    if(el)payload[f]=el.value||null;
  });
  try{const r=await fetch(API_URL+'/api/admin/client/'+clientId+'/modules',{method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},body:JSON.stringify(payload)});if(!r.ok)throw new Error((await r.json()).error);showToast('Modules saved');}catch(e){alert('Error: '+e.message);}
}

async function selectClientDB(id){
  window._activeClientId=id;
  try{
    const res=await fetch(API_URL+'/api/client/'+id+'/credentials',{
      headers:{'Authorization':'Bearer '+session.access_token}
    });
    console.log('Credentials API response:',res.status,res.url);
    if(res.ok){
      const data=await res.json();
      console.log('Credentials loaded:',Object.keys(data));
      if(!window._clientCreds)window._clientCreds={};
      const creds=data.credentials&&typeof data.credentials==='string'?JSON.parse(data.credentials):data.credentials||{};
      const setts=data.settings&&typeof data.settings==='string'?JSON.parse(data.settings):data.settings||{};
      window._clientCreds[id]={...creds,...setts};
      console.log('Merged creds keys:',Object.keys(window._clientCreds[id]));
    }else{
      const err=await res.json().catch(()=>({}));
      console.error('Credentials API error:',res.status,err);
    }
  }catch(e){console.error('Could not load credentials:',e.message,e);}
  await loadClientsFromDB();
}

function searchClients(query){
  const clients=window._clients||[];
  const filtered=query?clients.filter(c=>c.name?.toLowerCase().includes(query.toLowerCase())):clients;
  const colors=['#1a3a6e','#2d1f00','#0d2818','#2d0e0e','#1a2332'];
  const textColors=['#409cff','#d29922','#3fb950','#f85149','#8b949e'];
  const listEl=document.getElementById('clientListEl');
  listEl.innerHTML=`<div class="cl-header"><span>Clients (${filtered.length})</span><button class="cl-add-btn" onclick="showAddClientForm()">${t('clientListUi.addBtn')}</button></div>`+
    (filtered.length===0?'<div style="padding:16px 11px;text-align:center;color:var(--muted);font-family:var(--mono);font-size:.72rem;">No match found</div>':
    filtered.map((c,i)=>`<div class="client-item ${c.id===window._activeClientId?'active':''}" onclick="selectClientDB('${c.id}')"><div class="ci-av" style="background:${colors[i%5]};color:${textColors[i%5]};">${(c.name||'?').substring(0,2).toUpperCase()}</div><div class="ci-name">${c.name}</div><div class="ci-dot" style="background:${c.status==='active'?'#3fb950':'#d29922'}"></div></div>`).join(''));
}

function showAddClientForm(){
  document.getElementById('mainContent').style.overflow='auto';
  document.getElementById('mainContent').innerHTML=`
    <div style="padding-block:11px;padding-inline-end:var(--header-clearance);padding-inline-start:60px;border-bottom:1px solid var(--border);flex-shrink:0;display:flex;align-items:center;gap:10px;">
      <button onclick="showClientManager()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:1.1rem;"><i class="ti ti-arrow-left"></i></button>
      <div><div style="font-family:var(--mono);font-size:.8rem;color:var(--nes-blue);font-weight:800;">${t('sectionTitle.addNewClient')}</div><div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);">Fill in the details below</div></div>
    </div>
    <div class="page scrollable"><div style="max-width:640px;padding-bottom:40px;">${clientFormFields()}<button class="form-submit" onclick="saveNewClient()"><i class="ti ti-plus"></i> Create Client</button></div></div>`;
}

function showEditClientForm(clientId){
  const client=(window._clients||[]).find(c=>c.id===clientId);if(!client)return;
  document.getElementById('mainContent').style.overflow='auto';
  document.getElementById('mainContent').innerHTML=`
    <div style="padding-block:11px;padding-inline-end:var(--header-clearance);padding-inline-start:60px;border-bottom:1px solid var(--border);flex-shrink:0;display:flex;align-items:center;gap:10px;">
      <button onclick="showClientManager()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:1.1rem;"><i class="ti ti-arrow-left"></i></button>
      <div><div style="font-family:var(--mono);font-size:.8rem;color:var(--nes-blue);font-weight:800;">EDIT — ${client.name}</div><div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);">Update client details</div></div>
    </div>
    <div class="page scrollable"><div style="max-width:640px;padding-bottom:40px;">${clientFormFields(client)}<button class="form-submit" onclick="updateClient('${clientId}')"><i class="ti ti-device-floppy"></i> Save Changes</button></div></div>`;
}

function buildCountryOptions(selected){
  const countries=['Oman','UAE','Saudi Arabia','Qatar','Kuwait','Bahrain','Jordan','Egypt','Afghanistan','Albania','Algeria','Angola','Argentina','Armenia','Australia','Austria','Azerbaijan','Bangladesh','Belarus','Belgium','Bolivia','Bosnia','Botswana','Brazil','Bulgaria','Cambodia','Cameroon','Canada','Chile','China','Colombia','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Ecuador','El Salvador','Estonia','Ethiopia','Finland','France','Georgia','Germany','Ghana','Greece','Guatemala','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Kazakhstan','Kenya','Kosovo','Latvia','Lebanon','Libya','Lithuania','Luxembourg','Malaysia','Malta','Mexico','Moldova','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nepal','Netherlands','New Zealand','Nicaragua','Nigeria','North Korea','Norway','Pakistan','Palestine','Panama','Paraguay','Peru','Philippines','Poland','Portugal','Romania','Russia','Rwanda','Serbia','Singapore','Slovakia','Slovenia','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Tunisia','Turkey','Turkmenistan','Uganda','UK','Ukraine','Uruguay','USA','Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe'];
  return countries.map(function(c){return '<option value="'+c+'"'+(c===selected?' selected':'')+'>'+c+'</option>';}).join('');
}

function clientFormFields(c={}){
  return`
    <div class="form-section">Basic Information</div>
    <div class="form-grid">
      <div class="form-field"><label class="form-label">${t('formLabel.companyName')}</label><input id="field_name" type="text" value="${esc(c.name||'')} " class="form-input" placeholder="${t('placeholder.companyName')}"></div>
      <div class="form-field"><label class="form-label">${t('formLabel.email')}</label><input id="field_email" type="email" value="${esc(c.email||'')} " class="form-input" placeholder="${t('placeholder.emailLabel')}"></div>
      <div class="form-field"><label class="form-label">${t('formLabel.website')}</label><input id="field_website" type="text" value="${esc(c.website||'')} " class="form-input" placeholder="https://..."></div>
      <div class="form-field"><label class="form-label">${t('formLabel.industry')}</label><input id="field_industry" type="text" value="${esc(c.industry||'')} " class="form-input" placeholder="Industry"></div>
      <div class="form-field"><label class="form-label">${t('formLabel.region')}</label><input id="field_region" type="text" value="${esc(c.region||'Oman')} " class="form-input" placeholder="Oman"></div>
      <div class="form-field"><label class="form-label">${t('formLabel.country')}</label>
        <select id="field_country" class="form-select">${buildCountryOptions(c.country||'Oman')}</select>
      </div>
      <div class="form-field"><label class="form-label">${t('formLabel.language')}</label>
        <select id="field_language" class="form-select">
          <option value="English" ${c.language==='English'?'selected':''}>English</option>
          <option value="Arabic" ${c.language==='Arabic'?'selected':''}>Arabic</option>
          <option value="Both" ${c.language==='Both'?'selected':''}>English + Arabic</option>
        </select>
      </div>
    </div>
    <div class="form-section">Branding & Contact</div>
    <div class="form-grid">
      <div class="form-field"><label class="form-label">${t('formLabel.leadNotificationEmail')}</label><input id="field_lead_email" type="email" value="${esc(c.lead_email||c.email||'')} " class="form-input" placeholder="leads@company.com"></div>
      <div class="form-field"><label class="form-label">${t('formLabel.primaryColour')}</label><input id="field_primary_color" type="text" value="${esc(c.primary_color||'#1a56db')} " class="form-input" placeholder="#1a56db"></div>
      <div class="form-field"><label class="form-label">${t('formLabel.logoUrl')}</label><input id="field_logo_url" type="text" value="${esc(c.logo_url||'')} " class="form-input" placeholder="https://..."></div>
    </div>
    <div style="background:rgba(64,156,255,.08);border:1px solid rgba(64,156,255,.2);border-radius:8px;padding:10px 14px;margin:8px 0;font-family:var(--mono);font-size:.72rem;color:var(--nes-blue);">
      <i class="ti ti-info-circle"></i> Credentials (WhatsApp, Facebook, LinkedIn etc) are entered in the <strong>Credentials tab</strong> after creating the client.
    </div>
    <div class="form-section">Plan & Status</div>
    <div class="form-grid">
      <div class="form-field"><label class="form-label">${t('formLabel.plan')}</label>
        <select id="field_plan" class="form-select">
          <option value="presence" ${c.plan==='presence'?'selected':''}>AI Presence</option>
          <option value="operations" ${c.plan==='operations'?'selected':''}>AI Operations</option>
          <option value="workforce" ${c.plan==='workforce'?'selected':''}>AI Workforce</option>
          <option value="infrastructure" ${c.plan==='infrastructure'?'selected':''}>AI Infrastructure</option>
        </select>
      </div>
      <div class="form-field"><label class="form-label">${t('formLabel.status')}</label>
        <select id="field_status" class="form-select">
          <option value="active" ${(c.status||'active')==='active'?'selected':''}>Active</option>
          <option value="onboarding" ${c.status==='onboarding'?'selected':''}>Onboarding</option>
          <option value="inactive" ${c.status==='inactive'?'selected':''}>Inactive</option>
        </select>
      </div>
      <div class="form-field"><label class="form-label">${t('formLabel.trialStartDate')}</label><input id="field_trial_start" type="date" value="${esc(c.trial_start||'')}" class="form-input"></div>
      <div class="form-field"><label class="form-label">${t('formLabel.trialDurationDays')}</label><input id="field_trial_duration_days" type="number" value="${esc(String(c.trial_duration_days||7))}" class="form-input" placeholder="7"></div>
      <div class="form-field">
        <label class="form-label">${t('formLabel.paygFullAccess')}</label>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 0;">
          <input id="field_full_access_override" type="checkbox" ${c.full_access_override?'checked':''} style="width:36px;height:20px;cursor:pointer;">
          <span style="font-size:.8rem;color:var(--muted);">Bypass trial/PAYG limits entirely (unlimited free images, for testing)</span>
        </label>
      </div>
      <div class="form-field">
        <label class="form-label">${t('formLabel.grantImageCredits')}</label>
        <div style="display:flex;gap:8px;align-items:center;">
          <select id="creditPackSelect_${c.id}" class="form-select" style="flex:1;" onchange="onCreditPackChange('${c.id}')">
            <option value="50:5">50 credits — OMR 5</option>
            <option value="200:18">200 credits — OMR 18</option>
            <option value="500:40">500 credits — OMR 40</option>
            <option value="custom">Custom amount</option>
          </select>
          <input id="creditCustomAmount_${c.id}" type="number" placeholder="Amount" class="form-input" style="width:90px;display:none;">
          <button class="act-btn" onclick="grantClientCredits('${c.id}')">Grant</button>
        </div>
        <div style="font-size:.7rem;color:var(--muted);margin-top:4px;">Applies after payment is received (e.g. via Thawani or manual transfer). Adds to the client's existing balance.</div>
      </div>
    </div>`;
}

function onCreditPackChange(clientId){
  const sel=document.getElementById('creditPackSelect_'+clientId);
  const customInput=document.getElementById('creditCustomAmount_'+clientId);
  if(sel.value==='custom'){customInput.style.display='block';customInput.focus();}
  else{customInput.style.display='none';}
}

async function grantClientCredits(clientId){
  const sel=document.getElementById('creditPackSelect_'+clientId);
  let amount;
  if(sel.value==='custom'){
    const customInput=document.getElementById('creditCustomAmount_'+clientId);
    amount=parseInt(customInput.value,10);
    if(!amount||amount<=0){showToast(t('toast.enterValidCustomAmount'));return;}
  }else{
    amount=parseInt(sel.value.split(':')[0],10);
  }
  if(!confirm(`Grant ${amount} image credits to this client?`))return;
  try{
    const res=await fetch(`${API_URL}/api/clients/${clientId}/grant-credits`,{
      method:'POST',
      headers:{'Authorization':'Bearer '+session.access_token,'Content-Type':'application/json'},
      body:JSON.stringify({amount})
    });
    const data=await res.json();
    if(res.ok&&data.success){
      showToast(`Granted ${data.granted} credits — new balance: ${data.newBalance}`);
    }else{
      showToast('Failed: '+(data.error||'unknown error'));
    }
  }catch(e){
    showToast(t('toast.failedNetworkError'));
  }
}

function getFormData(){
  const fields=['name','email','website','industry','region','country','language','lead_email','primary_color','logo_url','plan','status','trial_start','trial_duration_days'];
  const data={};
  fields.forEach(f=>{const el=document.getElementById('field_'+f);if(el)data[f]=el.value.trim();});
  const overrideEl=document.getElementById('field_full_access_override');
  if(overrideEl)data.full_access_override=overrideEl.checked;
  return data;
}

async function saveNewClient(){
  const data=getFormData();if(!data.name){alert('Company name is required');return;}
  if(!data.modules)data.modules={islam360:true};
  const btn=document.querySelector('.form-submit');if(btn){btn.disabled=true;btn.textContent='Creating...';}
  try{
    const r=await fetch(API_URL+'/api/admin/create-client',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify(data)
    });
    const res=await r.json();
    if(!r.ok)throw new Error(res.error||'Failed to create');
    window._activeClientId=null;
    await showClientManager();
    showToast(t('toast.clientCreated'));
  }
  catch(e){alert('Error: '+e.message);if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-plus"></i> Create Client';}}
}

async function updateClient(clientId){
  const data=getFormData();if(!data.name){alert('Company name is required');return;}
  const btn=document.querySelector('.form-submit');if(btn){btn.disabled=true;btn.textContent='Saving...';}
  try{
    const r=await fetch(API_URL+'/api/admin/update-client/'+clientId,{
      method:'PATCH',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify(data)
    });
    const res=await r.json();
    if(!r.ok)throw new Error(res.error||'Failed to update');
    window._activeClientId=clientId;
    await showClientManager();
    if(res.seat_warning){ alert(res.seat_warning); }
    showToast(t('toast.clientUpdated'));
  }
  catch(e){alert('Error: '+e.message);if(btn){btn.disabled=false;btn.innerHTML='<i class="ti ti-device-floppy"></i> Save Changes';}}
}

function showSignoff(clientId, clientName, plan, monthlyFee, trialStart, trialDays) {
  const planLabels = { presence: 'AI Presence', operations: 'AI Operations', workforce: 'AI Workforce', infrastructure: 'AI Infrastructure' };
  const planLabel = planLabels[plan] || plan || 'NES AI Plan';
  const fee = parseFloat(monthlyFee) || (plan==='workforce' ? 149 : plan==='operations' ? 79 : plan==='infrastructure' ? 299 : 29);
  const vat = (fee * 0.05).toFixed(3);
  const total = (fee + parseFloat(vat)).toFixed(3);

  let trialEndStr = 'TBD';
  let billingStartStr = 'TBD';
  if (trialStart) {
    const trialEnd = new Date(new Date(trialStart).getTime() + (parseInt(trialDays)||7) * 24*60*60*1000);
    const billing = new Date(trialEnd.getTime() + 24*60*60*1000);
    trialEndStr = trialEnd.toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'});
    billingStartStr = billing.toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'});
  }

  const waMsg = `As-salamu alaykum ${clientName} 👋

Your NES AI platform is ready!

📦 Plan: ${planLabel}
💰 Fee: OMR ${fee} + VAT (OMR ${vat}) = OMR ${total}/month
🗓 Trial ends: ${trialEndStr}
📅 First billing: ${billingStartStr}

Please reply *CONFIRMED* to activate your account.

Any questions? Call or WhatsApp us anytime.

NES Office Team
+968 9584 9952`;

  const emailMsg = `Subject: Your NES AI Platform is Ready — Action Required

Dear ${clientName},

Your NES AI platform setup is complete. Please confirm the details below to activate your account.

Plan: ${planLabel}
Monthly Fee: OMR ${fee} + 5% VAT (OMR ${vat}) = OMR ${total}/month
Trial ends: ${trialEndStr}
First Billing Date: ${billingStartStr}

To confirm, simply reply to this email with the word CONFIRMED or WhatsApp us on +968 9584 9952.

Warm regards,
NES Office Team
New Essential Services
office@essential-services.org`;

  // Remove existing modal if any
  const existing = document.getElementById('signoff-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'signoff-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
  modal.innerHTML = '<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:24px;max-width:680px;width:100%;max-height:85vh;overflow-y:auto;">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">'
    + '<div style="font-size:.9rem;font-weight:700;color:var(--nes-blue);">Client Sign-off — ' + clientName + '</div>'
    + '<button onclick="document.getElementById(\'signoff-modal\').remove()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:1.2rem;">&#x2715;</button>'
    + '</div>'
    + '<div style="font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">WhatsApp Message</div>'
    + '<div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px;font-size:.78rem;white-space:pre-wrap;color:var(--text);margin-bottom:8px;font-family:var(--mono);">' + waMsg + '</div>'
    + '<button onclick="navigator.clipboard.writeText(window._waMsg||\'\')" style="font-size:.7rem;padding:4px 12px;border-radius:6px;background:rgba(63,185,80,0.1);color:#3fb950;border:1px solid rgba(63,185,80,0.3);cursor:pointer;margin-bottom:16px;">Copy WhatsApp</button>'
    + '<div style="font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Email Message</div>'
    + '<div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px;font-size:.78rem;white-space:pre-wrap;color:var(--text);margin-bottom:8px;font-family:var(--mono);">' + emailMsg + '</div>'
    + '<button onclick="navigator.clipboard.writeText(window._emailMsg||\'\')" style="font-size:.7rem;padding:4px 12px;border-radius:6px;background:rgba(64,156,255,0.1);color:#409cff;border:1px solid rgba(64,156,255,0.3);cursor:pointer;">Copy Email</button>'
    + '</div>';
  window._waMsg = waMsg;
  window._emailMsg = emailMsg;
  modal.addEventListener('click', e => { if(e.target===modal) modal.remove(); });
}

async function requestCancellation(clientId, clientName) {
  // Show proper modal instead of browser prompt
  const existing = document.getElementById('cancelModal');
  if(existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'cancelModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:#161b22;border:1px solid #f85149;border-radius:14px;padding:28px;max-width:440px;width:90%;box-shadow:0 0 40px rgba(248,81,73,.2);">
      <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:#f85149;margin-bottom:8px;"><i class="ti ti-alert-triangle"></i> Cancel Subscription</div>
      <div style="font-size:13px;color:#8b949e;margin-bottom:16px;">You are requesting cancellation for <strong style="color:#e6edf3;">${clientName}</strong>. This will start a 30-day offboarding window and alert you via Telegram and Rocket.Chat.</div>
      <div style="font-size:11px;color:#8b949e;margin-bottom:6px;font-family:var(--mono);">Reason (optional):</div>
      <textarea id="cancelReason" style="width:100%;background:#0d1117;border:1px solid #1a2332;border-radius:8px;padding:10px;color:#e6edf3;font-size:13px;resize:vertical;min-height:80px;font-family:'Inter',sans-serif;" placeholder="Enter reason for cancellation..."></textarea>
      <div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end;">
        <button onclick="document.getElementById('cancelModal').remove()" style="background:rgba(255,255,255,.06);border:1px solid #1a2332;border-radius:8px;padding:9px 20px;color:#8b949e;cursor:pointer;font-size:13px;">Keep Subscription</button>
        <button onclick="confirmCancellation('${clientId}','${clientName}')" style="background:rgba(248,81,73,.15);border:1px solid rgba(248,81,73,.4);border-radius:8px;padding:9px 20px;color:#f85149;cursor:pointer;font-size:13px;font-weight:700;">Confirm Cancellation</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function confirmCancellation(clientId, clientName) {
  const reason = document.getElementById('cancelReason')?.value || '';
  document.getElementById('cancelModal')?.remove();
  try {
    const r = await fetch(API_URL + '/api/cancellation/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
      body: JSON.stringify({ clientId, reason })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Failed');
    showToast(t('toast.cancellationRequestSent'));
    setTimeout(() => location.reload(), 1500);
  } catch(e) {
    showToast('❌ ' + e.message);
  }
}

async function deleteClient(clientId){
  const client=(window._clients||[]).find(c=>c.id===clientId);
  if(!confirm(`Delete "${client?.name||'this client'}"? This cannot be undone.`))return;
  if(!confirm(`FINAL CONFIRMATION: Permanently delete "${client?.name||'this client'}" and all their data?`))return;
  try{
    const r=await fetch(API_URL+'/api/admin/delete-client/'+clientId,{
      method:'DELETE',
      headers:{'Authorization':'Bearer '+session.access_token}
    });
    const data=await r.json();
    if(!r.ok)throw new Error(data.error||'Failed to delete');
    window._activeClientId=null;
    await showClientManager();
    showToast(t('toast.clientDeleted'));
  }
  catch(e){alert('Error: '+e.message);}
}
