/* eslint-disable */

(function (global, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    define(function () {
      return (global.jrWalletBridge = factory(global));
    });
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(global);
  } else {
    global.jrWalletBridge = factory(global);
  }
}(typeof window !== 'undefined' ? window : this, function (global) {
  function Promise () {
    this.tasks = [];
    this.state = 'pending';
    this.data = null;
  }

  Promise.prototype = {
    constructor: Promise,
    resolve: function (data) {
      this.state = 'resolved';
      data && (this.data = data);

      var i = 0,
        tasks = this.tasks,
        len = tasks.length;
      for (; i < len; i++) {
        tasks[i].call(this.data, this.data);
        tasks.shift();
      }
    },
    then: function (fn) {
      if (typeof fn === 'function') {
        this.tasks.push(fn);
        if (this.state === 'resolved') this.resolve();
      }
      return this;
    }
  };

  var USR_AGENT = global.navigator.userAgent;
  var REG_APPLE_SETS = /(iPhone|iPad|iPod)/i;

  function formateDate (str) {
    (typeof str == "string") && (str = str.replace(/\"/g, "'"));
    return str
  }
  function formateArray (arr) {
    var arrt = "";
    if (arr instanceof Array) {
      for (var i = 0, j = arr.length; i < j; i++) {
        arrt += '"' + arr[i] + '",'
      }
      return arrt.substring(0, arrt.length - 1)
    }
  }
  function getAndJson (option) {
    var _option = "{";
    for (key in option) {
      if (typeof option[key] === "object") {
        if (option[key] instanceof Array) {
          _option += '"' + key + '":[' + formateArray(option[key]) + "],"
        } else {
          _option += '"' + key + '":' + getAndJson(option[key]) + ","
        }
      } else {
        _option += '"' + key + '":"' + formateDate(option[key]) + '",'
      }
    }
    _option = _option.substring(0, _option.length - 1);
    _option += "}";
    return _option
  }

  function onReady () {
    var deffer = new Promise();
    var Api = this;
    var onBridgeReady = function (bridge) {
      h5ListenerNative = function (fn) {
        bridge.registerHandler("h5ListenerNative", fn)
      }

      iosEtcH5InvokeNative = function (option) {
        bridge.callHandler("etcH5InvokeNative", option, function (response) { })
      }

      deffer.resolve(Api);
    };

    if (global.WebViewJavascriptBridge) {
      onBridgeReady(global.WebViewJavascriptBridge)
    } if (global.WVJBCallbacks) {
      global.WVJBCallbacks.push(onBridgeReady)
    } else {
      if (REG_APPLE_SETS.test(USR_AGENT)) {
        window.WVJBCallbacks = [onBridgeReady];
        var WVJBIframe = document.createElement('iframe');
        WVJBIframe.style.display = 'none';
        WVJBIframe.src = 'https://__bridge_loaded__';
        document.documentElement.appendChild(WVJBIframe);
        setTimeout(function() {
          document.documentElement.removeChild(WVJBIframe)
        }, 0)
      }

      if (global.document.attachEvent) {
        onBridgeReady(global.WebViewJavascriptBridge)
      } else {
        global.document.addEventListener("WebViewJavascriptBridgeReady", function () {
          onBridgeReady(global.WebViewJavascriptBridge)
        }, false);
        if (!REG_APPLE_SETS.test(USR_AGENT)) {
          deffer.resolve(Api)
        }
      }
    }

    return deffer
  }

  function jsH5ListenerNative (fn) {
    if (REG_APPLE_SETS.test(USR_AGENT)) {
      h5ListenerNative && h5ListenerNative(fn)
    } else {
      global.h5ListenerNative = fn
    }
  }

  function jsEtcH5InvokeNative (option) {
    if (REG_APPLE_SETS.test(USR_AGENT)) {
      iosEtcH5InvokeNative && iosEtcH5InvokeNative(option)
    } else {
      global.jd.etcH5InvokeNative(getAndJson(option))
    }
  }

  return {
    onReady: onReady,
    jsH5ListenerNative: jsH5ListenerNative,
    jsEtcH5InvokeNative: jsEtcH5InvokeNative
  }
}));
