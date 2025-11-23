# Postman File Upload & Activity Submission Testing Guide

## Overview

The API supports file uploads for activity submissions. There are **two main approaches**:

1. **Two-Step Process** (Recommended):
   - Step 1: Upload files using `upload` endpoint
   - Step 2: Submit work using `savework` endpoint with file paths

2. **Direct Upload** (For student documents):
   - Use `uploadimage` endpoint for student document uploads

---

## Method 1: Activity Submission with File Upload (Two-Step)

### Step 1: Upload Files

**Endpoint**: `upload/{acadyear}/{sem}/{userid}`

**Method**: `POST`

**URL Example**: 
```
http://gclamp/testapilamp/student/upload/2024-2025/1/STUDENT123
```

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body Type**: `form-data` (NOT raw JSON)

**Body Fields**:
- Key: `file[]` (type: File)
- Value: Select your file(s) - you can add multiple files

**Postman Setup**:
1. Set method to `POST`
2. Enter URL: `http://gclamp/testapilamp/student/upload/2024-2025/1/STUDENT123`
3. Go to **Body** tab
4. Select **form-data** (NOT x-www-form-urlencoded)
5. Add a new field:
   - Key: `file[]` (make sure to include the brackets `[]`)
   - Change type from "Text" to **"File"** (dropdown on the right)
   - Click "Select Files" and choose your file(s)
6. Add **Headers** tab:
   - Key: `Authorization`
   - Value: `Bearer YOUR_JWT_TOKEN`

**Expected Response** (Success - 200):
```json
{
  "status": {
    "rem": "success",
    "msg": "Successfully uploaded files(s)",
    "sys": ""
  },
  "data": {
    "filepath": "filename1.pdf?files/2024-20251/faculty/FACULTY123/filename1.pdf:filename2.docx?files/2024-20251/faculty/FACULTY123/filename2.docx"
  },
  "stamp": "2024-01-01T00:00:00+00:00"
}
```

**Note**: 
- The `filepath` format is: `originalname?path:originalname2?path2` (colon-separated, question mark separates name from path)
- Files are stored in `files/{acadyear}{sem}/faculty/{userid}/` directory (even for student uploads, the path says "faculty" but uses the userid parameter)
- The `userid` parameter can be either faculty ID or student ID depending on context

---

### Step 2: Submit Work with File Paths

**Endpoint**: `savework`

**Method**: `POST`

**URL**: 
```
http://gclamp/testapilamp/student/savework
```

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body Type**: `raw` → `JSON`

**Body Example** (Based on database structure):
```json
{
  "payload": {
    "submitcode_fld": "SUBMIT001",
    "ay_fld": "2024-2025",
    "sem_fld": 1,
    "classcode_fld": "CS101",
    "actcode_fld": "ACT123",
    "studno_fld": "STUDENT123",
    "type_fld": 0,
    "score_fld": 0,
    "dir_fld": "filename1.pdf?files/2024-20251/faculty/FACULTY123/filename1.pdf:filename2.docx?files/2024-20251/faculty/FACULTY123/filename2.docx",
    "issubmitted_fld": 1
  }
}
```

**Field Descriptions** (from database schema):
- `submitcode_fld`: Unique submission code (varchar)
- `ay_fld`: Academic year (varchar, e.g., "2024-2025")
- `sem_fld`: Semester (tinyint: 1 or 2)
- `classcode_fld`: Class code (varchar)
- `actcode_fld`: Activity code (varchar)
- `studno_fld`: Student number (varchar)
- `type_fld`: Submission type (tinyint, default: 0)
- `score_fld`: Score (smallint, default: 0)
- `dir_fld`: File path(s) from upload endpoint (text) - **This is where you put the filepath from Step 1**
- `issubmitted_fld`: Is submitted flag (tinyint: 0 or 1)
- `datetime_fld`: Automatically set by server (you don't need to include this)

**Postman Setup**:
1. Set method to `POST`
2. Enter URL: `http://gclamp/testapilamp/student/savework`
3. Go to **Headers** tab:
   - `Authorization`: `Bearer YOUR_JWT_TOKEN`
   - `Content-Type`: `application/json`
4. Go to **Body** tab
5. Select **raw** and choose **JSON** from dropdown
6. Paste the JSON body above (modify with your actual data)

**Expected Response** (Success - 200):
```json
{
  "status": {
    "rem": "success",
    "msg": "Successfully performed the requested operation",
    "sys": ""
  },
  "data": [
    // Returned data from stored procedure
  ],
  "stamp": "2024-01-01T00:00:00+00:00"
}
```

**Note**: The exact payload structure depends on what the `lpStudentWork` stored procedure expects. You may need to check with the backend team for the exact field names.

---

## Method 2: Student Document Upload (Direct)

**Endpoint**: `uploadimage/{studid}/{filename}/{filetype}`

**Method**: `POST`

**URL Example**: 
```
http://gclamp/testapilamp/student/uploadimage/STUDENT123/ProfilePhoto/4
```

**Headers**:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body Type**: `form-data`

**Body Fields**:
- Key: `file[]` (type: File)
- Value: Select your image file(s)

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

**Postman Setup**:
1. Set method to `POST`
2. Enter URL: `http://gclamp/testapilamp/student/uploadimage/STUDENT123/ProfilePhoto/4`
3. Go to **Body** tab
4. Select **form-data**
5. Add field:
   - Key: `file[]`
   - Type: **File**
   - Value: Select your file(s)
6. Add **Headers**:
   - `Authorization`: `Bearer YOUR_JWT_TOKEN`

**Expected Response** (Success - 200):
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

---

## Complete Workflow Example

### Scenario: Student Submitting Assignment with Files

**1. Login First** (if you don't have a token):
```
POST http://gclamp/testapilamp/student/userlogin
Body (JSON):
{
  "payload": {
    "username": "student123",
    "password": "password123"
  }
}
```

**2. Upload Files**:
```
POST http://gclamp/testapilamp/student/upload/2024-2025/1/STUDENT123
Headers:
  Authorization: Bearer [token from step 1]
Body (form-data):
  file[]: [Select your assignment files]
```

**3. Save Submission**:
```
POST http://gclamp/testapilamp/student/savework
Headers:
  Authorization: Bearer [token from step 1]
  Content-Type: application/json
Body (JSON):
{
  "payload": {
    "submitcode_fld": "SUBMIT001",
    "ay_fld": "2024-2025",
    "sem_fld": 1,
    "classcode_fld": "CS101",
    "actcode_fld": "ACT001",
    "studno_fld": "STUDENT123",
    "type_fld": 0,
    "score_fld": 0,
    "dir_fld": "[filepath from step 2 response - use the 'filepath' value from data.filepath]",
    "issubmitted_fld": 1
  }
}
```

---

## Common Issues & Solutions

### Issue 1: "Unauthorized" Error
**Solution**: Make sure you:
- Include `Authorization: Bearer YOUR_TOKEN` header
- Have a valid JWT token (login first)
- Token hasn't expired (tokens expire after 1 hour)

### Issue 2: "Content-Type" Error
**Solution**: 
- For file uploads: Use `form-data` (Postman sets Content-Type automatically)
- For JSON requests: Set `Content-Type: application/json` header

### Issue 3: File Upload Returns 403/422
**Solution**: 
- Check file size limits
- Verify file path structure in URL parameters
- Ensure directory permissions on server

### Issue 4: "PROCEDURE does not exist" Error
**Solution**: This is a backend issue - the stored procedure `lpStudentWork` doesn't exist. Contact backend team.

### Issue 5: File Path Format Confusion
**Solution**: The `upload` endpoint returns:
```
"filename1.pdf?path/to/file1.pdf:filename2.docx?path/to/file2.docx"
```
- Colon (`:`) separates multiple files
- Question mark (`?`) separates original filename from file path
- Use this entire string in the `filepath` field of `savework`

---

## Testing Checklist

- [ ] Login and get JWT token
- [ ] Test file upload with single file
- [ ] Test file upload with multiple files
- [ ] Verify file path format in response
- [ ] Test `savework` endpoint with file paths
- [ ] Test with different file types (PDF, DOCX, images, etc.)
- [ ] Test error handling (invalid token, missing files, etc.)

---

## Postman Collection Setup Tips

1. **Create Environment Variables**:
   - `base_url`: `http://gclamp/testapilamp/student`
   - `token`: Your JWT token (auto-update after login)
   - `student_id`: Your student ID
   - `acadyear`: `2024-2025`
   - `semester`: `1`

2. **Use Variables in URLs**:
   ```
   {{base_url}}/upload/{{acadyear}}/{{semester}}/{{student_id}}
   ```

3. **Auto-Save Token**:
   - After login request, add this to "Tests" tab:
   ```javascript
   if (pm.response.code === 200) {
       var jsonData = pm.response.json();
       if (jsonData.data && jsonData.data.key) {
           pm.environment.set("token", jsonData.data.key.token);
       }
   }
   ```

4. **Pre-request Script** (for authenticated requests):
   ```javascript
   pm.request.headers.add({
       key: 'Authorization',
       value: 'Bearer ' + pm.environment.get('token')
   });
   ```

---

## Alternative: Testing with cURL

### Upload File:
```bash
curl -X POST \
  "http://gclamp/testapilamp/student/upload/2024-2025/1/STUDENT123" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file[]=@/path/to/file1.pdf" \
  -F "file[]=@/path/to/file2.docx"
```

### Save Work:
```bash
curl -X POST \
  "http://gclamp/testapilamp/student/savework" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "activity_id": "ACT001",
      "classcode": "CS101",
      "student_id": "STUDENT123",
      "filepath": "filename1.pdf?path/to/file1.pdf",
      "submission_text": "My submission"
    }
  }'
```

---

## Important Notes

1. **File Size Limits**: Check with backend team for maximum file size
2. **Allowed File Types**: May be restricted on server side
3. **File Paths**: The `upload` endpoint returns paths relative to server root
4. **Stored Procedure**: `savework` calls `lpStudentWork` - you need to know what fields it expects
5. **Database**: Files are stored in `files/{acadyear}{sem}/faculty/{userid}/` directory structure

---

## Need Help?

If you encounter issues:
1. Check the response status code and message
2. Verify your JWT token is valid
3. Confirm the stored procedure exists (backend issue)
4. Check file permissions on server (backend issue)
5. Verify payload structure matches what stored procedure expects

