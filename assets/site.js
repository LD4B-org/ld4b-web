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

  var svg = document.getElementById('drift');
  if (svg) {
    var NS = 'http://www.w3.org/2000/svg', W = 560, H = 280, l = 60, r = 28, t = 16, b = 36;
    var LD = [[-40,0.17],[-30,0.12],[-20,0.10],[-10,0.10],[0,0.07],[10,0.03],[20,0],[25,0],[30,-0.02],[40,-0.05],[50,-0.12],[60,-0.15],[70,-0.16],[80,-0.20],[85,-0.22]];
    var x = function(T){ return l + (T + 40) / 125 * (W - l - r); };
    var y = function(d){ return t + (0.3 - d) / 1.3 * (H - t - b); };
    var ld = function(T){ for (var i = 1; i < LD.length; i++) { if (T <= LD[i][0]) { var a = LD[i-1], c = LD[i]; return a[1] + (c[1] - a[1]) * (T - a[0]) / (c[0] - a[0]); } } return LD[LD.length-1][1]; };
    var typ = function(T){ var s = T < 25 ? 65 : 60; return -0.9 * Math.pow((T - 25) / s, 2); };
    var el = function(n, a, txt){ var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (txt != null) e.textContent = txt; svg.appendChild(e); return e; };
    var sign = function(v, eps){ return v > eps ? '+' : v < -eps ? '−' : ''; };
    [0.2, 0, -0.2, -0.4, -0.6, -0.8, -1.0].forEach(function(d){
      el('line', {x1: l, x2: W - r, y1: y(d), y2: y(d), 'class': d === 0 ? 'b-zero' : 'b-grid'});
      el('text', {x: l - 8, y: y(d) + 4, 'text-anchor': 'end', 'class': 'b-lbl'}, sign(d, 0) + Math.abs(d).toFixed(1) + ' dB');
    });
    [-40, 0, 25, 50, 85].forEach(function(T){
      el('line', {x1: x(T), x2: x(T), y1: t, y2: H - b, 'class': 'b-grid'});
      el('text', {x: x(T), y: H - b + 20, 'text-anchor': 'middle', 'class': 'b-lbl'}, sign(T, 0) + Math.abs(T) + ' °C');
    });
    var path = function(f){ var p = ''; for (var T = -40; T <= 85; T++) p += (T === -40 ? 'M' : 'L') + x(T).toFixed(1) + ',' + y(f(T)).toFixed(1); return p; };
    el('path', {d: path(typ), 'class': 'b-typ'});
    el('path', {d: path(ld), 'class': 'b-ld4b'});
    el('text', {x: x(-34), y: y(0.25), 'class': 'b-lbl-l'}, 'LD4B');
    el('text', {x: x(-24), y: y(-0.9), 'class': 'b-lbl'}, 'typical module');
    var cur = el('line', {y1: t, y2: H - b, 'class': 'b-cur'}), dt = el('circle', {r: 5, 'class': 'b-dot-t'}), dl = el('circle', {r: 6, 'class': 'b-dot-l'});
    var inp = document.getElementById('temp');
    var fmt = function(d){ return sign(d, 0.005) + Math.abs(d).toFixed(2) + ' dB'; };
    var pct = function(d){ var p = (Math.pow(10, d / 10) - 1) * 100; return sign(p, 0.05) + Math.abs(p).toFixed(1) + ' % power'; };
    var upd = function(){
      var T = +inp.value, a = ld(T), c = typ(T);
      cur.setAttribute('x1', x(T)); cur.setAttribute('x2', x(T));
      dl.setAttribute('cx', x(T)); dl.setAttribute('cy', y(a)); dt.setAttribute('cx', x(T)); dt.setAttribute('cy', y(c));
      document.getElementById('r-t').textContent = sign(T, 0) + Math.abs(T) + ' °C';
      document.getElementById('r-l').textContent = fmt(a); document.getElementById('r-lp').textContent = pct(a);
      document.getElementById('r-y').textContent = fmt(c); document.getElementById('r-yp').textContent = pct(c);
    };
    inp.addEventListener('input', upd); upd();
  }

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
