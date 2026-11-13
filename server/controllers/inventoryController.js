import BloodInventory from "../models/BloodInventory.js";
import logAdminAction from "../utils/logAdminAction.js";

// Get hospital blood inventory
export const getHospitalInventory = async (req, res) => {
  try {
    const inventory = await BloodInventory.find({
      hospital: req.hospital._id,
    }).sort({ bloodGroup: 1 });

    res.status(200).json({
      success: true,
      inventory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch blood inventory.",
      error: error.message,
    });
  }
};

// Add or update blood inventory
export const updateHospitalInventory = async (req, res) => {
  try {
    const { bloodGroup, unitsAvailable } = req.body;

    const validGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    if (!validGroups.includes(bloodGroup)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid blood group.",
      });
    }

    if (
      unitsAvailable === undefined ||
      unitsAvailable === null ||
      unitsAvailable === "" ||
      !Number.isSafeInteger(Number(unitsAvailable)) ||
      Number(unitsAvailable) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Units available must be a valid non-negative whole number.",
      });
    }

    const existingInventory = await BloodInventory.findOne({
      hospital: req.hospital._id,
      bloodGroup,
    });

    const previousUnits = existingInventory?.unitsAvailable ?? 0;

    const inventory = await BloodInventory.findOneAndUpdate(
      {
        hospital: req.hospital._id,
        bloodGroup,
      },
      {
        $set: {
          unitsAvailable: Number(unitsAvailable),
          lastUpdated: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    await logAdminAction({
      userId: req.user._id,
      action: "HOSPITAL_INVENTORY_UPDATED",
      targetType: "BloodInventory",
      targetId: inventory._id,
      oldValue: {
        bloodGroup,
        unitsAvailable: previousUnits,
      },
      newValue: {
        bloodGroup,
        unitsAvailable: inventory.unitsAvailable,
      },
      ipAddress: req.ip,
      description: `Hospital ${req.hospital.hospitalName} updated ${bloodGroup} inventory from ${previousUnits} to ${inventory.unitsAvailable} units.`,
    });

    return res.status(200).json({
      success: true,
      message: "Blood inventory updated successfully.",
      inventory,
    });
  } catch (error) {
    console.error("Update hospital inventory error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update blood inventory.",
    });
  }
};

export default {
  getHospitalInventory,
  updateHospitalInventory,
};
