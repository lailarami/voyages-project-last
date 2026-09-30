<?php

use Illuminate\Support\Facades\Artisan;

/**
 * Register an Artisan command closure.
 */
Artisan::command('inspire', function () {
    $this->comment('The application is running.');
});
