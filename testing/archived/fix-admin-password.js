const bcrypt = require('bcryptjs');

async function generatePassword() {
    try {
        const password = 'password';
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Original password:', password);
        console.log('Hashed password:', hashedPassword);
        
        // Test the hash
        const isMatch = await bcrypt.compare(password, hashedPassword);
        console.log('Password match:', isMatch);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

generatePassword();

