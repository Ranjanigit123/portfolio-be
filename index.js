const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ranjanirithu206:KS0pwc1jwcIxmZu0@cluster0.8mgcr.mongodb.net/Myportfolio?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Contact Schema
const contactSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  mobile: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied'],
    default: 'new'
  }
});

const Contact = mongoose.model('Contact', contactSchema);

// Routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend server is running successfully!' });
});

// Contact form submission
app.post('/api/contact', async (req, res) => {
  console.log("Received contact form data:", req.body);
  
  try {
    const { fullName, email, mobile, subject, message } = req.body;

    // Validation with detailed logging
    console.log("Validating fields:");
    console.log("- fullName:", fullName, "Valid:", !!fullName);
    console.log("- email:", email, "Valid:", !!email);
    console.log("- subject:", subject, "Valid:", !!subject);
    console.log("- message:", message, "Valid:", !!message);

    if (!fullName || !email || !subject || !message) {
      console.log("Validation failed: Missing required fields");
      return res.status(400).json({
        success: false,
        message: 'All required fields must be filled'
      });
    }

    // Email validation with detailed logging
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(email);
    console.log("Email validation:", email, "Valid:", isValidEmail);
    
    if (!isValidEmail) {
      console.log("Email validation failed for:", email);
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Create new contact
    const contactData = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile ? mobile.trim() : '',
      subject: subject.trim(),
      message: message.trim()
    };

    console.log("Creating contact with data:", contactData);

    const newContact = new Contact(contactData);
    await newContact.save();

    console.log('New contact form submission saved successfully:', {
      id: newContact._id,
      name: fullName,
      email: email,
      subject: subject,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully! I will get back to you soon.',
      data: {
        id: newContact._id,
        timestamp: newContact.createdAt
      }
    });

  } catch (error) {
    console.error('Error saving contact form:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
});

// Get all contacts (for admin purposes)
app.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: contacts,
      count: contacts.length
    });

  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contacts'
    });
  }
});

// Update contact status
app.patch('/api/contacts/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['new', 'read', 'replied'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      data: contact
    });

  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating contact status'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Portfolio backend server is running on port ${PORT}`);
  console.log(`📊 Health check: https://portfolio-be-5rqa.onrender.com/health`);
  console.log(`🔗 API test: https://portfolio-be-5rqa.onrender.com/api/test`);
});

module.exports = app;