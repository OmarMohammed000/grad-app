import db from "../../models/index.js";

/**
 * Delete task (soft delete preferred)
 * DELETE /tasks/:id
 */
export default async function deleteTask(req, res) {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    const { permanent = false } = req.query; // Allow permanent deletion via query param

    // Find task and verify ownership
    const task = await db.Task.findOne({
      where: {
        id,
        userId: req.user.userId // User-specific
      },
      include: [
        {
          model: db.Task,
          as: 'subtasks',
          attributes: ['id', 'title']
        }
      ],
      transaction
    });

    if (!task) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Task not found"
      });
    }

    // Check if task has subtasks
    if (task.subtasks && task.subtasks.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Cannot delete task: it has ${task.subtasks.length} subtask(s). Delete subtasks first or use cascade deletion.`,
        subtasks: task.subtasks.map(st => ({ id: st.id, title: st.title }))
      });
    }

    if (permanent === 'true' || permanent === true) {
      // Permanent deletion - delete completions first (cascade)
      await db.TaskCompletion.destroy({
        where: { taskId: task.id },
        transaction
      });

      await task.destroy({ transaction });

      // Log activity
      await db.ActivityLog.create({
        userId: req.user.userId,
        action: 'task_deleted_permanent',
        entityType: 'Task',
        entityId: task.id,
        metadata: { title: task.title }
      }, { transaction });

      await transaction.commit();

      return res.status(200).json({
        message: "Task permanently deleted"
      });

    } else {
      // Soft delete - mark as deleted/archived
      await task.update({
        status: 'deleted',
        metadata: {
          ...task.metadata,
          deletedAt: new Date(),
          originalStatus: task.status
        }
      }, { transaction });

      // Log activity
      await db.ActivityLog.create({
        userId: req.user.userId,
        action: 'task_deleted_soft',
        entityType: 'Task',
        entityId: task.id,
        metadata: { title: task.title }
      }, { transaction });

      await transaction.commit();

      return res.status(200).json({
        message: "Task deleted (archived). You can restore it by updating its status.",
        task: {
          id: task.id,
          title: task.title,
          status: 'deleted'
        }
      });
    }

  } catch (error) {
    await transaction.rollback();
    console.error("Error deleting task:", error);
    return res.status(500).json({
      message: "An error occurred while deleting the task",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
