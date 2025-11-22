<?php
#faculty loading
if ($req[0]=='updateexcess'): echo response($general->procRemoteRequest('puExcess', $d, false, null, null)); $ep = true; return; endif;
if ($req[0]=='updatefacultyexcess'): echo response($general->procRemoteRequest('fuExcess', $d, false, null, null)); $ep = true; return; endif;
if ($req[0]=='updateofficialtime'): echo response($general->procRemoteRequest('fuOfficialTime', $d, false, null, null)); $ep = true; return; endif;
if ($req[0]=='updateconsultationtime'): echo response($general->procRemoteRequest('fuConsultTime', $d, false, null, null)); $ep = true; return; endif;
if ($req[0]=='updateotherinfo'): echo response($general->procRemoteRequest('fuOtherInfo', $d, false, null, null)); $ep = true; return; endif;

#faculty evaluation 
if ($req[0]=='getresulteval'): echo response($general->procRemoteRequest('fgEvalResult', $d, false, null, null)); $ep = true; return; endif;


#uploading
if ($req[0]=='uploadfile'): echo response($general->uploadFile($req[1], $req[2], $req[3], $req[4])); $ep = true; return; endif;
if ($req[0]=='uploadsign'): echo response($general->uploadSignature($req[1], $req[2], $req[3], $req[4])); $ep = true; return; endif; 
if ($req[0]=='upload'): echo response($general->lampUploadFile($req[1], $req[2], $req[3])); $ep = true; return; endif; 

#deleting files
if ($req[0]=='deletefile'): echo response($lamp->deleteFile($d)); $ep = true; return; endif;

#download
if ($req[0]=='download'): echo response($general->downloadFile($d)); $ep = true; return; endif;




#classes
if ($req[0]=='getfacultyclasses'): echo response($general->procRemoteRequest('lgFacultyClasses', $d, false, null, null)); $ep = true; return; endif;
if ($req[0]=="getstudentclasses"): echo response($general->procRemoteRequest("lgStudentClasses", $d, false, null, null)); $ep = true; return; endif;

if ($req[0]=='getstudentsinclass'): echo response($general->procRemoteRequest('lgStudentInClass', $d, false, null, null)); $ep = true; return; endif;

#posts
if ($req[0]=='getclasspost'): echo response($general->procRemoteRequest('lgClassPost', $d, false, null, null)); $ep = true; return; endif;
if ($req[0]=='addclasspost'): echo response($lamp->saveCommon($d, 'lpClassPost')); $ep = true; return; endif;
if ($req[0]=='editclasspost'): echo response($general->procRemoteRequest('luClassPost', $d, false, null, null)); $ep = true; return; endif;



#comments
if ($req[0]=='getclasscomments'): echo response($general->procRemoteRequest('lgClassComments', $d, false, null, null)); $ep = true; return; endif;
if ($req[0]=='addclasscomment'): echo response($lamp->saveCommon($d, 'lpClassComment')); $ep = true; return; endif;
if ($req[0]=='editclasscomment'): echo response($general->procRemoteRequest('luClassComment', $d, false, null, null)); $ep = true; return; endif;


#activities
if ($req[0]=='getclassactivities'): echo response($general->procRemoteRequest('lgClassActivities', $d, false, null, null)); $ep = true; return; endif;
if ($req[0]=='addclassactivity'): echo response($lamp->saveCommon($d, 'lpClassActivity')); $ep = true; return; endif;
if ($req[0]=='editclassactivity'): echo response($general->procRemoteRequest('luClassActivity', $d, false, null, null)); $ep = true; return; endif;
if ($req[0]=='gettodolist'): echo response($general->procRemoteRequest('lgTodoList', $d, false, null, null)); $ep = true; return; endif;
if ($req[0]=='getallsubmissions'): echo response($general->procRemoteRequest('lgAllSubmissions', $d, false, null, null)); $ep = true; return; endif;

#resources
if ($req[0]=='getclassresources'): echo response($general->procRemoteRequest('lgClassResources', $d, false, null, null)); $ep = true; return; endif;
if ($req[0]=='addclassresource'): echo response($lamp->saveCommon($d, 'lpClassResource')); $ep = true; return; endif;
if ($req[0]=='editclassresource'): echo response($general->procRemoteRequest('luClassResource', $d, false, null, null)); $ep = true; return; endif;

#topics

if ($req[0]=='getclasstopics'): echo response($general->procRemoteRequest('lgClassTopics', $d, false, null, null)); $ep = true; return; endif;

#submissions

if ($req[0]=='getclasssubmissions'): echo response($general->procRemoteRequest('lgClassSubmissions', $d, false, null, null)); $ep = true; return; endif;
if ($req[0]=='getclasssubmissionlist'): echo response($general->procRemoteRequest('lgClassSubmissionList', $d, false, null, null)); $ep = true; return; endif;
if ($req[0]=='getstudentworks'): echo response($general->procRemoteRequest('lgStudentWorks', $d, false, null, null)); $ep = true; return; endif;
if ($req[0]=='getsubmission'): echo response($general->procRemoteRequest('lgStudentSingleWork', $d, false, null, null)); $ep = true; return; endif;
if ($req[0]=='editclasssubmission'): echo response($general->procRemoteRequest('luClassSubmission', $d, false, null, null)); $ep = true; return; endif;
if ($req[0]=='savework'): echo response($lamp->saveCommon($d, 'lpStudentWork')); $ep = true; return; endif;


#quiz

if ($req[0]=='getquiz'): echo response($lamp->getQuiz($d)); $ep = true; return; endif;
if ($req[0]=='draftquiz'): echo response($lamp->saveQuizDraft($d)); $ep = true; return; endif;
if ($req[0]=='savequiz'): echo response($lamp->createQuiz($d)); $ep = true; return; endif;
if ($req[0]=='editquiz'): echo response($lamp->editQuiz($d)); $ep = true; return; endif;
if ($req[0]=='addanswer'): echo response($lamp->saveAnswer($d)); $ep = true; return; endif;


#forum


#evaluation
if ($req[0]=='submiteval'): echo response($general->procRemoteRequest('lpEvaluation', $d, false, null, null)); $ep = true; return; endif;

#message
if ($req[0]=='addmsg'): echo response($lamp->saveCommon($d, 'lpMessage')); $ep = true; return; endif;
if ($req[0]=='getmsg'): echo response($general->procRemoteRequest('lgMessages', $d, false, null, null)); $ep = true; return; endif;
