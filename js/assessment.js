// assessment.js — in-app sales assessment form (v2). Internal screen: English only.
// Access: nesadmin, nes_partner, or users granted_modules contains 'assessment'.
// Saves to public.client_assessments (RLS: own rows; nesadmin all).
const ASM_STEPS=['Contact','Company','Needs','Technical','Commercial','Next steps'];
const ASM_MODULES=['AI Chatbot','Sara AI Receptionist','CEO Dashboard','Social Media','Lead Capture','Intelligence Feed','WhatsApp Alerts','Layla Follow-Up','Adam Sales Agent'];
let _asm=null;

const ASM_INTRO=[
 'Who are we speaking with, and how do we reach them?',
 'The business behind the conversation.',
 'What hurts today, and what should NES AI fix first?',
 'What they already run, so we know what to connect.',
 'The plan we recommend and the terms we discussed.',
 'Set the trial window and the next touchpoint.'
];
function asmStyle(){
  if(document.getElementById('asm-style'))return;
  const st=document.createElement('style');st.id='asm-style';
  st.textContent=`
  .asm-bar{padding-block:12px;padding-inline-end:var(--header-clearance);padding-inline-start:60px;border-bottom:1px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:space-between;gap:12px;}
  .asm-title{font-size:.95rem;font-weight:700;letter-spacing:.01em;color:var(--text);}
  .asm-sub{font-family:var(--mono);font-size:.66rem;color:var(--muted);margin-top:2px;}
  .asm-ghost{background:transparent;border:1px solid var(--border);border-radius:8px;padding:7px 13px;color:var(--muted);cursor:pointer;font-family:var(--mono);font-size:.7rem;transition:border-color .15s,color .15s;}
  .asm-ghost:hover{border-color:var(--nes-blue);color:var(--nes-blue);}
  .asm-primary{background:var(--nes-btn-grad);border:none;border-radius:9px;padding:10px 24px;color:#fff;cursor:pointer;font-family:var(--ui);font-size:.8rem;font-weight:700;letter-spacing:.01em;box-shadow:0 4px 14px -4px rgba(37,99,235,.55);transition:transform .12s,box-shadow .12s,opacity .15s;}
  .asm-primary:hover{transform:translateY(-1px);box-shadow:0 8px 20px -6px rgba(37,99,235,.65);}
  .asm-primary:disabled{opacity:.6;cursor:default;transform:none;}
  .asm-ghost:focus-visible,.asm-primary:focus-visible,.asm-chip:focus-visible,.asm-rail-step:focus-visible,.asm-icon:focus-visible{outline:2px solid var(--nes-blue);outline-offset:2px;}
  .asm-rail{display:flex;padding:16px 20px 14px;border-bottom:1px solid var(--border);flex-shrink:0;overflow-x:auto;gap:0;}
  .asm-rail-step{flex:1 1 0;min-width:88px;display:flex;flex-direction:column;align-items:center;gap:7px;cursor:pointer;position:relative;background:none;border:none;padding:0;color:var(--muted);font-family:var(--ui);}
  .asm-rail-step::after{content:'';position:absolute;top:13px;inset-inline-start:calc(50% + 17px);width:calc(100% - 34px);height:2px;background:var(--border);border-radius:2px;}
  .asm-rail-step:last-child::after{display:none;}
  .asm-rail-step.done::after{background:var(--green);}
  .asm-node{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:.68rem;font-weight:700;border:2px solid var(--border);background:var(--bg);color:var(--muted);transition:all .2s;position:relative;z-index:1;}
  .asm-rail-step.done .asm-node{background:var(--green);border-color:var(--green);color:#fff;}
  .asm-rail-step.cur .asm-node{background:var(--nes-blue);border-color:var(--nes-blue);color:#fff;box-shadow:0 0 0 5px rgba(64,156,255,.18);}
  .asm-rail-lbl{font-size:.7rem;font-weight:600;white-space:nowrap;}
  .asm-rail-step.cur .asm-rail-lbl{color:var(--text);}
  .asm-rail-step.done .asm-rail-lbl{color:var(--text);opacity:.8;}
  .asm-wrap{max-width:700px;margin:0 auto;padding:26px 4px 70px;}
  .asm-h{font-size:1.25rem;font-weight:700;letter-spacing:-.01em;color:var(--text);margin:0 0 4px;}
  .asm-lead{font-size:.82rem;color:var(--muted);margin:0 0 22px;line-height:1.5;}
  .asm-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:22px 22px 6px;box-shadow:0 1px 0 rgba(255,255,255,.03) inset,0 12px 32px -18px rgba(0,0,0,.55);}
  .asm-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 16px;}
  .asm-f{grid-column:1 / -1;margin-bottom:18px;min-width:0;}
  .asm-f.half{grid-column:span 1;}
  .asm-lbl{font-size:.74rem;font-weight:600;color:var(--text);margin-bottom:7px;display:block;opacity:.9;}
  .asm-req{color:var(--red);margin-inline-start:3px;}
  .asm-card .form-input{background:var(--bg);border:1px solid var(--border);border-radius:9px;padding:10px 13px;font-size:.82rem;transition:border-color .15s,box-shadow .15s;}
  .asm-card .form-input::placeholder{color:var(--muted);opacity:.55;}
  .asm-card .form-input:focus{border-color:var(--nes-blue);box-shadow:0 0 0 3px rgba(64,156,255,.18);}
  .asm-chips{display:flex;gap:8px;flex-wrap:wrap;}
  .asm-chip{padding:8px 15px;border-radius:999px;cursor:pointer;font-size:.76rem;font-family:var(--ui);font-weight:600;border:1px solid var(--border);background:transparent;color:var(--muted);transition:all .15s;}
  .asm-chip:hover{border-color:var(--nes-blue);color:var(--text);}
  .asm-chip.on{border-color:var(--nes-blue);background:rgba(64,156,255,.14);color:var(--nes-blue);}
  .asm-chip.mod{border-radius:10px;}
  .asm-agree{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border:1px solid var(--border);border-radius:11px;background:var(--card2);font-size:.78rem;line-height:1.55;color:var(--text);cursor:pointer;}
  .asm-agree input{margin-top:3px;accent-color:var(--nes-blue);width:16px;height:16px;flex-shrink:0;}
  .asm-note{font-size:.7rem;color:var(--muted);line-height:1.5;}
  .asm-end{display:inline-flex;align-items:center;gap:7px;font-family:var(--mono);font-size:.72rem;color:var(--muted);padding:7px 12px;border:1px dashed var(--border);border-radius:9px;}
  .asm-end b{color:var(--text);font-weight:600;}
  .asm-err{display:none;margin:4px 0 14px;padding:11px 14px;border-radius:10px;font-size:.78rem;background:rgba(248,81,73,.1);border:1px solid rgba(248,81,73,.35);color:var(--red);}
  .asm-nav{display:flex;justify-content:space-between;align-items:center;margin:8px 0 0;padding:16px 0 20px;border-top:1px solid var(--border);}
  .asm-ok{padding:70px 24px;text-align:center;}
  .asm-ok-ic{width:64px;height:64px;border-radius:50%;margin:0 auto 18px;display:flex;align-items:center;justify-content:center;font-size:1.9rem;color:var(--green);background:rgba(63,185,80,.12);border:1px solid rgba(63,185,80,.35);animation:asmPop .35s ease-out;}
  @keyframes asmPop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
  .asm-list{max-width:780px;margin:0 auto;padding:22px 4px 70px;display:flex;flex-direction:column;gap:10px;}
  .asm-row{display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--card);border:1px solid var(--border);border-radius:12px;transition:border-color .15s;}
  .asm-row:hover{border-color:var(--border2);}
  .asm-av{width:40px;height:40px;border-radius:11px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.95rem;color:var(--nes-blue);background:rgba(64,156,255,.12);border:1px solid rgba(64,156,255,.25);}
  .asm-row.conv .asm-av{color:var(--green);background:rgba(63,185,80,.12);border-color:rgba(63,185,80,.3);}
  .asm-main{min-width:0;flex:1;}
  .asm-name{font-size:.88rem;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .asm-meta{font-family:var(--mono);font-size:.65rem;color:var(--muted);margin-top:4px;display:flex;flex-wrap:wrap;gap:4px 12px;}
  .asm-tag{font-size:.64rem;font-weight:600;padding:3px 10px;border-radius:999px;border:1px solid var(--border);color:var(--muted);white-space:nowrap;}
  .asm-tag.new{color:var(--nes-blue);border-color:rgba(64,156,255,.4);background:rgba(64,156,255,.1);}
  .asm-tag.converted{color:var(--green);border-color:rgba(63,185,80,.4);background:rgba(63,185,80,.1);}
  .asm-acts{display:flex;align-items:center;gap:8px;flex-shrink:0;}
  .asm-conv{background:transparent;border:1px solid var(--nes-blue);border-radius:8px;padding:7px 13px;color:var(--nes-blue);cursor:pointer;font-family:var(--ui);font-size:.72rem;font-weight:600;white-space:nowrap;transition:background .15s;}
  .asm-conv:hover{background:rgba(64,156,255,.12);}
  .asm-icon{background:transparent;border:1px solid var(--border);border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:var(--muted);cursor:pointer;transition:all .15s;}
  .asm-icon:hover{border-color:var(--red);color:var(--red);background:rgba(248,81,73,.08);}
  .asm-empty{text-align:center;padding:60px 20px;color:var(--muted);font-size:.85rem;border:1px dashed var(--border);border-radius:14px;}
  .asm-empty b{display:block;color:var(--text);font-size:.95rem;margin-bottom:6px;}
  @media (max-width:640px){
    .asm-grid{grid-template-columns:1fr;}
    .asm-f.half{grid-column:1 / -1;}
    .asm-card{padding:18px 16px 4px;}
    .asm-rail{padding:14px 12px 12px;}
    .asm-rail-step{min-width:54px;}
    .asm-rail-step:not(.cur) .asm-rail-lbl{display:none;}
    .asm-row{flex-wrap:wrap;}
    .asm-acts{width:100%;justify-content:flex-end;}
    .asm-bar{padding-inline-start:56px;}
  }
  @media (prefers-reduced-motion:reduce){.asm-ok-ic{animation:none;}.asm-primary,.asm-node{transition:none;}}
  `;
  document.head.appendChild(st);
}

function asmCanUse(){return ['nesadmin','nes_partner'].includes(userRole)||(window.userGrantedModules||[]).includes('assessment');}
function asmEsc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function asmToday(){return new Date().toISOString().slice(0,10);}
function asmFresh(){return {step:0,v:{currency:'OMR',billing_cycle:'monthly',trial_days:7,trial_start_date:asmToday(),setup_fee_agreed:false,modules:[]}};}
function asmSet(k,val){_asm.v[k]=val;}

function asmField(k,label,o){
  o=o||{};
  const val=asmEsc(_asm.v[k]);
  const req=o.req?'<span class="asm-req">*</span>':'';
  const id='asm_'+k;
  let inp;
  if(o.area) inp='<textarea id="'+id+'" class="form-input" rows="3" placeholder="'+asmEsc(o.ph||'')+'" oninput="asmSet(\''+k+'\',this.value)" style="resize:vertical;">'+val+'</textarea>';
  else inp='<input id="'+id+'" class="form-input" type="'+(o.type||'text')+'" value="'+val+'" placeholder="'+asmEsc(o.ph||'')+'" '+(o.min!=null?'min="'+o.min+'" ':'')+(o.max!=null?'max="'+o.max+'" ':'')+'oninput="asmSet(\''+k+'\',this.value)">';
  return '<div class="asm-f'+(o.half?' half':'')+'"><label class="asm-lbl" for="'+id+'">'+label+req+'</label>'+inp+'</div>';
}
function asmChoice(k,label,opts){
  const cur=_asm.v[k];
  const b=opts.map(o=>{const val=o[0],txt=o[1],on=String(cur)===String(val);
    return '<button type="button" class="asm-chip'+(on?' on':'')+'" aria-pressed="'+on+'" onclick="asmPick(\''+k+'\',\''+asmEsc(val)+'\')">'+asmEsc(txt)+'</button>';}).join('');
  return '<div class="asm-f"><span class="asm-lbl">'+label+'</span><div class="asm-chips">'+b+'</div></div>';
}
function asmPick(k,val){
  if(k==='has_facebook'||k==='has_whatsapp'||k==='has_crm'||k==='budget_confirmed'){_asm.v[k]=val==='true'?true:val==='false'?false:null;}
  else if(k==='trial_days'){_asm.v[k]=parseInt(val,10)||7;}
  else{_asm.v[k]=val;}
  asmRender();
}
function asmToggleModule(m){
  const a=_asm.v.modules,i=a.indexOf(m);
  if(i>=0)a.splice(i,1);else a.push(m);
  asmRender();
}
function asmYN(k,label){return asmChoice(k,label,[['true','Yes'],['false','No']]);}

function asmStepHtml(){
  const s=_asm.step;
  if(s===0) return asmField('decision_maker','Decision maker — full name',{req:1,ph:'Ahmed Al Rashdi',half:1})+asmField('decision_maker_title','Job title',{ph:'CEO / Managing Director / IT Manager',half:1})+asmField('email','Company email',{req:1,type:'email',ph:'ahmed@company.com',half:1})+asmField('phone','Phone / WhatsApp',{type:'tel',ph:'+968 ...',half:1})+asmField('other_decision_makers','Who else is involved in the decision?',{ph:'e.g. IT Manager, Finance Director'})+asmField('assessed_by','Assessment conducted by',{req:1,ph:'NES team member name'});
  if(s===1) return asmField('company_name','Company name',{req:1})+asmField('website','Website',{ph:'https://company.com',half:1})+asmField('country','Country',{ph:'Oman',half:1})+asmChoice('language','Main customer language',[['Arabic','Arabic'],['English','English'],['Portuguese','Portuguese'],['Other','Other']])+asmField('industry','Industry',{ph:'e.g. construction, retail, logistics',half:1})+asmField('departments','Number of departments',{type:'number',min:1,ph:'e.g. 4',half:1});
  if(s===2){
    const mods=ASM_MODULES.map(m=>{const on=_asm.v.modules.indexOf(m)>=0;return '<button type="button" class="asm-chip mod'+(on?' on':'')+'" aria-pressed="'+on+'" onclick="asmToggleModule(\''+asmEsc(m)+'\')">'+asmEsc(m)+'</button>';}).join('');
    return asmField('current_tools','Current tools they use',{area:1,ph:'e.g. WhatsApp, Excel, Outlook, custom CRM'})+asmField('primary_pain','Primary pain point',{area:1,ph:'e.g. missing leads after hours, no pipeline visibility'})+'<div class="asm-f"><span class="asm-lbl">Priority modules <span class="asm-note">(pick all that apply)</span></span><div class="asm-chips">'+mods+'</div></div>'+asmChoice('expected_leads_range','Expected monthly leads',[['1-10','1–10'],['11-50','11–50'],['51-100','51–100'],['100+','100+']])+asmChoice('response_time','Expected response time to leads',[['Immediate (< 1 min)','Immediate'],['Within 5 minutes','5 mins'],['Within 1 hour','1 hour'],['Same day','Same day']]);
  }
  if(s===3) return asmYN('has_facebook','Facebook Business page (and Instagram)?')+asmYN('has_whatsapp','WhatsApp Business number?')+asmYN('has_crm','Uses a CRM?')+(_asm.v.has_crm===true?asmField('crm_name','Which CRM?',{ph:'e.g. Salesforce, HubSpot, Zoho'}):'');
  if(s===4){
    const eur=_asm.v.currency==='EUR';
    const plans=[['presence','AI Presence',eur?'price as per NES proposal':'OMR 59/mo'],['operations','AI Operations',eur?'price as per NES proposal':'OMR 159/mo'],['workforce','AI Workforce',eur?'price as per NES proposal':'OMR 299/mo'],['infrastructure','AI Infrastructure','custom, per contract']];
    return asmChoice('currency','Currency',[['OMR','OMR (Oman)'],['EUR','EUR (Portugal)']])+asmChoice('plan_recommended','Plan recommended by NES *',plans.map(p=>[p[0],p[1]+' — '+p[2]]))+asmChoice('billing_cycle','Billing cycle',[['monthly','Monthly'],['annual','Annual (saves 15%)']])+asmYN('budget_confirmed','Budget confirmed?')+asmChoice('decision_timeline','Decision timeline',[['Immediately','Immediately'],['Within 2 weeks','2 weeks'],['1 month','1 month'],['2-3 months','2–3 months'],['6+ months','6+ months']])+
      '<div class="asm-f"><label class="asm-agree"><input type="checkbox" '+(_asm.v.setup_fee_agreed?'checked ':'')+'onchange="asmSet(\'setup_fee_agreed\',this.checked)"><span>I told the client about the one-time setup fee ('+(eur?'€230':'OMR 99')+') upfront. It is payable when they continue after the trial; any waiver needs an individual agreement with NES.</span></label></div>'+
      '<div class="asm-f asm-note">Prices before VAT. Social media account creation (Meta) is a paid extra, only on request after the trial.</div>';
  }
  const end=asmTrialEnd();
  return asmField('trial_start_date','Trial start date',{type:'date',half:1})+asmChoice('trial_days','Trial length',[['7','7 days (default)'],['14','14 days'],['30','1 month']])+'<div class="asm-f"><span class="asm-end"><i class="ti ti-calendar-event"></i>Trial ends <b>'+(end||'—')+'</b></span></div>'+asmField('follow_up_date','Follow-up date',{type:'date',half:1})+asmField('notes','Additional notes',{area:1,ph:'Requirements, concerns, observations from the meeting'});
}
function asmTrialEnd(){
  const s=_asm.v.trial_start_date;if(!s)return '';
  const d=new Date(s+'T00:00:00');if(isNaN(d))return '';
  d.setDate(d.getDate()+(_asm.v.trial_days||7));
  return d.toISOString().slice(0,10);
}

function asmRender(){
  asmStyle();
  const mc=document.getElementById('mainContent');
  const s=_asm.step,last=s===ASM_STEPS.length-1;
  const rail=ASM_STEPS.map((n,i)=>'<button type="button" class="asm-rail-step'+(i<s?' done':i===s?' cur':'')+'" onclick="asmGo('+i+')"'+(i===s?' aria-current="step"':'')+'><span class="asm-node">'+(i<s?'<i class="ti ti-check"></i>':(i+1))+'</span><span class="asm-rail-lbl">'+n+'</span></button>').join('');
  mc.style.overflow='auto';
  mc.innerHTML='<div class="asm-bar"><div><div class="asm-title">Client assessment</div><div class="asm-sub">Step '+(s+1)+' of '+ASM_STEPS.length+'</div></div><button type="button" class="asm-ghost" onclick="showAssessmentList()">Saved assessments</button></div>'+
    '<div class="asm-rail">'+rail+'</div>'+
    '<div class="page" style="overflow-y:auto;flex:1;"><div class="asm-wrap"><h2 class="asm-h">'+ASM_STEPS[s]+'</h2><p class="asm-lead">'+ASM_INTRO[s]+'</p>'+
    '<div class="asm-card"><div class="asm-grid">'+asmStepHtml()+'</div></div>'+
    '<div id="asmErr" class="asm-err" role="alert" style="margin-top:14px;"></div>'+
    '<div class="asm-nav">'+
    '<button type="button" class="asm-ghost" onclick="asmGo('+(s-1)+')" style="padding:10px 20px;visibility:'+(s===0?'hidden':'visible')+';">Back</button>'+
    '<button type="button" class="asm-primary" id="asmNext" onclick="'+(last?'asmSave()':'asmGo('+(s+1)+')')+'">'+(last?'Save assessment':'Continue')+'</button></div></div></div>';
}
function asmGo(n){if(n<0||n>=ASM_STEPS.length)return;_asm.step=n;asmRender();const p=document.querySelector('#mainContent .page');if(p)p.scrollTop=0;}

async function showAssessment(){
  const mc=document.getElementById('mainContent');
  if(!asmCanUse()){asmStyle();mc.innerHTML='<div class="asm-wrap"><div class="asm-empty"><b>No access yet</b>The assessment form is not enabled for your account. Ask NES to turn it on.</div></div>';return;}
  if(!_asm)_asm=asmFresh();
  if(!_asm.v.assessed_by){
    try{const{data:{user}}=await sb.auth.getUser();
      if(user){const{data}=await sb.from('profiles').select('full_name').eq('id',user.id).single();if(data&&data.full_name)_asm.v.assessed_by=data.full_name;}
    }catch(e){}
  }
  asmRender();
}

function asmErr(msg){const e=document.getElementById('asmErr');if(e){e.textContent=msg;e.style.display='block';}}

async function asmSave(){
  const v=_asm.v;
  const req=[['decision_maker','Decision maker name',0],['email','Company email',0],['assessed_by','Assessed by',0],['company_name','Company name',1],['plan_recommended','Recommended plan',4]];
  for(const r of req){if(!String(v[r[0]]||'').trim()){asmGo(r[2]);setTimeout(()=>asmErr('Please fill in: '+r[1]+'.'),0);return;}}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v.email).trim())){asmGo(0);setTimeout(()=>asmErr('Please enter a valid company email.'),0);return;}
  const days=Math.min(60,Math.max(1,parseInt(v.trial_days,10)||7));
  const txt=k=>(v[k]==null?'':String(v[k]).trim())||null;
  const payload={
    email:String(v.email).trim(),decision_maker:String(v.decision_maker).trim(),decision_maker_title:txt('decision_maker_title'),
    other_decision_makers:txt('other_decision_makers'),assessed_by:String(v.assessed_by).trim(),phone:txt('phone'),
    company_name:txt('company_name'),website:txt('website'),country:txt('country'),language:txt('language'),industry:txt('industry'),
    departments:parseInt(v.departments,10)||null,current_tools:txt('current_tools'),primary_pain:txt('primary_pain'),
    priority_module:v.modules.join(', ')||null,expected_leads_range:txt('expected_leads_range'),response_time:txt('response_time'),
    has_facebook:v.has_facebook==null?null:v.has_facebook,has_whatsapp:v.has_whatsapp==null?null:v.has_whatsapp,
    has_crm:v.has_crm==null?null:v.has_crm,crm_name:v.has_crm===true?txt('crm_name'):null,
    budget_confirmed:v.budget_confirmed==null?null:v.budget_confirmed,decision_timeline:txt('decision_timeline'),
    plan_recommended:v.plan_recommended,currency:v.currency||'OMR',billing_cycle:v.billing_cycle||'monthly',setup_fee_agreed:!!v.setup_fee_agreed,
    trial_start_date:v.trial_start_date||null,trial_days:days,follow_up_date:v.follow_up_date||null,notes:txt('notes'),status:'new'
  };
  const btn=document.getElementById('asmNext');if(btn){btn.disabled=true;btn.textContent='Saving...';}
  try{
    const{error}=await sb.from('client_assessments').insert(payload);
    if(error)throw error;
    const mc=document.getElementById('mainContent');
    mc.innerHTML='<div class="asm-ok"><div class="asm-ok-ic"><i class="ti ti-check"></i></div><h2 class="asm-h">Assessment saved</h2><p class="asm-lead" style="max-width:420px;margin:0 auto 24px;">NES will create the client account from it.</p><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;"><button type="button" class="asm-primary" onclick="_asm=null;showAssessment()">New assessment</button><button type="button" class="asm-ghost" style="padding:10px 18px;" onclick="showAssessmentList()">Saved assessments</button></div></div>';
    _asm=null;
  }catch(e){
    if(btn){btn.disabled=false;btn.textContent='Save assessment';}
    asmErr('Save failed: '+(e&&e.message?e.message:'unknown error')+'. Please try again.');
  }
}

// ---- Saved assessments list + Convert to client (nesadmin) ----
async function showAssessmentList(){
  asmStyle();
  const mc=document.getElementById('mainContent');
  if(!asmCanUse()){showAssessment();return;}
  mc.style.overflow='auto';
  mc.innerHTML='<div class="asm-wrap"><div class="asm-empty">Loading…</div></div>';
  const{data,error}=await sb.from('client_assessments').select('id,created_at,company_name,decision_maker,email,plan_recommended,currency,trial_days,status,client_id,assessed_by').order('created_at',{ascending:false}).limit(100);
  const isAdmin=userRole==='nesadmin';
  const hdr='<div class="asm-bar"><div><div class="asm-title">Saved assessments</div><div class="asm-sub">'+(isAdmin?'All assessments':'Your assessments')+(data?' · '+data.length:'')+'</div></div><button type="button" class="asm-primary" style="padding:8px 16px;" onclick="showAssessment()">New assessment</button></div>';
  if(error){mc.innerHTML=hdr+'<div class="asm-list"><div class="asm-err" style="display:block;">Could not load assessments: '+asmEsc(error.message)+'</div></div>';return;}
  const rows=(data||[]).map(a=>{
    const name=a.company_name||a.decision_maker||'(no name)';
    const st=a.status||'new';
    const conv=st==='converted';
    const del=(isAdmin&&!conv)?'<button type="button" class="asm-icon" onclick="asmDelete(\''+a.id+'\')" title="Delete assessment" aria-label="Delete assessment"><i class="ti ti-trash"></i></button>':'';
    const btn=(isAdmin&&!conv)?'<button type="button" class="asm-conv" onclick="asmConvert(\''+a.id+'\')">Convert to client</button>':'';
    const meta=[(a.created_at||'').slice(0,10),a.email||'',isAdmin?'by '+(a.assessed_by||'-'):''].filter(Boolean).map(x=>'<span>'+asmEsc(x)+'</span>').join('');
    return '<div class="asm-row'+(conv?' conv':'')+'"><div class="asm-av">'+asmEsc(name.trim().charAt(0).toUpperCase()||'?')+'</div><div class="asm-main"><div class="asm-name">'+asmEsc(name)+'</div><div class="asm-meta">'+meta+'</div></div><div class="asm-acts"><span class="asm-tag">'+asmEsc(a.plan_recommended||'-')+' · '+asmEsc(a.currency||'OMR')+'</span><span class="asm-tag '+asmEsc(st)+'">'+asmEsc(st)+'</span>'+btn+del+'</div></div>';
  }).join('');
  asmRefreshBadge();
  mc.innerHTML=hdr+'<div class="page" style="overflow-y:auto;flex:1;"><div class="asm-list">'+(rows||'<div class="asm-empty"><b>No assessments yet</b>Run your first one from the form.</div>')+'</div></div>';
}

async function asmConvert(id){
  if(userRole!=='nesadmin')return;
  const{data:a,error}=await sb.from('client_assessments').select('*').eq('id',id).single();
  if(error||!a){showToast('Could not load assessment');return;}
  if(!window._asmSaveWrapped&&typeof window.saveNewClient==='function'){
    const orig=window.saveNewClient;
    window.saveNewClient=async function(){
      const cid=window._asmConvertId;
      const nm=((document.getElementById('field_name')||{}).value||'').trim();
      await orig();
      if(cid)await asmLink(cid,nm);
    };
    window._asmSaveWrapped=true;
  }
  showAddClientForm();
  const setF=(k,v)=>{const el=document.getElementById('field_'+k);if(el&&v!=null&&v!=='')el.value=v;};
  const country=a.country||(a.currency==='EUR'?'Portugal':'Oman');
  setF('name',a.company_name||a.decision_maker);
  setF('email',a.email);
  setF('website',a.website);
  setF('industry',a.industry);
  setF('region',country);
  const cs=document.getElementById('field_country');
  if(cs&&[].some.call(cs.options,o=>o.value===country))cs.value=country;
  setF('language',a.language==='Arabic'?'Arabic':'English');
  setF('lead_email',a.email);
  const ps=document.getElementById('field_plan');
  if(ps&&[].some.call(ps.options,o=>o.value===a.plan_recommended))ps.value=a.plan_recommended;
  setF('trial_start',a.trial_start_date);
  setF('trial_duration_days',a.trial_days);
  window._asmConvertId=id;
  showToast('Prefilled from assessment — review, then click Create Client');
}

async function asmLink(id,name){
  try{
    if(!name)return;
    const since=new Date(Date.now()-5*60000).toISOString();
    const{data}=await sb.from('clients').select('id,name,created_at').eq('name',name).gte('created_at',since).order('created_at',{ascending:false}).limit(1);
    if(data&&data[0]){
      const{error}=await sb.from('client_assessments').update({status:'converted',client_id:data[0].id}).eq('id',id);
      if(!error){window._asmConvertId=null;asmRefreshBadge();}
    }
  }catch(e){}
}
async function asmDelete(id){
  if(userRole!=='nesadmin')return;
  if(!confirm('Delete this assessment permanently? This cannot be undone.'))return;
  const{data,error}=await sb.from('client_assessments').delete().eq('id',id).select('id');
  if(error){showToast('Delete failed: '+error.message);return;}
  if(!data||!data.length){showToast('Not deleted — converted assessments cannot be deleted');return;}
  showToast('Assessment deleted');
  showAssessmentList();
}

// ---- "New" counter on the sidebar item (nesadmin only; RLS also limits to what they may see) ----
async function asmRefreshBadge(){
  try{
    const nav=document.getElementById('assessmentWorkspaceNav');
    if(!nav||typeof sb==='undefined'||typeof userRole==='undefined'||userRole!=='nesadmin')return;
    const{count,error}=await sb.from('client_assessments').select('id',{count:'exact',head:true}).eq('status','new');
    if(error)return;
    let b=document.getElementById('asmNavBadge');
    if(!count){if(b)b.remove();return;}
    if(!b){b=document.createElement('span');b.id='asmNavBadge';b.className='nav-badge';b.style.cssText='background:rgba(64,156,255,.18);color:var(--nes-blue);';nav.appendChild(b);}
    b.textContent=count>99?'99+':String(count);
    b.title=count+' new assessment'+(count===1?'':'s');
  }catch(e){}
}
window.asmRefreshBadge=asmRefreshBadge;
setTimeout(asmRefreshBadge,4000);setTimeout(asmRefreshBadge,12000);setInterval(asmRefreshBadge,60000);
window.asmDelete=asmDelete;
window.showAssessment=showAssessment;
window.showAssessmentList=showAssessmentList;
window.asmConvert=asmConvert;
