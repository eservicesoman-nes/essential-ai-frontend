// core.js — extracted from index.html, NES Locale Phase 0
// 34 functions, zero logic changes

function openInNewTab(url){window.open(url,'_blank','noopener,noreferrer');}

async function showApp(user){
  document.getElementById('authScreen').style.display='none';
  document.getElementById('app').style.display='flex';
  document.getElementById('userEmail').textContent=user.email;
  document.getElementById('userInitial').textContent=user.email[0].toUpperCase();
  // Handle Thawani payment redirect
  const urlParams=new URLSearchParams(window.location.search);
  if(urlParams.get('payment')==='success'){
    setTimeout(()=>showToast(t('toast.paymentSuccessful')),1000);
    window.history.replaceState({},document.title,window.location.pathname);
  } else if(urlParams.get('payment')==='cancelled'){
    setTimeout(()=>showToast(t('toast.paymentCancelled')),1000);
    window.history.replaceState({},document.title,window.location.pathname);
  }
  loadLocal();
  loadRecentChats();
  await loadUserRole(user);
  if(userClientId && userRole !== 'nesadmin'){
    const blocked = await checkAccountBlocked(userClientId);
    if(blocked){ showAccountBlockedScreen(); return; }
  }
  await loadUserPlan();
  setupNavForRole();
  if(userRole !== 'nesadmin'){
    const agreed = await checkAgreement(user.id);
    if(!agreed){ showAgreementModal(user.id); return; }
  }
  let defaultView = localStorage.getItem('nesai_view')||'chat';
  if(userClientId && !localStorage.getItem('nesai_view')){
    defaultView = userRole==='ceo' ? 'ceo' : 'leads';
  }
  showView(defaultView);
  loadUsageFromServer();
  bindNav();
  window._appLoaded=true;
  window._loadedUid=user?.id;
}

async function checkAgreement(userId){
  try{
    const{data}=await sb.from('agreements').select('id').eq('user_id',userId).single();
    return !!data;
  }catch(e){ return false; }
}

function showAgreementModal(userId){
  if(document.getElementById('agreementModal')) return;
  const modal=document.createElement('div');
  modal.id='agreementModal';
  modal.style.cssText='position:fixed;inset:0;z-index:9999;background:var(--bg);display:flex;align-items:center;justify-content:center;padding:20px;';
  modal.innerHTML=`
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:32px;max-width:560px;width:100%;max-height:90vh;overflow-y:auto;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:1.6rem;font-weight:800;margin-bottom:4px;"><span style="color:var(--nes-blue);">NES</span> <span style="color:#fff;">AI</span></div>
        <div style="font-family:var(--mono);font-size:.7rem;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;">Terms & Conditions</div>
      </div>
      <p style="font-size:.85rem;color:var(--muted);margin-bottom:24px;line-height:1.6;">Before accessing the platform, please read and accept the following terms.</p>

      <label style="display:flex;align-items:center;gap:12px;padding:14px;background:var(--card);border:1px solid var(--border);border-radius:10px;cursor:pointer;margin-bottom:20px;">
        <input type="checkbox" id="agreeAll" onchange="toggleAllTerms(this.checked)" style="width:18px;height:18px;accent-color:var(--nes-blue);cursor:pointer;">
        <span style="font-weight:700;font-size:.9rem;">Accept all terms and conditions</span>
      </label>

      <div style="border:1px solid var(--border);border-radius:10px;margin-bottom:12px;overflow:hidden;">
        <label style="display:flex;align-items:flex-start;gap:12px;padding:14px;cursor:pointer;">
          <input type="checkbox" id="agree1" onchange="updateAgreeAll()" style="width:16px;height:16px;margin-top:2px;accent-color:var(--nes-blue);cursor:pointer;flex-shrink:0;">
          <div>
            <div style="font-weight:600;font-size:.85rem;margin-bottom:4px;">Acceptable Use</div>
            <div style="font-size:.78rem;color:var(--muted);line-height:1.5;">I agree to use NES AI only for lawful, ethical business purposes. I will not use the platform for illegal, harmful, discriminatory, or misleading activities. I understand that violation may result in immediate account termination.</div>
          </div>
        </label>
      </div>

      <div style="border:1px solid var(--border);border-radius:10px;margin-bottom:12px;overflow:hidden;">
        <label style="display:flex;align-items:flex-start;gap:12px;padding:14px;cursor:pointer;">
          <input type="checkbox" id="agree2" onchange="updateAgreeAll()" style="width:16px;height:16px;margin-top:2px;accent-color:var(--nes-blue);cursor:pointer;flex-shrink:0;">
          <div>
            <div style="font-weight:600;font-size:.85rem;margin-bottom:4px;">AI Limitations</div>
            <div style="font-size:.78rem;color:var(--muted);line-height:1.5;">I understand that AI-generated content may not always be accurate, complete, or current. I agree to verify important information independently before acting on it. NES AI is a decision-support tool, not a replacement for professional advice.</div>
          </div>
        </label>
      </div>

      <div style="border:1px solid var(--border);border-radius:10px;margin-bottom:24px;overflow:hidden;">
        <label style="display:flex;align-items:flex-start;gap:12px;padding:14px;cursor:pointer;">
          <input type="checkbox" id="agree3" onchange="updateAgreeAll()" style="width:16px;height:16px;margin-top:2px;accent-color:var(--nes-blue);cursor:pointer;flex-shrink:0;">
          <div>
            <div style="font-weight:600;font-size:.85rem;margin-bottom:4px;">Liability</div>
            <div style="font-size:.78rem;color:var(--muted);line-height:1.5;">I acknowledge that New Essential Services is not liable for any losses, damages, or decisions arising from the use of AI-generated content, platform downtime, or data inaccuracies. Use of this platform constitutes acceptance of this limitation.</div>
          </div>
        </label>
      </div>

      <button id="agreeBtn" onclick="submitAgreement('${userId}')" disabled style="width:100%;padding:14px;border:none;border-radius:10px;background:#1a2332;color:#4a5568;font-weight:700;font-size:.9rem;cursor:not-allowed;transition:all .2s;">
        Confirm & Continue →
      </button>
      <div style="text-align:center;margin-top:12px;font-family:var(--mono);font-size:.65rem;color:var(--muted);">By continuing you agree to our <span id="tosLink" style="color:var(--nes-blue);cursor:pointer;text-decoration:underline;font-family:var(--mono);font-size:.65rem;">Terms of Service</span> and <span id="privLink" style="color:var(--nes-blue);cursor:pointer;text-decoration:underline;font-family:var(--mono);font-size:.65rem;">Privacy Policy</span></div>
    </div>`;
  document.body.appendChild(modal);
  const tosEl=document.getElementById('tosLink');
  const privEl=document.getElementById('privLink');
  if(tosEl)tosEl.onclick=function(e){e.stopPropagation();window.open('https://nes-ai.com/tos.html','_blank','noopener,noreferrer');};
  if(privEl)privEl.onclick=function(e){e.stopPropagation();window.open('https://nes-ai.com/legal.html#privacy','_blank','noopener,noreferrer');};
}

function toggleAllTerms(checked){
  ['agree1','agree2','agree3'].forEach(id=>document.getElementById(id).checked=checked);
  updateConfirmBtn();
}

function updateAgreeAll(){
  const all=['agree1','agree2','agree3'].every(id=>document.getElementById(id).checked);
  document.getElementById('agreeAll').checked=all;
  updateConfirmBtn();
}

function updateConfirmBtn(){
  const all=['agree1','agree2','agree3'].every(id=>document.getElementById(id).checked);
  const btn=document.getElementById('agreeBtn');
  if(all){
    btn.disabled=false;
    btn.style.background='var(--nes-btn-grad)';
    btn.style.color='#fff';
    btn.style.cursor='pointer';
  } else {
    btn.disabled=true;
    btn.style.background='#1a2332';
    btn.style.color='#4a5568';
    btn.style.cursor='not-allowed';
  }
}

async function submitAgreement(userId){
  const btn=document.getElementById('agreeBtn');
  btn.textContent=t('authFlow.saving');
  btn.disabled=true;
  try{
    await sb.from('agreements').insert({
      user_id: userId,
      version: 'v1.0'
    });
    document.getElementById('agreementModal').remove();
    let defaultView = localStorage.getItem('nesai_view')||'chat';
    if(userClientId){ defaultView = userRole==='ceo' ? 'ceo' : userRole==='nes_partner' ? 'partner_dashboard' : 'leads'; }
    showView(defaultView);
    loadUsageFromServer();
    bindNav();
  }catch(e){
    btn.textContent=t('authFlow.errorTryAgain');
    btn.disabled=false;
    btn.style.background='#f85149';
    btn.style.color='#fff';
  }
}

async function loadUserRole(user){
  try{
    const{data}=await sb.from('profiles').select('role,client_id,granted_modules').eq('id',user.id).single();
    userRole=data?.role||'staff';
    userClientId=data?.client_id||null;
    window.userGrantedModules=data?.granted_modules||[];
  }catch(e){userRole='staff';userClientId=null;window.userGrantedModules=[];}
  document.getElementById('roleChip').textContent=userRole;
}

const BLOCKED_ACCOUNT_STATUSES = ['suspended', 'cancelled', 'inactive'];
async function checkAccountBlocked(clientId){
  try{
    const{data}=await sb.from('clients').select('status,trial_start,trial_duration_days').eq('id',clientId).single();
    if(!data) return false;
    if(BLOCKED_ACCOUNT_STATUSES.includes(data.status)) return true;
    if(data.status==='trial' && data.trial_start){
      const trialEnd = new Date(data.trial_start).getTime() + (parseInt(data.trial_duration_days)||7) * 24*60*60*1000;
      if(Date.now() > trialEnd) return true;
    }
    return false;
  }catch(e){ return false; }
}
function showAccountBlockedScreen(){
  document.getElementById('authScreen').style.display='none';
  document.getElementById('app').style.display='flex';
  document.getElementById('mainContent').innerHTML=`
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:40px;text-align:center;">
      <i class="ti ti-lock" style="font-size:48px;color:#f85149;margin-bottom:16px;"></i>
      <div style="font-family:var(--mono);font-size:1.1rem;font-weight:800;color:#f85149;margin-bottom:8px;">Account Not Active</div>
      <div style="font-size:.9rem;color:var(--muted);max-width:420px;margin-bottom:24px;">This account is currently inactive. Please contact NES AI to restore access.</div>
      <button onclick="sb.auth.signOut().then(()=>window.location.reload())" style="background:var(--nes-btn-grad);border:none;border-radius:8px;padding:10px 24px;color:#fff;font-weight:700;cursor:pointer;">Sign Out</button>
    </div>`;
}
function updateLanguageSwitcherIcon(){
  const label=document.getElementById('langSwitcherLabel');
  if(label) label.textContent=(window.clientLocale||'en').toUpperCase();
}
function toggleLangMenu(){
  const existing=document.getElementById('langMenuDropdown');
  if(existing){ existing.remove(); return; }
  const btn=document.getElementById('langSwitcherBtn');
  const rect=btn.getBoundingClientRect();
  const menu=document.createElement('div');
  menu.id='langMenuDropdown';
  menu.style.cssText=`position:fixed;top:${rect.bottom+6}px;left:${rect.left}px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:4px;z-index:9999;min-width:140px;box-shadow:0 4px 16px rgba(0,0,0,.3);`;
  const langs=[{code:'en',label:'English'},{code:'pt',label:'Portugu\u00eas'},{code:'ar',label:'العربية'}];
  menu.innerHTML=langs.map(l=>`<div onclick="selectLanguage('${l.code}')" style="padding:8px 12px;border-radius:6px;cursor:pointer;font-size:.8rem;color:var(--text);${l.code===(window.clientLocale||'en')?'background:var(--nes-blue);color:#fff;':''}" onmouseover="if('${l.code}'!=='${window.clientLocale||'en'}')this.style.background='var(--card)'" onmouseout="if('${l.code}'!=='${window.clientLocale||'en'}')this.style.background='transparent'">${l.label}</div>`).join('');
  document.body.appendChild(menu);
  setTimeout(()=>{
    document.addEventListener('click', function closeMenu(e){
      if(!menu.contains(e.target) && e.target.id!=='langSwitcherBtn' && !btn.contains(e.target)){
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  },10);
}
function applyTextDirection(locale){
  const isRtl = locale === 'ar';
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  document.documentElement.classList.toggle('rtl-mode', isRtl);
}
async function selectLanguage(code){
  document.getElementById('langMenuDropdown')?.remove();
  if(code === (window.clientLocale||'en')) return;
  if(userRole === 'nesadmin') return;
  window.clientLocale = code;
  applyTextDirection(code);
  await loadNesStrings(code);
  applyNesI18n();
  updateLanguageSwitcherIcon();
  const currentView = localStorage.getItem('nesai_view') || 'chat';
  showView(currentView);
  bindNav();
  if(userClientId){
    try{
      await fetch(API_URL+'/api/client/locale',{
        method:'PATCH',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
        body:JSON.stringify({locale:code})
      });
    }catch(e){ console.error('Failed to save locale preference:', e); }
  }
}
window.toggleLangMenu=toggleLangMenu;
window.selectLanguage=selectLanguage;
window.updateLanguageSwitcherIcon=updateLanguageSwitcherIcon;
function setupNavForRole(){
  const intel=document.getElementById('intelligenceSection');
  const clientMgr=document.getElementById('clientMgrSection');
  const ceoNav=document.querySelector('[data-view="ceo"]');
  const salesNav=document.getElementById('salesNav');
  const leadsNav=document.querySelector('[data-view="leads"]');
  const commandNav=document.querySelector('[data-view="command"]');

  if(userClientId){
    intel.style.display='block';
    if(userRole==='ceo'||userRole==='nesadmin'||userRole==='nes_partner'){
      if(ceoNav)ceoNav.style.display='flex';
    } else {
      if(ceoNav)ceoNav.style.display='none';
    }
    if(['manager','staff'].includes(userRole)){
      if(leadsNav)leadsNav.style.display='flex';
    }
    if(userRole==='nes_partner'){
      const pnDashNav=document.getElementById('partnerDashNav');if(pnDashNav)pnDashNav.style.display='flex';
      const pnInbox=document.getElementById('inboxNav');if(pnInbox)pnInbox.style.display='flex';
      const pnTeam=document.getElementById('teamNav');if(pnTeam)pnTeam.style.display='flex';
      const pnLeads=document.getElementById('leadsNav');if(pnLeads)pnLeads.style.display='flex';
      clientMgr.style.display='block'; loadClientCount();
    }
    if(userRole==='nesadmin'){
      clientMgr.style.display='block';
      loadClientCount();
      const phn=document.getElementById('partnerHubNav');if(phn)phn.style.display='block';
      const an=document.getElementById('analyticsNav');if(an)an.style.display='flex';
      const statusNav=document.getElementById('adminStatusNav');if(statusNav)statusNav.style.display='flex';
      const apiNav=document.getElementById('apiCreditsNav');if(apiNav)apiNav.style.display='flex';
      const logsNav=document.getElementById('sysLogsNav');if(logsNav)logsNav.style.display='flex';
      const incNav=document.getElementById('incidentsNav');if(incNav)incNav.style.display='flex';
      const teamNavEl=document.getElementById('teamNav');if(teamNavEl)teamNavEl.style.display='flex';
      const myCredsNavEl=document.getElementById('myCredsNav');if(myCredsNavEl)myCredsNavEl.style.display='flex';
    } else {
      clientMgr.style.display='none';
      if(salesNav)salesNav.style.display='none';
      const myCredsNav=document.getElementById('myCredsNav');
      if(myCredsNav)myCredsNav.style.display = (userRole==='ceo' || (window.userGrantedModules||[]).includes('it_setup')) ? 'flex' : 'none';
    }
    if(['ceo','manager'].includes(userRole)){
      const teamNavForClientRole=document.getElementById('teamNav');
      if(teamNavForClientRole)teamNavForClientRole.style.display='flex';
    }
    const deenNavEl = document.getElementById('deenNav');
    const inboxNavEl = document.getElementById('inboxNav');
    if(inboxNavEl) inboxNavEl.style.display = ['ceo','nesadmin'].includes(userRole) ? 'flex' : 'none';
    const briefcaseWorkspaceNavEl = document.getElementById('briefcaseWorkspaceNav');
    if(briefcaseWorkspaceNavEl) briefcaseWorkspaceNavEl.style.display = (userRole==='ceo' || userRole==='nesadmin' || (window.userGrantedModules||[]).includes('briefcase')) ? 'flex' : 'none';
    const whatsappWorkspaceNavEl = document.getElementById('whatsappWorkspaceNav');
    if(whatsappWorkspaceNavEl) whatsappWorkspaceNavEl.style.display = (userRole==='ceo' || userRole==='nesadmin' || (window.userGrantedModules||[]).includes('whatsapp_autoreply')) ? 'flex' : 'none';
    showClientBrandingChip().then(()=>{
      const mods = window.clientModules || {};
      const ceoNavEl = document.querySelector('[data-view="ceo"]');
      const commandNavEl = document.querySelector('[data-view="command"]');
      const intelNavEl = document.querySelector('[data-view="intel"]');
      const imageNavEl = document.querySelector('[data-view="image"]');
      const tierOk=hasTierModule(['operations','workforce','infrastructure']);
      if(ceoNavEl && !tierOk) ceoNavEl.style.display='none';
      if(commandNavEl && mods.nes_command === false) commandNavEl.style.display='none';
      if(intelNavEl && !tierOk) intelNavEl.style.display='none';
      if(imageNavEl && mods.image_gen === false) imageNavEl.style.display='none';
      if(deenNavEl){
        const deenEnabled = mods.islam360 !== false;
        const deenIcon = document.getElementById('deenHeaderIcon');
        const deenLabel = document.getElementById('deenHeaderLabel');
        deenNavEl.title = deenEnabled ? 'Deen دين' : 'NES AI';
        deenNavEl.onclick = deenEnabled ? function(){showView('deen');} : null;
        deenNavEl.style.cursor = deenEnabled ? 'pointer' : 'default';
        if(deenIcon) deenIcon.src = deenEnabled ? 'https://deen.nes-ai.com/deen-icon.png' : '/icon.png';
        if(deenLabel) deenLabel.textContent = deenEnabled ? 'Deen' : 'NES';
      }
    });
  } else {
    if(['nesadmin','ceo','manager'].includes(userRole))intel.style.display='block';
    if(!['nesadmin','ceo'].includes(userRole)&&ceoNav)ceoNav.style.display='none';
    const teamNavEl = document.getElementById('teamNav');
    if(teamNavEl && ['ceo','manager','nesadmin'].includes(userRole)) teamNavEl.style.display='flex';
    if(userRole==='nesadmin'){const phn=document.getElementById('partnerHubNav');if(phn)phn.style.display='block';
      const inboxNavAdmin=document.getElementById('inboxNav');
      if(inboxNavAdmin)inboxNavAdmin.style.display='flex';
      const briefcaseNavAdmin=document.getElementById('briefcaseWorkspaceNav');
      if(briefcaseNavAdmin)briefcaseNavAdmin.style.display='flex';
      const deenNavAdmin=document.getElementById('deenNav');
      if(deenNavAdmin)deenNavAdmin.style.display='flex';const an=document.getElementById('analyticsNav');if(an)an.style.display='flex';
      clientMgr.style.display='block';
      loadClientCount();
      const statusNav=document.getElementById('adminStatusNav');
      if(statusNav)statusNav.style.display='flex';
      const apiNav=document.getElementById('apiCreditsNav');
      if(apiNav)apiNav.style.display='flex';
      const logsNav=document.getElementById('sysLogsNav');
      if(logsNav)logsNav.style.display='flex';
    }
  }
  loadLeadCount();
}

function hasTierModule(planKeys){
  if(window.clientFullAccessOverride===true)return true;
  const plan=(window.clientPlan||'').toLowerCase();
  return planKeys.includes(plan);
}

async function showClientBrandingChip(){
  try{
    const{data}=await sb.from('clients').select('name,primary_color,logo_url,plan,modules,full_access_override,apex_connect_paid_until,apex_outreach_paid_until,apex_advisory_paid_until,region,country,status,locale').eq('id',userClientId).single();
    if(!data)return;
    const chip=document.getElementById('roleChip');
    if(chip&&data.name)chip.textContent=data.name;
    if(data.plan)window.clientPlan=data.plan;
    window.clientModules = data.modules || {};
    window.userRegion = (data.region || data.country || '').trim();
    window.clientAccountStatus = data.status || 'active';
    window.clientLocale = data.locale || 'en';
    // One-time browser-language auto-detection: only runs once ever per browser,
    // before any manual language choice has been made. Never overrides a later manual choice.
    if(!localStorage.getItem('nesai_lang_detected') && window.clientLocale === 'en'){
      localStorage.setItem('nesai_lang_detected','1');
      const clientCountry = (data.country || '').toLowerCase();
      if(clientCountry.includes('portugal')){
        window.clientLocale = 'pt';
        if(userClientId){
          try{
            await fetch(API_URL+'/api/client/locale',{
              method:'PATCH',
              headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
              body:JSON.stringify({locale:'pt'})
            });
          }catch(e){ console.error('Failed to save auto-detected locale:', e); }
        }
      }
    }
    if(window.clientLocale !== 'en' && userRole !== 'nesadmin'){ await loadNesStrings(window.clientLocale); applyNesI18n(); }
    applyTextDirection(window.clientLocale);
    updateLanguageSwitcherIcon();
    if(!window.userRegion){
      try{
        const{data:pData}=await sb.from('profiles').select('phone').eq('id',session.user.id).single();
        const rawPhone=(pData&&pData.phone||'').replace(/[^0-9]/g,'');
        const dialCityMap=[['971','Dubai'],['966','Riyadh'],['974','Doha'],['973','Manama'],['965','Kuwait City'],['968','Muscat'],['351','Lisbon'],['962','Amman'],['92','Karachi'],['44','London'],['20','Cairo'],['1','New York']];
        const match=dialCityMap.find(([code])=>rawPhone.startsWith(code));
        if(match)window.userRegion=match[1];
      }catch(e){}
    }
    window.clientFullAccessOverride = data.full_access_override === true;
    window.clientApexPaidUntil = {
      apex_connect: data.apex_connect_paid_until || null,
      apex_outreach: data.apex_outreach_paid_until || null,
      apex_advisory: data.apex_advisory_paid_until || null
    };
    if(data.primary_color){
      document.documentElement.style.setProperty('--nes-blue',data.primary_color);
      window.userPlan = data.plan || '';
      window.userCompany = data.name || '';
    }
  }catch(e){}
}

async function loadClientCount(){
  try{const{count}=await sb.from('clients').select('*',{count:'exact',head:true});document.getElementById('clientCount').textContent=count||0;}catch(e){}
}

async function loadLeadCount(){
  try{
    const today=new Date().toISOString().split('T')[0];
    let lcQ=sb.from('leads').select('*',{count:'exact',head:true}).gte('created_at',today);
    if(userClientId)lcQ=lcQ.eq('client_id',userClientId);
    const{count}=await lcQ;
    const badge=document.getElementById('leadsBadge');badge.textContent=count||0;
    if(count>0){badge.style.background='#2d0e0e';badge.style.color='#f85149';}
  }catch(e){}
}

function showAuthScreen(){document.getElementById('app').style.display='none';document.getElementById('authScreen').style.display='flex';}

async function loadUserPlan(){userPlan='free';updateStats();}

function getCurrentLimits(){return PLAN_LIMITS[userPlan]||PLAN_LIMITS.free;}

function switchTab(tab){
  ['login','signup'].forEach(t=>{
    document.getElementById('tab'+(t==='login'?'Login':'Signup')).classList.toggle('active',t===tab);
    document.getElementById(t+'Panel').classList.toggle('active',t===tab);
  });
}

async function doLogin(){
  const email=document.getElementById('loginEmail').value.trim();
  const pass=document.getElementById('loginPassword').value;
  const err=document.getElementById('loginErr');err.textContent='';
  if(!email||!pass){err.textContent=t('authFlow.emailPasswordRequired');return;}
  const{error}=await sb.auth.signInWithPassword({email,password:pass});
  if(error)err.textContent=error.message;
}

function showForgotPanel(){
  document.getElementById('loginPanel').classList.remove('active');
  document.getElementById('signupPanel').classList.remove('active');
  document.getElementById('forgotPanel').classList.add('active');
}

function showLoginPanel(){
  document.getElementById('forgotPanel').classList.remove('active');
  document.getElementById('loginPanel').classList.add('active');
}

async function doForgotPassword(){
  const email=document.getElementById('forgotEmail').value.trim();
  const err=document.getElementById('forgotErr');const msg=document.getElementById('forgotMsg');
  err.textContent='';msg.textContent='';
  if(!email){err.textContent=t('authFlow.emailRequired');return;}
  const{error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+window.location.pathname});
  if(error){err.textContent=error.message;return;}
  msg.textContent=t('authFlow.checkEmailResetLink');
}

async function checkRecoveryMode(){
  const hash=window.location.hash;
  if(hash&&hash.includes('type=recovery')){
    const newPass=prompt(t('authFlow.enterNewPasswordPrompt'));
  if(newPass&&newPass.length>=6){
      const{error}=await sb.auth.updateUser({password:newPass});
      if(error){alert(t('authFlow.failedUpdatePassword')+error.message);}
      else{alert(t('authFlow.passwordUpdatedSignIn'));window.location.hash='';window.location.reload();}
    }
  }
}

async function doSignup(){
  window.location.href='https://nes-ai.com/register.html';
}

function buildProfileMenu(){
  const menu = document.getElementById('profileMenu');
  const email = document.getElementById('userEmail').textContent || '';
  const role = document.getElementById('roleChip').textContent || '';
  const isAdmin = role === 'nesadmin';
  const isCEO = role === 'ceo';
  const isManager = role === 'manager';

  // Plan badge color
  const planColors = { presence:'#409cff', operations:'#3fb950', workforce:'#d29922', infrastructure:'#7f77dd' };
  const plan = (window.userPlan || '').toLowerCase();
  const planColor = planColors[plan] || '#409cff';
  const planLabel = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : '';

  let html = '';

  // Header info block
  html += `<div style="padding:8px 10px 10px;border-bottom:1px solid #1a2332;margin-bottom:6px;">
    <div style="font-size:.78rem;color:#e6edf3;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${email}</div>
    <div style="display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap;">
      <span style="font-size:.62rem;padding:2px 7px;border-radius:5px;background:rgba(64,156,255,0.12);color:#409cff;font-family:monospace;text-transform:uppercase;">${role}</span>
      ${!isAdmin && planLabel ? `<span style="font-size:.62rem;padding:2px 7px;border-radius:5px;background:rgba(${planColor === '#409cff' ? '64,156,255' : planColor === '#3fb950' ? '63,185,80' : planColor === '#d29922' ? '210,153,34' : '127,119,221'},0.12);color:${planColor};font-family:monospace;">AI ${planLabel}</span>` : ''}
      ${!isAdmin && window.userCompany ? `<span style="font-size:.65rem;color:#8b949e;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:120px;">${window.userCompany}</span>` : ''}
      ${isAdmin ? `<span style="font-size:.62rem;padding:2px 7px;border-radius:5px;background:rgba(248,81,73,0.12);color:#f85149;font-family:monospace;">NES AI</span>` : ''}
    </div>
  </div>`;

  // Change Password — all roles
  html += `<div class="profile-menu-item" onclick="event.stopPropagation();toggleProfileMenu();showChangePassword()">
    <i class="ti ti-key"></i><span>Change Password</span>
  </div>`;

  // Admin-only items
  if(isAdmin){
    html += `<div class="profile-menu-item" onclick="event.stopPropagation();toggleProfileMenu();showView('analytics')">
      <i class="ti ti-chart-dots"></i><span>Usage Analytics</span>
    </div>`;
    html += `<div class="profile-menu-item" onclick="event.stopPropagation();toggleProfileMenu();showView('adminstatus')">
      <i class="ti ti-server"></i><span>Platform Status</span>
    </div>`;
  }

  // CEO/Manager — company profile
  if(isCEO || isManager){
    html += `<div class="profile-menu-item" onclick="event.stopPropagation();toggleProfileMenu();showView('mycredentials')">
      <i class="ti ti-building"></i><span>${t('coreUi.companySettings')}</span>
    </div>`;
  }

  // Divider + sign out
  html += `<div class="profile-menu-divider"></div>`;
  html += `<div class="profile-menu-item danger" onclick="event.stopPropagation();doLogout()">
    <i class="ti ti-logout"></i><span>Sign Out</span>
  </div>`;

  menu.innerHTML = html;
}

function toggleProfileMenu(){
  const menu = document.getElementById('profileMenu');
  const chevron = document.getElementById('profileChevron');
  const isOpen = menu.classList.contains('open');
  if(!isOpen) buildProfileMenu();
  menu.classList.toggle('open');
  chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
  if(!isOpen){
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e){
        if(!document.getElementById('profileRow').contains(e.target)){
          menu.classList.remove('open');
          chevron.style.transform = '';
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 10);
  }
}

function showChangePassword(){
  const existing=document.getElementById('changePwdModal');if(existing)existing.remove();
  const modal=document.createElement('div');modal.id='changePwdModal';
  modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML=`<div style="background:#161b22;border:1px solid #1a2332;border-radius:14px;padding:28px;width:320px;max-width:90vw;">
    <div style="font-family:var(--font-head);font-size:16px;font-weight:700;margin-bottom:6px;color:#e6edf3;">Change Password</div>
    <div style="font-size:12px;color:#8b949e;margin-bottom:20px;">Enter your new password below</div>
    <input id="newPwd1" type="password" placeholder="New password" style="width:100%;background:#0a0f1e;border:1px solid #1a2332;border-radius:8px;padding:10px 12px;color:#e6edf3;font-size:13px;margin-bottom:10px;outline:none;box-sizing:border-box;">
    <input id="newPwd2" type="password" placeholder="Confirm new password" style="width:100%;background:#0a0f1e;border:1px solid #1a2332;border-radius:8px;padding:10px 12px;color:#e6edf3;font-size:13px;margin-bottom:14px;outline:none;box-sizing:border-box;">
    <div id="pwdErr" style="font-size:12px;color:#f85149;margin-bottom:10px;display:none;"></div>
    <div style="display:flex;gap:8px;">
      <button onclick="document.getElementById('changePwdModal').remove()" style="flex:1;background:none;border:1px solid #1a2332;border-radius:8px;padding:10px;color:#8b949e;cursor:pointer;font-size:13px;">${t('common.cancel')}</button>
      <button onclick="doChangePassword()" style="flex:1;background:linear-gradient(135deg,#1a56db,#2563eb);border:none;border-radius:8px;padding:10px;color:#fff;cursor:pointer;font-size:13px;font-weight:600;">Update</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  document.getElementById('newPwd1').focus();
}

async function doChangePassword(){
  const p1=document.getElementById('newPwd1').value;
  const p2=document.getElementById('newPwd2').value;
  const err=document.getElementById('pwdErr');err.style.display='none';
  if(!p1||p1.length<6){err.textContent=t('authFlow.passwordMin6Chars');err.style.display='block';return;}
  if(p1!==p2){err.textContent=t('authFlow.passwordsDoNotMatch');err.style.display='block';return;}
  const btn=document.querySelector('#changePwdModal button:last-child');
  btn.textContent=t('authFlow.updating');btn.disabled=true;
  const{error}=await sb.auth.updateUser({password:p1});
  if(error){err.textContent=error.message;err.style.display='block';btn.textContent=t('authFlow.update');btn.disabled=false;}
  else{document.getElementById('changePwdModal').remove();alert(t('authFlow.passwordUpdatedSuccess'));}
}

async function doLogout(){
  if(!confirm(t('confirm.signOut')))return;
  history=[];allMsgsHTML='';
  localStorage.removeItem(STORAGE_KEYS.h);localStorage.removeItem(STORAGE_KEYS.m);
  await sb.auth.signOut();
}

function saveRecentChat(label){
  let rc=[];try{rc=JSON.parse(localStorage.getItem(STORAGE_KEYS.rc)||'[]');}catch(e){}
  const now=new Date();
  const today=now.toDateString();
  const historySnapshot=JSON.stringify(history.slice(-30));
  const msgSnapshot=allMsgsHTML;
  const existing=rc.find(r=>r.date===today);
  if(existing){
    existing.time=now.toLocaleTimeString(getDateLocale('en-GB'),{hour:'2-digit',minute:'2-digit'});
    existing.label=label||existing.label;
    existing.history=historySnapshot;
    existing.msgs=msgSnapshot;
  } else {
    rc.unshift({date:today,time:now.toLocaleTimeString(getDateLocale('en-GB'),{hour:'2-digit',minute:'2-digit'}),label:label||t('authFlow.chat'),history:historySnapshot,msgs:msgSnapshot});
  }
  rc=rc.slice(0,5);
  localStorage.setItem(STORAGE_KEYS.rc,JSON.stringify(rc));
  loadRecentChats();
}

function loadRecentChats(){
  let rc=[];try{rc=JSON.parse(localStorage.getItem(STORAGE_KEYS.rc)||'[]');}catch(e){}
  const el=document.getElementById('recentChats');if(!el)return;
  if(!rc.length){el.innerHTML=`<div style="padding:4px 10px;font-family:var(--mono);font-size:.65rem;color:#484f58">${t('empty.noRecentChats')}</div>`;return;}
  const today=new Date().toDateString();
  const yesterday=new Date(Date.now()-86400000).toDateString();
  el.innerHTML=rc.map(r=>{
    let lbl=r.date===today?t('authFlow.today')+' '+r.time:r.date===yesterday?t('authFlow.yesterday')+' '+r.time:new Date(r.date).toLocaleDateString(getDateLocale('en-GB'),{day:'numeric',month:'short'})+' '+r.time;
    return`<div class="recent-item" onclick="restoreChat(${rc.indexOf(r)})" title="${r.label||t('authFlow.chat')}"><i class="ti ti-clock"></i><span>${lbl}</span></div>`;
  }).join('');
}

function restoreChat(idx){
  let rc=[];try{rc=JSON.parse(localStorage.getItem(STORAGE_KEYS.rc)||'[]');}catch(e){}
  const chat=rc[idx||0];
  if(chat&&chat.history){
    try{history=JSON.parse(chat.history);}catch(e){history=[];}
    allMsgsHTML=chat.msgs||'';
  }
  const _lastView = (() => { try{ return localStorage.getItem('nes_last_view'); }catch(e){ return null; } })();
  if(_lastView && _lastView !== 'chat'){
    showView(_lastView);
    setTimeout(() => {
      document.querySelectorAll('.nav-item').forEach(el=>{
        const v = el.getAttribute('data-view');
        if(v === _lastView) el.classList.add('active');
        else el.classList.remove('active');
      });
    }, 500);
  } else {
    showView('chat');
  }
}

function bindNav(){
  document.querySelectorAll('.nav-item[data-view]').forEach(item=>{
    const freshItem=item.cloneNode(true);
    item.parentNode.replaceChild(freshItem,item);
    freshItem.addEventListener('click',()=>{
      const v=freshItem.dataset.view;
      document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
      freshItem.classList.add('active');
      showView(v);
      if(window.innerWidth<=900){
        document.getElementById('sidebar').classList.remove('open');
        const overlay=document.getElementById('sidebarOverlay');
        if(overlay){overlay.style.display='none';overlay.style.pointerEvents='none';overlay.style.opacity='0';}
      }
    });
  });
}

function showView(view){
  // Module access enforcement
  if(userClientId && window.clientModules){
    const mods = window.clientModules;
    const tierOk=hasTierModule(['operations','workforce','infrastructure']);
    const blocked = {
      'ceo': !tierOk,
      'command': mods.nes_command === false,
      'intel': !tierOk,
      'image': mods.image_gen === false,
    };
    if(blocked[view]){
      showToast(t('toast.moduleNotIncluded'));
      return;
    }
  }
  // Always hide sidebar overlay on any view change
  const _ov=document.getElementById('sidebarOverlay');
  if(_ov){_ov.style.display='none';_ov.style.pointerEvents='none';_ov.style.opacity='0';}
  if(window.innerWidth<=900){const _sb=document.getElementById('sidebar');if(_sb)_sb.classList.remove('open');}
  try{ localStorage.setItem('nes_last_view', view); }catch(e){}
  document.querySelectorAll('.nav-item[data-view]').forEach(el=>{
    el.classList.toggle('active', el.getAttribute('data-view') === view);
  });
  currentView=view;
  localStorage.setItem('nesai_view',view);
  if(view!=='ceo')window._ceoRendered=false;
  if(view!=='command'&&window._teamHubVisible)hideTeamHub();
  const clearBtn=document.getElementById('clearBtn');
  if(clearBtn)clearBtn.style.display=['chat','docs','image'].includes(view)?'grid':'none';
  if(['chat','docs','image'].includes(view)){showChatInterface(view);if(view==='image')loadUsageFromServer();}
  else if(view==='ceo'){showCEODashboard();}
  else if(view==='partner_dashboard'){showPartnerDashboard();}
  else if(view==='command'){showCommandCentre();}
  else if(view==='leads'){showLeadsPage();}
  else if(view==='briefcase'){showBriefcasePage();}
  else if(view==='whatsapp'){showWhatsAppPage();}
  else if(view==='clientmgr'){showClientManager();}
  else if(view==='sales'){showSalesPortal();}
  else if(view==='mycredentials'){showMyCredentials();}
  else if(view==='analytics'){showAnalytics();}
  else if(view==='adminstatus'){showAdminStatus();}
  else if(view==='apicredits'){showApiCredits();}
  else if(view==='syslogs'){showSysLogs();}
  else if(view==='incidents'){showIncidents();}
  else if(view==='pricing'){showPricing();}
  else if(view==='deen'){showDeen();}
  else if(view==='inbox'){showInbox();}
  else if(view==='team'){showTeam();}
}
