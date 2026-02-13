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

    // Get accomplishments sorted by year/month (newest first)
    getAccomplishments() {
        if (!this.timelineData || !this.timelineData.accomplishments) {
            return [];
        }

        const accomplishments = [...this.timelineData.accomplishments];
        
        // Sort by year (descending) then by month (descending)
        accomplishments.sort((a, b) => {
            if (b.year !== a.year) {
                return b.year - a.year;
            }
            const monthOrder = {
                'January': 1, 'February': 2, 'March': 3, 'April': 4,
                'May': 5, 'June': 6, 'July': 7, 'August': 8,
                'September': 9, 'October': 10, 'November': 11, 'December': 12
            };
            return (monthOrder[b.month] || 0) - (monthOrder[a.month] || 0);
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

    // Build accomplishments timeline HTML (no dates shown, just ordered by date)
    buildAccomplishmentsTimeline() {
        const accomplishments = this.getAccomplishments();
        
        if (!accomplishments || accomplishments.length === 0) {
            return '<p class="timeline-empty">No accomplishments yet</p>';
        }

        let html = '<div class="timeline-events">';

        accomplishments.forEach((item) => {
            html += `
                <div class="timeline-event">
                    <div class="timeline-content">
                        <h3>${item.title}</h3>
                        <p>${item.description}</p>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    // Build work history section
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

            const techHtml = job.technologies && job.technologies.length > 0
                ? job.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')
                : '';

            const responsibilitiesHtml = job.responsibilities && job.responsibilities.length > 0
                ? `<ul class="responsibilities">${job.responsibilities.map(r => `<li>${r}</li>`).join('')}</ul>`
                : '';

            html += `
                <div class="work-history-item">
                    <div class="work-header">
                        <div class="work-position">
                            <h3>${job.position}</h3>
                            <p class="work-company">${job.company}</p>
                        </div>
                        <div class="work-details">
                            <span class="work-period">${startDate} – ${endDate}</span>
                            ${currentBadge}
                        </div>
                    </div>
                    <p class="work-description">${job.description}</p>
                    ${responsibilitiesHtml}
                    ${techHtml ? `<div class="tech-stack">${techHtml}</div>` : ''}
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

    // Initialize timeline (no click handlers needed)
    initTimeline() {
        this.initialized = true;
    }
}

// Create global instance
const timelineRenderer = new TimelineRenderer();
