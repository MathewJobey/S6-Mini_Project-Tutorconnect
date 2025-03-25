// Load and Update Profile Data
async function loadProfile() {
    try {
        const email = localStorage.getItem('userEmail');
        if (!email) {
            window.location.href = '/student_dashboard/auth_stud.html';
            return;
        }
        const response = await fetch(`http://localhost:5000/api/student/profile/${email}`, {
            headers: {
                'Authorization': email,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.clear();
                window.location.href = '/student_dashboard/auth_stud.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const profile = await response.json();
        updateProfileUI(profile);
        // Load courses and tutors after updating profile
        loadCourses();
        loadTutors();
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

    updateElement('studentName', profile.name || 'Student');
    updateElement('studentEmail', profile.email || profile.userId);
    updateElement('profileName', profile.name || 'Not specified');
    updateElement('profileEmail', profile.email || profile.userId);
    updateElement('profileGender', profile.gender || 'Not specified');
    updateElement('profileAge', profile.age || 'Not specified');
    updateElement('profileSchool', profile.school || 'Not specified');
    updateElement('profileGrade', profile.grade || 'Not specified');

    // Update subjects list
    const subjectsContainer = document.getElementById('profileSubjects');
    if (subjectsContainer) {
        if (profile.subjects && profile.subjects.length > 0) {
            subjectsContainer.innerHTML = profile.subjects
                .map(subj => `<span class="subject-tag">${subj}</span>`)
                .join('');
        } else {
            subjectsContainer.innerHTML = '<span class="text-muted">No subjects enrolled</span>';
        }
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
        window.location.href = '../auth_stud.html';
        return;
    }
    localStorage.setItem('editMode', 'true');
    window.location.href = '../student_profile_setup.html?edit=true';
}

document.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
        loadProfile();
    }
});