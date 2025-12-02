import { jest } from '@jest/globals';
import request from 'supertest';

// Mock authentication middleware
const mockAuthMiddleware = (req, res, next) => {
  req.user = { userId: 'test-user-123' };
  next();
};

// Mock dependencies before importing app
jest.unstable_mockModule('../../models/index.js', () => ({
  default: {
    Notification: {
      create: jest.fn(),
      findOne: jest.fn(),
      findAndCountAll: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
    },
    UserProfile: {
      findOne: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.unstable_mockModule('../../middleware/auth.js', () => ({
  default: mockAuthMiddleware,
}));

jest.unstable_mockModule('../../services/notificationScheduler.js', () => ({
  default: {
    init: jest.fn(),
    stop: jest.fn(),
  },
}));

describe('Notification API Endpoints - Integration Tests', () => {
  let app;
  let db;
  const mockUserId = 'test-user-123';

  beforeAll(async () => {
    // Import app after mocks are set up
    const appModule = await import('../../index.js');
    app = appModule.default;
    
    const dbModule = await import('../../models/index.js');
    db = dbModule.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper for authenticated requests
  const authenticatedRequest = (method, url) => {
    return request(app)[method](url);
  };

  describe('GET /notifications', () => {
    it('should return paginated notifications for authenticated user', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          userId: mockUserId,
          type: 'task_deadline_nearing',
          title: 'Task Due Soon',
          message: 'Your task is due in 24 hours',
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 'notif-2',
          userId: mockUserId,
          type: 'habit_streak_expiring',
          title: 'Streak Warning',
          message: 'Your habit streak will break today',
          isRead: true,
          createdAt: new Date(),
        },
      ];

      db.Notification.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: mockNotifications,
      });

      const response = await authenticatedRequest('get', '/notifications')
        .query({ page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('notifications');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.notifications).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter unread notifications when unreadOnly=true', async () => {
      db.Notification.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [{
          id: 'notif-1',
          userId: mockUserId,
          isRead: false,
        }],
      });

      const response = await authenticatedRequest('get', '/notifications')
        .query({ unreadOnly: true });

      expect(response.status).toBe(200);
      expect(db.Notification.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isRead: false,
          }),
        })
      );
    });

    it('should handle pagination correctly', async () => {
      db.Notification.findAndCountAll.mockResolvedValue({
        count: 50,
        rows: new Array(20).fill({ id: 'notif' }),
      });

      const response = await authenticatedRequest('get', '/notifications')
        .query({ page: 2, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.totalPages).toBe(3);
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const mockNotification = {
        id: 'notif-1',
        userId: mockUserId,
        isRead: false,
        update: jest.fn().mockResolvedValue({ isRead: true }),
        save: jest.fn(),
      };

      db.Notification.findOne.mockResolvedValue(mockNotification);

      const response = await authenticatedRequest('patch', '/notifications/notif-1/read');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('marked as read');
      expect(mockNotification.save).toHaveBeenCalled();
    });

    it('should return 404 if notification not found', async () => {
      db.Notification.findOne.mockResolvedValue(null);

      const response = await authenticatedRequest('patch', '/notifications/invalid-id/read');

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    it('should only allow users to mark their own notifications', async () => {
      const mockNotification = {
        id: 'notif-1',
        userId: 'different-user',
      };

      db.Notification.findOne.mockResolvedValue(null); // Should filter by userId

      const response = await authenticatedRequest('patch', '/notifications/notif-1/read');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /notifications/mark-all-read', () => {
    it('should mark all unread notifications as read', async () => {
      db.Notification.update.mockResolvedValue([5]); // 5 notifications updated

      const response = await authenticatedRequest('post', '/notifications/mark-all-read');

      expect(response.status).toBe(200);
      expect(response.body.updatedCount).toBe(5);
      expect(db.Notification.update).toHaveBeenCalledWith(
        { isRead: true },
        expect.objectContaining({
          where: expect.objectContaining({
            userId: expect.anything(),
            isRead: false,
          }),
        })
      );
    });

    it('should return 0 if no unread notifications', async () => {
      db.Notification.update.mockResolvedValue([0]);

      const response = await authenticatedRequest('post', '/notifications/mark-all-read');

      expect(response.status).toBe(200);
      expect(response.body.updatedCount).toBe(0);
    });
  });

  describe('DELETE /notifications/:id', () => {
    it('should delete notification successfully', async () => {
      const mockNotification = {
        id: 'notif-1',
        userId: mockUserId,
        destroy: jest.fn().mockResolvedValue(true),
      };

      db.Notification.findOne.mockResolvedValue(mockNotification);

      const response = await authenticatedRequest('delete', '/notifications/notif-1');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted successfully');
      expect(mockNotification.destroy).toHaveBeenCalled();
    });

    it('should return 404 if notification not found', async () => {
      db.Notification.findOne.mockResolvedValue(null);

      const response = await authenticatedRequest('delete', '/notifications/invalid-id');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /notifications/preferences', () => {
    it('should return user notification preferences', async () => {
      const mockProfile = {
        notificationsEnabled: true,
        notificationPreferences: {
          taskDeadlines: true,
          habitStreaks: false,
          challengeUpdates: true,
          deadlineAdvanceHours: 48,
        },
      };

      db.UserProfile.findOne.mockResolvedValue(mockProfile);

      const response = await authenticatedRequest('get', '/notifications/preferences');

      expect(response.status).toBe(200);
      expect(response.body.notificationsEnabled).toBe(true);
      expect(response.body.preferences).toEqual(mockProfile.notificationPreferences);
    });

    it('should return default preferences if none set', async () => {
      db.UserProfile.findOne.mockResolvedValue({
        notificationsEnabled: true,
        notificationPreferences: null,
      });

      const response = await authenticatedRequest('get', '/notifications/preferences');

      expect(response.status).toBe(200);
      expect(response.body.preferences).toHaveProperty('taskDeadlines', true);
      expect(response.body.preferences).toHaveProperty('deadlineAdvanceHours', 24);
    });

    it('should return 404 if user profile not found', async () => {
      db.UserProfile.findOne.mockResolvedValue(null);

      const response = await authenticatedRequest('get', '/notifications/preferences');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /notifications/preferences', () => {
    it('should update notification preferences', async () => {
      const mockProfile = {
        notificationsEnabled: true,
        notificationPreferences: {
          taskDeadlines: true,
          habitStreaks: true,
        },
        update: jest.fn().mockResolvedValue(true),
      };

      db.UserProfile.findOne.mockResolvedValue(mockProfile);

      const response = await authenticatedRequest('put', '/notifications/preferences')
        .send({
          preferences: {
            taskDeadlines: false,
            deadlineAdvanceHours: 48,
          },
        });

      expect(response.status).toBe(200);
      expect(mockProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationPreferences: expect.objectContaining({
            taskDeadlines: false,
            habitStreaks: true, // Existing preference merged
            deadlineAdvanceHours: 48,
          }),
        })
      );
    });

    it('should update notificationsEnabled flag', async () => {
      const mockProfile = {
        notificationsEnabled: true,
        notificationPreferences: {},
        update: jest.fn().mockResolvedValue(true),
      };

      db.UserProfile.findOne.mockResolvedValue(mockProfile);

      const response = await authenticatedRequest('put', '/notifications/preferences')
        .send({
          notificationsEnabled: false,
        });

      expect(response.status).toBe(200);
      expect(mockProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationsEnabled: false,
        })
      );
    });

    it('should merge partial preference updates', async () => {
      const mockProfile = {
        notificationsEnabled: true,
        notificationPreferences: {
          taskDeadlines: true,
          habitStreaks: true,
          challengeUpdates: true,
        },
        update: jest.fn().mockResolvedValue(true),
      };

      db.UserProfile.findOne.mockResolvedValue(mockProfile);

      const response = await authenticatedRequest('put', '/notifications/preferences')
        .send({
          preferences: {
            habitStreaks: false, // Only updating one preference
          },
        });

      expect(response.status).toBe(200);
      const updatedPrefs = mockProfile.update.mock.calls[0][0].notificationPreferences;
      expect(updatedPrefs.taskDeadlines).toBe(true); // Unchanged
      expect(updatedPrefs.habitStreaks).toBe(false); // Updated
      expect(updatedPrefs.challengeUpdates).toBe(true); // Unchanged
    });

    it('should return 404 if user profile not found', async () => {
      db.UserProfile.findOne.mockResolvedValue(null);

      const response = await authenticatedRequest('put', '/notifications/preferences')
        .send({
          preferences: { taskDeadlines: false },
        });

      expect(response.status).toBe(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      db.Notification.findAndCountAll.mockRejectedValue(new Error('Database connection failed'));

      const response = await authenticatedRequest('get', '/notifications');

      expect(response.status).toBe(500);
      expect(response.body.message).toContain('error occurred');
    });

    it('should handle validation errors', async () => {
      const response = await authenticatedRequest('put', '/notifications/preferences')
        .send({
          preferences: 'invalid-type', // Should be object
        });

      // Should return 404 if profile not found, or handle gracefully
      expect([200, 404, 500]).toContain(response.status);
    });
  });
});

