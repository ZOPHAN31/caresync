import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { DocumentType } from '@prisma/client';
import { storageService } from '../services/storageService';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

async function verifyAccess(recipientId: string, userId: string) {
  const recipient = await prisma.careRecipient.findUnique({
    where: { id: recipientId },
    include: { careTeam: { include: { members: true } } },
  });
  if (!recipient) throw ApiError.notFound('Recipient not found', 'NOT_FOUND');
  if (!recipient.careTeam.members.some((m) => m.userId === userId))
    throw ApiError.forbidden('Not a member', 'NOT_MEMBER');
  return recipient;
}

// GET /api/v1/documents?recipientId=&type=
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { recipientId, type } = req.query;
    if (!recipientId) throw ApiError.badRequest('recipientId is required', 'MISSING_PARAM');
    await verifyAccess(recipientId as string, req.user!.id);
    const documents = await prisma.document.findMany({
      where: {
        recipientId: recipientId as string,
        ...(type ? { type: type as DocumentType } : {}),
      },
      include: { uploader: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: documents });
  })
);

// POST /api/v1/documents/upload-url — get a signed upload URL
router.post(
  '/upload-url',
  requireAuth,
  validate(
    z.object({
      body: z.object({
        recipientId: z.string().uuid(),
        fileName: z.string(),
        mimeType: z.string(),
        fileSize: z.number().int().positive(),
      }),
    })
  ),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await verifyAccess(req.body.recipientId, req.user!.id);
    const fileId = uuidv4();
    const ext = req.body.fileName.split('.').pop();
    const filePath = `${req.body.recipientId}/${fileId}.${ext}`;
    const signedUrl = await storageService.getUploadSignedUrl(filePath);
    res.json({ success: true, data: { signedUrl, filePath } });
  })
);

// POST /api/v1/documents — register document after upload
router.post(
  '/',
  requireAuth,
  validate(
    z.object({
      body: z.object({
        recipientId: z.string().uuid(),
        type: z.nativeEnum(DocumentType),
        title: z.string().min(1),
        description: z.string().optional(),
        filePath: z.string().min(1),
        fileName: z.string().min(1),
        fileSize: z.number().int().positive(),
        mimeType: z.string().min(1),
        expiresAt: z.string().datetime().optional().nullable(),
      }),
    })
  ),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await verifyAccess(req.body.recipientId, req.user!.id);
    // `filePath` maps to the model's `fileUrl`; strip it from the spread so
    // Prisma doesn't receive an unknown `filePath` argument.
    const { filePath, expiresAt, ...rest } = req.body;
    const document = await prisma.document.create({
      data: {
        ...rest,
        fileUrl: filePath,
        uploadedBy: req.user!.id,
        isEncrypted: true,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
      include: { uploader: { select: { id: true, firstName: true, lastName: true } } },
    });
    res.status(201).json({ success: true, data: document });
  })
);

// GET /api/v1/documents/:id/download — get signed download URL
router.get(
  '/:id/download',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: { recipient: { include: { careTeam: { include: { members: true } } } } },
    });
    if (!doc) throw ApiError.notFound('Document not found', 'NOT_FOUND');
    if (!doc.recipient.careTeam.members.some((m) => m.userId === req.user!.id))
      throw ApiError.forbidden('Not a member', 'NOT_MEMBER');
    const signedUrl = await storageService.getSignedUrl(doc.fileUrl);
    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: 'VIEW', resource: 'document', resourceId: doc.id },
    });
    res.json({ success: true, data: { url: signedUrl, expiresIn: 3600 } });
  })
);

// DELETE /api/v1/documents/:id
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: { recipient: { include: { careTeam: { include: { members: true } } } } },
    });
    if (!doc) throw ApiError.notFound('Document not found', 'NOT_FOUND');
    if (!doc.recipient.careTeam.members.some((m) => m.userId === req.user!.id))
      throw ApiError.forbidden('Not a member', 'NOT_MEMBER');
    await storageService.deleteFile(doc.fileUrl);
    await prisma.document.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { message: 'Document deleted' } });
  })
);

export default router;
