/**
 * Utility functions for School Attendance System
 * This file contains helper functions for common tasks across the application
 */

/**
 * Format date to Arabic-friendly format
 * @param {Date|string} date - Date object or date string
 * @param {boolean} includeTime - Whether to include time in the formatted date
 * @returns {string} Formatted date string
 */
function formatDate(date, includeTime = false) {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Format options
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  if (includeTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }

  // Use Arabic locale for formatting
  return dateObj.toLocaleDateString("ar-SA", options);
}

/**
 * Format number with Arabic digits
 * @param {number} num - Number to format
 * @param {boolean} addCommas - Whether to add thousand separators
 * @returns {string} Formatted number
 */
function formatNumber(num, addCommas = true) {
  if (num === null || num === undefined) return "";

  // Convert to string
  let numStr = num.toString();

  // Add thousand separators
  if (addCommas) {
    numStr = num.toLocaleString("ar-SA");
  }

  return numStr;
}

/**
 * Validate form input
 * @param {HTMLFormElement} form - Form element to validate
 * @returns {boolean} Whether the form is valid
 */
function validateForm(form) {
  if (!form) return false;

  // Get all required inputs
  const requiredInputs = form.querySelectorAll("[required]");
  let isValid = true;

  // Check each required input
  requiredInputs.forEach((input) => {
    // Reset error state
    input.classList.remove("invalid");
    const errorMessage = input.nextElementSibling?.classList.contains(
      "error-message"
    )
      ? input.nextElementSibling
      : null;

    if (errorMessage) {
      errorMessage.style.display = "none";
    }

    // Check if input is empty
    if (!input.value.trim()) {
      input.classList.add("invalid");

      if (errorMessage) {
        errorMessage.textContent = "هذا الحقل مطلوب";
        errorMessage.style.display = "block";
      }

      isValid = false;
    }

    // Specific validation for email
    if (input.type === "email" && input.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.value.trim())) {
        input.classList.add("invalid");

        if (errorMessage) {
          errorMessage.textContent = "البريد الإلكتروني غير صالح";
          errorMessage.style.display = "block";
        }

        isValid = false;
      }
    }

    // Specific validation for phone numbers
    if (
      (input.type === "tel" || input.dataset.type === "phone") &&
      input.value.trim()
    ) {
      const phoneRegex = /^[\d\+\-\(\) ]{8,15}$/;
      if (!phoneRegex.test(input.value.trim())) {
        input.classList.add("invalid");

        if (errorMessage) {
          errorMessage.textContent = "رقم الهاتف غير صالح";
          errorMessage.style.display = "block";
        }

        isValid = false;
      }
    }
  });

  return isValid;
}

/**
 * Generate random ID
 * @param {number} length - Length of the ID
 * @returns {string} Random ID
 */
function generateRandomId(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";

  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return id;
}

/**
 * Deep clone an object
 * @param {object} obj - Object to clone
 * @returns {object} Cloned object
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce function to limit how often a function is called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Create a delay promise
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after the delay
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if a value is empty (null, undefined, empty string, or empty array)
 * @param {*} value - Value to check
 * @returns {boolean} Whether the value is empty
 */
function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;

  return false;
}

/**
 * Set item in localStorage with automatic JSON stringify
 * @param {string} key - localStorage key
 * @param {*} value - Value to store
 */
function setLocalStorageItem(key, value) {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
}

/**
 * Get item from localStorage with automatic JSON parse
 * @param {string} key - localStorage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Retrieved value or default value
 */
function getLocalStorageItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;

    return JSON.parse(item);
  } catch (error) {
    console.error("Error retrieving from localStorage:", error);
    return defaultValue;
  }
}

/**
 * Export data to Excel file
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file
 * @param {Array} columns - Columns configuration with title and key
 */
function exportToExcel(data, fileName, columns) {
  if (!data || !data.length) {
    showNotification("لا توجد بيانات للتصدير", "warning");
    return;
  }

  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Process column headers
  const headers = columns.map((column) => column.title);

  // Process data for XLSX
  const processedData = data.map((item) => {
    const row = {};
    columns.forEach((column) => {
      row[column.title] = item[column.key];
    });
    return row;
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(processedData, {
    header: headers,
  });

  // Set column widths
  const colWidths = columns.map((column) => ({
    wch: Math.max(column.title.length * 2, 15),
  }));
  worksheet["!cols"] = colWidths;

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Generate and save the file
  XLSX.writeFile(workbook, `${fileName}.xlsx`);

  showNotification(`تم تصدير "${fileName}" بنجاح`, "success");
}

/**
 * Search in array of objects
 * @param {Array} array - Array to search in
 * @param {string} query - Search query
 * @param {Array} fields - Fields to search in
 * @returns {Array} Filtered array
 */
function searchInArray(array, query, fields) {
  if (!query || !query.trim()) return array;

  const searchQuery = query.trim().toLowerCase();

  return array.filter((item) => {
    return fields.some((field) => {
      const value = item[field];
      if (value === null || value === undefined) return false;

      return value.toString().toLowerCase().includes(searchQuery);
    });
  });
}

/**
 * Filter array of objects by multiple fields
 * @param {Array} array - Array to filter
 * @param {Object} filters - Filters object with field-value pairs
 * @returns {Array} Filtered array
 */
function filterArray(array, filters) {
  return array.filter((item) => {
    return Object.entries(filters).every(([field, value]) => {
      // Skip empty filters
      if (isEmpty(value)) return true;

      // Check if item field matches filter value
      return item[field] === value;
    });
  });
}

/**
 * Capitalize first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format phone number for display
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
function formatPhone(phone) {
  if (!phone) return "";

  // Remove non-digit characters
  const digits = phone.replace(/\D/g, "");

  // Format based on length
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // Return original if no format matched
  return phone;
}

/**
 * Generate chart colors with proper contrast for both light and dark themes
 * @param {number} count - Number of colors needed
 * @returns {Array} Array of color objects with light and dark variants
 */
function generateChartColors(count) {
  const baseColors = [
    { light: "#3498db", dark: "#5dade2" }, // Blue
    { light: "#2ecc71", dark: "#58d68d" }, // Green
    { light: "#e74c3c", dark: "#ec7063" }, // Red
    { light: "#f39c12", dark: "#f5b041" }, // Orange
    { light: "#9b59b6", dark: "#af7ac5" }, // Purple
    { light: "#1abc9c", dark: "#48c9b0" }, // Teal
    { light: "#34495e", dark: "#5d6d7e" }, // Dark Blue
    { light: "#d35400", dark: "#e67e22" }, // Dark Orange
    { light: "#16a085", dark: "#45b39d" }, // Dark Teal
    { light: "#8e44ad", dark: "#a569bd" }, // Dark Purple
  ];

  // If we need more colors than our base set, generate additional ones
  if (count > baseColors.length) {
    for (let i = baseColors.length; i < count; i++) {
      // Generate a random color
      const hue = Math.floor(Math.random() * 360);

      // Create light and dark variants
      baseColors.push({
        light: `hsl(${hue}, 70%, 50%)`,
        dark: `hsl(${hue}, 70%, 60%)`,
      });
    }
  }

  // Return the needed colors
  return baseColors.slice(0, count);
}

/**
 * Get appropriate chart colors based on current theme
 * @param {number} count - Number of colors needed
 * @returns {Array} Array of color strings for the current theme
 */
function getChartColors(count) {
  const colors = generateChartColors(count);
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "light";

  return colors.map((color) => color[currentTheme]);
}

/**
 * Check if an element is in viewport
 * @param {HTMLElement} element - Element to check
 * @param {number} offset - Offset in pixels
 * @returns {boolean} Whether the element is in viewport
 */
function isInViewport(element, offset = 0) {
  if (!element) return false;

  const rect = element.getBoundingClientRect();

  return (
    rect.top >= 0 - offset &&
    rect.left >= 0 - offset &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) + offset &&
    rect.right <=
      (window.innerWidth || document.documentElement.clientWidth) + offset
  );
}

/**
 * Animate counter value
 * @param {HTMLElement} element - Element to animate
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} duration - Animation duration in milliseconds
 * @param {Function} formatter - Value formatter function
 */
function animateCounter(
  element,
  start,
  end,
  duration = 1000,
  formatter = null
) {
  if (!element) return;

  // Validate input
  start = parseInt(start) || 0;
  end = parseInt(end) || 0;

  // If already at end value, no need to animate
  if (start === end) {
    element.textContent = formatter ? formatter(end) : end;
    return;
  }

  // Calculate animation parameters
  const range = end - start;
  const increment = range / (duration / 16); // 60fps
  const startTime = performance.now();

  // Animation function
  function updateCounter(timestamp) {
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const value = Math.floor(start + progress * range);

    element.textContent = formatter ? formatter(value) : value;

    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    } else {
      // Ensure final value is exact
      element.textContent = formatter ? formatter(end) : end;
    }
  }

  // Start animation
  requestAnimationFrame(updateCounter);
}

/**
 * Attach animation observers to elements
 * This will trigger animations when elements come into viewport
 */
function setupAnimationObservers() {
  // Get all elements with animation classes
  const animatedElements = document.querySelectorAll(
    ".fade-in, .slide-in, .scale-in"
  );

  // Create intersection observer
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  // Observe each element
  animatedElements.forEach((element) => {
    observer.observe(element);
  });

  // Animate counters when they come into view
  const counterElements = document.querySelectorAll("[data-counter]");

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const value = parseInt(element.dataset.counter) || 0;

          animateCounter(element, 0, value, 1500, (num) => formatNumber(num));
          counterObserver.unobserve(element);
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  counterElements.forEach((element) => {
    counterObserver.observe(element);
  });
}
