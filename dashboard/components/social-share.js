import { facebookIcon, xIcon, linkedinIcon } from "./social-icons.js";

class SocialShare extends HTMLElement {
  connectedCallback() {
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
