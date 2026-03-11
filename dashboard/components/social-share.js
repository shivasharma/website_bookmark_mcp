
class SocialShare extends HTMLElement {
  connectedCallback() {
    // Inline SVGs styled like react-icons
    const facebookIcon = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="24" height="24" rx="6" fill="#1877f2"/><path d="M16 8.5h-2a1 1 0 0 0-1 1V12h3l-.5 3h-2.5v7h-3v-7H8v-3h2V9.5A3.5 3.5 0 0 1 13.5 6h2.5v2.5z" fill="#ffffff"/></svg>`;
    const xIcon = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="24" height="24" rx="6" fill="#222"/><path d="M7 7l10 10M17 7L7 17" stroke="#fff" stroke-width="2.2"/></svg>`;
    const linkedinIcon = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="24" height="24" rx="6" fill="#0a66c2"/><path d="M8.5 17v-6.5M8.5 8.5v.01M12 17v-3.5a1.5 1.5 0 0 1 3 0V17" stroke="#fff" stroke-width="1.7"/><circle cx="8.5" cy="8.5" r="1.2" fill="#fff"/></svg>`;

    const shareUrl = this.getAttribute("url") || window.location.href;
    const shareText = this.getAttribute("text") || "Check this out";
    const shareTitle = this.getAttribute("title") || document.title || "Shared from LinkSync AI";

    this.innerHTML = `
      <div class="social-share-ui">
        <div class="share-title">Share LinkSync AI</div>
        <div class="share-btn-row">
          <button type="button" class="share-btn fb" data-platform="facebook" aria-label="Share on Facebook">
            <span class="share-ico">${facebookIcon}</span>
            <span class="share-label">Facebook</span>
          </button>
          <button type="button" class="share-btn x" data-platform="x" aria-label="Share on X">
            <span class="share-ico">${xIcon}</span>
            <span class="share-label">X</span>
          </button>
          <button type="button" class="share-btn in" data-platform="linkedin" aria-label="Share on LinkedIn">
            <span class="share-ico">${linkedinIcon}</span>
            <span class="share-label">LinkedIn</span>
          </button>
        </div>
        <button type="button" class="btn-outline share-back-btn" id="shareBackBtn">Back to Dashboard</button>
      </div>
    `;

    const openPopup = (url) => {
      const width = 620;
      const height = 680;
      const left = Math.max(0, Math.floor((window.screen.width - width) / 2));
      const top = Math.max(0, Math.floor((window.screen.height - height) / 2));
      window.open(
        url,
        "share-window",
        `width=${width},height=${height},left=${left},top=${top},noopener,noreferrer`
      );
    };

    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);
    const encodedTitle = encodeURIComponent(shareTitle);

    this.querySelectorAll(".share-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const platform = btn.getAttribute("data-platform");
        if (platform === "facebook") {
          openPopup(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`);
          return;
        }
        if (platform === "x") {
          openPopup(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`);
          return;
        }
        if (platform === "linkedin") {
          openPopup(`https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedText}`);
        }
      });
    });

    // Back to Dashboard button
    this.querySelector("#shareBackBtn").addEventListener("click", () => {
      window.location.href = "/";
    });
  }
}

customElements.define("social-share", SocialShare);
