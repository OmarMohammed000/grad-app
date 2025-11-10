import db from '../../models/index.js';

const { Habit, HabitCompletion } = db;

export const getHabit = async (req, res) => {
  try {
    const { id } = req.params;

    const habit = await Habit.findByPk(id, {
      include: [
        {
          model: HabitCompletion,
          as: 'completions',
          limit: 30,
          order: [['completedDate', 'DESC']]
        }
      ]
    });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Verify ownership
    if (habit.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json({ habit });
  } catch (error) {
    console.error('Get habit error:', error);
    res.status(500).json({ message: error.message });
  }
};