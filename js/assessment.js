// assessment.js — in-app sales assessment form (v2). Internal screen: English only.
// Access: nesadmin, nes_partner, or users granted_modules contains 'assessment'.
// Saves to public.client_assessments (RLS: own rows; nesadmin all).
const ASM_STEPS=['Contact','Company','Needs','Technical','Commercial','Next steps'];
const ASM_MODULES=['AI Chatbot','Sara AI Receptionist','CEO Dashboard','Social Media','Lead Capture','Intelligence Feed','WhatsApp Alerts','Layla Follow-Up','Adam Sales Agent'];
let _asm=null;

function asmCanUse(){return ['nesadmin','nes_partner'].includes(userRole)||(window.userGrantedModules||[]).includes('assessment');}
function asmEsc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function asmToday(){return new Date().toISOString().slice(0,10);}
function asmFresh(){return {step:0,v:{currency:'OMR',billing_cycle:'monthly',trial_days:7,trial_start_date:asmToday(),setup_fee_agreed:false,modules:[]}};}
function asmSet(k,val){_asm.v[k]=val;}

function asmField(k,label,o){
  o=o||{};
  const val=asmEsc(_asm.v[k]);
  const req=o.req?' <span style="color:var(--red,#f85149);">*</span>':'';
  let inp;
  if(o.area) inp='<textarea class="form-input" rows="3" placeholder="'+asmEsc(o.ph||'')+'" oninput="asmSet(\''+k+'\',this.value)" style="width:100%;resize:vertical;">'+val+'</textarea>';
  else inp='<input class="form-input" type="'+(o.type||'text')+'" value="'+val+'" placeholder="'+asmEsc(o.ph||'')+'" '+(o.min!=null?'min="'+o.min+'" ':'')+(o.max!=null?'max="'+o.max+'" ':'')+'oninput="asmSet(\''+k+'\',this.value)" style="width:100%;">';
  return '<div style="margin-bottom:14px;"><div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px;">'+label+req+'</div>'+inp+'</div>';
}
function asmChoice(k,label,opts){
  const cur=_asm.v[k];
  const b=opts.map(o=>{const val=o[0],txt=o[1],on=String(cur)===String(val);
    return '<button type="button" onclick="asmPick(\''+k+'\',\''+asmEsc(val)+'\')" style="padding:8px 14px;border-radius:8px;cursor:pointer;font-size:.75rem;font-family:var(--mono);border:1px solid '+(on?'var(--nes-blue,#409cff)':'var(--border)')+';background:'+(on?'rgba(64,156,255,.12)':'none')+';color:'+(on?'var(--nes-blue,#409cff)':'var(--muted)')+';">'+asmEsc(txt)+'</button>';}).join('');
  return '<div style="margin-bottom:14px;"><div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px;">'+label+'</div><div style="display:flex;gap:8px;flex-wrap:wrap;">'+b+'</div></div>';
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
  if(s===0) return asmField('decision_maker','Decision maker — full name',{req:1,ph:'Ahmed Al Rashdi'})+asmField('decision_maker_title','Job title',{ph:'CEO / Managing Director / IT Manager'})+asmField('email','Company email',{req:1,type:'email',ph:'ahmed@company.com'})+asmField('phone','Phone / WhatsApp',{type:'tel',ph:'+968 ...'})+asmField('other_decision_makers','Who else is involved in the decision?',{ph:'e.g. IT Manager, Finance Director'})+asmField('assessed_by','Assessment conducted by',{req:1,ph:'NES team member name'});
  if(s===1) return asmField('company_name','Company name',{req:1})+asmField('website','Website',{ph:'https://company.com'})+asmField('country','Country',{ph:'Oman'})+asmChoice('language','Main customer language',[['Arabic','Arabic'],['English','English'],['Portuguese','Portuguese'],['Other','Other']])+asmField('industry','Industry',{ph:'e.g. construction, retail, logistics'})+asmField('departments','Number of departments',{type:'number',min:1,ph:'e.g. 4'});
  if(s===2){
    const mods=ASM_MODULES.map(m=>{const on=_asm.v.modules.indexOf(m)>=0;return '<button type="button" onclick="asmToggleModule(\''+asmEsc(m)+'\')" style="padding:8px 12px;border-radius:8px;cursor:pointer;font-size:.72rem;font-family:var(--mono);border:1px solid '+(on?'var(--nes-blue,#409cff)':'var(--border)')+';background:'+(on?'rgba(64,156,255,.12)':'none')+';color:'+(on?'var(--nes-blue,#409cff)':'var(--muted)')+';">'+asmEsc(m)+'</button>';}).join('');
    return asmField('current_tools','Current tools they use',{area:1,ph:'e.g. WhatsApp, Excel, Outlook, custom CRM'})+asmField('primary_pain','Primary pain point',{area:1,ph:'e.g. missing leads after hours, no pipeline visibility'})+'<div style="margin-bottom:14px;"><div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);letter-spacing:.5px;text-transform:uppercase;margin-bottom:6px;">Priority modules</div><div style="display:flex;gap:8px;flex-wrap:wrap;">'+mods+'</div></div>'+asmChoice('expected_leads_range','Expected monthly leads',[['1-10','1–10'],['11-50','11–50'],['51-100','51–100'],['100+','100+']])+asmChoice('response_time','Expected response time to leads',[['Immediate (< 1 min)','Immediate'],['Within 5 minutes','5 mins'],['Within 1 hour','1 hour'],['Same day','Same day']]);
  }
  if(s===3) return asmYN('has_facebook','Facebook Business page (and Instagram)?')+asmYN('has_whatsapp','WhatsApp Business number?')+asmYN('has_crm','Uses a CRM?')+(_asm.v.has_crm===true?asmField('crm_name','Which CRM?',{ph:'e.g. Salesforce, HubSpot, Zoho'}):'');
  if(s===4){
    const eur=_asm.v.currency==='EUR';
    const plans=[['presence','AI Presence',eur?'price as per NES proposal':'OMR 59/mo'],['operations','AI Operations',eur?'price as per NES proposal':'OMR 159/mo'],['workforce','AI Workforce',eur?'price as per NES proposal':'OMR 299/mo'],['infrastructure','AI Infrastructure','custom, per contract']];
    return asmChoice('currency','Currency',[['OMR','OMR (Oman)'],['EUR','EUR (Portugal)']])+asmChoice('plan_recommended','Plan recommended by NES *',plans.map(p=>[p[0],p[1]+' — '+p[2]]))+asmChoice('billing_cycle','Billing cycle',[['monthly','Monthly'],['annual','Annual (saves 15%)']])+asmYN('budget_confirmed','Budget confirmed?')+asmChoice('decision_timeline','Decision timeline',[['Immediately','Immediately'],['Within 2 weeks','2 weeks'],['1 month','1 month'],['2-3 months','2–3 months'],['6+ months','6+ months']])+
      '<label style="display:flex;gap:10px;align-items:flex-start;font-size:.78rem;color:var(--text);cursor:pointer;margin-top:6px;"><input type="checkbox" '+(_asm.v.setup_fee_agreed?'checked ':'')+'onchange="asmSet(\'setup_fee_agreed\',this.checked)" style="margin-top:3px;"><span>I told the client about the one-time setup fee ('+(eur?'€230':'OMR 99')+') upfront. It is payable when they continue after the trial; any waiver needs an individual agreement with NES.</span></label>'+
      '<div style="font-size:.68rem;color:var(--muted);margin-top:8px;">Prices before VAT. Social media account creation (Meta) is a paid extra, only on request after the trial.</div>';
  }
  const end=asmTrialEnd();
  return asmField('trial_start_date','Trial start date',{type:'date'})+asmChoice('trial_days','Trial length',[['7','7 days (default)'],['14','14 days'],['30','1 month']])+'<div style="font-size:.72rem;color:var(--muted);margin:-6px 0 14px;">Trial ends: '+(end||'—')+'</div>'+asmField('follow_up_date','Follow-up date',{type:'date'})+asmField('notes','Additional notes',{area:1,ph:'Requirements, concerns, observations from the meeting'});
}
function asmTrialEnd(){
  const s=_asm.v.trial_start_date;if(!s)return '';
  const d=new Date(s+'T00:00:00');if(isNaN(d))return '';
  d.setDate(d.getDate()+(_asm.v.trial_days||7));
  return d.toISOString().slice(0,10);
}

function asmRender(){
  const mc=document.getElementById('mainContent');
  const s=_asm.step,last=s===ASM_STEPS.length-1;
  const tabs=ASM_STEPS.map((n,i)=>'<div onclick="asmGo('+i+')" style="cursor:pointer;padding:8px 12px;font-family:var(--mono);font-size:.68rem;white-space:nowrap;border-bottom:2px solid '+(i===s?'var(--nes-blue,#409cff)':'transparent')+';color:'+(i===s?'var(--nes-blue,#409cff)':i<s?'var(--green,#3fb950)':'var(--muted)')+';">'+(i+1)+'. '+n+'</div>').join('');
  mc.style.overflow='auto';
  mc.innerHTML='<div style="padding-block:11px;padding-inline-end:var(--header-clearance);padding-inline-start:60px;border-bottom:1px solid var(--border);flex-shrink:0;"><div style="font-family:var(--mono);font-size:.8rem;color:var(--nes-blue);font-weight:800;">Client Assessment</div><div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);">Step '+(s+1)+' of '+ASM_STEPS.length+' — '+ASM_STEPS[s]+'</div></div>'+
    '<div style="display:flex;overflow-x:auto;border-bottom:1px solid var(--border);flex-shrink:0;">'+tabs+'</div>'+
    '<div class="page" style="overflow-y:auto;flex:1;"><div style="max-width:640px;padding:18px 0 60px;">'+asmStepHtml()+
    '<div id="asmErr" style="display:none;margin:10px 0;padding:10px 14px;border-radius:8px;font-size:.75rem;background:rgba(248,81,73,.1);border:1px solid rgba(248,81,73,.3);color:#f85149;"></div>'+
    '<div style="display:flex;justify-content:space-between;margin-top:18px;">'+
    '<button type="button" onclick="asmGo('+(s-1)+')" style="visibility:'+(s===0?'hidden':'visible')+';background:none;border:1px solid var(--border);border-radius:8px;padding:9px 18px;color:var(--muted);cursor:pointer;font-family:var(--mono);font-size:.75rem;">Back</button>'+
    '<button type="button" id="asmNext" onclick="'+(last?'asmSave()':'asmGo('+(s+1)+')')+'" style="background:var(--nes-btn-grad,#1a56db);border:none;border-radius:8px;padding:9px 22px;color:#fff;cursor:pointer;font-family:var(--mono);font-size:.75rem;font-weight:700;">'+(last?'Save assessment':'Next')+'</button></div></div></div>';
}
function asmGo(n){if(n<0||n>=ASM_STEPS.length)return;_asm.step=n;asmRender();const p=document.querySelector('#mainContent .page');if(p)p.scrollTop=0;}

async function showAssessment(){
  const mc=document.getElementById('mainContent');
  if(!asmCanUse()){mc.innerHTML='<div style="padding:40px;color:var(--muted);font-family:var(--mono);font-size:.8rem;">You do not have access to the assessment form. Ask NES to enable it for you.</div>';return;}
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
    mc.innerHTML='<div style="padding:60px 24px;text-align:center;"><div style="font-size:2rem;color:#3fb950;margin-bottom:10px;"><i class="ti ti-circle-check"></i></div><div style="font-family:var(--mono);font-size:1rem;font-weight:800;margin-bottom:8px;">Assessment saved</div><div style="font-size:.8rem;color:var(--muted);max-width:420px;margin:0 auto 22px;line-height:1.6;">The assessment has been saved. NES will create the client account from it.</div><button onclick="_asm=null;showAssessment()" style="background:var(--nes-btn-grad,#1a56db);border:none;border-radius:8px;padding:10px 22px;color:#fff;cursor:pointer;font-family:var(--mono);font-size:.75rem;font-weight:700;">New assessment</button></div>';
    _asm=null;
  }catch(e){
    if(btn){btn.disabled=false;btn.textContent='Save assessment';}
    asmErr('Save failed: '+(e&&e.message?e.message:'unknown error')+'. Please try again.');
  }
}
window.showAssessment=showAssessment;
