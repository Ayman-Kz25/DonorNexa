import multer from "multer";
import path from "path";
import sharp from "sharp";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
    fields: 0,
  },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const validExtensions = [".jpg", ".jpeg", ".png"];

    if (!validExtensions.includes(extension)) {
      return cb(new Error("Only JPG and PNG images are allowed."));
    }

    cb(null, true);
  },
});

const uploadDonorPhoto = (req, res, next) => {
  upload.single("profilePhoto")(req, res, async (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "Profile photo must not exceed 2 MB."
            : error.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a profile photo.",
      });
    }

    try {
      // Read actual image metadata instead of trusting the file extension.
      const metadata = await sharp(req.file.buffer, {
        limitInputPixels: 25_000_000,
        failOn: "error",
      }).metadata();

      // Validate the actual image format.
      if (!["jpeg", "png"].includes(metadata.format)) {
        return res.status(400).json({
          success: false,
          message: "Only valid JPG and PNG images are allowed.",
        });
      }

      // Decode and re-encode the image.
      let processedBuffer;

      if (metadata.format === "jpeg") {
        processedBuffer = await sharp(req.file.buffer, {
          limitInputPixels: 25_000_000,
          failOn: "error",
        })
          .jpeg({ quality: 85 })
          .toBuffer();
      } else {
        processedBuffer = await sharp(req.file.buffer, {
          limitInputPixels: 25_000_000,
          failOn: "error",
        })
          .png()
          .toBuffer();
      }

      // Replace the original buffer with the validated image.
      req.file.buffer = processedBuffer;

      req.file.mimetype =
        metadata.format === "jpeg" ? "image/jpeg" : "image/png";

      next();
    } catch (validationError) {
      console.error("Donor image validation error:", validationError);

      return res.status(400).json({
        success: false,
        message: "The uploaded file is not a valid image.",
      });
    }
  });
};

export default uploadDonorPhoto;
