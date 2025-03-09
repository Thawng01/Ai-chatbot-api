import multer, { FileFilterCallback } from 'multer'

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const fileFilter = (
    req: any,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    if (file.mimetype === 'pdf') {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file type'));
    }
};


export const multerUpload = multer({ storage });