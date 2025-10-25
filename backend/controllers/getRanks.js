// backend/controllers/Rank/getRanks.js
import db from '../../models/index.js';

export default async function getRanks(req, res) {
  try {
    const ranks = await db.Rank.findAll({
      order: [['orderIndex', 'ASC']],
      attributes: ['id', 'name', 'minLevel', 'maxLevel', 'color', 'description', 'orderIndex']
    });

    return res.status(200).json({ ranks });
  } catch (error) {
    console.error('Error fetching ranks:', error);
    return res.status(500).json({
      message: 'An error occurred while fetching ranks',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}