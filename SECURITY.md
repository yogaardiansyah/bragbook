# 🔒 Security Policy

BragBook is engineered with an **offline-first, zero-server architecture** specifically designed to preserve privacy and confidentiality for developers and professionals working under Non-Disclosure Agreements (NDAs).

---

## 🛡️ Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## 🔐 Core Security Commitments

1. **Client-Side Isolation:** BragBook has no backend server or database. All work logs, notes, and task details remain strictly inside your browser's local sandbox (`localStorage`).
2. **API Key Safety:** When using Cloud BYOK (e.g., Google Gemini), API keys are stored solely in local client storage and are transmitted directly via HTTPS to the official provider endpoint. Keys are never transmitted to any third-party telemetry, proxy, or logging service.
3. **Local LLM Isolation:** When using Local LLM mode (Ollama / LM Studio), network communication is restricted entirely to your local network (`localhost` / `127.0.0.1`).
4. **No Remote Analytics:** BragBook does not embed tracking cookies, Google Analytics, telemetry scripts, or CDN beacons.

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability or potential data leakage risk in BragBook, please do **NOT** open a public issue.

Instead, report it responsibly:
1. Use GitHub's private vulnerability reporting feature on this repository.
2. Or contact the maintainers directly via private email.

Please include:
* Description of the vulnerability.
* Steps to reproduce or proof-of-concept code.
* Potential impact on user data or privacy.

We commit to acknowledging your report within 48 hours and deploying fixes promptly.
