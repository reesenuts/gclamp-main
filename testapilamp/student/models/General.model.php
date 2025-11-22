<?php
class General {
  protected $gm, $pdo;

  public function __construct(\PDO $pdo, $gm) {
    $this->pdo = $pdo;
    $this->gm = $gm;
  }

  public function getSettings() { 
    $res = $this->gm->common('test_studentservice.sgSettings');
    $ay = $res['data'];
			foreach($res['data'] as $key => $value){
				if($value['isactive_fld']==1){
					$active = $res['data'][$key];
				}
				if($value['activeenlistment_fld']==1){
					$enlistment = $res['data'][$key];
				}
				if($value['activeevaluation_fld']==1){
					$evaluation = $res['data'][$key];
				}
			}
      return $this->gm->sendPayload(array("setting"=>$active, "acadyear"=>$ay, "enlistment"=>$enlistment, "evaluation"=>$evaluation), "success", "succesfully retrieved setting", "", 200);
  }


  public function procCommon($crp) { return $this->gm->common($crp); }
  public function procRemoteRequest($crp, $dt, $rType, $acttype, $actdesc) { return $this->gm->callRemote($crp, $dt, $rType, $acttype, $actdesc); }

  public function saveBugReport($dt) {
    $report = $dt->report;
    return $this->gm->callRemote('spBugReport', $report);
  }

  public function uploadImage($studid, $filename, $filetype) {
		$code = 403;
		$payload = null;
		$remarks = "failed";
		$message = "There was an error uploading the file, please try again!";

		$folder = '';
		switch ($filetype) {
			case 1: $folder = "Prospectus"; break;
			case 2: $folder = "Grades"; break;
			case 3: $folder = "HepaScreen"; break;
			case 4: $folder = "Profile"; break;
			case 5: $folder = "ResidencyCert"; break;
			case 6: $folder = "HonorableDismissal"; break;
			case 7: $folder = "GoodMoralCert"; break;
			case 8:
				if ($filename == "TranscriptOfRecords") {
					$folder = "TranscriptOfRecords";
				} else if ($filename == "Form138") {
					$folder = "Form138";
				}
				break;
			case 9: $folder = "IDCard"; break;
			case 10: $folder = "MedCert"; break;
			case 11: $folder = "BirthCert"; break;
			case 12: $folder = "VaccCard"; break;
			default:	break;
		}
		$fileArray = array();
		$success = 0; $error = 0; $count = 1;
		
		foreach ($_FILES['file']['tmp_name'] as $key => $tmpname) {
			$fileName = $_FILES['file']["name"][$key];
			$fileTmp = $_FILES['file']["tmp_name"][$key];
			$fileExtension = pathinfo($fileName, PATHINFO_EXTENSION);
			$target_path = "gcesuploads/$studid/$folder/";
			if (!is_dir("../../requests/" . $target_path)) {
				mkdir("../../requests/" . $target_path, 0755, true);
			}
			$target_path = $target_path . $filename . $count . '.' . $fileExtension;
			$data = "";
			$field = "";
			if (move_uploaded_file($fileTmp, "../../requests/" . $target_path)) {
				array_push($fileArray, $target_path);
				$success++;
			} else {
				$error++;
			}
			$count++;
		}
		if ($error == 0) {
			$table = "";
			$files = implode(",", $fileArray);
			switch ($filetype) {
				case 1: $field = "imgprospectus_fld"; $table = "accounts_tbl"; break;  // unused
				case 2: $field = "imggrades_fld"; $table = "accounts_tbl"; break;		// unused
				case 3: $field = "imghepa_fld"; $table = "accounts_tbl"; break;			// Hepa Screen Result 
				case 4: $field = "imgprofile_fld"; $table = "accounts_tbl"; break;	// 2x2 Photo
				case 5: $field = "imgrescert_fld"; $table = "accounts_tbl"; break;	// Residency Certificate
				case 6: $field = "imghonor_fld"; $table = "accounts_tbl"; break;		// Honorable Dismissal
				case 7: $field = "imgmoral_fld"; $table = "accounts_tbl"; break;		// Good Moral
				case 8: $field = "imgtor_fld"; $table = "accounts_tbl"; break;			// TOR/F138
				case 9: $field = "imgidcard_fld"; $table = "accounts_tbl"; break;		// Valid ID
				case 10: $field = "imgmed_fld"; $table = "accounts_tbl"; break;		// Medical Certificate
				case 11: $field = "imgbcert_fld"; $table = "accounts_tbl"; break;		// Birth Certificate
				case 12: $field = "imgvacccard_fld"; $table = "accounts_tbl"; break; // Vaccine Card
				default: break;
			}
      
			$sql = "CALL suUpload(?, ?, ?, ?)";
			$stmt = $this->pdo->prepare($sql);
			try {
				$stmt->execute([$studid, $table, $field, $files]);
				return $this->gm->sendPayload(null, "success", "succesfully retrieved setting", "", 200);
			} catch (\PDOException $e) {
				$code = 400;
				$sys=$e->getMessage();
			}
			return $this->gm->sendPayload($payload, $remarks, $message, $code);
		}
	}

	public function lampUploadFile($userid, $acadyear, $sem)
	{

		// $folder = "faculty/$userid/";

		$folder = $acadyear.$sem."/faculty/$userid/";


		$fileArray = array();
		$success = 0;
		$error = 0;
		$count = 0;

		foreach ($_FILES['file']['tmp_name'] as $key => $tmpname) {
			$target_path = "";
			$fileName = $_FILES['file']["name"][$key];
			$fileTmp = $_FILES['file']["tmp_name"][$key];



			$fileExtension = pathinfo($fileName, PATHINFO_EXTENSION);
			$target_path = "files/$folder";
			if (!is_dir("../" . $target_path)) {
				mkdir("../" . $target_path, 0755, true);
				fopen("../files/$folder/index.php", 'w');
			}

			$newfilename = round(microtime(true)) . '.' . $fileExtension;
			$target_path = $target_path . $newfilename;

			if ($count > 0) {
				$newfilename = round(microtime(true)) + $count . '.' . $fileExtension;
				$target_path = "files/$folder" . $newfilename;
			}


			if (move_uploaded_file($fileTmp, "../" . $target_path)) {
				array_push($fileArray, $fileName . '?' . $target_path);
				$success++;
				$newfilename = "";
			} else {
				$error++;
			}
			$count++;
		}

		$code = 422;
		$payload = null;
		$remarks = "failed";
		$message = "There was an error uploading the file, please try again!";

		if ($error == 0) {
			$filepath = join(':', $fileArray);
			$code = 200;
			$payload = array("filepath" => $filepath);
			$remarks = "success";
			$message = "Successfully uploaded files(s)";
		}

    return $this->gm->sendPayload($payload, $remarks, $message, '', $code);
	}

	public function downloadFile($d){
		$filepath = $d->payload->filepath;
		try{
			header('Content-type: application/octet-stream');
			// header("Content-Disposition: attachment; filename=$filename");		
			readfile('../'.$filepath);
		}
		catch(\Exception $e){
			return $this->gm->sendPayload(null, "failed", "File not found", "", 404);
		}
		exit;
	}

} 