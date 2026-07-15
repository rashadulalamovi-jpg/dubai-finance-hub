
// CTG Dubai Finance Hub v3.1
// Model-wise Lot Breakdown — Phase 11,12,14
(function() {
  'use strict';

  function fA(n) {
    if (isNaN(n) || n == null) return 'dh0';
    return 'dh' + (+n).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
  }

  function fDt(d) {
    if (!d) return '—';
    try {
      var p = d.split('-');
      return new Date(+p[0], +p[1]-1, +p[2]).toLocaleDateString('en-BD', {day:'2-digit', month:'short', year:'2-digit'});
    } catch(e) { return d; }
  }

  function gel(id) { return document.getElementById(id); }

  // ══ showLotDetail — Full Model-wise Breakdown ══
  window.showLotDetail = function(lot) {
    var S = window.S || {};
    var purItems = (S.purchases || []).filter(function(p) { return p.lot === lot; });
    var costItems = (S.lot_costs || []).filter(function(c) { return c.lot === lot; });
    var couriers = (S.courier || []).filter(function(c) {
      return (c.lots || []).some(function(l) { return l.lotRef === lot; }) || c.lotRef === lot;
    });

    // Build model items from items array
    var mi = [];
    purItems.forEach(function(p) {
      if (p.items && p.items.length) {
        p.items.forEach(function(it) {
          mi.push({m: it.model || '?', q: it.qty || 0, u: it.unitPrice || 0, t: it.totalPrice || 0});
        });
      } else if (p.model) {
        mi.push({m: p.model, q: p.qty || 0, u: p.unitPrice || 0, t: p.totalAED || 0});
      }
    });

    var pcs = mi.reduce(function(s, x) { return s + x.q; }, 0);
    var pt = mi.reduce(function(s, x) { return s + x.t; }, 0);
    var ct = costItems.reduce(function(s, c) { return s + (c.totalAED || 0); }, 0);
    var gt = pt + ct;
    var gpp = pcs > 0 ? gt / pcs : 0;
    var pp = pcs > 0 ? ct / pcs : 0;
    var tb = couriers.reduce(function(s, c) { return s + (c.bookedQty || 0); }, 0);
    var tr2 = couriers.reduce(function(s, c) { return s + (c.receivedQty || 0); }, 0);
    var intrans = Math.max(0, tb - tr2);
    var purDate = purItems[0] ? purItems[0].date : '';

    // Summary HTML
    var summaryData = [
      ['Purchase Date', fDt(purDate), 'var(--tx)'],
      ['Models', mi.length, 'var(--bl)'],
      ['Total PCS', pcs, 'var(--bl)'],
      ['Purchase Cost', fA(pt), 'var(--gold)'],
      ['Prep Cost', fA(ct), 'var(--pu)'],
      ['Grand Total', fA(gt), 'var(--gn)'],
      ['Avg Cost/PC', fA(gpp), 'var(--gold)'],
      ['In Transit', intrans + ' pcs', 'var(--bl)']
    ];
    var sc = '';
    summaryData.forEach(function(c) {
      sc += '<div style="background:var(--s2);border:1px solid var(--brd);border-radius:var(--r);padding:12px">' +
        '<div style="font:400 10px/1 var(--font-m);color:var(--txm);text-transform:uppercase;margin-bottom:6px">' + c[0] + '</div>' +
        '<div style="font:700 14px/1 var(--font-m);color:' + c[2] + '">' + c[1] + '</div></div>';
    });

    // Purchase item rows
    var pr = '';
    mi.forEach(function(x) {
      pr += '<tr style="border-bottom:1px solid var(--brd)">' +
        '<td style="padding:8px 10px;font-family:var(--font-b);color:var(--tx)">' + x.m + '</td>' +
        '<td style="padding:8px 10px;color:var(--bl);text-align:center;font-family:var(--font-m)">' + x.q + '</td>' +
        '<td style="padding:8px 10px;color:var(--gold);font-family:var(--font-m)">' + fA(x.u) + '</td>' +
        '<td style="padding:8px 10px;color:var(--gold);font-weight:700;font-family:var(--font-m)">' + fA(x.t) + '</td></tr>';
    });

    // Final cost rows with prep allocation
    var fr = '';
    var allocSoFar = 0;
    mi.forEach(function(x, i) {
      var isLast = i === mi.length - 1;
      var ap = isLast ? (ct - allocSoFar) : parseFloat((pp * x.q).toFixed(2));
      if (!isLast) allocSoFar += ap;
      var ft = x.t + ap;
      var fpp2 = x.q > 0 ? ft / x.q : 0;
      fr += '<tr>' +
        '<td style="padding:8px 10px;font-family:var(--font-b);color:var(--tx)">' + x.m + '</td>' +
        '<td style="padding:8px 10px;color:var(--bl);text-align:center;font-family:var(--font-m)">' + x.q + '</td>' +
        '<td style="padding:8px 10px;color:var(--gold);font-family:var(--font-m)">' + fA(x.u) + '</td>' +
        '<td style="padding:8px 10px;color:var(--gold);font-family:var(--font-m)">' + fA(x.t) + '</td>' +
        '<td style="padding:8px 10px;color:var(--pu);font-family:var(--font-m)">' + fA(ap) + '</td>' +
        '<td style="padding:8px 10px;color:var(--gn);font-weight:700;font-family:var(--font-m)">' + fA(ft) + '</td>' +
        '<td style="padding:8px 10px;color:var(--gn);font-family:var(--font-m)">' + fA(fpp2) + '</td></tr>';
    });

    var h = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:16px">' + sc + '</div>';

    // Purchase table
    h += '<div style="margin-bottom:16px">' +
      '<div style="font:600 11px/1 var(--font-m);color:var(--gold);text-transform:uppercase;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--brd)">📦 Purchase Items — Model-wise</div>' +
      '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">' +
      '<thead><tr style="background:var(--s2)">' +
      '<th style="padding:8px 10px;text-align:left;font:500 10px/1 var(--font-m);color:var(--txm);text-transform:uppercase">Model</th>' +
      '<th style="padding:8px 10px;text-align:center;font:500 10px/1 var(--font-m);color:var(--txm);text-transform:uppercase">Qty</th>' +
      '<th style="padding:8px 10px;font:500 10px/1 var(--font-m);color:var(--txm);text-transform:uppercase">Unit(AED)</th>' +
      '<th style="padding:8px 10px;font:500 10px/1 var(--font-m);color:var(--txm);text-transform:uppercase">Total(AED)</th>' +
      '</tr></thead><tbody>' + pr +
      '<tr style="background:var(--s2)">' +
      '<td style="padding:6px 10px;font:600 11px/1 var(--font-m);color:var(--txd)">Total</td>' +
      '<td style="padding:6px 10px;color:var(--bl);text-align:center;font-weight:700;font-family:var(--font-m)">' + pcs + '</td>' +
      '<td></td>' +
      '<td style="padding:6px 10px;color:var(--gold);font-weight:700;font-family:var(--font-m)">' + fA(pt) + '</td>' +
      '</tr></tbody></table></div></div>';

    // Prep cost section — detailed breakdown
    if (costItems.length) {
      var cRows = '';
      costItems.forEach(function(c) {
        cRows += '<tr style="border-bottom:1px solid var(--brd)">'
          + '<td style="padding:7px 10px"><span style="background:var(--s3);border:1px solid var(--gold2);border-radius:4px;padding:2px 7px;font:600 10px/1 var(--font-m);color:var(--gold)">' + (c.category||'—') + '</span></td>'
          + '<td style="padding:7px 10px;color:var(--tx)">' + (c.description||'—') + '</td>'
          + '<td style="padding:7px 10px;color:var(--bl);text-align:center;font-family:var(--font-m)">' + (c.qty||1) + '</td>'
          + '<td style="padding:7px 10px;color:var(--gold);font-family:var(--font-m)">' + fA(c.unitPrice) + '</td>'
          + '<td style="padding:7px 10px;color:var(--pu);font-weight:700;font-family:var(--font-m)">' + fA(c.totalAED) + '</td>'
          + '</tr>';
      });
      h += '<div style="margin-bottom:14px">'
        + '<div style="font:600 11px/1 var(--font-m);color:var(--pu);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--brd)">🔧 Preparation Costs — Breakdown</div>'
        + '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">'
        + '<thead><tr style="background:var(--s2)">'
        + '<th style="padding:7px 10px;text-align:left;font:500 10px/1 var(--font-m);color:var(--txm);text-transform:uppercase">Category</th>'
        + '<th style="padding:7px 10px;text-align:left;font:500 10px/1 var(--font-m);color:var(--txm);text-transform:uppercase">Description</th>'
        + '<th style="padding:7px 10px;text-align:center;font:500 10px/1 var(--font-m);color:var(--txm);text-transform:uppercase">Qty</th>'
        + '<th style="padding:7px 10px;font:500 10px/1 var(--font-m);color:var(--txm);text-transform:uppercase">Unit(AED)</th>'
        + '<th style="padding:7px 10px;font:500 10px/1 var(--font-m);color:var(--pu);text-transform:uppercase">Total(AED)</th>'
        + '</tr></thead>'
        + '<tbody>' + cRows
        + '<tr style="background:var(--s2)">'
        + '<td colspan="4" style="padding:6px 10px;font:600 11px/1 var(--font-m);color:var(--txd)">মোট Preparation Cost</td>'
        + '<td style="padding:6px 10px;color:var(--pu);font-weight:700;font-family:var(--font-m)">' + fA(ct) + '</td>'
        + '</tr></tbody></table></div>'
        + '<div style="padding:7px 12px;background:var(--s3);border-radius:0 0 var(--r) var(--r);font:400 11px/1 var(--font-b);color:var(--txd)">'
        + 'Avg Prep/PC: <b style="color:var(--pu)">' + fA(pp) + '</b> (' + fA(ct) + ' ÷ ' + pcs + ' pcs)</div>'
        + '</div>';
    } else {
      h += '<div style="padding:10px 12px;background:var(--s2);border-radius:var(--r);font:400 11px/1 var(--font-b);color:var(--txd);margin-bottom:12px">🔧 No Preparation Costs yet for this lot</div>';
    }

    // Final cost table
    if (mi.length) {
      h += '<div>' +
        '<div style="font:600 11px/1 var(--font-m);color:var(--gn);text-transform:uppercase;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--brd)">✅ Model-wise Final Cost (Purchase + Prep)</div>' +
        '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">' +
        '<thead><tr style="background:var(--s2)">' +
        '<th style="padding:8px 10px;text-align:left;font:500 10px/1 var(--font-m);color:var(--txm);text-transform:uppercase">Model</th>' +
        '<th style="padding:8px 10px;text-align:center;font:500 10px/1 var(--font-m);color:var(--txm);text-transform:uppercase">Qty</th>' +
        '<th style="padding:8px 10px;font:500 10px/1 var(--font-m);color:var(--txm);text-transform:uppercase">Unit</th>' +
        '<th style="padding:8px 10px;font:500 10px/1 var(--font-m);color:var(--txm);text-transform:uppercase">Pur.Total</th>' +
        '<th style="padding:8px 10px;font:500 10px/1 var(--font-m);color:var(--pu);text-transform:uppercase">AllocPrep</th>' +
        '<th style="padding:8px 10px;font:500 10px/1 var(--font-m);color:var(--gn);text-transform:uppercase">FinalTotal</th>' +
        '<th style="padding:8px 10px;font:500 10px/1 var(--font-m);color:var(--gn);text-transform:uppercase">Final/PC</th>' +
        '</tr></thead><tbody>' + fr +
        '<tr style="background:var(--gn2);border-top:2px solid var(--gn)">' +
        '<td style="padding:8px 10px;font:700 12px/1 var(--font-m);color:var(--gn)">GRAND TOTAL</td>' +
        '<td style="padding:8px 10px;text-align:center;font:700 12px/1 var(--font-m);color:var(--bl)">' + pcs + '</td>' +
        '<td></td>' +
        '<td style="padding:8px 10px;font:700 12px/1 var(--font-m);color:var(--gold)">' + fA(pt) + '</td>' +
        '<td style="padding:8px 10px;font:700 12px/1 var(--font-m);color:var(--pu)">' + fA(ct) + '</td>' +
        '<td style="padding:8px 10px;font:700 14px/1 var(--font-m);color:var(--gn)">' + fA(gt) + '</td>' +
        '<td style="padding:8px 10px;font:700 12px/1 var(--font-m);color:var(--gn)">' + fA(gpp) + '</td>' +
        '</tr></tbody></table></div></div>';
    }

    if (gel('lotModalTitle')) gel('lotModalTitle').textContent = '📋 ' + lot + ' — Full Cost Breakdown';
    if (gel('lotModalBody')) gel('lotModalBody').innerHTML = h;
    if (gel('lotModal')) gel('lotModal').classList.add('on');
  };

  // ══ rPurchases override — model KPI breakdown ══
  var _rp0 = window.rPurchases;
  window.rPurchases = function() {
    var result = _rp0 ? _rp0() : Promise.resolve();
    Promise.resolve(result).then(function() {
      var S = window.S || {};
      var pu = S.purchases || [];
      var co = S.courier || [];
      var lc = S.lot_costs || [];
      var lots = [];
      pu.forEach(function(p) { if (p.lot && lots.indexOf(p.lot) === -1) lots.push(p.lot); });
      if (!lots.length) return;

      var html = '';
      lots.forEach(function(lot) {
        var pi = pu.filter(function(p) { return p.lot === lot; });
        var ci = lc.filter(function(c) { return c.lot === lot; });
        var mi = [];
        pi.forEach(function(p) {
          if (p.items && p.items.length) {
            p.items.forEach(function(it) { mi.push({m: it.model || '?', q: it.qty || 0}); });
          } else if (p.model) {
            mi.push({m: p.model, q: p.qty || 0});
          }
        });
        var tp = mi.reduce(function(s, x) { return s + x.q; }, 0);
        var lco = co.filter(function(c) {
          return (c.lots || []).some(function(l) { return l.lotRef === lot; }) || c.lotRef === lot;
        });
        var tb = lco.reduce(function(s, c) { return s + (c.bookedQty || 0); }, 0);
        var tr2 = lco.reduce(function(s, c) { return s + (c.receivedQty || 0); }, 0);
        var itr = Math.max(0, tb - tr2);
        var rm = Math.max(0, tp - tb);
        var dp = tp > 0 ? Math.round(tr2 / tp * 100) : 0;
        var pv = pi.reduce(function(s, p) { return s + (p.totalAED || 0); }, 0);
        var cv = ci.reduce(function(s, c) { return s + (c.totalAED || 0); }, 0);
        var sup = pi[0] ? (pi[0].supplier || '') : '';

        var mr = '';
        mi.forEach(function(x) {
          var pct = tp > 0 ? (x.q / tp) : 0;
          var xt = tp > 0 ? Math.round(itr * pct) : 0;
          var xr = tp > 0 ? Math.round(tr2 * pct) : 0;
          var xl = Math.max(0, x.q - xt - xr);
          mr += '<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:4px;padding:4px 8px;border-bottom:1px solid var(--brd)">' +
            '<div style="font:400 11px/1.4 var(--font-b);color:var(--tx);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + x.m + '</div>' +
            '<div style="font:600 11px/1 var(--font-m);color:var(--bl);text-align:center">' + x.q + '</div>' +
            '<div style="font:600 11px/1 var(--font-m);color:var(--gold);text-align:center">' + xt + '</div>' +
            '<div style="font:600 11px/1 var(--font-m);color:var(--gn);text-align:center">' + xr + '</div>' +
            '<div style="font:600 11px/1 var(--font-m);color:var(--pu);text-align:center">' + xl + '</div></div>';
        });

        var lotBtn = '<span style="background:var(--bl2);border:1px solid var(--bl);border-radius:4px;padding:3px 10px;font:700 12px/1 var(--font-m);color:var(--bl);cursor:pointer" onclick="showLotDetail(' + JSON.stringify(lot) + ')">' + lot + ' &#9658;</span>';

        html += '<div style="background:var(--s1);border:1px solid var(--brd);border-radius:var(--rl);margin-bottom:14px;overflow:hidden">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--s2);border-bottom:1px solid var(--brd)">' +
          '<div style="display:flex;align-items:center;gap:10px">' + lotBtn +
          '<span style="font:400 12px/1 var(--font-b);color:var(--txd)">' + sup + '</span></div>' +
          '<span style="font:400 11px/1 var(--font-m);color:' + (dp === 100 ? 'var(--gn)' : 'var(--txd)') + '">Delivered: ' + dp + '%</span></div>' +
          '<div style="display:grid;grid-template-columns:repeat(4,1fr)">' +
          '<div style="padding:12px 8px;text-align:center;border-right:1px solid var(--brd)"><div style="font:400 9px/1 var(--font-m);color:var(--txm);text-transform:uppercase;margin-bottom:6px">Purchased</div><div style="font:700 22px/1 var(--font-m);color:var(--bl)">' + tp + '</div><div style="font:400 10px/1 var(--font-m);color:var(--txm)">pcs</div></div>' +
          '<div style="padding:12px 8px;text-align:center;border-right:1px solid var(--brd)"><div style="font:400 9px/1 var(--font-m);color:var(--txm);text-transform:uppercase;margin-bottom:6px">In Transit</div><div style="font:700 22px/1 var(--font-m);color:var(--gold)">' + itr + '</div><div style="font:400 10px/1 var(--font-m);color:var(--txm)">pcs</div></div>' +
          '<div style="padding:12px 8px;text-align:center;border-right:1px solid var(--brd)"><div style="font:400 9px/1 var(--font-m);color:var(--txm);text-transform:uppercase;margin-bottom:6px">CTG Rcvd</div><div style="font:700 22px/1 var(--font-m);color:var(--gn)">' + tr2 + '</div><div style="font:400 10px/1 var(--font-m);color:var(--txm)">pcs</div></div>' +
          '<div style="padding:12px 8px;text-align:center"><div style="font:400 9px/1 var(--font-m);color:var(--txm);text-transform:uppercase;margin-bottom:6px">Remaining</div><div style="font:700 22px/1 var(--font-m);color:var(--pu)">' + rm + '</div><div style="font:400 10px/1 var(--font-m);color:var(--txm)">pcs</div></div></div>' +
          (mi.length ?
            '<div>' +
            '<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:4px;padding:5px 8px;background:var(--s3);border-top:1px solid var(--brd)">' +
            '<div style="font:500 9px/1 var(--font-m);color:var(--txm);text-transform:uppercase">Model</div>' +
            '<div style="font:500 9px/1 var(--font-m);color:var(--bl);text-transform:uppercase;text-align:center">Bought</div>' +
            '<div style="font:500 9px/1 var(--font-m);color:var(--gold);text-transform:uppercase;text-align:center">Transit</div>' +
            '<div style="font:500 9px/1 var(--font-m);color:var(--gn);text-transform:uppercase;text-align:center">Rcvd</div>' +
            '<div style="font:500 9px/1 var(--font-m);color:var(--pu);text-transform:uppercase;text-align:center">Left</div></div>' +
            mr + '</div>' : '') +
          '<div style="padding:8px 14px;background:var(--s2);border-top:1px solid var(--brd);font:400 11px/1 var(--font-m);color:var(--txd)">Purchase: <b style="color:var(--gold)">' + fA(pv) + '</b>' +
          (cv > 0 ? ' | Prep: <b style="color:var(--pu)">' + fA(cv) + '</b> | Grand: <b style="color:var(--gn)">' + fA(pv + cv) + '</b>' : '') + '</div></div>';
      });

      var sd = document.getElementById('m3-lot-status');
      if (sd) sd.innerHTML = html;
    });
    return result;
  };

  console.log('[CTG Dubai v3.1] Model-wise features loaded OK');
})();
