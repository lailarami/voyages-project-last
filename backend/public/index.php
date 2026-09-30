<?php

use Illuminate\Foundation\Bootstrap\HandleExceptions;
use Illuminate\Foundation\Bootstrap\RegisterFacades;
use Illuminate\Foundation\Bootstrap\RegisterProviders;
use Illuminate\Foundation\Bootstrap\SetRequestForConsole;
use Illuminate\Foundation\Bootstrap\SetRequestForRequest;
use Illuminate\Foundation\Bootstrap\SetRequestForResponse;
use Illuminate\Foundation\Bootstrap\TrimStrings;
use Illuminate\Foundation\Bootstrap\ValidatePostSize;
use Illuminate\Foundation\Bootstrap\SetUpTrustedProxies;

define('LARAVEL_START', microtime(true));

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

$response->send();

$kernel->terminate($request, $response);
