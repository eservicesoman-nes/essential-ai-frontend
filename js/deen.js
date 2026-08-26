// deen.js — extracted from index.html, NES Locale Phase 0
// 1 functions, zero logic changes

function showDeen(){
  const mc=document.getElementById('mainContent');
  mc.style.overflow='hidden';
  mc.style.padding='0';
  mc.innerHTML=`
    <div style="display:flex;flex-direction:column;height:100%;overflow:hidden;">
      <div style="padding-block:11px;padding-inline-end:var(--header-clearance);padding-inline-start:60px;border-bottom:1px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-family:var(--mono);font-size:.8rem;color:var(--nes-blue);font-weight:800;display:flex;align-items:center;gap:6px;"><i class="ti ti-moon-stars"></i>DEEN &#1583;&#1610;&#1606;</div>
          <div style="font-family:var(--mono);font-size:.65rem;color:var(--muted);">${t('deen.subtitle')}</div>
        </div>
        <a href="https://deen.nes-ai.com" target="_blank" style="font-size:.7rem;color:var(--nes-blue);text-decoration:none;display:flex;align-items:center;gap:4px;"><i class="ti ti-external-link"></i> ${t('deen.openFullPage')}</a>
      </div>
      <iframe
        src="https://deen.nes-ai.com"
        style="flex:1;width:100%;border:none;background:var(--bg);"
        title="Deen NES AI"
        allow="geolocation; microphone"
        loading="lazy">
      </iframe>
    </div>`;
}
