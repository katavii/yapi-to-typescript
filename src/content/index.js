var jstt = require('./bundle');
var httpRequest = new XMLHttpRequest();

var options = {
  bannerComment: '',
  declareExternallyReferenced: true,
  enablevarEnums: true,
  unreachableDefinitions: false,
  strictIndexSignatures: false,
  format: false,
  unknownAny: false
};

function copy(value) {
  var copy = document.createElement('textarea');
  document.body.appendChild(copy);
  copy.value = value;
  copy.select();
  document.execCommand('copy');
  document.body.removeChild(copy);
}

function formatJson(object) {
  var cloneObject = JSON.parse(JSON.stringify(object));
  cloneObject.additionalProperties = false;

  function loop(looper) {
    for (var key in looper) {
      if (looper[key].properties) {
        looper[key].additionalProperties = false;
      }
      if (typeof looper[key] === 'object') {
        loop(looper[key]);
      }
    }
  }
  loop(cloneObject);
  return cloneObject;
}

function request() {
  return new Promise(function (resolve, reject) {
    var interfaceId = window.location.pathname.replace(
      /\/project\/\d+\/interface\/api\//,
      ''
    );
    httpRequest.open(
      'GET',
      'https://' +
        window.location.host +
        '/api/interface/get?id=' +
        interfaceId,
      true
    );
    httpRequest.send();
    httpRequest.onreadystatechange = function () {
      if (httpRequest.readyState == 4 && httpRequest.status == 200) {
        resolve(httpRequest.responseText);
      }
    };
  });
}

function message(opt) {
  var $box = document.createElement('div');
  $box.classList = 'jstt-msg';

  var $img = document.createElement('img');
  var imgMap = {
    success: 'https://pic4.zhimg.com/v2-308857143bde384e934febb773155e6f.png',
    error: 'https://pic4.zhimg.com/v2-4ce78427966a67b427e33d87cdb9797f.png'
  };
  $img.src = imgMap[opt.type];

  var $text = document.createElement('div');

  $text.innerText = opt.text || 'success~';

  $box.appendChild($img);
  $box.appendChild($text);

  document.body.appendChild($box);

  setTimeout(function () {
    $box.classList = 'jstt-msg is-leaving';
    $box.addEventListener('transitionend', function () {
      document.body.contains($box) && document.body.removeChild($box);
    });
  }, 2000);
}

document.addEventListener('DOMContentLoaded', function (e) {
  var documentThis = e.target;

  var $btnWrapper = document.createElement('div');
  $btnWrapper.classList = 'jstt';

  var $title = document.createElement('h4');
  $title.innerText = 'TS 类型定义';
  $title.classList = 'jstt-title';
  $btnWrapper.appendChild($title);

  var $resBtn = document.createElement('button');
  $resBtn.style.cursor = 'pointer';
  $resBtn.innerText = '返回数据';
  $resBtn.classList = 'jstt-res-btn';
  $resBtn.onclick = function () {
    $resBtn.innerText = '生成中...';
    request()
      .then(function (result) {
        return JSON.parse(result).data;
      })
      .then(function (result) {
        var resBody = eval('(' + result.res_body + ')');
        var json = (resBody.properties && resBody.properties.data) || resBody;
        var splitPath = result.path.split('/');
        var lastRoute = splitPath[splitPath.length - 1];
        var name = lastRoute.substr(0, 1).toUpperCase() + lastRoute.slice(1);
        return jstt.compile(formatJson(json), name, options);
      })
      .then(function (ts) {
        copy(ts);
        $resBtn.innerText = '返回数据';
        message({ text: '复制成功', type: 'success' });
      })
      .catch(function (e) {
        console.error(e);
        $resBtn.innerText = '返回数据';
        message({ text: '生成失败', type: 'error' });
      });
  };
  $btnWrapper.appendChild($resBtn);

  var $reqBtn = document.createElement('button');
  $reqBtn.style.cursor = 'pointer';
  $reqBtn.innerText = '请求 body';
  $reqBtn.classList = 'jstt-req-btn';
  $reqBtn.onclick = function () {
    $reqBtn.innerText = '生成中...';
    request()
      .then(function (result) {
        return JSON.parse(result).data;
      })
      .then(function (result) {
        var splitPath = result.path.split('/');
        var lastRoute = splitPath[splitPath.length - 1];
        var name = lastRoute.substr(0, 1).toUpperCase() + lastRoute.slice(1);
        var json = eval('(' + result.req_body_other + ')');
        json.title = name;
        return jstt.compile(formatJson(json), name, options);
      })
      .then(function (ts) {
        copy(ts);
        $reqBtn.innerText = '请求 body';
        message({ text: '复制成功', type: 'success' });
      })
      .catch(function (e) {
        console.error(e);
        $reqBtn.innerText = '请求 body';
        message({ text: '生成失败', type: 'error' });
      });
  };
  $btnWrapper.appendChild($reqBtn);

  documentThis.body.appendChild($btnWrapper);
});
