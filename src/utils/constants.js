// src/utils/constants.js
export const SUBJECTS = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Engineering',
  'Business',
  'Economics',
  'Psychology',
  'History',
  'Literature',
  'Art',
  'Music',
  'Philosophy',
  'Political Science',
  'Sociology',
  'Geography',
  'Environmental Science',
  'Statistics',
  'Data Science',
  'Medicine',
  'Law',
  'Architecture',
  'Accounting',
  'Marketing'
];

export const ACADEMIC_LEVELS = [
  'High School',
  'Undergraduate Year 1',
  'Undergraduate Year 2',
  'Undergraduate Year 3',
  'Undergraduate Year 4',
  'Graduate',
  'Masters',
  'PhD',
  'Professional Course',
  'Certification'
];

export const FILE_TYPES = {
  ALLOWED: ['.pdf', '.docx', '.doc', '.txt', '.pptx', '.ppt'],
  MIME_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ],
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
};



export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  UPLOAD: '/upload',
  SEARCH: '/search',
  PROFILE: '/profile',
  FLASHCARDS: '/flashcards'
};