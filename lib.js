BASE_URL = function() {
  if(JSON.parse(localStorage['newsdiff-TESTMODE'])) {
  return 'http://localhost:8000/errata/';
  }
  return 'http://newsdiff.p.nomin.at/errata/';
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

function getDiffs() {
  var newsdiff_visits = JSON.parse(localStorage['newsdiff-visits']).map(function(x) {
    x['url'] = url_modify(x['url']);
    x.date = new Date(x.timestamp);
    return x;
  });

  var d = JSON.parse(localStorage['newsdiff-diffs']);
  var diffs = Object.keys(d).map(function(x) { return d[x]; }).reduce(function(x,y) {
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

  diffs = diffs.filter(function(x) {
          return x.id && diffs_seen.indexOf(x.id)<0;
        }).filter(function(x) {
          return x.severity>=settings.display_severity;
        }).filter(function(x) {
          if(settings.display_all) {
            console.log('display_all override');
            return true;
          }

          x.time_ = new Date(x.time);
          v = newsdiff_visits.filter(function(v) {
            return x.time_ > v.date && v.url==url_modify(x.url);
          });
          return v.length>0;
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
