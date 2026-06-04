import AssessmentService from './AssessmentService';
import { toast } from 'react-hot-toast';

/**
 * Service for handling game data saving and retrieval
 */
class GameService {
  /**
   * Save game results to backend
   * @param {string} childId - Child's ID
   * @param {string} gameId - Game identifier
   * @param {string} gameType - Type of game (adhd, dyslexia)
   * @param {Object} gameData - Game performance data
   * @returns {Promise<boolean>} Success status
   */
  async saveGameResults(childId, gameId, gameType, gameData) {
    try {
      // First, try to get or create a session for this child
      const sessionKey = `${gameType}_assessment_session_${childId}`;
      let sessionId = localStorage.getItem(sessionKey);

      if (!sessionId) {
        // Create a new assessment session for this child
        toast.loading('Starting assessment session...');

        try {
          const batteryConfig = await AssessmentService.configureBattery(
            childId,
            gameType,
            96, // 8 years old in months (default)
            this.getDefaultConcerns(gameType)
          );

          const sessionResponse = await AssessmentService.startBatteryAssessment(
            childId,
            batteryConfig.batteryStructure
          );

          sessionId = sessionResponse.sessionId;
          localStorage.setItem(sessionKey, sessionId);
          toast.dismiss();
        } catch (error) {
          console.error('Error creating session:', error);
          toast.dismiss();
          toast.error('Failed to create assessment session');
          return false;
        }
      }

      // Save game performance data
      toast.loading('Saving game results...');

      const performanceData = {
        ...gameData,
        completedAt: new Date().toISOString(),
        gameSpecificData: gameData.gameSpecificData || {},
      };

      await AssessmentService.completeGame(sessionId, gameId, `${gameType}-games`, performanceData);

      toast.dismiss();
      toast.success('Game results saved successfully!');

      // Also save to local storage for immediate access
      this.saveToLocalStorage(childId, gameId, gameType, gameData);

      return true;
    } catch (error) {
      console.error('Error saving game data:', error);
      toast.dismiss();
      toast.error('Failed to save game results');

      // Fallback to local storage only
      this.saveToLocalStorage(childId, gameId, gameType, gameData);
      return false;
    }
  }

  /**
   * Save game data to local storage
   * @param {string} childId - Child's ID
   * @param {string} gameId - Game identifier
   * @param {string} gameType - Type of game (adhd, dyslexia)
   * @param {Object} gameData - Game performance data
   */
  saveToLocalStorage(childId, gameId, gameType, gameData) {
    try {
      const localKey = `${gameType}_games_performance_${childId}`;
      const existingData = JSON.parse(localStorage.getItem(localKey) || '{}');

      existingData[gameId] = {
        ...existingData[gameId],
        ...gameData,
        lastPlayed: new Date().toISOString(),
        playCount: (existingData[gameId]?.playCount || 0) + 1,
        bestScore: Math.max(existingData[gameId]?.bestScore || 0, gameData.score || 0),
      };

      localStorage.setItem(localKey, JSON.stringify(existingData));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  /**
   * Get game performance data from backend and localStorage
   * @param {string} childId - Child's ID
   * @param {string} gameType - Type of game (adhd, dyslexia)
   * @returns {Promise<Object>} Game performance data
   */
  async getGamePerformance(childId, gameType) {
    try {
      // Fetch from backend
      const backendData = await AssessmentService.getChildGamePerformance(childId);

      // Load from localStorage
      const localKey = `${gameType}_games_performance_${childId}`;
      const storedPerformance = localStorage.getItem(localKey);
      const localData = storedPerformance ? JSON.parse(storedPerformance) : {};

      // Merge backend data with local data (backend data takes precedence)
      const mergedPerformance = {};

      // Add backend data
      if (backendData.data && backendData.data.gamePerformances) {
        Object.keys(backendData.data.gamePerformances).forEach(gameId => {
          const backendGame = backendData.data.gamePerformances[gameId];
          mergedPerformance[gameId] = {
            accuracy: backendGame.averageAccuracy || 0,
            bestScore: backendGame.bestScore || 0,
            playCount: backendGame.playCount || 0,
            lastPlayed: backendGame.lastPlayed,
            sessions: backendGame.sessions || [],
            averageScore: backendGame.averageScore || 0,
          };
        });
      }

      // Add local data for games not in backend
      Object.keys(localData).forEach(gameId => {
        if (!mergedPerformance[gameId]) {
          mergedPerformance[gameId] = localData[gameId];
        }
      });

      return mergedPerformance;
    } catch (error) {
      console.error('Error fetching game performance data:', error);
      // Fallback to localStorage only
      const localKey = `${gameType}_games_performance_${childId}`;
      const storedPerformance = localStorage.getItem(localKey);
      return storedPerformance ? JSON.parse(storedPerformance) : {};
    }
  }

  /**
   * Get default concerns for assessment type
   * @param {string} gameType - Type of game (adhd, dyslexia)
   * @returns {Array} Default concerns
   */
  getDefaultConcerns(gameType) {
    const concernsMap = {
      adhd: ['attention', 'focus', 'hyperactivity', 'impulse control'],
      dyslexia: ['reading', 'writing', 'phonological awareness', 'letter recognition'],
      autism: ['social communication', 'repetitive behaviors', 'sensory processing'],
    };

    return concernsMap[gameType] || ['general assessment'];
  }

  /**
   * Format time in minutes:seconds
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Save game session to backend
   * @param {Object} sessionData - Session data
   * @returns {Promise<Object>} Session response
   */
  async saveGameSession(sessionData) {
    try {
      const {
        childId,
        gameType,
        gameName,
        startTime,
        endTime,
        finalScore,
        gameStats,
        interactions,
        status,
        difficulty,
      } = sessionData;

      if (sessionData.id) {
        // Update existing session
        const updateData = {
          endTime,
          finalScore,
          gameStats,
          interactions,
          status,
        };

        await AssessmentService.updateGameSession(sessionData.id, updateData);
        return { id: sessionData.id };
      } else {
        // Create new session
        const sessionResponse = await AssessmentService.createGameSession({
          childId,
          gameType,
          gameName,
          startTime,
          difficulty,
          status: 'active',
        });

        return sessionResponse;
      }
    } catch (error) {
      console.error('Error saving game session:', error);
      throw error;
    }
  }

  /**
   * Save game interaction to backend
   * @param {Object} interactionData - Interaction data
   * @returns {Promise<Object>} Interaction response
   */
  async saveGameInteraction(interactionData) {
    try {
      const { sessionId, childId, gameType, interaction } = interactionData;

      await AssessmentService.saveGameInteraction(sessionId, {
        childId,
        gameType,
        interactionType: interaction.type,
        interactionData: interaction.data,
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error saving game interaction:', error);
      throw error;
    }
  }

  /**
   * Calculate game statistics
   * @param {Object} gamePerformances - Game performance data
   * @returns {Object} Statistics
   */
  calculateGameStats(gamePerformances) {
    const gameIds = Object.keys(gamePerformances);

    if (gameIds.length === 0) {
      return {
        totalGames: 0,
        totalSessions: 0,
        averageAccuracy: 0,
        averageScore: 0,
        lastPlayed: null,
      };
    }

    const totalSessions = gameIds.reduce(
      (sum, gameId) => sum + (gamePerformances[gameId].playCount || 0),
      0
    );
    const avgAccuracy =
      gameIds.reduce((sum, gameId) => sum + (gamePerformances[gameId].accuracy || 0), 0) /
      gameIds.length;
    const avgScore =
      gameIds.reduce((sum, gameId) => sum + (gamePerformances[gameId].averageScore || 0), 0) /
      gameIds.length;

    // Find most recent play date
    const lastPlayed = gameIds.reduce((latest, gameId) => {
      const gameLastPlayed = gamePerformances[gameId].lastPlayed;
      if (!gameLastPlayed) return latest;
      if (!latest) return gameLastPlayed;
      return new Date(gameLastPlayed) > new Date(latest) ? gameLastPlayed : latest;
    }, null);

    return {
      totalGames: gameIds.length,
      totalSessions,
      averageAccuracy: Math.round(avgAccuracy),
      averageScore: Math.round(avgScore),
      lastPlayed,
    };
  }
}

export default new GameService();
