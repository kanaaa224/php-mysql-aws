<?php
define('DB_PASSWORD', '738gfw8ufw8u0bfb');

////////////////////////////////////////////////////////////////////////////////////////////////////

class Methods {
    static function debug_1($d = []) {
        $payload = $d;

        return [ 'result' => 'success', 'value' => $d ];
    }

    static function debug_2() {
        return [ 'result' => 'success', 'value' => null ];
    }
}
?>