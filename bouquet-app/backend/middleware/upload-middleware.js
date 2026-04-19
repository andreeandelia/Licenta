import fs from 'fs';
import path from 'path';
import multer from 'multer';

const uploadsDir = path.join(process.cwd(), 'uploads', 'products');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const safeName = String(file.originalname || 'image')
            .replace(/\.[^/.]+$/, '')
            .replace(/[^a-zA-Z0-9_-]/g, '-')
            .slice(0, 60);
        const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
        cb(null, `${Date.now()}-${safeName}${ext}`);
    },
});

function fileFilter(_req, file, cb) {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (allowed.has(String(file.mimetype || '').toLowerCase())) {
        cb(null, true);
        return;
    }

    cb(new Error('Only JPG, PNG, and WEBP images are allowed'));
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

export const uploadProductImage = upload.single('image');
