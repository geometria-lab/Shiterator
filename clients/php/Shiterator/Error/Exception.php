<?php

namespace Shiterator\Error;

class Exception extends AbstractError
{
    protected static $_isFatal = true;

    protected $_e;

    public function __construct(\Exception $e)
    {
        $this->_e = $e;
        $this->_data = array(
            'type'    => 'phpException',
            'subject' => get_class($e) . " exception on {$e->getFile()}:{$e->getLine()}",
            'message' => $e->getMessage(),
            'file'    => $e->getFile(),
            'line'    => $e->getLine(),
            'stack'   => $e->getTraceAsString(),
            'tracker' => array(),
            'custom'  => self::_getCustom(),
        );
    }

    public function getException()
    {
        return $this->_e;
    }
}