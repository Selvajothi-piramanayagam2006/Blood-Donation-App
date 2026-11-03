import React, { useState } from "react";

function RequestForm() {

  const [formData, setFormData] = useState({
    patientName: "",
    bloodGroup: "",
    city: "",
    hospitalName: "",
    contactNumber: "",
    unitsRequired: "",
    urgency: ""
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

  };


  const handleSubmit = async (e) => {

    e.preventDefault();

    setMessage("Submitting request...");

    try {

      const response = await fetch(
        "http://localhost:5000/api/requests",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            ...formData,
            unitsRequired:
              Number(formData.unitsRequired)
          })
        }
      );


      // Read response as text first
      const text = await response.text();

      console.log(
        "Backend response:",
        text
      );


      // Try to convert response to JSON
      let result;

      try {

        result = JSON.parse(text);

      } catch (jsonError) {

        throw new Error(
          "Server returned an invalid response."
        );
      }


      if (!response.ok) {

        throw new Error(
          result.message ||
          "Request failed"
        );
      }


      setMessage(
        "🎉 Blood request submitted successfully!"
      );


      setFormData({
        patientName: "",
        bloodGroup: "",
        city: "",
        hospitalName: "",
        contactNumber: "",
        unitsRequired: "",
        urgency: ""
      });


    } catch (error) {

      console.error(
        "Request error:",
        error
      );

      setMessage(
        "Error: " + error.message
      );
    }
  };


  return (

    <div className="card">

      <h2>
        🚨 Blood Request Form
      </h2>

      <p>
        Enter the details of the person
        who needs blood.
      </p>


      <form
        onSubmit={handleSubmit}
      >

        <label>
          Patient Name
        </label>

        <input
          type="text"
          name="patientName"
          value={formData.patientName}
          onChange={handleChange}
          required
        />


        <label>
          Blood Group
        </label>

        <select
          name="bloodGroup"
          value={formData.bloodGroup}
          onChange={handleChange}
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
          City
        </label>

        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleChange}
          required
        />


        <label>
          Hospital Name
        </label>

        <input
          type="text"
          name="hospitalName"
          value={formData.hospitalName}
          onChange={handleChange}
          required
        />


        <label>
          Contact Number
        </label>

        <input
          type="tel"
          name="contactNumber"
          value={formData.contactNumber}
          onChange={handleChange}
          required
        />


        <label>
          Units Required
        </label>

        <input
          type="number"
          name="unitsRequired"
          value={formData.unitsRequired}
          onChange={handleChange}
          min="1"
          required
        />


        <label>
          Urgency
        </label>

        <select
          name="urgency"
          value={formData.urgency}
          onChange={handleChange}
          required
        >

          <option value="">
            Select Urgency
          </option>

          <option value="Normal">
            Normal
          </option>

          <option value="Urgent">
            Urgent
          </option>

          <option value="Emergency">
            Emergency
          </option>

        </select>


        <button
          type="submit"
        >
          Submit Blood Request 🚨
        </button>

      </form>


      {message && (

        <p>
          {message}
        </p>

      )}

    </div>
  );
}

export default RequestForm;