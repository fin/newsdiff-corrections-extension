BASE_URL = 'http://newsdiff.p.nomin.at/errata/';

localStorage['newsdiff-sites'] = localStorage['newsdiff-sites'] || [];

function request(url, callback) {
  var sitesReq = new XMLHttpRequest();
  sitesReq.addEventListener('load', callback);
  sitesReq.open('get', url , true);
  sitesReq.send();
  return sitesReq;
}

function parse_url(url) {
  var el = document.createElement('a');
  el.href = url;
  return el;
}

function received_sites(evt) {
  localStorage['newsdiff-sites'] = this.responseText;
}

function handle_new_diffs(new_diffs) {
  console.log('AAAAAAAAAAAAAH', new_diffs);
}

function received_diffs(ymd) {
  if(this.status!=200) {
    return;
  }
  var new_diffs = JSON.parse(this.responseText);
  var diffs = JSON.parse(localStorage['newsdiff-diffs']);
  var current_diffs = diffs[ymd] || {};
  diffs[ymd] = new_diffs;
  localStorage['newsdiff-diffs'] = JSON.stringify(diffs);

  handle_new_diffs(_.filter(new_diffs, function(x) {
    return current_diffs.indexOf(x)>=0;
  }));
}

function is_active_site(hostname) {
  var results = JSON.parse(localStorage['newsdiff-sites'] || '[]').map(function(x) {
    return hostname.indexOf(x)>=0;
  });
  return results.indexOf(true)>=0;
}

function log_visit(obj) {
  var cur = JSON.parse(localStorage['newsdiff-visits'] || '[]');
  cur.push({timestamp: obj.timeStamp, url: obj.url});
  localStorage['newsdiff-visits'] = JSON.stringify(cur);
}

function onAlarm() {
  request(BASE_URL+'sites.json', received_sites);

  for(var i=0;i<3;i++) {
    console.log(i);
    var d = new Date();
    d.setDate(d.getDate() - i);
    var ymd = d.toISOString().split('T')[0];
    request(BASE_URL+ymd+'.json', function() { received_diffs.bind(this, ymd)(); });
  }
}

function onInit() {
  onAlarm();
}

function onNavigate(obj) {
  if(!obj.transitionType.startsWith('auto_')) {
    if(is_active_site(parse_url(obj.url).hostname)) {
      log_visit(obj);
    }
  }
}

window.addEventListener('message', function(event) {
  var data = event.data;
  console.log('received', data);
});


chrome.runtime.onInstalled.addListener(onInit);
chrome.webNavigation.onCommitted.addListener(onNavigate);

chrome.alarms.create("newshelper-refresh", {periodInMinutes: 20})
chrome.alarms.onAlarm.addListener(onAlarm);
