// student_dashboard/js/map.js

let map;
let studentMarker;
let teacherMarkers = [];
let studentData; // Store student data globally to avoid redundant fetches

async function initMap() {
    try {
        const email = localStorage.getItem('userEmail');
        if (!email) {
            window.location.href = '/student_dashboard/auth_stud.html';
            return;
        }

        const response = await fetch(`http://localhost:5000/api/student/profile/${email}`, {
            headers: { 'Authorization': email }
        });
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.clear();
                window.location.href = '/student_dashboard/auth_stud.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        studentData = await response.json();

        // Validate student location
        if (!studentData.location || !studentData.location.coordinates || studentData.location.coordinates.length !== 2) {
            throw new Error('Student location is missing or invalid');
        }

        const [longitude, latitude] = studentData.location.coordinates;

        // Initialize map
        map = L.map('map').setView([latitude, longitude], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Ensure map renders correctly
        map.invalidateSize();

        // Add student marker
        studentMarker = L.marker([latitude, longitude]).addTo(map);
        studentMarker.bindPopup('Your Location').openPopup();

        // Load teachers within 500m by default (allowed radii: 500m, 5km, 10km)
        loadTeachers(500);
    } catch (error) {
        console.error('Error initializing map:', error);
        alert('Failed to load map. Please try again.');
    }
}

async function loadTeachers(range) {
    teacherMarkers.forEach(marker => map.removeLayer(marker));
    teacherMarkers = [];

    const mapMessage = document.getElementById('map-message');
    mapMessage.style.display = 'none'; // Hide by default

    try {
        if (!studentData) {
            throw new Error('Student data not available');
        }

        const [longitude, latitude] = studentData.location.coordinates;
        const subjects = studentData.subjects || [];
        const email = localStorage.getItem('userEmail');

        // Only allow specific radius values: 500m, 5km, or 10km (in meters)
        let maxDistance;
        if (range === 500 || range === 5000 || range === 10000) {
            maxDistance = range;
        } else {
            maxDistance = 5000; // default to 5km if an invalid value is provided
        }

        const body = {
            latitude,
            longitude,
            subjects,
            maxDistance
        };
        const teachersResponse = await fetch('http://localhost:5000/api/student/find-teachers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': email
            },
            body: JSON.stringify(body)
        });
        if (!teachersResponse.ok) throw new Error('Failed to fetch teachers');
        const data = await teachersResponse.json();
        const teachers = data.teachers || [];

        if (teachers.length === 0) {
            mapMessage.textContent = 'No registered teachers found within the selected range.';
            mapMessage.style.display = 'block';
            return;
        }

        teachers.forEach(teacher => {
            if (!teacher.location || !teacher.location.coordinates || teacher.location.coordinates.length !== 2) {
                console.warn(`Invalid location for teacher ${teacher.name}, skipping...`);
                return;
            }

            const [teacherLon, teacherLat] = teacher.location.coordinates;
            const marker = L.marker([teacherLat, teacherLon]).addTo(map);
            const popupContent = `
                <div class="card">
                    <div class="card__img">
                        <svg xmlns="http://www.w3.org/2000/svg" width="100%">
                            <rect fill="#ffffff" width="540" height="450"></rect>
                            <defs>
                                <linearGradient id="a" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="0" y2="100%" gradientTransform="rotate(222,648,379)">
                                    <stop offset="0" stop-color="#ffffff"></stop>
                                    <stop offset="1" stop-color="#FC726E"></stop>
                                </linearGradient>
                                <pattern patternUnits="userSpaceOnUse" id="b" width="300" height="250" x="0" y="0" viewBox="0 0 1080 900">
                                    <g fill-opacity="0.5">
                                        <polygon fill="#444" points="90 150 0 300 180 300"></polygon>
                                        <polygon points="90 150 180 0 0 0"></polygon>
                                        <polygon fill="#AAA" points="270 150 360 0 180 0"></polygon>
                                        <polygon fill="#DDD" points="450 150 360 300 540 300"></polygon>
                                        <polygon fill="#999" points="450 150 540 0 360 0"></polygon>
                                        <polygon points="630 150 540 300 720 300"></polygon>
                                        <polygon fill="#DDD" points="630 150 720 0 540 0"></polygon>
                                        <polygon fill="#444" points="810 150 720 300 900 300"></polygon>
                                        <polygon fill="#FFF" points="810 150 900 0 720 0"></polygon>
                                        <polygon fill="#DDD" points="990 150 900 300 1080 300"></polygon>
                                        <polygon fill="#444" points="990 150 1080 0 900 0"></polygon>
                                        <polygon fill="#DDD" points="90 450 0 600 180 600"></polygon>
                                        <polygon points="90 450 180 300 0 300"></polygon>
                                        <polygon fill="#666" points="270 450 180 600 360 600"></polygon>
                                        <polygon fill="#AAA" points="270 450 360 300 180 300"></polygon>
                                        <polygon fill="#DDD" points="450 450 360 600 540 600"></polygon>
                                        <polygon fill="#999" points="450 450 540 300 360 300"></polygon>
                                        <polygon fill="#999" points="630 450 540 600 720 600"></polygon>
                                        <polygon fill="#FFF" points="630 450 720 300 540 300"></polygon>
                                        <polygon points="810 450 720 600 900 600"></polygon>
                                        <polygon fill="#DDD" points="810 450 900 300 720 300"></polygon>
                                        <polygon fill="#AAA" points="990 450 900 600 1080 600"></polygon>
                                        <polygon fill="#444" points="990 450 1080 300 900 300"></polygon>
                                        <polygon fill="#222" points="90 750 0 900 180 900"></polygon>
                                        <polygon points="270 750 180 900 360 900"></polygon>
                                        <polygon fill="#DDD" points="270 750 360 600 180 600"></polygon>
                                        <polygon points="450 750 540 600 360 600"></polygon>
                                        <polygon points="630 750 540 900 720 900"></polygon>
                                        <polygon fill="#444" points="630 750 720 600 540 600"></polygon>
                                        <polygon fill="#AAA" points="810 750 720 900 900 900"></polygon>
                                        <polygon fill="#666" points="810 750 900 600 720 600"></polygon>
                                        <polygon fill="#999" points="990 750 900 900 1080 900"></polygon>
                                        <polygon fill="#999" points="180 0 90 150 270 150"></polygon>
                                        <polygon fill="#444" points="360 0 270 150 450 150"></polygon>
                                        <polygon fill="#FFF" points="540 0 450 150 630 150"></polygon>
                                        <polygon points="900 0 810 150 990 150"></polygon>
                                        <polygon fill="#222" points="0 300 -90 450 90 450"></polygon>
                                        <polygon fill="#FFF" points="0 300 90 150 -90 150"></polygon>
                                        <polygon fill="#FFF" points="180 300 90 450 270 450"></polygon>
                                        <polygon fill="#666" points="180 300 270 150 90 150"></polygon>
                                        <polygon fill="#222" points="360 300 270 450 450 450"></polygon>
                                        <polygon fill="#FFF" points="360 300 450 150 270 150"></polygon>
                                        <polygon fill="#444" points="540 300 450 450 630 450"></polygon>
                                        <polygon fill="#222" points="540 300 630 150 450 150"></polygon>
                                        <polygon fill="#AAA" points="720 300 630 450 810 450"></polygon>
                                        <polygon fill="#666" points="720 300 810 150 630 150"></polygon>
                                        <polygon fill="#FFF" points="900 300 810 450 990 450"></polygon>
                                        <polygon fill="#999" points="900 300 990 150 810 150"></polygon>
                                        <polygon points="0 600 -90 750 90 750"></polygon>
                                        <polygon fill="#666" points="0 600 90 450 -90 450"></polygon>
                                        <polygon fill="#AAA" points="180 600 90 750 270 750"></polygon>
                                        <polygon fill="#444" points="180 600 270 450 90 450"></polygon>
                                        <polygon fill="#444" points="360 600 270 750 450 750"></polygon>
                                        <polygon fill="#999" points="360 600 450 450 270 450"></polygon>
                                        <polygon fill="#666" points="540 600 630 450 450 450"></polygon>
                                        <polygon fill="#222" points="720 600 630 750 810 750"></polygon>
                                        <polygon fill="#FFF" points="900 600 810 750 990 750"></polygon>
                                        <polygon fill="#222" points="900 600 990 450 810 450"></polygon>
                                        <polygon fill="#DDD" points="0 900 90 750 -90 750"></polygon>
                                        <polygon fill="#444" points="180 900 270 750 90 750"></polygon>
                                        <polygon fill="#FFF" points="360 900 450 750 270 750"></polygon>
                                        <polygon fill="#AAA" points="540 900 630 750 450 750"></polygon>
                                        <polygon fill="#FFF" points="720 900 810 750 630 750"></polygon>
                                        <polygon fill="#222" points="900 900 990 750 810 750"></polygon>
                                        <polygon fill="#222" points="1080 300 990 450 1170 450"></polygon>
                                        <polygon fill="#FFF" points="1080 300 1170 150 990 150"></polygon>
                                        <polygon points="1080 600 990 750 1170 750"></polygon>
                                        <polygon fill="#666" points="1080 600 1170 450 990 450"></polygon>
                                        <polygon fill="#DDD" points="1080 900 1170 750 990 750"></polygon>
                                    </g>
                                </pattern>
                            </defs>
                            <rect x="0" y="0" fill="url(#a)" width="100%" height="100%"></rect>
                            <rect x="0" y="0" fill="url(#b)" width="100%" height="100%"></rect>
                        </svg>
                    </div>
                    <div class="card__avatar">
                        <img src="${teacher.profilePicture || '/default-avatar.png'}" alt="${teacher.name}" />
                    </div>
                    <div class="card__title">${teacher.name}</div>
                    <div class="card__subtitle">${teacher.subjects.join(', ')}</div>
                    <div class="card__info">
                        <p>Age: ${teacher.age || 'N/A'}</p>
                        <p>Phone: ${teacher.phone || 'N/A'}</p>
                        <p>Email: ${teacher.email || teacher.userId || 'N/A'}</p>
                        <p>Experience: ${teacher.experience || 'N/A'}</p>
                    </div>
                    <div class="card__wrapper">
                        <button class="card__btn card__btn-solid" onclick="sendRequest('${teacher.userId}')">Join</button>
                    </div>
                </div>
            `;
            marker.bindPopup(popupContent);
            marker.on('mouseover', () => marker.openPopup());
            marker.on('mouseout', () => marker.closePopup());
            teacherMarkers.push(marker);
        });
    } catch (error) {
        console.error('Error loading teachers:', error);
        mapMessage.textContent = 'Failed to load teachers. Please try again.';
        mapMessage.style.display = 'block';
    }
}

function setRange(range) {
    loadTeachers(range);
}

async function sendRequest(teacherId) {
    try {
        const email = localStorage.getItem('userEmail');
        if (!studentData || !studentData.subjects) {
            throw new Error('Student subjects not available');
        }

        const response = await fetch('http://localhost:5000/api/student/request-tutor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': email
            },
            body: JSON.stringify({
                studentId: email,
                teacherId,
                subjects: studentData.subjects, // Use student's subjects
                schedule: 'TBD', // Placeholder, adjust as needed
                message: 'I would like to join your tutoring sessions.'
            })
        });
        if (response.ok) {
            alert('Request sent successfully!');
        } else {
            const errorData = await response.json();
            alert(`Failed to send request: ${errorData.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error sending request:', error);
        alert('An error occurred. Please try again.');
    }
}

initMap();
