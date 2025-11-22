<?php
class Lamp
{
	protected $gm, $pdo;

	public function __construct(\PDO $pdo, $gm)
	{
		$this->pdo = $pdo;
		$this->gm = $gm;
	}

	public function saveCommon($dt , $rpc)
	{
		$dt->payload->datetime_fld = date("Y-m-d H:i:s");
		return $this->gm->callRemote($rpc, $dt, false, null, null);
	}

	// public function savePost($dt)
	// {
	// 	$dt->payload->datetime_fld = date("Y-m-d H:i:s");
	// 	return $this->gm->callRemote('lpClassPost', $dt, false, null, null);
	// }

	// public function saveComment($dt)
	// {
	// 	$dt->payload->datetime_fld = date("Y-m-d H:i:s");
	// 	return $this->gm->callRemote('lpClassComment', $dt, false, null, null);
	// }

	// public function saveActivity($dt)
	// {
	// 	$dt->payload->datetime_fld = date("Y-m-d H:i:s");
	// 	return $this->gm->callRemote('lpClassActivity', $dt, false, null, null);
	// }

	// public function saveResource($dt)
	// {
	// 	$dt->payload->datetime_fld = date("Y-m-d H:i:s");
	// 	return $this->gm->callRemote('lpClassResource', $dt, false, null, null);
	// }
	
	public function saveQuizDraft($data)
	{
		$aysem = $data->options->ay . $data->options->sem;
		$dt = json_encode($data->payload);
		$classcode = $data->payload->classcode;
		$userid = $data->options->userid;

		$folder = "files/$aysem/faculty/$userid/temp/";
		if (!is_dir("../" . $folder)) {
			mkdir("../" . $folder, 0755, true);
			fopen("../$folder/index.php", 'w');
			fopen("../files/$aysem/faculty/$userid/index.php", 'w');
		}


		$filename = $classcode . '.json';
		$filepath = "../" . $folder . $filename;
		if (file_put_contents($filepath, $dt)) {
			return $this->gm->sendPayload(null, 'success', "Successfully created a draft.", '', 200);
		}
		return $this->gm->sendPayload(null, 'success', "Failed to save draft.", '', 403);
	}

	public function createQuiz($receivedPayload)
	{
		$aysem = $receivedPayload->options->ay . $receivedPayload->options->sem;
		$userid = $receivedPayload->options->userid;

		$code = 403;
		$remarks = "failed";
		$message = "failed to process data";
		$payload = null;

		$dt = json_encode($receivedPayload->payload);

		$folder = "files/$aysem/faculty/$userid/quiz/";
		if (!is_dir("../" . $folder)) {
			mkdir("../" . $folder, 0755, true);
			fopen("../$folder/index.php", 'w');
			fopen("../files/$aysem/faculty/$userid/index.php", 'w');
		}
		$filename = round(microtime(true)) . '.json';
		$filepath = $folder . $filename;


		if (file_put_contents("../" . $filepath, $dt)) {
			unlink("../files/$aysem/faculty/$userid/temp/$receivedPayload->classcode" . '.json');
			$code = 200;
			$payload = array("filepath" => $filepath, "quiz" => $receivedPayload);
			$message = "Succesfully generated quiz";
			$remarks = "sucess";
		} else {
			$message = "failed to generate quiz";
			$remarks = "failed";
		}
		return $this->gm->sendPayload($payload, $remarks, $message, '', $code);
	}

	public function getQuiz($receivedPayload)
	{
		$res = null;
		$filepath = $receivedPayload->payload->filepath;
		$payload = null;
		$code = 404;
		$remarks = "failed";
		$message = "File not found";

		$res = json_decode(@file_get_contents("../" . $filepath));
		if ($res != null) {
			$payload = $res;
			$code = 200;
			$remarks = "success";
			$message = "Succesfully retrieved data";
		}
		return $this->gm->sendPayload($payload, $remarks, $message, '', $code);
	}

	public function editQuiz($receivedPayload)
	{
		$aysem = $receivedPayload->options->ay . $receivedPayload->options->sem;
		$userid = $receivedPayload->options->userid;

		$filepath = $receivedPayload->filepath;
		$classcode = $receivedPayload->classcode;
		
		$dt = json_encode($receivedPayload->payload);
		$code = 403;
		$remarks = "failed";
		$message = "failed to process data";
		$payload = null;

		if (file_put_contents("../" . $filepath, $dt)) {
			if(file_exists("../files/$aysem/faculty/$userid/temp/$classcode" . '.json')){
				unlink("../files/$aysem/faculty/$userid/temp/$classcode" . '.json');
			}	
			$code = 200;
			$payload = array("filepath" => $filepath, "quiz" => $receivedPayload);
			$message = "Succesfully edited quiz";
			$remarks = "sucess";
		} else {
			$message = "failed to edit quiz";
			$remarks = "failed";
		}
		return $this->gm->sendPayload($payload, $remarks, $message, '', $code);
	}

	

	public function saveAnswer($receivedPayload)
	{
		$aysem = $receivedPayload->ay . $receivedPayload->sem;
		$userid = $receivedPayload->userid;
		$code = 403;
		$remarks = "failed";
		$message = "failed to process data";
		$payload = null;

		$dt = $receivedPayload->payload->answer;
		// $quizpath = $receivedPayload->filepath;

		$folder = "files/$aysem/student/$userid/quiz/";
		if (!is_dir("../" . $folder)) {
			mkdir("../" . $folder, 0755, true);
			fopen("../$folder/index.php", 'w');
		}

		$filename = round(microtime(true)) . '.json';
		$filepath = $folder . $filename;

		// $res = $this->get->ScoreQuiz($dt, $quizpath);

	
		if (file_put_contents("../" . $filepath, json_encode($dt))) {

				$payload = array("result" => $dt, "filepath" => $filepath);
				$code = 200;
				$remarks = "success";
				$message = "succesfully processed data";
		}
		
		return $this->gm->sendPayload($payload, $remarks, $message, '', $code);
	}


	public function deleteFile($receivedPayload)
	{
		$path = $receivedPayload->payload->dir_fld;
		$code = 403;
		$studnum = $receivedPayload->payload->id;
		$remarks = "failed";
		$message = "failed to delete file";
		$payload = null;


	
		if(strpos($path, $studnum) !== false ){
			if(file_exists("../" . $path)){
				if (unlink("../" . $path)) {
					$code = 200;
					$remarks = "success";
					$message = "Successfully deleted file";
				}
			}
			else{
				$code = 200;
				$message = "File does not exists";
				$remarks = "success";
			}
		}
		else{
			$code = 200;
			$remarks = "success";
			$message = "Duplicate upload file";
		}
		

		
		return $this->gm->sendPayload($payload, $remarks, $message, '', $code);
	}



	//   public function sendPayload($payload, $rem, $msg, $sys, $code) {



	public function getPoll($dt)
	{
		$code = 404;
		$payload = null;
		$remarks = "failed";
		$message = "failed to load poll";
		$result = $dt->filepath;
		$postcode = $dt->postcode;
		try {
			for ($i = 0; $i < count($result->options); $i++) {
				$sql = "SELECT studno_fld, CONCAT(fname_fld, ' ', lname_fld) AS fullname, profilepic_fld FROM pollresponse_tbl  INNER JOIN students_tbl USING(studnum_fld) WHERE postcode_fld = '$postcode' AND response_fld = '$i' AND pollresponse_tbl.isdeleted_fld=0";
				$res = $this->gm->executeQuery($sql);
				if ($res['code'] == 200) {
					$result->options[$i]->respondents = $res['data'];
					$result->options[$i]->votes = count($res['data']);
				}
			}


			$payload = $result;
			$code = 200;
			$remarks = "success";
			$message = "Succesfully retrieved poll";
		} catch (Exception $e) {
			$message = $message || $e->getMessage();
		}
		return $this->gm->sendPayload($payload, $remarks, $message, $code);
	}

	public function getTasksList($dt){
		$todo = array();
		$class = array();
		$act = array();	
		$sub = array();
		$datenow = date("Y-m-d H:i:s");

	}
}
