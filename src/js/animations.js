// Scroll and UI Animations
export function initScrollReveals() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

export function animateCounters() {
    const counters = document.querySelectorAll('[data-count-to]');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-count-to');
        const count = +counter.innerText;
        const speed = target / 50;

        const updateCount = () => {
            const current = +counter.innerText;
            if (current < target) {
                counter.innerText = Math.ceil(current + speed);
                setTimeout(updateCount, 20);
            } else {
                counter.innerText = target;
            }
        };
        updateCount();
    });
}
