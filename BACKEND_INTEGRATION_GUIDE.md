# Backend Integration Guide

## ✅ What I've Done

### 1. **Updated Axios Configuration** (`src/lib/axios.ts`)
- Added JWT token interceptor to automatically include token in all requests
- Added response interceptor to handle 403 unauthorized errors
- Redirects to login page if token expires

### 2. **Implemented Login Page** (`src/app/login/page.tsx`)
- Connected login form to backend API (`POST /api/login`)
- Stores JWT token in localStorage
- Shows error messages
- Redirects to home page on successful login

### 3. **Updated Teams Context** (`src/contexts/teams-context.tsx`)
- Replaced local state with API calls
- Added loading and error states
- Integrated with backend endpoints:
  - `GET /api/team` - Fetch all teams
  - `POST /api/team/create` - Create team
  - `PUT /api/team/:id/update` - Update team
  - `DELETE /api/team/:id/delete` - Delete team
  - `POST /api/topic/:teamId/create` - Create topic
  - `PUT /api/topic/:topicId/update` - Update topic
  - `DELETE /api/topic/:topicId/delete` - Delete topic
  - `POST /api/topic/:topicId/subtopic/create` - Create subtopic

---

## ⚠️ Backend Endpoints Missing

Your friend's backend is **missing some endpoints** that the frontend needs:

### **Subtopic Operations**
```javascript
// Add these to src/controllers/topic.controller.js and src/routes/topic.route.js
PUT /api/topic/subtopic/:subtopicId/update
DELETE /api/topic/subtopic/:subtopicId/delete
```

### **Job Operations** (Not implemented yet in backend)
```javascript
GET /api/job?teamId=x&topicId=y&subTopicId=z  // Filter jobs by subtopic
POST /api/job/create
PUT /api/job/:jobId/update
DELETE /api/job/:jobId/delete
```

### **Comment Operations** (Not implemented yet in backend)
```javascript
GET /api/comment/:jobId        // Get comments for a job
POST /api/comment/create       // Create comment
```

### **Inbox/Notification Operations** (Not implemented yet in backend)
```javascript
GET /api/inbox                 // Get user's messages
POST /api/inbox/create         // Create message
PUT /api/inbox/:messageId/read // Mark as read
```

### **File Upload** (Not implemented yet in backend)
```javascript
POST /api/upload               // Upload document/attachment
```

---

## 📋 Next Steps - TODO List

### **Step 1: Test Current Integration**
1. Start backend server: `cd d:\my-backend\management-system && npm start` (or `npm run dev`)
2. Start frontend: `cd d:\my-app && npm run dev`
3. Test login functionality
4. Test creating/updating/deleting teams and topics

### **Step 2: Update Jobs Context**
- [ ] Update `src/contexts/jobs-context.tsx` to use API calls
- [ ] Requires backend to implement job endpoints first

### **Step 3: Update Inbox Context**
- [ ] Update `src/contexts/inbox-context.tsx` to use API calls
- [ ] Requires backend to implement inbox endpoints first

### **Step 4: Implement File Upload**
- [ ] Add file upload endpoint to backend (using `multer` middleware)
- [ ] Update `src/components/job-detail.tsx` to upload files to API
- [ ] Store file URLs in database

### **Step 5: Add Protected Routes**
- [ ] Create `src/middleware.ts` to check authentication
- [ ] Redirect to login if not authenticated

### **Step 6: Add User Context**
- [ ] Create `src/contexts/user-context.tsx` to store user info
- [ ] Decode JWT token to get user data
- [ ] Display user name/email in sidebar

---

## 🔑 Backend API Reference

### **Base URL**
```
http://localhost:3001/api
```

### **Authentication**
All protected routes require JWT token in header:
```
Authorization: Bearer <your-jwt-token>
```

### **Response Format**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### **Error Format**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ]
}
```

---

## 🔧 Required Backend Updates

Ask your friend to add these endpoints:

### **1. Subtopic Update & Delete**
```javascript
// In src/controllers/topic.controller.js
updateSubtopic: async (req, res, _next) => {
  try {
    const { subtopicId } = req.params;
    const updatedSubtopic = await TopicService.updateSubtopic(req.user.id, subtopicId, req.body);
    res.status(200).json({
      success: true,
      message: "Subtopic updated successfully",
      data: updatedSubtopic,
    });
  } catch (error) {
    _next(error);
  }
},

deleteSubtopic: async (req, res, _next) => {
  try {
    const { subtopicId } = req.params;
    await TopicService.deleteSubtopic(req.user.id, subtopicId);
    res.status(200).json({
      success: true,
      message: "Subtopic deleted successfully",
    });
  } catch (error) {
    _next(error);
  }
}
```

### **2. Job CRUD Operations**
Create new files:
- `src/controllers/job.controller.js`
- `src/services/job.service.js`
- `src/repositories/job.repository.js`
- `src/routes/job.route.js`

With endpoints:
- `GET /api/job?subTopicId=x`
- `POST /api/job/create`
- `PUT /api/job/:jobId/update`
- `DELETE /api/job/:jobId/delete`

### **3. Comment Operations**
Create new files:
- `src/controllers/comment.controller.js`
- `src/services/comment.service.js`
- `src/repositories/comment.repository.js`
- `src/routes/comment.route.js`

### **4. Inbox/Notification Operations**
Create new files:
- `src/controllers/inbox.controller.js`
- `src/services/inbox.service.js`
- `src/repositories/inbox.repository.js`
- `src/routes/inbox.route.js`

---

## 🧪 Testing with Postman

### **1. Register User**
```http
POST http://localhost:3001/api/register
Content-Type: application/json

{
  "email": "test@example.com",
  "username": "testuser",
  "password": "password123",
  "name": "Test User"
}
```

### **2. Login**
```http
POST http://localhost:3001/api/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response:** Copy the JWT token from response

### **3. Create Team**
```http
POST http://localhost:3001/api/team/create
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "name": "Struktur",
  "description": "Team struktur bangunan"
}
```

### **4. Get Teams**
```http
GET http://localhost:3001/api/team
Authorization: Bearer <your-token>
```

---

## 🚀 Running Both Servers

### **Terminal 1: Backend**
```powershell
cd d:\my-backend\management-system
npm start
# Backend runs on http://localhost:3001
```

### **Terminal 2: Frontend**
```powershell
cd d:\my-app
npm run dev
# Frontend runs on http://localhost:3000
```

---

## 📝 Notes

1. **Jobs and Inbox are still using local state** - They need backend implementation
2. **File upload not implemented** - Backend needs multer middleware
3. **Subtopic update/delete** - Local state fallback, needs backend endpoint
4. **Token expires in 1 hour** - User will be redirected to login after expiration
5. **No refresh token** - User must login again after token expires

---

## 🔍 Database Schema Note

Make sure your friend's database has these tables:
- `users` (id, email, username, name, password, role)
- `teams` (id, name, description, ownerId, createdAt)
- `topics` (id, teamId, title, createdAt)
- `subtopics` (id, topicId, title, description, createdAt)
- `jobs` (will need to be created)
- `comments` (will need to be created)
- `inbox_messages` (will need to be created)

Check with Prisma schema or database migrations.
