// globals.js — top-level code not inside named function declarations
// REVIEW REQUIRED: verify placement, may need splitting across modules

// ============================================================
// ⚙️  NES AI — CONFIGURATION (UPDATE THESE VALUES)
// ============================================================
const SUPABASE_URL='https://sfpfjjdtczvuxyhjievt.supabase.co';
const SUPABASE_ANON='sb_publishable_MH7rnJ7r8_-1TzGXcieNfA_NXoHQZbm';
const API_URL='https://api.essential-services.org';
const ROCKET_URL='https://chat.essential-services.org';
const LOGO_URL='https://files.catbox.moe/adhf8n.png';
// ============================================================

const PLAN_LIMITS={
  free:{name:'Free',price:0,messages:50,images:3,docs:5},
  starter:{name:'Starter',price:7,messages:150,images:10,docs:25},
  pro:{name:'Pro',price:19,messages:500,images:25,docs:100},
  enterprise:{name:'Enterprise',price:0,messages:-1,images:-1,docs:-1,isContact:true}
};

const{createClient}=supabase;
const sb=createClient(SUPABASE_URL,SUPABASE_ANON);
let session=null,currentView='chat',history=[],busy=false;
let chatUsed=0,imagesUsed=0,docsUsed=0;
let userPlan='free',userRole='staff',allMsgsHTML='';
let userClientId=null;
const STORAGE_KEYS={h:'nesai_h',m:'nesai_m',u:'nesai_u',rc:'nesai_rc'};
const MODE_LABELS={chat:'ASK NESAI',docs:'DOCUMENTS MODE',image:'IMAGE GEN MODE'};

sb.auth.onAuthStateChange((_e,s)=>{session=s;if(s){const uid=s.user?.id;if(!window._appLoading&&(!window._appLoaded||window._loadedUid!==uid)){window._appLoading=true;window._loadedUid=uid;showApp(s.user).finally(()=>{window._appLoading=false;});}}else{window._appLoaded=false;window._loadedUid=null;window._appLoading=false;showAuthScreen();}});

checkRecoveryMode();

// ── System Logs ──────────────────────────────────────────────────

let _currentLogTab = 'nes_ai_errors';
let _allLogs = {};

// Clear interval when leaving logs view
const _origShowView = typeof showView === 'function' ? showView : null;

const _scriptLoadPromises={};

let _partnerTab = 'overview';

// Update pending badge

let imageCredits={dailyFreeRemaining:3,balance:0,freeAllowanceActive:true};

(function(){
  let startY=0, startTime=0, pulling=false;
  const indicator = document.createElement('div');
  indicator.id='pullIndicator';
  indicator.style.cssText='position:fixed;top:0;left:0;right:0;height:3px;background:var(--nes-blue);transform:scaleX(0);transform-origin:left;transition:transform .2s;z-index:9999;opacity:0;';
  document.body.appendChild(indicator);

  document.addEventListener('touchstart', (e)=>{
    let el = e.target;
    let scrollable = null;
    while(el && el !== document.body){
      if(el.scrollHeight > el.clientHeight){ scrollable = el; break; }
      el = el.parentElement;
    }
    const atTop = scrollable ? scrollable.scrollTop === 0 : true;
    if(atTop){
      startY = e.touches[0].clientY;
      startTime = Date.now();
      pulling = true;
    }
  }, {passive:true});

  document.addEventListener('touchmove', (e)=>{
    if(!pulling) return;
    const dy = e.touches[0].clientY - startY;
    if(dy > 0 && dy < 120){
      const pct = dy/120;
      indicator.style.opacity='1';
      indicator.style.transform='scaleX('+pct+')';
    }
  }, {passive:true});

  document.addEventListener('touchend', (e)=>{
    if(!pulling) return;
    const dy = e.changedTouches[0].clientY - startY;
    indicator.style.transform='scaleX(0)';
    indicator.style.opacity='0';
    pulling = false;
    if(dy > 80){
      const lastView = (() => { try{ return localStorage.getItem('nes_last_view'); }catch(e2){ return 'chat'; } })();
      if(lastView==='inbox' && window._inboxClientId) loadInboxEmails(window._inboxClientId);
      else if(lastView==='ceo') loadCeoFeed();
      else if(lastView==='platformstatus') checkPlatformStatus();
      else if(lastView==='apicredits') loadApiCredits();
      else showView(lastView||'chat');
    }
  }, {passive:true});
})();

let touchStartX=0;
document.addEventListener('touchstart',e=>{touchStartX=e.changedTouches[0].screenX;});
document.addEventListener('touchend',e=>{
  const tx=e.changedTouches[0].screenX;
  const sb=document.getElementById('sidebar');
  const overlay=document.getElementById('sidebarOverlay');
  if(tx-touchStartX<-50&&sb.classList.contains('open')){
    sb.classList.remove('open');
    if(overlay){overlay.style.display='none';overlay.style.pointerEvents='none';overlay.style.opacity='0';}
  }
});

window.switchTab=switchTab;window.doLogin=doLogin;window.doSignup=doSignup;window.doLogout=doLogout;
window.toggleTheme=toggleTheme;window.showPricing=showPricing;window.showView=showView;
window.sendMsg=sendMsg;window.handleAttach=handleAttach;window.toggleVoice=toggleVoice;
window.copyMsg=copyMsg;window.toggleSidebar=toggleSidebar;window.clearChat=clearChat;
window.filterLeads=filterLeads;window.exportLeads=exportLeads;
window.cmTab=cmTab;window.searchClients=searchClients;
window.showAddClientForm=showAddClientForm;window.showEditClientForm=showEditClientForm;
window.saveNewClient=saveNewClient;window.updateClient=updateClient;
window.deleteClient=deleteClient;window.saveClientModules=saveClientModules;
window.saveClientCreds=saveClientCreds;window.saveClientBranding=saveClientBranding;
window.saveClientAgents=saveClientAgents;window.saveClientBilling=saveClientBilling;
window.showClientManager=showClientManager;window.showToast=showToast;window.hideTeamHub=hideTeamHub;
window.showSalesPortal=showSalesPortal;window.switchPhTab=switchPhTab;window.loadPartnerMrr=loadPartnerMrr;window.loadLeadTrends=loadLeadTrends;window.onboardClient=onboardClient;window.showAnalytics=showAnalytics;window.loadAnalytics=loadAnalytics;
window.showAdminStatus=showAdminStatus;window.checkPlatformStatus=checkPlatformStatus;window.showAddServiceModal=showAddServiceModal;window.saveNewService=saveNewService;window.showAddApiModalQuick=showAddApiModalQuick;window.saveApiQuick=saveApiQuick;window.showApiCredits=showApiCredits;window.loadApiCredits=loadApiCredits;window.saveAllThresholds=saveAllThresholds;window.addApiService=addApiService;window.saveNewApiService=saveNewApiService;window.updateApiBalance=updateApiBalance;window.showMyCredentials=showMyCredentials;window.saveMyCredentials=saveMyCredentials;window.editItCred=editItCred;window.saveItCred=saveItCred;window.toggleFeedItem=toggleFeedItem;window.saveFeedSources=saveFeedSources;window.showUpgradePopup=showUpgradePopup;
window.openInNewTab=openInNewTab;

window.toggleInboxPanel=toggleInboxPanel;

window.toggleCeoPanel=toggleCeoPanel;

window.toggleStatusPanel=toggleStatusPanel;
window.addEmailForm=addEmailForm;
window.updateAddBtn=updateAddBtn;
window.autoFillImapSettings2=autoFillImapSettings2;
window.connectEmailAccountExtra=connectEmailAccountExtra;

window.autoFillImapSettings=autoFillImapSettings;
window.connectEmailAccount=connectEmailAccount;
window.loadEmailAccounts=loadEmailAccounts;
window.deleteEmailAccount=deleteEmailAccount;
window.showDeen=showDeen;
window.showInbox=showInbox;
window.loadInboxEmails=loadInboxEmails;
window.filterInbox=filterInbox;
window.showEmail=showEmail;

const _origShowEmail = showEmail;
window.showEmail = async function(idx){
  _origShowEmail(idx);
  const e = (window._renderedEmails || window._inboxEmails || [])[idx];
  if(!e) return;
  const clientId = window._inboxClientId;
  const {data:accs2} = await sb.from('email_accounts').select('id,email_address').eq('client_id',clientId);
  window._emailAccountIds = {};
  (accs2||[]).forEach(a => window._emailAccountIds[a.email_address] = a.id);
  const accountId = window._emailAccountIds[e.account_email];
  if(!accountId) return;
  const bodyEl = document.getElementById('emailBodyPanel');
  if(!bodyEl) return;
  const { body, isHtml } = await fetchEmailBody(accountId, e.uid);
  if(bodyEl){
    if(isHtml){
      if(typeof DOMPurify==='undefined')await loadScript('https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.1.6/purify.min.js');
      const safeHtml = DOMPurify.sanitize(body, {
        FORBID_TAGS: ['script','style','iframe','object','embed','form','input','link','meta','img'],
        ADD_ATTR: ['target']
      });
      DOMPurify.addHook('afterSanitizeAttributes', (node) => {
        if(node.tagName==='A'){ node.setAttribute('target','_blank'); node.setAttribute('rel','noopener noreferrer'); }
      });
      bodyEl.innerHTML = safeHtml && safeHtml.trim().length > 10
        ? '<div style="line-height:1.6;font-size:.82rem;color:var(--text);padding-bottom:20px;word-break:break-word;">'+safeHtml+'</div>'
        : '<div style="color:var(--muted);font-family:var(--mono);font-size:.72rem;text-align:center;padding:20px;">No readable content</div>';
      DOMPurify.removeHook('afterSanitizeAttributes');
    } else {
    let cleaned = body || '';
    cleaned = cleaned.replace(/(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g, (url) => {
      const clean = url.replace(/[.,;:!?)]+$/, '');
      try {
        const display = clean.length > 55 ? clean.substring(0,55)+'...' : clean;
        return '<a href="'+clean+'" target="_blank" rel="noopener noreferrer" style="color:#409cff;text-decoration:underline;cursor:pointer;">'+display+'</a>';
      } catch(e){ return url; }
    });
    cleaned = cleaned.replace(/[A-Za-z0-9+\/]{60,}={0,2}/g, '');
    cleaned = cleaned.replace(/--[\w\-]+=*\r?\n/g, '');
    cleaned = cleaned.replace(/^(Content-Type|Content-Transfer-Encoding|Content-Disposition|MIME-Version|X-[\w-]+):[^\n]*\n/gm, '');
    cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '');
    cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, '');
    cleaned = cleaned.replace(/<[^>]+>/g, ' ');
    cleaned = cleaned.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&#[0-9]+;/g,' ');
    cleaned = cleaned.replace(/[ \t]{2,}/g,' ').replace(/\n{3,}/g,'\n\n').trim();
    cleaned = cleaned.split('\n').filter(l => {
      const t = l.trim();
      if(t.length === 0) return true;
      const alphaRatio = (t.match(/[a-zA-Z0-9\u0600-\u06FF]/g)||[]).length / t.length;
      return alphaRatio > 0.3 || t.length < 10;
    }).join('\n');
    cleaned = cleaned.trim();
    cleaned = cleaned.replace(/(https?:\/\/[^\s]+)/g, (url) => {
      const clean = url.replace(/[.,;:!?)>]+$/, '');
      const display = clean.length > 55 ? clean.substring(0,52)+'...' : clean;
      return '<a href="'+clean+'" target="_blank" rel="noopener noreferrer" style="color:#409cff;text-decoration:underline;cursor:pointer;word-break:break-all;">'+display+'</a>';
    });
    // Convert plain text to readable paragraphs
    const paras = cleaned.split(/\n\n+/).map(p => p.replace(/\n/g,' ').trim()).filter(p=>p.length>0);
    const htmlBody = paras.length > 1
      ? paras.map(p=>'<p style="margin:0 0 10px;">'+p+'</p>').join('')
      : '<p style="margin:0;">'+cleaned.replace(/\n/g,'<br>')+'</p>';
    bodyEl.innerHTML = cleaned && cleaned.length > 10
      ? '<div style="line-height:1.6;font-size:.82rem;color:var(--text);padding-bottom:20px;word-break:break-word;">'+htmlBody+'</div>'
      : '<div style="color:var(--muted);font-family:var(--mono);font-size:.72rem;text-align:center;padding:20px;">No readable content</div>';
    }
  }
};
window.sendReply=sendReply;
window.upgradeContact=function(){document.querySelectorAll('div[style*="position:fixed"]').forEach(function(el){if(el.querySelector('.ti-check'))el.remove();});window.location.href='mailto:office@essential-services.org?subject=Upgrade Plan Request';};
window.closeUpgradePopup=function(){document.querySelectorAll('div[style*="position:fixed"]').forEach(function(el){if(el.style.zIndex==='9999')el.remove();});};
window.loadClientUsers=loadClientUsers;window.showInviteUserForm=showInviteUserForm;window.sendClientInvite=sendClientInvite;window.removeClientUser=removeClientUser;

window.buildCountryOptions=buildCountryOptions;window.selectClientDB=selectClientDB;window.restoreChat=restoreChat;
window.addCustomCredField=addCustomCredField;
// ── i18n (NES Locale Phase 2 scaffold) ──────────────────────────────
let _nesStrings = { en: {} };
let _nesLocale = 'en';

async function loadNesStrings(locale) {
  _nesLocale = locale || 'en';
  try {
    const promises = [fetch('strings/en.json').then(r => r.json())];
    if (_nesLocale !== 'en') promises.push(fetch('strings/' + _nesLocale + '.json').then(r => r.json()).catch(() => ({})));
    const results = await Promise.all(promises);
    if (_nesLocale === 'en') {
      _nesStrings = { en: results[0] || {} };
    } else {
      _nesStrings = { en: results[0] || {}, [_nesLocale]: results[1] || {} };
    }
  } catch (e) {
    _nesStrings = { en: {} };
  }
}

function t(keyPath, fallback) {
  const parts = keyPath.split('.');
  function dig(obj) {
    let cur = obj;
    for (const p of parts) { if (!cur) return undefined; cur = cur[p]; }
    return cur;
  }
  const localeVal = _nesStrings[_nesLocale] ? dig(_nesStrings[_nesLocale]) : undefined;
  if (localeVal !== undefined) return localeVal;
  const enVal = _nesStrings.en ? dig(_nesStrings.en) : undefined;
  if (enVal !== undefined) return enVal;
  return fallback || keyPath;
}

loadNesStrings('en');
window.t = t;
window.loadNesStrings = loadNesStrings;

function applyNesI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
}
window.applyNesI18n = applyNesI18n;
loadNesStrings('en').then(applyNesI18n);
