// função retirada de https://stackoverflow.com/questions/8532406/create-a-random-token-in-javascript-based-on-user-details
function generateToken(n) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < n; i += 1) {
      token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

// console.log(generateToken(16));

module.exports = generateToken;
