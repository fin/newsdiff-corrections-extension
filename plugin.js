
localStorage['newsdiff-sites'] = localStorage['newsdiff-sites'] || '[]';
localStorage['newsdiff-visits'] = localStorage['newsdiff-visits'] || '[]';
localStorage['newsdiff-diffs'] = localStorage['newsdiff-diffs'] || '{}';
localStorage['newsdiff-sites'] = localStorage['newsdiff-sites'] || '[]';
localStorage['newsdiff-TESTMODE'] = localStorage['newsdiff-TESTMODE'] || 'false';

localStorage['newsdiff-diffs-seen'] = localStorage['newsdiff-diffs-seen'] || '[]';
if(localStorage['newsdiff-diffs-seen']=='{}') {
  localStorage['newsdiff-diffs-seen']='[]';
}

localStorage['newsdiff-log'] = localStorage['newsdiff-log'] || '[]';
localStorage['newsdiff-last-log-timestamp'] = localStorage['newsdiff-last-log-timestamp'] || new Date().toISOString();


localStorage['newsdiff-settings'] = localStorage['newsdiff-settings'] || JSON.stringify({
   notification_severity: 10,
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
function post_request(url, data, callback) {
  var d = new FormData();
  Object.keys(data).map(function(k) {
    var v = data[k];
    d.append(k,v);
  });
  var sitesReq = new XMLHttpRequest();
  if(callback) {
    sitesReq.addEventListener('load', callback);
  }
  sitesReq.open('POST', url , true);
  sitesReq.send(d);
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
  log('notification_shown', 1);
  var o = {
    type: 'basic',
    iconUrl: 'icon.png',
    title: diff.update,
    message: new URL(diff.url).hostname+': '+diff.title
  };
  if(navigator.userAgent.indexOf('Firefox')<0) {
      o.buttons = [{title: 'Show Difference'},
                {title: 'Dismiss'}
      ];
  }
  chrome.notifications.create('notification-'+diff.id, o);
}

function summarize_log() {
  var l = JSON.parse(localStorage['newsdiff-log']);
  var by_c = groupBy(l, 'category')

  console.log(by_c);
  var r = {};
  Object.keys(by_c).map(function(k) {
    var x = by_c[k];
    r[k] = x.reduce(function(y,z) {
      return y+z.number;
    }, 0);
  });
  return r;
}

function handle_new_diffs(new_diffs) {
  if(new_diffs.length==0) {
    return;
  }
  console.log('new_diffs: ', new_diffs.length)
  var settings = JSON.parse(localStorage['newsdiff-settings']);
  var visited_diffs = filterVisitedDiffs(new_diffs);
  if(visited_diffs.length>0) {
    log('new_diffs', new_diffs.length);
  }
  visited_diffs.filter(function(x) {
    return settings.display_severity <= x.severity;
  }).map(function(x) {
    log('new_diffs_could_be_displayed', 1, x);
  });
  visited_diffs.filter(function(x) {
    return settings.notification_severity <= x.severity;
  }).map(function(x) {
    showNotification(x);
  });
}

function received_diffs(ymd) {
  if(this.status!=200 || this.responseText.length==0) {
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
  log('news site url visited', 1);
}

function send_stats_now() {
  if(!JSON.parse(localStorage['newsdiff-settings']).send_stats) {
    return;
  }
  var settings = JSON.parse(localStorage['newsdiff-settings']);

  var cur_date = new Date().toISOString();

  post_request(SERVER_URL()+'/stats/insert/', {
    'data': JSON.stringify(summarize_log()),
    'identifier': settings.unique_id,
    'last_date': localStorage['newsdiff-last-log-timestamp'],
    'cur_date': cur_date,
  }, function(evt) {
    localStorage['newsdiff-last-log-timestamp'] = cur_date;
    localStorage['newsdiff-log'] = '[]';
  });
}

function logsubmit_iftime() {
  var last = new Date(localStorage['newsdiff-last-log-timestamp']);
  var cur = new Date()
  var diff = cur - last;
  if(diff > 1000*60*60*24) {
    send_stats_now();
  }
}

function onAlarm(alarm) {
  logsubmit_iftime();
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
//chrome.alarms.create("logsubmit", {periodInMinutes: 1440})
chrome.alarms.onAlarm.addListener(onAlarm);

chrome.notifications.onButtonClicked.addListener(
  function(notificationId,buttonId) {
    var diffs = [].concat.apply([], Object.values(JSON.parse(localStorage['newsdiff-diffs'])));
    var diff = diffs.filter(function(x) {
      return x.id == notificationId.split('-')[1];
    })[0];
    if(buttonId == 0) {
      log('notification opened details', 1);
      log('notification opened details-hour-'+(new Date().getHours()), 1); // by hour
      log('notification opened details-severity-'+diff.severity, 1); // by hour
      chrome.tabs.create({url: 'http://'+new URL(BASE_URL()).hostname+diff.link});
      markAsRead(diff.url);
    } else {
      log('notification marked as read', 1);
      log('notification marked as read-hour-'+(new Date().getHours()), 1); // by hour
      log('notification marked as read-severity-'+diff.severity, 1); // by hour
      markAsRead(diff.url);
    }
    chrome.notifications.clear(notificationId);
  }
);

chrome.notifications.onClicked.addListener(function(notificationId) {
    var diffs = [].concat.apply([], Object.values(JSON.parse(localStorage['newsdiff-diffs'])));
    var diff = diffs.filter(function(x) {
      return x.id == notificationId.split('-')[1];
    })[0];
    log('notification opened notification details', 1);
    log('notification opened notification details-hour-'+(new Date().getHours()), 1); // by hour
    log('notification opened notification details-severity-'+diff.severity, 1); // by hour
    chrome.tabs.create({url: 'http://'+new URL(BASE_URL()).hostname+diff.link});
    markAsRead(diff.url);
    chrome.notifications.clear(notificationId);
});


if (!window.localStorage.getItem('hasSeenIntro')) {
  window.localStorage.setItem('hasSeenIntro', 'yep');
  chrome.tabs.create({
    url: '/options.html'
  });
}
