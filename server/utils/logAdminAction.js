import AuditLog from "../models/AuditLog.js";

const logAdminAction = async ({
  userId,
  adminId,
  action,
  entity,
  targetType,
  targetId,
  oldValue = null,
  newValue = null,
  ipAddress = null,
  description,
}) => {
  try {
    await AuditLog.create({
      user: userId || adminId || null,
      admin: adminId || null,

      action,

      targetType: targetType || entity,
      targetId: targetId || null,

      description: description || action,

      oldValue,
      newValue,
      ipAddress,
    });
  } catch (error) {
    console.error("Audit logging error:", error.message);
  }
};

export default logAdminAction;
