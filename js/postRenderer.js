// postRenderer.js - Render post content blocks and manage gallery

class PostRenderer {
    constructor() {
        this.currentPost = null;
        this.galleryImages = [];
        this.loadedGalleryImages = [];
        this.currentGalleryImages = [];
        this.currentImageIndex = 0;
        this.imageLoadStatus = new Map();
        this.placeholderImage = '/img/placeholder.png';
        // Data URI as ultimate fallback if placeholder.png fails
        this.fallbackDataURI = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23f0f0f0" width="800" height="600"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="24" fill="%23999"%3EImage Not Available%3C/text%3E%3C/svg%3E';
        this.init();
    }

    init() {
        this.loadStylesheet();
        this.setupGalleryModal();
    }

    /**
     * Load external stylesheet
     */
    loadStylesheet() {
        if (document.getElementById('postRenderer-styles')) return;
        const link = document.createElement('link');
        link.id = 'postRenderer-styles';
        link.rel = 'stylesheet';
        link.href = 'css/postRenderer.css';
        document.head.appendChild(link);
    }

    /**
     * Render all blocks for a post
     */
    async renderPost(container, post) {
        this.currentPost = post;
        // Support both old format (post.images.gallery) and new format (post.gallery)
        this.galleryImages = (post.gallery) || (post.images && post.images.gallery) || [];
        
        // Preload and validate all gallery images
        await this.preloadGalleryImages();

        // Determine thumbnail (support old and new formats)
        const thumbnailSrc = post.image || (post.images && post.images.thumbnail);
        
        // Verify thumbnail loads, use placeholder if not
        const bannerSrc = thumbnailSrc && this.imageLoadStatus.get(thumbnailSrc) !== false 
            ? thumbnailSrc 
            : this.placeholderImage;

        // Render header; banner (thumbnail) will be shown above title when present
        let html = `
            <article class="post-article">
                ${thumbnailSrc ? `
                    <div class="post-banner">
                        <img src="${bannerSrc}" alt="${this.escapeHtml(post.title)}" onerror="if(!this.hasAttribute('data-fallback-tried')){this.setAttribute('data-fallback-tried','true');this.src='${this.fallbackDataURI}';}" />
                    </div>
                ` : ''}

                <div class="post-header">
                    <h1 class="post-title">${this.escapeHtml(post.title)}</h1>
                    <div class="post-meta">
                        <time class="post-date">${this.formatDate(post.date)}</time>
                        ${post.tags && post.tags.length > 0 ? `
                            <div class="post-tags">
                                ${post.tags.map(tag => 
                                    `<span class="tag">${this.escapeHtml(tag)}</span>`
                                ).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
        `;

        // Render content blocks
        html += '<div class="post-content">';
        if (post.content && typeof post.content === 'string') {
            // New format: direct HTML string
            html += post.content;
        } else if (post.content && post.content.blocks && post.content.blocks.length > 0) {
            // Old format: block array
            html += post.content.blocks
                .map(block => this.renderBlock(block, post))
                .join('');
        }
        html += '</div>';

        // Render gallery only with loaded images
        if (this.loadedGalleryImages && this.loadedGalleryImages.length > 0) {
            const displayImages = this.loadedGalleryImages.slice(0, 3);
            const hasMore = this.loadedGalleryImages.length > 3;
            
            html += `
                <div class="post-gallery-section">
                    <h2>Gallery</h2>
                    <div class="post-gallery-grid">
                        ${displayImages.map((img, idx) => `
                            <div class="post-gallery-item" data-image-index="${idx}" ${img.isPlaceholder ? 'data-placeholder="true"' : ''}>
                                <img src="${img.src}" alt="${this.escapeHtml(img.alt)}" class="post-image ${img.isPlaceholder ? '' : 'clickable'}" data-loaded="${!img.isPlaceholder}" onerror="if(!this.hasAttribute('data-fallback-tried')){this.setAttribute('data-fallback-tried','true');this.src='${this.fallbackDataURI}';}" />
                                ${img.caption && !img.isPlaceholder ? `<div class="gallery-caption">${this.escapeHtml(img.caption)}</div>` : ''}
                                ${img.isPlaceholder ? `<div class="gallery-caption placeholder-label">Image unavailable</div>` : ''}
                            </div>
                        `).join('')}
                        ${hasMore ? `
                            <div class="post-gallery-item show-all-item" data-image-index="0">
                                <div class="show-all-overlay">
                                    <div class="show-all-content">
                                        <span class="show-all-icon">+${this.loadedGalleryImages.length - 3}</span>
                                        <span class="show-all-text">View All</span>
                                    </div>
                                </div>
                                <img src="${this.loadedGalleryImages[3].src}" alt="View all images" class="post-image" data-loaded="true" onerror="if(!this.hasAttribute('data-fallback-tried')){this.setAttribute('data-fallback-tried','true');this.src='${this.fallbackDataURI}';}" />
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        html += '</article>';

        container.innerHTML = html;

        // Setup gallery click handlers
        this.setupGalleryHandlers(post);
    }

    /**
     * Render individual content block
     */
    renderBlock(block, post) {
        switch (block.type) {
            case 'paragraph':
                return `<p class="block-paragraph">${this.escapeHtml(block.text)}</p>`;

            case 'heading':
                const headingClass = `block-heading heading-${block.level}`;
                return `<h${block.level} class="${headingClass}">${this.escapeHtml(block.text)}</h${block.level}>`;

            case 'list':
                const tag = block.ordered ? 'ol' : 'ul';
                const items = block.items
                    .map(item => `<li>${this.escapeHtml(item)}</li>`)
                    .join('');
                return `<${tag} class="block-list block-list-${tag}">${items}</${tag}>`;

            case 'code':
                return `
                    <pre class="block-code"><code class="language-${block.language || 'plaintext'}">
${this.escapeHtml(block.text)}
                    </code></pre>
                `;

            case 'blockquote':
                return `<blockquote class="block-quote"><p>${this.escapeHtml(block.text)}</p></blockquote>`;

            case 'image':
                const imgData = this.galleryImages.find(img => img.id === block.imageId);
                if (!imgData) return '';
                
                // Check if image is successfully loaded
                const isLoaded = this.imageLoadStatus.get(imgData.src) === true;
                const imgSrc = isLoaded ? imgData.src : this.placeholderImage;
                const clickableClass = isLoaded ? 'post-image clickable' : 'post-image';

                return `
                    <figure class="block-image" data-image-id="${block.imageId}">
                        <div class="image-container">
                            <img 
                                src="${imgSrc}" 
                                alt="${this.escapeHtml(imgData.alt)}"
                                class="${clickableClass}"
                                ${isLoaded ? 'data-loaded="true"' : 'data-loaded="false"'}
                                onerror="if(!this.hasAttribute('data-fallback-tried')){this.setAttribute('data-fallback-tried','true');this.src='${this.fallbackDataURI}';}"
                            >
                        </div>
                        ${block.caption || imgData.caption ? `
                            <figcaption>${this.escapeHtml(block.caption || imgData.caption)}</figcaption>
                        ` : ''}
                    </figure>
                `;

            case 'link':
                return `<p class="block-link"><a href="${this.escapeHtml(block.href)}" target="_blank" rel="noopener">${this.escapeHtml(block.text)}</a></p>`;

            case 'two-column':
                return `
                    <div class="block-two-column">
                        <div class="column column-left">
                            ${block.left ? this.escapeHtml(block.left) : ''}
                        </div>
                        <div class="column column-right">
                            ${block.right ? this.escapeHtml(block.right) : ''}
                        </div>
                    </div>
                `;

            case 'callout':
                const calloutType = block.calloutType || 'info';
                return `
                    <div class="block-callout callout-${calloutType}">
                        ${block.title ? `<div class="callout-title">${this.escapeHtml(block.title)}</div>` : ''}
                        <div class="callout-content">${this.escapeHtml(block.text)}</div>
                    </div>
                `;

            case 'divider':
                return `<hr class="block-divider">`;

            case 'video':
                return `
                    <div class="block-video">
                        <iframe 
                            src="${this.escapeHtml(block.url)}" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen
                            title="${this.escapeHtml(block.title || 'Video')}"
                        ></iframe>
                        ${block.caption ? `<p class="video-caption">${this.escapeHtml(block.caption)}</p>` : ''}
                    </div>
                `;

            default:
                return '';
        }
    }

    /**
     * Setup gallery modal
     */
    setupGalleryModal() {
        if (document.getElementById('post-gallery-modal')) return;

        const modalHTML = `
            <div id="post-gallery-modal" class="gallery-modal hidden" role="dialog" aria-modal="true">
                <div class="gallery-overlay" onclick="postRenderer?.closeGallery()" aria-hidden="true"></div>
                <div class="gallery-container" role="document">
                    <button class="gallery-close" onclick="postRenderer?.closeGallery()" aria-label="Close gallery">&times;</button>

                    <div class="gallery-main">
                        <button class="gallery-nav gallery-prev" onclick="postRenderer?.previousImage()" aria-label="Previous image">❮</button>

                        <div class="gallery-image-wrap">
                            <img id="gallery-img" src="" alt="">
                            <div class="gallery-filename" id="gallery-filename"></div>
                        </div>

                        <button class="gallery-nav gallery-next" onclick="postRenderer?.nextImage()" aria-label="Next image">❯</button>
                    </div>

                    <div class="gallery-footer">
                        <div class="gallery-counter">
                            <span id="gallery-current">1</span> / <span id="gallery-total">1</span>
                        </div>
                    </div>

                    <div class="gallery-caption-box">
                        <div class="gallery-caption" id="gallery-caption"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.setupGalleryKeyboard();
    }


    /**
     * Preload all gallery images and use placeholder for failed ones
     */
    async preloadGalleryImages() {
        if (!this.galleryImages || this.galleryImages.length === 0) {
            this.loadedGalleryImages = [];
            return;
        }

        // Check banner/thumbnail image if present
        const thumbnailSrc = this.currentPost.image || (this.currentPost.images && this.currentPost.images.thumbnail);
        if (thumbnailSrc) {
            const thumbnailLoaded = await this.checkImageLoads(thumbnailSrc);
            this.imageLoadStatus.set(thumbnailSrc, thumbnailLoaded);
        }

        const loadPromises = this.galleryImages.map(img => 
            this.checkImageLoads(img.src)
                .then(loaded => ({ img, loaded }))
        );

        const results = await Promise.all(loadPromises);
        
        // For failed images, replace src with placeholder
        this.loadedGalleryImages = results.map(result => {
            const imgCopy = { ...result.img };
            if (!result.loaded) {
                imgCopy.src = this.placeholderImage;
                imgCopy.alt = result.img.alt || 'Image not available';
                imgCopy.isPlaceholder = true;
            }
            return imgCopy;
        });
        
        // Store load status for each image
        results.forEach(result => {
            this.imageLoadStatus.set(result.img.src, result.loaded);
        });

        const failedCount = results.filter(r => !r.loaded).length;
        if (failedCount > 0) {
            console.log(`Gallery: ${failedCount}/${this.galleryImages.length} images replaced with placeholder`);
        }
    }

    /**
     * Check if an image can be loaded
     */
    checkImageLoads(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = src;
            
            // Timeout after 5 seconds
            setTimeout(() => resolve(false), 5000);
        });
    }

    /**
     * Setup gallery click handlers (only for loaded images)
     */
    setupGalleryHandlers(post) {
        const galleryItems = document.querySelectorAll('.post-gallery-item');
        
        galleryItems.forEach(item => {
            const img = item.querySelector('img');
            const imageIndex = parseInt(item.getAttribute('data-image-index'));
            const isPlaceholder = item.getAttribute('data-placeholder') === 'true';
            
            // Only allow clicks on non-placeholder images
            if (img && img.getAttribute('data-loaded') === 'true' && !isPlaceholder) {
                item.style.cursor = 'pointer';
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.openGallery(imageIndex);
                });
            } else if (isPlaceholder) {
                // Disable clicking on placeholder images
                item.style.cursor = 'default';
                item.title = 'Image not available';
            }
        });
        
        // Handle clickable images in content blocks
        const contentImages = document.querySelectorAll('.post-content .post-image.clickable');
        contentImages.forEach(img => {
            const imageLoaded = img.complete && img.naturalHeight > 0;
            
            if (imageLoaded) {
                img.style.cursor = 'pointer';
                img.addEventListener('click', () => {
                    // Find index in loaded gallery
                    const src = img.src;
                    const index = this.loadedGalleryImages.findIndex(gImg => gImg.src === src);
                    if (index !== -1) {
                        this.openGallery(index);
                    }
                });
            } else {
                img.style.cursor = 'not-allowed';
                img.style.opacity = '0.5';
                img.title = 'Image not available';
                img.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            }
        });
    }

    /**
     * Open gallery at specific index (skip placeholders)
     */
    openGallery(startIndex = 0) {
        // Filter out placeholder images for gallery modal
        const viewableImages = this.loadedGalleryImages.filter(img => !img.isPlaceholder);
        
        if (!viewableImages || viewableImages.length === 0) {
            console.warn('No viewable images available for gallery');
            return;
        }
        
        this.currentImageIndex = Math.max(0, Math.min(startIndex, viewableImages.length - 1));
        this.currentGalleryImages = viewableImages;
        
        const modal = document.getElementById('post-gallery-modal');
        modal.classList.remove('hidden');
        this.updateGalleryDisplay();
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close gallery
     */
    closeGallery() {
        const modal = document.getElementById('post-gallery-modal');
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    /**
     * Navigate to next image
     */
    nextImage() {
        const images = this.currentGalleryImages || this.loadedGalleryImages;
        if (!images || images.length === 0) return;
        
        this.currentImageIndex = (this.currentImageIndex + 1) % images.length;
        this.updateGalleryDisplay();
    }

    /**
     * Navigate to previous image
     */
    previousImage() {
        const images = this.currentGalleryImages || this.loadedGalleryImages;
        if (!images || images.length === 0) return;
        
        this.currentImageIndex = (this.currentImageIndex - 1 + images.length) % images.length;
        this.updateGalleryDisplay();
    }

    /**
     * Update gallery display
     */
    updateGalleryDisplay() {
        const images = this.currentGalleryImages || this.loadedGalleryImages;
        if (!images || images.length === 0) return;
        const img = images[this.currentImageIndex];
        const galleryImg = document.getElementById('gallery-img');
        
        // Add fallback handler for gallery images (only fallback once)
        galleryImg.onerror = () => {
            if (!galleryImg.hasAttribute('data-fallback-tried')) {
                galleryImg.setAttribute('data-fallback-tried', 'true');
                galleryImg.src = this.fallbackDataURI;
            }
        };
        
        galleryImg.src = img.src;
        galleryImg.alt = img.alt;
        document.getElementById('gallery-caption').textContent = img.caption || '';
        document.getElementById('gallery-current').textContent = this.currentImageIndex + 1;
        document.getElementById('gallery-total').textContent = images.length;
        const filenameEl = document.getElementById('gallery-filename');
        if (filenameEl) {
            filenameEl.textContent = img.name || this.getFilenameFromSrc(img.src) || '';
        }
    }

    getFilenameFromSrc(src) {
        try {
            const parts = src.split('/');
            const last = parts[parts.length - 1];
            return decodeURIComponent((last || '').split('?')[0]);
        } catch (e) {
            return '';
        }
    }

    /**
     * Setup keyboard navigation
     */
    setupGalleryKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('post-gallery-modal').classList.contains('hidden')) return;

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                this.nextImage();
            }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.previousImage();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                this.closeGallery();
            }
        });
    }

    /**
     * Utility: Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Utility: Format date
     */
    formatDate(dateStr) {
        // Parse as local date to avoid timezone offset issues
        const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Initialize globally
window.postRenderer = new PostRenderer();
