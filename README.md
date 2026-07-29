# 📐 Calculus Corner — Full-Stack Educational Platform & Mathematical LMS

<p align="center">
  <img src="frontend/public/official.png" alt="Calculus Corner Logo" width="250" style="border-radius: 12px;" />
</p>

> **Calculus Corner** is a complete, modern digital academy and Learning Management System (LMS) specifically built for mastering all types of problems related to mathematics, Differential Equations, and Linear Algebra. Combining video masterclasses, interactive practice labs, automated dynamic certificates, simple local payment verification, and powerful teacher administration tools, Calculus Corner makes complex calculus intuitive, structured, and rewarding for every student.

---


## 🎓 What is Calculus Corner? (Simple Overview)

**Calculus Corner** is an all-in-one digital mathematics institute designed to take students step-by-step from foundational math concepts to advanced calculus mastery. 

Founded by **Muhammad Mehtab**, an experienced mathematics educator, the platform acts as a virtual classroom, homework helper, exam preparation center, reference library, and official certification hub.

### Who is it for?
- **High School AP Students**: Preparing for AP Calculus AB/BC exams with practice problems and past exam paper archives.
- **University Students**: Enrolled in Calculus I, Calculus II, Multivariable Calculus (Calculus III), Differential Equations, or Linear Algebra.
- **Engineering & Physics Aspirants**: Needing strong mathematical foundations for university entrance or coursework.
- **Teachers & Tutors**: Seeking a ready-made digital platform to host structured video lessons, track student progress, and issue verified completion certificates.

---

## 🌟 Why Choose Calculus Corner? (Key Features & Benefits)

Calculus Corner offers a seamless experience tailored for both students and instructors:

1. 🎥 **Structured Video Masterclasses**
   - HD video lectures organized neatly by subject, chapter, and lesson so students can learn at their own pace.

2. 📝 **Interactive Practice Lab & Self-Grading Quizzes**
   - Students test their skills with instant feedback on practice questions, step-by-step solution explanations, and auto-graded quizzes.

3. 📜 **Official Verified Completion Certificates**
   - When a student finishes a course and passes the required quizzes, the system automatically creates a personalized certificate complete with an official QR/verification code for employers or schools.

4. 🔔 **Real-Time Updates & Live Notifications**
   - Students receive instant popup alerts whenever new video lectures, past papers, or announcement notices are posted.

5. 📄 **Built-in Document & Past Papers Viewer**
   - Students can view past exam papers, lecture slides, and solution handbooks directly in their browser without downloading external apps.

6. 💳 **Simple Local Payment & Enrollment**
   - Supports convenient payment methods (EasyPaisa, JazzCash, Direct Bank Transfer). Students simply upload a photo of their deposit receipt, and administrators verify it with one click.

7. 🏆 **Gamified Badges & Student Leaderboards**
   - Keeps learning fun with unlockable achievement badges, daily login streaks, and overall score points.

8. 🌗 **Beautiful Dark/Light Mode & Math Art Canvas**
   - Eye-friendly dark mode for late-night study sessions, accompanied by smooth animations and floating calculus symbols in the background.

9. 🛠️ **Complete Control Hub for Instructors**
   - Instructors can easily edit website text, add new courses, upload videos, publish past papers, manage student accounts, and view revenue analytics without knowing how to code.

---

## 🗺️ How the Platform Works (Plain English Architecture)

Calculus Corner is built like a modern 3-story digital building:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      1. THE FRONT DOOR (Frontend)                       │
│  What students see on their screen (Website, Buttons, Video Player)   │
│  Built with React 19, Vite, and Tailwind CSS                            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         Sends Requests & Orders
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    2. THE ENGINE ROOM (Backend Server)                 │
│  Processes logins, checks payment receipts, grades quizzes, sends email│
│  Built with Node.js, Express, Socket.IO, and Jimp Image Processor      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         Stores & Retrieves Data
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                      3. THE VAULT (Database)                            │
│  Securely holds student accounts, progress history, video links & notes│
│  Powered by MySQL Relational Database                                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack Explained Simply

- **React 19 & Vite**: Makes the website super fast, smooth, and instantly responsive when clicking between pages.
- **Tailwind CSS & Framer Motion**: Delivers modern visual styling, smooth transitions, and dark/light color themes.
- **Node.js & Express**: The reliable backend server engine that powers all site logic and user accounts.
- **MySQL Database**: The ultra-fast relational database storing student accounts, course syllabi, quiz answers, and grades.
- **Socket.IO**: The live websocket system enabling instant notification popups and real-time user presence.
- **Jimp**: The automated graphic generator that stamps student names and dates onto completion certificates.
- **Nodemailer**: Automatically sends welcome emails, password reset links, and enrollment approval notices to students.

---

## 🗄️ Database Structure (The Platform Vault)

The system database (`calculus_corner.sql`) contains organized tables storing all platform information:

- **`users`**: Account details (names, emails, passwords, student/admin role, ban status).
- **`courses`**: Course catalog information (titles, descriptions, pricing, thumbnail images).
- **`course_sections`**: Modules or chapters within a course.
- **`course_items`**: Individual lessons (video links, PDF notes, practice quizzes).
- **`user_item_progress`**: Tracks which videos/lessons each student has completed.
- **`quiz_attempts` & `quiz_attempt_answers`**: Stores student quiz scores, answers, and pass/fail statuses.
- **`enrollments`**: Connects students to courses and tracks payment receipt verification status.
- **`books`**: Digital textbooks and reference guides.
- **`resources`**: Downloadable past papers, formula sheets, and class worksheets.
- **`updates`**: Site news and release announcements.
- **`site_content`**: Stores editable website text, contact information, social links, FAQs, and logo settings.
- **`testimonials`**: Student reviews and feedback.
- **`user_badges`**: Gamification badges earned by students.
- **`unban_requests`**: Account appeal messages from suspended users.
- **`support_messages`**: Help desk messages sent from the contact form.



## ⚡ Full Platform Feature Catalogue

### For Students:
- 📺 **HD Video Classroom**: Interactive lesson player with speed control and auto-resume.
- ✏️ **Self-Testing Practice Lab**: Practice math problems with immediate answer verification.
- 📜 **Verified Completion Certificates**: Automated PDF/Image certificate generation with verification codes.
- 📚 **Past Paper Repository**: Searchable archive of past exam papers with full-screen viewer.
- 💳 **Easy Local Payment**: Hassle-free receipt upload for EasyPaisa, JazzCash, and bank transfers.
- 🔔 **Instant Live Alerts**: Popup notifications for new content uploads.
- 🏆 **Gamified Progress**: Earn XP points, unlock achievement badges, and maintain study streaks.
- 💬 **WhatsApp & Support Desk**: Direct messaging with platform teachers.

### For Teachers & Admins:
- ✅ **1-Click Receipt Verification**: Easily verify student payment screenshots and approve course access.
- 🎨 **Code-Free Website CMS**: Change homepage text, logos, colors, FAQs, and social links anytime.
- 📹 **Course & Video Builder**: Upload or link video lessons, organize chapters, and set pricing.
- ❓ **Interactive Quiz Generator**: Build custom auto-graded quizzes with detailed answer keys.
- 📈 **Student Analytics**: Track platform and student growth trends.
- 📣 **Live Broadcast Dispatcher**: Push announcements live to all logged-in students.

---


## ⚙️ Simple Setup & Installation Guide

### Step 1: Database Setup
1. Open your MySQL manager (e.g., MySQL Workbench or phpMyAdmin).
2. Create a database named `calculus_corner`.
3. Import the file `database/calculus_corner.sql`.

### Step 2: Backend Server Setup
1. Open terminal, navigate to `backend`: `cd backend`
2. Install packages: `npm install`
3. Configure your `.env` settings (Database credentials, JWT secret, Email SMTP details).
4. Run server: `npm run dev` (Runs on `http://localhost:5000`).

### Step 3: Frontend Website Setup
1. Open a new terminal, navigate to `frontend`: `cd frontend`
2. Install packages: `npm install`
3. Configure your `.env` settings (`VITE_API_URL=http://localhost:5000/api`).
4. Run website: `npm run dev` (Opens on `http://localhost:5173`).

---

## 🛡️ Safety, Security & Performance

- **Encrypted Passwords**: Passwords protected with high-level `bcryptjs` hashing.
- **Secure Token Sessions**: Account logins protected by JSON Web Tokens (`jwt`).
- **SQL Injection Defense**: Prepared database statements protecting student records.
- **File Upload Safeguards**: MIME-type checking on receipts and documents.
- **Fast Media Caching**: Optimized caching for smooth video playback and rapid page loads.

---

## 📜 License & Credits

- **Founder & Head Instructor**: Muhammad Mehtab
- **Platform Identity**: Calculus Corner — Mastering Mathematics Through Technology
- **License**: ISC License

---

<p align="center">
  <b>Calculus Corner</b> — Built with ❤️ by <a href="https://www.sixalps.com" target="_blank" rel="noopener noreferrer">SixAlps Agency</a> for Students and Mathematics Enthusiasts Worldwide.
</p>
