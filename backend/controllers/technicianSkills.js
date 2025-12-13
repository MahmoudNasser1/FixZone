const db = require('../db');

/**
 * Get all skills for a technician
 */
exports.getTechnicianSkills = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [skills] = await db.query(`
      SELECT 
        ts.*,
        u.name as verifiedByName
      FROM TechnicianSkills ts
      LEFT JOIN User u ON ts.verifiedBy = u.id
      WHERE ts.technicianId = ?
      ORDER BY ts.createdAt DESC
    `, [id]);
    
    res.json({ success: true, data: skills });
  } catch (err) {
    console.error('Error fetching technician skills:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
};

/**
 * Add a skill to a technician
 */
exports.addSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const { skillName, skillLevel, certification, certificationDate, expiryDate, notes } = req.body;
    
    if (!skillName) {
      return res.status(400).json({ success: false, error: 'اسم المهارة مطلوب' });
    }
    
    const [result] = await db.query(`
      INSERT INTO TechnicianSkills 
      (technicianId, skillName, skillLevel, certification, certificationDate, expiryDate, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, skillName, skillLevel || 'intermediate', certification || null, certificationDate || null, expiryDate || null, notes || null]);
    
    const [newSkill] = await db.query('SELECT * FROM TechnicianSkills WHERE id = ?', [result.insertId]);
    
    res.status(201).json({ success: true, data: newSkill[0] });
  } catch (err) {
    console.error('Error adding skill:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
};

/**
 * Update a skill
 */
exports.updateSkill = async (req, res) => {
  try {
    const { id, skillId } = req.params;
    const { skillName, skillLevel, certification, certificationDate, expiryDate, verifiedBy, notes } = req.body;
    
    const [existing] = await db.query(
      'SELECT * FROM TechnicianSkills WHERE id = ? AND technicianId = ?',
      [skillId, id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'المهارة غير موجودة' });
    }
    
    const updateData = {};
    if (skillName !== undefined) updateData.skillName = skillName;
    if (skillLevel !== undefined) updateData.skillLevel = skillLevel;
    if (certification !== undefined) updateData.certification = certification;
    if (certificationDate !== undefined) updateData.certificationDate = certificationDate;
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate;
    if (notes !== undefined) updateData.notes = notes;
    
    if (verifiedBy !== undefined) {
      updateData.verifiedBy = verifiedBy;
      updateData.verifiedAt = verifiedBy ? new Date() : null;
    }
    
    const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), skillId, id];
    
    await db.query(`
      UPDATE TechnicianSkills 
      SET ${setClause}
      WHERE id = ? AND technicianId = ?
    `, values);
    
    const [updated] = await db.query('SELECT * FROM TechnicianSkills WHERE id = ?', [skillId]);
    
    res.json({ success: true, data: updated[0] });
  } catch (err) {
    console.error('Error updating skill:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
};

/**
 * Delete a skill
 */
exports.deleteSkill = async (req, res) => {
  try {
    const { id, skillId } = req.params;
    
    const [result] = await db.query(
      'DELETE FROM TechnicianSkills WHERE id = ? AND technicianId = ?',
      [skillId, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'المهارة غير موجودة' });
    }
    
    res.json({ success: true, message: 'تم حذف المهارة بنجاح' });
  } catch (err) {
    console.error('Error deleting skill:', err);
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
};


