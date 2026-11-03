import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

import {
  collection,
  addDoc,
  serverTimestamp
} from "firebase/firestore";

import {
  signInWithCustomToken
} from "firebase/auth";

import { db, auth } from "./firebase";

import RequestForm from "./RequestForm";

import "./App.css";


function App() {

  // ============================
  // AUTH0
  // ============================

  const {
    isLoading,
    isAuthenticated,
    user,
    loginWithRedirect,
    logout
  } = useAuth0();


  // ============================
  // CATEGORY
  // ============================

  const [category, setCategory] = useState("");


  // ============================
  // DONOR FORM
  // ============================

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [proofImage, setProofImage] = useState(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);


  // ============================
  // AUTH0 LOGIN
  // ============================

  const handleLogin = () => {
    loginWithRedirect();
  };


  // ============================
  // LOGOUT
  // ============================

  const handleLogout = () => {

    setCategory("");
    setMessage("");

    logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  };


  // ==================================================
  // FIREBASE AUTHENTICATION
  // ==================================================

  const authenticateFirebase = async () => {

    setMessage(
      "Connecting Auth0 with Firebase..."
    );

    const response = await fetch(
      "http://localhost:5000/api/firebase/custom-token",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          uid: user.sub,
          email: user.email || ""
        })
      }
    );


    const result =
      await response.json();


    if (!response.ok) {

      throw new Error(
        result.message ||
        "Firebase authentication failed"
      );
    }


    if (!result.customToken) {

      throw new Error(
        "Firebase custom token was not received"
      );
    }


    // Sign in to Firebase
    await signInWithCustomToken(
      auth,
      result.customToken
    );


    console.log(
      "Firebase authentication successful"
    );
  };


  // ==================================================
  // DONOR REGISTRATION
  // ==================================================

  const handleDonorSubmit = async (e) => {

    e.preventDefault();


    if (!isAuthenticated || !user) {

      setMessage(
        "Please login first."
      );

      return;
    }


    if (
      !name ||
      !city ||
      !phone ||
      !bloodGroup ||
      !proofImage
    ) {

      setMessage(
        "Please fill all fields and select a proof image."
      );

      return;
    }


    try {

      setLoading(true);


      // ==========================================
      // STEP 1 — FIREBASE AUTHENTICATION
      // ==========================================

      await authenticateFirebase();


      // ==========================================
      // STEP 2 — DROPBOX UPLOAD
      // ==========================================

      setMessage(
        "Uploading proof image..."
      );


      const formData =
        new FormData();


      formData.append(
        "file",
        proofImage
      );


      const dropboxResponse =
        await fetch(
          "http://localhost:5000/api/dropbox/upload",
          {
            method: "POST",
            body: formData
          }
        );


      const dropboxResult =
        await dropboxResponse.json();


      if (!dropboxResponse.ok) {

        throw new Error(
          dropboxResult.message ||
          "Dropbox upload failed"
        );
      }


      // ==========================================
      // STEP 3 — SAVE DONOR TO FIRESTORE
      // ==========================================

      setMessage(
        "Saving donor details..."
      );


      const firebaseUser =
        auth.currentUser;


      if (!firebaseUser) {

        throw new Error(
          "Firebase user is not authenticated"
        );
      }


      await addDoc(
        collection(db, "donors"),
        {

          uid:
            firebaseUser.uid,

          name:
            name,

          email:
            user.email || "",

          city:
            city,

          phone:
            phone,

          bloodGroup:
            bloodGroup,

          proofFileName:
            dropboxResult.name,

          proofDropboxPath:
            dropboxResult.path,

          createdAt:
            serverTimestamp()

        }
      );


      // ==========================================
      // SUCCESS
      // ==========================================

      setMessage(
        "🎉 Donor registered successfully!"
      );


      setName("");
      setCity("");
      setPhone("");
      setBloodGroup("");
      setProofImage(null);


      const fileInput =
        document.getElementById(
          "proofImage"
        );


      if (fileInput) {

        fileInput.value = "";

      }


    } catch (error) {

      console.error(
        "Donor registration error:",
        error
      );


      setMessage(
        "Error: " +
        error.message
      );


    } finally {

      setLoading(false);

    }
  };


  // ==================================================
  // LOADING
  // ==================================================

  if (isLoading) {

    return (

      <div className="app">

        <div className="login-page">

          <div className="login-card">

            <h1>
              🩸 BloodConnect
            </h1>

            <p>
              Loading authentication...
            </p>

          </div>

        </div>

      </div>
    );
  }


  // ==================================================
  // SCREEN 1 — AUTH0 LOGIN
  // ==================================================

  if (!isAuthenticated) {

    return (

      <div className="app">

        <div className="login-page">

          <div className="login-card">

            <div className="blood-logo">
              🩸
            </div>


            <h1>
              BloodConnect
            </h1>


            <p className="tagline">
              Connecting donors with people in need
            </p>


            <h2>
              Welcome!
            </h2>


            <p>
              Sign in to continue to the
              Blood Donation Application.
            </p>


            <button
              className="google-button"
              onClick={handleLogin}
            >
              🔐 Continue with OAuth
            </button>


            {message && (

              <p className="message">
                {message}
              </p>

            )}

          </div>

        </div>

      </div>
    );
  }


  // ==================================================
  // SCREEN 2 — CHOOSE CATEGORY
  // ==================================================

  if (!category) {

    return (

      <div className="app">

        <div className="top-bar">

          <div>

            <strong>
              🩸 BloodConnect
            </strong>

          </div>


          <div className="logged-user">

            👤 {user?.name || user?.email}

            <button
              onClick={handleLogout}
              className="logout-button"
            >
              Logout
            </button>

          </div>

        </div>


        <div className="welcome-section">

          <h1>
            Welcome, {user?.name || "User"}!
          </h1>


          <p>
            What would you like to do today?
          </p>

        </div>


        <div className="category-cards">


          {/* DONOR */}

          <div
            className="category-card donor-card"
            onClick={() =>
              setCategory("donor")
            }
          >

            <div className="category-icon">
              🩸
            </div>


            <h2>
              Become a Donor
            </h2>


            <p>
              Register yourself as a blood
              donor and help save lives.
            </p>


            <button>
              Register as Donor →
            </button>

          </div>


          {/* REQUEST */}

          <div
            className="category-card request-card"
            onClick={() =>
              setCategory("request")
            }
          >

            <div className="category-icon">
              🚨
            </div>


            <h2>
              Request Blood
            </h2>


            <p>
              Submit a blood request for
              yourself or someone in need.
            </p>


            <button>
              Request Blood →
            </button>

          </div>

        </div>

      </div>
    );
  }


  // ==================================================
  // SCREEN 3 — DONOR FORM
  // ==================================================

  if (category === "donor") {

    return (

      <div className="app">

        <div className="top-bar">

          <button
            className="back-button"
            onClick={() => {

              setCategory("");
              setMessage("");

            }}
          >
            ← Back
          </button>


          <div className="logged-user">

            👤 {user?.name || user?.email}

            <button
              onClick={handleLogout}
              className="logout-button"
            >
              Logout
            </button>

          </div>

        </div>


        <div className="form-container">

          <div className="donor-form-card">


            <div className="form-title">

              <div className="form-icon">
                🩸
              </div>


              <div>

                <h1>
                  Donor Registration
                </h1>


                <p>
                  Help save a life by becoming
                  a blood donor.
                </p>

              </div>

            </div>


            <div className="user-info">

              <strong>
                Logged in as:
              </strong>

              <br />

              {user?.email}

            </div>


            <form
              onSubmit={handleDonorSubmit}
            >

              <label>
                Full Name
              </label>


              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Enter your full name"
                required
              />


              <label>
                City
              </label>


              <input
                type="text"
                value={city}
                onChange={(e) =>
                  setCity(e.target.value)
                }
                placeholder="Enter your city"
                required
              />


              <label>
                Phone Number
              </label>


              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="Enter your phone number"
                required
              />


              <label>
                Blood Group
              </label>


              <select
                value={bloodGroup}
                onChange={(e) =>
                  setBloodGroup(e.target.value)
                }
                required
              >

                <option value="">
                  Select Blood Group
                </option>

                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>

              </select>


              <label>
                Proof Image
              </label>


              <input
                id="proofImage"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setProofImage(
                    e.target.files[0]
                  )
                }
                required
              />


              <button
                className="submit-button"
                type="submit"
                disabled={loading}
              >

                {loading
                  ? "Processing..."
                  : "Register as Donor 🩸"}

              </button>

            </form>


            {message && (

              <p className="message">
                {message}
              </p>

            )}

          </div>

        </div>

      </div>
    );
  }


  // ==================================================
  // SCREEN 4 — REQUEST FORM
  // ==================================================

  if (category === "request") {

    return (

      <div className="app">

        <div className="top-bar">

          <button
            className="back-button"
            onClick={() => {

              setCategory("");
              setMessage("");

            }}
          >
            ← Back
          </button>


          <div className="logged-user">

            👤 {user?.name || user?.email}

            <button
              onClick={handleLogout}
              className="logout-button"
            >
              Logout
            </button>

          </div>

        </div>


        <div className="form-container">

          <RequestForm />

        </div>

      </div>
    );
  }


  return null;
}


export default App;