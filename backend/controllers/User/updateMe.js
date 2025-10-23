import db from "../../models/index.js";

/**
 * Update current user profile
 * PUT /users/me
 */
export default async function updateMe(req, res) {
  try {
    const {
      displayName,
      firstName,
      lastName,
      avatarUrl,
      bio,
      dateOfBirth,
      timezone,
      language,
      theme,
      notificationsEnabled,
      emailNotifications,
      soundEnabled,
      isPublicProfile
    } = req.body;

    const user = await db.User.findByPk(req.user.userId, {
      include: [
        {
          model: db.UserProfile,
          as: 'profile'
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Build update object with only provided fields
    const profileUpdates = {};
    if (displayName !== undefined) profileUpdates.displayName = displayName;
    if (firstName !== undefined) profileUpdates.firstName = firstName;
    if (lastName !== undefined) profileUpdates.lastName = lastName;
    if (avatarUrl !== undefined) profileUpdates.avatarUrl = avatarUrl;
    if (bio !== undefined) profileUpdates.bio = bio;
    if (dateOfBirth !== undefined) profileUpdates.dateOfBirth = dateOfBirth;
    if (timezone !== undefined) profileUpdates.timezone = timezone;
    if (language !== undefined) profileUpdates.language = language;
    if (theme !== undefined) {
      if (!['light', 'dark', 'auto'].includes(theme)) {
        return res.status(400).json({ message: "Invalid theme. Must be 'light', 'dark', or 'auto'" });
      }
      profileUpdates.theme = theme;
    }
    if (notificationsEnabled !== undefined) profileUpdates.notificationsEnabled = notificationsEnabled;
    if (emailNotifications !== undefined) profileUpdates.emailNotifications = emailNotifications;
    if (soundEnabled !== undefined) profileUpdates.soundEnabled = soundEnabled;
    if (isPublicProfile !== undefined) profileUpdates.isPublicProfile = isPublicProfile;

    // Validate displayName if provided
    if (displayName && displayName.length < 2) {
      return res.status(400).json({ message: "Display name must be at least 2 characters" });
    }

    // Update profile
    if (Object.keys(profileUpdates).length > 0) {
      await user.profile.update(profileUpdates);
    }

    // Fetch updated user
    const updatedUser = await db.User.findByPk(req.user.userId, {
      include: [
        {
          model: db.UserProfile,
          as: 'profile'
        }
      ]
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      profile: updatedUser.profile
    });

  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ 
      message: "An error occurred while updating profile",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
