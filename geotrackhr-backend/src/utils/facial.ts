import fs from 'fs';
import path from 'path';
import * as tf from '@tensorflow/tfjs-node';
import * as faceapi from '@vladmandic/face-api';
import { AppError } from '@middleware/errorHandler';
import { logger } from '@utils/logger';
import { config } from '@config/index';

/**
 * Facial recognition helpers built on @vladmandic/face-api (the maintained
 * fork of face-api.js) running on @tensorflow/tfjs-node (native CPU backend).
 *
 * Pipeline:
 *   - ssdMobilenetv1 (default) → locate faces; more accurate than the tiny
 *     detector, which improves embedding quality for verification
 *   - faceLandmark68Net → align the face (improves recognition accuracy)
 *   - faceRecognitionNet → FaceNet-style 128-dim embedding
 *
 * Two faces are compared by euclidean distance of their embeddings — the
 * same metric face-api's FaceMatcher uses (same person < 0.6, strangers
 * > 0.6, verified against real portraits during development). The models
 * live in geotrackhr-backend/models/facial/ (committed to the repo, so
 * they're always present in dev and on Render).
 */

const MODELS_DIR = path.resolve(process.cwd(), config.facial.modelDir);

let modelsLoaded: Promise<void> | null = null;

/** Load the three model files once; subsequent calls reuse the promise. */
function ensureModels(): Promise<void> {
  if (!modelsLoaded) {
    modelsLoaded = (async () => {
      logger.info('[facial] loading models from ' + MODELS_DIR);
      await tf.ready();
      await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS_DIR);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(MODELS_DIR);
      await faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS_DIR);
      logger.info('[facial] models loaded');
    })().catch((err) => {
      modelsLoaded = null; // allow a retry on the next call
      logger.error('[facial] failed to load models', { message: (err as Error).message });
      throw new AppError(
        'Facial recognition engine unavailable — try again shortly',
        503,
        'FACIAL_ENGINE_UNAVAILABLE',
      );
    });
  }
  return modelsLoaded;
}

export interface FaceEmbedding {
  descriptor: number[]; // 128-dim FaceNet embedding
  detectionScore: number; // 0..1 face-detection confidence
}

/**
 * Extract a face embedding from an image file on disk. Returns null when no
 * face is found (or more than one face is present, which is ambiguous).
 * Throws FACIAL_ENGINE_UNAVAILABLE if the models cannot be loaded.
 */
export async function extractEmbeddingFromFile(imagePath: string): Promise<FaceEmbedding | null> {
  await ensureModels();
  const absolute = path.resolve(imagePath);
  if (!fs.existsSync(absolute)) {
    throw new AppError('Facial image not found on disk', 500, 'FACIAL_IMAGE_MISSING');
  }
  const buffer = fs.readFileSync(absolute);
  const tensor = tf.node.decodeImage(buffer, 3) as tf.Tensor3D;
  try {
    const result = await faceapi
      .detectSingleFace(
        tensor,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3, maxResults: 1 }),
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!result) return null;

    return {
      descriptor: Array.from(result.descriptor),
      detectionScore: result.detection.score,
    };
  } catch (err) {
    logger.error('[facial] embedding extraction failed', { message: (err as Error).message });
    throw new AppError('Could not analyze the facial image', 422, 'FACIAL_ANALYSIS_FAILED');
  } finally {
    tensor.dispose();
  }
}

/**
 * Euclidean distance between two equal-length vectors. Lower = more similar.
 * face-api's FaceMatcher convention: distance < 0.6 means the same person.
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length) return Number.MAX_SAFE_INTEGER;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/** Average several embeddings into one (used when enrolling from N photos). */
export function averageEmbeddings(embeddings: number[][]): number[] {
  const dim = embeddings[0]?.length ?? 0;
  if (!dim) return [];
  const avg = new Array(dim).fill(0);
  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) avg[i] += emb[i];
  }
  return avg.map((v) => v / embeddings.length);
}
