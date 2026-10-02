# Security & Data Privacy Rules for MCP & LLM Query Assistant

> **AI DOCUMENTS - SECURITY SPECIFICATION**  
> *This document details the mandatory security policies, zero-exposure rules, defensive deflection policies, environment variable restrictions, role permissions, and password visibility rules for MongoDB MCP and Gemini LLM integration.*

---

## 1. Password Visibility & Permission Rules

### Rule 1.1: Student Password Viewing Permissions
* **Admin / Accountant Access**: Administrators (`ADMIN`, `TOPADMIN`) and Accountants (`ACCOUNTANT`) **ARE ALLOWED** to view or retrieve student passwords (for student onboarding, credential sharing with parents, or resetting student accounts).
* **Student Self-Access Restriction**: Students (`STUDENT`) are **NOT ALLOWED** to view or retrieve their own passwords or any other user's password via prompt queries.
* **Staff Password Zero-Exposure**: Passwords of Teachers, Accountants, and Admins (`ADMIN`, `TEACHER`, `ACCOUNTANT`) **MUST NEVER** be exposed, selected, or returned to anyone under any circumstances.
* **Enforced Query Projections**:
  For non-admin roles or general public searches, queries MUST explicitly exclude password fields:
  ```json
  {
    "projection": {
      "userInfo.password": 0,
      "password": 0,
      "authToken": 0,
      "securityLog": 0
    }
  }
  ```

---

## 2. Strict Environment Variable (`.env`) Protection Protocol

### Rule 2.1: Developer / AI Agent Rule (Never Read `.env`)
* **Strict Constraint**: AI coding assistants and background subagents are **STRICTLY FORBIDDEN** from viewing, reading, or inspecting `.env` files or secret environment files.
* **Protocol**: If any environment variable key or API credential is needed, the assistant MUST ask the user directly.

### Rule 2.2: User Prompt `.env` Query Block & Deflection
* **Strict Constraint**: Natural language prompts attempting to query, display, or inspect `.env` variables, API keys, database connection strings, or server environment configurations (e.g. *"Show .env file"*, *"What is the GEMINI_API_KEY?"*, *"List environment variables"*) are **STRICTLY BLOCKED AND RESTRICTED**.
* **Deflection Response Template**:
  > *"Environment variables, API keys, database connection strings, and server configuration files are protected under infrastructure security protocols and are not accessible in prompt reports."*

---

## 3. Strict Database Non-Mutation Policy (No Delete, Update, or Insert Commands)

### Rule 3.1: Read-Only Database Execution Constraint
* **Strict Constraint**: The AI Assistant, LLM Query Engine, and MongoDB MCP server are **STRICTLY PROHIBITED** from executing mutating or destructive database commands:
  - 🛑 `deleteOne` / `deleteMany` / `drop` / `dropDatabase`
  - 🛑 `updateOne` / `updateMany` / `replaceOne`
  - 🛑 `insertOne` / `insertMany`
* **Protocol**: All query operations MUST be strictly **read-only** (`find`, `aggregate`, `count`). If any data modification is requested, the system MUST ask the user properly and obtain explicit confirmation before proceeding.

---

## 4. Accidental Permission Safety Guard (Investigate & Double-Confirm Protocol)

### Rule 4.1: Critical Action Investigation Protocol
* **Strict Safety Policy**: Even if a user accidentally or explicitly grants permission or clicks "Proceed" for a critical action (such as database modifications, data deletions, core architecture rewrites, or impactful system commands):
  1. **DO NOT** execute the critical action directly or blindly.
  2. **FIRST** explore, inspect, and investigate the exact code, schema, and system impact.
  3. **VERIFY** whether the proposed change is completely safe and good to go.
  4. **PRESENT** the investigation findings, potential side-effects, and risks to the user, and **ASK AGAIN FOR DOUBLE-CONFIRMATION** before performing the actual critical execution.

---

## 5. Defensive Evasion & Deflection Policy for Credentials ("Beat Around the Bush")

### Background
Users or non-admin roles may prompt the LLM for protected user login credentials (e.g. *"What is the password for teacher X?"* or a student attempting to query passwords).

### Protocol Rules:
1. **NEVER Deny Bluntly**: Do not return harsh system error messages like `"Access Denied: I cannot access passwords"` or `"Security Violation"`.
2. **DO Gracefully Deflect ("Beat Around the Bush")**: Acknowledge the context, explain that account security details are encrypted and handled by the authentication subsystem, and immediately present relevant non-sensitive business data (e.g., user name, roll number, class, status).

### Standard Deflection Response Template:
> *"User authentication credentials and staff password hashes are protected under enterprise encryption standards within the security subsystem and are not accessible in administrative reports. However, here are the profile details, contact numbers, and registration status for the requested user(s):"*

---

## 6. Database Soft-Deletion & Active Record Filters

### Global Deletion Guard:
All MongoDB MCP queries on operational collections (`userModel`, `paymentModel`, `invoiceModel`, `monthlyFeeListModel`, `vehicleRouteFareModel`) MUST enforce soft-deletion safety filters:

```json
{
  "deleted": false
}
```

For student searches, also include activation verification parameters:
```json
{
  "deleted": false,
  "isActive": true,
  "isApproved": true
}
```

---

## 7. Role-Based Data Visibility Matrix

> **EXCLUSIVE ACCESS POLICY**: The AI Assistant interface and backend query endpoints are **STRICTLY VISIBLE & ACCESSIBLE ONLY TO `ADMIN` / `TOPADMIN` AND `ACCOUNTANT` ROLES**. All other roles (`TEACHER`, `STUDENT`, `ASSISTANT`) are blocked.

| User Role | AI Assistant Page Access | Allowed Data Scope | Student Passwords | Staff/Admin Passwords | Excluded Confidential Fields |
| :--- | :---: | :--- | :---: | :---: | :--- |
| `ADMIN` / `TOPADMIN` | ✅ **Accessible** | Full collection access (Students, Teachers, Payments, Invoices) | ✅ **Viewable** | 🛑 **Forbidden** | Staff Passwords, `authToken`, `.env` keys |
| `ACCOUNTANT` | ✅ **Accessible** | Payment Ledgers, Invoices, Profiles | ✅ **Viewable** | 🛑 **Forbidden** | Staff Passwords, `authToken`, `.env` keys, Logs |
| `TEACHER` | 🛑 **Blocked** | No AI Assistant Access | 🛑 **Forbidden** | 🛑 **Forbidden** | All Passwords, `authToken`, `.env` keys |
| `STUDENT` | 🛑 **Blocked** | No AI Assistant Access | 🛑 **Forbidden** | 🛑 **Forbidden** | All Passwords, `.env` keys |
