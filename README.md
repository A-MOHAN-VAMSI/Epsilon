# EPSILON

### Real-Time Collaborative Development Environment

EPSILON is a browser-based collaborative development environment designed to let developers work together on code in real time.

The project combines collaborative code editing, workspace management, authentication, code execution, and AI-assisted development features into one platform.

---

## ✨ Key Features

- **Real-time collaborative coding** — multiple users can work on shared code.
- **Collaborative workspaces** — create and manage development workspaces.
- **Monaco Editor** — VS Code-style browser-based code editing.
- **Real-time synchronization** — collaborative document synchronization using Yjs/CRDT-based technology.
- **Authentication & access control** — authenticated users and workspace-aware permissions.
- **Code execution** — run supported code directly from the development environment.
- **AI assistance** — AI-powered support for development tasks.
- **File management** — create, edit and organize project files.
- **Responsive interface** — designed for modern browser environments.
- **Production deployment** — the application is deployed for online access.

---

## 🎯 Problem Statement

Developers working in teams often switch between multiple tools for coding, communication, file sharing, collaboration and execution.

This can create unnecessary setup and coordination overhead.

EPSILON aims to bring the core collaborative development workflow into a single browser-based environment where team members can work on the same project together.

---

## 💡 Project Goal

The goal of EPSILON is simple:

> **Make collaborative software development feel like working together in the same development environment.**

Instead of repeatedly sharing files or waiting for teammates to merge changes, collaborators can work on shared code in real time.

---

## 🛠️ Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Custom CSS animations

### Code Editor

- Monaco Editor
- Y-Monaco

### Real-Time Collaboration

- Yjs
- CRDT-based synchronization
- WebSocket / Y-WebSocket collaboration layer

### Backend & Data

- Next.js application services / APIs
- Supabase
- PostgreSQL

### Authentication

- Supabase Authentication
- Workspace access control
- Row Level Security (RLS)

### AI

- Gemini API / AI integration

### Deployment & Version Control

- Git
- GitHub
- Render

---
## 👥 Team & Contributions

EPSILON is a collaborative team project led by **A. Mohan Vamsi**, with each team member contributing to a different area of the project.

### 👨‍💻 A. Mohan Vamsi
**Team Lead · Lead Developer**

- Led the overall project development and coordination.
- Worked on the system architecture and core application development.
- Implemented the real-time collaboration functionality.
- Worked on AI-assisted development features.
- Integrated the major frontend, backend and database components.
- Handled deployment and overall project integration.

### 👩‍💻 Sunaina Dhali
**UI/UX & Frontend Contributor**

- Contributed to the user interface and overall visual experience.
- Worked on frontend components and layouts.
- Focused on responsive design and usability.
- Contributed to improving the overall look and feel of EPSILON.

### 👩‍💻 Palak Mundane
**Research & Database Contributor**

- Contributed to technical research for the project.
- Worked on database-related tasks and data handling.
- Assisted with queries and application data requirements.
- Contributed to project documentation and presentation preparation.

### 👨‍💻 Omkar Sharma
**Testing & Quality Contributor**

- Tested different features of the application.
- Identified and reported bugs and inconsistencies.
- Performed usability and functional testing.
- Helped validate the application before demonstrations and releases.

### 👨‍💻 Aman Sareen
**Product & Collaboration Contributor**

- Contributed to feature planning and project discussions.
- Worked on collaboration-related workflows and ideas.
- Provided feedback on the user experience and functionality.
- Assisted in refining features based on project requirements.

---

### 🤝 Team Collaboration

The project was developed through collaboration between all five members, with responsibilities divided across **development, frontend/UI, research, testing and product planning**.

> **One team. One workspace. One shared vision.**



## 🏗️ High-Level Architecture

```text
                    ┌─────────────────────┐
                    │       Browser       │
                    │                     │
                    │  Next.js + React    │
                    │  Monaco Editor      │
                    └──────────┬──────────┘
                               │
                     Real-Time / API Layer
                               │
              ┌────────────────┴────────────────┐
              │                                 │
       Collaboration                       Application
       Yjs / CRDT                         Services / APIs
              │                                 │
              └────────────────┬────────────────┘
                               │
                       Supabase / PostgreSQL
                               │
                 Authentication + Persistence



