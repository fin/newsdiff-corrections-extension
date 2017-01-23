SERVER_URL = function() {
  if(JSON.parse(localStorage['newsdiff-TESTMODE'])) {
    return 'http://localhost:8000';
  }
  return 'http://newsdiff.p.nomin.at';
}

BASE_URL = function() {
  return SERVER_URL() + '/errata/'
}

var url_modify = function(url) {
  return url.toLowerCase().split(/\/\//).reverse()[0].split(/\?/)[0];
}

var groupBy = function(xs, key) {
    return xs.reduce(function(rv, x) {
      (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};

function filterVisitedDiffs(new_diffs) {
  var visits = JSON.parse(localStorage['newsdiff-visits']).map(function(x) {
    x.date = new Date(x.timestamp);
    return x;
  });
  var visited_diffs = new_diffs.filter(function(x) {
    x.time_ = new Date(x.time);
    var matching_vs = visits.filter(function(y) {
      return url_modify(y.url)==url_modify(x.url) &&
            x.time_ > y.date;
    });
    return matching_vs.length>0;
  });
  return visited_diffs;
}

function getDiffs_basic() {
  var d = JSON.parse(localStorage['newsdiff-diffs']);
  var settings = JSON.parse(localStorage['newsdiff-settings']);
  var diffs = Object.keys(d).map(function(x) { return d[x];
  }).reduce(function(x,y) {
    return x.concat(y);
  }, []).sort(function(x,y) {
    if(x.time<y.time) {
      return -1;
    }
    if(x.time>y.time) {
      return 1;
    }
    return 0;
  }).reverse();


  var diffs_seen = JSON.parse(localStorage['newsdiff-diffs-seen']);
  diffs = filterVisitedDiffs(diffs).filter(function(x) {
          return x.id && diffs_seen.indexOf(x.id)<0;
        });

  return diffs;
}

function getDiffs() {
  var diffs = getDiffs_basic();

  diffs = diffs.filter(function(x) {
          return x.severity>=settings.display_severity;
        });
  return diffs;
};


function markAsRead(url) {
    var nds = JSON.parse(localStorage['newsdiff-diffs-seen'])
    Object.values(JSON.parse(localStorage['newsdiff-diffs'])).map(function(y) {
      y.map(function(x) {
        if(url_modify(x.url) == url_modify(url)) {
          nds.push(x.id);
        }
      })
    })
    if(nds.length>300) {
      nds = nds.slice(nds.length-300,nds.length);
    }
    localStorage['newsdiff-diffs-seen'] = JSON.stringify(nds);
}

function log(category, number, context) {
  if(!JSON.parse(localStorage['newsdiff-settings']).send_stats) {
    return;
  }
  var l = JSON.parse(localStorage['newsdiff-log']);
  var entry = {'time': new Date().toISOString(), 'category': category, 'number': number, 'context': context}
  console.log('logging', entry);
  l.push(entry);
  localStorage['newsdiff-log'] = JSON.stringify(l);
}
