/**
 * Role-based access control. Use after `protect`:
 *   router.post("/", protect, authorize("recruiter", "admin"), handler)
 */
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: this action requires the ${roles.join("/")} role`,
      });
    }
    return next();
  };

module.exports = { authorize };
