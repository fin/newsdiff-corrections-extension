function set_setting(name, value) {
  var cur_settings = JSON.parse(localStorage['newsdiff-settings']);
  cur_settings[name] = value;
  localStorage['newsdiff-settings'] = JSON.stringify(cur_settings );
}


document.addEventListener('DOMContentLoaded', function() {
  var cur_settings = JSON.parse(localStorage['newsdiff-settings']);
  Array.prototype.slice.call(document.querySelectorAll('[name="notification_severity"]')).map(function(x) {
    if(x.value==cur_settings.notification_severity) {
      x.checked=true;
    }
    x.addEventListener('click', function(x) {
      set_setting('notification_severity', parseInt(this.value,10));
    });
  });
  Array.prototype.slice.call(document.querySelectorAll('[name="display_severity"]')).map(function(x) {
    if(x.value==cur_settings.display_severity) {
      x.checked=true;
    }
    x.addEventListener('click', function(x) {
      set_setting('display_severity', parseInt(this.value,10));
    });
  });

  document.querySelector('#send_stats').checked=cur_settings.send_stats;
  document.querySelector('#send_stats').addEventListener('click', function(x) {
    set_setting('send_stats', this.checked);
  });
  document.querySelector('#name').value=cur_settings.unique_id;
  document.querySelector('#name').addEventListener('click', function(x) {
    set_setting('send_stats', this.value);
  });
});
