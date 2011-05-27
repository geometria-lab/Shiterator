<?php

require_once __DIR__ . '/../clients/php/Shiterator/ErrorHandler.php';

Shiterator\ErrorHandler::set(function($error) {
    if ($error->isFatal()) {
        $error->setTrackerPriority(3);

        echo 'Sorry guys... See you later.';
    } else {
        $error->setTrackerPriority(2);
    }
    $error->setTrackerId(6)
          ->setTrackerProject('geometria');
}, '127.0.0.1');

$a = $b - 1;

function a()
{
    throw new Exception();



}


a();