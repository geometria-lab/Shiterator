<?php

namespace Shiterator\Error;

abstract class AbstractError
{
    protected $_isFatal = false;

    protected $_data = array(
        'type'    => null,
        'subject' => null,
        'message' => null,
        'file'    => null,
        'line'    => null,
        'stack'   => null,
        'tracker' => null,
        'custom'  => array(),
    );

    public function isFatal()
    {
        return $this->_isFatal;
    }

    public function getSubject()
    {
        return $this->_data['subject'];
    }

    public function setSubject($subject)
    {
        $this->_data['subject'] = $subject;

        return $this;
    }

    public function getMessage()
    {
        return $this->_data['message'];
    }

    public function setMessage($message)
    {
        $this->_data['message'] = $message;

        return $this;
    }

    public function getFile()
    {
        return $this->_data['file'];
    }

    public function setFile($file)
    {
        $this->_data['file'] = $file;

        return $this;
    }

    public function getLine()
    {
        return $this->_data['line'];
    }

    public function setLine($line)
    {
        $this->_data['line'] = $line;

        return $this;
    }

    public function getStack()
    {
        return $this->_data['stack'];
    }

    public function setStack($stack)
    {
        $this->_data['stack'] = $stack;

        return $this;
    }

    public function tracker()
    {
        if ($this->_data['tracker'] === null) {
            $this->_data['tracker'] = new \stdClass();
        }

        return $this->_data['tracker'];
    }

    public function getCustom($name)
    {
        return $this->_data['custom'][$name];
    }

    public function setCustom($name, $value)
    {
        $this->_data['custom'][$name] = $value;

        return $this;
    }

    public function toArray()
    {
        return $this->_data;
    }

    public function __isset($name)
    {
        return isset($this->_data['custom'][$name]);
    }

    public function __get($name)
    {
        return $this->getCustom($name);
    }

    public function __set($name, $value)
    {
        $this->setCustom($name, $value);
    }

    static protected function _getDefaultCustom()
    {
        return array(
            'server'     => gethostname(),
            'serverIp'   => isset($_SERVER['SERVER_ADDR']) ? $_SERVER['SERVER_ADDR'] : '',
            'userAgent'  => isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '',
            'httpMethod' => isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : '',
            'url'        => isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'] : '',
            'referer'    => isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '',
            'clientIp'   => isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '',
            'sAPI'       => PHP_SAPI,
        );
    }
}