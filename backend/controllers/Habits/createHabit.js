import db from '../../models/index.js';

const { Habit } = db;

export const createHabit = async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty = 'medium',
      frequency = 'daily',
      targetDays = [],
      reminderTime,
      isPublic = false,
      xpReward,
      tags = []
    } = req.body;

    // Validation
    if (!title?.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const validDifficulties = ['easy', 'medium', 'hard', 'extreme'];
    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({ message: 'Invalid difficulty level' });
    }

    const validFrequencies = ['daily', 'weekly', 'custom'];
    if (!validFrequencies.includes(frequency)) {
      return res.status(400).json({ message: 'Invalid frequency' });
    }

    // Create habit
    const habit = await Habit.create({
      userId: req.user.userId,
      title: title.trim(),
      description: description?.trim(),
      difficulty,
      frequency,
      targetDays: frequency === 'custom' ? targetDays : [],
      reminderTime,
      isPublic,
      xpReward,
      tags,
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      isActive: true
    });

    res.status(201).json({
      message: 'Habit created successfully',
      habit
    });
  } catch (error) {
    console.error('Create habit error:', error);
    res.status(500).json({ message: error.message });
  }
};