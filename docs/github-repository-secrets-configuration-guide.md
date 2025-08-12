# GitHub Repository Secrets Configuration Guide

**Project:** CritGenius: Listener  
**Repository:** https://github.com/jonahkeegan/critgenius-listener  
**Created:** 2025-01-08  
**Version:** 1.0.0

## Overview

This guide provides step-by-step instructions for configuring GitHub repository secrets required for
the CritGenius Listener project's secure operation across development, staging, and production
environments.

## Required Repository Secrets

### Core Application Secrets

#### ASSEMBLYAI_API_KEY

- **Purpose:** Real-time speech-to-text transcription service
- **Format:** String (API key format: `api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
- **Security Level:** HIGH - Critical for core functionality
- **Usage:** AssemblyAI SDK authentication for audio processing
- **Rotation:** Every 90 days or on security incident

#### DATABASE_URL

- **Purpose:** MongoDB connection string for primary data storage
- **Format:** `mongodb://[username:password@]host[:port]/database[?options]`
- **Security Level:** CRITICAL - Contains database credentials
- **Usage:** Mongoose/MongoDB driver connection
- **Example:**
  `mongodb+srv://username:password@cluster.mongodb.net/critgenius_listener?retryWrites=true&w=majority`

#### REDIS_URL

- **Purpose:** Redis connection string for session storage and real-time caching
- **Format:** `redis://[username:password@]host[:port]/database`
- **Security Level:** HIGH - Contains cache credentials
- **Usage:** Redis client connection for session management
- **Example:** `redis://username:password@hostname:6379/0`

### Authentication & Security Secrets

#### JWT_SECRET

- **Purpose:** JSON Web Token signing and verification
- **Format:** Base64 encoded string (minimum 256 bits)
- **Security Level:** CRITICAL - User authentication security
- **Usage:** JWT token generation and validation
- **Generation:** `openssl rand -base64 32`
- **Rotation:** Every 30 days

#### JWT_REFRESH_SECRET

- **Purpose:** JWT refresh token signing (separate from access tokens)
- **Format:** Base64 encoded string (minimum 256 bits)
- **Security Level:** CRITICAL - Token refresh security
- **Usage:** Refresh token generation and validation
- **Generation:** `openssl rand -base64 32`

#### ENCRYPTION_KEY

- **Purpose:** Application-level data encryption (sensitive user data)
- **Format:** Base64 encoded string (256-bit AES key)
- **Security Level:** CRITICAL - Data privacy protection
- **Usage:** Encrypt/decrypt sensitive data before database storage
- **Generation:** `openssl rand -base64 32`

### Environment Configuration

#### NODE_ENV

- **Purpose:** Node.js environment configuration
- **Values:** `development`, `staging`, `production`
- **Security Level:** LOW - Configuration only
- **Usage:** Environment-specific behavior and optimizations

#### LOG_LEVEL

- **Purpose:** Application logging verbosity control
- **Values:** `error`, `warn`, `info`, `debug`
- **Security Level:** LOW - Logging configuration
- **Default:** `info` (production), `debug` (development)

### Optional Service Secrets

#### SENTRY_DSN

- **Purpose:** Error tracking and performance monitoring
- **Format:** Sentry DSN URL
- **Security Level:** MEDIUM - Error reporting
- **Usage:** Sentry SDK configuration for error tracking
- **Example:** `https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o000000.ingest.sentry.io/0000000`

#### NEWRELIC_LICENSE_KEY

- **Purpose:** Application performance monitoring
- **Format:** New Relic license key
- **Security Level:** MEDIUM - Performance monitoring
- **Usage:** New Relic agent configuration

## Manual Configuration Steps

### Step 1: Access Repository Settings

1. Navigate to https://github.com/jonahkeegan/critgenius-listener
2. Click on **Settings** tab (requires admin/write access)
3. In left sidebar, click **Secrets and variables**
4. Select **Actions** from the dropdown

### Step 2: Add Repository Secrets

For each secret in the list above:

1. Click **New repository secret** button
2. Enter the **Name** (exact case-sensitive match required):
   - `ASSEMBLYAI_API_KEY`
   - `DATABASE_URL`
   - `REDIS_URL`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `ENCRYPTION_KEY`
   - `NODE_ENV`
   - `LOG_LEVEL`
   - `SENTRY_DSN` (optional)
   - `NEWRELIC_LICENSE_KEY` (optional)

3. Enter the **Secret value** (copy-paste recommended to avoid typos)
4. Click **Add secret**
5. Verify the secret appears in the secrets list

### Step 3: Environment-Specific Secrets

If using GitHub Environments for deployment:

1. Go to **Settings** → **Environments**
2. Create environments: `development`, `staging`, `production`
3. For each environment, add environment-specific versions of secrets
4. Configure different `NODE_ENV` values per environment

## Security Best Practices

### Secret Generation Guidelines

```bash
# Generate JWT secrets
openssl rand -base64 32

# Generate encryption keys
openssl rand -base64 32

# Generate random passwords
openssl rand -base64 16
```

### Access Control

- **Repository Access:** Limit to core development team only
- **Secret Visibility:** Secrets are write-only (cannot be viewed after creation)
- **Audit Logging:** Monitor secret access via GitHub audit logs
- **Branch Protection:** Ensure secrets only accessible from protected branches

### Rotation Schedule

| Secret Type          | Rotation Frequency | Trigger Events                            |
| -------------------- | ------------------ | ----------------------------------------- |
| JWT_SECRET           | 30 days            | Security incident, team changes           |
| ENCRYPTION_KEY       | 90 days            | Security incident, compliance audit       |
| ASSEMBLYAI_API_KEY   | 90 days            | Security incident, service update         |
| Database credentials | 180 days           | Security incident, infrastructure changes |

### Development vs Production

- **Development:** Use separate, non-production API keys and databases
- **Staging:** Mirror production configuration with staging services
- **Production:** Live credentials with monitoring and alerting

## Validation Checklist

### ✅ Pre-Configuration Validation

- [ ] All required services (MongoDB, Redis, AssemblyAI) are provisioned
- [ ] Development/staging/production databases are separate
- [ ] API keys are active and have appropriate permissions
- [ ] Team members with secret access are identified

### ✅ Post-Configuration Validation

- [ ] All required secrets are added to repository
- [ ] Secret names match exactly (case-sensitive)
- [ ] No secrets contain leading/trailing whitespace
- [ ] Environment-specific secrets are properly configured
- [ ] CI/CD pipelines can access required secrets
- [ ] Local development `.env.example` file is updated

### ✅ Security Validation

- [ ] No secrets are committed to repository code
- [ ] `.env` files are in `.gitignore`
- [ ] Secret rotation schedule is documented
- [ ] Access control is properly configured
- [ ] Audit logging is enabled

## CI/CD Pipeline Integration

### GitHub Actions Access

Secrets are automatically available to GitHub Actions workflows:

```yaml
env:
  ASSEMBLYAI_API_KEY: ${{ secrets.ASSEMBLYAI_API_KEY }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

### Environment Variables in Application

```javascript
// config/environment.ts
const config = {
  assemblyAI: {
    apiKey: process.env.ASSEMBLYAI_API_KEY,
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  },
};
```

## Troubleshooting

### Common Issues

#### Secret Not Available in Workflow

- **Cause:** Secret name mismatch or typo
- **Solution:** Verify exact name match in repository settings

#### Invalid API Key Error

- **Cause:** Expired or incorrect API key format
- **Solution:** Regenerate key from service provider, update secret

#### Database Connection Failed

- **Cause:** Incorrect connection string format
- **Solution:** Verify MongoDB Atlas connection string format and credentials

#### JWT Token Issues

- **Cause:** Insufficient secret length or invalid encoding
- **Solution:** Regenerate with `openssl rand -base64 32`

### Debugging Steps

1. Verify secret exists in repository settings
2. Check secret name exact match (case-sensitive)
3. Validate secret format and length requirements
4. Test with minimal reproduction case
5. Check GitHub Actions logs for specific error messages

## Compliance and Governance

### Data Privacy

- Secrets containing personal data must comply with GDPR/CCPA
- Encryption keys must meet industry standards (AES-256)
- Database connections must use encrypted connections (TLS)

### Audit Requirements

- Document all secret changes with timestamps
- Maintain rotation logs for compliance audits
- Monitor access patterns via GitHub audit logs

### Incident Response

1. **Suspected Compromise:** Immediately rotate affected secrets
2. **Team Member Departure:** Review and rotate shared secrets
3. **Service Breach:** Coordinate with service provider, rotate keys
4. **Regular Review:** Quarterly security review of all secrets

## Contact and Support

- **Repository Owner:** jonahkeegan
- **Security Issues:** Create private security advisory
- **Access Requests:** Contact repository administrators

---

**Last Updated:** 2025-01-08  
**Next Review:** 2025-02-08  
**Version:** 1.0.0
