🩸 BloodConnect – Blood Donation Application

A cloud-integrated web application designed to connect blood donors with patients and caregivers who need blood.

📌 Project Overview

BloodConnect is a web-based blood donation management application that simplifies donor registration and blood request submission. It allows users to sign in, register as blood donors, and submit blood requests by providing patient and hospital details.

The application integrates multiple cloud services for authentication, database management, and file storage.

✨ Features

User Authentication: Secure user sign-in using Auth0 with Google OAuth.

Donor Registration: Register donors with their name, email, city, phone number, and blood group.

Blood Request: Submit blood requests with patient name, blood group, city, hospital, contact number, required units, and urgency.

Cloud Database: Store donor details in Firebase Cloud Firestore.

Request Management: Store blood request records in MongoDB Atlas.

File Upload: Upload supporting proof images to Dropbox.

User Dashboard: Access donor registration and blood request options.

🛠️ Technologies Used

Frontend:

React.js, HTML, CSS, JavaScript

Backend:

Node.js

Authentication:

Auth0, Google OAuth

Cloud Database:

Firebase, Cloud Firestore, MongoDB Atlas

Cloud Storage:

Dropbox

Hosting:

Firebase

Development Tools:

Visual Studio Code, npm

🏗️ Application Architecture

The application follows a frontend-backend architecture integrated with cloud services.

React.js provides the user interface.

Auth0 handles user authentication.

Node.js backend processes application requests.

Firebase Firestore stores donor information.

MongoDB Atlas stores blood request information.

Dropbox stores uploaded proof images.

⚙️ Installation and Setup

Prerequisites

Node.js and npm

MongoDB Atlas account

Firebase project

Auth0 application

Dropbox developer application
