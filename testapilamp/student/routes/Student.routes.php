<?php
if ($req[0]=="getprofile"): echo response($general->procRemoteRequest("sgProfile", $d, false, null, null)); $ep = true; return; endif;
if ($req[0]=="getenrollhistory"): echo response($general->procRemoteRequest("sgEnrollHistory", $d, false, null, null)); $ep = true; return; endif;
// if ($req[0]=="getstudentclasses"): echo response($general->procRemoteRequest("rpc_students.sgStudentClasses", $d, false, null, null)); $ep = true; return; endif;
if ($req[0]=="getavailablecourses"): echo response($general->procRemoteRequest("sgAvailableCourses", $d, false, null, null)); $ep = true; return; endif; 

if ($req[0]=="updateinfo"): echo response($general->procRemoteRequest("suInformation", $d, true, "UPDATE", "Personal Information Update")); $ep = true; return; endif;
if ($req[0]=="updateeducation"): echo response($general->procRemoteRequest("suEducation", $d, true, "UPDATE", "Education Background Update")); $ep = true; return; endif;
if ($req[0]=="updatefamily"): echo response($general->procRemoteRequest("suFamily", $d, true, "UPDATE", "Family Background Update")); $ep = true; return; endif;
if ($req[0]=="updatehealth"): echo response($general->procRemoteRequest("suHealth", $d, true, "UPDATE", "Health Information Update")); $ep = true; return; endif;
if ($req[0]=="updategovt"): echo response($general->procRemoteRequest("suGovernment", $d, true, "UPDATE", "Govt Information Update")); $ep = true; return; endif;
if ($req[0]=="updateothers"): echo response($general->procRemoteRequest("suOthers", $d, true, "UPDATE", "Other Information Update")); $ep = true; return; endif;

if ($req[0]=="enlist"): echo response($general->procRemoteRequest("siEnlistment", $d, true, "ENLIST", "Student Enlistment")); $ep = true; return; endif;