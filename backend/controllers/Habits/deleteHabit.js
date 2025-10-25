import db from '../../models/index.js';

const { Habit } = db;

export const deleteHabit = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    const habit = await Habit.findByPk(id);

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    if (habit.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (permanent === 'true') {
      // Hard delete (admin or user request)
      await habit.destroy();
      return res.json({ message: 'Habit permanently deleted' });
    } else {
      // Soft delete
      habit.isActive = false;
      await habit.save();
      return res.json({ 
        message: 'Habit deactivated',
        habit
      });
    }
  } catch (error) {
    console.error('Delete habit error:', error);
    res.status(500).json({ message: error.message });
  }
};