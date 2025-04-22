<?php
// Database configuration

return [
    'host' => getenv('DB_HOST') ?: 'localhost',
    'port' => getenv('DB_PORT') ?: '5432',
    'dbname' => getenv('DB_NAME') ?: 'actionhub',
    'username' => getenv('DB_USER') ?: 'postgres',
    'password' => getenv('DB_PASS') ?: '',
];
