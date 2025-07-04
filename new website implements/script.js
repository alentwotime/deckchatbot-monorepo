// ALENS DECKBT Interactive JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all interactive features
    initRobotEyeTracking();
    initNeonEffects();
    initScrollAnimations();
    initParticleEffects();
    initTypingEffect();
    initGlitchEffects();
    initResponsiveNavigation();
    initFormEnhancements();
    initPerformanceOptimizations();
});

// Robot Eye Tracking - Eyes follow cursor
function initRobotEyeTracking() {
    const robotEyes = document.querySelectorAll('.robot-eye');
    let isTracking = true;
    
    document.addEventListener('mousemove', function(e) {
        if (!isTracking) return;
        
        robotEyes.forEach(eye => {
            const rect = eye.getBoundingClientRect();
            const eyeCenterX = rect.left + rect.width / 2;
            const eyeCenterY = rect.top + rect.height / 2;
            
            const angle = Math.atan2(e.clientY - eyeCenterY, e.clientX - eyeCenterX);
            const distance = Math.min(3, Math.sqrt(Math.pow(e.clientX - eyeCenterX, 2) + Math.pow(e.clientY - eyeCenterY, 2)) / 10);
            
            const pupilX = Math.cos(angle) * distance;
            const pupilY = Math.sin(angle) * distance;
            
            eye.style.transform = `translate(${pupilX}px, ${pupilY}px)`;
        });
    });
    
    // Pause eye tracking when user is idle
    let idleTimer;
    document.addEventListener('mousemove', function() {
        clearTimeout(idleTimer);
        isTracking = true;
        idleTimer = setTimeout(() => {
            isTracking = false;
            // Reset eye positions
            robotEyes.forEach(eye => {
                eye.style.transform = 'translate(0, 0)';
            });
        }, 5000);
    });
}

// Enhanced Neon Effects
function initNeonEffects() {
    // Intensify glow on hover for interactive elements
    const glowElements = document.querySelectorAll('.btn, .nav-link, .card, .form-input');
    
    glowElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.filter = 'brightness(1.2) saturate(1.3)';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.filter = 'brightness(1) saturate(1)';
        });
    });
    
    // Random neon flicker effect
    const flickerElements = document.querySelectorAll('.brand-name, .brand-suffix');
    
    function randomFlicker() {
        const element = flickerElements[Math.floor(Math.random() * flickerElements.length)];
        if (element) {
            element.style.opacity = '0.7';
            setTimeout(() => {
                element.style.opacity = '1';
            }, 100);
        }
    }
    
    // Flicker every 3-8 seconds
    setInterval(randomFlicker, Math.random() * 5000 + 3000);
}

// Scroll-triggered Animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Special animations for specific elements
                if (entry.target.classList.contains('showcase-item')) {
                    animateShowcaseItem(entry.target);
                }
                
                if (entry.target.classList.contains('color-swatch')) {
                    animateColorSwatch(entry.target);
                }
            }
        });
    }, observerOptions);
    
    // Observe elements for scroll animations
    const animatedElements = document.querySelectorAll('.showcase-item, .card, .color-swatch, .component-group');
    animatedElements.forEach(el => observer.observe(el));
    
    // Add CSS for scroll animations
    const style = document.createElement('style');
    style.textContent = `
        .showcase-item, .card, .color-swatch, .component-group {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s ease;
        }
        
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
}

function animateShowcaseItem(item) {
    const delay = Math.random() * 300;
    setTimeout(() => {
        item.style.boxShadow = '0 0 30px rgba(0, 191, 255, 0.4)';
        setTimeout(() => {
            item.style.boxShadow = '';
        }, 1000);
    }, delay);
}

function animateColorSwatch(swatch) {
    const colorBox = swatch.querySelector('.color-box');
    if (colorBox) {
        colorBox.style.transform = 'scale(1.1)';
        setTimeout(() => {
            colorBox.style.transform = 'scale(1)';
        }, 300);
    }
}

// Particle Effects for Background
function initParticleEffects() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';
    
    hero.appendChild(canvas);
    
    let particles = [];
    let animationId;
    
    function resizeCanvas() {
        canvas.width = hero.offsetWidth;
        canvas.height = hero.offsetHeight;
    }
    
    function createParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.2,
            color: Math.random() > 0.5 ? '#00BFFF' : '#FFA500'
        };
    }
    
    function initParticles() {
        particles = [];
        for (let i = 0; i < 50; i++) {
            particles.push(createParticle());
        }
    }
    
    function updateParticles() {
        particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Wrap around edges
            if (particle.x < 0) particle.x = canvas.width;
            if (particle.x > canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = canvas.height;
            if (particle.y > canvas.height) particle.y = 0;
            
            // Pulse opacity
            particle.opacity += (Math.random() - 0.5) * 0.02;
            particle.opacity = Math.max(0.1, Math.min(0.7, particle.opacity));
        });
    }
    
    function drawParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = particle.opacity;
            ctx.fill();
            
            // Add glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = particle.color;
            ctx.fill();
            ctx.shadowBlur = 0;
        });
        
        ctx.globalAlpha = 1;
    }
    
    function animate() {
        updateParticles();
        drawParticles();
        animationId = requestAnimationFrame(animate);
    }
    
    // Initialize and start animation
    resizeCanvas();
    initParticles();
    animate();
    
    // Handle resize
    window.addEventListener('resize', () => {
        resizeCanvas();
        initParticles();
    });
    
    // Pause animation when not visible
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationId);
        } else {
            animate();
        }
    });
}

// Typing Effect for Hero Title
function initTypingEffect() {
    const heroTitle = document.querySelector('.hero-title');
    if (!heroTitle) return;
    
    const originalText = heroTitle.textContent;
    const typingSpeed = 100;
    const pauseTime = 2000;
    
    function typeText() {
        heroTitle.textContent = '';
        let i = 0;
        
        function type() {
            if (i < originalText.length) {
                heroTitle.textContent += originalText.charAt(i);
                i++;
                setTimeout(type, typingSpeed);
            } else {
                setTimeout(() => {
                    heroTitle.textContent = originalText;
                }, pauseTime);
            }
        }
        
        type();
    }
    
    // Start typing effect after a delay
    setTimeout(typeText, 1000);
}

// Glitch Effects
function initGlitchEffects() {
    const glitchElements = document.querySelectorAll('.glitch');
    
    function createGlitch(element) {
        const originalText = element.textContent;
        const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        function glitch() {
            let glitchedText = '';
            for (let i = 0; i < originalText.length; i++) {
                if (Math.random() < 0.1) {
                    glitchedText += glitchChars[Math.floor(Math.random() * glitchChars.length)];
                } else {
                    glitchedText += originalText[i];
                }
            }
            
            element.textContent = glitchedText;
            
            setTimeout(() => {
                element.textContent = originalText;
            }, 100);
        }
        
        // Random glitch intervals
        setInterval(glitch, Math.random() * 3000 + 2000);
    }
    
    glitchElements.forEach(createGlitch);
}

// Responsive Navigation
function initResponsiveNavigation() {
    const nav = document.querySelector('.navigation');
    const navMenu = document.querySelector('.nav-menu');
    
    if (!nav || !navMenu) return;
    
    // Create mobile menu toggle
    const mobileToggle = document.createElement('button');
    mobileToggle.className = 'mobile-nav-toggle';
    mobileToggle.innerHTML = '☰';
    mobileToggle.style.display = 'none';
    
    nav.appendChild(mobileToggle);
    
    // Add mobile styles
    const mobileStyles = document.createElement('style');
    mobileStyles.textContent = `
        @media (max-width: 768px) {
            .mobile-nav-toggle {
                display: block !important;
                background: transparent;
                border: 2px solid var(--neon-blue);
                color: var(--neon-blue);
                font-size: 1.5rem;
                padding: 0.5rem;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .mobile-nav-toggle:hover {
                background: var(--neon-blue);
                color: var(--deep-black);
                box-shadow: 0 0 15px var(--neon-blue);
            }
            
            .nav-menu {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: var(--charcoal);
                border: 1px solid var(--steel-gray);
                border-radius: 8px;
                margin-top: 1rem;
                padding: 1rem;
                flex-direction: column;
                transform: translateY(-20px);
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .nav-menu.active {
                transform: translateY(0);
                opacity: 1;
                visibility: visible;
            }
        }
    `;
    document.head.appendChild(mobileStyles);
    
    // Toggle functionality
    mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileToggle.innerHTML = navMenu.classList.contains('active') ? '✕' : '☰';
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target)) {
            navMenu.classList.remove('active');
            mobileToggle.innerHTML = '☰';
        }
    });
}

// Form Enhancements
function initFormEnhancements() {
    const formInputs = document.querySelectorAll('.form-input');
    
    formInputs.forEach(input => {
        // Add focus/blur effects
        input.addEventListener('focus', function() {
            this.style.borderColor = 'var(--neon-blue)';
            this.style.boxShadow = '0 0 15px rgba(0, 191, 255, 0.4)';
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.style.borderColor = 'var(--steel-gray)';
                this.style.boxShadow = 'none';
            }
        });
        
        // Add typing effect
        input.addEventListener('input', function() {
            if (this.value) {
                this.style.borderColor = 'var(--cyan-glow)';
                this.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.3)';
            }
        });
    });
    
    // Form validation with neon effects
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const inputs = form.querySelectorAll('.form-input[required]');
            let isValid = true;
            
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    input.style.borderColor = '#FF4444';
                    input.style.boxShadow = '0 0 15px rgba(255, 68, 68, 0.4)';
                    isValid = false;
                } else {
                    input.style.borderColor = '#44FF44';
                    input.style.boxShadow = '0 0 15px rgba(68, 255, 68, 0.4)';
                }
            });
            
            if (isValid) {
                // Success animation
                const submitBtn = form.querySelector('.btn');
                if (submitBtn) {
                    submitBtn.textContent = 'Success!';
                    submitBtn.style.background = '#44FF44';
                    submitBtn.style.boxShadow = '0 0 20px #44FF44';
                    
                    setTimeout(() => {
                        submitBtn.textContent = 'Submit';
                        submitBtn.style.background = '';
                        submitBtn.style.boxShadow = '';
                    }, 2000);
                }
            }
        });
    });
}

// Performance Optimizations
function initPerformanceOptimizations() {
    // Throttle scroll events
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) return;
        
        scrollTimeout = setTimeout(() => {
            // Update scroll-based effects here
            updateScrollEffects();
            scrollTimeout = null;
        }, 16); // ~60fps
    });
    
    // Reduce animations on low-end devices
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
        document.body.classList.add('reduced-animations');
        
        const reducedAnimationStyles = document.createElement('style');
        reducedAnimationStyles.textContent = `
            .reduced-animations * {
                animation-duration: 0.1s !important;
                transition-duration: 0.1s !important;
            }
        `;
        document.head.appendChild(reducedAnimationStyles);
    }
    
    // Pause animations when tab is not visible
    document.addEventListener('visibilitychange', () => {
        const animatedElements = document.querySelectorAll('[style*="animation"]');
        
        if (document.hidden) {
            animatedElements.forEach(el => {
                el.style.animationPlayState = 'paused';
            });
        } else {
            animatedElements.forEach(el => {
                el.style.animationPlayState = 'running';
            });
        }
    });
}

function updateScrollEffects() {
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.5;
    
    // Parallax effect for hero background
    const heroBackground = document.querySelector('.hero-background');
    if (heroBackground) {
        heroBackground.style.transform = `translateY(${rate}px)`;
    }
    
    // Update navigation opacity based on scroll
    const header = document.querySelector('.header');
    if (header) {
        const opacity = Math.min(1, scrolled / 100);
        header.style.backgroundColor = `rgba(10, 10, 10, ${opacity})`;
    }
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Easter Eggs
document.addEventListener('keydown', function(e) {
    // Konami Code: ↑↑↓↓←→←→BA
    const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    window.konamiSequence = window.konamiSequence || [];
    
    window.konamiSequence.push(e.keyCode);
    
    if (window.konamiSequence.length > konamiCode.length) {
        window.konamiSequence.shift();
    }
    
    if (window.konamiSequence.join(',') === konamiCode.join(',')) {
        // Activate super neon mode
        document.body.style.filter = 'saturate(2) brightness(1.2)';
        document.body.style.animation = 'rainbow 2s linear infinite';
        
        const rainbowStyle = document.createElement('style');
        rainbowStyle.textContent = `
            @keyframes rainbow {
                0% { filter: saturate(2) brightness(1.2) hue-rotate(0deg); }
                100% { filter: saturate(2) brightness(1.2) hue-rotate(360deg); }
            }
        `;
        document.head.appendChild(rainbowStyle);
        
        setTimeout(() => {
            document.body.style.filter = '';
            document.body.style.animation = '';
        }, 10000);
    }
});

// Console Easter Egg
console.log(`
    ╔══════════════════════════════════════╗
    ║          ALENS DECK BOT              ║
    ║      Futuristic Web Experience       ║
    ║                                      ║
    ║  🤖 Robot eyes track your cursor     ║
    ║  ⚡ Neon effects everywhere          ║
    ║  🎮 Try the Konami Code!             ║
    ║                                      ║
    ║  Built with love and neon lights     ║
    ╚══════════════════════════════════════╝
`);