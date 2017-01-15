
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
   send_stats: false,
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

function showNotification(diff) {
  console.log('show notification', diff);
  chrome.notifications.create('notification-'+diff.id, {
    type: 'basic',
    iconUrl: 'icon.png',
    title: diff.update,
    message: new URL(diff.url).hostname+': '+diff.title,
    buttons: [{title: 'Unterschiede ansehen'},
              {title: 'Nicht mehr anzeigen'}
    ]
  });
}

function handle_new_diffs(new_diffs) {
  var settings = JSON.parse(localStorage['newsdiff-settings']);
  var visits = JSON.parse(localStorage['newsdiff-visits']).map(function(x) {
    x.date = new Date(x.timestamp);
    return x;
  });
  new_diffs.filter(function(x) {
    return settings.notification_severity <= x.severity;
  }).filter(function(x) {
    x.time_ = new Date(x.time);
    var matching_vs = visits.filter(function(y) {
      return url_modify(y.url)==url_modify(x.url) &&
            x.time_ > y.date;
    });
    return matching_vs.length>0 &&
      matching_vs.filter(function(y) {
    }).length>0;
  }).map(function(x) {
    showNotification(x);
  });
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
    return current_diffs.map(function(x) { return x.id; }).indexOf(x.id)<0;
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


chrome.notifications.onButtonClicked.addListener(
  function(notificationId,buttonId) {
    var diffs = [].concat.apply([], Object.values(JSON.parse(localStorage['newsdiff-diffs'])));
    var diff = diffs.filter(function(x) {
      return x.id == notificationId.split('-')[1];
    })[0];
    if(buttonId == 0) {
      chrome.tabs.create({url: 'http://'+new URL(BASE_URL()).hostname+diff.link});
      markAsRead(diff.url);
    } else {
      markAsRead(diff.url);
    }
    chrome.notifications.clear(notificationId);
  }
);

