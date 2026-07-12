const multer = require('multer');
const sharp  = require('sharp');
const fs     = require('fs/promises');
const path   = require('path');
const crypto = require('crypto');

// Le immagini delle flashcard vengono normalizzate in JPEG uniforme (vedi
// saveImage): una sola estensione ovunque semplifica il cleanup, che sa sempre
// che il file su disco è .jpg indipendentemente da cosa ha caricato l'utente.
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'flashcards');

// La cartella viene creata al bootstrap: così un clone fresco del repo non ha
// bisogno di step manuali per far partire gli upload.
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(err => {
  console.error('Impossibile creare uploads/flashcards:', err);
});

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Dimensione massima per ogni immagine caricata. Modifica solo questo valore.
const MAX_IMAGE_MB = 5;

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: MAX_IMAGE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIMES.has(file.mimetype)) {
      return cb(new Error('INVALID_IMAGE_TYPE'));
    }
    cb(null, true);
  },
});

// I due campi opzionali che il frontend invia nel multipart. maxCount:1
// garantisce che un attaccante non possa duplicare il campo per aggirare i
// limiti di dimensione.
const flashcardImagesUpload = memoryUpload.fields([
  { name: 'questionImage', maxCount: 1 },
  { name: 'answerImage',   maxCount: 1 },
]);

// Error handler dedicato: multer chiama next(err) quando il file è troppo
// grande o del tipo sbagliato. Va montato SUBITO DOPO flashcardImagesUpload
// nella catena della rotta, altrimenti Express salta agli altri handler.
function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'FLASHCARD_IMAGE_TOO_LARGE' });
    }
    return res.status(400).json({ error: 'FLASHCARD_IMAGE_INVALID' });
  }
  if (err && err.message === 'INVALID_IMAGE_TYPE') {
    return res.status(400).json({ error: 'FLASHCARD_IMAGE_INVALID_TYPE' });
  }
  return next(err);
}

// Ridimensiona a 1600px lato lungo (senza upscale), rispetta l'EXIF con
// .rotate() e ricomprime in JPEG q85 con mozjpeg. Restituisce il path pubblico
// (che è quello che va salvato nel JSON di flashcard.content).
async function saveImage(buffer) {
  const filename   = `${crypto.randomUUID()}.jpg`;
  const outputPath = path.join(UPLOAD_DIR, filename);
  await sharp(buffer)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(outputPath);
  return `/uploads/flashcards/${filename}`;
}

// Cancella un file dato il suo path pubblico. Il controllo startsWith blocca
// tentativi di path traversal (es. "../../etc/passwd") arrivati in modo storto
// dal DB — su path controllati da noi è ridondante, ma costa zero.
async function deleteImageByPath(publicPath) {
  if (!publicPath || typeof publicPath !== 'string') return;
  if (!publicPath.startsWith('/uploads/flashcards/')) return;
  const filename = path.basename(publicPath);
  const fullPath = path.join(UPLOAD_DIR, filename);
  try {
    await fs.unlink(fullPath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Impossibile cancellare ${fullPath}:`, err);
    }
  }
}

// Prende un content JSON (grezzo o già parsato) e cancella le immagini
// referenziate. Usato in DELETE flashcard e DELETE lesson per non lasciare
// file orfani sul disco.
async function deleteContentImages(content) {
  if (!content) return;
  const c = typeof content === 'string' ? JSON.parse(content) : content;
  await Promise.all([
    deleteImageByPath(c.questionImage),
    deleteImageByPath(c.answerImage),
  ]);
}

module.exports = {
  flashcardImagesUpload,
  handleUploadError,
  saveImage,
  deleteImageByPath,
  deleteContentImages,
};
