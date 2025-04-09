// Sidebar functionality
document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.querySelector(".sidebar");
  const sidebarItems = document.querySelectorAll(".sidebar-menu-item");
  const sidebarSubMenus = document.querySelectorAll(".sidebar-submenu");
  const pageContent = document.querySelector(".page-content");
  const themeToggleBtn = document.getElementById("themeToggleBtn");

  // Initialize sidebar state from localStorage
  initSidebar();

  // Setup event listeners
  setupEventListeners();

  // Set active menu item based on current page
  setActiveMenuItem();

  /**
   * Initialize sidebar state from localStorage
   */
  function initSidebar() {
    const sidebarState = localStorage.getItem("sidebarState");

    if (sidebarState === "collapsed" && sidebar) {
      sidebar.classList.add("collapsed");
      if (pageContent) {
        pageContent.classList.add("expanded");
      }
    }
  }

  /**
   * Setup event listeners for sidebar interactions
   */
  function setupEventListeners() {
    // Sidebar toggle button
    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener("click", function () {
        toggleSidebar();
      });
    }

    // Sidebar menu items with submenu
    sidebarItems.forEach((item) => {
      const hasSubmenu = item.querySelector(".sidebar-submenu");

      if (hasSubmenu) {
        item.addEventListener("click", function (e) {
          if (e.target.closest(".sidebar-submenu")) return;

          const submenu = this.querySelector(".sidebar-submenu");
          const submenuHeight = submenu.scrollHeight + "px";

          if (submenu.style.maxHeight) {
            submenu.style.maxHeight = null;
            this.classList.remove("open");
          } else {
            // Close other open submenus
            sidebarSubMenus.forEach((otherSubmenu) => {
              if (otherSubmenu !== submenu) {
                otherSubmenu.style.maxHeight = null;
                otherSubmenu.parentElement.classList.remove("open");
              }
            });

            submenu.style.maxHeight = submenuHeight;
            this.classList.add("open");
          }
        });
      }
    });

    // Theme toggle
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener("click", toggleTheme);
    }

    // Close sidebar on mobile when clicking outside
    if (sidebar) {
      document.addEventListener("click", function (e) {
        const isMobile = window.innerWidth < 992;
        if (
          isMobile &&
          !sidebar.contains(e.target) &&
          !sidebarToggle.contains(e.target)
        ) {
          sidebar.classList.add("collapsed");
          if (pageContent) {
            pageContent.classList.add("expanded");
          }
          localStorage.setItem("sidebarState", "collapsed");
        }
      });
    }

    // Handle window resize for responsive behavior
    window.addEventListener("resize", function () {
      if (
        window.innerWidth < 992 &&
        sidebar &&
        !sidebar.classList.contains("collapsed")
      ) {
        sidebar.classList.add("collapsed");
        if (pageContent) {
          pageContent.classList.add("expanded");
        }
        localStorage.setItem("sidebarState", "collapsed");
      }
    });
  }

  /**
   * Toggle sidebar expanded/collapsed state
   */
  function toggleSidebar() {
    if (!sidebar) return;

    sidebar.classList.toggle("collapsed");

    if (pageContent) {
      pageContent.classList.toggle("expanded");
    }

    const newState = sidebar.classList.contains("collapsed")
      ? "collapsed"
      : "expanded";
    localStorage.setItem("sidebarState", newState);

    // If sidebar has animation, wait for it to complete before showing notification
    setTimeout(() => {
      showNotification(
        newState === "collapsed"
          ? "تم تصغير القائمة الجانبية"
          : "تم توسيع القائمة الجانبية"
      );
    }, 300);
  }

  /**
   * Toggle theme between light and dark mode
   */
  function toggleTheme() {
    const currentTheme =
      document.documentElement.getAttribute("data-theme") || "light";
    const newTheme = currentTheme === "light" ? "dark" : "light";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);

    showNotification(
      newTheme === "light"
        ? "تم تغيير المظهر إلى الوضع النهاري"
        : "تم تغيير المظهر إلى الوضع الليلي"
    );
  }

  /**
   * Set active menu item based on current page URL
   */
  function setActiveMenuItem() {
    const currentPage = window.location.pathname.split("/").pop();

    sidebarItems.forEach((item) => {
      const link = item.querySelector("a");
      if (!link) return;

      const linkHref = link.getAttribute("href");

      if (
        linkHref === currentPage ||
        (currentPage === "" && linkHref === "index.html") ||
        (linkHref && currentPage && linkHref.includes(currentPage))
      ) {
        item.classList.add("active");

        // If the item is in a submenu, open the parent
        const parentSubmenu = item.closest(".sidebar-submenu");
        if (parentSubmenu) {
          const parentItem = parentSubmenu.closest(".sidebar-menu-item");
          if (parentItem) {
            parentItem.classList.add("open");
            parentSubmenu.style.maxHeight = parentSubmenu.scrollHeight + "px";
          }
        }
      } else {
        item.classList.remove("active");
      }
    });
  }

  /**
   * Show notification message
   * @param {string} message - The message to display
   * @param {string} type - The notification type (info, success, error, warning)
   */
  function showNotification(message, type = "info") {
    const notificationContainer = document.getElementById(
      "notificationContainer"
    );
    if (!notificationContainer) return;

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;

    // Set icon based on type
    let icon = "fa-info-circle";
    if (type === "success") icon = "fa-check-circle";
    if (type === "error") icon = "fa-exclamation-circle";
    if (type === "warning") icon = "fa-exclamation-triangle";

    notification.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;

    notificationContainer.appendChild(notification);

    // Add animation class after a small delay (for animation effect)
    setTimeout(() => {
      notification.classList.add("show");
    }, 10);

    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove("show");
      notification.classList.add("hide");

      // Remove from DOM after animation completes
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }
});

/**
 * Initialize theme from localStorage (accessed globally)
 */
function initTheme() {
  const currentTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", currentTheme);
}
