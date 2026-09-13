const { connectDB, disconnectDB } = require('../src/config/db');
const mongoose = require('mongoose');

(async () => {
  try {
    await connectDB();
    const db = mongoose.connection.db;
    
    console.log('=== USERS INSPECTION ===');
    const users = await db.collection('users').find({}).toArray();
    console.log(`Total users: ${users.length}`);
    users.forEach(u => {
      console.log(`- ID: ${u._id}, Email: ${u.email}, Name: ${u.name}, Role: ${u.role}, Keys: ${Object.keys(u).join(', ')}`);
    });

    console.log('\n=== RESEARCHES INSPECTION ===');
    const researches = await db.collection('researches').find({}).project({ title: 1, userId: 1, currentStep: 1, status: 1 }).toArray();
    console.log(`Total researches: ${researches.length}`);
    const userIdsInResearches = [...new Set(researches.map(r => String(r.userId)))];
    console.log(`Unique userIds in researches: ${userIdsInResearches.length}`);
    userIdsInResearches.forEach(uid => {
      const count = researches.filter(r => String(r.userId) === uid).length;
      const user = users.find(u => String(u._id) === uid);
      console.log(`- User ID ${uid} (${user ? user.email : 'ORPHAN/UNKNOWN'}): ${count} researches`);
    });

    console.log('\n=== ACTIVITY LOGS INSPECTION ===');
    const activityCount = await db.collection('activitylogs').countDocuments();
    console.log(`Total activity logs: ${activityCount}`);

    console.log('\n=== INDEXES ON USERS ===');
    const userIndexes = await db.collection('users').indexes();
    console.log('User indexes:', JSON.stringify(userIndexes, null, 2));

    console.log('\n=== INDEXES ON RESEARCHES ===');
    const researchIndexes = await db.collection('researches').indexes();
    console.log('Research indexes:', JSON.stringify(researchIndexes, null, 2));

  } catch (err) {
    console.error('Error during inspection:', err);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
})();
