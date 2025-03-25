// Load and Update Students Data
async function loadStudents() {
    try {
      const email = localStorage.getItem('userEmail');
      const response = await fetch(`http://localhost:5000/api/teacher/students/${email}`, {
        headers: {
          'Authorization': email
        }
      });
      if (!response.ok) throw new Error('Failed to fetch students');
      const students = await response.json();
      updateStudentsUI(students);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  }
  
  function updateStudentsUI(students) {
    const grid = document.getElementById('studentsGrid');
    if (!grid) return;
  
    if (!students || students.length === 0) {
      grid.innerHTML = `
        <div class="student-card">
          <div class="student-header">
            <div class="student-avatar">
              <i class="fas fa-user-graduate"></i>
            </div>
            <div class="student-info">
              <h4>No Students Yet</h4>
              <p>Start adding students to your roster</p>
            </div>
          </div>
        </div>
      `;
      return;
    }
  
    grid.innerHTML = students
      .map(student => `
        <div class="student-card">
          <div class="student-header">
            <div class="student-avatar">
              ${student.name.charAt(0)}
            </div>
            <div class="student-info">
              <h4>${student.name}</h4>
              <p>${student.email}</p>
              ${student.activeSession ? '<span class="verification-badge">Active</span>' : ''}
            </div>
          </div>
          <div class="student-subjects">
            ${student.subjects.map(subject => `<span class="subject-tag">${subject}</span>`).join('')}
          </div>
          <div class="progress-bar">
            <div class="progress" style="width: ${student.progress || 0}%"></div>
          </div>
        </div>
      `)
      .join('');
  
    // Animate student cards with a slight delay per card
    const cards = grid.querySelectorAll('.student-card');
    cards.forEach((card, index) => {
      card.style.animationDelay = `${index * 0.1}s`;
      card.classList.add('animate-in');
    });
  
    // If you have elements to display stats, animate them using animateNumber (from utils.js)
    const stats = {
      totalStudents: students.length,
      activeSessions: students.filter(s => s.activeSession).length,
      totalHours: students.reduce((acc, s) => acc + (s.totalHours || 0), 0)
    };
    Object.entries(stats).forEach(([key, value]) => {
      const element = document.getElementById(key);
      if (element) {
        animateNumber(element, 0, value);
      }
    });
  }
  