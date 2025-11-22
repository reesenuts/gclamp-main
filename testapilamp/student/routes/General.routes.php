<?php
if ($req[0]=='getsettings'): echo response($general->getSettings()); $ep = true; return; endif;
if ($req[0]=='getapps'): echo response($general->procCommon('sgApps')); $ep = true; return; endif;
if ($req[0]=='getpositions'): echo response($general->procCommon('sgPositions')); $ep = true; return; endif;
if ($req[0]=='getdepartments'): echo response($general->procCommon('sgDepartments')); $ep = true; return; endif;
if ($req[0]=='getprograms'): echo response($general->procCommon('sgPrograms')); $ep = true; return; endif;
if ($req[0]=='getannouncements'): echo response($general->procCommon('test_studentservice.sgAnnouncements')); $ep = true; return; endif;
if ($req[0]=='getbugreports'): echo response($general->procRemoteRequest('sgBugReports', $d, false, null, null)); $ep = true; return; endif;
if ($req[0]=='getmessages'): echo response($general->procRemoteRequest('sgMessages', $d, false, null, null)); $ep = true; return; endif;

if ($req[0]=='getregions'): echo response($general->procCommon('sgRegions')); $ep = true; return; endif;
if ($req[0]=='getprovinces'): echo response($general->procRemoteRequest('sgProvinces', json_decode(json_encode(array('payload'=>array('value'=>$req[1])))), false, null, null)); $ep = true; return; endif;
if ($req[0]=='getcitymun'): echo response($general->procRemoteRequest('sgCityMun', json_decode(json_encode(array('payload'=>array('value'=>$req[1])))), false, null, null)); $ep = true; return; endif;
if ($req[0]=='getbrgy'): echo response($general->procRemoteRequest('sgBrgy', json_decode(json_encode(array('payload'=>array('value'=>$req[1])))), false, null, null)); $ep = true; return; endif;

if ($req[0]=='savebugreport'): echo response($general->saveBugReport($d->payload)); $ep = true; return; endif;
if ($req[0]=='uploadimage'): echo response($general->uploadImage($req[1], $req[2], $req[3])); $ep = true; return; endif;

