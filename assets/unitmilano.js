/* Form di registrazione UnitMilano: invia a /api/free-register, poi mostra il QR nella pagina.
   Le validazioni vere sono sul server (src/worker.js, handleFreeRegister): qui solo controlli di
   comodo per dare un messaggio chiaro prima dell'invio. */
(function(){
  // Header: pillola viola con link chiari finché si è in cima (sopra l'hero scuro), poi crema con link
  // scuri — come sulle altre pagine con hero scuro (qui l'hero non è subito dopo <header>, quindi la
  // logica di assets/i18n.js non scatta).
  var siteHeader = document.querySelector('header');
  if (siteHeader) {
    var syncHeader = function(){ siteHeader.classList.toggle('at-top', window.scrollY < 12); };
    syncHeader();
    window.addEventListener('scroll', syncHeader, { passive: true });
  }

  var EVENT_SLUG = 'unitmilano';
  var form = document.getElementById('um-form');
  if (!form) return;
  var statusEl = document.getElementById('um-status');
  var submitBtn = document.getElementById('um-submit');
  var done = document.getElementById('um-done');
  var lastResult = null;

  function lang(){
    try { return localStorage.getItem('growmi_lang') === 'en' ? 'en' : 'it'; } catch (e) { return 'it'; }
  }
  function t(key){
    var d = (typeof GROWMI_I18N !== 'undefined' && GROWMI_I18N[lang()]) || {};
    return d[key] !== undefined ? d[key] : key;
  }
  function showStatus(msg){
    statusEl.textContent = msg;
    statusEl.hidden = !msg;
  }
  function markInvalid(el, bad){
    if (!el) return;
    if (bad) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
  }

  function renderDone(res){
    lastResult = res;
    var first = (res.name || '').split(' ')[0] || '';
    var leadKey = res.emailSent ? 'um_done_lead_mail' : 'um_done_lead_nomail';
    document.getElementById('um-done-lead').textContent = t(leadKey).replace('{name}', first);
    document.getElementById('um-qr').innerHTML = res.qrSvg;
    document.getElementById('um-code').textContent = res.code;
    form.hidden = true;
    done.hidden = false;
    done.focus();
    done.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Cambio lingua a pagina già in conferma: il testo con il nome va ricomposto.
  document.querySelectorAll('.lang-switch button').forEach(function(btn){
    btn.addEventListener('click', function(){
      setTimeout(function(){ if (lastResult) renderDone(lastResult); }, 0);
    });
  });

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    showStatus('');
    var f = form.elements;
    var data = {
      eventSlug: EVENT_SLUG,
      firstName: f.firstName.value.trim(),
      lastName: f.lastName.value.trim(),
      email: f.email.value.trim(),
      phone: f.phone.value.trim(),
      university: f.university.value,
      privacy: f.privacy.checked,
      adult: f.adult.checked,
      website: f.website.value,
      lang: lang()
    };
    ['firstName', 'lastName', 'email', 'phone', 'university'].forEach(function(n){ markInvalid(f[n], !data[n]); });
    markInvalid(f.privacy, !data.privacy);
    markInvalid(f.adult, !data.adult);
    if (!data.firstName || !data.lastName || !data.email || !data.phone || !data.university || !data.privacy || !data.adult) {
      showStatus(t('um_err_required'));
      var firstBad = form.querySelector('[aria-invalid="true"]');
      if (firstBad) firstBad.focus();
      return;
    }

    submitBtn.disabled = true;
    var label = submitBtn.textContent;
    submitBtn.textContent = t('um_f_sending');
    try {
      var res = await fetch('/api/free-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      var body = await res.json().catch(function(){ return {}; });
      if (res.ok && body.ok && body.code) {
        renderDone(body);
        return;
      }
      if (res.ok && body.ok) { showStatus(t('um_err_generic')); }
      else {
        showStatus(body.error || t('um_err_generic'));
        if (body.field && f[body.field]) { markInvalid(f[body.field], true); f[body.field].focus(); }
      }
    } catch (err) {
      showStatus(t('um_err_network'));
    }
    submitBtn.disabled = false;
    submitBtn.textContent = label;
  });

  // Salva il QR come PNG (disegna l'SVG su un canvas): comodo per averlo nella galleria del telefono.
  var saveBtn = document.getElementById('um-save-qr');
  if (saveBtn) saveBtn.addEventListener('click', function(){
    var svg = document.querySelector('#um-qr svg');
    if (!svg || !lastResult) return;
    var xml = new XMLSerializer().serializeToString(svg);
    var img = new Image();
    img.onload = function(){
      var size = 640, pad = 40;
      var canvas = document.createElement('canvas');
      canvas.width = canvas.height = size + pad * 2;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, pad, pad, size, size);
      var a = document.createElement('a');
      a.download = 'qr-unitmilano-' + lastResult.code + '.png';
      a.href = canvas.toDataURL('image/png');
      document.body.appendChild(a); a.click(); a.remove();
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
  });
})();
