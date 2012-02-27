<?php

namespace Shiterator\Error;

class Exception extends AbstractError
{
    protected $_isFatal = true;

    /**
     * Exception
     *
     * @var \Exception
     */
    protected $_e;

    public function __construct(\Exception $e, $isFatal = true)
    {
        $this->_isFatal = $isFatal;
        $this->_e = $e;
        $this->_data = array(
            'type'    => 'phpException',
            'subject' => get_class($e) . " exception on {$e->getFile()}:{$e->getLine()}",
            'message' => $e->getMessage(),
            'file'    => $e->getFile(),
            'line'    => $e->getLine(),
            'stack'   => $e->getTraceAsString(),
            'tracker' => null,
            'custom'  => static::_getDefaultCustom(),
        );
    }

    public function getException()
    {
        return $this->_e;
    }
}