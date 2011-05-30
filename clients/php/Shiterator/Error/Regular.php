<?php

namespace Shiterator\Error;

abstract class Regular extends AbstractError
{
    public function __construct($message, $file, $line)
    {
        $backTrace = debug_backtrace();
        array_shift($backTrace);
        //array_shift($backTrace);

        $this->_data = array(
            'type'    => 'phpError',
            'subject' => static::$_title ." on $file:$line",
            'message' => $message,
            'file'    => $file,
            'line'    => $line,
            'stack'   => static::_backtraceToString($backTrace),
            'tracker' => array(),
            'custom'  => static::_getCustom(),
        );

        unset($backTrace);
    }

    protected static function _backtraceToString(array $backTrace)
    {
        $string = '';
        foreach($backTrace as $k => $v){
            $string .= "#$k ";

            if (isset($v['file'])) {
                $string .= "{$v['file']}";
                if (isset($v['line'])) {
                    $string .= "({$v['line']}) ";
                }
            } else {
                $string .= '{main}';
            }

            $string .= ": {$v['function']}(";

            if ($v['function'] == 'include' || $v['function'] == 'include_once' || $v['function'] == 'require_once' || $v['function'] == 'require') {
                $string .= $v['args'][0];
            }
            $string .= ")\n";
        }
        unset($backTrace);

        return $string ? $string : 'not available';
    }
}

class Error extends Regular
{
    protected static $_title = 'Fatal error';
    protected static $_isFatal = true;
}

class Warning extends Regular
{
    protected static $_title = 'Warning';
}

class Parse extends Regular
{
    protected static$_title = 'Parse error';
    protected static $_isFatal = true;
}

class Notice extends Regular
{
    protected static $_title = 'Notice';
}

class CoreError extends Regular
{
    protected static $_title = 'Core (startup) fatal error';
    protected static $_isFatal = true;
}

class CoreWarning extends Regular
{
    protected static $_title = 'Core (startup) warning';
}

class CompileError extends Regular
{
    protected static $_title = 'Compile-time fatal error';
    protected static $_isFatal = true;
}

class CompileWarning extends Regular
{
    protected static $_title = 'Compile-time warning';
}

class UserError extends Regular
{
    protected static $_title = 'User error';
    protected static $_isFatal = true;
}

class UserWarning extends Regular
{
    protected static $_title = 'User warning';
}

class UserNotice extends Regular
{
    protected static $_title = 'User notice';
}

class Strict extends Regular
{
    protected static $_title = 'Strict notice';
}

class RecoverableError extends Regular
{
    protected static $_title = 'Catchable fatal error';
    protected static $_isFatal = true;
}