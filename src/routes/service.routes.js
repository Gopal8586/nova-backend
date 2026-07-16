import express from 'express';
import { getServices, getServiceById, upsertService, deleteService } from '../data/service.store.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import { addActivityLog } from '../data/store.js';

const router = express.Router();

// GET all services (public)
router.get('/', async (req, res) => {
  try {
    const services = await getServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching services' });
  }
});

// GET single service (public)
router.get('/:id', async (req, res) => {
  try {
    const service = await getServiceById(req.params.id);
    if (service) {
      res.json(service);
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching service' });
  }
});

// POST create a new service (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  const serviceData = req.body;
  
  if (!serviceData.id || !serviceData.title) {
    return res.status(400).json({ message: 'Service ID and Title are required' });
  }
  
  try {
    const existingService = await getServiceById(serviceData.id);
    if (existingService) {
      return res.status(400).json({ message: 'Service with this ID already exists' });
    }

    const success = await upsertService(serviceData.id, serviceData);
    if (success) {
      // Log the action for Super Admin
      if (req.user.username !== 'gopal_admin') {
        addActivityLog(req.user.id, req.user.name, 'CREATE_SERVICE', `Created new service: ${serviceData.title}`);
      }
      res.status(201).json({ message: 'Service created successfully', service: serviceData });
    } else {
      res.status(500).json({ message: 'Failed to save service' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update a service (Admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  const serviceId = req.params.id;
  const serviceData = req.body;
  
  try {
    const existingService = await getServiceById(serviceId);
    if (!existingService) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Ensure ID matches
    serviceData.id = serviceId;
    
    const success = await upsertService(serviceId, serviceData);
    if (success) {
      // Log the action for Super Admin
      if (req.user.username !== 'gopal_admin') {
        addActivityLog(req.user.id, req.user.name, 'UPDATE_SERVICE', `Updated service: ${serviceData.title}`);
      }
      res.json({ message: 'Service updated successfully', service: serviceData });
    } else {
      res.status(500).json({ message: 'Failed to update service' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE a service (Admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  const serviceId = req.params.id;
  
  try {
    const existingService = await getServiceById(serviceId);
    if (!existingService) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    const title = existingService.title;
    const success = await deleteService(serviceId);
    
    if (success) {
      // Log the action for Super Admin
      if (req.user.username !== 'gopal_admin') {
        addActivityLog(req.user.id, req.user.name, 'DELETE_SERVICE', `Deleted service: ${title}`);
      }
      res.json({ message: 'Service deleted successfully' });
    } else {
      res.status(500).json({ message: 'Failed to delete service' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
