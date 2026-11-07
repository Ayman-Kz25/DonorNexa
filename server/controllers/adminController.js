import User from "../models/User.js";
import Donor from "../models/Donor.js";
import Hospital from "../models/Hospital.js";
import BloodRequest from "../models/BloodRequest.js";
import City from "../models/City.js";
import mongoose from "mongoose";
import logAdminAction from "../utils/logAdminAction.js";
import AuditLog from "../models/AuditLog.js";

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
export const getAdminUsers = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const search = req.query.search?.trim() || "";
    const role = req.query.role || "";

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
        .select("name email role city isActive createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        limit,
      },
    });
  } catch (error) {
    console.error("Get admin users error:", error);

    res.status(500).json({
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
      adminId: req.user._id,
      action: isActive ? "USER_UNBLOCKED" : "USER_BLOCKED",
      targetType: "User",
      targetId: user._id,
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
      adminId: req.user._id,
      action: "CITY_ADDED",
      targetType: "City",
      targetId: city._id,
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

    const city = await City.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true },
    );

    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found.",
      });
    }

    await logAdminAction({
      adminId: req.user._id,
      action: isActive ? "CITY_ACTIVATED" : "CITY_DEACTIVATED",
      targetType: "City",
      targetId: city._id,
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
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit) || 10)
    );

    const filter = {};

    if (req.query.action) {
      filter.action = req.query.action;
    }

    const [logs, totalLogs] = await Promise.all([
      AuditLog.find(filter)
        .populate("admin", "name email")
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