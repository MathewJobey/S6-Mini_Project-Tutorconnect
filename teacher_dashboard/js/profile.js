// Load and Update Profile Data
async function loadProfile() {
    try {
      const email = localStorage.getItem('userEmail');
      if (!email) {
        window.location.href = 'auth_teach.html';
        return;
      }
      const response = await fetch(`http://localhost:5000/api/teacher/profile/${email}`, {
        headers: {
          'Authorization': email,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          window.location.href = 'auth_teach.html';
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const profile = await response.json();
      updateProfileUI(profile);
      // Load students after updating profile
      loadStudents();
    } catch (error) {
      console.error('Error loading profile:', error);
      alert('Failed to load profile. Please try again later.');
    }
  }
  
  function updateProfileUI(profile) {
    // Helper to update text content
    const updateElement = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
  
    updateElement('teacherName', profile.name || 'Teacher');
    updateElement('teacherEmail', profile.email || profile.userId);
    updateElement('profileName', profile.name || 'Not specified');
    updateElement('profileEmail', profile.email || profile.userId);
    updateElement('profileGender', profile.gender || 'Not specified');
    updateElement('profileAge', profile.age || 'Not specified');
    updateElement('profilePhone', profile.phone || 'Not specified');
    updateElement('profileExperience', profile.experience || 'Not specified');
    updateElement('profileAddress', profile.address || 'Not specified');
  
    // Update subjects list
    const subjectsContainer = document.getElementById('profileSubjects');
    if (subjectsContainer) {
      if (profile.subjects && profile.subjects.length > 0) {
        subjectsContainer.innerHTML = profile.subjects
          .map(subj => `<span class="subject-tag">${subj}</span>`)
          .join('');
      } else {
        subjectsContainer.innerHTML = '<span class="text-muted">No subjects specified</span>';
      }
    }
  
    // Update verification badge
    const verificationStatus = document.getElementById('verificationStatus');
    if (verificationStatus) {
      const status = profile.verificationStatus || 'Pending';
      verificationStatus.innerHTML = `<i class="fas ${status === 'Verified' ? 'fa-check-circle' : 'fa-clock'}"></i> ${status}`;
      verificationStatus.classList.toggle('pending', status !== 'Verified');
    }
  
    // Update profile image with initials
    const profileImage = document.getElementById('profileImage');
    if (profileImage && profile.name) {
      profileImage.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`;
    }
  }
  
  function editProfile() {
    const email = localStorage.getItem('userEmail');
    if (!email) {
        window.location.href = '../auth_teach.html';
        return;
    }
    localStorage.setItem('editMode', 'true');
    window.location.href = 'teacher_profile_setup.html?edit=true';
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        window.location.href = '../auth_teach.html';
    }
}

  document.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
      loadProfile();
    }
  });
