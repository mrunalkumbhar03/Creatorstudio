
const createWhatsAppLink = (phoneNumber, message) => {
  if (!phoneNumber) return null;

  const cleanNumber = String(phoneNumber).replace(/\D/g, "");
  if (!cleanNumber) return null;

  const encodedMessage = encodeURIComponent(message);

  return `whatsapp://send?phone=${cleanNumber}&text=${encodedMessage}`;
};

module.exports = { createWhatsAppLink };
