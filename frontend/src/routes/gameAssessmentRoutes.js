import React, { useEffect } from 'react';
import { Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import DyslexiaGames from '../components/assessment/games/dyslexia/DyslexiaGames';
import LetterSoundMatching from '../components/assessment/games/dyslexia/LetterSoundMatching';
import WordSequenceBuilder from '../components/assessment/games/dyslexia/WordSequenceBuilder';
import SpotCorrectWord from '../components/assessment/games/dyslexia/SpotCorrectWord';
import MemoryMatch from '../components/assessment/games/dyslexia/MemoryMatch';
import RapidLetterNaming from '../components/assessment/games/dyslexia/RapidLetterNaming';
import MirrorLetterGame from '../components/assessment/games/dyslexia/MirrorLetterGame';
import WordCompletion from '../components/assessment/games/dyslexia/WordCompletion';
import VisualTrackingMaze from '../components/assessment/games/dyslexia/VisualTrackingMaze';
import RhymingPairs from '../components/assessment/games/dyslexia/RhymingPairs';
import SyllableClapper from '../components/assessment/games/dyslexia/SyllableClapper';
import ADHDGames from '../components/assessment/games/adhd/ADHDGames';
import FocusFinder from '../components/assessment/games/adhd/FocusFinder';
import ImpulseFreeze from '../components/assessment/games/adhd/ImpulseFreeze';
import MemoryTrail from '../components/assessment/games/adhd/MemoryTrail';
import HyperHop from '../components/assessment/games/adhd/HyperHop';
import TaskTwister from '../components/assessment/games/adhd/TaskTwister';
import SoundShift from '../components/assessment/games/adhd/SoundShift';
import TimeTurtle from '../components/assessment/games/adhd/TimeTurtle';
import ProgressiveAssessmentSuite from '../components/assessment/games/ProgressiveAssessmentSuite';
import FullScreenGameWrapper from '../components/assessment/games/FullScreenGameWrapper';
import RequireAssessmentAccess from '../components/auth/RequireAssessmentAccess';
import RequireUsage from '../components/auth/RequireUsage';

// Invalid game redirect component
const InvalidGameRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.warn('Invalid game route detected:', location.pathname);

    // Check if the path contains avatar IDs
    const avatarIds = ['girl1', 'girl2', 'boy1', 'boy2', 'girl3', 'boy3'];
    const pathSegments = location.pathname.split('/');
    const hasAvatarId = pathSegments.some(segment => avatarIds.includes(segment));

    if (hasAvatarId) {
      console.warn('Avatar ID detected in game route, redirecting to dyslexia games');
      toast.error('Invalid game selection. Redirecting to games menu.');
    } else {
      console.warn('Unknown route detected, redirecting to dyslexia games');
      toast.error('Invalid game route. Redirecting to games menu.');
    }

    // Redirect to dyslexia games by default
    navigate('/assessment/games/dyslexia', { replace: true });
  }, [navigate, location]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to games menu...</p>
      </div>
    </div>
  );
};

const gameAssessmentRoutes = [
  <Route
    key="dyslexia-games"
    path="dyslexia"
    element={
      <RequireAssessmentAccess assessmentType="dyslexia-game">
        <DyslexiaGames />
      </RequireAssessmentAccess>
    }
  />,
  <Route
    key="letter-sound-matching"
    path="dyslexia/letter-sound-matching"
    element={
      <RequireAssessmentAccess assessmentType="dyslexia-game">
        <FullScreenGameWrapper gameName="Letter-Sound Matching">
          <LetterSoundMatching />
        </FullScreenGameWrapper>
      </RequireAssessmentAccess>
    }
  />,
  <Route
    key="word-sequence-builder"
    path="dyslexia/word-sequence-builder"
    element={
      <RequireAssessmentAccess assessmentType="dyslexia-game">
        <FullScreenGameWrapper gameName="Word Sequence Builder">
          <WordSequenceBuilder />
        </FullScreenGameWrapper>
      </RequireAssessmentAccess>
    }
  />,
  <Route
    key="spot-correct-word"
    path="dyslexia/spot-correct-word"
    element={
      <RequireAssessmentAccess assessmentType="dyslexia-game">
        <FullScreenGameWrapper gameName="Spot the Correct Word">
          <SpotCorrectWord />
        </FullScreenGameWrapper>
      </RequireAssessmentAccess>
    }
  />,
  <Route
    key="memory-match"
    path="dyslexia/memory-match"
    element={
      <RequireAssessmentAccess assessmentType="dyslexia-game">
        <FullScreenGameWrapper gameName="Memory Match">
          <MemoryMatch />
        </FullScreenGameWrapper>
      </RequireAssessmentAccess>
    }
  />,
  <Route
    key="rapid-letter-naming"
    path="dyslexia/rapid-letter-naming"
    element={
      <RequireAssessmentAccess assessmentType="dyslexia-game">
        <FullScreenGameWrapper gameName="Rapid Letter Naming">
          <RapidLetterNaming />
        </FullScreenGameWrapper>
      </RequireAssessmentAccess>
    }
  />,
  <Route
    key="mirror-letter-game"
    path="dyslexia/mirror-letter-game"
    element={
      <RequireAssessmentAccess assessmentType="dyslexia-game">
        <FullScreenGameWrapper gameName="Mirror Letter Game">
          <MirrorLetterGame />
        </FullScreenGameWrapper>
      </RequireAssessmentAccess>
    }
  />,
  <Route
    key="word-completion"
    path="dyslexia/word-completion"
    element={
      <RequireAssessmentAccess assessmentType="dyslexia-game">
        <FullScreenGameWrapper gameName="Word Completion">
          <WordCompletion />
        </FullScreenGameWrapper>
      </RequireAssessmentAccess>
    }
  />,
  <Route
    key="visual-tracking-maze"
    path="dyslexia/visual-tracking-maze"
    element={
      <RequireAssessmentAccess assessmentType="dyslexia-game">
        <FullScreenGameWrapper gameName="Visual Tracking Maze">
          <VisualTrackingMaze />
        </FullScreenGameWrapper>
      </RequireAssessmentAccess>
    }
  />,
  <Route
    key="rhyming-pairs"
    path="dyslexia/rhyming-pairs"
    element={
      <RequireAssessmentAccess assessmentType="dyslexia-game">
        <FullScreenGameWrapper gameName="Rhyming Pairs">
          <RhymingPairs />
        </FullScreenGameWrapper>
      </RequireAssessmentAccess>
    }
  />,
  <Route
    key="syllable-clapper"
    path="dyslexia/syllable-clapper"
    element={
      <RequireAssessmentAccess assessmentType="dyslexia-game">
        <FullScreenGameWrapper gameName="Syllable Clapper">
          <SyllableClapper />
        </FullScreenGameWrapper>
      </RequireAssessmentAccess>
    }
  />,
  <Route
    key="dyslexia-progressive-suite"
    path="dyslexia/progressive-suite"
    element={
      <RequireUsage
        resourceType="suite"
        resourceKey="dyslexia/progressive-suite"
        assessmentType="dyslexia-game"
      >
        <ProgressiveAssessmentSuite />
      </RequireUsage>
    }
  />,

  <Route
    key="adhd-games"
    path="adhd"
    element={
      <RequireAssessmentAccess assessmentType="adhd-game">
        <ADHDGames />
      </RequireAssessmentAccess>
    }
  />,
  <Route
    key="adhd-focus-finder"
    path="adhd/focus-finder"
    element={
      <RequireAssessmentAccess assessmentType="adhd-game">
        <FullScreenGameWrapper gameName="Focus Finder">
          <FocusFinder />
        </FullScreenGameWrapper>
      </RequireAssessmentAccess>
    }
  />,
  <Route
    key="adhd-impulse-freeze"
    path="adhd/impulse-freeze"
    element={
      <RequireAssessmentAccess assessmentType="adhd-game">
        <FullScreenGameWrapper gameName="Impulse Freeze">
          <ImpulseFreeze />
        </FullScreenGameWrapper>
      </RequireAssessmentAccess>
    }
  />,
  <Route
    key="adhd-memory-trail"
    path="adhd/memory-trail"
    element={
      <RequireAssessmentAccess assessmentType="adhd-game">
        <FullScreenGameWrapper gameName="Memory Trail">
          <MemoryTrail />
        </FullScreenGameWrapper>
      </RequireAssessmentAccess>
    }
  />,
  <Route
    key="adhd-hyper-hop"
    path="adhd/hyper-hop"
    element={
      <RequireAssessmentAccess assessmentType="adhd-game">
        <FullScreenGameWrapper gameName="Hyper Hop">
          <HyperHop />
        </FullScreenGameWrapper>
      </RequireAssessmentAccess>
    }
  />,
  <Route
    key="adhd-task-twister-enhanced"
    path="adhd/task-twister-enhanced"
    element={
      <RequireAssessmentAccess assessmentType="adhd-game">
        <FullScreenGameWrapper gameName="Task Twister">
          <TaskTwister />
        </FullScreenGameWrapper>
      </RequireAssessmentAccess>
    }
  />,
  <Route
    key="adhd-sound-shift"
    path="adhd/sound-shift"
    element={
      <RequireAssessmentAccess assessmentType="adhd-game">
        <FullScreenGameWrapper gameName="Sound Shift">
          <SoundShift />
        </FullScreenGameWrapper>
      </RequireAssessmentAccess>
    }
  />,
  <Route
    key="adhd-time-turtle"
    path="adhd/time-turtle"
    element={
      <RequireAssessmentAccess assessmentType="adhd-game">
        <FullScreenGameWrapper gameName="Time Turtle">
          <TimeTurtle />
        </FullScreenGameWrapper>
      </RequireAssessmentAccess>
    }
  />,
  <Route
    key="adhd-progressive-suite"
    path="adhd/progressive-suite"
    element={
      <RequireUsage
        resourceType="suite"
        resourceKey="adhd/progressive-suite"
        assessmentType="adhd-game"
      >
        <ProgressiveAssessmentSuite />
      </RequireUsage>
    }
  />,

  <Route key="default" path="" element={<Navigate to="dyslexia" replace />} />,
  // Catch-all route should be last to avoid interfering with specific routes
  <Route key="invalid-game" path="*" element={<InvalidGameRedirect />} />,
];

export default gameAssessmentRoutes;
