<?php
class GlobalMethods {
  protected $pdo;

  public function __construct(\PDO $pdo) {
    $this->pdo = $pdo;
  }

  public function recordLog($log) {
    $sql = "CALL siLog(?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $this->pdo->prepare($sql);
    $stmt->execute([
      $log->username, 
      $log->fullname, 
      $log->dept,
      $log->program,
      $log->panel,
      $log->acttype,
      $log->actdesc,
      $log->device
    ]);
  }

  public function callRemote($proc, $dt, $isPost, $acttype, $actdesc) {
    
    $params = $dt->payload;
    $data = null;
    $msg = "Unable to process request";
    $sys = "";
    $code = 0;
    $remarks = "failed";
    $values = array();

    foreach ($params as $key => $value) {
      array_push($values, $value);
    }
    $sql = "CALL $proc(".str_repeat("?, ", count($values)-1)."?)";
    $stmt = $this->pdo->prepare($sql);
    
    try {
      $stmt->execute($values);
      if($stmt->rowCount() > 0) {
        if($res = $stmt->fetchAll()): $data = $res; endif;
        $remarks = "success";
        $msg = "Successfully performed the requested operation";
        $res = null;
        $code = 200;
        if($isPost) { 
          $log = $dt->log;
          $log->acttype = $acttype;
          $log->actdesc = $actdesc;
          $this->recordLog($log); 
        }
      } else {
        $data = null;
        $msg = "No Records to return";
        $sys = "";
        $code = 404;
      }
    } catch (\PDOException $e) {
      $code = 400;
      $sys=$e->getMessage();
    }
    $stmt->closeCursor();
    $status = array("rem"=>$remarks, "msg"=>$msg, "sys"=>$sys);
    http_response_code($code);
    return array("status"=>$status, "data"=>$data, "stamp"=>date_create());
  }

  public function common($proc) {
    $data = null;
    $msg = "Unable to retrieve records";
    $sys = "";
    $code = 0;
    $remarks = "failed";

    $sql = "CALL $proc()";
    $stmt = $this->pdo->prepare($sql);

    try {
      $stmt->execute();
      if($stmt->rowCount() > 0) {
        if($res = $stmt->fetchAll()): $data = $res; endif;
        $remarks = "success";
        $msg = "Successfully retrieve data";
        $res = null;
        $code = 200;
      } else {
        $data = null;
        $msg = "No Records Found";
        $sys = "";
        $code = 404;
      }
    } catch (\PDOException $e) {
      $code = 400;
      $sys=$e->getMessage();
    }
    $stmt->closeCursor();
    $status = array("rem"=>$remarks, "msg"=>$msg, "sys"=>$sys);
    http_response_code($code);
    return array("status"=>$status, "data"=>$data, "stamp"=>date_create());
  }

  public function executeQuery($sql) {
    $data = array();
    $msg = "Unable to retrieve records";
    $sys = "";
    $code = 0;
    try {
      if($res = $this->pdo->query($sql)->fetchAll()) { $data[] = $res; }
      $msg = "Successfully retrieve data";
      $res = null;
      $code = 200;
    } catch (\PDOException $e) {
      $sys = $e->getMessage();
      $code = 404;
    }
    return array("code"=>$code, "data"=>$data, "msg"=>$msg, "sys"=>$sys);
  }

  public function sendPayload($payload, $rem, $msg, $sys, $code) {
    $status = array("rem"=>$rem, "msg"=>$msg, "sys"=>$sys);
    http_response_code($code);
    return array("status"=>$status, "data"=>$payload, "stamp"=>date_create());
  }

  public function insert($tbl, $dt) {
    $msg = "Unable to save records";
    $sys = "";
    $code = 400;

    try {
      $i = 0; $fields=[]; $values=[];
      foreach ($dt as $key => $value) {
        array_push($fields, $key);
        array_push($values, $value);
      }
      $ctr = 0;
      $sqlstr="INSERT INTO $tbl (";
      foreach ($fields as $value) {
        $sqlstr.=$value; $ctr++;
        if($ctr<count($fields)) {
          $sqlstr.=", ";
        } 	
      } 
      $sqlstr.=") VALUES (".str_repeat("?, ", count($values)-1)."?)";

      $sql = $this->pdo->prepare($sqlstr);
      $sql->execute($values);
      $code = 200;
      $msg = "Successfully saved record";
    } catch (\PDOException $e) { $sys = $e->getMessage(); }
    return array("code"=>$code, "msg"=>$msg, "sys"=>$sys);
  }

  public function update($tbl, $dt, $conditionStringPassed) {
    $msg = "Unable to update records";
    $sys = "";
    $code = 400;
    $i = 0; $fields=[]; $values=[];

    $fields=[]; $values=[];
    $setStr = "";
    foreach ($dt as $key => $value) {
      array_push($fields, $key);
      array_push($values, $value);
    }

    try{
      $ctr = 0;
      $sqlstr = "UPDATE $tbl SET ";
      foreach ($dt as $key => $value) {
        $sqlstr .="$key=?"; $ctr++;
        if($ctr<count($fields)){
          $sqlstr.=", ";
        }
      }
      $sqlstr .= " WHERE ".$conditionStringPassed;
      $sql = $this->pdo->prepare($sqlstr);
      $sql->execute($values);
      $code = 200;
      $msg = "Successfully updated record";	
    }
    catch(\PDOException $e) { $sys = $e->getMessage(); }
    return array("code"=>$code, "msg"=>$msg, "sys"=>$sys);
  }

  public function setInsertQuery($tbl, $dt) {
    $i = 0; $fields=[]; $values=[];
    foreach ($dt as $key => $value) {
      array_push($fields, $key);
      array_push($values, $value);
    }
    $ctr = 0;
    $sqlstr="INSERT INTO $tbl (";
    foreach ($fields as $value) {
      $sqlstr.=$value; $ctr++;
      if($ctr<count($fields)) {
        $sqlstr.=", ";
      } 	
    } 
    $sqlstr.=") VALUES (".str_repeat("?, ", count($values)-1)."?)";
    return array("sql"=>$sqlstr, "values"=>$values);
  }
}