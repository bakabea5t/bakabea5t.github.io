// app.js - Single-page portfolio application

/*
 * DOM CACHING STRATEGY:
 * 
 * To optimize performance and avoid re-fetching/re-rendering:
 * 1. Post Details: Full rendered post pages cached after first view
 * 2. Post List Items: Individual post cards cached for lists
 * 3. Images: All images preloaded and cached on initial load
 * 4. Filter Results: Filter operations cached by filter state
 * 
 * Use window.cacheManager.stats() in console to view cache statistics
 */

// Global state
let posts = [];
let currentView = 'home';
let navigationHistory = []; // Track navigation history for back button

// DOM Cache for rendered content
const domCache = {
    postDetails: new Map(), // Cache full post detail pages
    postListItems: new Map(), // Cache post list items HTML
    images: new Map() // Cache loaded Image objects
};

// Preload and cache an image
function preloadImage(src) {
    if (!src || domCache.images.has(src)) {
        return Promise.resolve(domCache.images.get(src));
    }
    
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            domCache.images.set(src, img);
            resolve(img);
        };
        img.onerror = reject;
        img.src = src;
    });
}

// Preload all images from posts
function preloadPostImages() {
    const imagesToLoad = [];
    
    posts.forEach(post => {
        // Thumbnail/main image
        if (post.image) {
            imagesToLoad.push(preloadImage(post.image));
        }
        
        // Gallery images
        if (post.images?.gallery) {
            post.images.gallery.forEach(img => {
                imagesToLoad.push(preloadImage(img.src));
            });
        } else if (post.gallery) {
            post.gallery.forEach(img => {
                imagesToLoad.push(preloadImage(img.src));
            });
        }
    });
    
    return Promise.allSettled(imagesToLoad);
}

// Clear cache for a specific post
function clearPostCache(postId) {
    domCache.postDetails.delete(postId);
    domCache.postListItems.delete(postId);
}

// Clear all DOM cache
function clearAllCache() {
    domCache.postDetails.clear();
    domCache.postListItems.clear();
    // Keep image cache as images are reusable
}

// Get cache statistics (useful for debugging)
function getCacheStats() {
    return {
        postDetails: domCache.postDetails.size,
        postListItems: domCache.postListItems.size,
        images: domCache.images.size,
        totalMemory: {
            postDetails: `${domCache.postDetails.size} posts cached`,
            postListItems: `${domCache.postListItems.size} list items cached`,
            images: `${domCache.images.size} images preloaded`
        }
    };
}

// Expose cache management globally (for debugging in console)
window.cacheManager = {
    clear: clearAllCache,
    clearPost: clearPostCache,
    stats: getCacheStats,
    preloadImages: preloadPostImages
};

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
        
        // Preload images in background
        preloadPostImages().then(() => {
            console.log('Post images preloaded');
        });
        
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
async function renderContent() {
    const content = document.getElementById('content');
    const route = getCurrentRoute();

    switch (route.view) {
        case 'home':
            renderHome(content);
            break;
        case 'posts':
            if (route.postId) {
                await renderPostDetail(content, route.postId);
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
    const { accomplishmentsSection, workHistorySection } = timelineRenderer.buildHomeSection();
    
    container.innerHTML = `
        <div id="home-top-section">
            <section id="about">
                <div class="about-content">
                    <div class="about-text">
                        <h1>Jaden Vaught</h1>
                        <h2>Software Developer</h2>
                        <p>
                            Welcome to my digital portfolio. Here you can see my diverse range of projects and accomplishments.
                            I am currently engaged in a full-stack implmentation utlizing AWS services to build a fedRAMP compliant application.
                            However i strive to continuously expand my skills and hope to utlize my experience in gooverment compliance to help
                            design and build secure and compliant applications in the future specifically for the EV industry.
                        </p>
                        <p>
                            My biggest passion is finding optmial solutions to complex problems and building applications that make a positive 
                            impact. I am always eager to learn new technologies and take on new challenges. As i have the most fun when i am 
                            learning and building at the same time.
                        </p>
                    </div>
                    <div class="about-image">
                        <img src="img/Pondering.JPG" alt="Jaden Vaught - Software Developer" />
                        <div class="education-section">
                            <div class="education-header">
                                <object data="img/Kentucky_Wildcats_logo.svg" type="image/svg+xml" class="education-logo" style="width: 32px; height: 32px; vertical-align: middle;"></object>
                                <h3>Education</h3>
                            </div>
                            <div class="education-badges">
                                <div class="badge">
                                    <i class="fas fa-university"></i>
                                    <span class="badge-text">University of Kentucky</span>
                                </div>
                                <div class="badge">
                                    <i class="fas fa-scroll"></i>
                                    <span class="badge-text">Bachelor's of Computer Science</span>
                                </div>
                                <div class="badge">
                                    <i class="fas fa-book"></i>
                                    <span class="badge-text">Minor in Mathematics</span>
                                </div>
                                <div class="badge">
                                    <i class="fas fa-award"></i>
                                    <span class="badge-text">Cybersecurity Certificate</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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
            </section>
            ${workHistorySection}
        </div>
    `;
    
    // Add accomplishments timeline
    container.innerHTML += accomplishmentsSection;
    
    timelineRenderer.initTimeline();
}

// Render posts list view
function renderPostsList(container) {
    // Initialize filter UI with posts
    window.postFilterUI.init(posts);
    
    container.innerHTML = `
        <div id="posts-header">
            <div class="posts-title-area">
                <h1>Posts</h1>
                <p class="posts-description">Explore my blog posts, tutorials, and articles on software development and technology</p>
            </div>
        </div>
        <div id="posts-filter-area">
            ${window.postFilterUI.buildUI()}
        </div>
        <section id="posts-section">
            <div id="posts-container"></div>
            <div id="posts-scroll-indicator" class="posts-scroll-indicator" style="display: none;">
                <span>📜 Scroll to see more posts</span>
            </div>
        </section>
    `;
    
    // Display initial posts
    const { filteredPosts, filterState } = window.postFilterUI.getState();
    displayPosts(filteredPosts, filterState.viewMode);
    
    // Setup filter listeners with callback
    window.postFilterUI.setupListeners((filteredPosts, filterState) => {
        displayPosts(filteredPosts, filterState.viewMode);
    });
}

// Create cached post list item HTML
function createPostListItemHTML(post) {
    // Check cache first
    const cacheKey = `${post.id}-list`;
    if (domCache.postListItems.has(cacheKey)) {
        return domCache.postListItems.get(cacheKey);
    }
    
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

    const html = `
        <article class="post-item" role="link" tabindex="0" onclick="navigateTo('posts', '${post.id}')" onkeydown="if(event.key === 'Enter') navigateTo('posts', '${post.id}')">
            ${imageUrl ? `
                <div class="post-item-image-square">
                    <img src="${imageUrl}" alt="${post.title}" loading="lazy" onerror="if(!this.hasAttribute('data-fallback-tried')){this.setAttribute('data-fallback-tried','true');this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2214%22 fill=%22%23999%22%3EImage Unavailable%3C/text%3E%3C/svg%3E';}" />
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
    
    // Cache the HTML
    domCache.postListItems.set(cacheKey, html);
    return html;
}

// Display posts in grid or list view
function displayPosts(postsToDisplay, viewMode) {
    const container = document.getElementById('posts-container');
    if (!container) return;
    
    container.className = `posts-${viewMode}`;
    
    if (postsToDisplay.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <p>No projects found.</p>
            </div>
        `;
        return;
    }
    
    // Use cached HTML for each post
    container.innerHTML = postsToDisplay.map(post => createPostListItemHTML(post)).join('');
    
    // Check for overflow and show scroll indicator if needed
    checkPostsContainerOverflow();
}

// Check if posts container exceeds available space and show scroll indicator
function checkPostsContainerOverflow() {
    const container = document.getElementById('posts-container');
    if (!container) return;
    
    // Use setTimeout to ensure CSS has fully reflowed after class change
    // This is important for grid vs list view calculations
    setTimeout(() => {
        const hasOverflow = container.scrollHeight > container.clientHeight;
        
        // Log overflow status for debugging
        console.log('Posts Container Overflow Check:', {
            scrollHeight: container.scrollHeight,
            clientHeight: container.clientHeight,
            hasOverflow: hasOverflow,
            overflowAmount: hasOverflow ? container.scrollHeight - container.clientHeight : 0,
            viewMode: container.className // Show which view mode is active
        });
        
        // Show/hide scroll indicator
        const scrollIndicator = document.getElementById('posts-scroll-indicator');
        if (scrollIndicator) {
            scrollIndicator.style.display = hasOverflow ? 'flex' : 'none';
        }
    }, 100); // 100ms delay ensures layout reflow is complete
}

// Render individual post
async function renderPostDetail(container, postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) {
        container.innerHTML = '<p>Post not found.</p>';
        return;
    }

    // Check if we have cached rendered content
    if (domCache.postDetails.has(postId)) {
        const cachedContent = domCache.postDetails.get(postId);
        container.innerHTML = '';
        container.appendChild(cachedContent.cloneNode(true));
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
        await window.postRenderer.renderPost(
            document.getElementById('post-container'),
            post
        );
        
        // Cache the entire rendered container after rendering completes
        // This allows images and dynamic content to be part of the cache
        setTimeout(() => {
            const containerClone = container.cloneNode(true);
            domCache.postDetails.set(postId, containerClone);
        }, 150);
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
    await timelineRenderer.loadTimelineData();
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