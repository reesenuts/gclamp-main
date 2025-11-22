<?php
function decode($param, $len) { return base64_decode(substr($param, $len)); }
function request($dt) { return json_decode($dt); }
function response($dt) { return json_encode($dt); }

function errmsg($status) {
  return json_encode(array("status"=>$status, "data"=>null, "stamp"=>date_create()));
}