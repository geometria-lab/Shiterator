function Shiterator(callback, host, port) {
    this._callback = callback;
    this._host = host || 'errors';
    this._port = port || 6666;
    this.store = {}; // TODO put this store in cookies or flash store
    this.sendsStore = [];
    this.interval = null;
};

Shiterator.prototype.start = function(){
    // send errors
    var obj = this,
        maxErrors = 10,
        intervalTime = 30000;

    function addToStore(message, file, line){
        var referer = window.location,
            subject = message + ' on ' + file + ':' + line,
            data = {
                'type'      : 'javaScript',
                'subject'   : subject,
                'message'   : message,
                'line'      : line,
                'stack'     : 'not available',
                'tracker'   : null,
                'file'      : file,
                'custom'    : {
                    'referer'   : referer
                }
            };

        if( !( obj.store.[subject] && obj.sendsStore.[subject] ) && obj.store.length < maxErrors ){
            obj.store.[subject] = data; 
        }
    }

    function getNoSendData(){
        var store = obj.store,
            sends = this.sendsStore,
            res = [];
        for(var key in store){
            if( key.indexOf(sends) != -1 ){
                res.push( store[key] );
            }
        }
        return res;
    }

    function postErrorsAction(data){
        var url = obj._host + (obj._port && obj._port.length) ? (':' + obj._port) : '';
        obj.ajax(url, 'POST', data);
    }

    function postErrors(){
        var data = getNoSendData();
        if(data.length && obj._callback(data) !== false){
            postErrorsAction(data);
        }
    }
    
    window.onerror =  addToStore;

    obj.interval = setInterval(postErrors, intervalTime);
}

Shiterator.prototype.stop = function(){
    var obj = this;
    clearInterval(obj.interval);
}

Shiterator.prototype.ajax = function(url, method, data, callback){
    var method = method.toUpperCase() || 'GET';

    function send(){
        var requestURL = this.url + '/' + (new Date().getTime());

        if (request) {
            request.abort();
        }

        var request = !!+'\v1' ? new XMLHttpRequest() :
                                 new ActiveXObject("Microsoft.XMLHTTP");

        var self = this;
        request.onreadystatechange = function() {
            requestStateHandler(request);
        };

        if (method === 'GET' && data) {
            requestURL +=
                (requestURL.indexOf('?') === -1 ? '?' : '&') + data;
        }

        request.open(method, encodeURI(requestURL), true);

        var sendData = null;
        if (method !== 'GET') {
            sendData = data;
            request.setRequestHeader
                ('Content-Type', 'application/x-www-form-urlencoded');
        }

        request.send(sendData);
    }
    send();

    function requestStateHandler(request){
        if (request.readyState === 4) {
            if(callback){
                if (request.status === 200) {
                    callback(request.responseText);
                } else {
                    callback('error');
                }
            }    
            request.onreadystatechange = null;
            request.abort();
            request = null;
        }
    }

}

