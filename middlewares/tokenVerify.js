import jwt from "jsonwebtoken";
const secretKey = "secret";

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "Token is required" });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded; 
    next(); 
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Token is invalid or expired", token });
  }
};

export default authenticateToken;
