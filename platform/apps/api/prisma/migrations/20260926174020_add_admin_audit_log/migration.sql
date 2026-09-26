CREATE TABLE "AdminAuditLog" (
    "id" UUID NOT NULL,
    "actorSubject" TEXT NOT NULL,
    "action" VARCHAR(32) NOT NULL,
    "entityType" VARCHAR(32) NOT NULL,
    "entityId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AdminAuditLog_actorSubject_check"
      CHECK (length(btrim("actorSubject")) > 0),
    CONSTRAINT "AdminAuditLog_action_check"
      CHECK (length(btrim("action")) > 0),
    CONSTRAINT "AdminAuditLog_entityType_check"
      CHECK (length(btrim("entityType")) > 0)
);

CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");
CREATE INDEX "AdminAuditLog_entityType_entityId_idx"
ON "AdminAuditLog"("entityType", "entityId");

CREATE FUNCTION prevent_admin_audit_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'AdminAuditLog is append-only' USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "AdminAuditLog_prevent_mutation"
BEFORE UPDATE OR DELETE ON "AdminAuditLog"
FOR EACH ROW
EXECUTE FUNCTION prevent_admin_audit_log_mutation();

CREATE TRIGGER "AdminAuditLog_prevent_truncate"
BEFORE TRUNCATE ON "AdminAuditLog"
FOR EACH STATEMENT
EXECUTE FUNCTION prevent_admin_audit_log_mutation();
