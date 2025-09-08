# 📂 Project Management Platform

A scalable **Project Management Backend** built with **Node.js, Express.js, and MongoDB (Mongoose)**.  
This platform provides secure authentication, role-based authorization, and RESTful APIs for managing users, projects, and tasks.

---

## 🚀 Features
- 🔐 **Authentication & Authorization**
  - JWT-based authentication with refresh tokens
  - Role-based access control (Admin, Member)
  - Password hashing using **bcrypt**

- 📊 **Project & Task Management**
  - CRUD APIs for users, projects, and tasks
  - Assign tasks to project members
  - Track task status (Todo, In Progress, Done)

- ⚡ **API Architecture**
  - RESTful APIs with modular structure (controllers, routes, models, middleware)
  - Centralized error handling and input validation
  - Consistent API responses with `ApiResponse` & `ApiError` classes

- 🛡️ **Security**
  - Environment-based configuration (`dotenv`)
  - Encrypted passwords with **bcrypt**
  - Middleware for authentication & authorization

---

## 🛠️ Tech Stack
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB with Mongoose ODM  
- **Authentication:** JWT, bcrypt  
- **Tools:** Postman, npm, dotenv  

---

## 📂 Project Structure
project-management-platform/
│── backend/
│ ├── controllers/ # Business logic
│ ├── middlewares/ # Auth & error handling
│ ├── models/ # Mongoose schemas
│ ├── routes/ # API routes
│ ├── utils/ # Helpers (ApiError, ApiResponse)
│ ├── config/ # DB connection, env setup
│ └── server.js # App entry point
│── .env.example # Sample environment variables
│── package.json
│── README.md


---

## ⚡ API Endpoints

### 🔑 Authentication
- `POST /api/auth/register` → Register new user  
- `POST /api/auth/login` → Login user & return JWT  
- `POST /api/auth/refresh-token` → Get new access token  

### 👤 User
- `GET /api/users/:id` → Get user details  
- `DELETE /api/users/:id` → Delete user  

### 📂 Project
- `POST /api/projects` → Create project  
- `GET /api/projects` → Get all projects  
- `GET /api/projects/:id` → Get project by ID  
- `PUT /api/projects/:id` → Update project  
- `DELETE /api/projects/:id` → Delete project  

### ✅ Task
- `POST /api/projects/:id/tasks` → Create task in project  
- `PUT /api/tasks/:id` → Update task  
- `DELETE /api/tasks/:id` → Delete task  

---

## ⚙️ Getting Started

### 1️⃣ Clone repo
```bash
git clone https://github.com/dps3007/project-management-platform.git
cd project-management-platform
2️⃣ Setup environment
bash
Copy code
cp .env.example .env
Fill in the required values:

env
Copy code
PORT=5000
MONGODB_URI=mongodb://localhost:27017/projectDB
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
3️⃣ Install dependencies
bash
Copy code
npm install
4️⃣ Run server
bash
Copy code
npm start
Server will run at http://localhost:5000
```

## 🧪 Testing
Use Postman or Thunder Client to test the APIs.
Make sure to pass Authorization: Bearer <token> in headers for protected routes.

## 🚀 Future Improvements
Frontend dashboard (React) for visualization

Task deadlines & reminders

File upload support (Multer + Cloud storage)

Docker setup for containerization

CI/CD pipeline for automated deployments

## 📌 Author
👨‍💻 Deepanshu Pal
