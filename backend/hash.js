const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('emp123', 10);
console.log('Yahan se copy kar:', hash);