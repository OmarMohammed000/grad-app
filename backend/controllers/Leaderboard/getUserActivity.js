import db from '../../models/index.js';

const { TaskCompletion, HabitCompletion, User } = db;

const PERIOD_CONFIG = {
  weekly: {
    buckets: 7,
    labelFormatter: (date) =>
      date.toLocaleDateString('en-US', { weekday: 'short' }),
    step: (date) => {
      const d = new Date(date);
      d.setDate(d.getDate() - 1);
      d.setHours(0, 0, 0, 0);
      return d;
    },
    filterStart: () => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      d.setHours(0, 0, 0, 0);
      return d;
    }
  },
  monthly: {
    buckets: 4,
    labelFormatter: (_date, _index, total) => `W${_index + 1}`,
    step: (date) => {
      const d = new Date(date);
      d.setDate(d.getDate() - 7);
      d.setHours(0, 0, 0, 0);
      return d;
    },
    filterStart: () => {
      const d = new Date();
      d.setDate(d.getDate() - 28);
      d.setHours(0, 0, 0, 0);
      return d;
    }
  },
  yearly: {
    buckets: 12,
    labelFormatter: (date) =>
      date.toLocaleDateString('en-US', { month: 'short' }),
    step: (date) => {
      const d = new Date(date);
      d.setMonth(d.getMonth() - 1);
      d.setHours(0, 0, 0, 0);
      return d;
    },
    filterStart: () => {
      const d = new Date();
      d.setMonth(d.getMonth() - 11);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }
};

export const getUserActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const period = req.query.period || 'weekly'; // weekly, monthly, yearly
    const config = PERIOD_CONFIG[period] || PERIOD_CONFIG.weekly;

    const targetUserId = id === 'me' ? req.user.userId : id;

    const user = await User.findByPk(targetUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const startDate = config.filterStart();
    const now = new Date();

    const [taskCompletions, habitCompletions] = await Promise.all([
      TaskCompletion.findAll({
        where: {
          userId: targetUserId,
          completedAt: {
            [db.Sequelize.Op.between]: [startDate, now]
          }
        },
        attributes: ['completedAt', 'xpEarned'],
        raw: true
      }),
      HabitCompletion.findAll({
        where: {
          userId: targetUserId,
          completedDate: {
            [db.Sequelize.Op.between]: [
              startDate.toISOString().split('T')[0],
              now.toISOString().split('T')[0]
            ]
          }
        },
        attributes: ['completedDate', 'xpEarned'],
        raw: true
      })
    ]);

    const segments = [];
    let bucketEnd = new Date(now);
    bucketEnd.setHours(23, 59, 59, 999);

    for (let i = 0; i < config.buckets; i++) {
      const label = config.labelFormatter(
        new Date(bucketEnd),
        config.buckets - i - 1,
        config.buckets
      );
      const bucketStart = config.step(new Date(bucketEnd));
      segments.push({
        label,
        start: new Date(bucketStart),
        end: new Date(bucketEnd)
      });
      bucketEnd = new Date(bucketStart);
    }

    const buckets = segments.reverse();

    const activity = buckets.map((bucket) => {
      let tasks = 0;
      let habits = 0;
      let xp = 0;

      taskCompletions.forEach((completion) => {
        const completedAt = new Date(completion.completedAt);
        if (
          completedAt >= bucket.start &&
          completedAt <= bucket.end
        ) {
          tasks += 1;
          xp += completion.xpEarned || 0;
        }
      });

      habitCompletions.forEach((completion) => {
        const completedAt = new Date(completion.completedDate + 'T00:00:00');
        if (
          completedAt >= bucket.start &&
          completedAt <= bucket.end
        ) {
          habits += 1;
          xp += completion.xpEarned || 0;
        }
      });

      return {
        label: bucket.label,
        tasks,
        habits,
        xp
      };
    });

    res.json({
      period,
      activity
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ message: error.message });
  }
};

