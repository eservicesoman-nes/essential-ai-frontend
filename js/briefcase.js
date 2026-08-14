// briefcase.js — extracted from index.html, NES Locale Phase 0
// 16 functions, zero logic changes

async function showBriefcasePage(){
  const mc=document.getElementById('mainContent');
  mc.style.overflow='hidden';
  window._briefcaseChatHistory=[];
  window._briefcaseDocContext='';
  window._briefcaseDocContextReady=false;
  mc.innerHTML=`
    <div style="padding:11px 170px 11px 60px;border-bottom:1px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:space-between;">
      <div><div style="font-family:var(--mono);font-size:.8rem;color:var(--nes-blue);font-weight:800;">${t('sectionTitle.briefcase')}</div><div style="font-family:var(--mono);font-size:.7rem;color:#3fb950;font-weight:700;" id="briefcaseSubtitle">${t('common.loading')}</div></div>
      <label style="font-size:.7rem;padding:5px 11px;border-radius:6px;border:1px solid rgba(64,156,255,0.4);background:rgba(64,156,255,0.15);color:var(--nes-blue);cursor:pointer;font-family:var(--mono);font-weight:700;display:flex;align-items:center;gap:5px;">
        <i class="ti ti-upload" style="font-size:13px"></i> Upload
        <input type="file" id="vaultUploadInput" style="display:none;" onchange="uploadVaultFile(this.files[0])" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.webp">
      </label>
    </div>
    <div class="briefcase-two-col" style="flex:1;display:flex;overflow:hidden;min-height:0;position:relative;">
      <div class="briefcase-filelist" id="briefcaseFileListPanel" style="width:190px;flex-shrink:0;display:flex;flex-direction:column;border-right:1px solid var(--border);">
        <div style="padding:10px 10px 8px;flex-shrink:0;">
          <input type="text" id="briefcaseSearchInput" placeholder="${t('placeholder.searchDocs')}" oninput="filterBriefcaseFiles(this.value)" style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text);font-family:var(--ui);font-size:.7rem;outline:none;box-sizing:border-box;">
        </div>
        <div style="flex:1;overflow-y:auto;padding:0 10px 12px;" id="briefcaseFileList">
          <div style="text-align:center;padding:20px 0;color:var(--muted);font-family:var(--mono);font-size:.7rem;">${t('common.loading')}</div>
        </div>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;min-width:0;">
        <div style="padding:10px 16px;border-bottom:1px solid var(--border);font-family:var(--mono);font-size:.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;flex-shrink:0;display:flex;align-items:center;gap:8px;">
          <button class="briefcase-panel-toggle" onclick="toggleBriefcaseFileList()" style="display:none;background:none;border:1px solid var(--border);border-radius:6px;color:var(--text);width:26px;height:26px;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;"><i class="ti ti-folder" style="font-size:13px"></i></button>
          <span>Ask NES AI</span>
        </div>
        <div id="briefcaseChatMessages" style="flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:10px;"></div>
        <div style="padding:12px 16px;border-top:1px solid var(--border);flex-shrink:0;">
          <div style="display:flex;align-items:center;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:22px;padding:6px 8px 6px 14px;">
            <div style="position:relative;width:22px;height:22px;flex-shrink:0;">
              <div style="width:22px;height:22px;border-radius:50%;border:2px solid #1a56db;background:#0a0f1e;display:flex;align-items:center;justify-content:center;">
                <div style="width:7px;height:7px;border-radius:50%;background:#409cff;position:relative;">
                  <div style="position:absolute;inset:-5px;border-radius:50%;border:1.5px solid #409cff;animation:ping 2s ease-out infinite;"></div>
                </div>
              </div>
            </div>
            <input type="text" id="briefcaseChatInput" placeholder="${t('placeholder.askAboutDocuments')}" style="flex:1;background:none;border:none;outline:none;color:var(--text);font-family:var(--ui);font-size:.82rem;">
            <button onclick="sendBriefcaseChatMessage()" style="background:var(--nes-btn-grad);border:none;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;color:#fff;cursor:pointer;flex-shrink:0;"><i class="ti ti-arrow-up" style="font-size:14px"></i></button>
          </div>
        </div>
      </div>
    </div>`;
  document.getElementById('briefcaseChatInput').addEventListener('keypress', e=>{ if(e.key==='Enter') sendBriefcaseChatMessage(); });
  await loadVaultFiles();
  loadBriefcaseDocContext();
  loadBriefcaseChatHistory();
}

async function loadBriefcaseChatHistory(){
  try{
    const res = await fetch(`${API_URL}/api/chat/docs/history`, {
      headers:{'Authorization':'Bearer '+session.access_token}
    });
    const data = await res.json();
    const msgs = data.messages || [];
    window._briefcaseChatHistory = msgs.map(m => ({ role: m.role, content: m.content }));
    for(const m of msgs){
      appendBriefcaseChatMsg(m.role === 'user' ? 'user' : 'ai', m.content);
    }
  }catch(e){
    console.warn('Could not load Briefcase chat history', e.message);
  }
}

async function loadVaultFiles(){
  try{
    const[filesRes,quotaRes]=await Promise.all([
      fetch(`${API_URL}/api/vault/list`,{headers:{'Authorization':'Bearer '+session.access_token}}),
      fetch(`${API_URL}/api/vault/quota`,{headers:{'Authorization':'Bearer '+session.access_token}}),
    ]);
    const{files}=await filesRes.json();
    const quota=await quotaRes.json();
    window._vaultFiles=files||[];

    const usedGB=(quota.usedBytes/1073741824).toFixed(2);
    const totalGB=(quota.totalBytes/1073741824).toFixed(1);

    document.getElementById('briefcaseSubtitle').textContent=`${files?.length||0} files · ${usedGB}GB of ${totalGB}GB used`;
    const listEl=document.getElementById('briefcaseFileList');
    if(listEl)listEl.innerHTML=renderVaultRows(files||[]);
  }catch(e){
    const listEl=document.getElementById('briefcaseFileList');
    if(listEl)listEl.innerHTML=`<div style="text-align:center;padding:20px 0;color:#f85149;font-family:var(--mono);font-size:.7rem;">Error loading files</div>`;
  }
}

function toggleBriefcaseFileList(){const panel=document.getElementById('briefcaseFileListPanel');if(panel)panel.classList.toggle('open');}

function filterBriefcaseFiles(query){
  const files = window._vaultFiles || [];
  const q = query.trim().toLowerCase();
  const filtered = q ? files.filter(f => (f.file_name||'').toLowerCase().includes(q)) : files;
  const listEl = document.getElementById('briefcaseFileList');
  if(listEl) listEl.innerHTML = renderVaultRows(filtered);
}

function formatBytes(bytes){
  if(!bytes)return'0 B';
  const units=['B','KB','MB','GB'];let i=0;let n=bytes;
  while(n>=1024&&i<units.length-1){n/=1024;i++;}
  return`${n.toFixed(i===0?0:1)} ${units[i]}`;
}

function renderVaultRows(files){
  if(!files.length)return`<div style="text-align:center;padding:20px 0;color:var(--muted);font-family:var(--mono);font-size:.7rem;">${t('empty.noFiles')}</div>`;
  return files.map(f=>{
    return`<div id="vault-row-${f.id}" style="background:var(--card);border:1px solid var(--border);border-radius:7px;padding:8px 9px;margin-bottom:6px;">
      <i class="ti ti-file" style="color:var(--muted);font-size:13px;"></i>
      <div style="font-size:.66rem;color:var(--text);margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${f.file_name}">${f.file_name}</div>
      <div style="font-size:.58rem;color:var(--muted);margin-bottom:6px;">${formatBytes(f.file_size_bytes)}</div>
      <div style="display:flex;gap:3px;">
        <button onclick="openShareModal('${f.id}','${(f.file_name||'').replace(/'/g,'')}','${(f.shared_with_roles||[]).join(',')}','${(f.shared_with_users||[]).join(',')}')" title="Share" style="flex:1;font-size:.55rem;padding:3px 0;border-radius:4px;background:rgba(127,119,221,0.1);color:#7f77dd;border:1px solid rgba(127,119,221,0.3);cursor:pointer;"><i class="ti ti-share-2"></i></button>
        <button onclick="downloadVaultFile('${f.id}')" title="Download" style="flex:1;font-size:.55rem;padding:3px 0;border-radius:4px;background:rgba(64,156,255,0.1);color:var(--nes-blue);border:1px solid rgba(64,156,255,0.3);cursor:pointer;"><i class="ti ti-download"></i></button>
        <button onclick="deleteVaultFile('${f.id}','${(f.file_name||'this file').replace(/'/g,'')}')" title="Delete" style="flex:1;font-size:.55rem;padding:3px 0;border-radius:4px;background:rgba(248,81,73,0.1);color:#f85149;border:1px solid rgba(248,81,73,0.3);cursor:pointer;"><i class="ti ti-trash"></i></button>
      </div>
    </div>`;
  }).join('');
}

async function openShareModal(fileId, fileName, currentRolesStr, currentUsersStr){
  const currentRoles = currentRolesStr ? currentRolesStr.split(',') : [];
  const currentUsers = currentUsersStr ? currentUsersStr.split(',') : [];

  let peopleHtml = '<p style="color:var(--muted);font-size:.7rem;padding:8px 0;">Loading team members...</p>';
  showModal('Share Document', `
    <p style="color:var(--muted);font-size:.85rem;margin-bottom:14px;">Choose which roles can see "${esc(fileName)}". CEO always has full access; the uploader always sees their own files.</p>
    <div style="font-size:.68rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Roles</div>
    <label style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--card);border:1px solid var(--border);border-radius:8px;margin-bottom:8px;cursor:pointer;">
      <input type="checkbox" id="shareRoleManager" ${currentRoles.includes('manager')?'checked':''} style="width:16px;height:16px;">
      <span>Manager</span>
    </label>
    <label style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--card);border:1px solid var(--border);border-radius:8px;margin-bottom:16px;cursor:pointer;">
      <input type="checkbox" id="shareRoleStaff" ${currentRoles.includes('staff')?'checked':''} style="width:16px;height:16px;">
      <span>Staff</span>
    </label>
    <div style="border-top:1px solid var(--border);margin-bottom:14px;"></div>
    <div style="font-size:.68rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Specific people (confidential — bypasses roles)</div>
    <div id="sharePeopleList">${peopleHtml}</div>
    <button onclick="saveFileShare('${fileId}')" class="form-submit" style="margin-top:14px;"><i class="ti ti-check"></i> Save Sharing</button>
  `);

  try{
    const res = await fetch(`${API_URL}/api/client/${userClientId}/users`, {
      headers:{'Authorization':'Bearer '+session.access_token}
    });
    const data = await res.json();
    const members = (data.users||[]).filter(u => u.role !== 'ceo');
    const listEl = document.getElementById('sharePeopleList');
    if(!listEl) return;
    if(!members.length){
      listEl.innerHTML = `<p style="color:var(--muted);font-size:.75rem;">${t('empty.noTeamMembers')}</p>`;
      return;
    }
    listEl.innerHTML = members.map(m => `
      <label style="display:flex;align-items:center;gap:10px;padding:9px 10px;background:var(--card);border:1px solid var(--border);border-radius:8px;margin-bottom:6px;cursor:pointer;">
        <input type="checkbox" class="sharePersonCheck" value="${m.id}" ${currentUsers.includes(m.id)?'checked':''} style="width:16px;height:16px;">
        <span style="flex:1;font-size:.8rem;">${esc(m.email||'—')}</span>
        <span style="font-size:.62rem;padding:2px 7px;border-radius:4px;background:rgba(64,156,255,0.1);color:var(--nes-blue);text-transform:capitalize;">${m.role||''}</span>
      </label>
    `).join('');
  }catch(e){
    const listEl = document.getElementById('sharePeopleList');
    if(listEl) listEl.innerHTML = '<p style="color:#f85149;font-size:.75rem;">Could not load team members.</p>';
  }
}

async function saveFileShare(fileId){
  const roles=[];
  if(document.getElementById('shareRoleManager')?.checked) roles.push('manager');
  if(document.getElementById('shareRoleStaff')?.checked) roles.push('staff');
  const userIds = Array.from(document.querySelectorAll('.sharePersonCheck:checked')).map(el => el.value);
  try{
    const res=await fetch(`${API_URL}/api/vault/${fileId}/share`,{
      method:'PATCH',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({roles, userIds})
    });
    const data=await res.json();
    if(data.success){
      showToast(t('toast.sharingUpdated'));
      document.getElementById('genericModalOverlay')?.remove();
      await loadVaultFiles();
    }else{
      showToast('❌ '+(data.error||'Failed to update sharing'));
    }
  }catch(e){
    showToast('❌ '+e.message);
  }
}

async function saveExtractedText(fileId, text){
  try{
    await fetch(`${API_URL}/api/vault/${fileId}/extracted-text`, {
      method:'PATCH',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body: JSON.stringify({ text })
    });
  }catch(e){ console.warn('Could not save extracted text', e.message); }
}

async function loadBriefcaseDocContext(){
  const files = window._vaultFiles || [];
  window._briefcaseDocContextReady=false;
  if(!files.length){ window._briefcaseDocContext=''; window._briefcaseDocContextReady=true; return; }

  let combined = '';
  let loadedCount = 0;

  for(const f of files){
    try{
      let text = f.extracted_text;
      if(!text || text.length <= 4000){
        const urlRes = await fetch(`${API_URL}/api/vault/download-url/${f.id}`, {
          headers:{'Authorization':'Bearer '+session.access_token}
        });
        const urlData = await urlRes.json();
        if(!urlData.url) continue;

        const fileRes = await fetch(urlData.url);
        const blob = await fileRes.blob();
        const file = new File([blob], f.file_name);

        text = await extractText(file);
        if(text.trim()) saveExtractedText(f.id, text);
      }
      if(text && text.trim()){
        combined += `\n\n[File: ${f.file_name}]\n${text.substring(0, 4000)}`;
        loadedCount++;
      }
    }catch(e){
      console.warn('Could not load', f.file_name, e.message);
    }
  }

  window._briefcaseDocContext = combined;
  window._briefcaseDocContextReady = true;
}

function appendBriefcaseChatMsg(role, text){
  const el = document.getElementById('briefcaseChatMessages');
  if(!el) return;
  const isUser = role==='user';
  const bubble = document.createElement('div');
  bubble.style.cssText = `max-width:85%;padding:9px 13px;border-radius:12px;font-size:.8rem;line-height:1.5;${isUser?'align-self:flex-end;background:var(--nes-btn-grad);color:#fff;border-bottom-right-radius:4px;':'align-self:flex-start;background:var(--card);border:1px solid var(--border);color:var(--text);border-bottom-left-radius:4px;'}`;
  bubble.innerHTML = isUser ? esc(text) : md(text);
  el.appendChild(bubble);
  el.scrollTop = el.scrollHeight;
  return bubble;
}

async function sendBriefcaseChatMessage(){
  const input = document.getElementById('briefcaseChatInput');
  const text = input.value.trim();
  if(!text) return;
  input.value = '';

  if(!window._vaultFiles || !window._vaultFiles.length){
    appendBriefcaseChatMsg('user', text);
    appendBriefcaseChatMsg('ai', 'No documents in Briefcase yet — upload a file first.');
    return;
  }

  appendBriefcaseChatMsg('user', text);
  const typingBubble = appendBriefcaseChatMsg('ai', 'Thinking...');

  if(!window._briefcaseDocContextReady){
    typingBubble.textContent = 'Still preparing your documents, one moment...';
    await new Promise(resolve=>{
      const check = setInterval(()=>{
        if(window._briefcaseDocContextReady){ clearInterval(check); resolve(); }
      }, 400);
    });
    typingBubble.textContent = 'Thinking...';
  }

  window._briefcaseChatHistory.push({role:'user', content:text});

  try{
    const contextPrefix = window._briefcaseChatHistory.length===1
      ? `Briefcase documents:${window._briefcaseDocContext}\n\nQuestion: `
      : '';
    const res = await fetch(API_URL+'/api/chat/docs', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body: JSON.stringify({
        message: contextPrefix + text,
        mode:'docs', webSearch:false,
        history: window._briefcaseChatHistory.slice(-6)
      })
    });
    const data = await res.json();
    const reply = res.ok ? (data.reply || 'No response.') : ('Error: '+(data.error||'Failed'));
    typingBubble.textContent = reply;
    window._briefcaseChatHistory.push({role:'assistant', content:reply});
  }catch(e){
    typingBubble.textContent = 'Error: '+e.message;
  }
}

async function uploadVaultFile(file){
  if(!file)return;
  if(file.size>25*1024*1024){showToast('❌ File exceeds 25MB limit');return;}
  showToast(`Uploading ${file.name}...`);
  try{
    const fd=new FormData();
    fd.append('file',file);
    const res=await fetch(`${API_URL}/api/vault/upload`,{
      method:'POST',
      headers:{'Authorization':'Bearer '+session.access_token},
      body:fd
    });
    const data=await res.json();
    if(data.success){
      showToast(`✅ ${file.name} uploaded`);
      try{
        const text = await extractText(file);
        if(text.trim() && data.file && data.file.id){
          await saveExtractedText(data.file.id, text);
        }
      }catch(e){ console.warn('Text extraction failed for', file.name, e.message); }
      await loadVaultFiles();
      loadBriefcaseDocContext();
    }else{
      showToast('❌ Upload failed: '+(data.error||'Unknown error'));
    }
  }catch(e){
    showToast('❌ Upload failed: '+e.message);
  }
  const inp=document.getElementById('vaultUploadInput');
  if(inp)inp.value='';
}

async function downloadVaultFile(fileId){
  try{
    const res=await fetch(`${API_URL}/api/vault/download-url/${fileId}`,{
      headers:{'Authorization':'Bearer '+session.access_token}
    });
    const data=await res.json();
    if(data.url){
      window.open(data.url,'_blank');
    }else{
      showToast('❌ Could not generate download link');
    }
  }catch(e){
    showToast('❌ Download failed: '+e.message);
  }
}

async function deleteVaultFile(fileId, fileName){
  if(!confirm(`Permanently delete "${fileName}"?\n\nThis cannot be undone.`))return;
  try{
    const res=await fetch(`${API_URL}/api/vault/${fileId}`,{
      method:'DELETE',
      headers:{'Authorization':'Bearer '+session.access_token}
    });
    const data=await res.json();
    if(data.success){
      window._vaultFiles=(window._vaultFiles||[]).filter(f=>f.id!==fileId);
      const row=document.getElementById('vault-row-'+fileId);
      if(row)row.remove();
      showToast(t('toast.fileDeleted'));
      await loadVaultFiles();
      loadBriefcaseDocContext();
    }else{
      showToast('❌ Delete failed: '+(data.error||'Unknown error'));
    }
  }catch(e){
    showToast('❌ Delete failed: '+e.message);
  }
}
