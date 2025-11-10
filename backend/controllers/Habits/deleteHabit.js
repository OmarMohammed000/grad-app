import db from '../../models/index.js';

const { Habit } = db;

export const deleteHabit = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    console.log('Delete habit request:', { id, permanent, userId: req.user.userId });

    const habit = await Habit.findByPk(id);

    if (!habit) {
      console.log('Habit not found:', id);
      return res.status(404).json({ message: 'Habit not found' });
    }

    if (habit.userId !== req.user.userId) {
      console.log('Forbidden: User does not own habit', { habitUserId: habit.userId, requestUserId: req.user.userId });
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (permanent === 'true') {
      // Hard delete (admin or user request)
      console.log('Permanently deleting habit:', id);
      await habit.destroy();
      
      // Log activity
      try {
        await db.ActivityLog.create({
          userId: req.user.userId,
          activityType: 'habit_deleted',
          description: `Habit permanently deleted: ${habit.title}`,
          xpGained: 0,
          relatedHabitId: id,
          isPublic: false,
          importance: 'medium'
        });
      } catch (logError) {
        console.error('Error logging habit deletion:', logError);
        // Don't fail the request if logging fails
      }
      
      return res.json({ message: 'Habit permanently deleted' });
    } else {
      // Soft delete
      console.log('Soft deleting (deactivating) habit:', id);
      habit.isActive = false;
      await habit.save();
      
      // Log activity
      try {
        await db.ActivityLog.create({
          userId: req.user.userId,
          activityType: 'habit_deleted',
          description: `Habit deactivated: ${habit.title}`,
          xpGained: 0,
          relatedHabitId: id,
          isPublic: false,
          importance: 'medium'
        });
      } catch (logError) {
        console.error('Error logging habit deactivation:', logError);
        // Don't fail the request if logging fails
      }
      
      console.log('Habit deactivated successfully:', id);
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