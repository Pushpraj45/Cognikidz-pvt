import api from './api';
import { useToast } from '../contexts/ToastContext';

// Helper function to map frontend field names to backend field names
const mapToBackendFields = data => {
  // Improved name handling - never send N/A or undefined
  let firstName = '';
  let lastName = '';

  if (data.firstName && data.lastName) {
    // Both fields provided
    firstName = data.firstName.trim();
    lastName = data.lastName.trim();
  } else if (data.name) {
    // Single name field provided - split it
    const fullName = data.name.trim();
    if (fullName.includes(' ')) {
      const parts = fullName.split(' ').filter(part => part.trim().length > 0);
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
    } else {
      firstName = fullName;
      lastName = ''; // Empty string, not undefined
    }
  } else if (data.firstName) {
    firstName = data.firstName.trim();
    lastName = data.lastName ? data.lastName.trim() : '';
  }

  const mappedData = {
    firstName,
    lastName: lastName || undefined, // Only send lastName if it has a value
    dateOfBirth: data.dateOfBirth || data.birthdate || data.dob,
    gender: data.gender?.toLowerCase(),
    grade: data.grade || '',
    avatar: data.avatar || data.photo,
    parental_consent: data.parental_consent ?? true,
    parent_id: data.parent_id,

    // Enhanced concerns/diagnoses handling
    concerns: processConcernsForBackend(data),
    otherConcern: data.otherConcern || data.other_concern || '',

    // Languages handling
    languages: processLanguagesForBackend(data.languages),

    // Notes and details
    diagnosis_details: data.diagnosis_details || data.diagnosisNotes || '',
    notes: data.notes || '',

    // Complex nested objects
    familyHistory: data.familyHistory || {},
    environmentalFactors: data.environmentalFactors || {},
    schoolRecords: data.schoolRecords || {},
  };

  // Remove undefined values to prevent backend issues
  Object.keys(mappedData).forEach(key => {
    if (mappedData[key] === undefined) {
      delete mappedData[key];
    }
  });

  return mappedData;
};

// Helper function to process concerns for backend
const processConcernsForBackend = frontendData => {
  let concerns = [];

  // Handle direct concerns array
  if (Array.isArray(frontendData.concerns)) {
    concerns = [...frontendData.concerns];
  }

  // Handle diagnoses field (legacy support)
  if (frontendData.diagnoses) {
    if (Array.isArray(frontendData.diagnoses)) {
      concerns = [...concerns, ...frontendData.diagnoses];
    } else if (typeof frontendData.diagnoses === 'object') {
      // Handle object format {adhd: true, autism: false, ...}
      const diagnosesArray = Object.entries(frontendData.diagnoses)
        .filter(([key, value]) => value === true)
        .map(([key]) => (key === 'asd' ? 'autism' : key)); // Map 'asd' to 'autism'
      concerns = [...concerns, ...diagnosesArray];
    }
  }

  // Validate concerns against backend enum
  const validConcerns = [
    'adhd',
    'autism',
    'dyslexia',
    'communication',
    'motor_skills',
    'social',
    'behavior',
    'other',
  ];

  // Filter and clean concerns
  concerns = concerns
    .filter(concern => concern && typeof concern === 'string')
    .map(concern => concern.toLowerCase().trim())
    .filter(concern => validConcerns.includes(concern));

  // Remove duplicates
  return [...new Set(concerns)];
};

// Helper function to process languages for backend
const processLanguagesForBackend = languages => {
  if (Array.isArray(languages)) {
    return languages.join(', ');
  } else if (typeof languages === 'string') {
    return languages;
  }
  return '';
};

// Helper function to map backend field names to frontend field names
const mapToFrontendFields = data => {
  if (!data) return data;

  // Improved name handling - avoid N/A values
  const firstName = data.firstName || '';
  const lastName = data.lastName || '';

  // Construct display name properly - treat empty string as valid for lastName
  let displayName = '';
  if (firstName.trim() && lastName.trim()) {
    displayName = `${firstName.trim()} ${lastName.trim()}`;
  } else if (firstName.trim()) {
    displayName = firstName.trim();
  } else if (lastName.trim()) {
    displayName = lastName.trim();
  } else {
    displayName = 'Child Profile'; // Fallback for completely empty names
  }

  const mappedData = {
    id: data._id || data.id,
    firstName: firstName,
    lastName: lastName,
    name: displayName,
    dateOfBirth: data.dateOfBirth,
    birthdate: data.dateOfBirth,
    dob: data.dateOfBirth,
    gender: data.gender,
    grade: data.grade,
    avatar: data.avatar,
    photo: data.avatar,

    // Enhanced concerns handling
    concerns: Array.isArray(data.concerns) ? data.concerns : [],
    diagnoses: convertConcernsToDiagnoses(data.concerns),
    otherConcern: data.otherConcern || '',

    // Languages
    languages: processLanguagesFromBackend(data.languages),

    // Notes and details
    diagnosisNotes: data.diagnosis_details || '',
    notes: data.notes || '',

    // Metadata
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    parent: data.parent,
    parental_consent: data.parental_consent,

    // Complex objects
    familyHistory: data.familyHistory || {},
    environmentalFactors: data.environmentalFactors || {},
    schoolRecords: data.schoolRecords || {},
  };

  return mappedData;
};

// Helper to convert concerns array to diagnoses object (for backward compatibility)
const convertConcernsToDiagnoses = concerns => {
  const diagnoses = {
    adhd: false,
    asd: false, // Map autism to asd for frontend compatibility
    autism: false,
    dyslexia: false,
    other: false,
  };

  if (Array.isArray(concerns)) {
    concerns.forEach(concern => {
      if (concern === 'autism') {
        diagnoses.asd = true;
        diagnoses.autism = true;
      } else if (diagnoses.hasOwnProperty(concern)) {
        diagnoses[concern] = true;
      } else if (
        concern &&
        !['communication', 'motor_skills', 'social', 'behavior'].includes(concern)
      ) {
        diagnoses.other = true;
      }
    });
  }

  return diagnoses;
};

// Helper to process languages from backend
const processLanguagesFromBackend = languages => {
  if (typeof languages === 'string' && languages.trim()) {
    return languages
      .split(',')
      .map(lang => lang.trim())
      .filter(lang => lang);
  } else if (Array.isArray(languages)) {
    return languages;
  }
  return [];
};

const ChildProfileService = {
  // Cache for preventing duplicate requests
  _requestCache: new Map(),
  _cacheTimeout: 30000, // 30 seconds

  // Get all child profiles for the current parent
  async getChildren() {
    const cacheKey = 'childProfiles';

    // Check if request is already in progress
    if (this._requestCache.has(cacheKey)) {
      console.log('Child profiles request already in progress, returning cached promise');
      return this._requestCache.get(cacheKey);
    }

    // Create the request promise
    const requestPromise = this._fetchChildProfiles();

    // Cache the promise
    this._requestCache.set(cacheKey, requestPromise);

    // Clear cache after timeout
    setTimeout(() => {
      this._requestCache.delete(cacheKey);
    }, this._cacheTimeout);

    return requestPromise;
  },

  async _fetchChildProfiles() {
    try {
      console.log('Fetching child profiles');
      const response = await api.get('/api/childprofile');
      console.log('Child profiles fetched successfully:', response.data);

      // Map backend data to frontend format
      const mappedProfiles = Array.isArray(response.data)
        ? response.data.map(profile => mapToFrontendFields(profile))
        : [];

      return mappedProfiles;
    } catch (error) {
      console.error('Error fetching child profiles:', error);

      // Don't use fallback fetch - just throw the error
      // This prevents the excessive API calls we were seeing
      throw error;
    }
  },

  // Alias for getChildren - keeping for backward compatibility
  async getChildProfiles() {
    return this.getChildren();
  },

  // Get a single child profile by ID
  async getChildProfile(id) {
    try {
      console.log(`Fetching child profile with ID: ${id}`);
      const response = await api.get(`/api/childprofile/${id}`);
      console.log('Child profile fetched successfully:', response.data);

      // Map backend data to frontend format
      const mappedProfile = mapToFrontendFields(response.data);

      return mappedProfile;
    } catch (error) {
      console.error(`Error fetching child profile with ID ${id}:`, error);
      throw error;
    }
  },

  // Create a new child profile
  async createChildProfile(profileData) {
    try {
      console.log('Creating new child profile with data:', profileData);

      // Validate required fields on frontend
      if (!profileData.firstName && !profileData.name) {
        throw new Error('Child name is required');
      }

      if (!profileData.dateOfBirth && !profileData.birthdate && !profileData.dob) {
        throw new Error('Date of birth is required');
      }

      if (!profileData.gender) {
        throw new Error('Gender is required');
      }

      // Check if we have a file to upload BEFORE mapping
      const avatarFile = profileData.avatar instanceof File ? profileData.avatar : null;

      // Map frontend field names to backend field names
      const mappedData = mapToBackendFields(profileData);
      console.log('Mapped data for backend:', mappedData);

      // Validate concerns
      if (mappedData.concerns && mappedData.concerns.length > 0) {
        const validConcerns = [
          'adhd',
          'autism',
          'dyslexia',
          'communication',
          'motor_skills',
          'social',
          'behavior',
          'other',
        ];

        const invalidConcerns = mappedData.concerns.filter(
          concern => !validConcerns.includes(concern)
        );

        if (invalidConcerns.length > 0) {
          throw new Error(
            `Invalid concerns selected: ${invalidConcerns.join(', ')}. Please select from the available options.`
          );
        }
      }

      if (avatarFile) {
        console.log('Uploading with file avatar:', avatarFile.name);
        // Create FormData for multipart/form-data request
        const formData = new FormData();

        // Add all non-file properties to formData
        Object.keys(mappedData).forEach(key => {
          if (key === 'avatar') {
            // Skip the avatar field from mappedData, we'll add the file separately
            return;
          } else if (key === 'concerns' && Array.isArray(mappedData[key])) {
            // Send concerns as array (backend now handles this properly)
            mappedData[key].forEach((concern, index) => {
              formData.append(`concerns[${index}]`, concern);
            });
          } else if (typeof mappedData[key] === 'object' && mappedData[key] !== null) {
            formData.append(key, JSON.stringify(mappedData[key]));
          } else if (mappedData[key] !== undefined) {
            formData.append(key, mappedData[key]);
          }
        });

        // Add the avatar file
        formData.append('avatar', avatarFile);

        const response = await api.post('/api/childprofile', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Clear the cache after successful creation
        this._requestCache.delete('childProfiles');
        console.log('Cache cleared after child creation');

        return mapToFrontendFields(response.data.data || response.data);
      } else {
        console.log('Creating without file avatar');
        const response = await api.post('/api/childprofile', mappedData);

        // Clear the cache after successful creation
        this._requestCache.delete('childProfiles');
        console.log('Cache cleared after child creation');

        return mapToFrontendFields(response.data.data || response.data);
      }
    } catch (error) {
      console.error('Error creating child profile:', error);

      // Enhanced error handling
      if (error.response?.data?.message) {
        const serverMessage = error.response.data.message;

        // Parse specific validation errors
        if (serverMessage.includes('enum')) {
          const match = serverMessage.match(/`([^`]+)` is not a valid enum value/);
          if (match) {
            throw new Error(
              `"${match[1]}" is not a valid option. Please select from the available choices.`
            );
          }
          throw new Error('Please select valid options from the provided choices.');
        } else if (serverMessage.includes('required')) {
          throw new Error('Please fill in all required fields.');
        } else if (serverMessage.includes('consent')) {
          throw new Error('Parental consent is required to create a child profile.');
        } else {
          throw new Error(serverMessage);
        }
      } else if (error.message) {
        throw error;
      } else {
        throw new Error(
          'Failed to create child profile. Please check your information and try again.'
        );
      }
    }
  },

  // Create a new child profile (alias for createChildProfile for API compatibility)
  async createChild(profileData) {
    try {
      // First check if parent already has 10 children
      const children = await this.getChildren();

      if (Array.isArray(children) && children.length >= 10) {
        throw new Error(
          'Maximum limit of 10 children per parent reached. Please contact support for assistance.'
        );
      }

      return this.createChildProfile(profileData);
    } catch (error) {
      if (error.message.includes('Maximum limit')) {
        throw error; // Re-throw limit error
      }
      console.error('Error creating child profile:', error);
      throw error;
    }
  },

  // Update an existing child profile
  async updateChildProfile(id, profileData) {
    try {
      console.log(`Updating child profile with ID: ${id}`);
      console.log('Update data:', profileData);

      // Check if we have a file to upload BEFORE mapping
      const avatarFile = profileData.avatar instanceof File ? profileData.avatar : null;

      // Map frontend field names to backend field names
      const mappedData = mapToBackendFields(profileData);
      console.log('Mapped data for backend:', mappedData);

      if (avatarFile) {
        console.log('Updating with file avatar:', avatarFile.name);
        // Create FormData for multipart/form-data request
        const formData = new FormData();

        // Add all non-file properties to formData
        Object.keys(mappedData).forEach(key => {
          if (key === 'avatar') {
            // Skip the avatar field from mappedData, we'll add the file separately
            return;
          } else if (key === 'concerns' && Array.isArray(mappedData[key])) {
            // Send concerns as array (backend now handles this properly)
            mappedData[key].forEach((concern, index) => {
              formData.append(`concerns[${index}]`, concern);
            });
          } else if (typeof mappedData[key] === 'object' && mappedData[key] !== null) {
            formData.append(key, JSON.stringify(mappedData[key]));
          } else if (mappedData[key] !== undefined) {
            formData.append(key, mappedData[key]);
          }
        });

        // Add the avatar file
        formData.append('avatar', avatarFile);

        const response = await api.put(`/api/childprofile/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Clear the cache after successful update
        this._requestCache.delete('childProfiles');
        console.log('Cache cleared after child update');

        return mapToFrontendFields(response.data);
      } else {
        console.log('Updating without file avatar');
        const response = await api.put(`/api/childprofile/${id}`, mappedData);

        // Clear the cache after successful update
        this._requestCache.delete('childProfiles');
        console.log('Cache cleared after child update');

        return mapToFrontendFields(response.data);
      }
    } catch (error) {
      console.error(`Error updating child profile with ID ${id}:`, error);
      throw error;
    }
  },

  // Alias for updateChildProfile - for backward compatibility
  async updateChild(id, profileData) {
    return this.updateChildProfile(id, profileData);
  },

  // Delete a child profile
  async deleteChildProfile(id) {
    try {
      console.log(`Deleting child profile with ID: ${id}`);
      const response = await api.delete(`/api/childprofile/${id}`);
      console.log('Child profile deleted successfully:', response.data);

      // Clear the cache after successful deletion
      this._requestCache.delete('childProfiles');
      console.log('Cache cleared after child deletion');

      return response.data;
    } catch (error) {
      console.error(`Error deleting child profile with ID ${id}:`, error);
      throw error;
    }
  },

  // Alias for deleteChildProfile - for backward compatibility
  async deleteChild(id) {
    return this.deleteChildProfile(id);
  },

  // Alias for getChildProfile - for backward compatibility
  async getChild(id) {
    return this.getChildProfile(id);
  },

  // Method to manually clear the cache
  clearCache() {
    console.log('Manually clearing child profiles cache');
    this._requestCache.clear();
  },
};

export default ChildProfileService;
