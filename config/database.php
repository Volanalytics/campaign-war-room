<?php
// Database configuration for Supabase

return [
    // Supabase connection details
    'host' => getenv('SUPABASE_HOST') ?: 'https://xhqzjelmxblchcdcdigv.supabase.co',
    'port' => getenv('SUPABASE_PORT') ?: '5432',
    'dbname' => getenv('SUPABASE_DB_NAME') ?: 'postgres',
    'username' => getenv('SUPABASE_USER') ?: 'postgres',
    'password' => getenv('SUPABASE_PASS') ?: 'bofyg8DSLmMxUgBX',
    
    // Additional Supabase settings
    'sslmode' => 'require',  // Supabase requires SSL connections
];
