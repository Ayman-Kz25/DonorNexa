import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const uploadDirectory = path.resolve("private_uploads", "hospital-licenses");

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
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

    // Verify the actual PDF file signature.
    if (req.file.buffer.subarray(0, 5).toString() !== "%PDF-") {
      return res.status(400).json({
        success: false,
        message: "The uploaded file is not a valid PDF.",
      });
    }

    try {
      const generatedName = `${crypto.randomUUID()}.pdf`;
      const filePath = path.join(uploadDirectory, generatedName);

      await fs.promises.writeFile(filePath, req.file.buffer, {
        flag: "wx",
      });

      req.licenseDocument = {
        fileUrl: generatedName,
        fileName: path.basename(req.file.originalname),
        mimeType: "application/pdf",
        uploadedAt: new Date(),
      };

      next();
    } catch (saveError) {
      console.error("License upload error:", saveError);

      return res.status(500).json({
        success: false,
        message: "Unable to save hospital license document.",
      });
    }
  });
};

export default uploadHospitalLicense;
