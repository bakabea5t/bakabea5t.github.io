// app.js - Single-page portfolio application

// Global state
let posts = [];
let currentView = 'home';
let navigationHistory = []; // Track navigation history for back button

// Load posts data
async function loadPosts() {
    try {
        // First try loading from /posts/index.json
        const response = await fetch('posts/index.json');
        const postIndex = await response.json();
        
        // Load individual post files
        posts = await Promise.all(
            postIndex.map(postMeta => 
                fetch(`posts/${postMeta.id}.json`)
                    .then(r => r.json())
                    .catch(err => {
                        console.warn(`Failed to load post ${postMeta.id}:`, err);
                        return null;
                    })
            )
        );
        
        // Filter out failed loads and sort by date
        posts = posts.filter(p => p !== null).sort((a, b) => new Date(b.date) - new Date(a.date));
        
        return posts;
    } catch (error) {
        console.error('Error loading posts from /posts/:',  error);
        
        // Fallback: try loading from root posts.json (legacy)
        try {
            const fallbackResponse = await fetch('posts.json');
            posts = await fallbackResponse.json();
            return posts;
        } catch (fallbackError) {
            console.error('Error loading fallback posts.json:', fallbackError);
            return [];
        }
    }
}

// Build header
function buildHeader() {
    const header = document.getElementById('header');
    header.className = 'header-bar';
    header.innerHTML = `
        <div class="site-name" onclick="navigateTo('home')">Jaden Vaught</div>
        <nav>
            <a href="#home" onclick="navigateTo('home')">Home</a>
            <a href="#posts" onclick="navigateTo('posts')">Projects</a>
        </nav>
    `;
}

// Build footer
function buildFooter() {
    const footer = document.getElementById('footer');
    footer.innerHTML = `
        <p>&copy; 2025 Jaden Vaught</p>
    `;
}

// Navigation handler
function navigateTo(view, postId = null) {
    // Store current state in history before navigating
    const currentRoute = getCurrentRoute();
    navigationHistory.push({
        view: currentRoute.view,
        postId: currentRoute.postId
    });

    // Limit history to last 10 entries to prevent memory issues
    if (navigationHistory.length > 10) {
        navigationHistory.shift();
    }

    currentView = view;
    window.location.hash = view + (postId ? '/' + postId : '');
    renderContent();
}

// Back navigation function
function goBack() {
    if (navigationHistory.length > 0) {
        const previousState = navigationHistory.pop();
        currentView = previousState.view;
        window.location.hash = previousState.view + (previousState.postId ? '/' + previousState.postId : '');
        renderContent();
    } else {
        // If no history, go to home
        navigateTo('home');
    }
}

// Parse current route from hash
function getCurrentRoute() {
    const hash = window.location.hash.substring(1); // Remove #
    const parts = hash.split('/');
    return {
        view: parts[0] || 'home',
        postId: parts[1] || null
    };
}

// Render content based on current view
function renderContent() {
    const content = document.getElementById('content');
    const route = getCurrentRoute();

    switch (route.view) {
        case 'home':
            renderHome(content);
            break;
        case 'posts':
            if (route.postId) {
                renderPostDetail(content, route.postId);
            } else {
                renderPostsList(content);
            }
            break;
        default:
            renderHome(content);
    }
}

// Render home view
function renderHome(container) {
    container.innerHTML = `
        <section id="about">
            <div class="about-content">
                <div class="about-text">
                    <h1>Jaden Vaught</h1>
                    <h2>Software Developer & Problem Solver</h2>
                    <p>
                        Welcome to my digital portfolio. I'm a passionate software developer with a love for
                        creating elegant solutions to complex problems. My journey in technology has been driven
                        by curiosity and a commitment to continuous learning.
                    </p>
                    <p>
                        I specialize in building web applications and enjoy working with modern technologies
                        to bring ideas to life. Whether it's crafting intuitive user interfaces or architecting
                        robust backend systems, I approach each project with attention to detail and a focus
                        on user experience.
                    </p>
                    <div class="about-highlights">
                        <div class="highlight">
                            <h3>Full-Stack Development</h3>
                            <p>Building end-to-end web applications with modern frameworks</p>
                        </div>
                        <div class="highlight">
                            <h3>Problem Solving</h3>
                            <p>Tackling complex challenges with creative and efficient solutions</p>
                        </div>
                        <div class="highlight">
                            <h3>Continuous Learning</h3>
                            <p>Always exploring new technologies and best practices</p>
                        </div>
                    </div>
                </div>
                <div class="about-image">
                    <img src="img/Pondering.JPG" alt="Jaden Vaught - Software Developer" />
                </div>
            </div>
        </section>
        <section id="timeline">
            <h2>My Journey</h2>
            <div class="timeline-container">
                <div class="timeline-line"></div>
                <div class="timeline-events">
                    <div class="timeline-event" data-year="2024">
                        <div class="timeline-content">
                            <div class="timeline-date">2024 - Present</div>
                            <h3>Freelance Developer</h3>
                            <p>Building custom web applications and solutions for clients. Specializing in modern JavaScript frameworks and responsive design.</p>
                            <div class="timeline-tags">
                                <span class="timeline-tag">React</span>
                                <span class="timeline-tag">Node.js</span>
                                <span class="timeline-tag">Full-Stack</span>
                            </div>
                        </div>
                    </div>
                    <div class="timeline-event" data-year="2023">
                        <div class="timeline-content">
                            <div class="timeline-date">2023</div>
                            <h3>Portfolio Website Launch</h3>
                            <p>Created and deployed this personal portfolio website showcasing my projects and skills using vanilla JavaScript and modern CSS.</p>
                            <div class="timeline-tags">
                                <span class="timeline-tag">JavaScript</span>
                                <span class="timeline-tag">CSS</span>
                                <span class="timeline-tag">GitHub Pages</span>
                            </div>
                        </div>
                    </div>
                    <div class="timeline-event" data-year="2022">
                        <div class="timeline-content">
                            <div class="timeline-date">2020 - 2022</div>
                            <h3>Computer Science Studies</h3>
                            <p>Completed coursework in algorithms, data structures, web development, and software engineering principles.</p>
                            <div class="timeline-tags">
                                <span class="timeline-tag">Algorithms</span>
                                <span class="timeline-tag">Data Structures</span>
                                <span class="timeline-tag">Web Dev</span>
                            </div>
                        </div>
                    </div>
                    <div class="timeline-event" data-year="2020">
                        <div class="timeline-content">
                            <div class="timeline-date">2020</div>
                            <h3>Started Coding Journey</h3>
                            <p>Began learning programming through online resources and personal projects. Built first web applications and discovered passion for development.</p>
                            <div class="timeline-tags">
                                <span class="timeline-tag">HTML</span>
                                <span class="timeline-tag">CSS</span>
                                <span class="timeline-tag">JavaScript</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <section id="featured-posts">
            <h3>Featured Projects</h3>
            <div id="featured-posts-container"></div>
        </section>
    `;
    displayFeaturedPosts();
    initTimeline();
}

// Render posts list view
function renderPostsList(container) {
    container.innerHTML = `
        <section id="projects-intro">
            <h2>My Projects</h2>
            <p>Here are some projects I've worked on, focusing on what I learned from each.</p>
            <button id="view-toggle">Switch to List View</button>
        </section>
        <section id="posts-section">
            <div id="posts-container"></div>
        </section>
    `;
    displayAllPosts();
    setupViewToggle();
}

// Render individual post
function renderPostDetail(container, postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) {
        container.innerHTML = '<p>Post not found.</p>';
        return;
    }

    // Create post navigation
    container.innerHTML = `
        <div class="post-navigation">
            <button onclick="goBack()" class="back-button">&larr; Back</button>
        </div>
        <div id="post-container"></div>
    `;

    // Use the PostRenderer to render the post content
    if (window.postRenderer) {
        window.postRenderer.renderPost(
            document.getElementById('post-container'),
            post
        );
    } else {
        // Fallback rendering if postRenderer is not loaded
        console.warn('PostRenderer not loaded, using fallback rendering');
        renderPostDetailFallback(document.getElementById('post-container'), post);
    }
}

// Fallback rendering if PostRenderer is not available
function renderPostDetailFallback(container, post) {
    container.innerHTML = `
        <article>
            <h1>${post.title}</h1>
            <div class="post-meta">
                <time datetime="${post.date}">${new Date(post.date).toLocaleDateString()}</time>
                ${post.tags && post.tags.length > 0 ? `
                    <div class="post-tags">
                        ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="post-content">${post.content}</div>
        </article>
    `;
}

// Display featured posts
async function displayFeaturedPosts() {
    await loadPosts();
    const container = document.getElementById('featured-posts-container');
    if (!container) return;

    const featuredPosts = posts.filter(p => p.featured || p.pinned).slice(0, 3);

    container.innerHTML = featuredPosts.map(post => `
        <article 
            class="post-card"
            role="link"
            tabindex="0"
            onclick="navigateTo('posts', '${post.id}')"
            onkeydown="if (event.key === 'Enter') navigateTo('posts', '${post.id}')"
        >
            ${post.images && post.images.thumbnail ? `
                <img src="${post.images.thumbnail}" alt="${post.title}" class="post-card-image">
            ` : ''}
            <h4>${post.title}</h4>
            <time datetime="${post.date}">
                ${new Date(post.date).toLocaleDateString()}
            </time>
            <p>${post.shortDescription}</p>
            <div class="tags">
                ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </article>
    `).join('');
}


// Display all posts
function displayAllPosts(view = 'grid') {
    const container = document.getElementById('posts-container');
    if (!container) return;

    container.className = `posts-${view}`;
    container.innerHTML = posts.map(post => {
        // Support both old format (post.images.gallery) and new format (post.gallery or post.image)
        let imageUrl = null;
        if (post.image) {
            imageUrl = post.image;
        } else if (post.images && post.images.gallery && post.images.gallery.length > 0) {
            imageUrl = post.images.gallery[0].src;
        } else if (post.gallery && post.gallery.length > 0) {
            imageUrl = post.gallery[0].src;
        }

        // Support both formats for description
        const description = post.shortDescription || '';

        return `
        <article class="post-item" role="link" tabindex="0" onclick="navigateTo('posts', '${post.id}')" onkeydown="if(event.key === 'Enter') navigateTo('posts', '${post.id}')">
            ${imageUrl ? `
                <div class="post-item-image-square">
                    <img src="${imageUrl}" alt="${post.title}" />
                </div>
            ` : ''}
            <div class="post-item-content">
                <h3><a href="#posts/${post.id}" onclick="event.stopPropagation(); navigateTo('posts', '${post.id}')">${post.title}</a></h3>
                <time datetime="${post.date}">${new Date(post.date).toLocaleDateString()}</time>
                ${description ? `<p>${description}</p>` : ''}
                ${post.tags ? `<div class="tags">${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
            </div>
        </article>
    `;
    }).join('');
}


// Setup view toggle
function setupViewToggle() {
    const toggleBtn = document.getElementById('view-toggle');
    if (!toggleBtn) return;

    let currentView = 'grid';
    toggleBtn.addEventListener('click', () => {
        currentView = currentView === 'grid' ? 'list' : 'grid';
        displayAllPosts(currentView);
        toggleBtn.textContent = `Switch to ${currentView === 'grid' ? 'List' : 'Grid'} View`;
    });
}
// Initialize timeline interactivity
function initTimeline() {
    const timelineEvents = document.querySelectorAll('.timeline-event');

    // Add click handlers for timeline events
    timelineEvents.forEach((event, index) => {
        const content = event.querySelector('.timeline-content');
        content.addEventListener('click', () => {
            // Toggle expanded state
            event.classList.toggle('expanded');

            // Close other expanded events
            timelineEvents.forEach((otherEvent, otherIndex) => {
                if (otherIndex !== index) {
                    otherEvent.classList.remove('expanded');
                }
            });
        });
    });

    // Add scroll-triggered animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    timelineEvents.forEach(event => {
        observer.observe(event);
    });
}
// Initialize app
async function init() {
    await loadPosts();
    buildHeader();
    buildFooter();

    // Handle initial route
    window.addEventListener('hashchange', renderContent);
    // Handle browser back/forward buttons
    window.addEventListener('popstate', renderContent);
    renderContent();
}

// Start the app
document.addEventListener('DOMContentLoaded', init);