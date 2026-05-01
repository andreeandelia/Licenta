import multer from "multer";

const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);

    if (allowed.has(String(file.mimetype || "").toLowerCase())) {
        cb(null, true);
        return;
    }

    cb(new Error("Only JPG, PNG, and WEBP images are allowed"));
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

export const uploadProductImage = upload.single("image");