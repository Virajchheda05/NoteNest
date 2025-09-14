// src/services/profileService.js - COMPLETE FINAL VERSION
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp,
  increment,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { deleteObject, ref } from 'firebase/storage';
import { storage } from '../firebase';

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

const safeDate = (timestamp) => {
  if (!timestamp) return new Date();
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp);
};

const formatForDisplay = (timestamp) => {
  try {
    const date = safeDate(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Unknown date';
  }
};

// =====================================================
// CORE PROFILE FUNCTIONS
// =====================================================

export const getUserProfile = async (userId) => {
  try {
    console.log('📄 Getting profile for:', userId);
    const profileRef = doc(db, 'userProfiles', userId);
    const profileDoc = await getDoc(profileRef);
    
    if (profileDoc.exists()) {
      const data = profileDoc.data();
      return {
        id: profileDoc.id,
        ...data,
        joinedDate: safeDate(data.joinedDate),
        lastActiveDate: safeDate(data.lastActiveDate),
        createdAt: safeDate(data.createdAt),
        updatedAt: safeDate(data.updatedAt)
      };
    } else {
      // Create default profile
      const defaultProfile = {
        userId: userId,
        displayName: '',
        email: '',
        bio: '',
        university: '',
        major: '',
        academicYear: '',
        isProfileComplete: false,
        joinedDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(profileRef, defaultProfile);
      return { 
        id: userId, 
        ...defaultProfile,
        joinedDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  } catch (error) {
    console.error('❌ Error getting profile:', error);
    throw error;
  }
};

export const getUserStats = async (userId) => {
  try {
    console.log('📊 Getting stats for:', userId);
    const statsRef = doc(db, 'userStats', userId);
    const statsDoc = await getDoc(statsRef);
    
    if (statsDoc.exists()) {
      const data = statsDoc.data();
      return {
        id: statsDoc.id,
        ...data,
        lastActivityDate: safeDate(data.lastActivityDate),
        createdAt: safeDate(data.createdAt),
        updatedAt: safeDate(data.updatedAt)
      };
    } else {
      // Create default stats
      const defaultStats = {
        userId: userId,
        totalReviewsGiven: 0,
        totalReviewsReceived: 0,
        contributionScore: 10,
        totalNotesUploaded: 0,
        totalNotesDownloaded: 0,
        totalNotesDeleted: 0,
        reportsSubmitted: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(statsRef, defaultStats);
      return { 
        id: userId, 
        ...defaultStats,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    throw error;
  }
};

// =====================================================
// RECALCULATE STATS FROM ACTUAL DATA
// =====================================================

export const recalculateUserStats = async (userId) => {
  try {
    console.log('🔄 Recalculating stats for:', userId);
    
    // Get actual counts from collections
    const [notesCount, reviewsGivenCount, reviewsReceivedCount, reportsCount] = await Promise.all([
      countUserNotes(userId),
      countReviewsGiven(userId),
      countReviewsReceived(userId),
      countReportsSubmitted(userId)
    ]);

    // Update stats with real numbers
    const statsRef = doc(db, 'userStats', userId);
    await updateDoc(statsRef, {
      totalNotesUploaded: notesCount,
      totalReviewsGiven: reviewsGivenCount,
      totalReviewsReceived: reviewsReceivedCount,
      reportsSubmitted: reportsCount,
      updatedAt: serverTimestamp()
    });

    console.log('✅ Stats recalculated:', {
      notes: notesCount,
      reviewsGiven: reviewsGivenCount,
      reviewsReceived: reviewsReceivedCount,
      reports: reportsCount
    });

    return {
      totalNotesUploaded: notesCount,
      totalReviewsGiven: reviewsGivenCount,
      totalReviewsReceived: reviewsReceivedCount,
      reportsSubmitted: reportsCount
    };
  } catch (error) {
    console.error('❌ Error recalculating stats:', error);
    return null;
  }
};

// Helper functions for counting
const countUserNotes = async (userId) => {
  const notesRef = collection(db, 'notes');
  const notesQuery = query(notesRef, where('uploaderId', '==', userId));
  const snapshot = await getDocs(notesQuery);
  return snapshot.size;
};

const countReviewsGiven = async (userId) => {
  const reviewsRef = collection(db, 'reviews');
  const reviewsQuery = query(reviewsRef, where('userId', '==', userId));
  const snapshot = await getDocs(reviewsQuery);
  return snapshot.size;
};

const countReviewsReceived = async (userId) => {
  // Get user's notes first
  const userNotes = await getUserNotes(userId, false);
  const noteIds = userNotes.map(note => note.id);
  
  if (noteIds.length === 0) return 0;
  
  let totalReviews = 0;
  const reviewsRef = collection(db, 'reviews');
  
  // Batch queries for noteIds (max 10 per query)
  const batchSize = 10;
  for (let i = 0; i < noteIds.length; i += batchSize) {
    const batch = noteIds.slice(i, i + batchSize);
    const batchQuery = query(reviewsRef, where('noteId', 'in', batch));
    const snapshot = await getDocs(batchQuery);
    totalReviews += snapshot.size;
  }
  
  return totalReviews;
};

const countReportsSubmitted = async (userId) => {
  const reportsRef = collection(db, 'reports');
  const reportsQuery = query(reportsRef, where('reporterId', '==', userId));
  const snapshot = await getDocs(reportsQuery);
  return snapshot.size;
};

// =====================================================
// DASHBOARD DATA - WITH RECALCULATION
// =====================================================

export const getUserDashboardData = async (userId) => {
  try {
    console.log('🏠 Getting dashboard data for:', userId);
    
    // First get basic profile and stats
    const [profile, stats] = await Promise.all([
      getUserProfile(userId),
      getUserStats(userId)
    ]);
    
    // Recalculate stats to ensure accuracy
    const recalculatedStats = await recalculateUserStats(userId);
    
    // Merge the stats
    const finalStats = {
      totalNotesUploaded: recalculatedStats?.totalNotesUploaded || 0,
      totalNotesDownloaded: stats.totalNotesDownloaded || 0,
      totalReviewsGiven: recalculatedStats?.totalReviewsGiven || 0,
      totalReviewsReceived: recalculatedStats?.totalReviewsReceived || 0,
      contributionScore: stats.contributionScore || 0,
      contributionLevel: calculateContributionLevel(stats.contributionScore || 0)
    };
    
    return {
      profile,
      stats: finalStats
    };
  } catch (error) {
    console.error('❌ Error getting dashboard data:', error);
    throw error;
  }
};

// =====================================================
// NOTES MANAGEMENT - FIXED WITH HARD DELETE
// =====================================================

export const getUserNotes = async (userId, includeDeleted = false) => {
  try {
    console.log('📚 Getting notes for:', userId);
    const notesRef = collection(db, 'notes');
    const notesQuery = query(
      notesRef,
      where('uploaderId', '==', userId)
    );

    const querySnapshot = await getDocs(notesQuery);
    const notes = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: safeDate(data.createdAt),
        updatedAt: safeDate(data.updatedAt)
      };
    });

    console.log('✅ Found notes:', notes.length);
    return notes;
  } catch (error) {
    console.error('❌ Error getting notes:', error);
    return [];
  }
};

// FIXED: Hard delete instead of soft delete
export const deleteUserNote = async (noteId, userId) => {
  try {
    console.log('🗑️ HARD DELETING note:', noteId);
    
    const batch = writeBatch(db);
    
    // Get the note first to access file URLs
    const noteRef = doc(db, 'notes', noteId);
    const noteDoc = await getDoc(noteRef);
    
    if (!noteDoc.exists()) {
      throw new Error('Note not found');
    }
    
    const noteData = noteDoc.data();
    
    // Delete files from Firebase Storage
    if (noteData.files && noteData.files.length > 0) {
      for (const file of noteData.files) {
        if (file.fileUrl) {
          try {
            // Extract file path from URL and delete
            const fileRef = ref(storage, file.fileUrl);
            await deleteObject(fileRef);
            console.log('🗑️ Deleted file:', file.fileName);
          } catch (fileError) {
            console.warn('⚠️ Could not delete file:', file.fileName, fileError.message);
          }
        }
      }
    }
    
    // Delete the note document
    batch.delete(noteRef);
    
    // Delete all reviews for this note
    const reviewsRef = collection(db, 'reviews');
    const reviewsQuery = query(reviewsRef, where('noteId', '==', noteId));
    const reviewsSnapshot = await getDocs(reviewsQuery);
    
    reviewsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete all reports for this note
    const reportsRef = collection(db, 'reports');
    const reportsQuery = query(reportsRef, where('noteId', '==', noteId));
    const reportsSnapshot = await getDocs(reportsQuery);
    
    reportsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Commit all deletions
    await batch.commit();
    
    // FIXED: Don't modify stats here, let recalculation handle it
    // This prevents negative numbers
    
    // Log activity
    await addDoc(collection(db, 'userActivityLog'), {
      userId: userId,
      activityType: 'note_deleted',
      targetId: noteId,
      description: `Permanently deleted note: ${noteData.title || 'Untitled'}`,
      createdAt: serverTimestamp()
    });

    console.log('✅ Note completely deleted from system');
    return true;
  } catch (error) {
    console.error('❌ Error deleting note:', error);
    throw error;
  }
};

export const updateUserNote = async (noteId, userId, updates) => {
  try {
    console.log('✏️ Updating note:', noteId);
    
    const noteRef = doc(db, 'notes', noteId);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    await updateDoc(noteRef, updateData);

    // Log activity
    await addDoc(collection(db, 'userActivityLog'), {
      userId: userId,
      activityType: 'note_edited',
      targetId: noteId,
      description: `Updated note: ${updates.title || 'Untitled'}`,
      createdAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('❌ Error updating note:', error);
    throw error;
  }
};

// =====================================================
// ACTIVITY LOG - FIXED DATE HANDLING
// =====================================================

export const getUserRecentActivity = async (userId, limitCount = 20) => {
  try {
    console.log('🕐 Getting activity for:', userId);
    const activityRef = collection(db, 'userActivityLog');
    const activityQuery = query(
      activityRef,
      where('userId', '==', userId),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(activityQuery);
    const activities = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: safeDate(data.createdAt),
        formattedDate: formatForDisplay(data.createdAt)
      };
    });

    // Sort by date in JavaScript since we can't use orderBy without index
    activities.sort((a, b) => b.createdAt - a.createdAt);

    console.log('✅ Found activities:', activities.length);
    return activities;
  } catch (error) {
    console.error('❌ Error getting activity:', error);
    return [];
  }
};

// =====================================================
// REVIEWS - COMPLETELY FIXED
// =====================================================

export const getUserReviewsGiven = async (userId, limitCount = 30) => {
  try {
    console.log('⭐ Getting reviews given by:', userId);
    const reviewsRef = collection(db, 'reviews');
    const reviewsQuery = query(
      reviewsRef,
      where('userId', '==', userId),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(reviewsQuery);
    
    // Get note titles for each review
    const reviews = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // Get note title
        let noteTitle = 'Unknown Note';
        try {
          const noteRef = doc(db, 'notes', data.noteId);
          const noteDoc = await getDoc(noteRef);
          if (noteDoc.exists()) {
            noteTitle = noteDoc.data().title || 'Untitled Note';
          }
        } catch (error) {
          console.warn('Could not fetch note title for review:', doc.id);
        }
        
        return {
          id: doc.id,
          ...data,
          noteTitle,
          createdAt: safeDate(data.createdAt),
          formattedDate: formatForDisplay(data.createdAt)
        };
      })
    );

    // Sort by date
    reviews.sort((a, b) => b.createdAt - a.createdAt);

    console.log('✅ Found reviews given:', reviews.length);
    return reviews;
  } catch (error) {
    console.error('❌ Error getting reviews given:', error);
    return [];
  }
};

// COMPLETELY FIXED: Reviews received logic
export const getUserReviewsReceived = async (userId) => {
  try {
    console.log('🌟 Getting reviews received for user:', userId);
    
    // First, get all notes by this user
    const userNotes = await getUserNotes(userId, false);
    
    if (userNotes.length === 0) {
      console.log('📝 User has no notes, so no reviews received');
      return [];
    }
    
    const noteIds = userNotes.map(note => note.id);
    console.log('🔍 Looking for reviews on notes:', noteIds);

    // Get reviews for those notes
    const reviewsRef = collection(db, 'reviews');
    const allReviews = [];
    
    // Firestore doesn't support 'in' queries with more than 10 items
    // So we batch the requests
    const batchSize = 10;
    for (let i = 0; i < noteIds.length; i += batchSize) {
      const batch = noteIds.slice(i, i + batchSize);
      const batchQuery = query(
        reviewsRef,
        where('noteId', 'in', batch)
      );
      
      const querySnapshot = await getDocs(batchQuery);
      console.log(`📊 Batch ${i}: Found ${querySnapshot.size} reviews`);
      
      const batchReviews = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const note = userNotes.find(n => n.id === data.noteId);
        
        return {
          id: doc.id,
          ...data,
          noteTitle: note?.title || 'Unknown Note',
          createdAt: safeDate(data.createdAt),
          formattedDate: formatForDisplay(data.createdAt)
        };
      });
      
      allReviews.push(...batchReviews);
    }

    // Sort by date
    allReviews.sort((a, b) => b.createdAt - a.createdAt);

    console.log('✅ Total reviews received:', allReviews.length);
    return allReviews;
  } catch (error) {
    console.error('❌ Error getting reviews received:', error);
    return [];
  }
};

// =====================================================
// REPORTS - FIXED WITH NOTE TITLES
// =====================================================

export const getUserReportsSubmitted = async (userId) => {
  try {
    console.log('🚩 Getting reports submitted by:', userId);
    const reportsRef = collection(db, 'reports');
    const reportsQuery = query(
      reportsRef,
      where('reporterId', '==', userId),
      limit(20)
    );

    const querySnapshot = await getDocs(reportsQuery);
    console.log('📊 Found', querySnapshot.size, 'reports');
    
    const reports = [];
    
    for (const reportDoc of querySnapshot.docs) {
      const data = reportDoc.data();
      console.log('🔍 Processing report:', reportDoc.id, 'for noteId:', data.noteId);
      
      let noteTitle = 'Note Deleted';
      
      try {
        if (data.noteId) {
          // Fix: Use getDoc with proper doc reference
          const noteDocRef = doc(db, 'notes', data.noteId);
          const noteDoc = await getDoc(noteDocRef);
          
          if (noteDoc.exists()) {
            const noteData = noteDoc.data();
            noteTitle = noteData.title || 'Untitled Note';
            console.log('✅ Found note title:', noteTitle);
          } else {
            noteTitle = 'Note No Longer Exists';
            console.log('❌ Note deleted:', data.noteId);
          }
        } else {
          noteTitle = 'Invalid Report Data';
          console.log('❌ No noteId in report');
        }
      } catch (error) {
        console.error('❌ Error fetching note:', error);
        noteTitle = 'Note Access Error';
      }
      
      reports.push({
        id: reportDoc.id,
        ...data,
        noteTitle,
        createdAt: safeDate(data.createdAt),
        reviewedAt: data.reviewedAt ? safeDate(data.reviewedAt) : null,
        formattedDate: formatForDisplay(data.createdAt),
        formattedReviewDate: data.reviewedAt ? formatForDisplay(data.reviewedAt) : null
      });
    }

    // Sort by date
    reports.sort((a, b) => b.createdAt - a.createdAt);

    console.log('✅ Final reports:', reports.map(r => ({ id: r.id, title: r.noteTitle })));
    return reports;
  } catch (error) {
    console.error('❌ Error getting reports:', error);
    return [];
  }
};

// =====================================================
// PROFILE MANAGEMENT
// =====================================================

export const updateUserProfile = async (userId, profileData) => {
  try {
    console.log('👤 Updating profile for:', userId);
    
    const profileRef = doc(db, 'userProfiles', userId);
    const updateData = {
      ...profileData,
      updatedAt: serverTimestamp(),
      isProfileComplete: !!(profileData.displayName && profileData.university)
    };

    await updateDoc(profileRef, updateData);

    // Log activity
    await addDoc(collection(db, 'userActivityLog'), {
      userId: userId,
      activityType: 'profile_updated',
      targetId: userId,
      description: 'Updated profile information',
      createdAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    throw error;
  }
};

// =====================================================
// TRACKING FUNCTIONS - FIXED TO NOT BREAK STATS
// =====================================================

export const trackNoteUpload = async (userId, noteData) => {
  try {
    console.log('📤 Tracking upload for:', userId);
    
    // FIXED: Only increment contribution score, let recalculation handle note count
    const statsRef = doc(db, 'userStats', userId);
    await updateDoc(statsRef, {
      contributionScore: increment(10),
      updatedAt: serverTimestamp()
    });

    // Log activity
    await addDoc(collection(db, 'userActivityLog'), {
      userId: userId,
      activityType: 'note_upload',
      targetId: noteData.id,
      targetTitle: noteData.title,
      description: `Uploaded note: ${noteData.title}`,
      createdAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('❌ Error tracking upload:', error);
    return false;
  }
};

export const trackNoteDownload = async (userId, noteData) => {
  try {
    console.log('⬇️ Tracking download for:', userId);
    
    // Update stats
    const statsRef = doc(db, 'userStats', userId);
    await updateDoc(statsRef, {
      totalNotesDownloaded: increment(1),
      updatedAt: serverTimestamp()
    });

    // Log activity
    await addDoc(collection(db, 'userActivityLog'), {
      userId: userId,
      activityType: 'note_download',
      targetId: noteData.id,
      targetTitle: noteData.title,
      description: `Downloaded note: ${noteData.title}`,
      createdAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('❌ Error tracking download:', error);
    return false;
  }
};

// =====================================================
// FIX STATS FUNCTION - TO REPAIR NEGATIVE NUMBERS
// =====================================================

export const fixUserStats = async (userId) => {
  try {
    console.log('🔧 Fixing stats for user:', userId);
    
    // Get actual counts
    const recalculatedStats = await recalculateUserStats(userId);
    
    if (recalculatedStats) {
      console.log('✅ Stats fixed successfully');
      return recalculatedStats;
    } else {
      throw new Error('Failed to recalculate stats');
    }
  } catch (error) {
    console.error('❌ Error fixing stats:', error);
    throw error;
  }
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export const calculateContributionLevel = (points) => {
  if (points >= 1000) return 'Expert Contributor';
  if (points >= 500) return 'Active Contributor';
  if (points >= 200) return 'Regular Contributor';
  if (points >= 50) return 'Contributing Member';
  if (points >= 10) return 'New Contributor';
  return 'Newcomer';
};

export const getProfileCompletionPercentage = (profile) => {
  if (!profile) return 0;
  
  const fields = ['displayName', 'university', 'major', 'bio'];
  const completedFields = fields.filter(field => 
    profile[field] && profile[field].trim()
  );
  return Math.round((completedFields.length / fields.length) * 100);
};

// =====================================================
// USER INITIALIZATION - REPLACES PROFILEDATAINIT
// =====================================================

export const initializeNewUser = async (userId, email) => {
  try {
    console.log('🔄 Initializing new user:', userId);
    
    // Check if already initialized
    const profileRef = doc(db, 'userProfiles', userId);
    const profileDoc = await getDoc(profileRef);
    
    if (profileDoc.exists()) {
      console.log('✅ User already initialized');
      return true;
    }
    
    // Create profile
    const profileData = {
      userId: userId,
      displayName: email.split('@')[0] || 'Student',
      email: email,
      bio: 'Welcome to NoteNest! Update your profile to tell others about yourself.',
      university: '',
      major: '',
      academicYear: '',
      isProfileComplete: false,
      joinedDate: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(profileRef, profileData);
    
    // Create stats
    const statsRef = doc(db, 'userStats', userId);
    const statsData = {
      userId: userId,
      totalReviewsGiven: 0,
      totalReviewsReceived: 0,
      contributionScore: 10,
      totalNotesUploaded: 0,
      totalNotesDownloaded: 0,
      totalNotesDeleted: 0,
      reportsSubmitted: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(statsRef, statsData);
    
    // Create welcome activity
    await addDoc(collection(db, 'userActivityLog'), {
      userId: userId,
      activityType: 'profile_created',
      targetId: userId,
      description: 'Welcome to NoteNest! Your account has been created.',
      createdAt: serverTimestamp()
    });
    
    console.log('✅ User initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing user:', error);
    return false;
  }
};

// =====================================================
// DEFAULT EXPORT FOR BACKWARD COMPATIBILITY
// =====================================================

const ProfileService = {
  getUserProfile,
  getUserStats,
  getUserDashboardData,
  getUserNotes,
  getUserRecentActivity,
  getUserReviewsGiven,
  getUserReviewsReceived,
  getUserReportsSubmitted,
  updateUserProfile,
  updateUserNote,
  deleteUserNote,
  trackNoteUpload,
  trackNoteDownload,
  calculateContributionLevel,
  getProfileCompletionPercentage,
  recalculateUserStats,
  fixUserStats,
  initializeNewUser
};

export default ProfileService;