// timeline.js - Timeline and Work History renderer

class TimelineRenderer {
    constructor() {
        this.timelineData = null;
        this.initialized = false;
    }

    // Load timeline data from JSON file
    async loadTimelineData() {
        try {
            const response = await fetch('timeline.json');
            if (!response.ok) {
                throw new Error(`Failed to load timeline.json: ${response.statusText}`);
            }
            this.timelineData = await response.json();
            return true;
        } catch (error) {
            console.error('Error loading timeline data:', error);
            return false;
        }
    }

    // Get accomplishments sorted by year/month (oldest first, chronological)
    getAccomplishments() {
        if (!this.timelineData || !this.timelineData.accomplishments) {
            return [];
        }

        const accomplishments = [...this.timelineData.accomplishments];
        
        // Sort by year (ascending) then by month (ascending) - oldest to newest
        accomplishments.sort((a, b) => {
            if (a.year !== b.year) {
                return a.year - b.year;
            }
            const monthOrder = {
                'January': 1, 'February': 2, 'March': 3, 'April': 4,
                'May': 5, 'June': 6, 'July': 7, 'August': 8,
                'September': 9, 'October': 10, 'November': 11, 'December': 12
            };
            return (monthOrder[a.month] || 0) - (monthOrder[b.month] || 0);
        });

        return accomplishments;
    }

    // Get work history
    getWorkHistory() {
        if (!this.timelineData || !this.timelineData.workHistory) {
            return [];
        }

        const workHistory = [...this.timelineData.workHistory];
        
        // Sort by start year/month (newest first)
        workHistory.sort((a, b) => {
            if (b.startYear !== a.startYear) {
                return b.startYear - a.startYear;
            }
            const monthOrder = {
                'January': 1, 'February': 2, 'March': 3, 'April': 4,
                'May': 5, 'June': 6, 'July': 7, 'August': 8,
                'September': 9, 'October': 10, 'November': 11, 'December': 12
            };
            return (monthOrder[b.startMonth] || 0) - (monthOrder[a.startMonth] || 0);
        });

        return workHistory;
    }

    // Build accomplishments timeline HTML - Expandable cards above timeline bar
    buildAccomplishmentsTimeline() {
        const accomplishments = this.getAccomplishments();
        
        if (!accomplishments || accomplishments.length === 0) {
            return '<p class="timeline-empty">No accomplishments yet</p>';
        }

        let html = '<div class="timeline-container-new">';
        html += '<div class="timeline-items">';

        accomplishments.forEach((item, index) => {
            const postLink = item.postId ? ` onclick="event.stopPropagation(); navigateTo('posts', '${item.postId}')"` : '';
            const postLinkAttr = item.postId ? ' data-has-post="true"' : '';
            
            html += `
                <div class="timeline-item" ${postLinkAttr}>
                    <div class="timeline-preview">
                        <div class="timeline-dot"></div>
                        <h4>${item.title}</h4>
                        <span class="timeline-year">${item.year}</span>
                    </div>
                    <div class="timeline-expanded">
                        <h3>${item.title}</h3>
                        <p class="timeline-date">${item.month} ${item.year}</p>
                        <p class="timeline-description">${item.description}</p>
                        ${item.postId ? `<a href="#posts/${item.postId}" class="timeline-post-link" ${postLink}>View Related Post →</a>` : ''}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        html += '<div class="timeline-bar"></div>';
        html += '</div>';
        return html;
    }

    // Build work history section - Compact version
    buildWorkHistory() {
        const workHistory = this.getWorkHistory();
        
        if (!workHistory || workHistory.length === 0) {
            return '<p class="work-empty">No work history yet</p>';
        }

        let html = '<div class="work-history-items">';

        workHistory.forEach((job) => {
            const startDate = `${job.startMonth} ${job.startYear}`;
            const endDate = job.current 
                ? 'Present' 
                : job.endMonth 
                    ? `${job.endMonth} ${job.endYear}`
                    : `${job.endYear}`;
            
            const currentBadge = job.current 
                ? '<span class="work-current-badge">Current</span>' 
                : '';

            // Render projects if present
            let projectsHtml = '';
            if (job.projects && Array.isArray(job.projects) && job.projects.length > 0) {
                projectsHtml = '<div class="job-projects">';
                job.projects.forEach(project => {
                    // Combine technologies and tags into a single list, dedupe, and limit to 8 items
                    const metaRaw = [];
                    if (Array.isArray(project.technologies)) metaRaw.push(...project.technologies);
                    if (Array.isArray(project.tags)) metaRaw.push(...project.tags);
                    const seen = new Set();
                    const combined = metaRaw.filter(m => {
                        const key = String(m).trim();
                        if (!key || seen.has(key)) return false;
                        seen.add(key);
                        return true;
                    });

                    const visible = combined.slice(0, 8);
                    const moreCount = Math.max(0, combined.length - visible.length);
                    const chipsHtml = visible.map(c => `<span class="project-chip">${c}</span>`).join('');

                    projectsHtml += `
                        <div class="job-project" role="button" aria-expanded="false">
                            <h4 class="project-title">${project.title}</h4>
                            ${project.description ? `<p class="project-desc">${project.description}</p>` : ''}
                            <div class="project-meta">${chipsHtml}${moreCount > 0 ? `<span class="project-more">+${moreCount}</span>` : ''}</div>
                            ${project.postId ? `<a href="#posts/${project.postId}" class="project-link">View Related Post →</a>` : ''}
                        </div>
                    `;
                });
                projectsHtml += '</div>';
            }

            html += `
                <div class="work-history-item">
                    <div class="work-header">
                        <div>
                            <h3>${job.position}</h3>
                            <p class="work-company">${job.company}</p>
                        </div>
                        <span class="work-period">${startDate} – ${endDate}</span>
                        ${currentBadge}
                    </div>
                    <p class="work-description">${job.description}</p>
                    ${projectsHtml}
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    // Build complete home sections
    buildHomeSection() {
        const accomplishmentsSection = `
            <section id="accomplishments">
                <h2>Key Accomplishments</h2>
                <div class="timeline-container">
                    <div class="timeline-line"></div>
                    ${this.buildAccomplishmentsTimeline()}
                </div>
            </section>
        `;

        const workHistorySection = `
            <section id="work-history">
                <h2>Work History</h2>
                ${this.buildWorkHistory()}
            </section>
        `;

        return { accomplishmentsSection, workHistorySection };
    }

    // Initialize timeline with click-based state management and hover delay
    initTimeline() {
        const timelineItems = document.querySelectorAll('.timeline-item');
        const timelineContainer = document.querySelector('.timeline-items');
        let forceOpenItem = null;
        const hoverTimeouts = new Map(); // Track timeouts per item

        timelineItems.forEach(item => {
            const expanded = item.querySelector('.timeline-expanded');
            
            // Natural hover - with 200ms delay on exit
            item.addEventListener('mouseenter', () => {
                clearTimeout(hoverTimeouts.get(item));
                // Only add hover state if nothing is force-open
                if (!forceOpenItem) {
                    item.classList.add('hover-active');
                }
            });
            
            item.addEventListener('mouseleave', () => {
                if (!forceOpenItem) {
                    // Delay removal by 200ms
                    const timeout = setTimeout(() => {
                        item.classList.remove('hover-active');
                    }, 200);
                    hoverTimeouts.set(item, timeout);
                }
            });
            
            // Track expanded popup hover to keep it visible
            if (expanded) {
                expanded.addEventListener('mouseenter', () => {
                    clearTimeout(hoverTimeouts.get(item));
                    if (!forceOpenItem) {
                        item.classList.add('hover-active');
                    }
                });
                
                expanded.addEventListener('mouseleave', () => {
                    if (!forceOpenItem) {
                        const timeout = setTimeout(() => {
                            item.classList.remove('hover-active');
                        }, 200);
                        hoverTimeouts.set(item, timeout);
                    }
                });
            }
            
            // Handle click to force-open/close
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Clear any pending hover timeouts
                clearTimeout(hoverTimeouts.get(item));
                
                // Close previous force-open item
                if (forceOpenItem && forceOpenItem !== item) {
                    forceOpenItem.classList.remove('active');
                    forceOpenItem.classList.remove('hover-active');
                }
                
                // Toggle current item
                if (forceOpenItem === item) {
                    item.classList.remove('active');
                    forceOpenItem = null;
                    timelineContainer.classList.remove('has-active');
                } else {
                    item.classList.add('active');
                    forceOpenItem = item;
                    timelineContainer.classList.add('has-active');
                }
            });
        });

        // Close all when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (forceOpenItem && !forceOpenItem.contains(e.target)) {
                forceOpenItem.classList.remove('active');
                forceOpenItem = null;
                timelineContainer.classList.remove('has-active');
            }
        });

        // Project expand/collapse handling (per job projects)
        // Create a single overlay element for project details so expanding does not affect layout
        const jobProjectElems = Array.from(document.querySelectorAll('.job-project'));
        let activeOverlay = null;
        let activeProjectElem = null;
        let previousActiveElement = null;

        function closeOverlay() {
            if (activeOverlay) {
                document.body.removeChild(activeOverlay);
                activeOverlay = null;
                if (activeProjectElem) activeProjectElem.removeAttribute('aria-expanded');
                activeProjectElem = null;
                document.removeEventListener('click', outsideClickHandler);
                document.removeEventListener('keydown', escHandler);
                // Restore focus to the previously-focused element for accessibility
                if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
                    try { previousActiveElement.focus(); } catch (err) { /* ignore */ }
                }
                previousActiveElement = null;
            }
        }

        function outsideClickHandler(e) {
            if (!activeOverlay) return;
            if (activeProjectElem && (activeProjectElem.contains(e.target) || activeOverlay.contains(e.target))) return;
            closeOverlay();
        }

        function escHandler(e) {
            if (e.key === 'Escape') closeOverlay();
        }

        jobProjectElems.forEach(proj => {
            // Toggle overlay on click; only one overlay at a time
            proj.addEventListener('click', (ev) => {
                ev.stopPropagation();

                // If overlay already open for this proj, close it
                if (activeProjectElem === proj) {
                    closeOverlay();
                    return;
                }

                // Close existing overlay
                closeOverlay();

                // Build overlay content using the DOM inside proj
                const title = proj.querySelector('.project-title')?.textContent || '';
                const descHtml = proj.querySelector('.project-desc')?.innerHTML || '';
                const metaHtml = proj.querySelector('.project-meta')?.innerHTML || '';
                const link = proj.querySelector('.project-link');
                const linkHtml = link ? `<div class="project-overlay-link">${link.outerHTML}</div>` : '';

                const overlay = document.createElement('div');
                overlay.className = 'project-overlay comic-pop';
                overlay.setAttribute('role', 'dialog');
                overlay.setAttribute('aria-modal', 'true');
                overlay.setAttribute('tabindex', '-1');

                // Build overlay content (no decorative burst)
                overlay.innerHTML = `
                    <div class="project-overlay-inner comic-bubble">
                        <button class="project-overlay-close" aria-label="Close popup">×</button>
                        <h3 class="project-overlay-title">${title}</h3>
                        <div class="project-overlay-meta">${metaHtml}</div>
                        <div class="project-overlay-desc">${descHtml}</div>
                        ${linkHtml}
                    </div>
                `;

                document.body.appendChild(overlay);
                activeOverlay = overlay;
                activeProjectElem = proj;
                proj.setAttribute('aria-expanded', 'true');

                // Accessibility: remember previously-focused element and focus the close button
                previousActiveElement = document.activeElement;
                const closeBtn = overlay.querySelector('.project-overlay-close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        closeOverlay();
                    });
                    // allow keyboard to reach it
                    closeBtn.setAttribute('tabindex', '0');
                    // focus once inserted
                    try { closeBtn.focus(); } catch (err) { /* ignore */ }
                }

                // Position overlay centered above the project element if possible
                const rect = proj.getBoundingClientRect();
                // Temporarily position off-screen to measure
                overlay.style.left = '50%';
                overlay.style.top = '50%';
                overlay.style.transform = 'translate(-50%, -50%)';
                overlay.style.visibility = 'hidden';

                // Allow DOM to render
                requestAnimationFrame(() => {
                    const ovRect = overlay.getBoundingClientRect();
                    // Prefer above the element; if not enough space, place below
                    const spaceAbove = rect.top;
                    const spaceBelow = window.innerHeight - rect.bottom;
                    let top;
                    let placement = 'center';
                    if (spaceAbove > ovRect.height + 16) {
                        top = rect.top - ovRect.height - 8;
                        placement = 'above';
                    } else if (spaceBelow > ovRect.height + 16) {
                        top = rect.bottom + 8;
                        placement = 'below';
                    } else {
                        // Center vertically
                        top = Math.max(8, (window.innerHeight - ovRect.height) / 2);
                        placement = 'center';
                    }

                    // Center horizontally over the project; adjust to keep onscreen
                    let left = rect.left + rect.width / 2 - ovRect.width / 2;
                    left = Math.max(8, Math.min(left, window.innerWidth - ovRect.width - 8));

                    overlay.style.left = left + 'px';
                    overlay.style.top = top + 'px';
                    // Set placement for styling the speech-tail (above/below/center)
                    overlay.setAttribute('data-placement', placement);
                    overlay.style.transform = 'none';
                    overlay.style.visibility = 'visible';
                });

                // Bind outside click and ESC handlers
                document.addEventListener('click', outsideClickHandler);
                document.addEventListener('keydown', escHandler);
            });

            // Keyboard support: Enter or Space opens overlay
            proj.setAttribute('tabindex', '0');
            proj.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    proj.click();
                }
            });
        });

        this.initialized = true;
    }
}

// Create global instance
const timelineRenderer = new TimelineRenderer();
