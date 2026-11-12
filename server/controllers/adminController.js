import mongoose from "mongoose";
import User from "../models/User.js";
import City from "../models/City.js";
import Donor from "../models/Donor.js";
import AuditLog from "../models/AuditLog.js";
import Hospital from "../models/Hospital.js";
import BloodRequest from "../models/BloodRequest.js";
import BloodInventory from "../models/BloodInventory.js";
import Setting from "../models/Setting.js";
import logAdminAction from "../utils/logAdminAction.js";

export const getAdminOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      totalDonors,
      totalHospitals,
      pendingHospitals,
      verifiedHospitals,
      activeRequests,
      fulfilledRequests,
      blockedUsers,
    ] = await Promise.all([
      User.countDocuments(),

      Donor.countDocuments(),

      Hospital.countDocuments(),

      Hospital.countDocuments({
        verificationStatus: "pending",
      }),

      Hospital.countDocuments({
        verificationStatus: "verified",
      }),

      BloodRequest.countDocuments({
        status: "open",
        expiresAt: { $gt: new Date() },
      }),

      BloodRequest.countDocuments({
        status: "fulfilled",
      }),

      User.countDocuments({
        isActive: false,
      }),
    ]);

    res.status(200).json({
      success: true,
      overview: {
        totalUsers,
        totalDonors,
        totalHospitals,
        pendingHospitals,
        verifiedHospitals,
        activeRequests,
        fulfilledRequests,
        blockedUsers,
      },
    });
  } catch (error) {
    console.error("Admin overview error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load admin overview.",
    });
  }
};

// Get all users with search, role filter, and pagination

// Get all users with search, role filter, sorting, and pagination
export const getAdminUsers = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const search = req.query.search?.trim() || "";
    const role = req.query.role || "";
    const sortBy = req.query.sortBy || "newest";

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      name_asc: { name: 1 },
      name_desc: { name: -1 },
    };

    const sort = sortOptions[sortBy] || sortOptions.newest;

    const filter = {};

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { email: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    if (["donor", "hospital", "admin"].includes(role)) {
      filter.role = role;
    }

    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select("name email role city phone isActive createdAt")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),
    ]);

    const userIds = users.map((user) => user._id);

    const [donorProfiles, hospitalProfiles] = await Promise.all([
      Donor.find({ user: { $in: userIds } })
        .select(
          "_id user bloodGroup dateOfBirth weight city isAvailable lastDonationDate eligibleAgainDate totalDonations",
        )
        .lean(),

      Hospital.find({ user: { $in: userIds } })
        .select(
          "_id user hospitalName licenseNumber contactPerson address city verificationStatus isActive deactivationReason rejectionReason licenseDocument licenseExpiryDate verifiedAt",
        )
        .lean(),
    ]);

    const donorMap = new Map(
      donorProfiles.map((donor) => [donor.user.toString(), donor]),
    );

    const hospitalMap = new Map(
      hospitalProfiles.map((hospital) => [hospital.user.toString(), hospital]),
    );

    const usersWithProfiles = users.map((user) => ({
      ...user,
      donor:
        user.role === "donor"
          ? donorMap.get(user._id.toString()) || null
          : null,
      hospital:
        user.role === "hospital"
          ? hospitalMap.get(user._id.toString()) || null
          : null,
    }));

    return res.status(200).json({
      success: true,
      users: usersWithProfiles,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        limit,
      },
    });
  } catch (error) {
    console.error("Get admin users error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load users.",
    });
  }
};

// Block or unblock a user
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Admin accounts cannot be blocked through this endpoint.
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be modified here.",
      });
    }

    user.isActive = isActive;
    await user.save();

    await logAdminAction({
      userId: req.user._id,
      adminId: req.user._id,
      action: isActive ? "USER_UNBLOCKED" : "USER_BLOCKED",
      targetType: "User",
      targetId: user._id,
      oldValue: { isActive: !isActive },
      newValue: { isActive },
      ipAddress: req.ip,
      description: `${isActive ? "Unblocked" : "Blocked"} user: ${user.name}`,
    });

    res.status(200).json({
      success: true,
      message: isActive
        ? "User unblocked successfully."
        : "User blocked successfully.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Update user status error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update user status.",
    });
  }
};

// Get all cities
export const getAdminCities = async (req, res) => {
  try {
    const { search = "", status = "all" } = req.query;

    const filter = {};

    if (search.trim()) {
      filter.name = {
        $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    }

    if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
    }

    const cities = await City.find(filter).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: cities.length,
      cities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch cities.",
    });
  }
};

// Add a new city
export const addCity = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "City name is required.",
      });
    }

    const existingCity = await City.findOne({
      name: {
        $regex: `^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });

    if (existingCity) {
      return res.status(409).json({
        success: false,
        message: "This city already exists.",
      });
    }

    const city = await City.create({
      name: name.trim(),
    });

    await logAdminAction({
      userId: req.user._id,
      adminId: req.user._id,
      action: "CITY_ADDED",
      targetType: "City",
      targetId: city._id,
      oldValue: null,
      newValue: {
        name: city.name,
        isActive: city.isActive,
      },
      ipAddress: req.ip,
      description: `Added city: ${city.name}`,
    });

    res.status(201).json({
      success: true,
      message: "City added successfully.",
      city,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to add city.",
    });
  }
};

// Activate or deactivate a city
export const updateCityStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "A valid city status is required.",
      });
    }

    const existingCity = await City.findById(id);

    if (!existingCity) {
      return res.status(404).json({
        success: false,
        message: "City not found.",
      });
    }

    const oldValue = { isActive: existingCity.isActive };

    const city = await City.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true },
    );

    await logAdminAction({
      userId: req.user._id,
      adminId: req.user._id,
      action: isActive ? "CITY_ACTIVATED" : "CITY_DEACTIVATED",
      targetType: "City",
      targetId: city._id,
      oldValue,
      newValue: { isActive: city.isActive },
      ipAddress: req.ip,
      description: `${isActive ? "Activated" : "Deactivated"} city: ${city.name}`,
    });

    res.status(200).json({
      success: true,
      message: `City ${isActive ? "activated" : "deactivated"} successfully.`,
      city,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to update city status.",
    });
  }
};
// Get Admin Audit Logs
export const getAdminAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    const filter = {};

    if (req.query.action) {
      filter.action = req.query.action;
    }

    const [logs, totalLogs] = await Promise.all([
      AuditLog.find(filter)
        .populate("user", "name email role")
        .populate("admin", "name email role")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),

      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      logs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalLogs / limit),
        totalLogs,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch audit logs.",
      error: error.message,
    });
  }
};

// Activate or deactivate a verified hospital
export const updateHospitalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hospital ID.",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "A valid hospital status is required.",
      });
    }

    if (!isActive && !reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a reason for deactivating the hospital.",
      });
    }

    const hospital = await Hospital.findById(id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found.",
      });
    }

    if (hospital.verificationStatus !== "verified") {
      return res.status(400).json({
        success: false,
        message: "Only verified hospitals can be activated or deactivated.",
      });
    }

    if (hospital.isActive === isActive) {
      return res.status(400).json({
        success: false,
        message: `Hospital is already ${isActive ? "active" : "inactive"}.`,
      });
    }

    hospital.isActive = isActive;

    const oldValue = {
      isActive: hospital.isActive,
      deactivatedAt: hospital.deactivatedAt,
      deactivationReason: hospital.deactivationReason,
    };

    hospital.deactivatedAt = isActive ? null : new Date();
    hospital.deactivationReason = isActive ? "" : reason.trim();

    await hospital.save();

    await logAdminAction({
      userId: req.user._id,
      adminId: req.user._id,
      action: isActive ? "HOSPITAL_ACTIVATED" : "HOSPITAL_DEACTIVATED",
      targetType: "Hospital",
      targetId: hospital._id,
      oldValue,
      newValue: {
        isActive: hospital.isActive,
        deactivatedAt: hospital.deactivatedAt,
        deactivationReason: hospital.deactivationReason,
      },
      ipAddress: req.ip,
      description: `${isActive ? "Activated" : "Deactivated"} hospital: ${hospital.hospitalName}${!isActive ? `. Reason: ${reason.trim()}` : ""}`,
    });

    return res.status(200).json({
      success: true,
      message: `Hospital ${isActive ? "activated" : "deactivated"} successfully.`,
      hospital,
    });
  } catch (error) {
    console.error("Update hospital status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update hospital status.",
    });
  }
};

export const getAdminBloodRequests = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    const sortBy = req.query.sortBy || "newest";

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      required_soonest: { requiredBy: 1 },
      required_latest: { requiredBy: -1 },
    };

    const sort = sortOptions[sortBy] || sortOptions.newest;

    const filter = {};

    if (
      ["open", "fulfilled", "cancelled", "expired"].includes(req.query.status)
    ) {
      filter.status = req.query.status;
    }

    if (
      ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].includes(
        req.query.bloodGroup,
      )
    ) {
      filter.bloodGroup = req.query.bloodGroup;
    }

    if (["normal", "urgent", "critical"].includes(req.query.urgency)) {
      filter.urgency = req.query.urgency;
    }

    const [bloodRequests, totalRequests] = await Promise.all([
      BloodRequest.find(filter)
        .populate({
          path: "hospital",
          select: "hospitalName city user",
          populate: {
            path: "user",
            select: "name email",
          },
        })
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      BloodRequest.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      bloodRequests,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalRequests / limit),
        totalRequests,
        limit,
      },
    });
  } catch (error) {
    console.error("Get admin blood requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve blood requests.",
    });
  }
};

export const exportAdminBloodRequests = async (req, res) => {
  try {
    const filter = {};

    if (
      ["open", "fulfilled", "cancelled", "expired"].includes(req.query.status)
    ) {
      filter.status = req.query.status;
    }

    if (
      ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].includes(
        req.query.bloodGroup,
      )
    ) {
      filter.bloodGroup = req.query.bloodGroup;
    }

    if (["normal", "urgent", "critical"].includes(req.query.urgency)) {
      filter.urgency = req.query.urgency;
    }

    const bloodRequests = await BloodRequest.find(filter)
      .populate({
        path: "hospital",
        select: "hospitalName city",
      })
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      "Hospital",
      "City",
      "Blood Group",
      "Units Required",
      "Units Reserved",
      "Units Fulfilled",
      "Urgency",
      "Required By",
      "Status",
      "Created At",
    ];

    const escapeCSV = (value) => {
      let text = String(value ?? "");

      // Prevent spreadsheet formula injection.
      if (/^[=+\-@\t\r]/.test(text)) {
        text = `'${text}`;
      }

      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = bloodRequests.map((item) => [
      item.hospital?.hospitalName || "Unknown hospital",
      item.city || item.hospital?.city || "",
      item.bloodGroup,
      item.unitsRequired,
      item.unitsReserved || 0,
      item.unitsFulfilled || 0,
      item.urgency,
      item.requiredBy ? new Date(item.requiredBy).toISOString() : "",
      item.status,
      item.createdAt ? new Date(item.createdAt).toISOString() : "",
    ]);

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="donornexa-blood-requests.csv"',
    );

    return res.status(200).send("\uFEFF" + csv);
  } catch (error) {
    console.error("Export blood requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to export blood requests.",
    });
  }
};

// Get Admin Dashboard Analytics
export const getAdminAnalytics = async (req, res) => {
  try {
    const eightWeeksAgo = new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000);

    const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    const [weeklyRequests, bloodGroupDemand, bloodGroupSupply] =
      await Promise.all([
        // 1. Requests created per week
        BloodRequest.aggregate([
          {
            $match: {
              createdAt: { $gte: eightWeeksAgo },
            },
          },
          {
            $group: {
              _id: {
                $dateTrunc: {
                  date: "$createdAt",
                  unit: "week",
                  startOfWeek: "monday",
                  timezone: "Asia/Karachi",
                },
              },
              totalRequests: { $sum: 1 },
              fulfilledRequests: {
                $sum: {
                  $cond: [{ $eq: ["$status", "fulfilled"] }, 1, 0],
                },
              },
            },
          },
          { $sort: { _id: 1 } },
          {
            $project: {
              _id: 0,
              week: "$_id",
              totalRequests: 1,
              fulfilledRequests: 1,
              fulfilmentRate: {
                $cond: [
                  { $gt: ["$totalRequests", 0] },
                  {
                    $multiply: [
                      {
                        $divide: ["$fulfilledRequests", "$totalRequests"],
                      },
                      100,
                    ],
                  },
                  0,
                ],
              },
            },
          },
        ]),

        // 2. Outstanding demand per blood group
        BloodRequest.aggregate([
          {
            $match: {
              status: "open",
            },
          },
          {
            $group: {
              _id: "$bloodGroup",
              unitsRequired: {
                $sum: {
                  $max: [
                    0,
                    { $subtract: ["$unitsRequired", "$unitsFulfilled"] },
                  ],
                },
              },
            },
          },
        ]),

        // 3. Available inventory per blood group
        BloodInventory.aggregate([
          {
            $lookup: {
              from: "hospitals",
              localField: "hospital",
              foreignField: "_id",
              as: "hospital",
            },
          },
          { $unwind: "$hospital" },
          {
            $match: {
              "hospital.verificationStatus": "verified",
              "hospital.isActive": true,
            },
          },
          {
            $group: {
              _id: "$bloodGroup",
              unitsAvailable: { $sum: "$unitsAvailable" },
            },
          },
        ]),
      ]);

    // Prepare all eight blood groups, including groups with zero values
    const demandMap = new Map(
      bloodGroupDemand.map((item) => [item._id, item.unitsRequired]),
    );

    const supplyMap = new Map(
      bloodGroupSupply.map((item) => [item._id, item.unitsAvailable]),
    );

    const bloodGroupComparison = bloodGroups.map((group) => ({
      bloodGroup: group,
      demand: demandMap.get(group) || 0,
      supply: supplyMap.get(group) || 0,
    }));

    // Format weekly chart labels
    const requestsPerWeek = weeklyRequests.map((item) => ({
      week: new Date(item.week).toLocaleDateString("en-PK", {
        day: "2-digit",
        month: "short",
        timeZone: "Asia/Karachi",
      }),
      totalRequests: item.totalRequests,
    }));

    const fulfilmentRate = weeklyRequests.map((item) => ({
      week: new Date(item.week).toLocaleDateString("en-PK", {
        day: "2-digit",
        month: "short",
        timeZone: "Asia/Karachi",
      }),
      rate: Math.round(item.fulfilmentRate * 100) / 100,
    }));

    return res.status(200).json({
      success: true,
      analytics: {
        requestsPerWeek,
        bloodGroupComparison,
        fulfilmentRate,
      },
    });
  } catch (error) {
    console.error("Admin analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard analytics.",
    });
  }
};

export const exportAdminUsers = async (req, res) => {
  try {
    const filter = {};

    if (req.query.search?.trim()) {
      const search = req.query.search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (["donor", "hospital", "admin"].includes(req.query.role)) {
      filter.role = req.query.role;
    }

    const users = await User.find(filter)
      .select("name email role isActive createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const headers = ["Name", "Email", "Role", "Account Status", "Joined At"];

    const escapeCSV = (value) => {
      let text = String(value ?? "");

      if (/^[=+\-@\t\r]/.test(text)) {
        text = `'${text}`;
      }

      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = users.map((user) => [
      user.name,
      user.email,
      user.role,
      user.isActive ? "Active" : "Blocked",
      user.createdAt ? new Date(user.createdAt).toISOString() : "",
    ]);

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="donornexa-users.csv"',
    );

    return res.status(200).send("\uFEFF" + csv);
  } catch (error) {
    console.error("Export admin users error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to export users.",
    });
  }
};

export const exportAdminAuditLogs = async (req, res) => {
  try {
    const filter = {};

    if (req.query.action?.trim()) {
      filter.action = req.query.action.trim();
    }

    const logs = await AuditLog.find(filter)
      .populate("admin", "name email")
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      "Action",
      "Description",
      "Target Type",
      "Target ID",
      "Admin Name",
      "Admin Email",
      "Related User",
      "Related User Email",
      "Old Value",
      "New Value",
      "IP Address",
      "Created At",
    ];

    const escapeCSV = (value) => {
      let text =
        value && typeof value === "object"
          ? JSON.stringify(value)
          : String(value ?? "");

      if (/^[=+\-@\t\r]/.test(text)) {
        text = `'${text}`;
      }

      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = logs.map((log) => [
      log.action,
      log.description,
      log.targetType,
      log.targetId?.toString() || "",
      log.admin?.name || "System",
      log.admin?.email || "",
      log.user?.name || "",
      log.user?.email || "",
      log.oldValue,
      log.newValue,
      log.ipAddress,
      log.createdAt ? new Date(log.createdAt).toISOString() : "",
    ]);

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="donornexa-audit-logs.csv"',
    );

    return res.status(200).send("\uFEFF" + csv);
  } catch (error) {
    console.error("Export audit logs error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to export audit logs.",
    });
  }
};

const escapeAdminCSVValue = (value) => {
  let text = value == null ? "" : String(value);

  // Prevent CSV formula injection
  if (/^[\s]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
};

export const exportAdminHospitals = async (req, res) => {
  try {
    const { search, verificationStatus, isActive } = req.query;

    const filter = {};

    if (search?.trim()) {
      const escapedSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { hospitalName: { $regex: escapedSearch, $options: "i" } },
        { licenseNumber: { $regex: escapedSearch, $options: "i" } },
        { contactPerson: { $regex: escapedSearch, $options: "i" } },
        { city: { $regex: escapedSearch, $options: "i" } },
        { address: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    if (verificationStatus) {
      filter.verificationStatus = verificationStatus;
    }

    if (isActive !== undefined && isActive !== "") {
      filter.isActive = isActive === "true";
    }

    const hospitals = await Hospital.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      "Hospital Name",
      "License Number",
      "Contact Person",
      "Address",
      "City",
      "Verification Status",
      "Account Status",
      "License Expiry Date",
      "Verified At",
      "Rejection Reason",
      "Deactivation Reason",
      "Registered At",
    ];

    const rows = hospitals.map((hospital) => [
      hospital.hospitalName,
      hospital.licenseNumber,
      hospital.contactPerson,
      hospital.address,
      hospital.city,
      hospital.verificationStatus,
      hospital.isActive ? "Active" : "Inactive",
      hospital.licenseExpiryDate
        ? new Date(hospital.licenseExpiryDate).toLocaleDateString()
        : "",
      hospital.verifiedAt
        ? new Date(hospital.verifiedAt).toLocaleDateString()
        : "",
      hospital.rejectionReason,
      hospital.deactivationReason,
      hospital.createdAt
        ? new Date(hospital.createdAt).toLocaleDateString()
        : "",
    ]);

    const csv = [
      headers.map(escapeAdminCSVValue).join(","),
      ...rows.map((row) => row.map(escapeAdminCSVValue).join(",")),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="donornexa-hospitals.csv"',
    );

    return res.send("\uFEFF" + csv);
  } catch (error) {
    console.error("Export hospitals error:", error);
    return res.status(500).json({
      message: "Failed to export hospitals.",
    });
  }
};

export const exportAdminCities = async (req, res) => {
  try {
    const { search, isActive } = req.query;

    const filter = {};

    if (search?.trim()) {
      const escapedSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.name = { $regex: escapedSearch, $options: "i" };
    }

    if (isActive !== undefined && isActive !== "") {
      filter.isActive = isActive === "true";
    }

    const cities = await City.find(filter).sort({ name: 1 }).lean();

    const headers = ["City Name", "Status", "Created At"];

    const rows = cities.map((city) => [
      city.name,
      city.isActive ? "Active" : "Inactive",
      city.createdAt ? new Date(city.createdAt).toLocaleDateString() : "",
    ]);

    const csv = [
      headers.map(escapeAdminCSVValue).join(","),
      ...rows.map((row) => row.map(escapeAdminCSVValue).join(",")),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="donornexa-cities.csv"',
    );

    return res.send("\uFEFF" + csv);
  } catch (error) {
    console.error("Export cities error:", error);
    return res.status(500).json({
      message: "Failed to export cities.",
    });
  }
};

const escapeDonorCSV = (value) => {
  const safeValue = String(value ?? "").replace(/^[=+\-@\t\r]/, "'$&");
  return `"${safeValue.replace(/"/g, '""')}"`;
};

export const exportAdminDonors = async (req, res) => {
  try {
    const { search = "", bloodGroup = "", availability = "all" } = req.query;

    const userQuery = { role: "donor" };

    if (search.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );

      userQuery.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const users = await User.find(userQuery)
      .select("name email isActive createdAt")
      .lean();

    const userIds = users.map((user) => user._id);

    const donorQuery = {
      user: { $in: userIds },
    };

    if (bloodGroup) {
      donorQuery.bloodGroup = bloodGroup;
    }

    if (availability === "available") {
      donorQuery.isAvailable = true;
    } else if (availability === "unavailable") {
      donorQuery.isAvailable = false;
    }

    const donors = await Donor.find(donorQuery).lean();

    const donorMap = new Map(
      donors.map((donor) => [String(donor.user), donor]),
    );

    const matchingUsers = users.filter((user) =>
      donorMap.has(String(user._id)),
    );

    const headers = [
      "Name",
      "Email",
      "Blood Group",
      "City",
      "Weight (kg)",
      "Availability",
      "Account Status",
      "Total Donations",
      "Last Donation Date",
      "Eligible Again Date",
      "Joined At",
    ];

    const rows = matchingUsers.map((user) => {
      const donor = donorMap.get(String(user._id));

      return [
        user.name,
        user.email,
        donor.bloodGroup,
        donor.city,
        donor.weight,
        donor.isAvailable ? "Available" : "Unavailable",
        user.isActive ? "Active" : "Blocked",
        donor.totalDonations ?? 0,
        donor.lastDonationDate
          ? new Date(donor.lastDonationDate).toISOString().split("T")[0]
          : "",
        donor.eligibleAgainDate
          ? new Date(donor.eligibleAgainDate).toISOString().split("T")[0]
          : "",
        user.createdAt
          ? new Date(user.createdAt).toISOString().split("T")[0]
          : "",
      ];
    });

    const csv = [
      headers.map(escapeDonorCSV).join(","),
      ...rows.map((row) => row.map(escapeDonorCSV).join(",")),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="donornexa-donors.csv"',
    );

    return res.send(`\uFEFF${csv}`);
  } catch (error) {
    console.error("Export donors error:", error);

    return res.status(500).json({
      message: "Failed to export donors.",
    });
  }
};

export const getAdminSettings = async (req, res) => {
  try {
    let setting = await Setting.findOne({
      key: "donationCooldownDays",
    });

    if (!setting) {
      setting = await Setting.create({
        key: "donationCooldownDays",
        value: 90,
        description: "Minimum days between blood donations",
      });
    }

    return res.status(200).json({
      settings: {
        donationCooldownDays: setting.value,
      },
    });
  } catch (error) {
    console.error("Get admin settings error:", error);
    return res.status(500).json({
      message: "Failed to fetch admin settings.",
    });
  }
};

export const updateAdminSettings = async (req, res) => {
  try {
    const { donationCooldownDays } = req.body;

    if (
      !Number.isInteger(donationCooldownDays) ||
      donationCooldownDays < 1 ||
      donationCooldownDays > 365
    ) {
      return res.status(400).json({
        message: "Donation cooldown must be between 1 and 365 days.",
      });
    }

    const setting = await Setting.findOneAndUpdate(
      { key: "donationCooldownDays" },
      {
        $set: {
          value: donationCooldownDays,
          description: "Minimum days between blood donations",
        },
      },
      { new: true, upsert: true, runValidators: true },
    );

    await logAdminAction({
      admin: req.user._id,
      action: "SETTINGS_UPDATED",
      description: `Donation cooldown changed to ${donationCooldownDays} days.`,
      targetType: "Setting",
      targetId: setting._id,
    });

    return res.status(200).json({
      message: "Settings updated successfully.",
      settings: {
        donationCooldownDays: setting.value,
      },
    });
  } catch (error) {
    console.error("Update admin settings error:", error);
    return res.status(500).json({
      message: "Failed to update admin settings.",
    });
  }
};
