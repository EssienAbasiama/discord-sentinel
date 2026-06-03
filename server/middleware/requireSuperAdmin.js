// Gate that only allows platform super admins through. Must be mounted AFTER
// the auth middleware, which populates req.user.is_super_admin from the DB.
module.exports = (req, res, next) => {
  if (!req.user?.is_super_admin)
    return res.status(403).json({ error: "Super admin access required" });
  next();
};
