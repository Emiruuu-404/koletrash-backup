<?php
file_put_contents(__DIR__ . '/test_debug.log', "Test log at " . date('Y-m-d H:i:s') . PHP_EOL, FILE_APPEND);
echo "Done";
?>
