<?php

require_once __DIR__ . '/../clients/php/Shiterator/ErrorHandler.php';

Shiterator\ErrorHandler::set(function($error) {
    $error->tracker()->project = 486449;
    if ($error->isFatal()) {
        $error->tracker()->label = 'shiterator-fatal';
    }
}, '127.0.0.1');

$a = $b - 1;

function a()
{
    throw new Exception("adasdasdasads");
}

a();