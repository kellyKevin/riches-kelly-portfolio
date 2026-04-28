// Welcome message and console greeting
console.log("Welcome to Riches & Kelly's Portfolio!");

// SweetAlert Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const alertBtnIndex = document.getElementById('showAlertIndex');
    if (alertBtnIndex) {
        alertBtnIndex.addEventListener('click', () => {
            Swal.fire({
                title: 'Welcome to Our Portfolio!',
                text: 'Explore our projects and learn more about our journey through the ALX program.',
                imageUrl: 'images/back.jpg',
                imageWidth: 300,
                imageHeight: 200,
                imageAlt: 'Welcome Image',
                confirmButtonText: 'OK',
                confirmButtonColor: '#2563eb'
            });
        });
    }

    const alertBtnAbout = document.getElementById('showAlertAbout');
    if (alertBtnAbout) {
        alertBtnAbout.addEventListener('click', () => {
            Swal.fire({
                title: 'Welcome to Our About Page!',
                text: 'We are thrilled to have you here. Explore our journey and get to know us better.',
                imageUrl: 'images/back.jpg',
                confirmButtonText: 'Thank you!',
                confirmButtonColor: '#2563eb'
            });
        });
    }

    // Project View buttons
    document.querySelectorAll('.project-view').forEach(button => {
        button.addEventListener('click', function () {
            const projectLink = this.getAttribute('data-link');
            Swal.fire({
                title: 'Project Details',
                text: 'You are about to view more details for this project.',
                imageUrl: 'images/back.jpg',
                showCancelButton: true,
                confirmButtonText: 'Proceed',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#2563eb'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.open(projectLink, '_blank');
                }
            });
        });
    });
});

// Navigation Scroll Effect
window.addEventListener('scroll', function() {
    const nav = document.querySelector('nav');
    if (window.scrollY > 50) {
        nav.style.background = 'rgba(30, 41, 59, 0.95)';
        nav.style.padding = '0.5rem 0';
        nav.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    } else {
        nav.style.background = 'rgba(255, 255, 255, 0.1)';
        nav.style.padding = '1rem 0';
        nav.style.boxShadow = 'none';
    }
});

// Smooth Scrolling for all links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Reveal elements on scroll
const revealElements = () => {
    const reveals = document.querySelectorAll('.intro, .project-item, .about-us, .projects-list');
    reveals.forEach(element => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        if (elementTop < windowHeight - elementVisible) {
            element.classList.add('active');
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
};

window.addEventListener('scroll', revealElements);

// Initialize reveal state
document.addEventListener('DOMContentLoaded', () => {
    const reveals = document.querySelectorAll('.intro, .project-item, .about-us, .projects-list');
    reveals.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-out';
    });
    revealElements();
});
