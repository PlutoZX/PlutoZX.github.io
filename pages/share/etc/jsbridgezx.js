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
    global.jrWalletBridge = factory(global); // 最后暴露给前端的jrWalletBridge对象
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
        tasks[i].call(this.data, this.data); // 依次调用每一个任务函数，并且把任务函数中的this指向实例的data属性也就是resolve传进来的data，另外还有个入参data
        tasks.shift(); // 调用一个清掉一个
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
        bridge.registerHandler("h5ListenerNative", fn) //通过bridge对象，进行相互调用函数注册, //注册IOS调用JS方法，并返回data /JS调用OC的分享方法（当然需要OC提前注册）share为方法名，shareData为参数，后面的为回调function  //OC端通过block回调分享成功或者失败的结果
      }

      iosEtcH5InvokeNative = function (option) {
        bridge.callHandler("etcH5InvokeNative", option, function (response) { })
      }

      deffer.resolve(Api);
    };

    if (global.WebViewJavascriptBridge) { // iOS OC的js通信方法库
      onBridgeReady(global.WebViewJavascriptBridge)//通过回调可以获取WebViewJavascriptBridge的对象bridge，通过该对象进行互相调用函数的绑定
    }
    if (global.WVJBCallbacks) {
      global.WVJBCallbacks.push(onBridgeReady)
    } else {
      if (REG_APPLE_SETS.test(USR_AGENT)) { // 创建了一个不可见的iframe进行发出url跳转事件用于让OC截获,之后把你想进行交互的代码放在一个匿名函数中当参数传给setupWebViewJavascriptBridge 跳转到自定义URL Scheme构成的链接，而Objective-C中捕获该链接，从中解析必要的参数，实现JS到OC的一次交互。 而在Objective-C中，只要遵循了UIWebViewDelegate协议，那么每次打开一个链接之前，都会触发方法  在该方法中，捕获该链接，并且返回NO（阻止本次跳转），从而执行对应的OC方法。其实，WebViewJavascriptBridge使用的方案就是拦截URL，为了解决无法直接获取返回值的缺点，它采用了将一个名为callback的function作为参数，通过一些封装，传递到OC（js->oc 传递参数和callbackId），然后在OC端执行完毕，再通过block来回调callback（oc->js，传递返回值参数），实现异步获取返回值，
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
        global.document.addEventListener("WebViewJavascriptBridgeReady", function () { // 等第三方库加载完 调用ready方法
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

  function jsEtcH5InvokeNative (option) { //
    if (REG_APPLE_SETS.test(USR_AGENT)) {
      iosEtcH5InvokeNative && iosEtcH5InvokeNative(option) // iOS 用callHandler的方式 这个方法也是三方库注册到webview里的
    } else {
      global.jd.etcH5InvokeNative(getAndJson(option)) // 安卓给webview注册了一个jd对象有个etcH5InvokeNative方法
    }
  }

  return {
    onReady: onReady,
    jsH5ListenerNative: jsH5ListenerNative,
    jsEtcH5InvokeNative: jsEtcH5InvokeNative
  }
}));


// 除了拦截URL的方法，还可以利用上面提到的JavaScriptCore。它十分强大，强大在哪里呢？下面我们来一探究竟。
// 当然，还是需要在页面加载完成时，先获取js上下文。获取到之后，我们就可以进行强大的方法映射了。
// 比如js中我定义了一个分享的方法
// function share(title, imgUrl, link) {
//   //这里需要OC实现
// }
// - (void)webViewDidFinishLoad:(UIWebView *)webView
// {
//   //将js的function映射到OC的方法
//   [self convertJSFunctionsToOCMethods];
// }
//
// - (void)convertJSFunctionsToOCMethods
// {
//   //获取该UIWebview的javascript上下文
//   //self持有jsContext
//   //@property (nonatomic, strong) JSContext *jsContext;
//   self.jsContext = [self.webView valueForKeyPath:@"documentView.webView.mainFrame.javaScriptContext"];
//
//   //js调用oc
//   //其中share就是js的方法名称，赋给是一个block 里面是oc代码
//   //此方法最终将打印出所有接收到的参数，js参数是不固定的
//   self.jsContext[@"share"] = ^() {
//   NSArray *args = [JSContext currentArguments];//获取到share里的所有参数
//   //args中的元素是JSValue，需要转成OC的对象
//   NSMutableArray *messages = [NSMutableArray array];
//   for (JSValue *obj in args) {
//     [messages addObject:[obj toObject]];
//   }
//   NSLog(@"点击分享js传回的参数：\n%@", messages);
// };
// 在html或者js的某处，点击a标签调用这个share方法，并传参，如
// 上面的方法，都是同步函数，如果我想实现JS调用OC的方法，并且异步接收回调，那么该怎么做呢？
// 从封装的角度上讲，js的share方法的参数是一个对象，该对象包含了几个必要的字段，以及一个回调函数，这个回调函数有点像oc的block，调用者把一个function传入一个function当作参数，在适当时候，方法内实现者调用该function，实现对调用者的异步回调。

// WKWebView
// URL拦截 同 UIwebview类似
// scriptMessageHandler
// 其实Apple的注释已经很清楚了，在OC中添加一个scriptMessageHandler，则会在all frames中添加一个js的function： window.webkit.messageHandlers.<name>.postMessage(<messageBody>) 。那么当我在OC中通过如下的方法添加了一个handler，如
// 我在OC中将会收到WKScriptMessageHandler的回调
// 这样就完成了一次完整的JS -> OC的交互。
//
// 问题：
//
// 该方法还是没有办法直接获取返回值。
// 通过window.webkit.messageHandlers.<name>.postMessage(<messageBody>)传递的messageBody中不能包含js的function，如果包含了function，那么 OC端将不会收到回调。
// 对于问题1，我们可以采用异步回调的方式，将返回值返回给js。对于问题2，一般js的参数中包含function是为了异步回调，这里我们可以把js的function转换为字符串，再传递给OC。

// 我们来简单分析一下，点击之后，触发了test()函数，test()中封装了对share()函数的调用，且传了一个对象作为参数，对象中result字段对应的是个匿名函数，紧接着share()函数调用，其中的实现是2s过后，result(true);模拟js异步实现异步回调结果，分享成功。同时share()函数中，因为通过scriptMessageHandler无法传递function，所以先把shareData对象中的result这个匿名function转成String，然后替换shareData对象的result属性为这个String，并回传给OC，OC这边对应JS对象的数据类型是NSDictionary，我们打印并得到了所有参数，同时，把result字段对应的js function String取出来。这里我们延迟4s回调，模拟Native分享的异步过程，在4s后，也就是js中显示success的2s过后，调用js的匿名function，并传递参数（分享结果）。调用一个js function的方法是 functionName(argument); ，这里由于这个js的function已经是一个String了，所以我们调用时，需要加上()，如 (functionString)(argument);因此，最终我们通过OC -> JS 的evaluateJavaScript:completionHandler:方法，成功完成了异步回调，并传递给js一个分享失败的结果。
// 上面的描述看起来很复杂，其实就是先执行了JS的默认实现，后执行了OC的实现。上面的代码展示了如何解决scriptMessageHandler的两个问题，并且实现了一个 JS -> OC、OC -> JS 完整的交互流程。
