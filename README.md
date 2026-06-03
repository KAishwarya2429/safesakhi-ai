<<<<<<< HEAD
Welcome to Your Miaoda Project
Project Info
Project Directory
├── README.md # Documentation
├── components.json # Component library configuration
├── index.html # Entry file
├── package.json # Package management
├── postcss.config.js # PostCSS configuration
├── public # Static resources directory
│ ├── favicon.png # Icon
│ └── images # Image resources
├── src # Source code directory
│ ├── App.tsx # Entry file
│ ├── components # Components directory
│ ├── context # Context directory
│ ├── db # Database configuration directory
│ ├── hooks # Common hooks directory
│ ├── index.css # Global styles
│ ├── layout # Layout directory
│ ├── lib # Utility library directory
│ ├── main.tsx # Entry file
│ ├── routes.tsx # Routing configuration
│ ├── pages # Pages directory
│ ├── services # Database interaction directory
│ ├── types # Type definitions directory
├── tsconfig.app.json # TypeScript frontend configuration file
├── tsconfig.json # TypeScript configuration file
├── tsconfig.node.json # TypeScript Node.js configuration file
└── vite.config.ts # Vite configuration file
Tech Stack
Vite, TypeScript, React, Supabase

Development Guidelines
How to edit code locally?
You can choose VSCode or any IDE you prefer. The only requirement is to have Node.js and npm installed.

Environment Requirements

# Node.js ≥ 20

# npm ≥ 10

Example:

# node -v # v20.18.3

# npm -v # 10.8.2

Installing Node.js on Windows

# Step 1: Visit the Node.js official website: https://nodejs.org/, click download. The website will automatically suggest a suitable version (32-bit or 64-bit) for your system.

# Step 2: Run the installer: Double-click the downloaded installer to run it.

# Step 3: Complete the installation: Follow the installation wizard to complete the process.

# Step 4: Verify installation: Open Command Prompt (cmd) or your IDE terminal, and type `node -v` and `npm -v` to check if Node.js and npm are installed correctly.

Installing Node.js on macOS

# Step 1: Using Homebrew (Recommended method): Open Terminal. Type the command `brew install node` and press Enter. If Homebrew is not installed, you need to install it first by running the following command in Terminal:

/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
Alternatively, use the official installer: Visit the Node.js official website. Download the macOS .pkg installer. Open the downloaded .pkg file and follow the prompts to complete the installation.

# Step 2: Verify installation: Open Command Prompt (cmd) or your IDE terminal, and type `node -v` and `npm -v` to check if Node.js and npm are installed correctly.

After installation, follow these steps:

# Step 1: Download the code package

# Step 2: Extract the code package

# Step 3: Open the code package with your IDE and navigate into the code directory

# Step 4: In the IDE terminal, run the command to install dependencies: npm i

# Step 5: In the IDE terminal, run the command to start the development server: npm run dev -- --host 127.0.0.1

# Step 6: if step 5 failed, try this command to start the development server: npx vite --host 127.0.0.1

How to develop backend services?
Configure environment variables and install relevant dependencies.If you need to use a database, please use the official version of Supabase.

Learn More
You can also check the help documentation: Download and Building the app（ https://intl.cloud.baidu.com/en/doc/MIAODA/s/download-and-building-the-app-en）to learn more detailed content.
=======
# 🛡️ SafeSakhi AI

### An AI Guardian That Acts When You Can't

> Autonomous Multi-Agent Women's Safety Intelligence Platform powered by Gemini, Google Cloud Agent Architecture, and Real-Time Risk Intelligence.

<p align="center">
  <strong>From Reactive Safety to Autonomous Protection</strong>
</p>

---

## 🌍 The Problem

Every day, millions of women travel alone, commute late at night, or navigate unfamiliar environments with limited access to intelligent safety support.

Current safety solutions depend on one critical assumption:

> The user must be able to ask for help.

But in many real-world emergencies, that assumption fails.

Traditional safety apps are reactive.

SafeSakhi AI is proactive.

---

## 🚀 Our Vision

Imagine every woman having a personal AI guardian that:

* Monitors her journey
* Assesses risk continuously
* Predicts unsafe situations
* Coordinates emergency actions
* Notifies trusted contacts
* Maintains evidence records
* Escalates incidents autonomously

SafeSakhi AI transforms safety from a panic-button experience into an intelligent protection system.

---

# 🧠 What is SafeSakhi AI?

SafeSakhi AI is an Autonomous Multi-Agent Safety Platform that deploys specialized AI agents working together to protect users during travel and emergency situations.

Instead of waiting for the user to react, the system actively monitors journeys, analyzes risks, and initiates safety workflows when necessary.

The platform is built around a simple idea:

> Safety should not depend on a user's ability to ask for help.

---

# 🤖 Multi-Agent Architecture

SafeSakhi AI consists of five specialized AI agents collaborating through an event-driven orchestration layer.

---

## 🟣 Risk Intelligence Agent

Mission:

Evaluate risk continuously using contextual signals.

Responsibilities:

* Threat assessment
* Risk prediction
* Environmental awareness
* Dynamic risk scoring

Inputs:

* Time of day
* Location context
* Route information
* Mission activity

Outputs:

* Risk score
* Threat level
* Escalation recommendations

---

## 🔵 Route Guardian Agent

Mission:

Protect users throughout their journey.

Responsibilities:

* Route monitoring
* Safe path calculation
* Journey tracking
* Route deviation detection

Outputs:

* Safer route recommendations
* Travel status updates
* Route anomaly alerts

---

## 🟢 Trusted Contact Agent

Mission:

Maintain human safety connections.

Responsibilities:

* Emergency contact management
* Alert preparation
* Notification orchestration
* Escalation communication

Outputs:

* Emergency notifications
* Live mission updates
* Contact escalation workflows

---

## 🟠 Evidence Agent

Mission:

Create a secure and verifiable evidence chain.

Responsibilities:

* Journey logging
* Event recording
* Location history
* Incident documentation

Outputs:

* Mission reports
* Evidence packages
* Incident summaries

---

## 🔴 Emergency Coordinator Agent

Mission:

Coordinate system-wide emergency response.

Responsibilities:

* Agent orchestration
* Escalation management
* Emergency protocol execution
* Mission supervision

Outputs:

* Emergency actions
* Escalation workflows
* Mission resolution tracking

---

# 🎯 Journey Protection Mode

The flagship feature of SafeSakhi AI.

Users create a Safety Mission:

```text
Start Location:
Shivajinagar

Destination:
Pune Airport

Travel Mode:
Cab

ETA:
45 Minutes
```

Once activated:

✓ Risk Intelligence Agent begins monitoring

✓ Route Guardian Agent tracks movement

✓ Trusted Contact Agent prepares alerts

✓ Evidence Agent starts secure logging

✓ Emergency Coordinator supervises the mission

The system continuously evaluates user safety until arrival is confirmed.

---

# ⚡ Autonomous Escalation Engine

SafeSakhi AI does not wait for a panic button.

Example:

```text
Mission Active
↓
User misses check-in
↓
Risk score increases
↓
Emergency Coordinator activates
↓
Trusted contacts notified
↓
Evidence package generated
↓
Mission escalated
```

This demonstrates true agentic behavior:

* Reasoning
* Planning
* Tool usage
* Action execution

---

# 📡 Core Capabilities

### Journey Protection

Continuous monitoring throughout travel.

### Risk Intelligence

Real-time risk prediction and scoring.

### Multi-Agent Collaboration

Five specialized agents working together.

### Autonomous Escalation

AI-driven emergency response workflows.

### Trusted Contact Network

Automated communication system.

### Evidence Generation

Tamper-resistant incident reporting.

### Command Center Dashboard

Real-time operational visibility.

---

# 🏗️ System Architecture

```text
User
 │
 ▼
SafeSakhi Frontend
 │
 ▼
Mission Orchestrator
 │
 ├── Risk Intelligence Agent
 ├── Route Guardian Agent
 ├── Trusted Contact Agent
 ├── Evidence Agent
 └── Emergency Coordinator
 │
 ▼
Tool Layer
 │
 ├── Location Service
 ├── Risk Assessment Engine
 ├── Notification Service
 ├── Route Service
 └── Evidence Storage
 │
 ▼
Supabase Backend
```

---

# 🛠️ Technology Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router

## Backend

* Supabase
* Supabase Auth
* Supabase Database
* Supabase Edge Functions

## AI Layer

* Gemini
* Agent-Based Orchestration
* Event-Driven Workflows
* Tool Calling Architecture

## Maps & Geolocation

* Google Maps API
* Browser Geolocation API

## Deployment

* Vercel
* Supabase Cloud

---

# 📊 Why SafeSakhi AI Matters

### Real-World Impact

Designed for:

* Students
* Working professionals
* Solo travelers
* Night commuters
* Emergency situations

### Social Impact

Women's safety remains one of the most significant challenges globally.

SafeSakhi AI introduces a future where intelligent systems actively protect people rather than simply reacting to emergencies.

---

# 🏆 Why This Project Stands Out

Most safety applications provide:

❌ Panic buttons

❌ Static alerts

❌ Basic location sharing

SafeSakhi AI provides:

✅ Autonomous monitoring

✅ Risk prediction

✅ Multi-agent collaboration

✅ Intelligent escalation

✅ Evidence generation

✅ Mission-based protection

---

# 🎬 Demo Flow

### Step 1

Create a Safety Mission

### Step 2

Activate Journey Protection Mode

### Step 3

Initialize all AI agents

### Step 4

Generate real-time risk score

### Step 5

Monitor journey progress

### Step 6

Simulate missed check-in

### Step 7

Trigger autonomous escalation

### Step 8

Generate incident evidence report

### Step 9

Complete or escalate mission

---

# 💻 Local Development

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

If needed:

```bash
npx vite --host 127.0.0.1
```

---

# 🔮 Future Roadmap

* Voice-Activated SOS
* Real-Time Journey Tracking
* Predictive Risk Intelligence
* AI-Powered Safety Recommendations
* Smart City Integration
* Emergency Service Integration
* Advanced Incident Analytics

---

# 👩‍💻 Author

**Aishwarya Kawade**

Building technology that creates real-world impact through AI, automation, and intelligent systems.

---

## ⭐ If you found this project interesting, consider giving it a star.

**SafeSakhi AI — Because Safety Shouldn't Depend on a Panic Button.**
>>>>>>> 25ffe6358fc7e19af4246027b52f597c9feefe5d
