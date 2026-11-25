// Użycie: node narzedzia/hash-hasla.mjs "twoje-hasło-min-10-znaków"
// Wypisuje wartości zmiennych: ADMIN_PASSWORD_HASH (PBKDF2-SHA256, sól, 100 000 iteracji) i SESSION_SECRET (losowy).
import { hashuj, b64 } from '../lib/serwer.js';
const pw = process.argv[2];
if (!pw || pw.length < 8) { console.error('Podaj hasło (min. 8 znaków): node narzedzia/hash-hasla.mjs "hasło"'); process.exit(1); }
console.log('ADMIN_PASSWORD_HASH=' + (await hashuj(pw)));
console.log('SESSION_SECRET=' + b64(crypto.getRandomValues(new Uint8Array(32))).replace(/[+/=]/g, 'x'));
