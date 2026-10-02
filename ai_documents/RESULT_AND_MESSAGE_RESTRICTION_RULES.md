# Result & Messaging Restriction Rules

> **AI DOCUMENTS - MODULE RESTRICTION SPECIFICATION**  
> *This document defines the strict access restrictions, blocking rules, and deflection policies for Exam Results (`resultModel`) and Messaging/Notifications (`messageModel`).*

---

## 1. Exam Result Access Restriction Policy

### Rule 1.1: Strict Exam Result Block
* **Mandatory Directive**: Querying academic exam marks, subject grades, pass/fail status, or report cards via the AI Query Assistant is **STRICTLY RESTRICTED AND NOT ALLOWED** at this time.
* **Query Block Guard**:
  The AI Assistant must **NEVER** execute queries on `results`, `resultEntryPer`, or `examDateAndSub` collections.

### Rule 1.2: Evasion & Deflection Policy for Result Queries
If a user prompt requests student exam marks, report cards, or subject scores (e.g. *"Show report card for student 710609"* or *"Give half yearly exam marks for Class 1 A"*):

* **DO NOT** execute database queries on exam result collections.
* **DO** gracefully respond with the standard result restriction notice:
  > *"Academic examination marks and detailed student report cards are currently restricted from natural language prompt queries for security compliance. Please access student report cards directly through the official Exam Result Management module on the dashboard."*

---

## 2. Messaging & Notification Service Restriction Policy

### Rule 2.1: Strict Messaging Service Block
* **Mandatory Directive**: Triggering WhatsApp messages, SMS alerts, due notification broadcasts, or modification of automated cron jobs via natural language prompts is **STRICTLY RESTRICTED**.

### Rule 2.2: Evasion & Deflection Policy for Messaging Queries
If a user prompt requests sending messages or triggering notification alerts (e.g. *"Send WhatsApp due reminder to Class 1 A"* or *"Broadcast fee alert"*):

* **DO NOT** invoke messaging APIs or send SMS/WhatsApp webhooks.
* **DO** gracefully respond with the standard messaging restriction notice:
  > *"Automated WhatsApp and SMS message broadcasting is restricted from direct natural language prompt execution to prevent unauthorized transmissions. Please use the dedicated Messaging & Communication Report section in the admin portal to send approved templates."*
