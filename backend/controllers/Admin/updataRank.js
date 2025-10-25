// backend/controllers/Admin/updateRank.js (admin only)
import db from '../../models/index.js';

export default async function updateRank(req, res) {
  try {
    const { id } = req.params;
    const { name, minLevel, maxLevel, color, description } = req.body;

    const rank = await db.Rank.findByPk(id);
    if (!rank) {
      return res.status(404).json({ message: 'Rank not found' });
    }

    await rank.update({ name, minLevel, maxLevel, color, description });

    return res.status(200).json({
      message: 'Rank updated successfully',
      rank
    });
  } catch (error) {
    console.error('Error updating rank:', error);
    return res.status(500).json({ message: error.message });
  }
}