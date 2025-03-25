// Load Components from Modular HTML Files into Placeholders

document.addEventListener('DOMContentLoaded', () => {
    loadComponent('components/sidebar.html', 'sidebar-container');
    loadComponent('components/header.html', 'header-container');
    loadComponent('components/profileOverview.html', 'profile-overview-container');
    loadComponent('components/coursesGrid.html', 'courses-grid-container');
    loadComponent('components/tutorsGrid.html', 'tutors-grid-container');
});

async function loadComponent(path, containerId) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Failed to load ${path}`);
        const html = await response.text();
        document.getElementById(containerId).innerHTML = html;
    } catch (error) {
        console.error(error);
    }
}