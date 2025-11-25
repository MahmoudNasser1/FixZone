const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Get JWT_SECRET from environment variables or use fallback
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'your_jwt_secret_key');

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}

/**
 * Customer Login
 * Customers can login using phone or email
 * They must have a User account linked to their Customer record
 */
exports.customerLogin = async (req, res) => {
  const { loginIdentifier, password } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'Unknown';

  // Validation
  if (!loginIdentifier || !password) {
    return res.status(400).json({ 
      success: false,
      message: 'يرجى إدخال رقم الهاتف أو البريد الإلكتروني وكلمة المرور' 
    });
  }

  try {
    // Find customer by phone or email
    const [customers] = await db.execute(
      `SELECT c.*, u.id as userId, u.name as userName, u.email as userEmail, 
              u.password as userPassword, u.roleId, u.isActive as userActive
       FROM Customer c
       LEFT JOIN User u ON c.userId = u.id
       WHERE (c.phone = ? OR c.email = ?) AND c.deletedAt IS NULL`,
      [loginIdentifier, loginIdentifier]
    );

    if (!customers.length) {
      return res.status(404).json({ 
        success: false,
        message: 'العميل غير موجود' 
      });
    }

    const customer = customers[0];

    // Check if customer has a User account
    if (!customer.userId) {
      return res.status(403).json({ 
        success: false,
        message: 'الحساب غير مفعل. يرجى التواصل مع الإدارة لتفعيل الحساب' 
      });
    }

    // Check if user account is active
    if (!customer.userActive) {
      return res.status(403).json({ 
        success: false,
        message: 'الحساب معطل. يرجى التواصل مع الإدارة' 
      });
    }

    // Verify role is Customer
    const [roles] = await db.execute(
      'SELECT id, name FROM Role WHERE id = ? AND name = ? AND deletedAt IS NULL',
      [customer.roleId, 'Customer']
    );

    if (!roles.length) {
      return res.status(403).json({ 
        success: false,
        message: 'حساب العميل غير صالح' 
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, customer.userPassword);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'كلمة المرور غير صحيحة' 
      });
    }

    // Generate JWT
    const payload = {
      id: customer.userId,
      customerId: customer.id,
      role: customer.roleId,
      roleId: customer.roleId,
      name: customer.name || customer.userName,
      type: 'customer' // Mark as customer login
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' }); // 24 hours for customers

    // Send the token in a secure, httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Log login attempt
    try {
      await db.execute(
        'INSERT INTO UserLoginLog (userId, loginAt, ipAddress, deviceInfo) VALUES (?, NOW(), ?, ?)',
        [customer.userId, ipAddress, userAgent]
      );
    } catch (error) {
      console.error('Error logging customer login:', error);
    }

    // Return customer info (without sensitive data)
    res.json({
      success: true,
      data: {
        id: customer.userId,
        customerId: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email || customer.userEmail,
        role: customer.roleId,
        roleId: customer.roleId,  // Add roleId explicitly for frontend
        type: 'customer'
      }
    });

  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في الخادم' 
    });
  }
};

/**
 * Get Customer Profile
 * Returns customer's own information
 */
exports.getCustomerProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const roleId = req.user.roleId || req.user.role;
    
    // Only allow customers (roleId === 6) to access this endpoint
    if (roleId !== 6 && roleId !== '6') {
      return res.status(403).json({ 
        success: false,
        message: 'غير مصرح بالوصول - هذا المسار مخصص للعملاء فقط' 
      });
    }
    
    let customerId = req.user.customerId;
    
    // If customerId is not in JWT, try to find it from User.customerId or Customer.userId
    if (!customerId) {
      // Check User table for customerId
      const [users] = await db.execute(
        'SELECT customerId FROM User WHERE id = ? AND deletedAt IS NULL',
        [userId]
      );
      if (users.length > 0 && users[0].customerId) {
        customerId = users[0].customerId;
      } else {
        // Check Customer table for userId
        const [customers] = await db.execute(
          'SELECT id FROM Customer WHERE userId = ? AND deletedAt IS NULL',
          [userId]
        );
        if (customers.length > 0) {
          customerId = customers[0].id;
          
          // Update User table with customerId for future requests
          try {
            await db.execute(
              'UPDATE User SET customerId = ? WHERE id = ?',
              [customerId, userId]
            );
          } catch (updateError) {
            console.error('Error updating User.customerId:', updateError);
            // Continue even if update fails
          }
        }
      }
    }

    if (!customerId) {
      return res.status(404).json({ 
        success: false,
        message: 'العميل غير موجود - لا يوجد حساب عميل مرتبط بهذا المستخدم' 
      });
    }

    const [customers] = await db.execute(
      `SELECT c.*, u.email as userEmail, u.phone as userPhone, u.isActive as userActive
       FROM Customer c
       LEFT JOIN User u ON c.userId = u.id
       WHERE c.id = ? AND c.deletedAt IS NULL`,
      [customerId]
    );

    if (!customers.length) {
      return res.status(404).json({ 
        success: false,
        message: 'العميل غير موجود' 
      });
    }

    const customer = customers[0];

    // Remove sensitive data
    delete customer.userPassword;

    res.json({
      success: true,
      data: customer
    });

  } catch (error) {
    console.error('Error fetching customer profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في الخادم' 
    });
  }
};

/**
 * Update Customer Profile
 * Customers can update their own information
 */
exports.updateCustomerProfile = async (req, res) => {
  try {
    const customerId = req.user.customerId || req.user.id;
    const { name, phone, email, address } = req.body;

    if (!customerId) {
      return res.status(403).json({ 
        success: false,
        message: 'غير مصرح بالوصول' 
      });
    }

    // Build update fields
    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push('name = ?');
      values.push(name);
    }

    if (phone !== undefined) {
      // Check if phone already exists for another customer
      const [existing] = await db.execute(
        'SELECT id FROM Customer WHERE phone = ? AND id != ? AND deletedAt IS NULL',
        [phone, customerId]
      );
      if (existing.length > 0) {
        return res.status(409).json({ 
          success: false,
          message: 'رقم الهاتف مستخدم مسبقاً' 
        });
      }
      fields.push('phone = ?');
      values.push(phone);
    }

    if (email !== undefined) {
      fields.push('email = ?');
      values.push(email);
    }

    if (address !== undefined) {
      fields.push('address = ?');
      values.push(address);
    }

    if (fields.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'لا توجد بيانات للتحديث' 
      });
    }

    values.push(customerId);

    await db.execute(
      `UPDATE Customer SET ${fields.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL`,
      values
    );

    // Fetch updated customer
    const [customers] = await db.execute(
      'SELECT * FROM Customer WHERE id = ? AND deletedAt IS NULL',
      [customerId]
    );

    res.json({
      success: true,
      message: 'تم تحديث البيانات بنجاح',
      data: customers[0]
    });

  } catch (error) {
    console.error('Error updating customer profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في الخادم' 
    });
  }
};

/**
 * Change Customer Password
 */
exports.changeCustomerPassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'كلمة المرور الحالية وكلمة المرور الجديدة مطلوبتان' 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false,
        message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' 
      });
    }

    // Get user
    const [users] = await db.execute(
      'SELECT password FROM User WHERE id = ? AND deletedAt IS NULL',
      [userId]
    );

    if (!users.length) {
      return res.status(404).json({ 
        success: false,
        message: 'المستخدم غير موجود' 
      });
    }

    const user = users[0];

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'كلمة المرور الحالية غير صحيحة' 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await db.execute(
      'UPDATE User SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    });

  } catch (error) {
    console.error('Error changing customer password:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في الخادم' 
    });
  }
};

