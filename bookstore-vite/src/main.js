import './style.css';

// State
let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let token = localStorage.getItem('token') || null;
let books = [];
let cart = [];

// API functions
const API_URL = 'http://localhost:3001/api';  // Updated to use the correct backend URL

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  fetchBooks();  // Fetch books immediately

  // Add event listeners for admin login
  document.getElementById('adminLoginModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'adminLoginModal') {
      hideAdminLogin();
    }
  });

  document.getElementById('modalOverlay')?.addEventListener('click', () => {
    hideModals();
  });

  // Add console log to debug admin login button
  const adminLoginBtn = document.querySelector('button[onclick="showAdminLogin()"]');
  if (adminLoginBtn) {
    console.log('Admin login button found');
    adminLoginBtn.addEventListener('click', () => {
      console.log('Admin login button clicked');
      showAdminLogin();
    });
  } else {
    console.log('Admin login button not found');
  }
});

async function fetchBooks() {
  try {
    console.log('Fetching books...');
    const response = await fetch(`${API_URL}/books`);
    console.log('Response:', response);
    books = await response.json();
    console.log('Books received:', books);
    renderBooks();
  } catch (error) {
    console.error('Error fetching books:', error);
    showError('Error fetching books');
  }
}

async function login(username, password) {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    currentUser = data.user;
    token = data.token;
    localStorage.setItem('user', JSON.stringify(currentUser));
    localStorage.setItem('token', token);

    hideLoginModal();
    initializeApp();
    if (currentUser) await fetchCart();
  } catch (error) {
    showError(error.message);
  }
}

async function register(username, password) {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    currentUser = data.user;
    token = data.token;
    localStorage.setItem('user', JSON.stringify(currentUser));
    localStorage.setItem('token', token);

    hideSignupModal();
    initializeApp();
  } catch (error) {
    showError(error.message);
  }
}

async function logout() {
  currentUser = null;
  token = null;
  cart = [];
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  initializeApp();
}

async function fetchCart() {
  try {
    const response = await fetch(`${API_URL}/cart`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    cart = await response.json();
    updateCartIcon();
  } catch (error) {
    showError('Error fetching cart');
  }
}

async function addToCart(bookId) {
  try {
    console.log('Adding to cart, bookId:', bookId);
    const response = await fetch(`${API_URL}/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ bookId })
    });

    console.log('Add to cart response:', response);
    const data = await response.json();
    console.log('Add to cart data:', data);
    
    if (!response.ok) throw new Error(data.message);

    await fetchCart();
    showSuccess('Book added to cart');
  } catch (error) {
    console.error('Add to cart error:', error);
    showError(error.message);
  }
}

async function updateCartItem(id, quantity) {
  try {
    const response = await fetch(`${API_URL}/cart/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ quantity })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    await fetchCart();
  } catch (error) {
    showError(error.message);
  }
}

async function removeFromCart(id) {
  try {
    const response = await fetch(`${API_URL}/cart/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message);
    }

    await fetchCart();
    showSuccess('Book removed from cart');
  } catch (error) {
    showError(error.message);
  }
}

async function checkout() {
  const total = cart.reduce((sum, item) => sum + (item.Book.price * item.quantity), 0);
  showPaymentModal(total);
}

// UI functions
function initializeApp() {
  document.querySelector('#app').innerHTML = `
    <div class="app-container">
      <nav class="navbar">
        <div class="container navbar-content">
          <a href="#" class="nav-logo" onclick="showBooks()">BookStore</a>
          <div class="nav-links">
            <a href="#" class="nav-link active" onclick="showBooks()">Books</a>
            ${currentUser?.isAdmin ? `
              <a href="#" class="nav-link" onclick="showAddBook()">Add Book</a>
              <a href="#" class="nav-link" onclick="showDashboard()">Dashboard</a>
            ` : ''}
            <a href="#" class="nav-link" onclick="showAboutUs()">About Us</a>
            <a href="#" class="nav-link" onclick="showContactUs()">Contact Us</a>
          </div>
          <div class="auth-buttons">
            ${currentUser 
              ? `
                <div class="cart-icon" onclick="toggleCart()">
                  🛒 <span class="cart-count">0</span>
                </div>
                <span class="nav-link">Welcome, ${currentUser.username}</span>
                <button class="btn btn-outline" onclick="logout()">Logout</button>
                `
              : `
                <button class="btn btn-outline" onclick="showLoginModal()">Login</button>
                <button class="btn btn-outline" onclick="showSignupModal()">Sign Up</button>
                <button class="btn btn-primary" onclick="showAdminLogin()">Admin Login</button>
                `
            }
          </div>
        </div>
      </nav>

      <main class="container main-content">
        <div id="bookList" class="book-list">
          <div class="search-section">
            <input type="text" 
              id="searchInput" 
              class="search-input" 
              placeholder="Search books by title or author...">
          </div>
          <div class="book-grid"></div>
        </div>

        <div id="addBookForm" class="add-book-form hidden">
          <h2 class="form-title">Add New Book</h2>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Title</label>
              <input type="text" id="newTitle" class="form-input" placeholder="Enter book title">
            </div>
            <div class="form-group">
              <label class="form-label">Author</label>
              <input type="text" id="newAuthor" class="form-input" placeholder="Enter author name">
            </div>
            <div class="form-group">
              <label class="form-label">Price</label>
              <input type="number" id="newPrice" class="form-input" placeholder="Enter price">
            </div>
            <div class="form-group">
              <label class="form-label">Stock</label>
              <input type="number" id="newStock" class="form-input" placeholder="Enter stock quantity">
            </div>
            <div class="form-group">
              <label class="form-label">Image URL</label>
              <input type="text" id="newImage" class="form-input" placeholder="Enter image URL">
            </div>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" onclick="addBook()">Add Book</button>
          </div>
        </div>

        <!-- About Us Section -->
        <div id="aboutUs" class="about-us hidden">
          <h1 class="page-title">About Us</h1>
          <div class="about-content">
            <div class="about-section">
              <h2>Welcome to BookStore</h2>
              <p>We are passionate about bringing the world of books to your doorstep. Founded with a vision to make reading accessible to everyone, BookStore has grown to become one of the leading online bookstores.</p>
            </div>
            
            <div class="about-section">
              <h2>Our Mission</h2>
              <p>To inspire and nurture the human spirit through the power of reading. We believe that books have the ability to transform lives, spark creativity, and foster understanding.</p>
            </div>

            <div class="about-section">
              <h2>What Sets Us Apart</h2>
              <ul>
                <li>Carefully curated collection of books</li>
                <li>Competitive prices and regular discounts</li>
                <li>Fast and reliable delivery</li>
                <li>Excellent customer service</li>
                <li>Secure payment options</li>
              </ul>
            </div>

            <div class="about-section">
              <h2>Our Values</h2>
              <div class="values-grid">
                <div class="value-item">
                  <h3>Quality</h3>
                  <p>We ensure that every book meets our high standards of quality.</p>
                </div>
                <div class="value-item">
                  <h3>Customer First</h3>
                  <p>Your satisfaction is our top priority.</p>
                </div>
                <div class="value-item">
                  <h3>Integrity</h3>
                  <p>We conduct our business with honesty and transparency.</p>
                </div>
                <div class="value-item">
                  <h3>Innovation</h3>
                  <p>We continuously improve our services to serve you better.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Contact Us Section -->
        <div id="contactUs" class="contact-us hidden">
          <h1 class="page-title">Contact Us</h1>
          <div class="contact-content">
            <div class="contact-info">
              <div class="contact-section">
                <h2>Get in Touch</h2>
                <p>We'd love to hear from you. Please fill out the form below or use our contact information.</p>
                
                <div class="contact-details">
                  <div class="contact-item">
                    <strong>📧 Email:</strong>
                    <a href="mailto:support@bookstore.com">support@bookstore.com</a>
                  </div>
                  <div class="contact-item">
                    <strong>📞 Phone:</strong>
                    <a href="tel:+91-1234567890">+91-1234567890</a>
                  </div>
                  <div class="contact-item">
                    <strong>🏢 Address:</strong>
                    <p>123 Book Street, Reading Avenue<br>Mumbai, Maharashtra 400001<br>India</p>
                  </div>
                </div>
              </div>
              
              <div class="contact-form">
                <h2>Send us a Message</h2>
                <form id="contactForm" onsubmit="handleContactSubmit(event)">
                  <div class="form-group">
                    <label class="form-label">Name</label>
                    <input type="text" id="contactName" class="form-input" required placeholder="Your name">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" id="contactEmail" class="form-input" required placeholder="Your email">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Subject</label>
                    <input type="text" id="contactSubject" class="form-input" required placeholder="Message subject">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Message</label>
                    <textarea id="contactMessage" class="form-input" rows="5" required placeholder="Your message"></textarea>
                  </div>
                  <button type="submit" class="btn btn-primary">Send Message</button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <!-- Admin Dashboard Section -->
        <div id="adminDashboard" class="admin-dashboard hidden">
          <h1 class="page-title">Admin Dashboard</h1>
          
          <div class="dashboard-content">
            <div class="dashboard-header">
              <div class="dashboard-nav">
                <button class="btn btn-outline active" onclick="showUsersList()">Users</button>
                <button class="btn btn-outline" onclick="showOrdersList()">Orders</button>
              </div>
              <div class="dashboard-search">
                <input type="text" id="dashboardSearch" class="form-input" placeholder="Search users or orders...">
              </div>
            </div>

            <!-- Users List Section -->
            <div id="usersList" class="dashboard-section">
              <div class="table-responsive">
                <table class="dashboard-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Join Date</th>
                      <th>Total Orders</th>
                      <th>Total Spent</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="usersTableBody">
                    <!-- User rows will be populated dynamically -->
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Orders List Section -->
            <div id="ordersList" class="dashboard-section hidden">
              <div class="table-responsive">
                <table class="dashboard-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Username</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="ordersTableBody">
                    <!-- Order rows will be populated dynamically -->
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Auth Modals -->
        <div id="loginModal" class="modal auth-modal hidden">
          <div class="modal-content">
            <div class="modal-header">
              <h2 class="form-title">Login</h2>
              <button class="btn-close" onclick="hideLoginModal()">×</button>
            </div>
            <div class="form-group">
              <label class="form-label">Username</label>
              <input type="text" id="loginUsername" class="form-input" placeholder="Enter username">
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" id="loginPassword" class="form-input" placeholder="Enter password">
            </div>
            <div class="form-actions">
              <button class="btn btn-primary" onclick="handleLogin()">Login</button>
              <button class="btn btn-outline" onclick="hideLoginModal()">Cancel</button>
            </div>
          </div>
        </div>

        <div id="signupModal" class="modal auth-modal hidden">
          <div class="modal-content">
            <div class="modal-header">
              <h2 class="form-title">Sign Up</h2>
              <button class="btn-close" onclick="hideSignupModal()">×</button>
            </div>
            <div class="form-group">
              <label class="form-label">Username</label>
              <input type="text" id="signupUsername" class="form-input" placeholder="Choose username">
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" id="signupPassword" class="form-input" placeholder="Choose password">
            </div>
            <div class="form-group">
              <label class="form-label">Confirm Password</label>
              <input type="password" id="signupPasswordConfirm" class="form-input" placeholder="Confirm password">
            </div>
            <div class="form-actions">
              <button class="btn btn-primary" onclick="handleRegister()">Sign Up</button>
              <button class="btn btn-outline" onclick="hideSignupModal()">Cancel</button>
            </div>
          </div>
        </div>

        <!-- Admin Login Modal -->
        <div id="adminLoginModal" class="modal auth-modal hidden">
          <div class="modal-content">
            <div class="modal-header">
              <h2 class="form-title">Admin Login</h2>
              <button class="btn-close" onclick="hideAdminLogin()">×</button>
            </div>
            <div class="form-group">
              <label class="form-label">Username <span class="required">*</span></label>
              <input type="text" id="adminUsername" class="form-input" placeholder="Enter admin username">
            </div>
            <div class="form-group">
              <label class="form-label">Password <span class="required">*</span></label>
              <input type="password" id="adminPassword" class="form-input" placeholder="Enter admin password">
            </div>
            <div class="form-actions">
              <button class="btn btn-primary" onclick="handleAdminLogin()">Login</button>
              <button class="btn btn-outline" onclick="hideAdminLogin()">Cancel</button>
            </div>
          </div>
        </div>
      </main>

      <div id="cartModal" class="modal cart-modal hidden">
        <!-- Cart content will be rendered dynamically -->
      </div>

      <!-- Payment Modal -->
      <div id="paymentModal" class="modal payment-modal hidden">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="form-title">Delivery Details</h2>
            <button class="btn-close" onclick="hidePaymentModal()">×</button>
          </div>
          <div class="payment-form">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" id="fullName" class="form-input" placeholder="Enter your full name">
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input type="tel" id="phoneNumber" class="form-input" placeholder="Enter your phone number" maxlength="10">
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" id="email" class="form-input" placeholder="Enter your email">
              </div>
              <div class="form-group">
                <label class="form-label">State</label>
                <select id="state" class="form-input">
                  <option value="">Select State</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                  <option value="Assam">Assam</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Chhattisgarh">Chhattisgarh</option>
                  <option value="Goa">Goa</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Himachal Pradesh">Himachal Pradesh</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Manipur">Manipur</option>
                  <option value="Meghalaya">Meghalaya</option>
                  <option value="Mizoram">Mizoram</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Odisha">Odisha</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Sikkim">Sikkim</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Tripura">Tripura</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Uttarakhand">Uttarakhand</option>
                  <option value="West Bengal">West Bengal</option>
                </select>
              </div>
            </div>
            
            <div class="form-group full-width">
              <label class="form-label">Street Address</label>
              <input type="text" id="streetAddress" class="form-input" placeholder="Enter your street address">
            </div>
            
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">City</label>
                <input type="text" id="city" class="form-input" placeholder="Enter city">
              </div>
              <div class="form-group">
                <label class="form-label">Pincode</label>
                <input type="text" id="pincode" class="form-input" placeholder="Enter pincode" maxlength="6">
              </div>
            </div>

            <div class="order-summary">
              <h3>Order Summary</h3>
              <div class="summary-details">
                <div class="summary-row">
                  <span>Subtotal:</span>
                  <span id="paymentSubtotal">₹0</span>
                </div>
                <div class="summary-row">
                  <span>Delivery Charge:</span>
                  <span>₹49</span>
                </div>
                <div class="summary-row total">
                  <span>Total:</span>
                  <span id="paymentTotal">₹0</span>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button class="btn btn-outline" onclick="hidePaymentModal()">Cancel</button>
              <button class="btn btn-primary" onclick="processDelivery()">Place Order</button>
            </div>
          </div>
        </div>
      </div>

      <!-- User Details Modal -->
      <div id="userDetailsModal" class="modal user-details-modal hidden">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="form-title">User Details</h2>
            <button class="btn-close" onclick="hideUserDetails()">×</button>
          </div>
          <div id="userDetailsContent" class="user-details-content">
            <!-- User details will be populated dynamically -->
          </div>
        </div>
      </div>

      <!-- Order Details Modal -->
      <div id="orderDetailsModal" class="modal order-details-modal hidden">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="form-title">Order Details</h2>
            <button class="btn-close" onclick="hideOrderDetails()">×</button>
          </div>
          <div id="orderDetailsContent" class="order-details-content">
            <!-- Order details will be populated dynamically -->
          </div>
        </div>
      </div>

      <div id="modalOverlay" class="modal-overlay hidden"></div>
      <div id="toast" class="toast hidden"></div>

      <footer class="footer">
        <div class="container">
          <p class="copyright-text">&copy; ${new Date().getFullYear()} ExpertIT. All rights reserved.</p>
        </div>
      </footer>
    </div>
  `;

  // Initialize search input event listener
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value;
      filterAndRenderBooks(searchTerm);
    });
  }

  initializeAdminSections();
  fetchBooks();
  if (currentUser) fetchCart();
}

function renderBooks(filter = "") {
  console.log('renderBooks called with filter:', filter);
  const list = document.getElementById("bookList");
  console.log('bookList element:', list);
  const existingInput = document.getElementById("searchInput");
  const currentValue = existingInput ? existingInput.value : filter;

  if (!list.querySelector('.search-section')) {
    console.log('Creating search section...');
    const searchSection = document.createElement('div');
    searchSection.className = 'search-section';
    searchSection.innerHTML = `
      <input type="text" 
        id="searchInput" 
        class="search-input" 
        placeholder="Search books by title or author..." 
        value="${currentValue}">
    `;
    list.insertBefore(searchSection, list.firstChild);
    
    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value;
      filterAndRenderBooks(searchTerm);
    });
  }

  filterAndRenderBooks(currentValue);
}

function filterAndRenderBooks(filter) {
  console.log('filterAndRenderBooks called with filter:', filter);
  console.log('Current books array:', books);
  console.log('Current user:', currentUser);
  
  const list = document.getElementById("bookList");
  console.log('bookList element:', list);
  
  let bookGridElement = list.querySelector('.book-grid');
  console.log('Existing book grid:', bookGridElement);
  
  if (!bookGridElement) {
    console.log('Creating new book grid...');
    bookGridElement = document.createElement('div');
    bookGridElement.className = 'book-grid';
    list.appendChild(bookGridElement);
  }

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(filter.toLowerCase()) ||
    book.author.toLowerCase().includes(filter.toLowerCase())
  );
  console.log('Filtered books:', filteredBooks);

  if (filteredBooks.length === 0) {
    console.log('No books found after filtering');
    bookGridElement.innerHTML = "<p>No books found.</p>";
    return;
  }

  console.log('Rendering books to grid...');
  bookGridElement.innerHTML = '';
  filteredBooks.forEach(book => {
    const bookDiv = document.createElement("div");
    bookDiv.className = "book";
    bookDiv.innerHTML = `
      <div class="book-cover">
        <img src="${book.image}" alt="${book.title} cover" class="book-image">
      </div>
      <div class="book-info">
        <h3 class="book-title">${book.title}</h3>
        <p class="book-author">by ${book.author}</p>
        <div class="book-details">
          <p class="book-price">₹${book.price}</p>
          <div class="stock-management ${currentUser?.isAdmin && currentUser?.adminAuthenticated ? '' : 'hidden'}">
            <button class="btn btn-small" onclick="updateBookStock(${book.id}, ${book.stock - 1})">-</button>
            <p class="book-stock">Stock: ${book.stock}</p>
            <button class="btn btn-small" onclick="updateBookStock(${book.id}, ${book.stock + 1})">+</button>
          </div>
          <p class="book-stock ${currentUser?.isAdmin && currentUser?.adminAuthenticated ? 'hidden' : ''}">Stock: ${book.stock}</p>
        </div>
      </div>
      <div class="book-actions">
        ${currentUser?.isAdmin && currentUser?.adminAuthenticated
          ? `
            <button class="btn btn-danger" onclick="deleteBook(${book.id})">Delete Book</button>
            `
          : currentUser
            ? `<button class="btn btn-primary" onclick="addToCart(${book.id})" ${book.stock === 0 ? 'disabled' : ''}>
                ${book.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
               </button>`
            : `<button class="btn btn-outline" onclick="showLoginModal()">Login to Buy</button>`
        }
      </div>
    `;
    bookGridElement.appendChild(bookDiv);
  });
  console.log('Book rendering complete');
}

function renderCart() {
  const cartModal = document.getElementById('cartModal');
  const total = cart.reduce((sum, item) => sum + (item.Book.price * item.quantity), 0);

  cartModal.innerHTML = `
    <div class="cart-header">
      <h2>Shopping Cart</h2>
      <button class="btn-close" onclick="hideCart()">×</button>
    </div>
    ${cart.length === 0 
      ? '<p class="cart-empty">Your cart is empty</p>'
      : `
        <div class="cart-items">
          ${cart.map(item => `
            <div class="cart-item">
              <img src="${item.Book.image}" alt="${item.Book.title}" class="cart-item-image">
              <div class="cart-item-details">
                <h3>${item.Book.title}</h3>
                <p>₹${item.Book.price}</p>
              </div>
              <div class="cart-item-actions">
                <button class="btn-quantity" onclick="updateCartItem(${item.id}, ${item.quantity - 1})">-</button>
                <span>${item.quantity}</span>
                <button class="btn-quantity" onclick="updateCartItem(${item.id}, ${item.quantity + 1})">+</button>
                <button class="btn-remove" onclick="removeFromCart(${item.id})">Remove</button>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="cart-footer">
          <div class="cart-total">
            <span>Total:</span>
            <span>₹${total}</span>
          </div>
          <button class="btn btn-primary" onclick="checkout()">Checkout</button>
  </div>
`
    }
  `;
}

function updateCartIcon() {
  const cartCount = document.querySelector('.cart-count');
  if (cartCount) {
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = itemCount;
  }
}

function showError(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast toast-error';
  setTimeout(() => toast.className = 'toast hidden', 3000);
}

function showSuccess(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast toast-success';
  setTimeout(() => toast.className = 'toast hidden', 3000);
}

// Modal functions
function showLoginModal() {
  document.getElementById("loginModal").classList.remove("hidden");
  document.getElementById("modalOverlay").classList.remove("hidden");
}

function hideLoginModal() {
  document.getElementById("loginModal").classList.add("hidden");
  document.getElementById("modalOverlay").classList.add("hidden");
}

function showSignupModal() {
  document.getElementById('signupModal').classList.remove('hidden');
  document.getElementById('modalOverlay').classList.remove('hidden');
  checkShowAdminCredentials();
}

function hideSignupModal() {
  document.getElementById("signupModal").classList.add("hidden");
  document.getElementById("modalOverlay").classList.add("hidden");
}

function hideModals() {
  document.getElementById('loginModal')?.classList.add('hidden');
  document.getElementById('signupModal')?.classList.add('hidden');
  document.getElementById('adminLoginModal')?.classList.add('hidden');
  document.getElementById('modalOverlay')?.classList.add('hidden');
}

function toggleCart() {
  const cartModal = document.getElementById('cartModal');
  if (cartModal.classList.contains('hidden')) {
    showCart();
  } else {
    hideCart();
  }
}

function showCart() {
  renderCart();
  document.getElementById('cartModal').classList.remove('hidden');
  document.getElementById('modalOverlay').classList.remove('hidden');
}

function hideCart() {
  document.getElementById('cartModal').classList.add('hidden');
  document.getElementById('modalOverlay').classList.add('hidden');
}

async function handleLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!username || !password) {
    showError('Username and password are required');
    return;
  }

  await login(username, password);
}

async function handleRegister() {
  const username = document.getElementById('signupUsername').value.trim();
  const password = document.getElementById('signupPassword').value.trim();
  const passwordConfirm = document.getElementById('signupPasswordConfirm').value.trim();

  if (!username || !password || !passwordConfirm) {
    showError('All fields are required');
    return;
  }

  if (password !== passwordConfirm) {
    showError('Passwords do not match');
    return;
  }

  if (password.length < 6) {
    showError('Password must be at least 6 characters long');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    currentUser = data.user;
    token = data.token;
    localStorage.setItem('user', JSON.stringify(currentUser));
    localStorage.setItem('token', token);

    hideSignupModal();
    initializeApp();
    showSuccess('Registration successful!');
  } catch (error) {
    showError(error.message);
  }
}

function showBooks() {
  document.getElementById('bookList').classList.remove('hidden');
  document.getElementById('addBookForm').classList.add('hidden');
  document.getElementById('aboutUs').classList.add('hidden');
  document.getElementById('contactUs').classList.add('hidden');
  
  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  document.querySelector('.nav-link[onclick="showBooks()"]').classList.add('active');
  
  renderBooks();
}

function showAddBook() {
  if (!currentUser?.isAdmin || !currentUser?.adminAuthenticated) {
    showError('Access denied. Admin authentication required.');
    return;
  }
  
  document.getElementById('bookList').classList.add('hidden');
  document.getElementById('addBookForm').classList.remove('hidden');
  document.getElementById('aboutUs').classList.add('hidden');
  document.getElementById('contactUs').classList.add('hidden');
  document.getElementById('adminDashboard').classList.add('hidden');
  
  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  document.querySelector('.nav-link[onclick="showAddBook()"]').classList.add('active');
}

async function addBook() {
  if (!currentUser?.isAdmin) {
    showError("Only admins can add books!");
    return;
  }

  const title = document.getElementById("newTitle").value.trim();
  const author = document.getElementById("newAuthor").value.trim();
  const price = parseFloat(document.getElementById("newPrice").value);
  const stock = parseInt(document.getElementById("newStock").value);
  const image = document.getElementById("newImage").value.trim();

  if (!title || !author || isNaN(price) || isNaN(stock) || !image) {
    showError("Please fill all fields correctly.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, author, price, stock, image })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    await fetchBooks();  // Refresh the book list
    showBooks();  // Switch to book list view
    showSuccess('Book added successfully');
  } catch (error) {
    showError(error.message);
  }
}

// Add event listeners for modals
document.addEventListener('click', (e) => {
  if (e.target.matches('.modal')) {
    hideModals();
  }
});

// Expose functions to window object for onclick handlers
window.showLoginModal = showLoginModal;
window.hideLoginModal = hideLoginModal;
window.showSignupModal = showSignupModal;
window.hideSignupModal = hideSignupModal;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.showBooks = showBooks;
window.showAddBook = showAddBook;
window.addBook = addBook;
window.logout = logout;
window.toggleCart = toggleCart;
window.showCart = showCart;
window.hideCart = hideCart;
window.addToCart = addToCart;
window.updateCartItem = updateCartItem;
window.removeFromCart = removeFromCart;
window.checkout = checkout;
window.filterAndRenderBooks = filterAndRenderBooks;
window.showAdminLogin = showAdminLogin;
window.hideAdminLogin = hideAdminLogin;
window.handleAdminLogin = handleAdminLogin;

// Add these new functions
function showPaymentModal(total) {
  const subtotal = total;
  const deliveryCharge = 49; // Fixed delivery charge
  const finalTotal = subtotal + deliveryCharge;

  document.getElementById('paymentSubtotal').textContent = `₹${subtotal.toFixed(2)}`;
  document.getElementById('paymentTotal').textContent = `₹${finalTotal.toFixed(2)}`;

  document.getElementById('paymentModal').classList.remove('hidden');
  document.getElementById('modalOverlay').classList.remove('hidden');

  // Add input formatting for phone number
  const phoneInput = document.getElementById('phoneNumber');
  phoneInput.addEventListener('input', function(e) {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
  });

  // Add input formatting for pincode
  const pincodeInput = document.getElementById('pincode');
  pincodeInput.addEventListener('input', function(e) {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
  });
}

function hidePaymentModal() {
  document.getElementById('paymentModal').classList.add('hidden');
  document.getElementById('modalOverlay').classList.add('hidden');
}

async function processDelivery() {
  const fullName = document.getElementById('fullName').value.trim();
  const phoneNumber = document.getElementById('phoneNumber').value.trim();
  const email = document.getElementById('email').value.trim();
  const streetAddress = document.getElementById('streetAddress').value.trim();
  const city = document.getElementById('city').value.trim();
  const pincode = document.getElementById('pincode').value.trim();
  const state = document.getElementById('state').value;

  // Validate all fields
  if (!fullName || !phoneNumber || !email || !streetAddress || !city || !pincode || !state) {
    showError('Please fill in all delivery details');
    return;
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError('Please enter a valid email address');
    return;
  }

  // Validate phone number
  if (!/^\d{10}$/.test(phoneNumber)) {
    showError('Please enter a valid 10-digit phone number');
    return;
  }

  // Validate pincode
  if (!/^\d{6}$/.test(pincode)) {
    showError('Please enter a valid 6-digit pincode');
    return;
  }

  try {
    // Here you would normally make an API call to process the order
    // For demo purposes, we'll just simulate processing
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing

    hidePaymentModal();
    cart = [];
    updateCartIcon();
    hideCart();
    showSuccess('Order placed successfully! Your books will be delivered soon.');
  } catch (error) {
    showError('Failed to place order. Please try again.');
  }
}

// Update window object
window.hidePaymentModal = hidePaymentModal;
window.processDelivery = processDelivery;

// Add these new functions
function showAboutUs() {
  document.getElementById('bookList').classList.add('hidden');
  document.getElementById('addBookForm').classList.add('hidden');
  document.getElementById('aboutUs').classList.remove('hidden');
  document.getElementById('contactUs').classList.add('hidden');
  
  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  document.querySelector('.nav-link[onclick="showAboutUs()"]').classList.add('active');
}

function showContactUs() {
  document.getElementById('bookList').classList.add('hidden');
  document.getElementById('addBookForm').classList.add('hidden');
  document.getElementById('aboutUs').classList.add('hidden');
  document.getElementById('contactUs').classList.remove('hidden');
  
  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  document.querySelector('.nav-link[onclick="showContactUs()"]').classList.add('active');
}

async function handleContactSubmit(event) {
  event.preventDefault();
  
  const name = document.getElementById('contactName').value.trim();
  const email = document.getElementById('contactEmail').value.trim();
  const subject = document.getElementById('contactSubject').value.trim();
  const message = document.getElementById('contactMessage').value.trim();
  
  if (!name || !email || !subject || !message) {
    showError('Please fill in all fields');
    return;
  }
  
  try {
    // Here you would normally send this to your backend
    // For demo purposes, we'll just show a success message
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate sending
    
    // Clear the form
    document.getElementById('contactForm').reset();
    
    showSuccess('Thank you for your message! We will get back to you soon.');
  } catch (error) {
    showError('Failed to send message. Please try again.');
  }
}

// Add to window object
window.showAboutUs = showAboutUs;
window.showContactUs = showContactUs;
window.handleContactSubmit = handleContactSubmit;

// Add these new functions for dashboard functionality
function showDashboard() {
  if (!currentUser?.isAdmin || !currentUser?.adminAuthenticated) {
    showError('Access denied. Admin authentication required.');
    return;
  }

  document.getElementById('bookList').classList.add('hidden');
  document.getElementById('addBookForm').classList.add('hidden');
  document.getElementById('aboutUs').classList.add('hidden');
  document.getElementById('contactUs').classList.add('hidden');
  document.getElementById('adminDashboard').classList.remove('hidden');

  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  document.querySelector('.nav-link[onclick="showDashboard()"]').classList.add('active');

  // Load initial data
  showUsersList();
}

async function showUsersList() {
  try {
    const response = await fetch(`${API_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch users');
    
    const users = await response.json();
    const tbody = document.getElementById('usersTableBody');
    
    tbody.innerHTML = users.map(user => `
      <tr>
        <td>${user.username}</td>
        <td>${new Date(user.createdAt).toLocaleDateString()}</td>
        <td>${user.totalOrders || 0}</td>
        <td>₹${user.totalSpent || 0}</td>
        <td>
          <button class="btn btn-small" onclick="viewUserDetails(${user.id})">View Details</button>
        </td>
      </tr>
    `).join('');

    // Show users section, hide orders section
    document.getElementById('usersList').classList.remove('hidden');
    document.getElementById('ordersList').classList.add('hidden');
    
    // Update nav buttons
    document.querySelector('.dashboard-nav .btn.active')?.classList.remove('active');
    document.querySelector('.dashboard-nav .btn:first-child').classList.add('active');
  } catch (error) {
    showError(error.message);
  }
}

async function showOrdersList() {
  try {
    const response = await fetch(`${API_URL}/admin/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch orders');
    
    const orders = await response.json();
    const tbody = document.getElementById('ordersTableBody');
    
    tbody.innerHTML = orders.map(order => `
      <tr>
        <td>#${order.id}</td>
        <td>${order.username}</td>
        <td>${new Date(order.orderDate).toLocaleDateString()}</td>
        <td>${order.bookTitle}</td>
        <td>₹${order.totalPrice}</td>
        <td><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></td>
        <td>
          <button class="btn btn-small" onclick="viewOrderDetails(${order.id})">View Details</button>
        </td>
      </tr>
    `).join('');

    // Show orders section, hide users section
    document.getElementById('ordersList').classList.remove('hidden');
    document.getElementById('usersList').classList.add('hidden');
    
    // Update nav buttons
    document.querySelector('.dashboard-nav .btn.active')?.classList.remove('active');
    document.querySelector('.dashboard-nav .btn:last-child').classList.add('active');
  } catch (error) {
    showError(error.message);
  }
}

async function viewUserDetails(userId) {
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch user details');
    
    const user = await response.json();
    const content = document.getElementById('userDetailsContent');
    
    content.innerHTML = `
      <div class="user-info">
        <h3>User Information</h3>
        <p><strong>Username:</strong> ${user.username}</p>
        <p><strong>Join Date:</strong> ${new Date(user.createdAt).toLocaleDateString()}</p>
        <p><strong>Total Orders:</strong> ${user.totalOrders || 0}</p>
        <p><strong>Total Spent:</strong> ₹${user.totalSpent || 0}</p>
      </div>
      
      <div class="user-orders">
        <h3>Order History</h3>
        <div class="table-responsive">
          <table class="dashboard-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${user.orders.map(order => `
                <tr>
                  <td>#${order.id}</td>
                  <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>${order.items.length} items</td>
                  <td>₹${order.total}</td>
                  <td><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    document.getElementById('userDetailsModal').classList.remove('hidden');
    document.getElementById('modalOverlay').classList.remove('hidden');
  } catch (error) {
    showError(error.message);
  }
}

async function viewOrderDetails(orderId) {
  try {
    const response = await fetch(`${API_URL}/admin/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch order details');
    
    const order = await response.json();
    const content = document.getElementById('orderDetailsContent');
    
    content.innerHTML = `
      <div class="order-info">
        <div class="order-header">
          <h3>Order #${order.id}</h3>
          <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
        </div>
        <p><strong>Customer:</strong> ${order.username}</p>
        <p><strong>Date:</strong> ${new Date(order.orderDate).toLocaleDateString()}</p>
      </div>
      
      <div class="order-items">
        <h3>Order Items</h3>
        <div class="table-responsive">
          <table class="dashboard-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${order.bookTitle}</td>
                <td>₹${order.totalPrice / order.quantity}</td>
                <td>${order.quantity}</td>
                <td>₹${order.totalPrice}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="order-summary">
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>₹${order.totalPrice}</span>
          </div>
          <div class="summary-row">
            <span>Delivery:</span>
            <span>₹49</span>
          </div>
          <div class="summary-row total">
            <span>Total:</span>
            <span>₹${order.totalPrice + 49}</span>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('orderDetailsModal').classList.remove('hidden');
    document.getElementById('modalOverlay').classList.remove('hidden');
  } catch (error) {
    showError(error.message);
  }
}

function hideUserDetails() {
  document.getElementById('userDetailsModal').classList.add('hidden');
  document.getElementById('modalOverlay').classList.add('hidden');
}

function hideOrderDetails() {
  document.getElementById('orderDetailsModal').classList.add('hidden');
  document.getElementById('modalOverlay').classList.add('hidden');
}

// Add to window object
window.showDashboard = showDashboard;
window.showUsersList = showUsersList;
window.showOrdersList = showOrdersList;
window.viewUserDetails = viewUserDetails;
window.viewOrderDetails = viewOrderDetails;
window.hideUserDetails = hideUserDetails;
window.hideOrderDetails = hideOrderDetails;

// Add this function to initialize admin sections
function initializeAdminSections() {
  // Hide admin sections by default
  document.getElementById('addBookForm').classList.add('hidden');
  document.getElementById('adminDashboard').classList.add('hidden');
  
  // If not an admin user, ensure admin sections stay hidden
  if (!currentUser?.isAdmin) {
    const adminLinks = document.querySelectorAll('.nav-link[onclick^="showAdd"], .nav-link[onclick^="showDashboard"]');
    adminLinks.forEach(link => link.style.display = 'none');
  }
}

// Admin login functions
function showAdminLogin() {
  console.log('Showing admin login modal');
  const modal = document.getElementById('adminLoginModal');
  const overlay = document.getElementById('modalOverlay');
  if (modal && overlay) {
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
    // Clear any previous input
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
  } else {
    console.error('Admin login modal or overlay not found');
  }
}

function hideAdminLogin() {
  console.log('Hiding admin login modal');
  const modal = document.getElementById('adminLoginModal');
  const overlay = document.getElementById('modalOverlay');
  if (modal && overlay) {
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
  } else {
    console.error('Admin login modal or overlay not found');
  }
}

async function handleAdminLogin() {
  console.log('Handling admin login...');
  const username = document.getElementById('adminUsername')?.value.trim();
  const password = document.getElementById('adminPassword')?.value.trim();

  console.log('Admin credentials:', { username });

  if (!username || !password) {
    showError('Please enter both username and password');
    return;
  }

  try {
    console.log('Sending admin login request to:', `${API_URL}/admin/login`);
    const response = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    console.log('Admin login response status:', response.status);
    const data = await response.json();
    console.log('Admin login response data:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Admin login failed');
    }

    // Update current user and token
    currentUser = data.user;
    token = data.token;
    console.log('Setting current user:', currentUser);
    localStorage.setItem('user', JSON.stringify(currentUser));
    localStorage.setItem('token', token);

    hideAdminLogin();
    initializeApp();
    showSuccess('Admin login successful');
  } catch (error) {
    console.error('Admin login error:', error);
    showError(error.message || 'Failed to login as admin. Please check your credentials.');
  }
}

// Add function to check if admin credentials should be shown
async function checkShowAdminCredentials() {
  try {
    const response = await fetch(`${API_URL}/users/count`);
    const data = await response.json();
    
    const adminSection = document.getElementById('adminCredentialsSection');
    if (adminSection) {
      adminSection.classList.toggle('hidden', data.count > 0);
    }
  } catch (error) {
    console.error('Error checking user count:', error);
  }
}

// Add new functions for book management
async function deleteBook(bookId) {
  if (!currentUser?.isAdmin || !currentUser?.adminAuthenticated) {
    showError('Access denied. Admin authentication required.');
    return;
  }

  if (!confirm('Are you sure you want to delete this book?')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/books/${bookId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message);
    }

    await fetchBooks();  // Refresh the book list
    showSuccess('Book deleted successfully');
  } catch (error) {
    showError(error.message);
  }
}

async function updateBookStock(bookId, newStock) {
  if (!currentUser?.isAdmin || !currentUser?.adminAuthenticated) {
    showError('Access denied. Admin authentication required.');
    return;
  }

  if (newStock < 0) {
    showError('Stock cannot be negative');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/books/${bookId}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ stock: newStock })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message);
    }

    await fetchBooks();  // Refresh the book list
  } catch (error) {
    showError(error.message);
  }
}

// Add to window object
window.deleteBook = deleteBook;
window.updateBookStock = updateBookStock;

// Admin Dashboard Functions
function initAdminDashboard() {
  const dashboard = document.getElementById('dashboard');
  if (!dashboard) return;

  dashboard.innerHTML = `
    <h1 class="dashboard-title">Admin Dashboard</h1>
    <div class="dashboard-tabs">
      <button id="usersTab" class="btn btn-primary" onclick="showUsers()">Users</button>
      <button id="ordersTab" class="btn" onclick="showOrders()">Orders</button>
      <input type="text" id="dashboardSearch" class="search-input" placeholder="Search users or orders..." onkeyup="handleDashboardSearch()">
    </div>
    <div class="dashboard-content"></div>
  `;

  showUsers(); // Show users by default
}

async function showOrders() {
  if (!currentUser?.isAdmin || !currentUser?.adminAuthenticated) {
    showError('Access denied. Admin authentication required.');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/admin/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message);
    }

    const orders = await response.json();
    const dashboardContent = document.querySelector('.dashboard-content');
    
    // Update active tab
    document.querySelector('.btn-primary')?.classList.remove('btn-primary');
    document.getElementById('ordersTab').classList.add('btn-primary');

    if (orders.length === 0) {
      dashboardContent.innerHTML = '<p>No orders found.</p>';
      return;
    }

    // Create orders table
    dashboardContent.innerHTML = `
      <div class="table-responsive">
        <table class="dashboard-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Username</th>
              <th>Book Title</th>
              <th>Quantity</th>
              <th>Total Price</th>
              <th>Order Date</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(order => `
              <tr>
                <td>${order.id}</td>
                <td>${order.username}</td>
                <td>${order.bookTitle}</td>
                <td>${order.quantity}</td>
                <td>₹${order.totalPrice}</td>
                <td>${new Date(order.orderDate).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Error fetching orders:', error);
    showError('Failed to fetch orders. ' + error.message);
  }
}

// Add to window object
window.showOrders = showOrders;
window.initAdminDashboard = initAdminDashboard;

// Initialize admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (currentUser?.isAdmin) {
    initAdminDashboard();
  }
});
