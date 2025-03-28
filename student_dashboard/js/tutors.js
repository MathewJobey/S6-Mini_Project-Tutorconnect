// Load and Update Courses Data
async function loadCourses() {
    try {
        const email = localStorage.getItem('userEmail');
        const response = await fetch(`http://localhost:5000/api/student/courses/${email}`, {
            headers: {
                'Authorization': email
            }
        });
        if (!response.ok) throw new Error('Failed to fetch courses');
        const courses = await response.json();
        updateCoursesUI(courses);
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}

function updateCoursesUI(courses) {
    const grid = document.getElementById('coursesGrid');
    if (!grid) return;

    if (!courses || courses.length === 0) {
        grid.innerHTML = `
            <div class="course-card empty-state">
                <div class="course-icon">
                    <i class="fas fa-book-open"></i>
                </div>
                <h4>No Courses Yet</h4>
                <p>Enroll in courses to get started with your learning journey</p>
                <button class="action-btn" onclick="openCourseFinder()">
                    <i class="fas fa-plus"></i> Find Courses
                </button>
            </div>
        `;
        return;
    }

    grid.innerHTML = courses
        .map(course => `
            <div class="course-card">
                <div class="course-header">
                    <div class="course-icon">
                        <i class="fas fa-${getCourseIcon(course.subject)}"></i>
                    </div>
                    <div class="course-info">
                        <h4>${course.title}</h4>
                        <p>${course.subject}</p>
                    </div>
                    ${course.active ? '<span class="status-badge active">Active</span>' : ''}
                </div>
                <div class="tutor-info">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(course.tutor.name)}&background=random" alt="${course.tutor.name}" class="tutor-avatar" />
                    <span>${course.tutor.name}</span>
                </div>
                <div class="course-progress">
                    <div class="progress-label">
                        <span>Progress</span>
                        <span>${course.progress || 0}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${course.progress || 0}%"></div>
                    </div>
                </div>
                <div class="course-footer">
                    <button class="action-btn" onclick="openCourse('${course.id}')">
                        Continue Learning
                    </button>
                </div>
            </div>
        `)
        .join('');

    const cards = grid.querySelectorAll('.course-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('animate-in');
    });

    const stats = {
        totalCourses: courses.length,
        activeCourses: courses.filter(c => c.active).length,
        totalHours: courses.reduce((acc, c) => acc + (c.hoursSpent || 0), 0)
    };
    
    const totalCoursesElement = document.getElementById('totalCourses');
    if (totalCoursesElement) {
        animateNumber(totalCoursesElement, 0, stats.totalCourses);
    }

    const totalHoursElement = document.getElementById('totalHours');
    if (totalHoursElement) {
        animateNumber(totalHoursElement, 0, stats.totalHours);
    }
}

function getCourseIcon(subject) {
    const iconMap = {
        'Mathematics': 'calculator',
        'Physics': 'atom',
        'Chemistry': 'flask',
        'Biology': 'dna',
        'Computer Science': 'laptop-code',
        'History': 'landmark',
        'English': 'book',
        'Literature': 'feather-alt',
        'Geography': 'globe-americas',
        'Music': 'music',
        'Art': 'palette'
    };
    
    return iconMap[subject] || 'book-open';
}

function openCourseFinder() {
    window.location.href = 'course_finder.html';
}

function openCourse(courseId) {
    window.location.href = `course_detail.html?id=${courseId}`;
}

function openTutorFinder() {
    window.location.href = 'map.html';
}