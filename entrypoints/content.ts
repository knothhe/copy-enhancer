export default defineContentScript({
  matches: ['*://*.x.com/*', '*://*.twitter.com/*'],
  main() {
    // Inject CSS styles
    const style = document.createElement('style');
    style.textContent = `
      .x-copy-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 8px;
        border-radius: 9999px;
        transition: background-color 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .x-copy-btn:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
      .x-copy-btn svg {
        width: 18px;
        height: 18px;
        fill: currentColor;
      }
      .x-copy-buttons-container {
        display: flex;
        gap: 4px;
        align-items: center;
      }
      .x-copy-tooltip {
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #1d9bf0;
        color: white;
        padding: 12px 24px;
        border-radius: 9999px;
        font-size: 15px;
        font-weight: 600;
        z-index: 2147483647;
        opacity: 0;
        transition: opacity 0.3s;
        pointer-events: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      .x-copy-tooltip.show {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);

    // Create toast notification element
    const toast = document.createElement('div');
    toast.className = 'x-copy-tooltip';
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

    function addCopyButtons(tweet: Element) {
      // Check if buttons already exist
      if (tweet.querySelector('.x-copy-buttons-container')) return;

      // Find the action bar (where the like, retweet buttons are)
      const actionBar = tweet.querySelector('[role="group"]');
      if (!actionBar) return;

      // Create buttons container
      const buttonsContainer = document.createElement('div');
      buttonsContainer.className = 'x-copy-buttons-container';

      // Create "Copy with Link" button
      const copyWithLinkBtn = document.createElement('button');
      copyWithLinkBtn.className = 'x-copy-btn';
      copyWithLinkBtn.innerHTML = copyWithLinkIcon;
      copyWithLinkBtn.title = 'Copy tweet with link';
      copyWithLinkBtn.setAttribute('aria-label', 'Copy tweet with link');

      // Create "Copy Text Only" button
      const copyTextOnlyBtn = document.createElement('button');
      copyTextOnlyBtn.className = 'x-copy-btn';
      copyTextOnlyBtn.innerHTML = copyTextOnlyIcon;
      copyTextOnlyBtn.title = 'Copy tweet text only';
      copyTextOnlyBtn.setAttribute('aria-label', 'Copy tweet text only');

      // Add click handlers
      copyWithLinkBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const tweetText = getTweetText(tweet);
        const tweetUrl = getTweetUrl(tweet);

        if (tweetText && tweetUrl) {
          const copyText = `${tweetText}\n${tweetUrl}\n#X`;
          await copyToClipboard(copyText);
          showToast('Copied with link!');
        }
      });

      copyTextOnlyBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const tweetText = getTweetText(tweet);

        if (tweetText) {
          await copyToClipboard(tweetText);
          showToast('Copied text!');
        }
      });

      buttonsContainer.appendChild(copyWithLinkBtn);
      buttonsContainer.appendChild(copyTextOnlyBtn);

      // Insert buttons into the action bar
      actionBar.appendChild(buttonsContainer);
    }

    function getTweetText(tweet: Element): string | null {
      // Try multiple selectors to find tweet text
      const textSelectors = [
        '[data-testid="tweetText"]',
        '.css-1dbjc4n span[lang]',
        '.tweet-text',
        '[data-testid="tweet"] span'
      ];

      for (const selector of textSelectors) {
        const element = tweet.querySelector(selector);
        if (element) {
          // Get all text content from the tweet
          const textElement = tweet.querySelector('[data-testid="tweetText"]');
          if (textElement) {
            return textElement.textContent?.trim() || null;
          }
        }
      }

      // Fallback: try to find text in the tweet
      const tweetText = tweet.querySelector('[data-testid="tweetText"]');
      return tweetText?.textContent?.trim() || null;
    }

    function getTweetUrl(tweet: Element): string | null {
      // Try to find the tweet link
      const linkElement = tweet.querySelector('a[href*="/status/"]');
      if (linkElement) {
        const href = linkElement.getAttribute('href');
        if (href) {
          // Construct full URL if needed
          if (href.startsWith('/')) {
            return `${window.location.origin}${href}`;
          }
          return href;
        }
      }

      // Alternative: find tweet ID and construct URL
      const tweetElement = tweet.querySelector('[data-testid="tweet"]');
      if (tweetElement) {
        const tweetId = tweetElement.getAttribute('data-tweet-id');
        if (tweetId) {
          const username = window.location.pathname.split('/')[1];
          return `${window.location.origin}/${username}/status/${tweetId}`;
        }
      }

      return null;
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

    // Function to process existing tweets
    function processTweets() {
      const tweets = document.querySelectorAll('[data-testid="tweet"]');
      tweets.forEach(tweet => addCopyButtons(tweet));
    }

    // Initial processing
    processTweets();

    // Watch for new tweets using MutationObserver
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            // Check if the added node is a tweet or contains tweets
            if (node.getAttribute && node.getAttribute('data-testid') === 'tweet') {
              addCopyButtons(node);
            } else {
              // Check for tweets within the added node
              const tweets = node.querySelectorAll?.('[data-testid="tweet"]');
              tweets?.forEach(tweet => addCopyButtons(tweet));
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

    console.log('X Copy Enhancer: Content script loaded');
  },
});
