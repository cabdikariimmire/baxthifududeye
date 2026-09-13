const { connectDB, disconnectDB } = require('../src/config/db');
const mongoose = require('mongoose');

const runCleanup = async () => {
  try {
    await connectDB();
    const db = mongoose.connection.db;

    console.log('=====================================================');
    console.log('  STARTING TARGETED TEST / CLERK DATA CLEANUP');
    console.log('=====================================================');

    // 1. Identify test users
    const testUserFilter = {
      $or: [
        { email: /@example\.com$/i },
        { email: /@test\.com$/i },
        { email: /@system\.test$/i },
        { email: /^test/i },
        { email: /^researcher_/i },
        { email: /^scholar_/i },
        { email: /^qa\./i },
        { email: /^apitest_/i },
        { email: 'admin@academic.edu' },
        { clerkId: { $exists: true } },
        { clerkUserId: { $exists: true } }
      ]
    };

    const targetUsers = await db.collection('users').find(testUserFilter).toArray();
    const targetUserIds = targetUsers.map(u => u._id);

    console.log(`Identified ${targetUsers.length} test / development user records for cleanup.`);

    // 2. Identify researches belonging to these test users + any orphaned researches
    const testResearchFilter = {
      $or: [
        { userId: { $in: targetUserIds } },
        { userId: { $nin: (await db.collection('users').find({}).project({ _id: 1 }).toArray()).map(u => u._id) } }
      ]
    };

    const targetResearches = await db.collection('researches').find(testResearchFilter).toArray();
    const targetResearchIds = targetResearches.map(r => r._id);

    console.log(`Identified ${targetResearches.length} test research records for cleanup.`);

    // 3. Identify activity logs belonging to target users
    const targetLogs = await db.collection('activitylogs').find({
      userId: { $in: targetUserIds }
    }).toArray();

    console.log(`Identified ${targetLogs.length} activity log records for cleanup.`);

    // 4. Perform targeted deletion
    let deletedResearchesCount = 0;
    if (targetResearchIds.length > 0) {
      const resResult = await db.collection('researches').deleteMany({
        _id: { $in: targetResearchIds }
      });
      deletedResearchesCount = resResult.deletedCount;
    }

    let deletedLogsCount = 0;
    if (targetLogs.length > 0) {
      const logResult = await db.collection('activitylogs').deleteMany({
        _id: { $in: targetLogs.map(l => l._id) }
      });
      deletedLogsCount = logResult.deletedCount;
    }

    let deletedUsersCount = 0;
    if (targetUserIds.length > 0) {
      const userResult = await db.collection('users').deleteMany({
        _id: { $in: targetUserIds }
      });
      deletedUsersCount = userResult.deletedCount;
    }

    // 5. Verify post-cleanup database state
    const remainingUsers = await db.collection('users').countDocuments();
    const remainingResearches = await db.collection('researches').countDocuments();
    const remainingLogs = await db.collection('activitylogs').countDocuments();
    const remainingBorders = await db.collection('borders').countDocuments();
    const remainingTemplates = await db.collection('templates').countDocuments();
    const remainingSettings = await db.collection('aisettings').countDocuments();

    console.log('\n=== CLEANUP REPORT ===');
    console.log(`✓ Deleted Users: ${deletedUsersCount}`);
    console.log(`✓ Deleted Researches: ${deletedResearchesCount}`);
    console.log(`✓ Deleted Activity Logs: ${deletedLogsCount}`);
    console.log('\n=== REMAINING APPLICATION DATA ===');
    console.log(`- Remaining Users: ${remainingUsers}`);
    console.log(`- Remaining Researches: ${remainingResearches}`);
    console.log(`- Remaining Activity Logs: ${remainingLogs}`);
    console.log(`- Borders (Preserved): ${remainingBorders}`);
    console.log(`- Templates (Preserved): ${remainingTemplates}`);
    console.log(`- AI Settings (Preserved): ${remainingSettings}`);
    console.log('=====================================================');

  } catch (err) {
    console.error('Cleanup error:', err);
  } finally {
    await disconnectDB();
  }
};

if (require.main === module) {
  runCleanup();
}

module.exports = runCleanup;
