import AuditLog from "../models/AuditLog.js";

const logAdminAction = async ({
  adminId,
  action,
  targetType,
  targetId,
  description,
}) => {
  try {
    await AuditLog.create({
      admin: adminId,
      action,
      targetType,
      targetId,
      description,
    });
  } catch (error) {
    console.error("Audit logging error:", error.message);
  }
};

export default logAdminAction;
