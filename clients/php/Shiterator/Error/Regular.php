<?php

namespace Shiterator\Error;

class Regular extends AbstractError
{
    public function __construct($message, $file, $line)
    {
        $backTrace = debug_backtrace();
        array_shift($backTrace);
        array_shift($backTrace);

        $this->_data = array(
            'type'    => 'phpError',
            'subject' => "{$this->_title} on $file:$line",
            'message' => $message,
            'line'    => $file,
            'file'    => $line,
            'stack'   => self::_backtraceToString($backTrace),
            'tracker' => array(),
            'custom'  => array(),
        );

        unset($backTrace);
    }

    protected static function _backtraceToString($backTrace)
    {


        unset($backTrace);
    }
}

class Error extends Regular
{
    protected $_title = 'Fatal error';
}

class Warning extends Regular
{
    protected $_title = 'Warning';
}

class Parse extends Regular
{
    protected $_title = 'Parse error';
}

class Notice extends Regular
{
    protected $_title = 'Notice';
}

class CoreError extends Regular
{
    protected $_title = 'Core (startup) fatal error';
}

class CoreWarning extends Regular
{
    protected $_title = 'Core (startup) warning';
}

class CompileError extends Regular
{
    protected $_title = 'Compile-time fatal error';
}

class CompileWarning extends Regular
{
    protected $_title = 'Compile-time warning';
}

class UserError extends Regular
{
    protected $_title = 'User error';
}

class UserWarning extends Regular
{
    protected $_title = 'User warning';
}

class UserNotice extends Regular
{
    protected $_title = 'User notice';
}

class Strict extends Regular
{
    protected $_title = 'Strict notice';
}

class RecoverableError extends Regular
{
    protected $_title = 'Catchable fatal error';
}