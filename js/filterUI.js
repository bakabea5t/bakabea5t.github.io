// filterUI.js - Minimalist post filtering system

class PostFilterUI {
    constructor() {
        this.posts = [];
        this.filteredPosts = [];
        this.allTags = [];
        this.filterState = {
            searchTerm: '',
            selectedTags: [],
            sortOrder: 'newest',
            viewMode: 'grid'
        };
        // Cache for filter UI HTML to avoid rebuilding
        this.uiCache = null;
        this.lastFilterKey = '';
    }

    // Initialize with posts data
    init(posts) {
        this.posts = posts;
        this.extractAllTags();
        this.filterAndSortPosts();
    }

    // Extract unique tags from posts
    extractAllTags() {
        const tagSet = new Set();
        this.posts.forEach(post => {
            if (post.tags && Array.isArray(post.tags)) {
                post.tags.forEach(tag => tagSet.add(tag));
            }
        });
        this.allTags = Array.from(tagSet).sort();
    }

    // Filter and sort posts
    filterAndSortPosts() {
        // Create a cache key based on current filter state
        const filterKey = JSON.stringify({
            search: this.filterState.searchTerm,
            tags: this.filterState.selectedTags.sort(),
            sort: this.filterState.sortOrder
        });
        
        // Return cached results if filter hasn't changed
        if (filterKey === this.lastFilterKey && this.filteredPosts.length > 0) {
            return this.filteredPosts;
        }
        
        this.lastFilterKey = filterKey;
        let result = [...this.posts];
        
        // Apply search filter
        if (this.filterState.searchTerm) {
            const searchLower = this.filterState.searchTerm.toLowerCase();
            result = result.filter(post => {
                const titleMatch = post.title.toLowerCase().includes(searchLower);
                const descMatch = post.shortDescription?.toLowerCase().includes(searchLower) || false;
                const tagMatch = post.tags?.some(tag => tag.toLowerCase().includes(searchLower)) || false;
                return titleMatch || descMatch || tagMatch;
            });
        }
        
        // Apply tag filter
        if (this.filterState.selectedTags.length > 0) {
            result = result.filter(post => {
                return post.tags && this.filterState.selectedTags.some(tag => post.tags.includes(tag));
            });
        }
        
        // Apply sort
        if (this.filterState.sortOrder === 'newest') {
            result.sort((a, b) => new Date(b.date) - new Date(a.date));
        } else {
            result.sort((a, b) => new Date(a.date) - new Date(b.date));
        }
        
        this.filteredPosts = result;
        return result;
    }

    // Build minimalist filter UI HTML
    buildUI() {
        const tagCheckboxes = this.allTags.map(tag => {
            const isChecked = this.filterState.selectedTags.includes(tag);
            return `
                <label class="tag-dropdown-item">
                    <input type="checkbox" value="${tag}" ${isChecked ? 'checked' : ''}>
                    <span>${tag}</span>
                </label>
            `;
        }).join('');
        
        const selectedCount = this.filterState.selectedTags.length;
        let tagButtonText;
        if (selectedCount === 0) {
            tagButtonText = 'Tags';
        } else if (selectedCount === 1) {
            tagButtonText = this.filterState.selectedTags[0];
        } else {
            tagButtonText = `Tags (${selectedCount})`;
        }
        
        return `
            <div class="filter-bar">
                <input 
                    type="text" 
                    id="filter-search" 
                    placeholder="Search..." 
                    value="${this.filterState.searchTerm}"
                />
                
                <div class="filter-tags-dropdown">
                    <button id="filter-tags-btn" class="${selectedCount > 0 ? 'has-selection' : ''}">
                        <span class="tag-btn-text">${tagButtonText}</span>
                        <span class="tag-btn-arrow">▾</span>
                    </button>
                    <div id="filter-tags-menu" class="filter-tags-menu">
                        ${tagCheckboxes}
                    </div>
                </div>
                
                <select id="filter-sort">
                    <option value="newest" ${this.filterState.sortOrder === 'newest' ? 'selected' : ''}>Newest</option>
                    <option value="oldest" ${this.filterState.sortOrder === 'oldest' ? 'selected' : ''}>Oldest</option>
                </select>
                
                <div class="filter-view-toggle">
                    <button id="filter-grid-btn" class="${this.filterState.viewMode === 'grid' ? 'active' : ''}" title="Grid View">⊞</button>
                    <button id="filter-list-btn" class="${this.filterState.viewMode === 'list' ? 'active' : ''}" title="List View">☰</button>
                </div>
                
                ${this.filterState.searchTerm || this.filterState.selectedTags.length > 0 ? 
                    '<button id="filter-clear" title="Clear filters">✕</button>' : ''}
                
                <span class="filter-count">${this.filteredPosts.length}/${this.posts.length}</span>
            </div>
        `;
    }

    // Setup event listeners
    setupListeners(onFilterChange) {
        // Search input
        const searchInput = document.getElementById('filter-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterState.searchTerm = e.target.value;
                this.applyFilters(onFilterChange);
            });
        }
        
        // Tag dropdown (custom multiselect)
        const tagBtn = document.getElementById('filter-tags-btn');
        const tagMenu = document.getElementById('filter-tags-menu');
        
        if (tagBtn && tagMenu) {
            // Toggle dropdown
            tagBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = tagMenu.classList.contains('show');
                tagMenu.classList.toggle('show', !isOpen);
            });
            
            // Handle checkbox changes
            const checkboxes = tagMenu.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    e.stopPropagation();
                    const tag = checkbox.value;
                    
                    if (checkbox.checked) {
                        if (!this.filterState.selectedTags.includes(tag)) {
                            this.filterState.selectedTags.push(tag);
                        }
                    } else {
                        this.filterState.selectedTags = this.filterState.selectedTags.filter(t => t !== tag);
                    }
                    
                    // Update button text
                    const count = this.filterState.selectedTags.length;
                    let buttonText;
                    if (count === 0) {
                        buttonText = 'Tags';
                    } else if (count === 1) {
                        buttonText = this.filterState.selectedTags[0];
                    } else {
                        buttonText = `Tags (${count})`;
                    }
                    const textSpan = tagBtn.querySelector('.tag-btn-text');
                    if (textSpan) {
                        textSpan.textContent = buttonText;
                    }
                    tagBtn.classList.toggle('has-selection', count > 0);
                    
                    this.applyFilters(onFilterChange);
                });
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!tagBtn.contains(e.target) && !tagMenu.contains(e.target)) {
                    tagMenu.classList.remove('show');
                }
            });
            
            // Prevent dropdown from closing when clicking inside
            tagMenu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        // Sort select
        const sortSelect = document.getElementById('filter-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.filterState.sortOrder = e.target.value;
                this.applyFilters(onFilterChange);
            });
        }
        
        // View toggle buttons
        const gridBtn = document.getElementById('filter-grid-btn');
        const listBtn = document.getElementById('filter-list-btn');
        
        if (gridBtn) {
            gridBtn.addEventListener('click', () => {
                this.filterState.viewMode = 'grid';
                this.updateViewButtons();
                onFilterChange(this.filteredPosts, this.filterState);
            });
        }
        
        if (listBtn) {
            listBtn.addEventListener('click', () => {
                this.filterState.viewMode = 'list';
                this.updateViewButtons();
                onFilterChange(this.filteredPosts, this.filterState);
            });
        }
        
        // Clear button
        const clearBtn = document.getElementById('filter-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.resetFilters();
                onFilterChange(this.filteredPosts, this.filterState);
            });
        }
    }

    // Apply filters and trigger callback
    applyFilters(onFilterChange) {
        this.filterAndSortPosts();
        onFilterChange(this.filteredPosts, this.filterState);
    }

    // Update view button states
    updateViewButtons() {
        const gridBtn = document.getElementById('filter-grid-btn');
        const listBtn = document.getElementById('filter-list-btn');
        
        if (gridBtn && listBtn) {
            gridBtn.classList.toggle('active', this.filterState.viewMode === 'grid');
            listBtn.classList.toggle('active', this.filterState.viewMode === 'list');
        }
    }

    // Reset all filters
    resetFilters() {
        this.filterState.searchTerm = '';
        this.filterState.selectedTags = [];
        this.filterState.sortOrder = 'newest';
        this.lastFilterKey = ''; // Invalidate cache
        this.filterAndSortPosts();
    }

    // Clear cache (useful when posts data changes)
    clearCache() {
        this.uiCache = null;
        this.lastFilterKey = '';
    }

    // Get current state
    getState() {
        return {
            filteredPosts: this.filteredPosts,
            filterState: { ...this.filterState }
        };
    }
}

// Create global instance
window.postFilterUI = new PostFilterUI();
