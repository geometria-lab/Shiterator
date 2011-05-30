<?php

namespace Shiterator;

require_once __DIR__ . '/Error/AbstractError.php';
require_once __DIR__ . '/Error/Regular.php';
require_once __DIR__ . '/Error/Exception.php';

class ErrorHandler
{
    /**
     * Callback called when error
     * 
     * @var callback
     */
    public static $callback;

    /**
     * Shiterator server host
     *
     * @var string
     */
    public static $host;

    /**
     * Shiterator server port
     *
     * @var integer
     */
    public static $port;

    /**
     * Errors
     *
     * @var array
     */
    protected static $_errors = array();

    /**
     * Regular error types
     *
     * @var array
     */
    protected static $_errorTypes = array(
        E_ERROR             => 'Error',
        E_WARNING           => 'Warning',
        E_PARSE             => 'Parse',
        E_NOTICE            => 'Notice',
        E_CORE_ERROR        => 'CoreError',
        E_CORE_WARNING      => 'CoreWarning',
        E_COMPILE_ERROR     => 'CompileError',
        E_COMPILE_WARNING   => 'CompileWarning',
        E_USER_ERROR        => 'UserError',
        E_USER_WARNING      => 'UserWarning',
        E_USER_NOTICE       => 'UserNotice',
        E_STRICT            => 'Strict',
        E_RECOVERABLE_ERROR => 'RecoverableError',
    );

    protected static $_shutdownExecuted = false;

    public static function set($callback, $host, $port = 6666)
    {
        self::$host     = $host;
        self::$port     = $port;
        self::$callback = $callback;

        set_error_handler(array(__CLASS__, 'handleRegular'));
        set_exception_handler(array(__CLASS__, 'handleException'));
        register_shutdown_function(array(__CLASS__, 'handleShutdown'));
    }

    public static function addError(Error\AbstractError $error)
    {
        self::$_errors[] = $error;
    }

    public static function getErrors()
    {
        return self::$_errors;
    }

    public static function clearError()
    {
        self::$_errors = array();
    }

    public static function saveErrors()
    {
        $errors = self::getErrors();

        if (!empty($errors)) {
            $errorsData = array();
            foreach($errors as $error) {
                $errorsData[] = $error->toArray();
            }

            self::clearError();

            $url = 'http://' . self::$host . ':' . self::$port;
            $body = escapeshellarg(json_encode($errorsData));

            exec("curl -d $body $url &> /dev/null &");
        }
    }

    public static function handleRegular($errorNumber, $message, $file, $line)
    {
        if (error_reporting() == 0 || !isset(self::$_errorTypes[$errorNumber])) {
            return;
        }

        $className = 'Shiterator\Error\\' . self::$_errorTypes[$errorNumber];

        $error = new $className($message, $file, $line);

        if (call_user_func(self::$callback, $error) !== false) {
            self::addError($error);
        }
    }

    public static function handleException(\Exception $e)
    {
        $error = new Error\Exception($e);

        if (call_user_func(self::$callback, $error) !== false) {
            self::addError($error);
        }
    }

    public static function handleShutdown()
    {
        if (self::$_shutdownExecuted) {
            return;
        }

        self::$_shutdownExecuted = true;

        $lastError = error_get_last();

        if ($lastError && $lastError['type'] == E_ERROR) {
            $error = new Error\Error($lastError['message'], $lastError['file'], $lastError['line']);

            if (call_user_func(self::$callback, $error) !== false) {
                self::addError($error);
            }
        }

        self::saveErrors();
    }
}
