import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
import { json } from './_helpers';
import type { EmailEnvironment, EmailStatus, EmailType } from '$lib/types/email-audit';

// The four legacy log collections (admin_actions, admin_audit_logs, auditLogs,
// audit_logs) are merged here; `source` preserves which one a row came from so
// the admin UI can keep filtering the way it does today.
export const auditLogs = sqliteTable(
	'audit_logs',
	{
		id: text('id').primaryKey(),
		source: text('source').notNull().default('audit_logs'),
		action: text('action').notNull(),
		actorUid: text('actor_uid'),
		actorEmail: text('actor_email'),
		actorRole: text('actor_role'),
		targetType: text('target_type'),
		targetId: text('target_id'),
		memorialId: text('memorial_id'),
		success: text('success'),
		errorMessage: text('error_message'),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		details: json<Record<string, unknown>>('details'),
		createdAt: text('created_at').notNull()
	},
	(t) => [
		index('audit_created_idx').on(t.createdAt),
		index('audit_actor_idx').on(t.actorUid),
		index('audit_source_idx').on(t.source, t.createdAt),
		index('audit_target_idx').on(t.targetType, t.targetId)
	]
);

export const emailAuditLogs = sqliteTable(
	'email_audit_logs',
	{
		id: text('id').primaryKey(),
		type: text('type').notNull().$type<EmailType>(),
		templateId: text('template_id'),
		templateName: text('template_name'),
		toEmail: text('to_email').notNull(),
		cc: json<string[]>('cc'),
		fromEmail: text('from_email').notNull().default(''),
		subject: text('subject'),
		templateData: json<Record<string, unknown>>('template_data'),
		sentAt: text('sent_at').notNull(),
		triggeredBy: text('triggered_by').notNull().default(''),
		triggeredByUserId: text('triggered_by_user_id'),
		triggeredByAdminId: text('triggered_by_admin_id'),
		memorialId: text('memorial_id'),
		userId: text('user_id'),
		invoiceId: text('invoice_id'),
		streamId: text('stream_id'),
		status: text('status').notNull().$type<EmailStatus>(),
		error: text('error'),
		sendgridMessageId: text('sendgrid_message_id'),
		environment: text('environment').notNull().$type<EmailEnvironment>()
	},
	(t) => [
		index('eal_sent_idx').on(t.sentAt),
		index('eal_to_idx').on(t.toEmail),
		index('eal_memorial_idx').on(t.memorialId),
		index('eal_type_idx').on(t.type)
	]
);

export const analyticsEvents = sqliteTable(
	'analytics_events',
	{
		id: text('id').primaryKey(),
		kind: text('kind').notNull(),
		memorialId: text('memorial_id'),
		streamId: text('stream_id'),
		payload: json<Record<string, unknown>>('payload'),
		createdAt: text('created_at').notNull()
	},
	(t) => [index('ae_kind_idx').on(t.kind, t.createdAt)]
);
