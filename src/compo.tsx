import React, { useState } from 'react';

function App() {
  // 1. Create variables to hold the input field texts dynamically
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [qualification, setQualification] = useState('');
  const [pursuing, setPursuing] = useState('');

  // 2. Create the function that fires when clicking "COMPLETE REGISTRATION"
  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Stops the page from reloading automatically

    // Validation: Require Name and Contact info
    if (!firstName || !lastName || !contactNumber) {
      alert("Please fill out First Name, Last Name, and Contact Number.");
      return;
    }

    const payload = { firstName, lastName, contactNumber, qualification, pursuing };

    try {
      // Sends data to the endpoint we modified earlier inside api/registrations.js
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        alert("🎉 Registration data saved to Neon database successfully!");
        
        // Reset the input fields so they are empty again
        setFirstName('');
        setLastName('');
        setContactNumber('');
        setQualification('');
        setPursuing('');
      } else {
        alert("Error saving: " + result.error);
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Could not connect to backend endpoint.");
    }
  };

  return (
    // 3. Connect your existing UI inputs to these variables using value and onChange
    <div className="app-container">
      {/* Look for your existing registration HTML inputs and add value/onChange to them like this: */}
      <input 
        type="text" 
        placeholder="e.g. Liam" 
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)} 
      />
      <input 
        type="text" 
        placeholder="e.g. Vance" 
        value={lastName}
        onChange={(e) => setLastName(e.target.value)} 
      />
      <input 
        type="tel" 
        placeholder="+1 (555) 0199" 
        value={contactNumber}
        onChange={(e) => setContactNumber(e.target.value)} 
      />
      <input 
        type="text" 
        placeholder="e.g. HS" 
        value={qualification}
        onChange={(e) => setQualification(e.target.value)} 
      />
      <input 
        type="text" 
        placeholder="e.g. Science / Arts" 
        value={pursuing}
        onChange={(e) => setPursuing(e.target.value)} 
      />

      {/* Attach the function to your button element */}
      <button onClick={handleRegistrationSubmit}>COMPLETE REGISTRATION</button>
    </div>
  );
}

export default App;
