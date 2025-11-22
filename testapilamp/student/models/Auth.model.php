<?php
use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

class Authentication {
  protected $gm, $pdo;

  public function __construct(\PDO $pdo, $gm) {
    $this->pdo = $pdo;
    $this->gm = $gm;
  }

  protected function checkPassword($pword, $existingHash) {
    $hash = crypt($pword, $existingHash);
    if ($hash === $existingHash) {
      return true;
    }
    return false;
  }

  protected function generateAuth() {
    $iat = time();
    $exp = $iat + 60 * 60;
    $jwt="";
    $payload = array(
      "iss"=>"https://gordoncollegeccs.edu.ph",
      "aud"=>"https://gordoncollegeccs.edu.ph",
      "iat"=>$iat,
      "exp"=>$exp
    );
    $jwt = JWT::encode($payload, REMINDME, 'HS512');
    return array( "token"=>$jwt, "expires"=>$exp );
  }

  public function auth() {
    return true;
    $headers = apache_request_headers();  
    if(isset($headers['Authorization'])):
      $token = str_replace('Bearer ', '', $headers['Authorization']);
    endif;
    if($token): 
      try {
        JWT::decode($token, new Key(REMINDME, 'HS512'));
        return true;
      } catch (Exception $e) {
        return false;
      }
    endif;
    return false;
  }

  public function userLogin($req, $pn, $dv) {
    $un = $req->username.'@gordoncollege.edu.ph';
    $pw = $req->password;
    if(!empty($pn))
      $panel = "%".$pn."%";
    else $panel = '';
    $device = $dv;
    $panelString = "";

    $sql = "CALL test_studentservice.saLoginStudent(:un)";

    $stmt = $this->pdo->prepare($sql);
    $stmt->bindParam(':un', $un);
    try {
      $stmt->execute();
      if($stmt->rowCount() > 0) {
        $res = $stmt->fetchAll()[0];
        
        if ($this->checkPassword($pw, $res['pword_fld'])) {
          
          $uc = $res['studno_fld'];
          $ue = $res['email_fld'];
          $fn = $res['fname_fld'].' '.($res['mname_fld']!=''?substr($res['mname_fld'], 0, 1).'. ':' ').$res['lname_fld'].($res['extname_fld']!=''?' '.$res['extname_fld']:'');
          $ur = $res['role_fld'];
          $dept = $res['dept_fld'];
          $program = $res['program_fld'];
          $image =  $res['imgprofile_fld'];
          $status =  $res['empstatus_fld'];
          $issurvey =  $res['issurvey_fld'];
          $ispwordreset =  $res['ispwordreset_fld'];

          $code = 200;
          $remarks = "success";
          $message = "Logged in successfully";
          $payload = array(
            "id" => $uc,
            "fullname" => $fn,
            "key" => $this->generateAuth(),
            "role" => $ur,
            "emailadd" => $ue,
            "dept" => $dept,
            "program" => $program,
            "status" => $status,
            "issurvey" => $issurvey,
            "ispwordreset" => $ispwordreset,
            "image" => $image
          );
        } else {
          $code = 403;
          $remarks = "Login Failed";
          $message = "Incorrect Username or Password";
          $payload = null;
        }
      } else {
        $code = 403;
        $remarks = "Unauthorized User";
        $message = "You have no access priviledges in this portal";
        $payload = null;
      }
    } catch (\PDOException $e) {
      $code = 403;
      $remarks = "Unauthorized User";
      $message = "You have no access priviledge in this portal";
      $payload = null;
    }
    return $this->gm->sendPayload($payload, $remarks, $message, '', $code);
  }
}