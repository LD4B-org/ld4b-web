(function(){
  var qs = new URLSearchParams(location.search);
  document.querySelectorAll('select[data-filter="wl"]').forEach(function(sel){
    var table = document.querySelector('[data-table]'), count = document.querySelector('.count');
    function apply(){
      var v = sel.value, n = 0;
      table.querySelectorAll('tbody tr').forEach(function(tr){
        var show = !v || tr.getAttribute('data-wl') === v;
        tr.hidden = !show; if (show) n++;
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
      window.open(tr.getAttribute('data-pdf'), '_blank', 'noopener');
    });
  });

  var form = document.getElementById('quote-form');
  if (!form) return;
  var part = [qs.get('part'), qs.get('pkg'), qs.get('fiber') && qs.get('fiber').replace('-', '/') + ' fiber'].filter(Boolean).join(', ');
  if (part) form.part.value = part;
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
        context: {pageUri: location.href, pageName: document.title},
        legalConsentOptions: {consent: {consentToProcess: true, text: 'I agree that LD4B processes my data to answer this request.'}}};
      status.textContent = 'Sending…';
      fetch('https://api.hsforms.com/submissions/v3/integration/submit/' + hs.portalId + '/' + hs.formId, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)})
        .then(function(r){ if (!r.ok) throw new Error(r.status); status.textContent = 'Thank you. We reply within one business day.'; status.classList.add('ok'); form.reset(); })
        .catch(function(){ status.innerHTML = 'Sending failed. Please email us at <a href="mailto:' + cfg.email + '">' + cfg.email + '</a>.'; status.classList.add('err'); });
    } else {
      location.href = 'mailto:' + cfg.email + '?subject=' + encodeURIComponent('Quote request' + (form.part.value ? ': ' + form.part.value : '')) + '&body=' + encodeURIComponent(text);
      status.textContent = 'Your email app opens with the request filled in. Send it to reach us.'; status.classList.add('ok');
    }
  });
})();
