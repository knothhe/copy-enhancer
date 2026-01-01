export default defineContentScript({
  matches: ['*://linux.do/*'],
  main() {
    // Inject CSS styles
    const style = document.createElement('style');
    style.textContent = `
      .linux-do-copy-btn {
        color: #6d6d6d !important;
      }
      .linux-do-copy-btn svg {
        width: 18px;
        height: 18px;
        display: block;
        fill: #6d6d6d;
      }
      .linux-do-copy-buttons-container {
        display: inline-flex;
        gap: 4px;
        margin-left: 8px;
      }
      .linux-do-tooltip {
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #000;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 15px;
        font-weight: 600;
        z-index: 2147483647;
        opacity: 0;
        transition: opacity 0.3s;
        pointer-events: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      .linux-do-tooltip.show {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);

    // Create toast notification element
    const toast = document.createElement('div');
    toast.className = 'linux-do-tooltip';
    document.body.appendChild(toast);

    function showToast(message: string) {
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 2000);
    }

    // Icons for buttons
    const copyWithLinkIcon = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"></path>
      </svg>
    `;

    const copyTextOnlyIcon = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path>
      </svg>
    `;

    function addCopyButtons(post: Element) {
      // Check if buttons already exist
      if (post.querySelector('.linux-do-copy-btn')) {
        return;
      }

      // Find the post-controls container
      const controls = post.querySelector('.post-controls');
      if (!controls) {
        return;
      }

      // Find the like button to insert before it
      const likeButton = controls.querySelector('.widget-button.like, .like-count');

      // Create first button (copy text only)
      const copyTextOnlyBtn = document.createElement('button');
      copyTextOnlyBtn.className = 'widget-button btn-flat linux-do-copy-btn btn';
      copyTextOnlyBtn.innerHTML = copyTextOnlyIcon;
      copyTextOnlyBtn.title = 'Copy post text only';
      copyTextOnlyBtn.type = 'button';

      // Create second button (copy with link)
      const copyWithLinkBtn = document.createElement('button');
      copyWithLinkBtn.className = 'widget-button btn-flat linux-do-copy-btn btn';
      copyWithLinkBtn.innerHTML = copyWithLinkIcon;
      copyWithLinkBtn.title = 'Copy post with link';
      copyWithLinkBtn.type = 'button';

      // Add click handlers
      copyTextOnlyBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const postText = getPostText(post);

        if (postText) {
          const success = await copyToClipboard(postText);
          if (success) {
            showToast('Copied text!');
          }
        }
      });

      copyWithLinkBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const postText = getPostText(post);
        const postUrl = getPostUrl(post);

        if (postText && postUrl) {
          const copyText = `${postText}\n${postUrl}\n#Linuxdo`;
          await copyToClipboard(copyText);
          showToast('Copied with link!');
        } else {
          showToast('Failed to copy');
        }
      });

      // Insert at the end of controls (so they appear on the right)
      controls.appendChild(copyTextOnlyBtn);
      controls.appendChild(copyWithLinkBtn);
    }

    function getPostText(post: Element): string | null {
      // Try multiple selectors to find post content
      const contentSelectors = [
        '.cooked',
        '.post-content',
        '.topic-body',
        '[itemprop="articleBody"]'
      ];

      for (const selector of contentSelectors) {
        const content = post.querySelector(selector);
        if (content) {
          let text = content.textContent?.trim() || '';
          text = text.replace(/\s+/g, ' ').trim();
          if (text.length > 0) {
            return text;
          }
        }
      }

      // Last resort: get text from post itself
      const text = post.textContent?.trim() || '';
      if (text.length > 0) {
        return text.replace(/\s+/g, ' ').trim();
      }

      return null;
    }

    function getPostUrl(post: Element): string | null {
      let url: string | null = null;

      // Try to find the post link
      const postLink = post.querySelector('a[data-post-number]');
      if (postLink) {
        const href = postLink.getAttribute('href');
        if (href) {
          url = href.startsWith('/') ? `${window.location.origin}${href}` : href;
        }
      }

      // Alternative: try to find any link with post number
      if (!url) {
        const links = post.querySelectorAll('a');
        for (const link of links) {
          const href = link.getAttribute('href');
          if (href && (href.includes('/p/') || href.includes('/t/'))) {
            url = href.startsWith('/') ? `${window.location.origin}${href}` : href;
            break;
          }
        }
      }

      // Fallback: use current page URL
      if (!url) {
        url = window.location.href;
      }

      // Remove ?u parameter from URL
      if (url) {
        try {
          const urlObj = new URL(url);
          urlObj.searchParams.delete('u');
          url = urlObj.toString();
        } catch {
          // If URL parsing fails, return as is
        }
      }

      return url;
    }

    async function copyToClipboard(text: string): Promise<boolean> {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          document.body.removeChild(textArea);
          return true;
        } catch (err) {
          document.body.removeChild(textArea);
          return false;
        }
      }
    }

    // Function to process existing posts
    function processPosts() {
      // Try multiple selectors to find posts
      const postSelectors = [
        '.topic-post',
        'article',
        '[itemprop="articleBody"]',
        '.post'
      ];

      for (const selector of postSelectors) {
        const posts = document.querySelectorAll(selector);
        if (posts.length > 0) {
          posts.forEach(post => addCopyButtons(post));
          break;
        }
      }
    }

    // Wait for page to be ready
    function init() {
      processPosts();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }

    // Watch for new posts using MutationObserver
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            // Check if the added node is a post
            if (node.classList?.contains('topic-post') ||
                node.tagName === 'ARTICLE' ||
                node.classList?.contains('post')) {
              addCopyButtons(node);
            } else {
              // Check for posts within the added node
              const posts = node.querySelectorAll?.('.topic-post, article, .post');
              if (posts && posts.length > 0) {
                posts.forEach(post => addCopyButtons(post));
              }
            }
          }
        });
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  },
});
