const jwt = require('jsonwebtoken');

/**
 * Middleware per la verifica del JSON Web Token (JWT) nei cookie.
 */
const verifyToken = (req, res, next) => {
    // 1. Estrazione del token dal cookie sicuro 'access_token'
    const token = req.cookies.access_token;

    // 2. Controllo presenza: se il cookie manca, l'accesso è negato immediatamente
    if (!token) {
        return res.status(401).json({ error: "Accesso negato. Devi effettuare il login." });
    }

    try {
        // 3. Validazione: il server verifica l'integrità usando il JWT_SECRET 
        // Solo il server che possiede il secret può confermare che il token non è contraffatto.
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Iniezione dati: salviamo le info utente (id, email) nell'oggetto req
        // Questo permetterà alle rotte successive di sapere chi sta facendo la richiesta.
        req.user = verified;
        
        // 5. Autorizzazione concessa: procediamo verso la rotta successiva
        next();
    } catch (err) {
        // 6. Gestione errore: se il token è scaduto o manomesso, restituiamo un errore
        res.status(401).json({ error: "Token non valido o sessione scaduta." });
    }
};

module.exports = verifyToken;