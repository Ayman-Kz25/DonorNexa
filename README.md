# DonorNexa
### A Smart Emergency Blood-Donor Coordination Portal

DonorNexa is a web-based blood-donor coordination platform that connects hospitals with eligible blood donors. It helps hospitals create emergency blood requests, automatically identifies potentially suitable donors, manages donor responses, and maintains blood inventory and donation records.

The platform provides separate interfaces for public visitors, donors, hospitals, and administrators.

---

## 1. Technology Stack

### Frontend
- React.js
- Vite
- Tailwind CSS
- Axios
- React Router
- Lucide React
- Recharts

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- Clerk Authentication
- Socket.IO
- Multer
- Cloudinary
- node-cron

---

## 2. Project Structure

The project is organized into separate frontend and backend applications.

```text
DonorNexa/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── scripts/
│   ├── utils/
│   ├── server.js
│   └── package.json
│
└── README.md
```

*Note: Adjust the folder names and structure above to match the actual project directory before submission.*

---

## 3. Prerequisites

Install the following software before running the application:

1. **Node.js:** Install a compatible Node.js LTS version.
2. **npm:** Included with Node.js.
3. **MongoDB Atlas:** A MongoDB database account and connection URI.
4. **Clerk:** An application for authentication and API key configuration.
5. **Code Editor:** Visual Studio Code is recommended.
6. **Web Browser:** Google Chrome or another modern browser.

Verify Node.js and npm installation:

```bash
node -v
npm -v
```

---

## 4. Installation and Setup

### Step 1: Clone or Extract the Project

Open a terminal and navigate to the project directory.

```bash
cd DonorNexa
```

If the project is downloaded as a ZIP file, extract it first and open the extracted folder.

### Step 2: Install Backend Dependencies

Navigate to the backend directory:

```bash
cd server
```

Install the dependencies:

```bash
npm install
```

### Step 3: Configure Backend Environment Variables

Create a `.env` file inside the `server` directory.

Add the required environment variables:

```env
PORT=5000

CLIENT_URL=http://localhost:5173

MONGO_URI=your_mongodb_connection_string

CLERK_SECRET_KEY=your_clerk_secret_key

CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

DONOR_RESPONSE_WINDOW_HOURS=2
```

Add other environment variables required by the actual project configuration, such as Cloudinary credentials, upload settings, or other service keys.

**Important:**
- Replace placeholder values with your own credentials.
- Do not share your secret keys.
- Never upload the `.env` file to a public GitHub repository.
- Ensure the MongoDB Atlas database allows connections from your development environment.

### Step 4: Configure MongoDB Atlas

1. Sign in to MongoDB Atlas.
2. Create a cluster if you do not already have one.
3. Create a database user.
4. Configure network access for your development environment.
5. Copy the MongoDB connection string.
6. Add the connection string to `MONGO_URI` in the backend `.env` file.

Example format:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
```

Replace the placeholders with your actual database credentials and cluster information.

### Step 5: Configure Clerk Authentication

1. Create a Clerk application.
2. Configure the required authentication methods.
3. Copy the Clerk publishable key.
4. Copy the Clerk secret key.
5. Add both keys to the appropriate environment files.
6. Verify that the frontend and backend use the correct Clerk configuration.

### Step 6: Configure Frontend Environment Variables

Navigate to the frontend directory:

```bash
cd ../client
```

Create a `.env` file in the `client` directory.

Add:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=http://localhost:5000
```

*Use the exact variable names expected by your frontend configuration.*

### Step 7: Install Frontend Dependencies

Run:

```bash
npm install
```

---

## 5. Database Seeding

DonorNexa includes a seed script to prepare demonstration data.

The seed script prepares:

| Data | Quantity |
|---|---:|
| Cities | 5 |
| Hospitals | 5 |
| Donors | 30 |
| Blood Requests | 20 |
| Blood Inventory Records | 40 |

It also generates matching records and notifications through the donor-matching service.

To execute the seed script, navigate to the backend directory:

```bash
cd ../server
```

Run:

```bash
npm run seed
```

Make sure the backend `.env` file contains a valid `MONGO_URI` before running the script.

**Important:** The seed script checks for existing seed requests and prevents running again when those records already exist. Review the database before attempting to reseed.

---

## 6. Running the Application

The frontend and backend must run in separate terminal windows.

### Terminal 1: Start Backend

```bash
cd server
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

### Terminal 2: Start Frontend

```bash
cd client
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

Open the frontend URL in your browser:

**http://localhost:5173**

*The ports above assume the default project configuration.*

---

## 7. Main System Modules

### Public Module
- View public emergency blood requests.
- View platform information.
- Register and sign in.

### Donor Module
- Manage donor profile.
- Set donation availability.
- View matching requests.
- Accept or decline requests.
- View donation history.
- Receive notifications.

### Hospital Module
- Register hospital details.
- Submit license documents.
- Manage blood requests.
- View matching donors.
- Manage blood inventory.
- Confirm completed donations.

### Admin Module
- View platform analytics.
- Manage users and hospitals.
- Verify hospital registrations.
- Manage cities and system settings.
- View audit logs.
- Access administrative reports.

---

## 8. Important Business Rules

- Donors must meet the configured eligibility conditions.
- The donor eligibility age range is 18–60 years.
- The minimum donor weight is 50 kg.
- The default donation cooldown is 90 days and can be configured.
- Blood-group compatibility is considered during donor matching.
- Donor ranking considers compatibility, location, donation history, and response information.
- Donor phone numbers are protected until the appropriate response condition is met.
- Hospitals must be verified before using protected hospital functionality.
- Blood requests have expiry conditions.
- Inventory and donation records are maintained by the system.

---

## 9. Security Considerations

- Authentication is handled through Clerk.
- Protected API routes use authentication and authorization middleware.
- Role-based access control restricts user operations.
- Mongoose schemas provide data validation.
- Unique indexes help prevent duplicate records.
- Donor contact information is protected.
- Important administrative activities can be recorded in audit logs.
- Environment variables are used to store sensitive configuration.

---

## 10. Troubleshooting

| Problem | Possible Solution |
|---|---|
| MongoDB connection failed | Check `MONGO_URI`, database credentials, and Atlas network access |
| Backend does not start | Verify Node.js installation and run `npm install` |
| Frontend does not start | Check dependencies and Vite configuration |
| Authentication error | Verify Clerk keys and frontend/backend configuration |
| API request fails | Check backend status, API URL, and CORS configuration |
| File upload fails | Verify upload middleware and storage configuration |
| Seed script fails | Check database connection and whether seed data already exists |
| Notifications do not appear | Verify Socket.IO configuration and authenticated connection |

---

## 11. Project Limitations

- DonorNexa does not replace professional medical judgment or hospital blood-bank procedures.
- Donor information depends on accurate user-provided data.
- The application requires an internet connection for its configured cloud services.
- Real-world deployment requires further security, privacy, operational, and compliance evaluation.

---

## 12. Future Enhancements

- Mobile application.
- SMS and WhatsApp notifications.
- Location-based donor discovery.
- Advanced demand forecasting.
- Additional hospital integrations.
- Multilingual interface.
- Enhanced analytics and reporting.

---

## 13. Developers

**Project:** DonorNexa  
**Department:** Software Engineering  
**University:** Mehran University of Engineering and Technology, Jamshoro  
**Course:** Web Engineering – Complex Engineering Problem (CEP)

**Developed By:**  
Ayman Kz (23SW011)

**Project Supervisor:**  
Sir Din Muhammad

---

## 14. License

This project was developed for academic purposes as part of the Web Engineering Complex Engineering Problem (CEP) course.