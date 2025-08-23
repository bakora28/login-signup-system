import express from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // keep file in memory

// configure AWS S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// upload route
router.post('/profile/api/profile/upload-picture', upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const fileKey = `profile-pictures/${crypto.randomUUID()}-${req.file.originalname}`;

    // upload to s3
    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read', // 👈 makes the file public
    }));

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    // TODO: save fileUrl in user profile DB
    res.json({ success: true, profilePictureUrl: fileUrl });

  } catch (err) {
    console.error('S3 upload error:', err);
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

export default router;
