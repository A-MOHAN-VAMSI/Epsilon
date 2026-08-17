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
