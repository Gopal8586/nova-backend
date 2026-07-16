import express from 'express';
const router = express.Router();

router.post('/', (req, res) => {
  res.json({ message: 'Submit contact form' });
});

export default router;
