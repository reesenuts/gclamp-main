# Student API Documentation

## Overview

This API provides endpoints for a student management system with features including authentication, profile management, enrollment, class management, and learning management system (LMS) functionality.

**Base URL**: `http://gclamp/testapilamp/student/`

**API Version**: 1.0

**Protocol**: HTTP/HTTPS

**Content-Type**: `application/json`

**Character Encoding**: UTF-8

---

## Table of Contents

1. [Authentication](#authentication)
2. [Request/Response Format](#requestresponse-format)
3. [Error Handling](#error-handling)
4. [Endpoints](#endpoints)
   - [Authentication Endpoints](#authentication-endpoints)
   - [General Endpoints](#general-endpoints)
   - [Student Endpoints](#student-endpoints)
   - [LAMP (Learning Management) Endpoints](#lamp-learning-management-endpoints)
5. [Data Models](#data-models)
6. [React Native Integration Guide](#react-native-integration-guide)

---

## Authentication

### Current Status
**Note**: Authentication is currently disabled in the codebase (returns `true` always). However, the API structure supports JWT token-based authentication.

### Authentication Flow

1. **Login** to obtain JWT token
2. **Include token** in subsequent requests via `Authorization` header
3. **Token format**: `Bearer <token>`

### Token Details
- **Algorithm**: HS512
- **Issuer**: `https://gordoncollegeccs.edu.ph`
- **Audience**: `https://gordoncollegeccs.edu.ph`
- **Expiration**: 1 hour (3600 seconds) from issue time

### Headers Required
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

---

## Request/Response Format

### Request Format

All requests must be **POST** requests with JSON body. The API uses a custom routing system where the endpoint is specified in the URL path.

**URL Structure**: `{base_url}/{endpoint}`

**Request Body Structure**:
```json
{
  "payload": {
    // Endpoint-specific data
  },
  "panel": "optional_panel_name",
  "device": "optional_device_info",
  "log": {
    // Required for operations that log activity
    "username": "string",
    "fullname": "string",
    "dept": "string",
    "program": "string",
    "panel": "string",
    "device": "string"
  }
}
```

### Response Format

All responses follow this structure:

```json
{
  "status": {
    "rem": "success|failed",
    "msg": "Human-readable message",
    "sys": "System message (usually empty, contains error details on failure)"
  },
  "data": {
    // Response payload (null on error)
  },
  "stamp": "ISO 8601 datetime"
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (validation error, malformed request)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (access denied)
- `404` - Not Found (no records found)
- `422` - Unprocessable Entity (upload errors)

---

## Error Handling

### Standard Error Response

```json
{
  "status": {
    "rem": "failed",
    "msg": "Error message",
    "sys": "System error details"
  },
  "data": null,
  "stamp": "2024-01-01T00:00:00+00:00"
}
```

### Common Error Scenarios

1. **401 Unauthorized**: Missing or invalid JWT token
2. **403 Forbidden**: User lacks required permissions
3. **404 Not Found**: Requested resource doesn't exist
4. **400 Bad Request**: Invalid request parameters or malformed JSON

---

## Endpoints

### Authentication Endpoints

#### 1. User Login

**Endpoint**: `userlogin`

**Method**: `POST`

**Authentication**: Not required

**Request Body**:
```json
{
  "payload": {
    "username": "student_username",
    "password": "student_password"
  },
  "panel": "optional_panel_name",
  "device": "optional_device_info"
}
```

**Response** (Success - 200):
```json
{
  "status": {
    "rem": "success",
    "msg": "Logged in successfully",
    "sys": ""
  },
  "data": {
    "id": "student_number",
    "fullname": "First Middle Last Name",
    "key": {
      "token": "jwt_token_string",
      "expires": 1234567890
    },
    "role": "student_role",
    "emailadd": "email@gordoncollege.edu.ph",
    "dept": "department_name",
    "program": "program_name",
    "status": "status_value",
    "issurvey": 0|1,
    "ispwordreset": 0|1,
    "image": "profile_image_path"
  },
  "stamp": "2024-01-01T00:00:00+00:00"
}
```

**Response** (Error - 403):
```json
{
  "status": {
    "rem": "Login Failed",
    "msg": "Incorrect Username or Password",
    "sys": ""
  },
  "data": null,
  "stamp": "2024-01-01T00:00:00+00:00"
}
```

**Notes**:
- Username is automatically appended with `@gordoncollege.edu.ph`
- Password is verified using crypt() hashing
- Returns JWT token for subsequent authenticated requests

---

### General Endpoints

#### 2. Get Settings

**Endpoint**: `getsettings`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {}
}
```

**Response** (Success - 200):
```json
{
  "status": {
    "rem": "success",
    "msg": "succesfully retrieved setting",
    "sys": ""
  },
  "data": {
    "setting": {
      // Active settings object
    },
    "acadyear": [
      // Array of academic year settings
    ],
    "enlistment": {
      // Active enlistment settings
    },
    "evaluation": {
      // Active evaluation settings
    }
  },
  "stamp": "2024-01-01T00:00:00+00:00"
}
```

#### 3. Get Apps

**Endpoint**: `getapps`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {}
}
```

**Response**: Returns list of available apps

#### 4. Get Positions

**Endpoint**: `getpositions`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {}
}
```

**Response**: Returns list of positions

#### 5. Get Departments

**Endpoint**: `getdepartments`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {}
}
```

**Response**: Returns list of departments

#### 6. Get Programs

**Endpoint**: `getprograms`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {}
}
```

**Response**: Returns list of programs

#### 7. Get Announcements

**Endpoint**: `getannouncements`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {}
}
```

**Response**: Returns list of announcements

#### 8. Get Bug Reports

**Endpoint**: `getbugreports`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Bug report filter parameters
  }
}
```

**Response**: Returns list of bug reports

#### 9. Get Messages

**Endpoint**: `getmessages`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Message filter parameters
  }
}
```

**Response**: Returns list of messages

#### 10. Get Regions

**Endpoint**: `getregions`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {}
}
```

**Response**: Returns list of regions

#### 11. Get Provinces

**Endpoint**: `getprovinces/{region_id}`

**Method**: `POST`

**Authentication**: Required

**URL Parameters**:
- `{region_id}`: Region identifier

**Request Body**:
```json
{
  "payload": {
    "value": "region_id"
  }
}
```

**Response**: Returns list of provinces for the specified region

#### 12. Get Cities/Municipalities

**Endpoint**: `getcitymun/{province_id}`

**Method**: `POST`

**Authentication**: Required

**URL Parameters**:
- `{province_id}`: Province identifier

**Request Body**:
```json
{
  "payload": {
    "value": "province_id"
  }
}
```

**Response**: Returns list of cities/municipalities for the specified province

#### 13. Get Barangays

**Endpoint**: `getbrgy/{citymun_id}`

**Method**: `POST`

**Authentication**: Required

**URL Parameters**:
- `{citymun_id}`: City/Municipality identifier

**Request Body**:
```json
{
  "payload": {
    "value": "citymun_id"
  }
}
```

**Response**: Returns list of barangays for the specified city/municipality

#### 14. Save Bug Report

**Endpoint**: `savebugreport`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    "report": {
      // Bug report data
    }
  }
}
```

**Response**: Returns success/error status

#### 15. Upload Image

**Endpoint**: `uploadimage/{studid}/{filename}/{filetype}`

**Method**: `POST`

**Authentication**: Required

**Content-Type**: `multipart/form-data`

**URL Parameters**:
- `{studid}`: Student ID
- `{filename}`: Base filename for the uploaded file
- `{filetype}`: File type identifier (see File Types below)

**Form Data**:
- `file[]`: Array of image files

**File Types**:
- `1` - Prospectus
- `2` - Grades
- `3` - Hepa Screen Result
- `4` - Profile (2x2 Photo)
- `5` - Residency Certificate
- `6` - Honorable Dismissal
- `7` - Good Moral Certificate
- `8` - TOR/F138 (Transcript of Records/Form 138)
- `9` - ID Card
- `10` - Medical Certificate
- `11` - Birth Certificate
- `12` - Vaccine Card

**Response** (Success - 200):
```json
{
  "status": {
    "rem": "success",
    "msg": "succesfully retrieved setting",
    "sys": ""
  },
  "data": null,
  "stamp": "2024-01-01T00:00:00+00:00"
}
```

**Notes**:
- Files are uploaded to `gcesuploads/{studid}/{folder}/`
- Multiple files can be uploaded in a single request
- Files are automatically numbered (filename1.ext, filename2.ext, etc.)

---

### Student Endpoints

#### 16. Get Profile

**Endpoint**: `getprofile`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Profile filter parameters (typically student ID)
  }
}
```

**Response**: Returns student profile information

#### 17. Get Enrollment History

**Endpoint**: `getenrollhistory`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Enrollment history filter parameters
  }
}
```

**Response**: Returns enrollment history records

#### 18. Get Available Courses

**Endpoint**: `getavailablecourses`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Course filter parameters
  }
}
```

**Response**: Returns list of available courses for enrollment

#### 19. Update Information

**Endpoint**: `updateinfo`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Personal information fields to update
  },
  "log": {
    "username": "string",
    "fullname": "string",
    "dept": "string",
    "program": "string",
    "panel": "string",
    "device": "string"
  }
}
```

**Response**: Returns success/error status

**Notes**: Logs activity as "Personal Information Update"

#### 20. Update Education

**Endpoint**: `updateeducation`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Education background fields to update
  },
  "log": {
    // Log object (see updateinfo)
  }
}
```

**Response**: Returns success/error status

**Notes**: Logs activity as "Education Background Update"

#### 21. Update Family

**Endpoint**: `updatefamily`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Family background fields to update
  },
  "log": {
    // Log object (see updateinfo)
  }
}
```

**Response**: Returns success/error status

**Notes**: Logs activity as "Family Background Update"

#### 22. Update Health

**Endpoint**: `updatehealth`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Health information fields to update
  },
  "log": {
    // Log object (see updateinfo)
  }
}
```

**Response**: Returns success/error status

**Notes**: Logs activity as "Health Information Update"

#### 23. Update Government

**Endpoint**: `updategovt`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Government information fields to update
  },
  "log": {
    // Log object (see updateinfo)
  }
}
```

**Response**: Returns success/error status

**Notes**: Logs activity as "Govt Information Update"

#### 24. Update Others

**Endpoint**: `updateothers`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Other information fields to update
  },
  "log": {
    // Log object (see updateinfo)
  }
}
```

**Response**: Returns success/error status

**Notes**: Logs activity as "Other Information Update"

#### 25. Enlist

**Endpoint**: `enlist`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Enlistment data
  },
  "log": {
    // Log object (see updateinfo)
  }
}
```

**Response**: Returns success/error status

**Notes**: Logs activity as "Student Enlistment"

---

### LAMP (Learning Management) Endpoints

#### Faculty Loading Endpoints

#### 26. Update Excess

**Endpoint**: `updateexcess`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Excess loading data
  }
}
```

**Response**: Returns success/error status

#### 27. Update Faculty Excess

**Endpoint**: `updatefacultyexcess`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Faculty excess data
  }
}
```

**Response**: Returns success/error status

#### 28. Update Official Time

**Endpoint**: `updateofficialtime`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Official time data
  }
}
```

**Response**: Returns success/error status

#### 29. Update Consultation Time

**Endpoint**: `updateconsultationtime`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Consultation time data
  }
}
```

**Response**: Returns success/error status

#### 30. Update Other Info

**Endpoint**: `updateotherinfo`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Other information data
  }
}
```

**Response**: Returns success/error status

#### Faculty Evaluation Endpoints

#### 31. Get Result Evaluation

**Endpoint**: `getresulteval`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Evaluation filter parameters
  }
}
```

**Response**: Returns evaluation results

#### File Upload/Download Endpoints

#### 32. Upload File

**Endpoint**: `uploadfile/{param1}/{param2}/{param3}/{param4}`

**Method**: `POST`

**Authentication**: Required

**Content-Type**: `multipart/form-data`

**URL Parameters**: (Specific parameters depend on implementation)

**Form Data**:
- `file[]`: Array of files to upload

**Response**: Returns file path(s)

**Note**: ⚠️ **Implementation Status**: This endpoint is referenced in routes but the implementation method `uploadFile()` was not found in the codebase. Check with backend team for implementation status and specific parameter requirements.

#### 33. Upload Signature

**Endpoint**: `uploadsign/{param1}/{param2}/{param3}/{param4}`

**Method**: `POST`

**Authentication**: Required

**Content-Type**: `multipart/form-data`

**URL Parameters**: (Specific parameters depend on implementation)

**Form Data**:
- `file[]`: Signature file(s)

**Response**: Returns signature file path(s)

**Note**: ⚠️ **Implementation Status**: This endpoint is referenced in routes but the implementation method `uploadSignature()` was not found in the codebase. Check with backend team for implementation status and specific parameter requirements.

#### 34. Upload (LAMP)

**Endpoint**: `upload/{acadyear}/{sem}/{userid}`

**Method**: `POST`

**Authentication**: Required

**Content-Type**: `multipart/form-data`

**URL Parameters**:
- `{acadyear}`: Academic year
- `{sem}`: Semester
- `{userid}`: User ID

**Form Data**:
- `file[]`: Array of files to upload

**Response** (Success - 200):
```json
{
  "status": {
    "rem": "success",
    "msg": "Successfully uploaded files(s)",
    "sys": ""
  },
  "data": {
    "filepath": "filename1?path1:filename2?path2"
  },
  "stamp": "2024-01-01T00:00:00+00:00"
}
```

**Notes**:
- Files are uploaded to `files/{acadyear}{sem}/faculty/{userid}/`
- Returns colon-separated list of `filename?filepath` pairs

#### 35. Delete File

**Endpoint**: `deletefile`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    "dir_fld": "file_path_to_delete",
    "id": "student_number"
  }
}
```

**Response** (Success - 200):
```json
{
  "status": {
    "rem": "success",
    "msg": "Successfully deleted file",
    "sys": ""
  },
  "data": null,
  "stamp": "2024-01-01T00:00:00+00:00"
}
```

**Notes**:
- Only deletes files if the path contains the student number (security check)
- Returns success even if file doesn't exist

#### 36. Download File

**Endpoint**: `download`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    "filepath": "relative_file_path"
  }
}
```

**Response**: Returns file as binary stream with `Content-Type: application/octet-stream`

**Notes**: This endpoint returns the file directly, not JSON

#### Class Management Endpoints

#### 37. Get Faculty Classes

**Endpoint**: `getfacultyclasses`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Faculty class filter parameters
  }
}
```

**Response**: Returns list of classes for a faculty member

#### 38. Get Student Classes

**Endpoint**: `getstudentclasses`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Student class filter parameters
  }
}
```

**Response**: Returns list of classes for a student

#### 39. Get Students in Class

**Endpoint**: `getstudentsinclass`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Class filter parameters
  }
}
```

**Response**: Returns list of students enrolled in a class

#### Post Management Endpoints

#### 40. Get Class Post

**Endpoint**: `getclasspost`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Post filter parameters
  }
}
```

**Response**: Returns class post(s)

#### 41. Add Class Post

**Endpoint**: `addclasspost`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Post data (datetime_fld is automatically set)
  }
}
```

**Response**: Returns success/error status

#### 42. Edit Class Post

**Endpoint**: `editclasspost`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Updated post data
  }
}
```

**Response**: Returns success/error status

#### Comment Management Endpoints

#### 43. Get Class Comments

**Endpoint**: `getclasscomments`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Comment filter parameters
  }
}
```

**Response**: Returns class comments

#### 44. Add Class Comment

**Endpoint**: `addclasscomment`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Comment data (datetime_fld is automatically set)
  }
}
```

**Response**: Returns success/error status

#### 45. Edit Class Comment

**Endpoint**: `editclasscomment`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Updated comment data
  }
}
```

**Response**: Returns success/error status

#### Activity Management Endpoints

#### 46. Get Class Activities

**Endpoint**: `getclassactivities`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Activity filter parameters
  }
}
```

**Response**: Returns class activities

#### 47. Add Class Activity

**Endpoint**: `addclassactivity`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Activity data (datetime_fld is automatically set)
  }
}
```

**Response**: Returns success/error status

#### 48. Edit Class Activity

**Endpoint**: `editclassactivity`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Updated activity data
  }
}
```

**Response**: Returns success/error status

#### 49. Get Todo List

**Endpoint**: `gettodolist`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Todo list filter parameters
  }
}
```

**Response**: Returns todo list items

#### 50. Get All Submissions

**Endpoint**: `getallsubmissions`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Submission filter parameters
  }
}
```

**Response**: Returns all submissions

#### Resource Management Endpoints

#### 51. Get Class Resources

**Endpoint**: `getclassresources`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Resource filter parameters
  }
}
```

**Response**: Returns class resources

#### 52. Add Class Resource

**Endpoint**: `addclassresource`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Resource data (datetime_fld is automatically set)
  }
}
```

**Response**: Returns success/error status

#### 53. Edit Class Resource

**Endpoint**: `editclassresource`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Updated resource data
  }
}
```

**Response**: Returns success/error status

#### Topic Management Endpoints

#### 54. Get Class Topics

**Endpoint**: `getclasstopics`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Topic filter parameters
  }
}
```

**Response**: Returns class topics

#### Submission Management Endpoints

#### 55. Get Class Submissions

**Endpoint**: `getclasssubmissions`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Submission filter parameters
  }
}
```

**Response**: Returns class submissions

#### 56. Get Class Submission List

**Endpoint**: `getclasssubmissionlist`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Submission list filter parameters
  }
}
```

**Response**: Returns submission list

#### 57. Get Student Works

**Endpoint**: `getstudentworks`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Student work filter parameters
  }
}
```

**Response**: Returns student work submissions

#### 58. Get Submission

**Endpoint**: `getsubmission`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Single submission filter parameters
  }
}
```

**Response**: Returns single student work submission

#### 59. Edit Class Submission

**Endpoint**: `editclasssubmission`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Updated submission data
  }
}
```

**Response**: Returns success/error status

#### 60. Save Work

**Endpoint**: `savework`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Student work data (datetime_fld is automatically set)
  }
}
```

**Response**: Returns success/error status

#### Quiz Management Endpoints

#### 61. Get Quiz

**Endpoint**: `getquiz`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    "filepath": "path/to/quiz.json"
  }
}
```

**Response** (Success - 200):
```json
{
  "status": {
    "rem": "success",
    "msg": "Succesfully retrieved data",
    "sys": ""
  },
  "data": {
    // Quiz JSON structure
  },
  "stamp": "2024-01-01T00:00:00+00:00"
}
```

**Notes**: Quiz data is stored as JSON files

#### 62. Draft Quiz

**Endpoint**: `draftquiz`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Quiz data structure
  },
  "options": {
    "ay": "academic_year",
    "sem": "semester",
    "userid": "user_id"
  }
}
```

**Response** (Success - 200):
```json
{
  "status": {
    "rem": "success",
    "msg": "Successfully created a draft.",
    "sys": ""
  },
  "data": null,
  "stamp": "2024-01-01T00:00:00+00:00"
}
```

**Notes**: 
- Saves quiz draft to `files/{ay}{sem}/faculty/{userid}/temp/{classcode}.json`
- Used for temporary storage before finalizing quiz

#### 63. Save Quiz

**Endpoint**: `savequiz`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Complete quiz data structure
  },
  "options": {
    "ay": "academic_year",
    "sem": "semester",
    "userid": "user_id"
  },
  "classcode": "class_code"
}
```

**Response** (Success - 200):
```json
{
  "status": {
    "rem": "sucess",
    "msg": "Succesfully generated quiz",
    "sys": ""
  },
  "data": {
    "filepath": "files/{ay}{sem}/faculty/{userid}/quiz/{timestamp}.json",
    "quiz": {
      // Quiz data
    }
  },
  "stamp": "2024-01-01T00:00:00+00:00"
}
```

**Notes**: 
- Creates final quiz file and deletes draft
- File path uses timestamp as filename

#### 64. Edit Quiz

**Endpoint**: `editquiz`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Updated quiz data
  },
  "filepath": "existing_quiz_file_path",
  "classcode": "class_code",
  "options": {
    "ay": "academic_year",
    "sem": "semester",
    "userid": "user_id"
  }
}
```

**Response** (Success - 200):
```json
{
  "status": {
    "rem": "sucess",
    "msg": "Succesfully edited quiz",
    "sys": ""
  },
  "data": {
    "filepath": "quiz_file_path",
    "quiz": {
      // Updated quiz data
    }
  },
  "stamp": "2024-01-01T00:00:00+00:00"
}
```

**Notes**: Deletes draft if it exists after editing

#### 65. Add Answer

**Endpoint**: `addanswer`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    "answer": {
      // Answer data structure
    }
  },
  "ay": "academic_year",
  "sem": "semester",
  "userid": "user_id"
}
```

**Response** (Success - 200):
```json
{
  "status": {
    "rem": "success",
    "msg": "succesfully processed data",
    "sys": ""
  },
  "data": {
    "result": {
      // Answer data
    },
    "filepath": "files/{ay}{sem}/student/{userid}/quiz/{timestamp}.json"
  },
  "stamp": "2024-01-01T00:00:00+00:00"
}
```

**Notes**: 
- Saves student quiz answers as JSON
- File path: `files/{ay}{sem}/student/{userid}/quiz/{timestamp}.json`

#### Evaluation Endpoints

#### 66. Submit Evaluation

**Endpoint**: `submiteval`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Evaluation data
  }
}
```

**Response**: Returns success/error status

#### Message Endpoints

#### 67. Add Message

**Endpoint**: `addmsg`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Message data (datetime_fld is automatically set)
  }
}
```

**Response**: Returns success/error status

#### 68. Get Messages

**Endpoint**: `getmsg`

**Method**: `POST`

**Authentication**: Required

**Request Body**:
```json
{
  "payload": {
    // Message filter parameters
  }
}
```

**Response**: Returns messages

---

## Data Models

### User Object (Login Response)

```typescript
interface User {
  id: string;                    // Student number
  fullname: string;               // Full name
  key: {
    token: string;                // JWT token
    expires: number;              // Unix timestamp
  };
  role: string;                   // User role
  emailadd: string;               // Email address
  dept: string;                   // Department
  program: string;                // Program
  status: string;                 // Status
  issurvey: number;               // 0 or 1
  ispwordreset: number;           // 0 or 1
  image: string;                  // Profile image path
}
```

### Standard Response Structure

```typescript
interface ApiResponse<T> {
  status: {
    rem: "success" | "failed";
    msg: string;
    sys: string;
  };
  data: T | null;
  stamp: string;  // ISO 8601 datetime
}
```

### Log Object (for operations that require logging)

```typescript
interface LogObject {
  username: string;
  fullname: string;
  dept: string;
  program: string;
  panel: string;
  device: string;
}
```

### Request Structure

```typescript
interface ApiRequest {
  payload: Record<string, any>;
  panel?: string;
  device?: string;
  log?: LogObject;
  options?: {
    ay?: string;
    sem?: string;
    userid?: string;
  };
}
```

---

## React Native Integration Guide

### 1. Setup API Client

Create an API client utility for React Native:

```typescript
// api/client.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://your-domain/testapilamp/student';

interface ApiConfig {
  baseURL: string;
  headers: {
    'Content-Type': string;
    'Authorization'?: string;
  };
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  private async loadToken() {
    this.token = await AsyncStorage.getItem('auth_token');
  }

  async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem('auth_token', token);
  }

  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem('auth_token');
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    payload: Record<string, any> = {},
    options: {
      panel?: string;
      device?: string;
      log?: any;
    } = {}
  ): Promise<T> {
    const url = `${this.baseURL}/${endpoint}`;
    const body = {
      payload,
      ...options,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.status?.msg || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async uploadFile(
    endpoint: string,
    files: Array<{ uri: string; name: string; type: string }>,
    additionalParams: Record<string, string> = {}
  ): Promise<any> {
    const url = `${this.baseURL}/${endpoint}`;
    const formData = new FormData();

    files.forEach((file, index) => {
      formData.append('file[]', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
    });

    Object.keys(additionalParams).forEach((key) => {
      formData.append(key, additionalParams[key]);
    });

    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Upload Error:', error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient(BASE_URL);
```

### 2. Authentication Service

```typescript
// services/authService.ts
import { apiClient } from '../api/client';

export interface LoginCredentials {
  username: string;
  password: string;
  panel?: string;
  device?: string;
}

export interface User {
  id: string;
  fullname: string;
  key: {
    token: string;
    expires: number;
  };
  role: string;
  emailadd: string;
  dept: string;
  program: string;
  status: string;
  issurvey: number;
  ispwordreset: number;
  image: string;
}

export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await apiClient.request<{
      status: { rem: string; msg: string; sys: string };
      data: User;
      stamp: string;
    }>('userlogin', {
      username: credentials.username,
      password: credentials.password,
    }, {
      panel: credentials.panel,
      device: credentials.device,
    });

    if (response.status.rem === 'success' && response.data) {
      await apiClient.setToken(response.data.key.token);
      return response.data;
    }

    throw new Error(response.status.msg || 'Login failed');
  },

  async logout() {
    await apiClient.clearToken();
  },
};
```

### 3. Student Service Example

```typescript
// services/studentService.ts
import { apiClient } from '../api/client';

export const studentService = {
  async getProfile(studentId: string) {
    return apiClient.request('getprofile', {
      // Add required parameters based on backend expectations
      studentId,
    });
  },

  async getEnrollmentHistory(studentId: string) {
    return apiClient.request('getenrollhistory', {
      studentId,
    });
  },

  async getAvailableCourses(filters: Record<string, any>) {
    return apiClient.request('getavailablecourses', filters);
  },

  async updateInfo(data: Record<string, any>, log: any) {
    return apiClient.request('updateinfo', data, { log });
  },

  async enlist(data: Record<string, any>, log: any) {
    return apiClient.request('enlist', data, { log });
  },
};
```

### 4. LAMP Service Example

```typescript
// services/lampService.ts
import { apiClient } from '../api/client';

export const lampService = {
  async getStudentClasses(studentId: string) {
    return apiClient.request('getstudentclasses', {
      studentId,
    });
  },

  async getClassPost(classId: string) {
    return apiClient.request('getclasspost', {
      classId,
    });
  },

  async addClassPost(data: Record<string, any>) {
    return apiClient.request('addclasspost', data);
  },

  async uploadFile(
    acadyear: string,
    sem: string,
    userid: string,
    files: Array<{ uri: string; name: string; type: string }>
  ) {
    const endpoint = `upload/${acadyear}/${sem}/${userid}`;
    return apiClient.uploadFile(endpoint, files);
  },

  async getQuiz(filepath: string) {
    return apiClient.request('getquiz', { filepath });
  },

  async saveQuiz(
    quizData: any,
    options: { ay: string; sem: string; userid: string },
    classcode: string
  ) {
    return apiClient.request('savequiz', quizData, {
      options,
      classcode,
    });
  },
};
```

### 5. Error Handling

```typescript
// utils/errorHandler.ts
export const handleApiError = (error: any): string => {
  if (error.response?.data?.status?.msg) {
    return error.response.data.status.msg;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};
```

### 6. React Hook Example

```typescript
// hooks/useApi.ts
import { useState, useCallback } from 'react';
import { handleApiError } from '../utils/errorHandler';

export const useApi = <T,>() => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (
    apiCall: () => Promise<T>
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall();
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading, error, data };
};
```

### 7. Usage in Components

```typescript
// components/LoginScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { authService } from '../services/authService';
import { useApi } from '../hooks/useApi';

export const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { execute, loading } = useApi();

  const handleLogin = async () => {
    try {
      const user = await execute(() =>
        authService.login({
          username,
          password,
          device: 'mobile',
        })
      );
      // Navigate to home screen
      console.log('Logged in:', user);
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <View>
      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Username"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />
      <Button
        title="Login"
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  );
};
```

### 8. Environment Configuration

```typescript
// config/env.ts
export const API_CONFIG = {
  BASE_URL: __DEV__
    ? 'http://localhost/testapilamp/student'
    : 'https://your-production-domain.com/testapilamp/student',
};
```

### 9. Token Refresh (if needed)

```typescript
// services/tokenService.ts
import { apiClient } from '../api/client';

export const tokenService = {
  async refreshToken() {
    // Implement token refresh logic if needed
    // Currently, tokens expire after 1 hour
    // You may need to re-login or implement refresh endpoint
  },

  isTokenExpired(expires: number): boolean {
    return Date.now() / 1000 >= expires;
  },
};
```

---

## Important Notes for Integration

### 1. CORS Configuration
The API sets CORS headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: POST, OPTIONS`
- `Access-Control-Allow-Headers: Authorization, Content-Type`

### 2. Authentication Status
**Current Implementation**: Authentication check always returns `true` (disabled). However, you should still include the `Authorization` header in requests as the code structure supports it and it may be enabled in the future.

### 3. File Uploads
- Use `multipart/form-data` for file uploads
- File arrays should be named `file[]`
- Some endpoints use URL parameters for file type/folder specification

### 4. Date/Time Handling
- All datetime fields use server timezone: `Asia/Manila`
- `datetime_fld` is automatically set by the server for create operations
- Timestamps in responses are ISO 8601 format

### 5. Stored Procedures
Most endpoints call MySQL stored procedures. The exact parameter structure depends on the stored procedure implementation. You may need to coordinate with the backend team for specific payload structures.

### 6. Error Messages
- Check `status.rem` for "success" or "failed"
- `status.msg` contains user-friendly messages
- `status.sys` contains system/technical error details (usually empty on success)

### 7. Logging
Some operations require a `log` object in the request. This is used for audit trails. Include it for:
- `updateinfo`
- `updateeducation`
- `updatefamily`
- `updatehealth`
- `updategovt`
- `updateothers`
- `enlist`

---

## Testing Endpoints

### Using cURL

```bash
# Login
curl -X POST http://your-domain/testapilamp/student/userlogin \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "username": "testuser",
      "password": "testpass"
    }
  }'

# Authenticated Request
curl -X POST http://your-domain/testapilamp/student/getprofile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "payload": {
      "studentId": "12345"
    }
  }'
```

### Using Postman

1. Set request method to `POST`
2. Set URL to `{base_url}/{endpoint}`
3. Add header `Content-Type: application/json`
4. Add header `Authorization: Bearer {token}` (for authenticated endpoints)
5. Set body to `raw` and `JSON`
6. Use the request body format specified in each endpoint

---

## Support and Contact

For API support, please contact the Systems Administrator.

**Note**: This documentation is based on the current codebase analysis. Some endpoints may require additional parameters or have different response structures depending on the stored procedure implementations. Always test endpoints thoroughly and coordinate with the backend team for specific requirements.

---

## Changelog

### Version 1.0
- Initial API documentation
- All endpoints documented
- React Native integration guide added
- TypeScript interfaces provided

---

**Last Updated**: 2024-01-01
**API Version**: 1.0

