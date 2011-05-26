<?php

namespace Shiterator;

require_once './Error/Abstract.php';
require_once './Error/Regular.php';
require_once './Error/Exception.php';

class ErrorHandler
{
    /**
     * Shiterator server host
     *
     * @var array
     */
    public static $host;

    /**
     * Shiterator server port
     */
    public static $port;

    protected $_errorTitles = array(
        E_ERROR             => Error\Error,
        E_WARNING           => Error\Warning,
        E_PARSE             => Error\Parse,
        E_NOTICE            => Error\Notice,
        E_CORE_ERROR        => Error\CoreError,
        E_CORE_WARNING      => Error\CoreWarning,
        E_COMPILE_ERROR     => Error\CompileError,
        E_COMPILE_WARNING   => Error\CompileWarning,
        E_USER_ERROR        => Error\UserError,
        E_USER_WARNING      => Error\UserWarning,
        E_USER_NOTICE       => Error\UserNotice,
        E_STRICT            => Error\Strict,
        E_RECOVERABLE_ERROR => Error\RecoverableError,
    );

    /**
     * Errors
     *
     * @var array
     */
    protected static $_errors = array();

    /**
     * Callback called when error is raised
     *
     * @var callback|null
     */
    protected static $_callback;

    protected static $_shutdownExecuted = false;

    public static function set($host, $port = 6666)
    {
        self::$host = $host;
        self::$port = $port;

        set_error_handler(array(__CLASS__, 'handleRegularError'));
        set_exception_handler(array(__CLASS__, 'handleException'));
        register_shutdown_function(array(__CLASS__, 'handleShutdown'));
    }

    public static function setCallback($callback)
    {
        self::$_callback = $callback;
    }

    public static function addError(Error\AbstractError $error)
    {
        self::$_errors[] = $error;
    }

    public static function getErrors()
    {
        return self::$_errors;
    }

    public static function saveErrors()
    {
        $errors = self::getErrors();

        if (!empty($errors)) {
            foreach(self::getErrors() as $error) {
                $errors[] = $error->toArray();
            }

            self::clearErrors();

            $url = 'http://' . self::$host . ':' . self::$port;
            $body = escapeshellarg(json_encode($error));

            exec("curl -d '$body' $url &> /dev/null &");
        }
    }

    public static function clearError()
    {
        self::$_errors = array();
    }

    public static function handleRegularError($errorNumber, $message, $file, $line)
    {
        if (error_reporting() == 0) {
            return;
        }

        $error = new Error/Regular($errorNumber, $message, $file, $line);

        if (self::$_callback) {
            call_user_func(self::$_callback, $error);
        }

        self::addError($error);
    }

    public static function handleException(Exception $e)
    {
        self::addException($e);
        self::outputNiceErrorPage();
    }



    public static function handleShutdown()
    {
        if (self::$_shutdownExecuted) {
            return;
        }

        self::$_shutdownExecuted = true;

        $lastError = error_get_last();

        if ($lastError && $lastError['type'] == E_ERROR) {
            $error = new Geometria_Error_Regular();

            $backtrace = debug_backtrace();
            array_shift($backtrace);

            $error->setType(E_ERROR)
                  ->setMessage($lastError['message'])
                  ->setFile($lastError['file'])
                  ->setLine($lastError['line'])
                  ->setStackTrace(self::_getTraceAsString($backtrace));

            unset($backtrace);

            self::addError($error);
            if (Zend_Debug::getSapi() == 'cli') {
                echo $error;
            } else {
                self::outputNiceErrorPage();
            }
        }

        self::saveErrors();

        restore_error_handler();
        restore_exception_handler();
    }
























    public static function addException(Exception $e)
    {
        $error = new Geometria_Error_Exception();

        $error->setName(get_class($e))
              ->setCode($e->getCode())
              ->setMessage($e->getMessage())
              ->setFile($e->getFile())
              ->setLine($e->getLine())
              //->setStackTrace(self::_getTraceAsString(debug_backtrace()));
              ->setStackTrace($e->getTraceAsString());

        self::addError($error);
    }

    public static function handleException(Exception $e)
    {
        self::addException($e);
        self::outputNiceErrorPage();
    }

    public static function handleRegularError($errno, $message, $file, $line)
    {
        if (error_reporting() == 0) {
            return;
        }

        if (in_array($errno, self::$_ignored)) {
            return false;
        }

        $error = new Geometria_Error_Regular();

        $backtrace = debug_backtrace();
        array_shift($backtrace);

        $error->setType($errno)
              ->setMessage($message)
              ->setFile($file)
              ->setLine($line)
              ->setStackTrace(self::_getTraceAsString($backtrace));

        unset($backtrace);

        self::addError($error);
    }

    public static function handleShutdown()
    {
        if (self::$_shutdownExecuted) {
            return;
        }

        self::$_shutdownExecuted = true;

        $lastError = error_get_last();

        if ($lastError && $lastError['type'] == E_ERROR) {
            $error = new Geometria_Error_Regular();

            $backtrace = debug_backtrace();
            array_shift($backtrace);

            $error->setType(E_ERROR)
                  ->setMessage($lastError['message'])
                  ->setFile($lastError['file'])
                  ->setLine($lastError['line'])
                  ->setStackTrace(self::_getTraceAsString($backtrace));

            unset($backtrace);

            self::addError($error);
            if (Zend_Debug::getSapi() == 'cli') {
                echo $error;
            } else {
                self::outputNiceErrorPage();
            }
        }

        self::saveErrors();

        restore_error_handler();
        restore_exception_handler();
    }

    /**
     * @static
     * @return void
     */
    public static function outputNiceErrorPage()
    {
        ob_clean();

        header('HTTP/1.1 500 Internal Server Error');
        echo file_get_contents(APPLICATION_PATH . '/../public/500.html');
    }

    /**
     * @static
     * @param Exception $exception
     * @return string
     */
    static public function outputException(Exception $exception)
    {
        $errorMessage = '<pre>' . get_class($exception) . ': ' . $exception->getMessage() . "<br/>" .
                            'File: ' . $exception->getFile() . ":" . $exception->getLine() . "<br/>" .
                            $exception->getTraceAsString() . '</pre>';

        return $errorMessage;
    }

    /**
     * @static
     * @param Geometria_Error_Abstract $error
     * @param bool $return
     * @return string
     */
    static public function outputError(Geometria_Error_Abstract $error, $return = false)
    {
        $errorMessage = $error->getType() . ': ' . $error->getMessage() . "\n";
        $errorMessage.= 'File: ' . $error->getFile() . ":" . $error->getLine() . "\n";
        $errorMessage.= self::_getTraceAsString($error->getStackTrace());
        if ($return) {
            return $errorMessage;
        } else {
            echo $errorMessage;
        }
    }

    /**
     * @static
     * @param array $backTrace
     * @return string
     */
    protected static function _getTraceAsString(array $backTrace)
    {
        $stackTrace = '';

        foreach ($backTrace as $key => $trace) {
            $fileAndLine = '';

            if (isset($trace['file'])) {
                $fileAndLine = $trace['file'];
            }

            if (isset($trace['line'])) {
                $fileAndLine .= ':' . $trace['line'];
            }

            $args = '';
            if (!empty($trace['args'])) {
                //$args = self::_argumentsToString($trace['args']);
            }

            $stackTrace .= "#$key {$trace['function']}($args) \n $fileAndLine\n";
        }

        return $stackTrace;
    }

    /**
     * Convert arguments to string
     *
     * @param array $arguments
     * @return string
     */
    protected static function _argumentsToString($arguments, $already = 0, $recursive = false)
    {
        if (!$already) {
            $already = 1;
        }

        $strings = array();
        foreach($arguments as $name => $value) {
            $key = !is_integer($name) ? "'$name' => " : '';

            if ($already == 10) {
                $argument = '...';
                $strings[] = $key . $argument;
                break;
            }

            if (is_object($value)) {
                $argument = get_class($value);
            } else if (is_numeric($value)) {
                $argument = $value;
            } else if (is_string($value)) {
                $argument = "'$value'";
            } else if (is_array($value)) {
				if (!$recursive) {
                    $valueString = self::_argumentsToString($value, $already, true);
                } else {
                    $valueString = '...';
                }

                $argument = 'array(' . $valueString . ')';
            } else if (is_null($value)) {
                $argument = 'null';
            } else if ($value === true) {
                $argument = 'true';
            } else if ($value === false) {
                $argument = 'false';
            }

            $strings[] = $key . $argument;
            $already++;
        }

        return implode(', ', $strings);
    }
}
