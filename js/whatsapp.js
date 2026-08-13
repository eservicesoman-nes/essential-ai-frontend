// whatsapp.js — extracted from index.html, NES Locale Phase 0
// 3 functions, zero logic changes

async function showWhatsAppPage(){
  const mc=document.getElementById('mainContent');
  mc.style.overflow='auto';
  mc.innerHTML=`
    <div style="padding:11px 18px 11px 60px;border-bottom:1px solid var(--border);flex-shrink:0;">
      <div style="font-family:var(--mono);font-size:.8rem;color:var(--nes-blue);font-weight:800;">WHATSAPP AUTO-REPLY</div>
      <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);" id="whatsappSubtitle">Loading...</div>
    </div>
    <div class="page scrollable" id="whatsappContent"><div style="text-align:center;padding:40px;color:var(--muted);font-family:var(--mono);font-size:.8rem;">Loading messages...</div></div>`;
  await loadWhatsAppMessages();
}

async function loadWhatsAppMessages(){
  try{
    const res=await fetch(`${API_URL}/api/client/${userClientId}/whatsapp-messages`,{headers:{'Authorization':'Bearer '+session.access_token}});
    const data=await res.json();
    const messages=data.messages||[];
    document.getElementById('whatsappSubtitle').textContent=`${messages.length} messages received`;
    document.getElementById('whatsappContent').innerHTML=`
      <div class="leads-table">
        <div class="lt-header"><div>Contact</div><div>Phone</div><div>Message</div><div>Received</div></div>
        <div id="whatsappRows">${renderWhatsAppRows(messages)}</div>
      </div>`;
  }catch(e){
    document.getElementById('whatsappContent').innerHTML=`<div style="text-align:center;padding:40px;color:#f85149;font-family:var(--mono);">Error: ${e.message}</div>`;
  }
}

function renderWhatsAppRows(messages){
  if(!messages.length)return'<div style="padding:20px;text-align:center;color:var(--muted);font-family:var(--mono);font-size:.8rem;">No WhatsApp messages yet</div>';
  return messages.map(m=>{
    const date=new Date(m.received_at);const timeAgo=getTimeAgo(date);
    return`<div class="lt-row"><div>${m.contact_name||'Unknown'}</div><div class="lead-email">${m.from_number}</div><div>${(m.message_text||'').substring(0,80)}</div><div class="lead-time">${timeAgo}</div></div>`;
  }).join('');
}
