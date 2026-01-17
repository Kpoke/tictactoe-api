# Cleanup Guide

After verifying that the TypeScript/PostgreSQL migration is working correctly, you can safely remove the old JavaScript files.

## Files to Remove

Once you've confirmed everything works:

```bash
# Remove old JavaScript files
rm api/controller.js
rm api/routes.js
rm model/passwordPlugin.js
rm model/user.js
rm routes/index.js
rm services/getLeaders.js
rm services/login.js
rm services/signup.js
rm services/socketAddPoints.js
rm utilities/checkUser.js
rm utilities/timer.js
rm utilities/utils.js
rm server.js
```

## Verification Checklist

Before removing old files, verify:

- [ ] Database migrations run successfully
- [ ] Server starts without errors
- [ ] User signup works
- [ ] User login works
- [ ] Leaderboard endpoint works
- [ ] Socket.io connections work
- [ ] Game matchmaking works
- [ ] Timer functionality works
- [ ] Points update after winning

## Database Migration

If you have existing MongoDB data, you'll need to migrate it to PostgreSQL:

1. Export data from MongoDB
2. Transform data format (ObjectId → UUID, etc.)
3. Import into PostgreSQL using Knex or SQL scripts
