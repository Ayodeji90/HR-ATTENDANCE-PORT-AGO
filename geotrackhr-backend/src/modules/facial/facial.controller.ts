import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import { AppError } from '@middleware/errorHandler';
import { logger } from '@utils/logger';
import { facialModel } from './facial.model';
import { config } from '@config/index';
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

const PLACEHOLDER_MODEL_VERSION = 'placeholder-v1';
const EMBEDDING_DIMENSIONS = 16;

/**
 * Placeholder facial embedding generator. A real implementation would call
 * an AI facial-recognition model here; this deterministically derives a
 * fixed-length float vector from the uploaded file names so the rest of
 * the pipeline (storage, verification) can be built and tested end-to-end.
 */
function generatePlaceholderTemplate(imagePaths: string[]): number[] {
  const concat = [...imagePaths].sort().join('|');
  const vector: number[] = [];
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    let hash = 0;
    for (let c = 0; c < concat.length; c++) {
      hash = (hash * 31 + concat.charCodeAt(c) + i) | 0;
    }
    vector.push((hash % 1000) / 1000);
  }
  return vector;
}

/** Register facial images for an employee (multiple uploads) */
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
      const templateData = generatePlaceholderTemplate(imagePaths);
      const record = await facialModel.create({
        employee_id: employeeId,
        template_data: templateData,
        model_version: PLACEHOLDER_MODEL_VERSION,
        image_count: files.length,
      });
      logger.info('Facial template registered', { employeeId, recordId: record.id });
      res.status(201).json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  },
];

/** Verify a live selfie against stored template (placeholder logic) */
export const verifyFacial = [
  upload.single('selfie'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.params;
      const stored = await facialModel.findByEmployeeId(employeeId);
      if (!stored) throw new AppError('No facial template found for employee', 404, 'FACIAL_NOT_FOUND');
      if (!req.file) throw new AppError('Selfie image required', 400, 'NO_SELFIE');
      // Placeholder verification: compare placeholder template with generated from selfie path (trivial)
      // In a real system you'd call an AI service; here we just accept if template exists.
      logger.info('Facial verification attempted', { employeeId });
      res.json({ success: true, verified: true, message: 'Facial verification passed (placeholder)' });
    } catch (err) {
      next(err);
    }
  },
];
