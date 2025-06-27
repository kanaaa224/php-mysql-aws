<?php
require_once 'database.php';

////////////////////////////////////////////////////////////////////////////////////////////////////

class Methods {
    static function db_data_set(array $d): array {
        if(empty($d['name']) || !isset($d['data'])) return [ 'result' => 'failed', 'value' => '引数が不正' ];

        $result = Database::save($d['name'], $d['data']);

        return $result ? [ 'result' => 'success' ] : [ 'result' => 'failed', 'value' => '保存失敗（容量超過が考えられます）' ];
    }

    static function db_data_get(array $d): array {
        if(empty($d['name'])) return [ 'result' => 'failed', 'value' => '引数が不正' ];

        $data = Database::load($d['name']);

        return $data != null ? [ 'result' => 'success', 'value' => $data ] : [ 'result' => 'failed', 'value' => 'データが存在しません' ];
    }

    static function db_reset(): array {
        Database::init();

        return [ 'result' => 'success' ];
    }

    static function db_list_names(): array {
        $names = Database::names();

        return ['result' => 'success', 'value' => $names];
    }
}
?>