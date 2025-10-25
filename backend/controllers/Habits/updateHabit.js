import db from '../../models/index.js';

const { Habit } = db;

export const updateHabit = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      difficulty,
      frequency,
      targetDays,
      reminderTime,
      isPublic,
      isActive,
      xpReward,
      tags
    } = req.body;

    const habit = await Habit.findByPk(id);

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Verify ownership
    if (habit.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Update fields
    if (title !== undefined) habit.title = title.trim();
    if (description !== undefined) habit.description = description?.trim();
    if (difficulty !== undefined) {
      const validDifficulties = ['easy', 'medium', 'hard', 'extreme'];
      if (!validDifficulties.includes(difficulty)) {
        return res.status(400).json({ message: 'Invalid difficulty' });
      }
      habit.difficulty = difficulty;
      // Auto-adjust XP if difficulty changed and no custom XP set
      if (!xpReward && difficulty !== habit.difficulty) {
        habit.xpReward = null; // Will use default in XP calculation
      }
    }
    if (frequency !== undefined) habit.frequency = frequency;
    if (targetDays !== undefined) habit.targetDays = targetDays;
    if (reminderTime !== undefined) habit.reminderTime = reminderTime;
    if (isPublic !== undefined) habit.isPublic = isPublic;
    if (isActive !== undefined) habit.isActive = isActive;
    if (xpReward !== undefined) habit.xpReward = xpReward;
    if (tags !== undefined) habit.tags = tags;

    await habit.save();

    res.json({
      message: 'Habit updated successfully',
      habit
    });
  } catch (error) {
    console.error('Update habit error:', error);
    res.status(500).json({ message: error.message });
  }
};