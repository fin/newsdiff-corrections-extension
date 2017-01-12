var settings = JSON.parse(localStorage['newsdiff-settings']);

var sendMessage = function() {
  var sandbox = document.getElementById('sandbox');

  var diffs = getDiffs();
  diffs = Object.values(groupBy(diffs,'url')).map(function(x) {
    return x.sort(function(y,z) { return y.severity - z.severity; }).reverse()[0];
  });

  var message = {
    command: 'correction_template',
    context: {
      corrections: diffs,
      BASE_URL: BASE_URL(),
      TESTMODE: JSON.parse(localStorage['newsdiff-TESTMODE']),
    }
  };

  sandbox.contentWindow.postMessage(message,
                                    '*');
};

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(sendMessage,1000);
  document.querySelector('button#markread').addEventListener('click', function() {
    var read = JSON.parse(localStorage['newsdiff-diffs-seen']);
    var diffs = JSON.parse(localStorage['newsdiff-diffs']);
    Object.keys(diffs).map(function(k) {
      diffs[k].map(function(y) {
        read.push(y.id);
      });
    });
    localStorage['newsdiff-diffs-seen'] = JSON.stringify(read)
  });
});

window.addEventListener('message', function(event) {
  var data = event.data;
  document.getElementById('correction_list').innerHTML = data.html;
  Array.prototype.slice.call(document.querySelectorAll("#correction_list a")).map(function(e) {
    e.addEventListener('click', function(x) {
      markAsRead(e.getAttribute('data-url'));
    });
  });
});

