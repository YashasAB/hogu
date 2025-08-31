
import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { prisma } from '../index';
import {
  UpdateProfileSchema,
  UpdateCuisinesSchema,
  UpdateInterestsSchema,
  UpdateFirstDateTypesSchema,
  UpdatePreferredNeighborhoodsSchema,
  UpdateSeekingSchema,
  AddPhotoSchema
} from '../schemas/profile';

const router = express.Router();

// Get current user profile
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        cuisines: true,
        interests: true,
        firstDateTypes: true,
        preferredNeighborhoods: true,
        seekingGenders: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate age
    const age = Math.floor((Date.now() - user.dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    res.json({
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      age,
      gender: user.gender,
      city: user.city,
      neighborhood: user.neighborhood,
      tz: user.tz,
      instagramHandle: user.instagramHandle,
      profession: user.profession,
      dreams: user.dreams,
      fiveYearGoal: user.fiveYearGoal,
      whatIWantInPartner: user.whatIWantInPartner,
      whyPartnerWouldLikeMe: user.whyPartnerWouldLikeMe,
      physicalActivity: user.physicalActivity,
      photos: user.photos.map(p => ({ id: p.id.toString(), url: p.url, sortOrder: p.sortOrder })),
      cuisines: user.cuisines.map(c => c.cuisine),
      interests: user.interests.map(i => i.tag),
      firstDateTypes: user.firstDateTypes.map(f => f.type),
      preferredNeighborhoods: user.preferredNeighborhoods.map(p => p.prefNeighborhood),
      seekingGenders: user.seekingGenders.map(s => s.seeking)
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update profile
router.put('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const data = UpdateProfileSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data
    });

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Update cuisines
router.put('/cuisines', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const data = UpdateCuisinesSchema.parse(req.body);

    // Delete existing cuisines
    await prisma.userCuisine.deleteMany({
      where: { userId: req.user!.id }
    });

    // Add new cuisines
    if (data.cuisines.length > 0) {
      await prisma.userCuisine.createMany({
        data: data.cuisines.map(cuisine => ({
          userId: req.user!.id,
          cuisine
        }))
      });
    }

    res.json({ message: 'Cuisines updated successfully' });
  } catch (error) {
    console.error('Update cuisines error:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Update interests
router.put('/interests', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const data = UpdateInterestsSchema.parse(req.body);

    await prisma.userInterest.deleteMany({
      where: { userId: req.user!.id }
    });

    if (data.tags.length > 0) {
      await prisma.userInterest.createMany({
        data: data.tags.map(tag => ({
          userId: req.user!.id,
          tag
        }))
      });
    }

    res.json({ message: 'Interests updated successfully' });
  } catch (error) {
    console.error('Update interests error:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Update first date types
router.put('/first-date-types', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const data = UpdateFirstDateTypesSchema.parse(req.body);

    await prisma.userFirstDateType.deleteMany({
      where: { userId: req.user!.id }
    });

    if (data.types.length > 0) {
      await prisma.userFirstDateType.createMany({
        data: data.types.map(type => ({
          userId: req.user!.id,
          type
        }))
      });
    }

    res.json({ message: 'First date types updated successfully' });
  } catch (error) {
    console.error('Update first date types error:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Update preferred neighborhoods
router.put('/preferred-date-neighborhoods', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const data = UpdatePreferredNeighborhoodsSchema.parse(req.body);

    await prisma.userPreferredNeighborhood.deleteMany({
      where: { userId: req.user!.id }
    });

    if (data.neighborhoods.length > 0) {
      await prisma.userPreferredNeighborhood.createMany({
        data: data.neighborhoods.map(neighborhood => ({
          userId: req.user!.id,
          prefNeighborhood: neighborhood
        }))
      });
    }

    res.json({ message: 'Preferred neighborhoods updated successfully' });
  } catch (error) {
    console.error('Update preferred neighborhoods error:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Update seeking genders
router.put('/seeking', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const data = UpdateSeekingSchema.parse(req.body);

    await prisma.userSeekingGender.deleteMany({
      where: { userId: req.user!.id }
    });

    if (data.genders.length > 0) {
      await prisma.userSeekingGender.createMany({
        data: data.genders.map(gender => ({
          userId: req.user!.id,
          seeking: gender
        }))
      });
    }

    res.json({ message: 'Seeking preferences updated successfully' });
  } catch (error) {
    console.error('Update seeking error:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Add photo
router.post('/photos', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const data = AddPhotoSchema.parse(req.body);

    const photo = await prisma.userPhoto.create({
      data: {
        userId: req.user!.id,
        url: data.url
      }
    });

    res.status(201).json({
      id: photo.id.toString(),
      url: photo.url,
      sortOrder: photo.sortOrder
    });
  } catch (error) {
    console.error('Add photo error:', error);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Delete photo
router.delete('/photos/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const photoId = BigInt(req.params.id);

    await prisma.userPhoto.deleteMany({
      where: {
        id: photoId,
        userId: req.user!.id
      }
    });

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(400).json({ error: 'Invalid photo ID' });
  }
});

export default router;
