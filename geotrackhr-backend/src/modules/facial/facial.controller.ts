import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { AppError } from '@middleware/errorHandler';
import { logger } from '@utils/logger';
import { facialModel } from './facial.model';
import { config } from '@config/index';
import { extractEmbeddingFromFile, averageEmbeddings, euclideanDistance } from '@utils/facial';
import fs from 'fs';

// ---------------------------------------------------------------------------
// Multer setup for facial image uploads
// ---------------------------------------------------------------------------
const uploadDir = path.resolve(config.upload.dir, 'facial');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});
const upload = multer({ storage, limits: { fileSize: config.upload.maxFileSize } });

const MODEL_VERSION = 'facenet-v1';

/**
 * Register facial images for an employee (multiple uploads). Each image is
 * run through the face model to produce a 128-dim embedding; the enrollments
 * are averaged into a single template so a variety of angles/lighting are
 * represented. At least one image with a detectable face is required.
 */
export const registerFacial = [
  upload.array('images', 10), // up to 10 images per registration
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.params;
      if (!req.files || !(req.files as Express.Multer.File[]).length) {
        throw new AppError('No facial images uploaded', 400, 'NO_FACIAL_IMAGES');
      }
      const files = req.files as Express.Multer.File[];
      const imagePaths = files.map((f) => path.relative(process.cwd(), f.path));

      const embeddings: number[][] = [];
      let totalScore = 0;
      for (const imagePath of imagePaths) {
        const result = await extractEmbeddingFromFile(imagePath);
        if (result) {
          embeddings.push(result.descriptor);
          totalScore += result.detectionScore;
        } else {
          logger.warn('No face detected in enrollment image — skipped', { employeeId, imagePath });
        }
      }

      if (embeddings.length === 0) {
        throw new AppError(
          'No face detected in any uploaded image — retake with a clear, well-lit photo',
          422,
          'NO_FACE_DETECTED',
        );
      }

      const templateData = averageEmbeddings(embeddings);
      const qualityScore = totalScore / embeddings.length;

      const record = await facialModel.create({
        employee_id: employeeId,
        template_data: templateData,
        model_version: MODEL_VERSION,
        quality_score: qualityScore,
        image_count: embeddings.length,
      });
      logger.info('Facial template registered', {
        employeeId,
        recordId: record.id,
        imagesUsed: embeddings.length,
        qualityScore,
      });
      res.status(201).json({
        success: true,
        data: { ...record, images_used: embeddings.length },
      });
    } catch (err) {
      next(err);
    }
  },
];

/**
 * Verify a live selfie against the employee's stored template. Returns the
 * euclidean distance between the embeddings and whether it passes the
 * configured threshold. This is the same comparison the attendance punch
 * runs server-side.
 */
export const verifyFacial = [
  upload.single('selfie'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.params;
      const stored = await facialModel.findByEmployeeId(employeeId);
      if (!stored) throw new AppError('No facial template found for employee', 404, 'FACIAL_NOT_FOUND');
      if (!req.file) throw new AppError('Selfie image required', 400, 'NO_SELFIE');
      if (!Array.isArray(stored.template_data) || stored.template_data.length === 0) {
        throw new AppError('Stored facial template is corrupt', 500, 'FACIAL_TEMPLATE_CORRUPT');
      }

      const selfiePath = path.relative(process.cwd(), req.file.path);
      const result = await extractEmbeddingFromFile(selfiePath);
      if (!result) {
        throw new AppError('No face detected in the selfie — retake facing the camera', 422, 'NO_FACE_DETECTED');
      }

      const distance = euclideanDistance(result.descriptor, stored.template_data);
      const verified = distance <= config.facial.matchThreshold;
      logger.info('Facial verification', {
        employeeId,
        distance: Number(distance.toFixed(4)),
        verified,
        threshold: config.facial.matchThreshold,
      });
      res.json({ success: true, verified, distance, threshold: config.facial.matchThreshold });
    } catch (err) {
      next(err);
    }
  },
];

/** Enrollment status for an employee — does an active template exist? */
export const facialStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const stored = await facialModel.findByEmployeeId(employeeId);
    res.json({
      success: true,
      data: stored
        ? {
            enrolled: true,
            model_version: stored.model_version,
            quality_score: stored.quality_score,
            image_count: stored.image_count,
            created_at: stored.created_at,
          }
        : { enrolled: false },
    });
  } catch (err) {
    next(err);
  }
};
