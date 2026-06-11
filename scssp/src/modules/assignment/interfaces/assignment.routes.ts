import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { assignmentService } from '../application/assignment.service';
import { authenticate, authorize } from '@shared/middleware/auth';
import { ValidationError } from '@shared/errors';

export async function assignmentRoutes(app: FastifyInstance): Promise<void> {
  app.post('/', { preHandler: [authenticate, authorize('VULNERABILITY_ASSIGN')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    if (!body.vulnerabilityId || !body.assignedToId) throw new ValidationError('vulnerabilityId and assignedToId required');
    const result = await assignmentService.create(body, request.user!.userId);
    return reply.code(201).send({ success: true, data: result });
  });

  app.get('/', { preHandler: [authenticate, authorize('VULNERABILITY_ASSIGN')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const result = await assignmentService.findAll({
      status: query.status,
      assigneeId: query.assigneeId,
      breached: query.breached === 'true',
      page: parseInt(query.page || '1'),
      limit: parseInt(query.limit || '20'),
    });
    return { success: true, data: result.items, total: result.total };
  });

  app.get('/compliance-report', { preHandler: [authenticate, authorize('AUDIT_LOG_READ')] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const result = await assignmentService.getComplianceReport(query.dateFrom, query.dateTo);
    return { success: true, data: result };
  });

  app.get('/:id', { preHandler: [authenticate, authorize('VULNERABILITY_ASSIGN')] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const result = await assignmentService.findById(request.params.id);
    return { success: true, data: result };
  });

  app.patch('/:id/status', { preHandler: [authenticate, authorize('VULNERABILITY_ASSIGN')] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const body = request.body as any;
    if (!body.status) throw new ValidationError('status is required');
    const result = await assignmentService.updateStatus(request.params.id, body, request.user!.userId);
    return { success: true, data: result };
  });
}
