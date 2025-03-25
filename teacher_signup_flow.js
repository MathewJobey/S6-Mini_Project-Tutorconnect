// Check if user has completed profile
async function checkProfileStatus(email) {
  try {
    const response = await fetch('/api/teacher/check-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error('Failed to check profile status');
    }

    const data = await response.json();
    return data.exists && data.profileComplete; // Check both existence and profileComplete flag
  } catch (error) {
    console.error('Profile check error:', error);
    return false; // Default to false if there's an error
  }
}

// Handle post-signup flow (Corrected to handle login and signup consistently)
async function handlePostSignup(email) {
  try {
    const hasProfile = await checkProfileStatus(email); // Check profile status
    if (hasProfile) {
      window.location.href = '/teacher_dashboard/index.html';
    } else {
      window.location.href = 'teacher_profile_setup.html';
    }
  } catch (error) {
    console.error('Error in post-signup flow:', error);
    alert('An error occurred while redirecting. Please try again.');
  }
}



// Example usage after login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch('/api/teacher/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (data.success) {
      // Save email to localStorage
      localStorage.setItem('userEmail', email);

      // Redirect based on profile status
      await handlePostSignup(email);
    } else {
      alert(data.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('An error occurred during login. Please try again.');
  }
});

// Initialize location picker
function initLocationPicker() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      document.getElementById('location').value = JSON.stringify({
        type: "Point",
        coordinates: [longitude, latitude]
      });
    });
  }
}

async function submitProfile(formElements) {
  try {
    // Check if latitude and longitude are missing but address is provided
    if (formElements.address && (!formElements.latitude || !formElements.longitude)) {
      try {
        const { lat, lng } = await geocodeAddress(formElements.address);
        formElements.latitude = lat;
        formElements.longitude = lng;
        document.getElementById('latitude').value = lat;
        document.getElementById('longitude').value = lng;
        alert(`Location captured from address:\nLatitude: ${lat}\nLongitude: ${lng}`);
      } catch (error) {
        console.error('Geocoding error:', error);
        alert('Could not determine coordinates from the provided address.');
        return; // Prevent form submission
      }
    }

    // Send the form data to the server
    const response = await fetch('/api/teacher/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formElements),
    });

    const data = await response.json();
    if (data.success) {
      alert('Profile submitted successfully!');
      const email = localStorage.getItem('userEmail'); // Get email from local storage
      if (email) {
      await handlePostSignup(email); // Use handlePostSignup for redirection
      } else {
      window.location.href = '/teacher_dashboard/index.html';
      }
      } else {
        alert(data.error || 'Failed to submit profile.');
      }
    }
  catch (error) {
    console.error('Error submitting profile:', error);
    alert('An error occurred while submitting the profile. Please try again.');
  }
}

async function geocodeAddress(address) {
  const apiKey = '6f7de3ab1aff4d9d95ae57a95a6114d9'; // Replace with your geocoding API key
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`);
  if (!response.ok) {
    throw new Error('Failed to fetch geocoding data');
  }
  const data = await response.json();
  if (data.results.length === 0) {
    throw new Error('No results found for the provided address');
  }
  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng };
}