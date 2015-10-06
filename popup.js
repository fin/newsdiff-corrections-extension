var sendMessage = function() {
  var sandbox = document.getElementById('sandbox');

  var message = {
    command: 'correction_template',
    context: {corrections: [{title: 'test1',text:'text1'},
              {title: 'test2',text:'text2'}]}
  };

  sandbox.contentWindow.postMessage(message,
                                    '*');
};

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(sendMessage,100);
});

window.addEventListener('message', function(event) {
  var data = event.data;
  document.getElementById('correction_list').innerHTML = data.html;
});
