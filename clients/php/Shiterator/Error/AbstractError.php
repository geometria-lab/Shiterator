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
        'tracker' => array(),
        'custom'  => array(),
    );

    public function setTrackerId($id)
    {
        $this->_data['tracker']['id'] = $id;

        return $this;
    }

    public function setTrackerProject($project)
    {
        $this->_data['tracker']['project'] = $project;

        return $this;
    }

    public function setTrackerPriority($priority)
    {
        $this->_data['tracker']['priority'] = $priority;

        return $this;
    }

    public function isFatal()
    {
        return $this->_isFatal;
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
        return $this->_data['custom'][$name];
    }

    public function __set($name, $value)
    {
        $this->_data['custom'][$name] = $value;
    }

    static protected function _getCustom()
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