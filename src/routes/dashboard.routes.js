import express from 'express';
const router = express.Router();

router.get('/stats', (req, res) => {
  res.json({ message: 'Get dashboard statistics' });
});

export default router;
