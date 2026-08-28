// chat.js — extracted from index.html, NES Locale Phase 0
// 8 functions, zero logic changes

function showChatInterface(mode='chat'){
  currentView=mode;
  const limits=getCurrentLimits();
  document.getElementById('mainContent').style.overflow='hidden';
  document.getElementById('mainContent').innerHTML=`
    <div class="welcome-card">
      <div class="mode-label">${t('modeLabel.'+mode,MODE_LABELS[mode])}</div>
      <div class="version-label">NES AI v3.0 · ${mode==='chat'?t('chatError.webSearchOn'):''}</div>
    </div>
    <div class="messages" id="messages"></div>
    <div class="input-area">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="position:relative;width:34px;height:34px;flex-shrink:0;">
          <div id="promptPingAvatar" style="width:34px;height:34px;border-radius:50%;background:#0a0f1e;border:2px solid #1a56db;display:flex;align-items:center;justify-content:center;">
            <div style="width:18px;height:18px;border-radius:50%;background:#1a3a6e;display:flex;align-items:center;justify-content:center;">
              <div id="promptPingDot" style="width:8px;height:8px;border-radius:50%;background:#409cff;position:relative;">
                <div id="promptPingRing" style="position:absolute;inset:-4px;border-radius:50%;border:1.5px solid #409cff;opacity:0;animation:ping 3s ease-out infinite;"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="prompt-wrap" style="flex:1;">
          <input type="text" id="msgInput" placeholder="${mode==='image'?t('chatUi.describeImage'):t('chatUi.askMeAnything')}" maxlength="8000" autocomplete="off">
          <button class="send-btn" id="sendBtn" onclick="sendMsg()"><i class="ti ti-arrow-up"></i></button>
        </div>
      </div>
      <div class="bottom-bar">
        <div class="bottom-left">
          <span class="status-dot" id="statusEl">${t('chatUi.ready')}</span>
          <button class="act-btn" onclick="handleAttach()"><i class="ti ti-paperclip"></i> ${t('chatUi.attach')}</button>
          <button class="act-btn" id="voiceBtn" onclick="toggleVoice()"><i class="ti ti-microphone"></i> ${t('chatUi.voice')}</button>
          <span class="disclaimer">${t('chatUi.disclaimer')}</span>
        </div>
        <div class="bottom-right">
          <div class="stat-item stat-msgs"><i class="ti ti-message"></i> <b id="statMsgs">${limits.messages-chatUsed}</b> left</div>
          ${currentView==='image'?'<div class="stat-item stat-credits" id="creditsStat" style="cursor:pointer;" onclick="openCreditsModal()"><i class="ti ti-coin"></i> <b id="statCredits">…</b></div>':''}
          <div class="stat-item stat-docs"><i class="ti ti-file"></i> <b id="statDocs">${limits.docs-docsUsed}</b> left</div>
        </div>
      </div>
    </div>`;
  document.getElementById('msgInput').addEventListener('keypress',e=>{if(e.key==='Enter')sendMsg();});
  const msgsEl=document.getElementById('messages');
  if(allMsgsHTML&&allMsgsHTML.trim()){msgsEl.innerHTML=allMsgsHTML;msgsEl.scrollTop=msgsEl.scrollHeight;}
  else if(history.length===0){loadServerChatHistory(msgsEl);}
  else{history.forEach(h=>{if(h.role==='user')appendMsg(userBubble(h.content));else appendMsg(aiBubble(h.content,h.sources||[]));});msgsEl.scrollTop=msgsEl.scrollHeight;}
}

async function loadServerChatHistory(msgsEl){
  if(!session){addAiMsg(t('welcomeUi.welcomeMessage'));return;}
  try{
    const res=await fetch(API_URL+'/api/chat/history',{headers:{'Authorization':'Bearer '+session.access_token}});
    if(res.ok){
      const data=await res.json();
      if(data.messages&&data.messages.length>0){
        data.messages.forEach(m=>{
          if(m.role==='user'){appendMsg(userBubble(m.content));history.push({role:'user',content:m.content});}
          else{appendMsg(aiBubble(m.content));history.push({role:'assistant',content:m.content});}
        });
        msgsEl.scrollTop=msgsEl.scrollHeight;
        return;
      }
    }
  }catch(e){}
  addAiMsg(t('welcomeUi.welcomeMessage'));
}

async function sendMsg(){
  if(busy||!session)return;
  const input=document.getElementById('msgInput');const text=input.value.trim();if(!text)return;
  const limits=getCurrentLimits();
  if(chatUsed>=limits.messages&&limits.messages!==-1){addAiMsg(t('chatError.dailyLimitReached'));return;}
  input.value='';setBusy(true);appendMsg(userBubble(text));history.push({role:'user',content:text});addTyping();
  saveRecentChat(text.substring(0,30));

  if(currentView==='image'){
    try{
      const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),45000);
      const res=await fetch(API_URL+'/api/image',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},body:JSON.stringify({prompt:text}),signal:controller.signal});
      clearTimeout(timeout);removeTyping();
      if(res.ok){const data=await res.json();appendMsg(imgBubble(data.url,data.revisedPrompt||text));imagesUsed++;loadUsageFromServer();}
      else{const err=await res.json().catch(()=>({}));addAiMsg(t('chatError.errorPrefix')+(err.error||res.status)+t('chatError.pleaseTryAgain'));}
      saveHistory();saveUsage();updateStats();
    }catch(e){removeTyping();addAiMsg(t('chatError.networkError'));}
    setBusy(false);return;
  }

  try{
    const useSearch=currentView==='chat';
    const res=await fetch(API_URL+'/api/chat',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({message:text,mode:currentView,webSearch:useSearch,history:history.slice(-10)})
    });

    if(!res.ok){
      removeTyping();
      const err=await res.json().catch(()=>({}));
      addAiMsg(t('chatError.errorPrefix')+(err.error||res.status)+t('chatError.pleaseTryAgain'));
      setBusy(false);return;
    }

    removeTyping();
    const bubbleId='stream-'+Date.now();
    const streamStart=Date.now();
    const bubbleHTML=`<div class="msg ai" id="${bubbleId}"><div class="chat-av-wrap"><div class="chat-av-ring"><div class="chat-av-mid"><div class="chat-av-dot"></div></div></div><div class="chat-av-online"></div></div><div class="msg-body"><div class="msg-role">NES AI</div><div class="msg-bubble" id="${bubbleId}-text"></div><button class="copy-btn" onclick="copyMsg(this)">${t('chatUi.copy')}</button></div></div>`;
    document.getElementById('messages')?.insertAdjacentHTML('beforeend',bubbleHTML);
    scroll();

    const reader=res.body.getReader();
    const decoder=new TextDecoder();
    let fullReply='';
    let sources=[];
    let buffer='';

    while(true){
      const{done,value}=await reader.read();
      if(done)break;
      buffer+=decoder.decode(value,{stream:true});
      const lines=buffer.split('\n');
      buffer=lines.pop()||'';
      for(const line of lines){
        if(!line.startsWith('data: '))continue;
        try{
          const data=JSON.parse(line.slice(6));
          if(data.type==='sources'){sources=data.sources||[];}
          else if(data.type==='chunk'){
            if(!fullReply && data.text){
              // first chunk - check if we need to show fallback notice
              const elapsed=Date.now()-streamStart;
              if(elapsed>4000){
                const nb=document.getElementById(bubbleId+'-text');
                if(nb)nb.innerHTML='<div style="font-size:.72rem;color:var(--amber);margin-bottom:6px;font-style:italic;">⚡ Switching to faster server...</div>';
                await new Promise(r=>setTimeout(r,600));
              }
            }
            fullReply+=data.text;
            const el=document.getElementById(bubbleId+'-text');
            if(el){el.innerHTML=md(cleanDisplay(fullReply));}
            scroll();
          }
          else if(data.type==='done'){
            if(sources.length){
              const el=document.getElementById(bubbleId+'-text');
              if(el){
                const src='<div class="sources-block">Sources: '+sources.map(s=>'<a href="'+esc(s.url)+'" target="_blank">'+esc(s.title||s.url)+'</a>').join(' · ')+'</div>';
                el.innerHTML=md(cleanDisplay(fullReply))+src;
              }
            }
            history.push({role:'assistant',content:fullReply,sources});
            chatUsed++;saveHistory();saveUsage();updateStats();
          }
        }catch(e){}
      }
    }

    if(!fullReply){addAiMsg(t('chatError.sorryCouldNotGenerate'));}

  }catch(e){removeTyping();addAiMsg(t('chatError.networkError'));}
  setBusy(false);
}

function handleAttach(){
  if(currentView!=='docs'){addAiMsg(t('chatError.fileAttachmentDocsMode'));return;}
  const inp=document.createElement('input');inp.type='file';inp.accept='.txt,.md,.json,.csv,.pdf,.docx,.xlsx,.xls';inp.onchange=e=>processFile(e.target.files[0]);inp.click();
}

async function processFile(file){
  if(!file)return;if(file.size>10*1024*1024){addAiMsg(t('chatError.fileTooLarge'));return;}
  appendMsg(userBubble('Attached: '+file.name+' ('+Math.round(file.size/1024)+' KB) — '+t('chatError.analyzing')));setBusy(true);addTyping();
  try{
    const content=await extractText(file);if(!content.trim()){removeTyping();addAiMsg(t('chatError.couldNotExtractText'));setBusy(false);return;}
    const truncated=content.substring(0,7000);
    history.push({role:'user',content:'Analyze: "'+file.name+'":\n'+truncated});
    const res=await fetch(API_URL+'/api/chat/docs',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},body:JSON.stringify({message:'Analyze and transcribe this document "'+file.name+'". Provide the full content, key information, and a summary. Do not introduce yourself.\n\nContent:\n'+truncated,mode:'docs',webSearch:false,history:history.slice(-4)})});
    removeTyping();
    if(res.ok){const data=await res.json();const reply=data.reply||t('chatError.documentAnalyzed');history.push({role:'assistant',content:reply});appendMsg(aiBubble(reply));docsUsed++;}
    else{addAiMsg(t('chatError.couldNotAnalyzeFile'));}
    saveHistory();saveUsage();updateStats();
  }catch(err){removeTyping();addAiMsg(t('chatError.errorColon')+err.message);}
  setBusy(false);
}

async function extractText(file){
  const ext=file.name.split('.').pop().toLowerCase();
  if(['txt','md','json','csv'].includes(ext))return file.text();
  if(ext==='pdf'){if(typeof pdfjsLib==='undefined')await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';const ab=await file.arrayBuffer();const pdf=await pdfjsLib.getDocument({data:ab}).promise;const pages=[];for(let i=1;i<=Math.min(pdf.numPages,20);i++){const page=await pdf.getPage(i);const tc=await page.getTextContent();pages.push(tc.items.map(s=>s.str).join(' '));}return pages.join('\n');}
  if(ext==='docx'){if(typeof mammoth==='undefined')await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js');const ab=await file.arrayBuffer();const r=await mammoth.extractRawText({arrayBuffer:ab});return r.value;}
  if(['xlsx','xls'].includes(ext)){if(typeof XLSX==='undefined')await loadScript('https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js');const ab=await file.arrayBuffer();const wb=XLSX.read(ab);return wb.SheetNames.map(n=>'Sheet: '+n+'\n'+XLSX.utils.sheet_to_csv(wb.Sheets[n])).join('\n\n');}
  if(ext==='pptx'){
    if(typeof JSZip==='undefined')await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
    const ab=await file.arrayBuffer();
    const zip=await JSZip.loadAsync(ab);
    const slideFiles=Object.keys(zip.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a,b)=>{
      const na=parseInt(a.match(/slide(\d+)\.xml/)[1]);
      const nb=parseInt(b.match(/slide(\d+)\.xml/)[1]);
      return na-nb;
    });
    const slideTexts=[];
    for(const sf of slideFiles){
      const xml=await zip.files[sf].async('text');
      const matches=[...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m=>m[1]);
      slideTexts.push('Slide '+(slideTexts.length+1)+': '+matches.join(' '));
    }
    return slideTexts.join('\n\n');
  }
  if(['jpg','jpeg','png','webp'].includes(ext)){
    if(typeof Tesseract==='undefined')await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
    const result=await Tesseract.recognize(file,'eng');
    return result.data.text;
  }
  if(ext==='doc'){
    const fd=new FormData();
    fd.append('file',file);
    const res=await fetch(`${API_URL}/api/vault/extract-legacy-doc`,{
      method:'POST',
      headers:{'Authorization':'Bearer '+session.access_token},
      body:fd
    });
    const data=await res.json();
    if(!res.ok||!data.text)throw new Error(data.error||'Could not extract .doc file');
    return data.text;
  }
  throw new Error('Unsupported file type');
}

function loadScript(src){
  if(_scriptLoadPromises[src]) return _scriptLoadPromises[src];
  _scriptLoadPromises[src]=new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[src="'+src+'"]');
    if(existing){resolve();return;}
    const s=document.createElement('script');
    s.src=src;s.onload=resolve;s.onerror=reject;
    document.head.appendChild(s);
  });
  return _scriptLoadPromises[src];
}

let _activeRecognition=null;
function toggleVoice(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){addAiMsg('Voice not supported in this browser.');return;}const btn=document.getElementById('voiceBtn');if(_activeRecognition){_activeRecognition.stop();return;}const recognition=new SR();_activeRecognition=recognition;recognition.lang=(window.clientLocale==='ar')?'ar-SA':'en-US';recognition.continuous=true;recognition.interimResults=true;let finalTranscript='';btn.style.color='#f85149';setStatus('busy','Listening…');recognition.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal){finalTranscript+=e.results[i][0].transcript;}else{interim+=e.results[i][0].transcript;}}document.getElementById('msgInput').value=(finalTranscript+interim).trim();};recognition.onerror=recognition.onend=()=>{btn.style.color='';setStatus('ok','Ready');_activeRecognition=null;if(finalTranscript.trim())sendMsg();};recognition.start();}
