const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../domains/auth/model");
const logger = require("../utils/logger");

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select("-password");
    done(null, user);
  } catch (error) {
    logger.error("Error deserializing user:", error);
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        logger.info(
          `Google OAuth attempt for email: ${profile.emails[0].value}`
        );

        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User exists with Google ID, update last login
          user.lastLogin = Date.now();
          await user.save();
          logger.info(
            `Google OAuth successful for existing user: ${user.email}`
          );
          return done(null, user);
        }

        // Check if user exists with same email but different auth provider
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.authProvider = "google";
          user.isVerified = true;
          user.lastLogin = Date.now();

          // Update profile picture if not set
          if (
            !user.profilePicture &&
            profile.photos &&
            profile.photos.length > 0
          ) {
            user.profilePicture = profile.photos[0].value;
          }

          await user.save();
          logger.info(`Google account linked to existing user: ${user.email}`);
          return done(null, user);
        }

        // Create new user
        const newUser = await User.create({
          googleId: profile.id,
          authProvider: "google",
          email: profile.emails[0].value,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          profilePicture:
            profile.photos && profile.photos.length > 0
              ? profile.photos[0].value
              : "",
          isVerified: true,
          lastLogin: Date.now(),
        });

        logger.info(`New Google user created: ${newUser.email}`);
        return done(null, newUser);
      } catch (error) {
        logger.error("Google OAuth error:", error);
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
