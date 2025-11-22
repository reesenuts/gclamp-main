<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Authorization, Content-Type");
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Max-Age: 86400");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
  header('HTTP/1.1 200 OK');
  exit();
}

$rootPath = $_SERVER["DOCUMENT_ROOT"];
$apiPath = $_SERVER["DOCUMENT_ROOT"]."/testapilamp/student";
require_once($rootPath.'/testapilamp/config/Connection.php');
require_once($apiPath.'/controllers/Path.controller.php');

$db = new Connection();
$pdo = $db->connect(DBLAMP);

$gm = new GlobalMethods($pdo);
$auth = new Authentication($pdo, $gm);
$general = new General($pdo, $gm);
$student = new Student($pdo, $gm);
$lamp = new Lamp($pdo, $gm);

$req=[];
if(isset($_REQUEST['request']))
  $req = explode('/', rtrim($_REQUEST['request'], '/'));
else $req = array("errorcatcher");

switch($_SERVER['REQUEST_METHOD']) {
  case 'GET':
    $state = array(
      "rem"=>"Failed", 
      "msg"=>"No available public API. Please contact the Systems Administrator", 
      "sys"=>"Someone has tried to access the public api");
    echo errmsg($state);
    http_response_code(403);
  break;

  case 'POST':
    $ep = false;
    $d = request(file_get_contents("php://input"));
    if ($req[0]=='userlogin') { echo response($auth->userLogin($d->payload, $d->panel, $d->device)); $ep = true; return;}
    if($auth->auth()) {
      include_once($apiPath.'/routes/General.routes.php');
      include_once($apiPath.'/routes/Student.routes.php');
      include_once($apiPath.'/routes/Lamp.routes.php');
    }
    if(!$ep):
      $state = array("rem"=>"Access Denied", "msg"=>"Unauthorized User", "sys"=>"Someone has tried to access the API");
      echo errmsg($state);
      http_response_code(401);
    endif;
  break;
  
  default:
    $state = array("rem"=>"Failed", "msg"=>"Forbidden Access", "sys"=>"Someone has tried to access the private api");
    echo errmsg($state);
    http_response_code(403);
  break;
}