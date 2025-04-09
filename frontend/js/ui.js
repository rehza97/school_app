// UI utilities for handling loading states and notifications
const ui = {
  // Show loading overlay
  showLoading: () => {
    const overlay = document.createElement("div");
    overlay.id = "loading-overlay";
    overlay.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>جاري التحميل...</p>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  // Hide loading overlay
  hideLoading: () => {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) {
      overlay.remove();
    }
  },

  // Show notification
  showNotification: (message, type = "info") => {
    const container = document.getElementById("notificationContainer");
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas ${
          type === "success"
            ? "fa-check-circle"
            : type === "error"
            ? "fa-exclamation-circle"
            : "fa-info-circle"
        }"></i>
        <span>${message}</span>
      </div>
      <button class="notification-close">
        <i class="fas fa-times"></i>
      </button>
    `;

    container.appendChild(notification);

    // Add close button functionality
    const closeBtn = notification.querySelector(".notification-close");
    closeBtn.addEventListener("click", () => {
      notification.remove();
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  },

  // Show success notification
  showSuccess: (message) => {
    ui.showNotification(message, "success");
  },

  // Show error notification
  showError: (message) => {
    ui.showNotification(message, "error");
  },

  // Show info notification
  showInfo: (message) => {
    ui.showNotification(message, "info");
  },

  // Disable form inputs
  disableForm: (form) => {
    const inputs = form.querySelectorAll("input, select, button");
    inputs.forEach((input) => {
      input.disabled = true;
    });
  },

  // Enable form inputs
  enableForm: (form) => {
    const inputs = form.querySelectorAll("input, select, button");
    inputs.forEach((input) => {
      input.disabled = false;
    });
  },

  // Show form errors
  showFormErrors: (form, errors) => {
    // Clear previous errors
    form.querySelectorAll(".error-message").forEach((el) => el.remove());
    form
      .querySelectorAll(".error")
      .forEach((el) => el.classList.remove("error"));

    // Add new errors
    Object.entries(errors).forEach(([field, message]) => {
      const input = form.querySelector(`[name="${field}"]`);
      if (input) {
        input.classList.add("error");
        const errorDiv = document.createElement("div");
        errorDiv.className = "error-message";
        errorDiv.textContent = message;
        input.parentNode.appendChild(errorDiv);
      }
    });
  },

  // Clear form errors
  clearFormErrors: (form) => {
    form.querySelectorAll(".error-message").forEach((el) => el.remove());
    form
      .querySelectorAll(".error")
      .forEach((el) => el.classList.remove("error"));
  },
};

export default ui;
