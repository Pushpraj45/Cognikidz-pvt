# Scripts Directory - Quick Reference

## Test Access Management

### Bulk Grant Access
```bash
npm run grant-test-access
```
Grants admin privileges and full assessment access to all configured test users.

### Individual User Access
```bash
npm run add-test-user <email>
```
Grants admin privileges and full assessment access to a single user.

**Example:**
```bash
npm run add-test-user new-tester@example.com
```

## Available Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `grant-test-access.js` | `npm run grant-test-access` | Bulk access for all test users |
| `add-test-user.js` | `npm run add-test-user <email>` | Individual user access |
| `test-aws-s3.js` | `npm run test-s3` | Test AWS S3 functionality |
| `test-image-assessment-flow.js` | `npm run test-image-assessment` | Test image assessment flow |
| `test-pdf-service.js` | `npm run test-pdf-service` | Test PDF service |
| `upload-assessment-images.js` | `npm run upload-assessment-images` | Upload assessment images |
| `seed-articles.js` | `npm run seed:articles` | Seed article data |

## Quick Commands

```bash
# Grant access to all test users
npm run grant-test-access

# Grant access to specific user
npm run add-test-user user@example.com

# Test AWS S3
npm run test-s3

# Seed articles
npm run seed:articles
```

## Notes

- All scripts require proper `.env` configuration
- Test access scripts require users to be registered first
- See `../README-TEST-ACCESS.md` for detailed documentation
