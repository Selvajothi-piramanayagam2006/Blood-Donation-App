
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { Dropbox } = require("dropbox");
const mongoose = require("mongoose");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// ======================================================
// FIREBASE ADMIN SDK
// ======================================================

const serviceAccount = require("./firebase-service-account.json");

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const firebaseAdminAuth = getAuth();

console.log("Firebase Admin initialized successfully");

// ======================================================
// MULTER - STORE UPLOADED FILE IN MEMORY
// ======================================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB maximum
  }
});

// ======================================================
// DROPBOX CONFIGURATION
// ======================================================

function getDropboxClient() {
  const accessToken = process.env.DROPBOX_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      "DROPBOX_ACCESS_TOKEN is missing from server/.env"
    );
  }

  return new Dropbox({
    accessToken
  });
}

// ======================================================
// MONGODB CONNECTION
// ======================================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Atlas connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error.message);
  });

// ======================================================
// DONOR SCHEMA
// ======================================================

const donorSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    default: ""
  },
  city: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  bloodGroup: {
    type: String,
    required: true
  },
  proofFileName: {
    type: String,
    default: ""
  },
  proofDropboxPath: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Donor = mongoose.model("Donor", donorSchema);

// ======================================================
// BLOOD REQUEST SCHEMA
// ======================================================

const bloodRequestSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: true
  },
  bloodGroup: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  hospitalName: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  unitsRequired: {
    type: Number,
    required: true
  },
  urgency: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const BloodRequest = mongoose.model(
  "BloodRequest",
  bloodRequestSchema,
  "bloodrequests"
);

// ======================================================
// HOME TEST ROUTE
// ======================================================

app.get("/", (req, res) => {
  res.send("Blood Donation Backend Running");
});

// ======================================================
// FIREBASE CUSTOM TOKEN
// ======================================================

app.post("/api/firebase/custom-token", async (req, res) => {
  try {
    const { uid, email } = req.body;

    if (!uid) {
      return res.status(400).json({
        message: "User UID is required"
      });
    }

    const customToken =
      await firebaseAdminAuth.createCustomToken(uid, {
        email: email || ""
      });

    console.log("Firebase custom token created");

    return res.json({ customToken });
  } catch (error) {
    console.error(
      "Firebase Custom Token Error:",
      error.message
    );

    return res.status(500).json({
      message: "Failed to create Firebase custom token",
      error: error.message
    });
  }
});

// ======================================================
// DROPBOX FILE UPLOAD
// ======================================================

app.post(
  "/api/dropbox/upload",
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No file selected"
        });
      }

      const dropbox = getDropboxClient();

      // Upload into the root of the Dropbox App Folder.
      // The API path is relative to the app folder.
      const safeFileName = req.file.originalname
        .replace(/[\\/]/g, "_")
        .replace(/[\r\n]/g, "_");

      const fileName =
        `${Date.now()}-${safeFileName}`;

      const result = await dropbox.filesUpload({
        path: `/${fileName}`,
        contents: req.file.buffer,
        autorename: true
      });

      const uploadedFile = result.result;

      console.log(
        "Dropbox upload successful:",
        uploadedFile.path_display || uploadedFile.name
      );

      return res.status(200).json({
        message: "File uploaded successfully",
        name: uploadedFile.name,
        path: uploadedFile.path_display
      });
    } catch (error) {
      // Log the useful error, but never log the access token.
      const details =
        error?.error?.error_summary ||
        error?.error?.user_message?.text ||
        error?.message ||
        "Unknown Dropbox error";

      console.error("Dropbox upload failed:", details);

      return res.status(500).json({
        message: "Dropbox upload failed",
        error: details
      });
    }
  }
);

// ======================================================
// SAVE DONOR TO MONGODB
// ======================================================

app.post("/api/donors", async (req, res) => {
  try {
    const {
      uid,
      name,
      email,
      city,
      phone,
      bloodGroup,
      proofFileName,
      proofDropboxPath
    } = req.body;

    if (!uid || !name || !city || !phone || !bloodGroup) {
      return res.status(400).json({
        message: "Required donor fields are missing"
      });
    }

    const donor = new Donor({
      uid,
      name,
      email,
      city,
      phone,
      bloodGroup,
      proofFileName,
      proofDropboxPath
    });

    const savedDonor = await donor.save();

    console.log("Donor saved to MongoDB:", savedDonor._id);

    return res.status(201).json({
      message: "Donor saved to MongoDB successfully",
      donorId: savedDonor._id
    });
  } catch (error) {
    console.error("MongoDB Donor Save Error:", error.message);

    return res.status(500).json({
      message: "Failed to save donor to MongoDB",
      error: error.message
    });
  }
});

// ======================================================
// SAVE BLOOD REQUEST TO MONGODB
// ======================================================

app.post("/api/requests", async (req, res) => {
  try {
    const {
      patientName,
      bloodGroup,
      city,
      hospitalName,
      contactNumber,
      unitsRequired,
      urgency
    } = req.body;

    if (
      !patientName ||
      !bloodGroup ||
      !city ||
      !hospitalName ||
      !contactNumber ||
      unitsRequired == null ||
      Number(unitsRequired) <= 0 ||
      !urgency
    ) {
      return res.status(400).json({
        message: "Please fill all fields with valid values"
      });
    }

    const request = new BloodRequest({
      patientName,
      bloodGroup,
      city,
      hospitalName,
      contactNumber,
      unitsRequired: Number(unitsRequired),
      urgency
    });

    const savedRequest = await request.save();

    console.log("Blood request saved:", savedRequest._id);

    return res.status(201).json({
      message: "Blood request saved successfully",
      requestId: savedRequest._id
    });
  } catch (error) {
    console.error("Blood Request Save Error:", error.message);

    return res.status(500).json({
      message: "Failed to save blood request",
      error: error.message
    });
  }
});

// ======================================================
// START SERVER
// ======================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
