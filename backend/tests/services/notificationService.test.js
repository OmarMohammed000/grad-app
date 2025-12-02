import { jest } from '@jest/globals';

// Mock notification service
const NotificationTypes = {
  TASK_DEADLINE_NEARING: 'task_deadline_nearing',
  HABIT_STREAK_EXPIRING: 'habit_streak_expiring',
  CHALLENGE_TASK_CREATED: 'challenge_task_created',
  CHALLENGE_TASK_DEADLINE: 'challenge_task_deadline',
  CHALLENGE_ENDING_SOON: 'challenge_ending_soon',
  CHALLENGE_INVITATION: 'challenge_invitation',
  CHALLENGE_COMPLETED: 'challenge_completed',
  INACTIVE_USER_REMINDER: 'inactive_user_reminder',
};

// Mock database
const mockDb = {
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
  sequelize: {
    transaction: jest.fn(() => ({
      commit: jest.fn(),
      rollback: jest.fn(),
    })),
  },
};

// Mock Expo SDK
const mockExpo = {
  Expo: jest.fn().mockImplementation(() => ({
    isExpoPushToken: jest.fn(() => true),
    chunkPushNotifications: jest.fn(messages => [messages]),
    sendPushNotificationsAsync: jest.fn(() => Promise.resolve([{ status: 'ok' }])),
  })),
  isExpoPushToken: jest.fn(() => true),
};

describe('NotificationService - Unit Tests', () => {
  let notificationService;
  let db;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks
    db = { ...mockDb };
    
    // Mock module imports
    jest.unstable_mockModule('../../models/index.js', () => ({ default: db }));
    jest.unstable_mockModule('expo-server-sdk', () => mockExpo);
  });

  describe('createNotification', () => {
    it('should create an in-app notification with all fields', async () => {
      const mockNotification = {
        id: 'notif-123',
        userId: 'user-1',
        type: NotificationTypes.TASK_DEADLINE_NEARING,
        title: 'Task Due Soon',
        message: 'Complete your task',
        metadata: { taskId: 'task-1' },
        relatedEntityType: 'task',
        relatedEntityId: 'task-1',
        sentAt: expect.any(Date),
        isRead: false,
      };

      db.Notification.create.mockResolvedValue(mockNotification);

      // Dynamic import after mocking
      const { default: service } = await import('../../services/notificationService.js');

      const result = await service.createNotification('user-1', {
        type: NotificationTypes.TASK_DEADLINE_NEARING,
        title: 'Task Due Soon',
        message: 'Complete your task',
        metadata: { taskId: 'task-1' },
        relatedEntityType: 'task',
        relatedEntityId: 'task-1',
      });

      expect(db.Notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          type: NotificationTypes.TASK_DEADLINE_NEARING,
          title: 'Task Due Soon',
          message: 'Complete your task',
        })
      );
    });

    it('should handle errors gracefully', async () => {
      db.Notification.create.mockRejectedValue(new Error('Database error'));

      const { default: service } = await import('../../services/notificationService.js');

      await expect(
        service.createNotification('user-1', {
          type: NotificationTypes.TASK_DEADLINE_NEARING,
          title: 'Test',
          message: 'Test message',
        })
      ).rejects.toThrow('Database error');
    });
  });

  describe('checkNotificationPreference', () => {
    it('should return true when preference is enabled', async () => {
      const { default: service } = await import('../../services/notificationService.js');

      const preferences = {
        taskDeadlines: true,
        habitStreaks: false,
      };

      const result = service.checkNotificationPreference(
        preferences,
        NotificationTypes.TASK_DEADLINE_NEARING
      );

      expect(result).toBe(true);
    });

    it('should return false when preference is disabled', async () => {
      const { default: service } = await import('../../services/notificationService.js');

      const preferences = {
        taskDeadlines: false,
      };

      const result = service.checkNotificationPreference(
        preferences,
        NotificationTypes.TASK_DEADLINE_NEARING
      );

      expect(result).toBe(false);
    });

    it('should default to true when no preferences are set', async () => {
      const { default: service } = await import('../../services/notificationService.js');

      const result = service.checkNotificationPreference(
        null,
        NotificationTypes.TASK_DEADLINE_NEARING
      );

      expect(result).toBe(true);
    });

    it('should default to true for unknown notification types', async () => {
      const { default: service } = await import('../../services/notificationService.js');

      const preferences = {
        taskDeadlines: false,
      };

      const result = service.checkNotificationPreference(
        preferences,
        'unknown_type'
      );

      expect(result).toBe(true);
    });
  });

  describe('sendPushNotification', () => {
    it('should skip if user has no push token', async () => {
      db.UserProfile.findOne.mockResolvedValue({
        pushToken: null,
        notificationsEnabled: true,
      });

      const { default: service } = await import('../../services/notificationService.js');

      const result = await service.sendPushNotification('user-1', {
        title: 'Test',
        message: 'Test message',
        type: NotificationTypes.TASK_DEADLINE_NEARING,
      });

      expect(result).toBe(false);
    });

    it('should skip if notifications are disabled', async () => {
      db.UserProfile.findOne.mockResolvedValue({
        pushToken: 'ExponentPushToken[xxx]',
        notificationsEnabled: false,
      });

      const { default: service } = await import('../../services/notificationService.js');

      const result = await service.sendPushNotification('user-1', {
        title: 'Test',
        message: 'Test message',
        type: NotificationTypes.TASK_DEADLINE_NEARING,
      });

      expect(result).toBe(false);
    });

    it('should skip if notification type preference is disabled', async () => {
      db.UserProfile.findOne.mockResolvedValue({
        pushToken: 'ExponentPushToken[xxx]',
        notificationsEnabled: true,
        notificationPreferences: {
          taskDeadlines: false,
        },
      });

      const { default: service } = await import('../../services/notificationService.js');

      const result = await service.sendPushNotification('user-1', {
        title: 'Test',
        message: 'Test message',
        type: NotificationTypes.TASK_DEADLINE_NEARING,
      });

      expect(result).toBe(false);
    });
  });

  describe('notifyUsers (batch)', () => {
    it('should notify multiple users successfully', async () => {
      db.Notification.create.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
      });

      const { default: service } = await import('../../services/notificationService.js');
      
      // Mock notifyUser to resolve successfully
      service.notifyUser = jest.fn().mockResolvedValue({ id: 'notif-1' });

      const userIds = ['user-1', 'user-2', 'user-3'];
      const notificationData = {
        type: NotificationTypes.CHALLENGE_TASK_CREATED,
        title: 'New Task',
        message: 'A new task was added',
      };

      const results = await service.notifyUsers(userIds, notificationData);

      expect(service.notifyUser).toHaveBeenCalledTimes(3);
      expect(results).toHaveLength(3);
    });

    it('should handle partial failures gracefully', async () => {
      const { default: service } = await import('../../services/notificationService.js');
      
      // Mock some successes and some failures
      service.notifyUser = jest.fn()
        .mockResolvedValueOnce({ id: 'notif-1' })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ id: 'notif-3' });

      const userIds = ['user-1', 'user-2', 'user-3'];
      const notificationData = {
        type: NotificationTypes.CHALLENGE_TASK_CREATED,
        title: 'New Task',
        message: 'A new task was added',
      };

      const results = await service.notifyUsers(userIds, notificationData);

      // Should return only successful notifications
      expect(results).toHaveLength(2);
    });
  });

  describe('getDeadlineAdvanceHours', () => {
    it('should return user configured advance hours', async () => {
      db.UserProfile.findOne.mockResolvedValue({
        notificationPreferences: {
          deadlineAdvanceHours: 48,
        },
      });

      const { default: service } = await import('../../services/notificationService.js');

      const result = await service.getDeadlineAdvanceHours('user-1');

      expect(result).toBe(48);
    });

    it('should default to 24 hours if not configured', async () => {
      db.UserProfile.findOne.mockResolvedValue({
        notificationPreferences: {},
      });

      const { default: service } = await import('../../services/notificationService.js');

      const result = await service.getDeadlineAdvanceHours('user-1');

      expect(result).toBe(24);
    });

    it('should default to 24 hours if user profile not found', async () => {
      db.UserProfile.findOne.mockResolvedValue(null);

      const { default: service } = await import('../../services/notificationService.js');

      const result = await service.getDeadlineAdvanceHours('user-1');

      expect(result).toBe(24);
    });
  });
});
