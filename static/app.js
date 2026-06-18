document.addEventListener('DOMContentLoaded', () => {
    // State management
    let releaseData = [];
    let selectedUpdateId = null;
    let currentFilterType = 'all';
    let searchQuery = '';

    // DOM Elements
    const btnRefresh = document.getElementById('btn-refresh');
    const spinnerIcon = document.getElementById('spinner-icon');
    const searchInput = document.getElementById('search-input');
    const filterPillsContainer = document.getElementById('filter-pills');
    const visibleCount = document.getElementById('visible-count');
    
    // States
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const emptyState = document.getElementById('empty-state');
    const btnRetry = document.getElementById('btn-retry');
    const releaseNotesContainer = document.getElementById('release-notes-container');
    
    // Composer Elements
    const composerHint = document.getElementById('composer-hint');
    const composerForm = document.getElementById('composer-form');
    const composerStatus = document.getElementById('composer-status');
    const selectedDate = document.getElementById('selected-date');
    const selectedType = document.getElementById('selected-type');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCount = document.getElementById('char-count');
    const charCounter = document.getElementById('char-counter');
    const charWarning = document.getElementById('char-warning');
    const btnTweet = document.getElementById('btn-tweet');

    // Fetch and Load Release Notes
    async function fetchReleaseNotes() {
        showState('loading');
        spinnerIcon.classList.add('spin');
        btnRefresh.disabled = true;

        try {
            const response = await fetch('/api/release-notes');
            if (!response.ok) {
                throw new Error(`Server returned status: ${response.status}`);
            }
            const result = await response.json();
            
            if (result.status === 'success') {
                releaseData = result.data;
                renderReleaseNotes();
                showState('content');
            } else {
                throw new Error(result.message || 'Unknown server error');
            }
        } catch (error) {
            console.error('Error fetching release notes:', error);
            document.getElementById('error-message').textContent = error.message;
            showState('error');
        } finally {
            spinnerIcon.classList.remove('spin');
            btnRefresh.disabled = false;
        }
    }

    // Manage UI States
    function showState(state) {
        loadingState.classList.add('hidden');
        errorState.classList.add('hidden');
        emptyState.classList.add('hidden');
        releaseNotesContainer.classList.add('hidden');

        if (state === 'loading') {
            loadingState.classList.remove('hidden');
        } else if (state === 'error') {
            errorState.classList.remove('hidden');
        } else if (state === 'empty') {
            emptyState.classList.remove('hidden');
        } else if (state === 'content') {
            releaseNotesContainer.classList.remove('hidden');
        }
    }

    // Classify update type to badge styling and filtering category
    function classifyType(typeStr) {
        const type = typeStr.toLowerCase();
        if (type.includes('feature') || type.includes('new')) {
            return { display: 'Feature', class: 'badge-feature', group: 'feature' };
        } else if (type.includes('change') || type.includes('changed') || type.includes('update')) {
            return { display: 'Changed', class: 'badge-changed', group: 'changed' };
        } else if (type.includes('deprecation') || type.includes('deprecated') || type.includes('remove') || type.includes('removed') || type.includes('delete')) {
            return { display: 'Deprecation', class: 'badge-deprecation', group: 'deprecation' };
        } else {
            return { display: typeStr, class: 'badge-default', group: 'other' };
        }
    }

    // Render Release Notes with Filtering and Searching
    function renderReleaseNotes() {
        releaseNotesContainer.innerHTML = '';
        let matchedCount = 0;
        let totalCount = 0;

        releaseData.forEach(day => {
            const dayContainer = document.createElement('div');
            dayContainer.className = 'day-group';
            
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-date-sticky';
            dayHeader.textContent = day.date;
            
            let hasVisibleUpdates = false;

            day.updates.forEach(update => {
                totalCount++;
                const classified = classifyType(update.type);
                
                // Filtering Logic
                const matchesFilter = currentFilterType === 'all' || classified.group === currentFilterType;
                
                // Search Logic
                const matchesSearch = searchQuery === '' || 
                    update.plain_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    update.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    day.date.toLowerCase().includes(searchQuery.toLowerCase());
                
                if (matchesFilter && matchesSearch) {
                    if (!hasVisibleUpdates) {
                        dayContainer.appendChild(dayHeader);
                        hasVisibleUpdates = true;
                    }
                    
                    matchedCount++;
                    
                    const noteCard = document.createElement('div');
                    noteCard.className = `note-item glass-card ${selectedUpdateId === update.id ? 'selected' : ''}`;
                    noteCard.dataset.id = update.id;
                    noteCard.innerHTML = `
                        <div class="note-item-header">
                            <span class="badge ${classified.class}">${classified.display}</span>
                            <span class="note-meta">
                                <i data-lucide="calendar" style="width:13px;height:13px;"></i>
                                ${day.date}
                            </span>
                        </div>
                        <div class="note-body">
                            ${update.content_html}
                        </div>
                    `;
                    
                    // Click handler to select update
                    noteCard.addEventListener('click', () => selectUpdate(update));
                    
                    dayContainer.appendChild(noteCard);
                }
            });

            if (hasVisibleUpdates) {
                releaseNotesContainer.appendChild(dayContainer);
            }
        });

        visibleCount.textContent = `${matchedCount} updates shown`;
        lucide.createIcons();

        if (matchedCount === 0) {
            showState('empty');
        } else {
            showState('content');
        }
    }

    // Handle Selection of an Update
    function selectUpdate(update) {
        // Deselect previous
        document.querySelectorAll('.note-item').forEach(card => {
            card.classList.remove('selected');
        });

        selectedUpdateId = update.id;
        
        // Find and select current card
        const card = document.querySelector(`.note-item[data-id="${update.id}"]`);
        if (card) {
            card.classList.add('selected');
        }

        // Show composer
        composerHint.classList.add('hidden');
        composerForm.classList.remove('hidden');
        composerStatus.textContent = 'Active Selection';
        composerStatus.className = 'status-badge active';
        
        selectedDate.textContent = update.date;
        selectedType.textContent = update.type;
        
        // Build optimal starting tweet text (auto-fitting standard limit 280)
        tweetTextarea.value = generateDefaultTweetText(update);
        updateCharCounter();
    }

    // Intelligently fit tweet text to the 280-char X limit
    function generateDefaultTweetText(update) {
        const datePart = update.date;
        const typePart = update.type;
        const linkPart = update.link;
        
        // Structure: "📢 BigQuery Release (June 17, 2026) - Feature:\n\"[BODY]\"\n\nRead more: [LINK]"
        const prefix = `📢 BigQuery Release (${datePart}) - ${typePart}:\n"`;
        const suffix = `"\n\nRead more: ${linkPart}`;
        
        const fixedLength = prefix.length + suffix.length;
        const availableSpace = 280 - fixedLength;
        
        let bodyText = update.plain_text;
        
        if (bodyText.length > availableSpace) {
            // Truncate text to fit within available space with ellipsis
            bodyText = bodyText.substring(0, availableSpace - 3).trim() + '...';
        }
        
        return `${prefix}${bodyText}${suffix}`;
    }

    // Update Live Character Counter
    function updateCharCounter() {
        const text = tweetTextarea.value;
        const count = text.length;
        charCount.textContent = count;
        
        if (count > 280) {
            charCounter.classList.add('error');
            charWarning.classList.remove('hidden');
        } else {
            charCounter.classList.remove('error');
            charWarning.classList.add('hidden');
        }
    }

    // Open Tweet Action
    function openTweetComposer() {
        const text = tweetTextarea.value;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    }

    // Set up filter pill click handlers
    filterPillsContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.pill');
        if (!pill) return;

        // Reset active pill
        document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        currentFilterType = pill.dataset.type;
        renderReleaseNotes();
    });

    // Search input typing handler (with simple debounce)
    let searchDebounceTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchDebounceTimeout);
        searchDebounceTimeout = setTimeout(() => {
            searchQuery = e.target.value;
            renderReleaseNotes();
        }, 150);
    });

    // Textarea input handler
    tweetTextarea.addEventListener('input', updateCharCounter);

    // Button Actions
    btnRefresh.addEventListener('click', fetchReleaseNotes);
    btnRetry.addEventListener('click', fetchReleaseNotes);
    btnTweet.addEventListener('click', openTweetComposer);

    // Initial load
    fetchReleaseNotes();
});
