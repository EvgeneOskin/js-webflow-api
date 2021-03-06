"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var isObjectEmpty = exports.isObjectEmpty = function isObjectEmpty(obj) {
  return Object.keys(obj).length === 0;
};

var pick = exports.pick = function pick(obj) {
  for (var _len = arguments.length, props = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    props[_key - 1] = arguments[_key];
  }

  var picked = {};

  props.forEach(function (prop) {
    if (obj[prop] !== undefined) {
      picked[prop] = obj[prop];
    }
  });

  return picked;
};