"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignmentRoutes = assignmentRoutes;
const assignment_service_1 = require("../application/assignment.service");
const auth_1 = require("@shared/middleware/auth");
const errors_1 = require("@shared/errors");
async function assignmentRoutes(app) {
    app.post('/', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('VULNERABILITY_ASSIGN')] }, async (request, reply) => {
        const body = request.body;
        if (!body.vulnerabilityId || !body.assignedToId)
            throw new errors_1.ValidationError('vulnerabilityId and assignedToId required');
        const result = await assignment_service_1.assignmentService.create(body, request.user.userId);
        return reply.code(201).send({ success: true, data: result });
    });
    app.get('/', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('VULNERABILITY_ASSIGN')] }, async (request, reply) => {
        const query = request.query;
        const result = await assignment_service_1.assignmentService.findAll({
            status: query.status,
            assigneeId: query.assigneeId,
            breached: query.breached === 'true',
            page: parseInt(query.page || '1'),
            limit: parseInt(query.limit || '20'),
        });
        return { success: true, data: result.items, total: result.total };
    });
    app.get('/compliance-report', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('AUDIT_LOG_READ')] }, async (request, reply) => {
        const query = request.query;
        const result = await assignment_service_1.assignmentService.getComplianceReport(query.dateFrom, query.dateTo);
        return { success: true, data: result };
    });
    app.get('/:id', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('VULNERABILITY_ASSIGN')] }, async (request, reply) => {
        const result = await assignment_service_1.assignmentService.findById(request.params.id);
        return { success: true, data: result };
    });
    app.patch('/:id/status', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('VULNERABILITY_ASSIGN')] }, async (request, reply) => {
        const body = request.body;
        if (!body.status)
            throw new errors_1.ValidationError('status is required');
        const result = await assignment_service_1.assignmentService.updateStatus(request.params.id, body, request.user.userId);
        return { success: true, data: result };
    });
}
//# sourceMappingURL=assignment.routes.js.map