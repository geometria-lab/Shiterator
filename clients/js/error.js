/**
 * User: Vladimir Sartakov
 * Date: 26.05.11
 * @require jquery.js
 */

(function($){
    // send errors
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
        $.post(url, data);
    }
    window.onerror =  postErrors;
})(jQuery);