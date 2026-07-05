const { v4: uuidv4 } = require('uuid');

const generateUserId = () => {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `USR${num}`;
};

const generateComplaintId = () => {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `CMP${num}`;
};

const generateWorkerId = () => {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `WRK${num}`;
};

const generateAssetId = () => {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `AST${num}`;
};

const generateBookingId = () => {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `BKG${num}`;
};

module.exports = {
  generateUserId,
  generateComplaintId,
  generateWorkerId,
  generateAssetId,
  generateBookingId
};