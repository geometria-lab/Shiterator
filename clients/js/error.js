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
            subject = file + ':' + line + ' ' + message,
            data = {
                'type'      : 'javascript',
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