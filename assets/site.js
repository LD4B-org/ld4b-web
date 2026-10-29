(function(){
  var qs = new URLSearchParams(location.search);
  document.querySelectorAll('select[data-filter="wl"]').forEach(function(sel){
    var table = document.querySelector('[data-table]'), count = document.querySelector('.count');
    function apply(){
      var v = sel.value, parts = {}, n = 0;  // count part numbers, not package and fiber rows
      table.querySelectorAll('tbody tr').forEach(function(tr){
        var show = !v || tr.getAttribute('data-wl') === v;
        tr.hidden = !show; if (show && !parts[tr.getAttribute('data-part')]) { parts[tr.getAttribute('data-part')] = 1; n++; }
      });
      if (count) count.textContent = n + (n === 1 ? ' product' : ' products');
      var url = new URL(location.href);
      if (v) url.searchParams.set('wl', v); else url.searchParams.delete('wl');
      history.replaceState(null, '', url);
    }
    var want = qs.get('wl');
    if (want) {
      var opt = Array.prototype.find.call(sel.options, function(o){ return o.value === want || o.value.indexOf(want) === 0; });
      if (opt) sel.value = opt.value;
    }
    sel.addEventListener('change', apply); apply();
  });

  document.querySelectorAll('tr.row-link').forEach(function(tr){
    tr.addEventListener('click', function(ev){
      if (ev.target.closest('a, button, input, select, label')) return;
      location.href = tr.getAttribute('data-href');
    });
  });

  function comboCheck(el){  // which package / fiber pairs the part is made in
    var combos = el.getAttribute('data-combos').split(' ');
    return function(p, f){ return combos.some(function(c){ var x = c.split(':'); return (!p || x[0] === p) && (!f || x[1] === f); }); };
  }
  function pressButtons(el, sel, ok){
    el.querySelectorAll('button[data-k]').forEach(function(b){
      var k = b.getAttribute('data-k'), v = b.getAttribute('data-v');
      b.setAttribute('aria-pressed', sel[k] === v ? 'true' : 'false');
      b.disabled = !(k === 'pkg' ? ok(v, sel.fiber) : ok(sel.pkg, v));
    });
  }
  function withChoice(href, sel){
    var hash = href.indexOf('#') >= 0 ? href.slice(href.indexOf('#')) : '', url = new URL(href.split('#')[0], location.href);
    ['pkg', 'fiber'].forEach(function(k){ if (sel[k]) url.searchParams.set(k, sel[k]); else url.searchParams.delete(k); });
    return url.pathname + url.search + hash;
  }
  document.querySelectorAll('tr[data-combos]').forEach(function(tr){
    var ok = comboCheck(tr), sel = {pkg: null, fiber: null};
    tr.addEventListener('click', function(ev){
      var b = ev.target.closest('button[data-k]');
      if (!b || b.disabled) return;
      var k = b.getAttribute('data-k'), v = b.getAttribute('data-v');
      sel[k] = sel[k] === v ? null : v;  // a second click clears the choice
      pressButtons(tr, sel, ok);
      tr.querySelectorAll('a[data-quote], a.part, a.spec').forEach(function(a){ a.setAttribute('href', withChoice(a.getAttribute('href'), sel)); });
      tr.setAttribute('data-href', withChoice(tr.getAttribute('data-href'), sel));
      var img = tr.querySelector('.thumb img'), pb = tr.querySelector('button[data-k="pkg"][aria-pressed="true"]');
      if (img) { img.dataset.src0 = img.dataset.src0 || img.getAttribute('src'); img.src = pb ? pb.getAttribute('data-thumb') : img.dataset.src0; }
    });
    pressButtons(tr, sel, ok);
  });

  var vs = document.querySelector('.variant');
  if (vs) {
    var ok = comboCheck(vs), sel = {pkg: qs.get('pkg'), fiber: qs.get('fiber')};
    if (!ok(sel.pkg, null)) sel.pkg = null;
    if (!ok(sel.pkg, sel.fiber)) sel.fiber = null;
    var applyVariant = function(){
      pressButtons(vs, sel, ok);
      var pb = sel.pkg && vs.querySelector('button[data-k="pkg"][data-v="' + sel.pkg + '"]'), grp = pb ? pb.getAttribute('data-group') : null;
      document.querySelectorAll('.specs tr[data-fiber]').forEach(function(tr){  // configurations: highlight, keep all
        var on = (grp || sel.fiber) && (!grp || tr.getAttribute('data-pkg') === grp) && (!sel.fiber || tr.getAttribute('data-fiber') === sel.fiber);
        tr.classList.toggle('on', !!on);
      });
      document.querySelectorAll('.specs tbody tr[data-pkg]:not([data-fiber])').forEach(function(el){ el.hidden = !!grp && el.getAttribute('data-pkg') !== grp; });
      document.querySelectorAll('.order-group li[data-code]').forEach(function(el){ el.hidden = !!sel.pkg && el.getAttribute('data-code') !== sel.pkg; });
      document.querySelectorAll('div[data-fiber], .order-group li[data-fiber]').forEach(function(el){ el.hidden = !!sel.fiber && el.getAttribute('data-fiber') !== sel.fiber; });
      var part = vs.getAttribute('data-part'), q = '?part=' + encodeURIComponent(part) + (sel.pkg ? '&pkg=' + sel.pkg : '') + (sel.fiber ? '&fiber=' + sel.fiber : '');
      var btn = document.querySelector('a[data-quote]');
      if (btn) btn.href = btn.href.split('?')[0] + q + '#quote';
      var f = document.getElementById('quote-form');
      if (f) f.part.value = [part, sel.pkg, sel.fiber && sel.fiber + ' fiber'].filter(Boolean).join(', ');
      var url = new URL(location.href);
      ['pkg', 'fiber'].forEach(function(k){ if (sel[k]) url.searchParams.set(k, sel[k]); else url.searchParams.delete(k); });
      history.replaceState(null, '', url);
    };
    vs.addEventListener('click', function(ev){
      var b = ev.target.closest('button');
      if (!b || b.disabled) return;
      var k = b.getAttribute('data-k'), v = b.getAttribute('data-v');
      sel[k] = sel[k] === v ? null : v;  // a second click clears the choice
      applyVariant();
    });
  }

  var form = document.getElementById('quote-form');
  if (!form) return;
  var part = [qs.get('part') || (vs && vs.getAttribute('data-part')), qs.get('pkg'), qs.get('fiber') && qs.get('fiber').replace('-', '/') + ' fiber'].filter(Boolean).join(', ');
  if (part) form.part.value = part;
  if (vs) applyVariant();
  var status = form.querySelector('.form-status');
  form.addEventListener('submit', function(ev){
    ev.preventDefault();
    status.className = 'form-status';
    if (form.website.value) return;
    if (!form.email.value || !form.email.checkValidity()) { status.textContent = 'Enter a valid email address so we can reply.'; status.classList.add('err'); form.email.focus(); return; }
    if (!form.message.value.trim()) { status.textContent = 'Write a short message: part number, quantity or parameters.'; status.classList.add('err'); form.message.focus(); return; }
    if (!form.consent.checked) { status.textContent = 'Tick the consent box so we may process your request.'; status.classList.add('err'); form.consent.focus(); return; }
    var cfg = (window.LD4B || {}), hs = cfg.hubspot || {};
    var text = 'Part: ' + form.part.value + '\n' + form.message.value + '\n\nName: ' + form.name.value + '\nCompany: ' + form.company.value + '\nCountry: ' + form.country.value;
    if (hs.portalId && hs.formId) {
      var body = {fields: [
        {name: 'email', value: form.email.value}, {name: 'firstname', value: form.name.value},
        {name: 'company', value: form.company.value}, {name: 'country', value: form.country.value},
        {name: 'message', value: 'Part: ' + form.part.value + '\n' + form.message.value}],
        context: {hutk: (document.cookie.match(/hubspotutk=([^;]*)/) || [])[1], pageUri: location.href, pageName: document.title},
        legalConsentOptions: {consent: {consentToProcess: true, text: 'I agree that LD4B processes my data to answer this request.'}}};
      status.textContent = 'Sending…';
      fetch('https://api.hsforms.com/submissions/v3/integration/submit/' + hs.portalId + '/' + hs.formId, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)})
        .then(function(r){ if (!r.ok) throw new Error(r.status); status.textContent = 'Thank you. We will reply ASAP.'; status.classList.add('ok'); form.reset(); })
        .catch(function(){ status.innerHTML = 'Sending failed. Please email us at <a href="mailto:' + cfg.email + '">' + cfg.email + '</a>.'; status.classList.add('err'); });
    } else {
      location.href = 'mailto:' + cfg.email + '?subject=' + encodeURIComponent('Quote request' + (form.part.value ? ': ' + form.part.value : '')) + '&body=' + encodeURIComponent(text);
      status.textContent = 'Your email app opens with the request filled in. Send it to reach us.'; status.classList.add('ok');
    }
  });
})();
