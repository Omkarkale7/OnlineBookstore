const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use('/images', express.static('../public/images'));

// Database setup
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false,
  define: {
    // Enable foreign key constraints
    timestamps: true,
    freezeTableName: true
  }
});

// Define models
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

const Book = sequelize.define('Book', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending'
  }
});

// Set up model associations with explicit foreign keys
User.hasMany(Cart, {
  foreignKey: {
    name: 'UserId',
    allowNull: false
  },
  onDelete: 'CASCADE'
});
Cart.belongsTo(User, {
  foreignKey: {
    name: 'UserId',
    allowNull: false
  }
});

Book.hasMany(Cart, {
  foreignKey: {
    name: 'BookId',
    allowNull: false
  },
  onDelete: 'CASCADE'
});
Cart.belongsTo(Book, {
  foreignKey: {
    name: 'BookId',
    allowNull: false
  }
});

// Root API endpoint for testing
app.get('/api', (req, res) => {
  res.json({ message: 'BookStore API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Add admin credentials (in a real app, these would be in environment variables)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// Initialize database
(async () => {
  try {
    // Change force: true to alter: true to preserve data
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully');
    
    // Check if admin user exists before creating
    const adminExists = await User.findOne({ where: { username: ADMIN_USERNAME } });
    if (!adminExists) {
      // Hash admin password
      const hashedAdminPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      
      // Create admin user
      await User.create({
        username: ADMIN_USERNAME,
        password: hashedAdminPassword,
        isAdmin: true
      });
      console.log('Admin user created successfully');
    }

    // Check if books exist before adding initial books
    const bookCount = await Book.count();
    if (bookCount === 0) {
      // Add initial books
      await Book.bulkCreate([
        {
          title: "Atomic Habits",
          author: "James Clear",
          price: 399,
          stock: 5,
          image: "/images/atomic-habits.jpg"
        },
        {
          title: "The Alchemist",
          author: "Paulo Coelho",
          price: 299,
          stock: 3,
          image: "/images/the-alchemist.jpg"
        },
        {
          title: "1984",
          author: "George Orwell",
          price: 199,
          stock: 2,
          image: "/images/1984.jpg"
        },
        {
          title: "The Psychology of Money",
          author: "Morgan Housel",
          price: 349,
          stock: 4,
          image: "/images/psychology-of-money.jpg"
        },
        {
          title: "Rich Dad Poor Dad",
          author: "Robert T. Kiyosaki",
          price: 299,
          stock: 6,
          image: "/images/rich-dad-poor-dad.jpg"
        },
        {
          title: "Think and Grow Rich",
          author: "Napoleon Hill",
          price: 199,
          stock: 3,
          image: "/images/think-and-grow-rich.jpg"
        },
        {
          title: "The Subtle Art of Not Giving a F*ck",
          author: "Mark Manson",
          price: 399,
          stock: 4,
          image: "/images/subtle-art.jpg"
        },
        {
          title: "Sapiens",
          author: "Yuval Noah Harari",
          price: 499,
          stock: 3,
          image: "/images/sapiens.jpg"
        },
        // Adding new books
        {
          title: "The Power of Now",
          author: "Eckhart Tolle",
          price: 349,
          stock: 5,
          image: "/images/power-of-now.jpg"
        },
        {
          title: "Zero to One",
          author: "Peter Thiel",
          price: 399,
          stock: 4,
          image: "/images/zero-to-one.jpg"
        },
        {
          title: "Start With Why",
          author: "Simon Sinek",
          price: 299,
          stock: 6,
          image: "/images/start-with-why.jpg"
        },
        {
          title: "Deep Work",
          author: "Cal Newport",
          price: 349,
          stock: 4,
          image: "/images/deep-work.jpg"
        },
        {
          title: "The 7 Habits of Highly Effective People",
          author: "Stephen Covey",
          price: 449,
          stock: 5,
          image: "/images/7-habits.jpg"
        },
        {
          title: "Good to Great",
          author: "Jim Collins",
          price: 399,
          stock: 3,
          image: "/images/good-to-great.jpg"
        },
        {
          title: "The Lean Startup",
          author: "Eric Ries",
          price: 349,
          stock: 4,
          image: "/images/lean-startup.jpg"
        },
        {
          title: "Mindset",
          author: "Carol S. Dweck",
          price: 299,
          stock: 5,
          image: "/images/mindset.jpg"
        }
      ]);
      console.log('Initial books added successfully');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
})();

// Routes

// Get all books
app.get('/api/books', async (req, res) => {
  try {
    const books = await Book.findAll();
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Register user
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, adminUsername, adminPassword } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if this is the first user (make them admin)
    const userCount = await User.count();
    const isAdmin = userCount === 0;

    // If registering as admin, hash admin password
    let hashedAdminPassword = null;
    if (isAdmin && adminPassword) {
      hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
    }

    // Create user
    const user = await User.create({
      username,
      password: hashedPassword,
      isAdmin,
      adminUsername: isAdmin ? adminUsername : null,
      adminPassword: isAdmin ? hashedAdminPassword : null
    });

    // Generate token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        isAdmin: user.isAdmin,
        adminAuthenticated: false
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        username: user.username,
        isAdmin: user.isAdmin,
        adminAuthenticated: false
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login user
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Generate token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        isAdmin: user.isAdmin,
        adminAuthenticated: false  // Regular login doesn't authenticate admin privileges
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        username: user.username,
        isAdmin: user.isAdmin,
        adminAuthenticated: false
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Modify admin login endpoint to use dedicated admin credentials
app.post('/api/admin/login', async (req, res) => {
  try {
    console.log('Admin login attempt:', req.body.username);
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('Missing credentials');
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find admin user
    const adminUser = await User.findOne({ 
      where: { 
        username: username,
        isAdmin: true
      } 
    });

    console.log('Admin user found:', adminUser ? 'Yes' : 'No');

    if (!adminUser) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, adminUser.password);
    console.log('Password valid:', validPassword);

    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Generate admin token with full privileges
    const token = jwt.sign(
      { 
        id: adminUser.id, 
        username: adminUser.username, 
        isAdmin: true,
        adminAuthenticated: true
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Admin login successful:', adminUser.username);

    res.json({
      token,
      user: {
        id: adminUser.id,
        username: adminUser.username,
        isAdmin: true,
        adminAuthenticated: true
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'An error occurred during admin login' });
  }
});

// Add book (admin only)
app.post('/api/books', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const book = await Book.create(req.body);
    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update book stock
app.patch('/api/books/:id', async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book.stock > 0) {
      book.stock--;
      await book.save();
      res.json(book);
    } else {
      res.status(400).json({ message: 'Book out of stock' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cart Routes

// Get user's cart
app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching cart for user:', req.user.id);
    const cartItems = await Cart.findAll({
      where: { 
        UserId: req.user.id,
        status: 'pending'
      },
      include: [Book]
    });
    console.log('Cart items found:', cartItems);
    res.json(cartItems);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add to cart
app.post('/api/cart', authenticateToken, async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    console.log('Add to cart request:', req.body);
    const { bookId, quantity = 1 } = req.body;

    // Check if book exists and has stock
    const book = await Book.findByPk(bookId, { transaction: t });
    if (!book) {
      await t.rollback();
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book.stock < quantity) {
      await t.rollback();
      return res.status(400).json({ message: 'Not enough stock' });
    }

    // Check if item already in cart
    let cartItem = await Cart.findOne({
      where: {
        UserId: req.user.id,
        BookId: bookId,
        status: 'pending'
      },
      transaction: t
    });

    if (cartItem) {
      cartItem.quantity += quantity;
      await cartItem.save({ transaction: t });
    } else {
      cartItem = await Cart.create({
        UserId: req.user.id,
        BookId: bookId,
        quantity,
        status: 'pending'
      }, { transaction: t });
    }

    // Get updated cart item with book details
    const updatedCartItem = await Cart.findOne({
      where: { id: cartItem.id },
      include: [Book],
      transaction: t
    });

    await t.commit();
    console.log('Cart item added successfully:', updatedCartItem);
    res.json(updatedCartItem);
  } catch (error) {
    await t.rollback();
    console.error('Add to cart error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update cart item quantity
app.patch('/api/cart/:id', authenticateToken, async (req, res) => {
  try {
    const { quantity } = req.body;
    const cartItem = await Cart.findOne({
      where: {
        id: req.params.id,
        UserId: req.user.id
      },
      include: [Book]
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    if (quantity <= 0) {
      await cartItem.destroy();
      return res.json({ message: 'Item removed from cart' });
    }

    if (cartItem.Book.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock' });
    }

    cartItem.quantity = quantity;
    await cartItem.save();
    res.json(cartItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove from cart
app.delete('/api/cart/:id', authenticateToken, async (req, res) => {
  try {
    const result = await Cart.destroy({
      where: {
        id: req.params.id,
        UserId: req.user.id
      }
    });

    if (result === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Checkout
app.post('/api/cart/checkout', authenticateToken, async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const cartItems = await Cart.findAll({
      where: { UserId: req.user.id },
      include: [Book],
      transaction: t
    });

    if (cartItems.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Check stock and update books
    for (const item of cartItems) {
      if (item.Book.stock < item.quantity) {
        await t.rollback();
        return res.status(400).json({
          message: `Not enough stock for ${item.Book.title}`
        });
      }

      item.Book.stock -= item.quantity;
      await item.Book.save({ transaction: t });
      
      // Update cart item status to completed
      item.status = 'completed';
      await item.save({ transaction: t });
    }

    await t.commit();
    res.json({ message: 'Checkout successful' });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: error.message });
  }
});

// Admin endpoints
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin || !req.user.adminAuthenticated) {
      return res.status(403).json({ message: 'Access denied. Admin authentication required.' });
    }

    const users = await User.findAll({
      attributes: ['id', 'username', 'createdAt', 'isAdmin'],
      include: [{
        model: Cart,
        include: [{
          model: Book,
          attributes: ['price']
        }]
      }]
    });

    // Calculate total orders and spent for each user
    const formattedUsers = users.map(user => {
      const totalOrders = user.Carts.length;
      const totalSpent = user.Carts.reduce((sum, cart) => {
        return sum + (cart.Book.price * cart.quantity);
      }, 0);

      return {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
        isAdmin: user.isAdmin,
        totalOrders,
        totalSpent
      };
    });

    res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

app.get('/api/admin/users/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin || !req.user.adminAuthenticated) {
      return res.status(403).json({ message: 'Access denied. Admin authentication required.' });
    }

    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'username', 'createdAt', 'isAdmin'],
      include: [{
        model: Cart,
        include: [{
          model: Book,
          attributes: ['title', 'price']
        }]
      }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Format user data
    const userData = {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
      isAdmin: user.isAdmin,
      totalOrders: user.Carts.length,
      totalSpent: user.Carts.reduce((sum, cart) => sum + (cart.Book.price * cart.quantity), 0),
      orders: user.Carts.map(cart => ({
        id: cart.id,
        createdAt: cart.createdAt,
        items: [{
          title: cart.Book.title,
          price: cart.Book.price,
          quantity: cart.quantity
        }],
        total: cart.Book.price * cart.quantity,
        status: 'Completed' // You might want to add a status field to your Cart model
      }))
    };

    res.json(userData);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Error fetching user details' });
  }
});

// Add endpoint to get user count
app.get('/api/users/count', async (req, res) => {
  try {
    const count = await User.count();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete book (admin only)
app.delete('/api/books/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin || !req.user.adminAuthenticated) {
      return res.status(403).json({ message: 'Access denied. Admin authentication required.' });
    }

    const book = await Book.findByPk(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    await book.destroy();
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update book stock (admin only)
app.patch('/api/books/:id/stock', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin || !req.user.adminAuthenticated) {
      return res.status(403).json({ message: 'Access denied. Admin authentication required.' });
    }

    const { stock } = req.body;
    if (stock === undefined || stock < 0) {
      return res.status(400).json({ message: 'Invalid stock value' });
    }

    const book = await Book.findByPk(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    book.stock = stock;
    await book.save();

    res.json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin endpoint to get all orders
app.get('/api/admin/orders', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin || !req.user.adminAuthenticated) {
      return res.status(403).json({ message: 'Access denied. Admin authentication required.' });
    }

    const orders = await Cart.findAll({
      include: [
        {
          model: User,
          attributes: ['username']
        },
        {
          model: Book,
          attributes: ['title', 'price']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedOrders = orders.map(order => ({
      id: order.id,
      username: order.User.username,
      bookTitle: order.Book.title,
      quantity: order.quantity,
      totalPrice: order.Book.price * order.quantity,
      orderDate: order.createdAt,
      status: order.status
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin endpoint to get order details
app.get('/api/admin/orders/:id', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isAdmin || !req.user.adminAuthenticated) {
      return res.status(403).json({ message: 'Access denied. Admin authentication required.' });
    }

    const order = await Cart.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ['username']
        },
        {
          model: Book,
          attributes: ['title', 'price']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const formattedOrder = {
      id: order.id,
      username: order.User.username,
      bookTitle: order.Book.title,
      quantity: order.quantity,
      totalPrice: order.Book.price * order.quantity,
      orderDate: order.createdAt,
      status: order.status
    };

    res.json(formattedOrder);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ message: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}/api`);
  console.log(`Books endpoint: http://localhost:${PORT}/api/books`);
}); 