import multer from "multer";
import path from "path";
import crypto from "crypto";
import { getCloudinary } from "../config/cloudinary.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const isPdf =
      file.mimetype === "application/pdf" &&
      path.extname(file.originalname).toLowerCase() === ".pdf";

    if (!isPdf) {
      return cb(new Error("Only PDF license documents are allowed."));
    }

    cb(null, true);
  },
});

const uploadToCloudinary = (buffer, publicId) => {
  return new Promise((resolve, reject) => {
    const cloudinary = getCloudinary();

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        type: "authenticated",
        folder: "donornexa/hospital-licenses",
        public_id: publicId,
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    stream.end(buffer);
  });
};

const uploadHospitalLicense = (req, res, next) => {
  upload.single("licenseDocument")(req, res, async (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "License document must not exceed 5 MB."
            : error.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Hospital license document is required.",
      });
    }

    if (req.file.buffer.subarray(0, 5).toString() !== "%PDF-") {
      return res.status(400).json({
        success: false,
        message: "The uploaded file is not a valid PDF.",
      });
    }

    try {
      const generatedName = `${crypto.randomUUID()}.pdf`;

      const result = await uploadToCloudinary(req.file.buffer, generatedName);

      req.licenseDocument = {
        fileUrl: result.secure_url,
        publicId: result.public_id,
        storageType: "cloudinary",
        fileName: path
          .basename(req.file.originalname)
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .slice(0, 100),
        mimeType: "application/pdf",
        uploadedAt: new Date(),
      };

      next();
    } catch (uploadError) {
      console.error("Cloudinary license upload error:", uploadError);

      return res.status(500).json({
        success: false,
        message: "Unable to upload hospital license document.",
      });
    }
  });
};

export default uploadHospitalLicense;
