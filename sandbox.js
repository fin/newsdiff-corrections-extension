_.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
_.templateSettings.evaluate = /%%([\s\S]+?)%%/g;

window.addEventListener('message', function(event) {
  correction_template = _.template(document.getElementById('correction-template').innerHTML)
  function render_correction(c) {
    return correction_template(c);
  }
  var command = event.data.command;
  var name = event.data.name || 'hello';
  switch(command) {
    case 'correction_template':
      event.source.postMessage({
        name: name,
        html: render_correction(event.data.context),
        wtf: document.getElementById('correction-template').innerHTML,
        orig: event.data.context,
        origCommand: command
      }, event.origin);
      break;
  }
});

document.addEventListener('DOMContentLoaded', function() {
});
