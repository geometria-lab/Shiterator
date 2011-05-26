<?php

namespace Shiterator\Error;

abstract class AbstractError
{
    protected $_data = array(
        'type'    => null,
        'subject' => null,
        'message' => null,
        'line'    => null,
        'file'    => null,
        'stack'   => null,
        'tracker' => array(),
        'custom'  => array(),
    );

    public function toArray()
    {
        return $this->_data;
    }
}