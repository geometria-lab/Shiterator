function Shiterator(callback, host, port) {
    this._callback = callback;
    this._host = host;
    this._port = port;
    this._store = {}; // TODO put this store in cookies or flash store
    this._sendsStore = [];
    this._interval = null;
}

Shiterator.prototype.start = function(){
    // send errors
    var obj = this,
        maxErrors = 10,
        intervalTime = 30000,
        errorCount = 0;

    function addToStore(message, file, line){
        var subject = message + ' on ' + file + ':' + line,
            id = 'error' + ( subject.length + (line * 1000) ),
            data = {
                'type'      : 'javaScript',
                'subject'   : subject,
                'message'   : message,
                'line'      : line,
                'stack'     : 'not available',
                'tracker'   : {},
                'file'      : file,
                'custom'    : {
                    'url'      : window.location.href,
                    'referer'  : document.referrer
                }
            };

        obj._callback(data);

        if( !( obj._store[id] && obj._sendsStore[id] ) && errorCount < maxErrors ){
            obj._store[id] = data;
            errorCount++;
        }
    }

    function getNoSendData(){
        var store = obj._store,
            sends = obj._sendsStore,
            res = [];
        for(var key in store){
            if( sends.indexOf(key) == -1 ){
                res.push( store[key] );
            }
        }
        return res;
    }

    function setSendData(){
        var store = obj._store,
            sends = obj._sendsStore;
        for(var key in store){
            if( sends.indexOf(key) == -1 ){
                sends.push(key);
            }
        }
    }

    function postErrorsAction(data){
        var url = ( obj._host.indexOf('http://') == -1 ? 'http://' : '' ) + obj._host + ( (obj._port && obj._port.length) ? (':' + obj._port) : '' ),
            json = obj.toJSON(data);
        //obj.ajax(url, 'POST', json);
        setSendData();
        obj.post(url, json);
    }

    function postErrors(){
        var data = getNoSendData();
        if(data.length){
            postErrorsAction(data);
        }
    }

    window.onerror =  addToStore;

    obj._interval = setInterval(postErrors, intervalTime);
};

Shiterator.prototype.stop = function(){
    var obj = this;
    clearInterval(obj._interval);
    window.onerror = function(){};
};

Shiterator.prototype.toJSON = function(o){
    if (typeof(JSON) == 'object' && JSON.stringify)
        return JSON.stringify(o);

    var type = typeof(o);

    if (o === null)
        return "null";

    if (type == "undefined")
        return undefined;

    if (type == "number" || type == "boolean")
        return o + "";

    if (type == "string")
        return $.quoteString(o);

    if (type == 'object')
    {
        if (typeof o.toJSON == "function")
            return $.toJSON( o.toJSON() );

        if (o.constructor === Date)
        {
            var month = o.getUTCMonth() + 1;
            if (month < 10) month = '0' + month;

            var day = o.getUTCDate();
            if (day < 10) day = '0' + day;

            var year = o.getUTCFullYear();

            var hours = o.getUTCHours();
            if (hours < 10) hours = '0' + hours;

            var minutes = o.getUTCMinutes();
            if (minutes < 10) minutes = '0' + minutes;

            var seconds = o.getUTCSeconds();
            if (seconds < 10) seconds = '0' + seconds;

            var milli = o.getUTCMilliseconds();
            if (milli < 100) milli = '0' + milli;
            if (milli < 10) milli = '0' + milli;

            return '"' + year + '-' + month + '-' + day + 'T' +
                         hours + ':' + minutes + ':' + seconds +
                         '.' + milli + 'Z"';
        }

        if (o.constructor === Array)
        {
            var ret = [];
            for (var i = 0; i < o.length; i++)
                ret.push( $.toJSON(o[i]) || "null" );

            return "[" + ret.join(",") + "]";
        }

        var pairs = [];
        for (var k in o) {
            var name;
            var type = typeof k;

            if (type == "number")
                name = '"' + k + '"';
            else if (type == "string")
                name = $.quoteString(k);
            else
                continue;  //skip non-string or number keys

            if (typeof o[k] == "function")
                continue;  //skip pairs where the value is a function.

            var val = $.toJSON(o[k]);

            pairs.push(name + ":" + val);
        }

        return "{" + pairs.join(", ") + "}";
    }
}

Shiterator.prototype.post = function(url, data){
    var obj = this,
        form = obj._postForm ? obj._postForm : document.createElement('form'),
        input = document.createElement('input'),
        oldInput = form.getElementsByTagName('input')[0],
        iframeId = obj._postIframeId ? obj._postIframeId : 'errorFrame' + new Date().getTime(),
        box = document.createElement('div'),
        iframeHtml = '<iframe id="' + iframeId + '" name="' + iframeId + '"></iframe>',
        wraper = document.body;

    with(box){
        innerHTML = iframeHtml;
        style.display = 'none';
    }

    if(oldInput){
        form.removeChild(oldInput);
    }

    with(form){ $.empty
        setAttribute('action', url);
        style.display = 'none';
        setAttribute('method', 'post');
        setAttribute('target', iframeId);
    }

    with(input){
        setAttribute('value', data);
        setAttribute('name', 'error');
        setAttribute('type', 'hidden');
    }

    if( !obj._postForm ){
        obj._postForm = form;
        obj._postIframeId = iframeId;
        box.appendChild(form);
        wraper.appendChild(box);
    }
    form.appendChild(input);
    form.submit();

}

//Shiterator.prototype.ajax = function(url, method, data, callback){
//    method = method.toUpperCase() || 'GET';
//
//    function send(){
//        var requestURL = url;
//
//        if (request) {
//            request.abort();
//        }
//
//        var request = !!+'\v1' ? new XMLHttpRequest() :
//                                 new ActiveXObject("Microsoft.XMLHTTP");
//
//        request.onreadystatechange = function() {
//            requestStateHandler(request);
//        };
//
//        if (method === 'GET' && data) {
//            requestURL +=
//                (requestURL.indexOf('?') === -1 ? '?' : '&') + data;
//        }
//
//        request.open(method, encodeURI(requestURL), true);
//
//        var sendData = null;
//        if (method !== 'GET') {
//            sendData = data;
//            request.setRequestHeader
//                ('Content-Type', 'application/x-www-form-urlencoded');
//        }
//
//        request.send(sendData);
//    }
//    send();
//
//    function requestStateHandler(request){
//        if (request.readyState === 4) {
//            if(callback){
//                if (request.status === 200) {
//                    callback(request.responseText);
//                } else {
//                    callback('error');
//                }
//            }
//            request.onreadystatechange = null;
//            request.abort();
//            request = null;
//        }
//    }
//
//};