import { books, authors, genres, BOOKS_PER_PAGE } from "./data.js";

// Global application state to track current page and filtered matches.
const state = {
  page: 1,
  matches: books,
};

/*
 * Creates a button element that serves as a book preview.
 * @param {Object} book - The book object containing id, title, image, and author.
 * @returns {HTMLElement} - A button element representing the book preview.
 */
function createBookPreview(book) {
  const { author, id, image, title } = book;
  const button = document.createElement("button");
  button.className = "preview";
  button.setAttribute("data-preview", id);
  button.innerHTML = `
    <img class="preview__image" src="${image}" />
    <div class="preview__info">
      <h3 class="preview__title">${title}</h3>
      <div class="preview__author">${authors[author]}</div>
    </div>`;
  return button;
}

/*
 * Renders a list of book previews inside the list container.
 * @param {number} startIndex - The starting index (inclusive).
 * @param {number} endIndex - The ending index (exclusive).
 */
function renderBookList(startIndex, endIndex) {
  const listContainer = document.querySelector("[data-list-items]");
  const fragment = document.createDocumentFragment();
  const subset = state.matches.slice(startIndex, endIndex);

  for (const book of subset) {
    fragment.appendChild(createBookPreview(book));
  }
  listContainer.appendChild(fragment);
}

/*
 * Updates the "Show more" button's label and disabled state based on
 * the remaining number of books to display.
 */
function updateShowMoreButton() {
  const button = document.querySelector("[data-list-button]");
  const remaining = state.matches.length - state.page * BOOKS_PER_PAGE;
  button.disabled = remaining < 1;
  button.innerHTML = `
    <span>Show more</span>
    <span class="list__remaining"> (${remaining > 0 ? remaining : 0})</span>
  `;
}

/*
 * Renders a set of <option> elements for a select dropdown.
 * @param {string} selector - The CSS selector for the select element.
 * @param {Object} optionsObj - An object of key-value pairs representing id and name.
 * @param {string} defaultText - The default option text.
 */
function renderSelectOptions(selector, optionsObj, defaultText) {
  const container = document.querySelector(selector);
  const fragment = document.createDocumentFragment();

  const defaultOption = document.createElement("option");
  defaultOption.value = "any";
  defaultOption.innerText = defaultText;
  fragment.appendChild(defaultOption);

  for (const [id, name] of Object.entries(optionsObj)) {
    const option = document.createElement("option");
    option.value = id;
    option.innerText = name;
    fragment.appendChild(option);
  }
  container.appendChild(fragment);
}

/*
 * Applies the theme by setting CSS variables for light and dark colors.
 * @param {string} theme - Either "night" or "day".
 */
function applyTheme(theme) {
  if (theme === "night") {
    document.documentElement.style.setProperty("--color-dark", "255, 255, 255");
    document.documentElement.style.setProperty("--color-light", "10, 10, 20");
  } else {
    document.documentElement.style.setProperty("--color-dark", "10, 10, 20");
    document.documentElement.style.setProperty(
      "--color-light",
      "255, 255, 255"
    );
  }
}

/*
 * Filters the books based on the search filters provided.
 * @param {Object} filters - An object with title, author, and genre keys.
 * @returns {Array} - An array of books matching the criteria.
 */
function filterBooks(filters) {
  return books.filter((book) => {
    const titleMatch =
      filters.title.trim() === "" ||
      book.title.toLowerCase().includes(filters.title.toLowerCase());
    const authorMatch =
      filters.author === "any" || book.author === filters.author;
    // For genre filtering, we check if the selected genre is either "any" or present in the book's genres.
    const genreMatch =
      filters.genre === "any" || book.genres.includes(filters.genre);
    return titleMatch && authorMatch && genreMatch;
  });
}

/*
 * @param {Object} book - The book object whose details are to be displayed.
 */
function openBookDetails(book) {
  document.querySelector("[data-list-active]").open = true;
  document.querySelector("[data-list-blur]").src = book.image;
  document.querySelector("[data-list-image]").src = book.image;
  document.querySelector("[data-list-title]").innerText = book.title;
  document.querySelector("[data-list-subtitle]").innerText = `${
    authors[book.author]
  } (${new Date(book.published).getFullYear()})`;
  document.querySelector("[data-list-description]").innerText =
    book.description;
}

// Initialization

// Render the initial list of books.
renderBookList(0, BOOKS_PER_PAGE);
updateShowMoreButton();

// Populate the genre and author dropdown filters.
renderSelectOptions("[data-search-genres]", genres, "All Genres");
renderSelectOptions("[data-search-authors]", authors, "All Authors");

// Check user color scheme preference and apply the appropriate theme.
if (
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches
) {
  document.querySelector("[data-settings-theme]").value = "night";
  applyTheme("night");
} else {
  document.querySelector("[data-settings-theme]").value = "day";
  applyTheme("day");
}

// Event Listeners

// Close search overlay when cancel button is clicked.
document.querySelector("[data-search-cancel]").addEventListener("click", () => {
  document.querySelector("[data-search-overlay]").open = false;
});

// Close settings overlay when cancel button is clicked.
document
  .querySelector("[data-settings-cancel]")
  .addEventListener("click", () => {
    document.querySelector("[data-settings-overlay]").open = false;
  });

// When the header search button is clicked, open the search overlay and focus on the title field.
document.querySelector("[data-header-search]").addEventListener("click", () => {
  document.querySelector("[data-search-overlay]").open = true;
  document.querySelector("[data-search-title]").focus();
});

// Open the settings overlay when the header settings button is clicked.
document
  .querySelector("[data-header-settings]")
  .addEventListener("click", () => {
    document.querySelector("[data-settings-overlay]").open = true;
  });

// Close the active book detail overlay.
document.querySelector("[data-list-close]").addEventListener("click", () => {
  document.querySelector("[data-list-active]").open = false;
});

// Handle theme changes from the settings form.
document
  .querySelector("[data-settings-form]")
  .addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const { theme } = Object.fromEntries(formData);
    applyTheme(theme);
    document.querySelector("[data-settings-overlay]").open = false;
  });

// Process the search form submission to filter books.
document
  .querySelector("[data-search-form]")
  .addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const filters = Object.fromEntries(formData);
    const result = filterBooks(filters);

    // Reset state to start over with filtered results.
    state.page = 1;
    state.matches = result;

    // Show/hide the "no results" message.
    const messageElement = document.querySelector("[data-list-message]");
    if (result.length < 1) {
      messageElement.classList.add("list__message_show");
    } else {
      messageElement.classList.remove("list__message_show");
    }

    // Clear the current list and render the first page of filtered books.
    document.querySelector("[data-list-items]").innerHTML = "";
    renderBookList(0, BOOKS_PER_PAGE);
    updateShowMoreButton();

    // Scroll smoothly to the top and close the search overlay.
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.querySelector("[data-search-overlay]").open = false;
  });

// Load more books when the "Show more" button is clicked.
document.querySelector("[data-list-button]").addEventListener("click", () => {
  renderBookList(
    state.page * BOOKS_PER_PAGE,
    (state.page + 1) * BOOKS_PER_PAGE
  );
  state.page += 1;
  updateShowMoreButton();
});

// Delegate click events on the book list container to open book details.
document
  .querySelector("[data-list-items]")
  .addEventListener("click", (event) => {
    // Use the composed event path for cross-browser compatibility.
    const pathArray =
      event.path || (event.composedPath ? event.composedPath() : []);
    let activeBook = null;

    for (const node of pathArray) {
      if (activeBook) break;
      if (node?.dataset?.preview) {
        activeBook = books.find((book) => book.id === node.dataset.preview);
      }
    }

    if (activeBook) {
      openBookDetails(activeBook);
    }
  });
