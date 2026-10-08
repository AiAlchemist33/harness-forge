---
name: security
description: Security best practices for all code
recommended-for: [all]
---

# Security Rules

## Secrets
- Never hardcode API keys, passwords, tokens, or connection strings
- Use environment variables or secret managers
- Never commit .env files, key files (.pem, .key), or credentials
- If a secret is accidentally committed, rotate it immediately — git history is permanent

## Input Validation
- Validate all external input at system boundaries (API endpoints, CLI args, file uploads)
- Sanitize data before using in SQL queries, HTML output, shell commands, or file paths
- Use parameterized queries — never concatenate user input into SQL
- Escape HTML output to prevent XSS

## Authentication & Authorization
- Check permissions on every protected endpoint, not just the frontend
- Don't expose internal IDs or error details to unauthenticated users
- Use constant-time comparison for tokens and passwords
- Session tokens should be unpredictable, rotated, and expired

## Dependencies
- Keep dependencies updated — known vulnerabilities are low-hanging fruit for attackers
- Audit new dependencies before adding them
- Prefer well-maintained packages with active security practices

## General
- Log security events (failed logins, permission denials) but never log secrets
- Use HTTPS for all external communication
- Follow the principle of least privilege — grant minimum required access
