/**
 * User: Vladimir Sartakov
 * Date: 26.05.11
 * @require jquery.js
 */

(function($){
    // send errors
    var errorStore = [], // TODO put this store in cookies or flash store
        maxErrors = 10;

    function postErrors(message, file, line){
        var referer = window.location,
            subject = message + ' on ' + file + ':' + line,
            data = {
                'type'      : 'javaScript',
                'subject'   : subject,
                'message'   : message,
                'line'      : line,
                'file'      : file,
                'url'       : url,
                'referer'   : referer
            },
            url = '/error/';
        if( errorStore.indexOf(subject) == -1 && errorStore.length < maxErrors){
            errorStore.push(subject);
            $.post(url, data);
        }
    }
    window.onerror =  postErrors;
})(jQuery);


//'subject', 'message', 'line', 'file', 'stack', 'tracker', 'custom'

custom [url, referer, ]


Beseda.Transport.LongPolling.Request = function(method) {
    Beseda.Transport.LongPolling.Request._super.constructor.call(this);

    this.url = null;
    this.method = method;
    this.data = null;
};

Beseda.Utils.inherits(Beseda.Transport.LongPolling.Request, EventEmitter);

Beseda.Transport.LongPolling.Request.prototype.send = function(url) {
    if (url) {
        this.url = url;
    }

    var requestURL = this.url + '/' + (new Date().getTime());

    if (request) {
	    request.abort();
    }

    var request = !!+'\v1' ? new XMLHttpRequest() :
                             new ActiveXObject("Microsoft.XMLHTTP");

    var self = this;
    request.onreadystatechange = function() {
        self.__requestStateHandler(request);
    };

    if (this.method === 'GET' && this.data) {
        requestURL +=
            (requestURL.indexOf('?') === -1 ? '?' : '&') + this.data;
    }

    request.open(this.method, encodeURI(requestURL), true);

    var sendData = null;
    if (this.method !== 'GET') {
        sendData = this.data;
        request.setRequestHeader
            ('Content-Type', 'application/x-www-form-urlencoded');
    }

    request.send(sendData);
};

Beseda.Transport.LongPolling.Request.prototype.__requestStateHandler = function(request) {
    if (request.readyState === 4) {
        if (request.status === 200) {
            this.emit('ready', request.responseText);
        } else {
            this.emit('error');
        }

        request.onreadystatechange = null;
        request.abort();
	    request = null;
    }
};