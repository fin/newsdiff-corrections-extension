
localStorage['newsdiff-sites'] = localStorage['newsdiff-sites'] || '[]';
localStorage['newsdiff-visits'] = localStorage['newsdiff-visits'] || '[]';
localStorage['newsdiff-diffs'] = localStorage['newsdiff-diffs'] || '{}';
localStorage['newsdiff-sites'] = localStorage['newsdiff-sites'] || '[]';
localStorage['newsdiff-TESTMODE'] = localStorage['newsdiff-TESTMODE'] || 'false';

localStorage['newsdiff-diffs-seen'] = localStorage['newsdiff-diffs-seen'] || '{}';


localStorage['newsdiff-settings'] = localStorage['newsdiff-settings'] || JSON.stringify({
   notification_severity: 50,
   display_severity: 0,
   display_all: false,
   send_stats: true,
   send_logs: true,
   unique_id: Math.round(Math.random()*1000)
});

var NUM_DAYS_CHECK = 3;

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
  //console.log('AAAAAAAAAAAAAH', new_diffs);
}

function received_diffs(ymd) {
  if(this.status!=200) {
    return;
  }
  var new_diffs = JSON.parse(this.responseText);
  var diffs = JSON.parse(localStorage['newsdiff-diffs']);
  var current_diffs = diffs[ymd] || [];
  diffs[ymd] = new_diffs;
  var newdiffs = {};
  Object.keys(diffs).sort().slice(-4).map(function(k) {
    newdiffs[k] = diffs[k];
  });
  localStorage['newsdiff-diffs'] = JSON.stringify(newdiffs);

  handle_new_diffs(new_diffs.filter(function(x) {
    return current_diffs.indexOf(x)<0;
  }));
}

function is_active_site(hostname) {
  var results = JSON.parse(localStorage['newsdiff-sites']).map(function(x) {
    return hostname.indexOf(x)>=0;
  });
  return results.indexOf(true)>=0;
}

function log_visit(obj) {
  var cur = JSON.parse(localStorage['newsdiff-visits']);
  cur.push({timestamp: obj.timeStamp, url: obj.url});
  if(cur.length>300) {
    cur = cur.slice(cur.length-300,cur.length);
  }
  localStorage['newsdiff-visits'] = JSON.stringify(cur);
}

function onAlarm() {
  console.log('init/alarm received');
  request(BASE_URL()+'sites.json', received_sites);

  for(var i=0;i<NUM_DAYS_CHECK;i++) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    var ymd = d.toISOString().split('T')[0];
    (function(ymd) {
      request(BASE_URL()+ymd+'.json', function() { received_diffs.bind(this, ymd)(); });
    }).bind(this,ymd)();
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


chrome.runtime.onInstalled.addListener(onInit);
chrome.webNavigation.onCommitted.addListener(onNavigate);

chrome.alarms.create("newshelper-refresh", {periodInMinutes: 20})
chrome.alarms.onAlarm.addListener(onAlarm);

