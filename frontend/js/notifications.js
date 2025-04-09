/**
 * Notification System for School Attendance System
 * This file handles the creation and management of in-app notifications
 */

// Store notification settings
const notificationSettings = {
  duration: 3000, // Duration in ms (default 3 seconds)
  position: "bottom", // Position: top, bottom
  maxVisible: 3, // Maximum number of notifications visible at once
  animationDuration: 300, // Animation duration in ms
};

/**
 * Initialize notification container when DOM is loaded
 */
document.addEventListener("DOMContentLoaded", function () {
  initNotificationContainer();
});

/**
 * Initialize notification container
 * Creates the container if it doesn't exist
 */
function initNotificationContainer() {
  let notificationContainer = document.getElementById("notificationContainer");

  // Create container if it doesn't exist
  if (!notificationContainer) {
    notificationContainer = document.createElement("div");
    notificationContainer.id = "notificationContainer";
    notificationContainer.className = `notification-container ${notificationSettings.position}`;
    document.body.appendChild(notificationContainer);
  }
}

/**
 * Show a notification message
 * @param {string} message - The message to display
 * @param {string} type - Notification type: info, success, error, warning
 * @param {object} options - Additional options for the notification
 */
function showNotification(message, type = "info", options = {}) {
  // Make sure container exists
  initNotificationContainer();

  const notificationContainer = document.getElementById(
    "notificationContainer"
  );

  // Merge default options with provided options
  const settings = {
    ...notificationSettings,
    ...options,
  };

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;

  // Set icon based on type
  let icon = "fa-info-circle";
  if (type === "success") icon = "fa-check-circle";
  if (type === "error") icon = "fa-exclamation-circle";
  if (type === "warning") icon = "fa-exclamation-triangle";

  // Create notification content
  notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
        <button class="notification-close" aria-label="إغلاق">
            <i class="fas fa-times"></i>
        </button>
    `;

  // Add to container
  notificationContainer.appendChild(notification);

  // Add click listener to close button
  const closeButton = notification.querySelector(".notification-close");
  if (closeButton) {
    closeButton.addEventListener("click", () => {
      removeNotification(notification);
    });
  }

  // Check if we need to remove any notifications (if we reached max visible)
  const visibleNotifications =
    notificationContainer.querySelectorAll(".notification");
  if (visibleNotifications.length > settings.maxVisible) {
    // Remove the oldest notification
    removeNotification(visibleNotifications[0]);
  }

  // Add show class after a small delay (for animation effect)
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  // Auto remove after duration
  const timeoutId = setTimeout(() => {
    removeNotification(notification);
  }, settings.duration);

  // Store timeout ID so we can clear it if needed
  notification.dataset.timeoutId = timeoutId;

  // Pause timeout on hover and resume on leave
  notification.addEventListener("mouseenter", () => {
    if (notification.dataset.timeoutId) {
      clearTimeout(parseInt(notification.dataset.timeoutId));
    }
  });

  notification.addEventListener("mouseleave", () => {
    const newTimeoutId = setTimeout(() => {
      removeNotification(notification);
    }, settings.duration / 2); // Use half duration when resuming

    notification.dataset.timeoutId = newTimeoutId;
  });

  return notification;
}

/**
 * Remove a notification with animation
 * @param {HTMLElement} notification - The notification element to remove
 */
function removeNotification(notification) {
  if (!notification) return;

  // Clear any existing timeout
  if (notification.dataset.timeoutId) {
    clearTimeout(parseInt(notification.dataset.timeoutId));
  }

  // Add hide class for animation
  notification.classList.remove("show");
  notification.classList.add("hide");

  // Remove from DOM after animation completes
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, notificationSettings.animationDuration);
}

/**
 * Show a success notification
 * @param {string} message - The message to display
 * @param {object} options - Additional options for the notification
 */
function showSuccessNotification(message, options = {}) {
  return showNotification(message, "success", options);
}

/**
 * Show an error notification
 * @param {string} message - The message to display
 * @param {object} options - Additional options for the notification
 */
function showErrorNotification(message, options = {}) {
  return showNotification(message, "error", options);
}

/**
 * Show a warning notification
 * @param {string} message - The message to display
 * @param {object} options - Additional options for the notification
 */
function showWarningNotification(message, options = {}) {
  return showNotification(message, "warning", options);
}

/**
 * Show an info notification
 * @param {string} message - The message to display
 * @param {object} options - Additional options for the notification
 */
function showInfoNotification(message, options = {}) {
  return showNotification(message, "info", options);
}

/**
 * Clear all notifications
 */
function clearAllNotifications() {
  const notificationContainer = document.getElementById(
    "notificationContainer"
  );
  if (!notificationContainer) return;

  const notifications = notificationContainer.querySelectorAll(".notification");
  notifications.forEach((notification) => {
    removeNotification(notification);
  });
}

/**
 * Update notification settings
 * @param {object} newSettings - New settings to apply
 */
function updateNotificationSettings(newSettings) {
  Object.assign(notificationSettings, newSettings);

  // Update container position if needed
  if (newSettings.position) {
    const notificationContainer = document.getElementById(
      "notificationContainer"
    );
    if (notificationContainer) {
      notificationContainer.className = `notification-container ${newSettings.position}`;
    }
  }
}
