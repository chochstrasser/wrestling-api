import express from 'express';
import { Wrestler } from '../database.js';
import { Op } from 'sequelize';
import { verifyApiKey } from '../middleware/auth.js';

const router = express.Router();

// GET /api/v1/wrestlers - Search wrestlers by name or school
router.get('/wrestlers', verifyApiKey, async (req, res) => {
  try {
    const { name, school, firstName, lastName, weight_class, grade } = req.query;

    const whereClause = {};

    // Filter by weight class
    if (weight_class) {
      whereClause.weight_class = weight_class;
    }

    // Filter by grade
    if (grade) {
      const gradeUpper = grade.toUpperCase();
      if (['FR', 'SO', 'JR', 'SR'].includes(gradeUpper)) {
        whereClause.grade = gradeUpper;
      } else {
        return res.status(400).json({
          detail: 'Invalid grade. Must be one of: FR, SO, JR, SR'
        });
      }
    }

    // Filter by school (partial match, case-insensitive)
    if (school) {
      whereClause.school = {
        [Op.iLike]: `%${school}%`
      };
    }

    // Filter by full name (partial match, case-insensitive)
    if (name) {
      whereClause.name = {
        [Op.iLike]: `%${name}%`
      };
    }

    // Filter by first name (assumes first name is at the beginning)
    if (firstName) {
      whereClause.name = {
        [Op.iLike]: `${firstName}%`
      };
    }

    // Filter by last name (assumes last name contains the search term)
    if (lastName) {
      whereClause.name = {
        [Op.iLike]: `% ${lastName}%`
      };
    }

    // If no search parameters provided, return error
    if (Object.keys(whereClause).length === 0) {
      return res.status(400).json({
        detail: 'Please provide at least one search parameter: name, firstName, lastName, school, weight_class, or grade'
      });
    }

    const wrestlers = await Wrestler.findAll({
      where: whereClause,
      order: [['rank', 'ASC']]
    });

    res.json(wrestlers);
  } catch (error) {
    console.error('Error searching wrestlers:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;
