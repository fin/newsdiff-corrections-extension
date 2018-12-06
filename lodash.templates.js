;(function() {
  var undefined;

  var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

  var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

  var root = freeGlobal || freeSelf || Function('return this')();

  var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

  var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

  var _ = root._ || {};

  /*----------------------------------------------------------------------------*/

  var templates = {
    'correction-template': {}
  };

  templates['correction-template'] =   function(obj) {
    obj || (obj = {});
    var __t, __p = '', __j = Array.prototype.join;
    function print() { __p += __j.call(arguments, '') }
    with (obj) {
    __p += '      ';
     if(TESTMODE) {
    __p += '\n        TEST TEST TEST\n      ';
     }
    __p += '\n      <ul>\n      ';
     _.each(corrections, function(c) {
    __p += '\n        <li class="' +
    ((__t = (c.severity>=50?'important':'')) == null ? '' : __t) +
    '">\n            <a target="_blank" href="http://' +
    ((__t = (new URL(BASE_URL).hostname)) == null ? '' : __t) +
    '' +
    ((__t = (c.link)) == null ? '' : __t) +
    '" data-id="' +
    ((__t = (c.id)) == null ? '' : __t) +
    '" data-url="' +
    ((__t = (c.url)) == null ? '' : __t) +
    '">\n<h4>' +
    ((__t = (new URL(c.url).hostname.replace(/^www\./,'') )) == null ? '' : __t) +
    ': ' +
    ((__t = ((c.title || '').slice(0,50))) == null ? '' : __t) +
    '' +
    ((__t = (c.title.length>50?'…':'')) == null ? '' : __t) +
    '</h4>\n<p>' +
    ((__t = (c.update)) == null ? '' : __t) +
    '</p></a>\n        </li>\n      ';
     }) ;
    __p += '\n      </ul>\n\n';

    }
    return __p
  };

  /*----------------------------------------------------------------------------*/

  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    define(['lodash'], function(lodash) {
      _ = lodash;
      lodash.templates = lodash.extend(lodash.templates || {}, templates);
    });
  }
  else if (freeModule) {
    _ = require('lodash');
    (freeModule.exports = templates).templates = templates;
    freeExports.templates = templates;
  }
  else if (_) {
    _.templates = _.extend(_.templates || {}, templates);
  }
}.call(this));
