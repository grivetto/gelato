/*
 * Gelateria d'Antan - JS Controller
 * Handles SPA navigation, real-time opening hours, and swipe gestures
 */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initOpeningHours();
    initSwipeGestures();
    initContactForm();
});

/**
 * Handle Single Page Application navigation
 */
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.page-section');
    const mainContent = document.querySelector('main');
    
    // Switch tabs on click
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            switchTab(targetId);
        });
    });

    // Custom button links inside pages (e.g. "Vieni a trovarci" -> contatti)
    const pageLinks = document.querySelectorAll('[data-go-to]');
    pageLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-go-to');
            switchTab(targetId);
        });
    });

    function switchTab(targetId) {
        // Remove active class from all nav items
        navItems.forEach(nav => {
            if (nav.getAttribute('data-target') === targetId) {
                nav.classList.add('active');
            } else {
                nav.classList.remove('active');
            }
        });

        // Hide all sections, show target section
        sections.forEach(section => {
            if (section.id === targetId) {
                section.classList.add('active');
                // Subtle scroll reset
                mainContent.scrollTop = 0;
            } else {
                section.classList.remove('active');
            }
        });
        
        // Push state to history for accessibility / back-button if desired
        if (history.pushState) {
            history.pushState(null, null, '#' + targetId);
        }
    }

    // Check hash on load to open correct tab
    const currentHash = window.location.hash.substring(1);
    if (currentHash && document.getElementById(currentHash)) {
        switchTab(currentHash);
    }
}

/**
 * Real-time opening hours calculator
 * Displays an "Open Now" or "Closed Now" badge with live indicator
 */
function initOpeningHours() {
    const statusContainer = document.getElementById('live-status-container');
    if (!statusContainer) return;

    // Define opening hours
    // 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
    // Format: [[open1, close1], [open2, close2]] in decimal hours
    const hours = {
        0: [[10.5, 13.0], [15.0, 22.0]], // Sunday: 10:30-13:00, 15:00-22:00
        1: [[15.0, 22.0]],               // Monday: 15:00-22:00
        2: [[11.5, 22.0]],               // Tuesday: 11:30-22:00
        3: [[11.5, 22.0]],               // Wednesday: 11:30-22:00
        4: [[11.5, 22.0]],               // Thursday: 11:30-22:00
        5: [[11.5, 22.0]],               // Friday: 11:30-22:00
        6: [[11.5, 22.0]]                // Saturday: 11:30-22:00
    };

    function checkStatus() {
        const now = new Date();
        const day = now.getDay();
        const time = now.getHours() + now.getMinutes() / 60;
        
        let isOpen = false;
        const todayHours = hours[day];

        for (const slot of todayHours) {
            const [open, close] = slot;
            if (time >= open && time < close) {
                isOpen = true;
                break;
            }
        }

        // Highlight current day in the schedule table
        const rows = document.querySelectorAll('.hours-row');
        rows.forEach(row => {
            const rowDay = parseInt(row.getAttribute('data-day'));
            if (rowDay === day) {
                row.classList.add('current-day');
            } else {
                row.classList.remove('current-day');
            }
        });

        // Update UI
        if (isOpen) {
            statusContainer.className = 'live-status open';
            statusContainer.innerHTML = '<span class="live-status-dot"></span> Aperto Ora (Chiude alle 22:00)';
        } else {
            statusContainer.className = 'live-status closed';
            
            // Get next open time message
            let nextDay = day;
            let nextSlot = null;
            
            // Find next opening slot (today or tomorrow)
            for (let i = 0; i < 7; i++) {
                const checkDay = (day + i) % 7;
                const checkSlots = hours[checkDay];
                
                for (const slot of checkSlots) {
                    const [open] = slot;
                    if (checkDay === day && time < open) {
                        nextSlot = { day: checkDay, open: open };
                        break;
                    } else if (checkDay !== day) {
                        nextSlot = { day: checkDay, open: open };
                        break;
                    }
                }
                if (nextSlot) break;
            }

            let nextOpenText = '';
            if (nextSlot) {
                const hourPart = Math.floor(nextSlot.open);
                const minPart = (nextSlot.open % 1) * 60;
                const formattedTime = `${hourPart}:${minPart === 0 ? '00' : minPart}`;
                
                if (nextSlot.day === day) {
                    nextOpenText = `Apre oggi alle ${formattedTime}`;
                } else if (nextSlot.day === (day + 1) % 7) {
                    nextOpenText = `Apre domani alle ${formattedTime}`;
                } else {
                    const weekdays = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
                    nextOpenText = `Apre ${weekdays[nextSlot.day]} alle ${formattedTime}`;
                }
            }

            statusContainer.innerHTML = `<span class="live-status-dot"></span> Chiuso (${nextOpenText})`;
        }
    }

    checkStatus();
    // Run status check every 30 seconds
    setInterval(checkStatus, 30000);
}

/**
 * Handle swipe gestures to navigate between main tabs
 */
function initSwipeGestures() {
    const mainContent = document.querySelector('main');
    const navItems = Array.from(document.querySelectorAll('.nav-item'));
    let touchStartX = 0;
    let touchEndX = 0;
    
    mainContent.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    mainContent.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const threshold = 100; // Minimum drag distance
        const diff = touchEndX - touchStartX;
        
        if (Math.abs(diff) < threshold) return;
        
        const activeNav = document.querySelector('.nav-item.active');
        const activeIndex = navItems.indexOf(activeNav);
        
        if (diff < 0 && activeIndex < navItems.length - 1) {
            // Swipe Left -> Next Tab
            navItems[activeIndex + 1].click();
        } else if (diff > 0 && activeIndex > 0) {
            // Swipe Right -> Previous Tab
            navItems[activeIndex - 1].click();
        }
    }
}

/**
 * Form interaction
 */
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        
        btn.disabled = true;
        btn.innerHTML = '<span style="animation: spin 1s infinite linear; display:inline-block">🍦</span> Invio in corso...';
        
        // Simulate networking
        setTimeout(() => {
            btn.innerHTML = '✅ Messaggio Inviato!';
            btn.style.backgroundColor = '#7BB85D';
            btn.style.color = '#fff';
            form.reset();
            
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = originalText;
                btn.style.backgroundColor = '';
                btn.style.color = '';
            }, 3000);
        }, 1500);
    });
}
