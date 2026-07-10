require('dotenv').config({ path: 'backend/.env' });
const emailService = require('C:/Users/samiu/OneDrive/Desktop/CalculusCorner/backend/src/services/emailService.js');

const run = async () => {
  const mockAnnouncement = {
    id: 9999,
    title: 'Test Inline Logo Notice',
    text: 'Calculus Championship starts soon!',
    active: 1,
    created_at: new Date()
  };
  
  await emailService.sendAnnouncementEmailToSubscribers(mockAnnouncement);
  process.exit(0);
};

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
