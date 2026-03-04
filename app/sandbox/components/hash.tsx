import bcrypt from "bcrypt";
const password = '123'; // Replace with your test password

export default function HashPassword() {
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) throw err;
        console.log('Hashed password:', hash);
    });
    return
}