# 🔗 StartInno API Quick Reference

## Base URL
```
Local: http://localhost:3001/api
Production: https://your-project.vercel.app/api
```

---

## 🔐 Authentication API

### POST /api/login
**Request:**
```json
{
  "email": "admin@startinno.com",
  "password": "admin123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "YWRtaW5Ac3RhcnRpbm5vLmNvbTphZG1pbjEyMw==",
  "email": "admin@startinno.com"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@startinno.com","password":"admin123"}'
```

**JavaScript Example:**
```javascript
const response = await fetch("/api/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "admin@startinno.com",
    password: "admin123"
  })
});
const data = await response.json();
console.log(data);
```

---

## 📋 Problems API

### GET /api/getProblems
**Request:**
```
No body required - simple GET request
```

**Success Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Web Development Challenge",
    "pdfUrl": "https://drive.google.com/file/d/1234567/view",
    "maxTeams": 5,
    "selectedTeams": 2,
    "createdAt": "2026-04-15T10:30:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Mobile App Challenge",
    "pdfUrl": "https://drive.google.com/file/d/7654321/view",
    "maxTeams": 4,
    "selectedTeams": 4,
    "createdAt": "2026-04-15T10:31:00.000Z"
  }
]
```

**Empty Response (200):**
```json
[]
```

**Error Response (500):**
```json
{
  "error": "Failed to fetch problems",
  "message": "MONGODB_URI is not set"
}
```

**cURL Example:**
```bash
curl http://localhost:3001/api/getProblems
```

**JavaScript Example:**
```javascript
const response = await fetch("/api/getProblems");
const problems = await response.json();
problems.forEach(p => {
  console.log(`${p.title}: ${p.selectedTeams}/${p.maxTeams}`);
});
```

---

### POST /api/uploadProblem
**Request:**
```json
{
  "title": "Web Development Challenge",
  "pdfUrl": "https://drive.google.com/file/d/1234567/view",
  "maxTeams": 5
}
```

**Success Response (200):**
```json
{
  "message": "Problem added successfully",
  "problemId": "507f1f77bcf86cd799439011"
}
```

**Error Response (500):**
```json
{
  "error": "Failed to add problem",
  "message": "Database connection failed"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/uploadProblem \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Web Development",
    "pdfUrl": "https://drive.google.com/...",
    "maxTeams": 5
  }'
```

**JavaScript Example:**
```javascript
const response = await fetch("/api/uploadProblem", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "Web Development Challenge",
    pdfUrl: "https://drive.google.com/file/d/1234567/view",
    maxTeams: 5
  })
});
const data = await response.json();
console.log(data.message);
```

---

### POST /api/updateProblem
**Request:**
```json
{
  "problemId": "507f1f77bcf86cd799439011",
  "title": "Advanced Web Development",
  "pdfUrl": "https://drive.google.com/updated",
  "maxTeams": 10
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Problem updated successfully"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Problem not found"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/updateProblem \
  -H "Content-Type: application/json" \
  -d '{
    "problemId": "507f1f77bcf86cd799439011",
    "title": "Advanced Web Dev",
    "pdfUrl": "https://drive.google.com/updated",
    "maxTeams": 10
  }'
```

---

### POST /api/deketeHackathon
**Request:**
```json
{
  "problemId": "507f1f77bcf86cd799439011"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Problem and related submissions deleted successfully"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Problem not found"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/deketeHackathon \
  -H "Content-Type: application/json" \
  -d '{"problemId": "507f1f77bcf86cd799439011"}'
```

---

## 🏆 Team Submission API

### POST /api/submitTeam
**Request:**
```json
{
  "teamName": "Alpha Team",
  "problemId": "507f1f77bcf86cd799439011"
}
```

**Success Response (200):**
```json
{
  "message": "Submitted successfully"
}
```

**Error: Team Already Submitted (400):**
```json
{
  "message": "Team already submitted"
}
```

**Error: Problem Full (400):**
```json
{
  "message": "Limit reached"
}
```

**Error: Problem Not Found (404):**
```json
{
  "message": "Problem not found"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/submitTeam \
  -H "Content-Type: application/json" \
  -d '{
    "teamName": "Alpha Team",
    "problemId": "507f1f77bcf86cd799439011"
  }'
```

**JavaScript Example:**
```javascript
const response = await fetch("/api/submitTeam", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    teamName: "Alpha Team",
    problemId: "507f1f77bcf86cd799439011"
  })
});

if (response.ok) {
  const data = await response.json();
  console.log("✅ " + data.message);
} else {
  const error = await response.json();
  console.log("⚠️ " + error.message);
}
```

---

## 📊 Submissions API

### GET /api/getsubmission
**Request:**
```
No body required - simple GET request
```

**Success Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439050",
    "teamName": "Alpha Team",
    "problemId": "507f1f77bcf86cd799439011",
    "submittedAt": "2026-04-15T11:00:00.000Z",
    "problem": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "title": "Web Development Challenge",
        "pdfUrl": "https://drive.google.com/...",
        "maxTeams": 5,
        "selectedTeams": 1
      }
    ]
  }
]
```

**Empty Response (200):**
```json
[]
```

**cURL Example:**
```bash
curl http://localhost:3001/api/getsubmission
```

**JavaScript Example:**
```javascript
const response = await fetch("/api/getsubmission");
const submissions = await response.json();
submissions.forEach(sub => {
  const problem = sub.problem[0]?.title || "Unknown";
  console.log(`${sub.teamName} → ${problem}`);
});
```

---

## 🧪 Testing All Endpoints

### 1. Test With Postman/Insomnia
```
Import collection from API requests above
Replace http://localhost:3001 with your URL
Run tests in order (login, create, read, update, delete)
```

### 2. Test From Browser Console
```javascript
// Test getProblems
fetch("/api/getProblems")
  .then(r => r.json())
  .then(d => console.log(d));

// Test login
fetch("/api/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "admin@startinno.com",
    password: "admin123"
  })
})
.then(r => r.json())
.then(d => console.log(d));

// Test submit team
fetch("/api/submitTeam", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    teamName: "Test Team",
    problemId: "YOUR_PROBLEM_ID_HERE"
  })
})
.then(r => r.json())
.then(d => console.log(d));
```

### 3. Test With cURL Script
```bash
#!/bin/bash

BASE_URL="http://localhost:3001/api"

echo "🧪 Testing StartInno API..."

# 1. Get problems
echo -e "\n📋 Getting problems..."
curl -s "$BASE_URL/getProblems" | json_pp

# 2. Create problem
echo -e "\n📤 Creating problem..."
PROBLEM_ID=$(curl -s -X POST "$BASE_URL/uploadProblem" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Problem",
    "pdfUrl": "https://example.com/test.pdf",
    "maxTeams": 3
  }' | jq -r '.problemId')

echo "Created: $PROBLEM_ID"

# 3. Submit team
echo -e "\n🏆 Submitting team..."
curl -s -X POST "$BASE_URL/submitTeam" \
  -H "Content-Type: application/json" \
  -d "{
    \"teamName\": \"Test Team 1\",
    \"problemId\": \"$PROBLEM_ID\"
  }"

# 4. Get submissions
echo -e "\n📊 Getting submissions..."
curl -s "$BASE_URL/getsubmission" | json_pp

echo -e "\n✅ Testing complete!"
```

---

## 🔍 HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful request |
| 400 | Bad Request | Missing parameters |
| 401 | Unauthorized | Invalid credentials |
| 404 | Not Found | Problem doesn't exist |
| 405 | Method Not Allowed | Wrong HTTP method |
| 500 | Server Error | Database connection failure |

---

## 🚀 Common Request/Response Patterns

### Pattern: Create → Read → Update → Delete

```javascript
// 1. CREATE
const createRes = await fetch("/api/uploadProblem", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "New Problem",
    pdfUrl: "https://...",
    maxTeams: 5
  })
});
const { problemId } = await createRes.json();

// 2. READ
const readRes = await fetch("/api/getProblems");
const problems = await readRes.json();
const problem = problems.find(p => p._id === problemId);

// 3. UPDATE
const updateRes = await fetch("/api/updateProblem", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    problemId,
    title: "Updated Title",
    pdfUrl: "https://...",
    maxTeams: 10
  })
});

// 4. DELETE
const deleteRes = await fetch("/api/deketeHackathon", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ problemId })
});
```

---

## 📝 Error Handling Best Practices

```javascript
async function apiCall(endpoint, options = {}) {
  try {
    console.log(`📤 POST ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: options.method || "GET",
      headers: { "Content-Type": "application/json", ...options.headers },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    console.log(`📊 Response status: ${response.status}`);

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ Error: ${error.message}`);
      throw new Error(error.message);
    }

    const data = await response.json();
    console.log(`✅ Success:`, data);
    return { success: true, data };

  } catch (error) {
    console.error(`❌ API Error:`, error.message);
    return { success: false, error: error.message };
  }
}

// Usage
const result = await apiCall("/api/getProblems");
if (!result.success) {
  alert(`Error: ${result.error}`);
}
```

---

**Last Updated:** April 15, 2026  
**API Version:** 1.0  
**Status:** Complete & Documented ✅
