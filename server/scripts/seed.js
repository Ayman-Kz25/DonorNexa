import dotenv from "dotenv";
import mongoose from "mongoose";

import User from "../models/User.js";
import City from "../models/City.js";
import Donor from "../models/Donor.js";
import Hospital from "../models/Hospital.js";
import BloodRequest from "../models/BloodRequest.js";
import BloodInventory from "../models/BloodInventory.js";
import { generateRequestMatches } from "../services/requestMatchingService.js";

dotenv.config();

const seedDatabase = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from the .env file.");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected.");

    const existingSeedRequests = await BloodRequest.countDocuments({
      hospitalNotes: /^SEED REQUEST \d{2}$/,
    });

    if (existingSeedRequests > 0) {
      throw new Error(
        "Seed data already exists. Remove the existing demo data before running the seed script again.",
      );
    }

    // 1. Seed Cities
    const cityNames = [
      "Karachi",
      "Hyderabad",
      "Jamshoro",
      "Islamabad",
      "Lahore",
    ];

    const cities = [];

    for (const name of cityNames) {
      const city = await City.findOneAndUpdate(
        { name },
        { $set: { isActive: true } },
        { new: true, upsert: true, runValidators: true },
      );

      cities.push(city);
    }

    console.log(`${cities.length} cities ready.`);

    // 2. Seed Hospitals
    const hospitalData = [
      {
        hospitalName: "City General Hospital",
        licenseNumber: "SEED-HOSP-001",
        contactPerson: "Ahmed Ali",
        phone: "03001234561",
        email: "citygeneral@donornexa.test",
        address: "Shahrah-e-Faisal",
        city: "Karachi",
      },
      {
        hospitalName: "Hyderabad Medical Center",
        licenseNumber: "SEED-HOSP-002",
        contactPerson: "Sara Ahmed",
        phone: "03001234562",
        email: "hyderabadmedical@donornexa.test",
        address: "Autobahn Road",
        city: "Hyderabad",
      },
      {
        hospitalName: "Jamshoro Institute Hospital",
        licenseNumber: "SEED-HOSP-003",
        contactPerson: "Usman Khan",
        phone: "03001234563",
        email: "jamshorohospital@donornexa.test",
        address: "University Road",
        city: "Jamshoro",
      },
      {
        hospitalName: "Islamabad Central Hospital",
        licenseNumber: "SEED-HOSP-004",
        contactPerson: "Ayesha Malik",
        phone: "03001234564",
        email: "islamabadcentral@donornexa.test",
        address: "G-8 Markaz",
        city: "Islamabad",
      },
      {
        hospitalName: "Lahore Care Hospital",
        licenseNumber: "SEED-HOSP-005",
        contactPerson: "Bilal Hussain",
        phone: "03001234565",
        email: "lahorecare@donornexa.test",
        address: "Johar Town",
        city: "Lahore",
      },
    ];

    const hospitals = [];

    for (let i = 0; i < hospitalData.length; i++) {
      const data = hospitalData[i];

      const city = cities.find((item) => item.name === data.city);

      const user = await User.findOneAndUpdate(
        { clerkUserId: `seed_hospital_${i + 1}` },
        {
          $set: {
            name: data.contactPerson,
            email: data.email,
            phone: data.phone,
            role: "hospital",
            city: city._id,
            isActive: true,
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        },
      );

      const hospital = await Hospital.findOneAndUpdate(
        { licenseNumber: data.licenseNumber },
        {
          $set: {
            user: user._id,
            hospitalName: data.hospitalName,
            contactPerson: data.contactPerson,
            address: data.address,
            city: data.city,
            verificationStatus: "verified",
            verifiedAt: new Date(),
            isActive: true,
            licenseExpiryDate: new Date("2028-12-31"),
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        },
      );

      hospitals.push(hospital);
    }

    console.log(`${hospitals.length} hospitals ready.`);

    // 3. Seed Donors
    const donorNames = [
      "Ali Raza",
      "Ahmed Khan",
      "Sara Malik",
      "Fatima Noor",
      "Usman Ali",
      "Ayesha Ahmed",
      "Hassan Raza",
      "Zainab Khan",
      "Bilal Ahmed",
      "Maryam Ali",
      "Hamza Siddiqui",
      "Hira Shah",
      "Omar Farooq",
      "Sana Iqbal",
      "Daniyal Khan",
      "Amna Raza",
      "Saad Ahmed",
      "Maham Noor",
      "Taha Malik",
      "Laiba Hussain",
      "Abdullah Shah",
      "Iqra Ali",
      "Rayyan Ahmed",
      "Anaya Khan",
      "Farhan Raza",
      "Mishal Ahmed",
      "Huzaifa Ali",
      "Eman Fatima",
      "Arham Siddiqui",
      "Noor Hassan",
    ];

    const bloodGroups = [
      "O+",
      "A+",
      "B+",
      "AB+",
      "O-",
      "A-",
      "B+",
      "O+",
      "AB-",
      "A+",
      "B-",
      "O+",
      "B+",
      "A-",
      "O+",
      "AB+",
      "B-",
      "O-",
      "A+",
      "B+",
      "O+",
      "AB-",
      "A-",
      "B+",
      "O+",
      "A+",
      "AB+",
      "O-",
      "B-",
      "A+",
    ];

    const donorCityNames = [
      "Karachi",
      "Hyderabad",
      "Jamshoro",
      "Islamabad",
      "Lahore",
    ];

    const donorAges = [
      22, 25, 28, 21, 30, 24, 32, 27, 35, 23, 29, 26, 34, 31, 22, 28, 36, 25,
      33, 24, 40, 27, 30, 21, 38, 26, 32, 23, 35, 29,
    ];

    const donors = [];

    for (let i = 0; i < 30; i++) {
      const cityName = donorCityNames[i % donorCityNames.length];
      const city = cities.find((item) => item.name === cityName);

      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - donorAges[i]);

      const email = `donor${String(i + 1).padStart(2, "0")}@donornexa.test`;
      const phone = `030012346${String(i + 1).padStart(2, "0")}`;
      const clerkUserId = `seed_donor_${String(i + 1).padStart(2, "0")}`;

      const user = await User.findOneAndUpdate(
        { clerkUserId },
        {
          $set: {
            name: donorNames[i],
            email,
            phone,
            role: "donor",
            city: city._id,
            isActive: true,
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        },
      );

      const donor = await Donor.findOneAndUpdate(
        { user: user._id },
        {
          $set: {
            bloodGroup: bloodGroups[i],
            dateOfBirth: birthDate,
            weight: 50 + (i % 16),
            city: cityName,
            isAvailable: true,
            lastDonationDate: null,
            eligibleAgainDate: null,
            totalDonations: 0,
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        },
      );

      donors.push(donor);
    }

    console.log(`${donors.length} donors ready.`);

    // 4. Seed Blood Requests
    const requestBloodGroups = [
      "O-",
      "A+",
      "B+",
      "AB-",
      "O+",
      "B-",
      "A-",
      "AB+",
      "A+",
      "O+",
      "B-",
      "AB-",
      "B+",
      "O-",
      "AB+",
      "A-",
      "O+",
      "A+",
      "B+",
      "O-",
    ];

    const requestUrgencies = ["critical", "urgent", "normal", "normal"];

    const requests = [];

    for (let i = 0; i < 20; i++) {
      const hospitalIndex = Math.floor(i / 4);
      const hospital = hospitals[hospitalIndex];

      const requiredBy = new Date();
      requiredBy.setDate(requiredBy.getDate() + 2 + (i % 6));

      const seedNote = `SEED REQUEST ${String(i + 1).padStart(2, "0")}`;

      const request = await BloodRequest.findOneAndUpdate(
        {
          hospital: hospital._id,
          hospitalNotes: seedNote,
        },
        {
          $set: {
            hospital: hospital._id,
            city: hospital.city,
            bloodGroup: requestBloodGroups[i],
            unitsRequired: (i % 3) + 1,
            unitsReserved: 0,
            unitsFulfilled: 0,
            urgency: requestUrgencies[i % 4],
            requiredBy,
            expiresAt: requiredBy,
            status: "open",
            hospitalNotes: seedNote,
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        },
      );

      requests.push(request);
    }

    console.log(`${requests.length} blood requests ready.`);

    // Generate donor matches and notifications for seeded requests
    for (const request of requests) {
      await generateRequestMatches(request);
    }

    console.log("Request matches and notifications generated.");

    // 5. Seed Hospital Blood Inventory
    const inventoryBloodGroups = [
      "A+",
      "A-",
      "B+",
      "B-",
      "AB+",
      "AB-",
      "O+",
      "O-",
    ];

    for (const hospital of hospitals) {
      for (const bloodGroup of inventoryBloodGroups) {
        const unitsAvailable =
          (hospital.hospitalName.length + bloodGroup.length) % 9;

        await BloodInventory.findOneAndUpdate(
          {
            hospital: hospital._id,
            bloodGroup,
          },
          {
            $set: {
              unitsAvailable,
              lastUpdated: new Date(),
            },
          },
          {
            new: true,
            upsert: true,
            runValidators: true,
          },
        );
      }
    }

    console.log(
      `${hospitals.length * inventoryBloodGroups.length} inventory records ready.`,
    );
  } catch (error) {
    console.error("Seed error:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedDatabase();
