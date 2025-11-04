// Search functionality for btcsuite.github.io

(function() {
  'use strict';

  // Initialize search when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search_input');
    const searchResultsInfo = document.getElementById('search_results_info');
    const mainContent = document.getElementById('main_content');
    
    if (!searchInput || !mainContent) {
      return;
    }

    // Store original content for reset
    const originalHTML = mainContent.innerHTML;
    let searchTimeout;

    // Escape special regex characters
    function escapeRegex(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Highlight text content
    function highlightText(text, searchTerm) {
      if (!searchTerm) return text;
      const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
      return text.replace(regex, '<mark class="search-highlight">$1</mark>');
    }

    // Group content by h3 sections
    function groupBySections() {
      const sections = [];
      let currentSection = null;
      
      Array.from(mainContent.children).forEach(element => {
        if (element.tagName === 'H3') {
          currentSection = {
            heading: element,
            elements: [element]
          };
          sections.push(currentSection);
        } else if (currentSection) {
          currentSection.elements.push(element);
        } else {
          // Content before first h3
          if (sections.length === 0) {
            sections.push({ heading: null, elements: [] });
          }
          sections[0].elements.push(element);
        }
      });
      
      return sections;
    }

    // Search and filter content
    function performSearch(searchTerm) {
      // Reset to original content first
      mainContent.innerHTML = originalHTML;
      
      if (!searchTerm || searchTerm.trim() === '') {
        searchResultsInfo.textContent = '';
        searchResultsInfo.style.display = 'none';
        return;
      }

      const term = searchTerm.trim();
      const termLower = term.toLowerCase();
      const sections = groupBySections();
      let matchCount = 0;
      const visibleSections = [];

      // Find matching sections
      sections.forEach(section => {
        const sectionText = section.elements
          .map(el => el.textContent || el.innerText || '')
          .join(' ')
          .toLowerCase();
        
        if (sectionText.includes(termLower)) {
          matchCount++;
          visibleSections.push(section);
        }
      });

      if (matchCount > 0) {
        // Hide all sections first
        sections.forEach(section => {
          section.elements.forEach(el => {
            el.style.display = 'none';
          });
        });

        // Show and highlight matching sections
        visibleSections.forEach(section => {
          section.elements.forEach(element => {
            element.style.display = '';
            
            // Highlight text in headings, paragraphs, and list items
            // Skip code blocks
            if (element.tagName === 'H3' || element.tagName === 'P' || element.tagName === 'LI') {
              const originalText = element.textContent || element.innerText || '';
              if (originalText.toLowerCase().includes(termLower)) {
                const highlighted = highlightText(originalText, term);
                element.innerHTML = highlighted;
              }
            } else if (element.tagName !== 'PRE' && element.tagName !== 'CODE') {
              // For other elements, search and highlight their text content
              const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                {
                  acceptNode: function(node) {
                    // Skip text nodes inside code/pre
                    const parent = node.parentElement;
                    if (parent && (parent.tagName === 'CODE' || parent.tagName === 'PRE')) {
                      return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                  }
                },
                false
              );
              
              const textNodes = [];
              let node;
              while (node = walker.nextNode()) {
                textNodes.push(node);
              }
              
              textNodes.forEach(textNode => {
                const text = textNode.textContent;
                if (text.toLowerCase().includes(termLower)) {
                  const highlighted = highlightText(text, term);
                  const wrapper = document.createElement('span');
                  wrapper.innerHTML = highlighted;
                  
                  while (wrapper.firstChild) {
                    textNode.parentNode.insertBefore(wrapper.firstChild, textNode);
                  }
                  textNode.parentNode.removeChild(textNode);
                }
              });
            }
          });
        });

        searchResultsInfo.textContent = `Found ${matchCount} section${matchCount !== 1 ? 's' : ''} with matches`;
        searchResultsInfo.style.display = 'block';
      } else {
        mainContent.innerHTML = '<p style="padding: 20px; text-align: center; color: #999;">No results found. Try a different search term.</p>';
        searchResultsInfo.textContent = 'No results found';
        searchResultsInfo.style.display = 'block';
      }
    }

    // Handle search input
    searchInput.addEventListener('input', function(e) {
      const searchTerm = e.target.value;
      
      // Debounce search
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(function() {
        performSearch(searchTerm);
      }, 300);
    });

    // Handle escape key to clear search
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        searchInput.value = '';
        performSearch('');
        searchInput.blur();
      }
    });

    // Clear search on blur if empty
    searchInput.addEventListener('blur', function() {
      if (searchInput.value.trim() === '') {
        performSearch('');
      }
    });
  });
})();
